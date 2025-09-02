import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { StoryConfig, StoryData, Scene, Gender, CharacterDescription, TtsProvider } from '../types';
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL, SUPPORTED_LANGUAGES } from '../constants';

// Ensure process.env.API_KEY is defined. In a real app, this would be handled by the build/environment setup.
// For this environment, we assume it's globally available if set.
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.warn("API_KEY environment variable not found. AI features will not work.");
}
const ai = new GoogleGenAI({ apiKey: apiKey || "MISSING_API_KEY" }); // Provide a fallback to avoid crashing GoogleGenAI constructor

export const generateDescriptionForImage = async (base64Data: string, mimeType: string): Promise<string> => {
    if (!apiKey) throw new Error("API Key is not configured. Image analysis unavailable.");

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };

    const textPart = {
        text: "You are an expert character designer. Describe the person in this image in a very detailed, descriptive paragraph. Focus on visual attributes that an AI image generation model can use to recreate them, such as face shape, hair style and color, eye color, specific clothing, and overall style. The description should be in English, concise but comprehensive, and ready to be used in an illustration prompt.",
    };

    try {
        const response = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: { parts: [imagePart, textPart] },
        });
        return response.text;
    } catch (error) {
        console.error("Error generating description from image:", error);
        throw new Error(`Failed to generate character description: ${error instanceof Error ? error.message : String(error)}`);
    }
};


const generateStoryText = async (config: StoryConfig): Promise<Omit<StoryData, 'scenes' | 'language' | 'ttsProvider'> & { scenes: Array<Omit<Scene, 'imageUrl'>> }> => {
  if (!apiKey) throw new Error("API Key is not configured. Story generation unavailable.");
  
  const genderInstruction = config.gender !== Gender.NONE ? `The story may subtly reflect characteristics or scenarios sometimes associated with a ${config.gender.toLowerCase()} protagonist, but keep it universally appealing.` : '';
  const selectedLanguageName = SUPPORTED_LANGUAGES.find(lang => lang.code === config.language)?.name || 'English';

  const hasPersonalizedChars = config.personalizedCharacters && config.personalizedCharacters.some(c => c.description && c.name);
  
  let characterInstruction = '';
  if (hasPersonalizedChars) {
      const descriptions = config.personalizedCharacters
          .filter(c => c.description && c.name)
          .map(c => `${c.name} is described as: ${c.description}`)
          .join(' ');
      characterInstruction = `The main characters are visually defined and must be incorporated into the story. Their descriptions are: ${descriptions}. Refer to them by name in the story and in the illustration prompts. Do NOT create a 'character_descriptions' field in the JSON output, as this information is pre-defined.`;
  } else {
      characterInstruction = config.characterNames
          ? `First, create a 'character_descriptions' array. For each character name in '${config.characterNames}', provide an object with 'name' and 'description' fields. The description should be a detailed visual profile to ensure image consistency (e.g., hair color, clothing, species). These descriptions must be in English. If no character names are provided, this array can be omitted or empty.`
          : `The 'character_descriptions' array can be omitted or empty as no specific character names were provided.`;
  }

  const prompt = `
    You are a creative and engaging storyteller for children. Your task is to generate a structured story object in JSON.
    
    **Instructions:**
    1.  **Character Handling:** ${characterInstruction}
    2.  **Story Title:** Create a 'title' for the story. The title must be in ${selectedLanguageName}.
    3.  **Story Scenes:** Create an array of 'scenes'. The number of scenes should match the desired length: ${config.length} (Short: 3-4, Medium: 5-7, Long: 8-10).
    
    **For each scene, provide:**
    a. "scene_text": The narrative for that scene. It should be age-appropriate for a ${config.age}-year-old, engaging, and written in ${selectedLanguageName}. Use newline characters '\\n' for paragraphs.
    b. "illustration_prompt": A concise, descriptive prompt (in English, max 30 words) for an image generation AI. It should focus on the key visual elements, characters (by name), actions, and mood of the scene. Make sure to include the names of any personalized characters present in the scene.

    **Story Details:**
    - Theme: ${config.theme}
    - Child's Age: ${config.age} years old
    - ${genderInstruction}
    - Story Preference: ${config.preference}
    - Elements to Include: ${config.elementsToInclude || 'None specified'}
    - Unpersonalized Character Name(s): ${config.characterNames || 'None specified'}
    
    Ensure the story is coherent, with a clear beginning, middle, and a positive ending. The entire output must be a single JSON object matching the provided schema.
  `;
  
  const storySchema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: `A catchy and relevant title for the story, in ${selectedLanguageName}.`
      },
      character_descriptions: {
          type: Type.ARRAY,
          description: "An array of objects, each containing a character's name and their detailed visual description. This should only be populated if personalized characters are NOT provided.",
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "The character's name." },
              description: { type: Type.STRING, description: "The character's detailed visual description in English." }
            },
            required: ["name", "description"]
          }
      },
      scenes: {
        type: Type.ARRAY,
        description: "An array of scene objects that make up the story.",
        items: {
          type: Type.OBJECT,
          properties: {
            scene_text: {
              type: Type.STRING,
              description: `The narrative for the scene in ${selectedLanguageName}, age-appropriate and engaging. Can contain \\n for paragraphs.`
            },
            illustration_prompt: {
              type: Type.STRING,
              description: "A descriptive prompt (max 30 words, in English) for an image generation AI, focusing on key visual elements of the scene."
            }
          },
          required: ["scene_text", "illustration_prompt"]
        }
      }
    },
    required: ["title", "scenes"]
  };

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: storySchema,
        temperature: 0.7, 
      },
    });
    
    const rawJsonText = response.text;
    let parsedStory;
    try {
        parsedStory = JSON.parse(rawJsonText);
    } catch(e) {
        console.error("Failed to parse JSON response:", e, "Original string:", rawJsonText);
        throw new Error("The AI returned an unexpected response format. Please try again.");
    }

    if (!parsedStory.title || !Array.isArray(parsedStory.scenes) || parsedStory.scenes.length === 0) {
      throw new Error("AI response did not contain a valid story structure (title and scenes).");
    }
    parsedStory.scenes.forEach((scene: any, index: number) => {
      if (typeof scene.scene_text !== 'string' || typeof scene.illustration_prompt !== 'string') {
        throw new Error(`Scene ${index + 1} is missing 'scene_text' or 'illustration_prompt'.`);
      }
    });
    return parsedStory as Omit<StoryData, 'scenes' | 'language' | 'ttsProvider'> & { scenes: Array<Omit<Scene, 'imageUrl'>> };

  } catch (error) {
    console.error("Error generating story text:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error ("Invalid API Key. Please check your configuration.");
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("404") && errorMessage.includes("NOT_FOUND")) {
      throw new Error(`The AI model '${GEMINI_TEXT_MODEL}' was not found. This may be a temporary issue or an incorrect model name in the configuration.`);
    }
    throw new Error(`Failed to generate story text: ${errorMessage}`);
  }
};

