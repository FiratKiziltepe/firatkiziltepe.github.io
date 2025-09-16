import { GoogleGenAI, Modality } from "@google/genai";
import { StoryConfig, StoryData, Scene, Gender, CharacterDescription, TtsProvider } from '../types';
import { GEMINI_TEXT_MODEL, GEMINI_IMAGE_MODEL, SUPPORTED_LANGUAGES } from '../constants';

const getAiClient = (apiKey: string) => {
    if (!apiKey) {
        throw new Error("API Key is not configured. AI features will not work.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateDescriptionForImage = async (base64Data: string, mimeType: string, apiKey: string): Promise<string> => {
    const ai = getAiClient(apiKey);
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
        const result = await ai.models.generateContent({
            model: GEMINI_TEXT_MODEL,
            contents: [{ parts: [imagePart, textPart] }]
        });
        return result.text;
    } catch (error) {
        console.error("Error generating description from image:", error);
        throw new Error(`Failed to generate character description: ${error instanceof Error ? error.message : String(error)}`);
    }
};


const generateStoryText = async (config: StoryConfig, apiKey: string): Promise<Omit<StoryData, 'scenes' | 'language' | 'ttsProvider'> & { scenes: Array<Omit<Scene, 'imageUrl'>> }> => {
  const ai = getAiClient(apiKey);
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

  try {
    const result = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });
    
    const rawJsonText = result.text;
    
    // Markdown formatındaki JSON wrapper'larını temizle
    const cleanJsonText = rawJsonText
        .replace(/^```json\s*/, '') // Başlangıçtaki ```json'ı kaldır
        .replace(/\s*```$/, '')     // Sondaki ```'ı kaldır
        .trim();
    
    let parsedStory;
    try {
        parsedStory = JSON.parse(cleanJsonText);
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

const generateImage = async (prompt: string, apiKey: string): Promise<string> => {
  const ai = getAiClient(apiKey);
  try {
    const enhancedPrompt = `${prompt}. Child-friendly illustration, vibrant colors, whimsical and magical art style, suitable for children's book.`;
    
    const result = await ai.models.generateContent({
      model: GEMINI_IMAGE_MODEL,
      contents: enhancedPrompt,
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    // Yanıttan görsel verisini çıkar
    for (const part of result.candidates[0].content.parts) {
      if (part.inlineData) {
        // Base64 verisini data URL formatına çevir
        const mimeType = part.inlineData.mimeType || 'image/png';
        const base64Data = part.inlineData.data;
        return `data:${mimeType};base64,${base64Data}`;
      }
    }
    
    console.warn("No image data found in response");
    return "IMAGE_GENERATION_FAILED";
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("Invalid API Key. Please check your configuration for image generation.");
    }
    console.warn(`Failed to generate image. Details: ${error instanceof Error ? error.message : String(error)}`);
    return "IMAGE_GENERATION_FAILED"; 
  }
};

export const generateStoryWithImages = async (config: StoryConfig, apiKey: string): Promise<StoryData> => {
  const storyBase = await generateStoryText(config, apiKey);
  
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
      const imageUrl = await generateImage(imagePromptForScene, apiKey);
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