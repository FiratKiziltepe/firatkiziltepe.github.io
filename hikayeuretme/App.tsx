
import React, { useState, useCallback } from 'react';
import { StoryConfig, StoryData, Scene, TtsProvider } from './types';
import { StorySetupForm } from './components/StorySetupForm';
import { StoryDisplay } from './components/StoryDisplay';
import { LoadingSpinner } from './components/LoadingSpinner';
import { generateStoryWithImages, generateDescriptionForImage } from './services/geminiService';
import { generateSpeech } from './services/elevenLabsService';
import { generateElevenLabsAudiobookHtml, generateBrowserTtsAudiobookHtml } from './services/exportService';
import { INITIAL_STORY_CONFIG } from './constants';

const App: React.FC = () => {
  const [storyConfig, setStoryConfig] = useState<StoryConfig>(INITIAL_STORY_CONFIG);
  const [storyData, setStoryData] = useState<StoryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);

  const handleConfigChange = useCallback((newConfig: Partial<StoryConfig>) => {
    setStoryConfig(prevConfig => ({ ...prevConfig, ...newConfig }));
  }, []);

  const handlePersonalizedCharacterUpdate = useCallback(async (characterId: string, file: File) => {
     const imagePreviewUrl = URL.createObjectURL(file);
     setStoryConfig(prevConfig => ({
        ...prevConfig,
        personalizedCharacters: prevConfig.personalizedCharacters.map(pc =>
            pc.id === characterId ? { ...pc, isProcessing: true, imagePreviewUrl } : pc
        ),
    }));

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type;
        const description = await generateDescriptionForImage(base64String, mimeType);
        setStoryConfig(prevConfig => ({
            ...prevConfig,
            personalizedCharacters: prevConfig.personalizedCharacters.map(pc =>
                pc.id === characterId
                ? { ...pc, base64Data: base64String, mimeType, description, isProcessing: false }
                : pc
            ),
        }));
      };
      reader.onerror = (error) => {
        console.error("File reading error:", error);
        throw new Error("Failed to read file.");
      }
    } catch (err) {
      console.error("Error processing character image:", err);
       setStoryConfig(prevConfig => ({
            ...prevConfig,
            personalizedCharacters: prevConfig.personalizedCharacters.map(pc =>
                pc.id === characterId ? { ...pc, isProcessing: false, description: "Error: Could not analyze image." } : pc
            ),
        }));
    }
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setStoryData(null);
    setCurrentSceneIndex(0);

    try {
      const generatedStory = await generateStoryWithImages(storyConfig);
      setStoryData(generatedStory);
    } catch (err) {
      console.error("Error generating story:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred. Please try again.";
      if (errorMessage.includes("API key not valid")) {
          setError("Invalid Gemini API Key. Please ensure it is configured correctly.");
      } else {
          setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextScene = () => {
    if (storyData && currentSceneIndex < storyData.scenes.length - 1) {
      setCurrentSceneIndex(prevIndex => prevIndex + 1);
    }
  };

  const handlePrevScene = () => {
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prevIndex => prevIndex - 1);
    }
  };

  const handleRestart = () => {
    setStoryData(null);
    setStoryConfig(INITIAL_STORY_CONFIG);
    setCurrentSceneIndex(0);
    setError(null);
  };

  const handleGenerateSceneAudio = useCallback(async (sceneIndex: number) => {
    if (!storyData || storyData.scenes[sceneIndex].audioUrl || storyData.scenes[sceneIndex].isGeneratingAudio || storyData.ttsProvider !== TtsProvider.ELEVENLABS) {
      return;
    }
    setStoryData(prevData => {
      if (!prevData) return null;
      const newScenes = [...prevData.scenes];
      newScenes[sceneIndex] = { ...newScenes[sceneIndex], isGeneratingAudio: true };
      return { ...prevData, scenes: newScenes };
    });
    try {
      const audioDataUrl = await generateSpeech(storyData.scenes[sceneIndex].scene_text);
      setStoryData(prevData => {
        if (!prevData) return null;
        const newScenes = [...prevData.scenes];
        newScenes[sceneIndex] = { ...newScenes[sceneIndex], audioUrl: audioDataUrl, audioBase64: audioDataUrl, isGeneratingAudio: false };
        return { ...prevData, scenes: newScenes };
      });
    } catch (err) {
      console.error("Failed to fetch narration:", err);
      const errorMsg = err instanceof Error ? err.message : "An unknown error occurred during speech synthesis.";
      setError(`Failed to synthesize speech: ${errorMsg}`);
      setStoryData(prevData => {
        if (!prevData) return null;
        const newScenes = [...prevData.scenes];
        newScenes[sceneIndex] = { ...newScenes[sceneIndex], isGeneratingAudio: false };
        return { ...prevData, scenes: newScenes };
      });
    }
  }, [storyData]);

  const handleExportElevenLabsAudiobook = useCallback(async () => {
    if (!storyData || storyData.ttsProvider !== TtsProvider.ELEVENLABS) return;

    setStoryData(prev => ({...prev!, isExporting: true, exportProgress: 'Starting...'}));
    
    try {
      const scenesWithCompleteAudio = [...storyData.scenes];
      
      for (let i = 0; i < scenesWithCompleteAudio.length; i++) {
        if (!scenesWithCompleteAudio[i].audioBase64) {
           setStoryData(prev => ({...prev!, exportProgress: `Generating audio ${i + 1}/${scenesWithCompleteAudio.length}...`}));
           const audioDataUrl = await generateSpeech(scenesWithCompleteAudio[i].scene_text);
           scenesWithCompleteAudio[i] = { ...scenesWithCompleteAudio[i], audioUrl: audioDataUrl, audioBase64: audioDataUrl };
           setStoryData(prev => {
             if (!prev) return null;
             const updatedScenes = [...prev.scenes];
             updatedScenes[i] = scenesWithCompleteAudio[i];
             return {...prev, scenes: updatedScenes};
           })
        }
      }

      setStoryData(prev => ({...prev!, exportProgress: `Creating file...`}));
      const finalStoryData: StoryData = { ...storyData, scenes: scenesWithCompleteAudio };
      const htmlContent = generateElevenLabsAudiobookHtml(finalStoryData);

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = storyData.title.replace(/[^a-z0-9_]/gi, '_').substring(0, 50) || 'story';
      a.download = `${safeTitle}_audiobook_elevenlabs.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("Failed to export audiobook:", err);
      setError(err instanceof Error ? `Failed to export: ${err.message}` : "An unknown error occurred during export.");
    } finally {
       setStoryData(prev => ({...prev!, isExporting: false, exportProgress: undefined}));
    }
  }, [storyData]);
  
  const handleExportBrowserHtml = useCallback(() => {
    if (!storyData) return;
    try {
        const htmlContent = generateBrowserTtsAudiobookHtml(storyData);
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = storyData.title.replace(/[^a-z0-9_]/gi, '_').substring(0, 50) || 'story';
        a.download = `${safeTitle}_audiobook_browser.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Failed to export browser HTML:", err);
        setError("Could not create the downloadable HTML file.");
    }
  }, [storyData]);


  return (
    <div className="container mx-auto p-4 min-h-screen flex flex-col items-center justify-center text-gray-800">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white shadow-lg p-2 rounded-lg" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
          <i className="fas fa-magic mr-2"></i>Interactive Story Weaver
        </h1>
        <p className="text-xl text-purple-100 mt-2">Craft your own magical tales!</p>
      </header>

      {isLoading && <LoadingSpinner />}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-6 mb-6 shadow-xl rounded-lg max-w-2xl w-full" role="alert">
          <p className="font-bold text-2xl mb-2">Oh no, a dragon Hiccup!</p>
          <p className="text-lg">{error}</p>
        </div>
      )}

      {!isLoading && !storyData && (
        <StorySetupForm
          config={storyConfig}
          onConfigChange={handleConfigChange}
          onSubmit={handleSubmit}
          onCharacterUpdate={handlePersonalizedCharacterUpdate}
        />
      )}

      {!isLoading && storyData && (
        <StoryDisplay
          story={storyData}
          currentSceneIndex={currentSceneIndex}
          onNextScene={handleNextScene}
          onPrevScene={handlePrevScene}
          onRestart={handleRestart}
          onGenerateSceneAudio={handleGenerateSceneAudio}
          onExportElevenLabsAudiobook={handleExportElevenLabsAudiobook}
          onExportBrowserHtml={handleExportBrowserHtml}
        />
      )}
      
      <footer className="text-center mt-auto pt-8 pb-4">
        <p className="text-sm text-purple-200">
          Powered by Generative AI &nbsp;&nbsp;|&nbsp;&nbsp; Create, Imagine, Inspire!
        </p>
      </footer>
    </div>
  );
};

export default App;