const generateImage = async (prompt: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is not configured. Image generation unavailable.");
  try {
    // Adding more detail to the image prompt for style.
    const enhancedPrompt = `${prompt}. Child-friendly illustration, vibrant colors, whimsical and magical art style.`;
    const response = await ai.models.generateImages({
      model: GEMINI_IMAGE_MODEL,
      prompt: enhancedPrompt,
      config: { 
        numberOfImages: 1, 
        outputMimeType: 'image/jpeg', 
        aspectRatio: '16:9' 
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("No image generated or image data is missing.");
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error ("Invalid API Key. Please check your configuration for image generation.");
    }
    console.warn(`Failed to generate image. Details: ${error instanceof Error ? error.message : String(error)}`);
    return "IMAGE_GENERATION_FAILED"; 
  }
};

export const generateStoryWithImages = async (config: StoryConfig): Promise<StoryData> => {
  const storyBase = await generateStoryText(config);
  
  let characterContext = '';
  const personalizedChars = config.personalizedCharacters?.filter(c => c.description && c.name);
  const generatedChars = storyBase.character_descriptions;

  if (personalizedChars && personalizedChars.length > 0) {
      const descriptions = personalizedChars
          .map(c => `${c.name} looks like this: ${c.description}`)
          .join('. ');
      characterContext = `Crucially, use these character descriptions for visual consistency: ${descriptions}. `;
  } else if (generatedChars && generatedChars.length > 0) {
      const descriptions = generatedChars
          .map(c => `${c.name} is ${c.description}`)
          .join('. ');
      characterContext = `Use these character descriptions for consistency: ${descriptions}. `;
  }


  const scenesWithImages: Scene[] = [];

  for (const sceneBase of storyBase.scenes) {
    try {
      const imagePromptForScene = `${characterContext}${sceneBase.illustration_prompt}`;
      const imageUrl = await generateImage(imagePromptForScene);
      if (imageUrl === "IMAGE_GENERATION_FAILED") {
        scenesWithImages.push({ ...sceneBase, imageUrl: `https://picsum.photos/seed/${encodeURIComponent(sceneBase.illustration_prompt.slice(0,20))}/800/450?grayscale&blur=2` }); // More distinct placeholder
      } else {
        scenesWithImages.push({ ...sceneBase, imageUrl });
      }
    } catch (error) {
      console.warn(`Failed to generate image for scene: "${sceneBase.illustration_prompt}". Using placeholder. Error: ${error}`);
      scenesWithImages.push({ ...sceneBase, imageUrl: `https://picsum.photos/seed/${encodeURIComponent(sceneBase.illustration_prompt.slice(0,20))}/800/450?grayscale&blur=2` });
    }
  }
  
  return {
    title: storyBase.title,
    scenes: scenesWithImages,
    language: config.language,
    ttsProvider: config.ttsProvider,
    character_descriptions: storyBase.character_descriptions,
  };
};