
import React, { useState, useEffect, useRef } from 'react';
import { StoryData, TtsProvider } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface StoryDisplayProps {
  story: StoryData;
  currentSceneIndex: number;
  onNextScene: () => void;
  onPrevScene: () => void;
  onRestart: () => void;
  onGenerateSceneAudio: (sceneIndex: number) => void;
  onExportElevenLabsAudiobook: () => void;
  onExportBrowserHtml: () => void;
}

export const StoryDisplay: React.FC<StoryDisplayProps> = ({ story, currentSceneIndex, onNextScene, onPrevScene, onRestart, onGenerateSceneAudio, onExportElevenLabsAudiobook, onExportBrowserHtml }) => {
  const currentScene = story.scenes[currentSceneIndex];
  const audioRef = useRef<HTMLAudioElement>(null);

  // State for ElevenLabs audio
  const [elevenLabsStatus, setElevenLabsStatus] = useState<'idle' | 'playing' | 'paused' | 'loading'>('idle');
  
  // State for Browser speech synthesis
  const [browserSpeechStatus, setBrowserSpeechStatus] = useState<'idle' | 'speaking' | 'paused'>('idle');

  // Stop all audio when scene changes or component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    // Reset states when scene changes
    window.speechSynthesis.cancel();
    setBrowserSpeechStatus('idle');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setElevenLabsStatus('idle');
  }, [currentSceneIndex]);

  // Effect to load and play ElevenLabs audio
  useEffect(() => {
    if (story.ttsProvider === TtsProvider.ELEVENLABS && currentScene.audioUrl && audioRef.current) {
      if (audioRef.current.src !== currentScene.audioUrl) {
        audioRef.current.src = currentScene.audioUrl;
      }
      if (elevenLabsStatus === 'loading') {
        audioRef.current.play().catch(e => {
          console.error("Audio play failed:", e);
          setElevenLabsStatus('idle');
        });
      }
    }
  }, [currentScene.audioUrl, elevenLabsStatus, story.ttsProvider]);


  const handleTogglePlayPauseNarration = async () => {
    if (!currentScene) return;

    if (story.ttsProvider === TtsProvider.ELEVENLABS) {
      if (elevenLabsStatus === 'playing') {
        audioRef.current?.pause();
      } else if (elevenLabsStatus === 'paused' || (elevenLabsStatus === 'idle' && currentScene.audioUrl)) {
        audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
      } else if (elevenLabsStatus === 'idle' && !currentScene.audioUrl) {
        setElevenLabsStatus('loading');
        await onGenerateSceneAudio(currentSceneIndex);
      }
    } else { // Browser TTS
      if (browserSpeechStatus === 'speaking') {
        window.speechSynthesis.pause();
      } else if (browserSpeechStatus === 'paused') {
        window.speechSynthesis.resume();
      } else {
        const utterance = new SpeechSynthesisUtterance(currentScene.scene_text);
        utterance.lang = story.language;
        utterance.onstart = () => setBrowserSpeechStatus('speaking');
        utterance.onpause = () => setBrowserSpeechStatus('paused');
        utterance.onresume = () => setBrowserSpeechStatus('speaking');
        utterance.onend = () => setBrowserSpeechStatus('idle');
        utterance.onerror = (e) => {
          console.error("SpeechSynthesis Error:", e);
          setBrowserSpeechStatus('idle');
        };
        window.speechSynthesis.cancel(); // Clear any previous utterances
        window.speechSynthesis.speak(utterance);
      }
    }
  };
  
  const getButtonState = () => {
    const isElevenLabs = story.ttsProvider === TtsProvider.ELEVENLABS;
    if (isElevenLabs) {
        if (currentScene.isGeneratingAudio || elevenLabsStatus === 'loading') {
          return { text: 'Generating...', icon: 'fa-spinner fa-spin', label: 'Generating narration', disabled: true, color: 'bg-gray-500' };
        }
        if (elevenLabsStatus === 'playing') {
          return { text: 'Pause Narration', icon: 'fa-pause', label: 'Pause narration', disabled: false, color: 'bg-red-500 hover:bg-red-600' };
        }
    } else { // Browser TTS
        if (browserSpeechStatus === 'speaking') {
          return { text: 'Pause Narration', icon: 'fa-pause', label: 'Pause narration', disabled: false, color: 'bg-red-500 hover:bg-red-600' };
        }
    }
    return { text: 'Play Narration', icon: 'fa-play', label: 'Play narration', disabled: story.isExporting, color: 'bg-green-500 hover:bg-green-600' };
  };
  
  const buttonState = getButtonState();
  
  const ExportButtonContent = () => {
    if (story.isExporting) {
      return (<><i className="fas fa-spinner fa-spin mr-1 md:mr-2"></i><span>{story.exportProgress || 'Exporting...'}</span></>);
    }
    return (<><i className="fas fa-book mr-1 md:mr-2"></i><span>Download Audiobook (ElevenLabs)</span></>);
  };

  return (
    <div className="bg-white bg-opacity-25 backdrop-blur-lg p-4 md:p-8 rounded-xl shadow-2xl max-w-4xl w-full flex flex-col items-center">
      <audio ref={audioRef} onPlay={() => setElevenLabsStatus('playing')} onPause={() => setElevenLabsStatus('paused')} onEnded={() => setElevenLabsStatus('idle')} onError={() => setElevenLabsStatus('idle')} hidden/>
      
      <div className="w-full text-center mb-4">
        <h2 className="text-4xl font-bold text-white mb-2" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.4)'}}>{story.title}</h2>
        <p className="text-purple-100 text-lg">Scene {currentSceneIndex + 1} of {story.scenes.length}</p>
      </div>

      <div className="w-full flex flex-col sm:flex-row justify-center items-center gap-2 mb-4">
          <button onClick={handleTogglePlayPauseNarration} className={`py-2 px-4 rounded-lg text-md font-semibold text-white transition duration-150 transform hover:scale-105 ${buttonState.color} disabled:bg-gray-400 disabled:cursor-not-allowed`} aria-label={buttonState.label} title={buttonState.label} disabled={buttonState.disabled}>
            <i className={`fas ${buttonState.icon} mr-2`}></i>{buttonState.text}
          </button>
      </div>
      
      <div className="w-full max-w-2xl aspect-video bg-gray-200 bg-opacity-50 rounded-lg shadow-lg overflow-hidden flex items-center justify-center mb-6" role="img">
        {currentScene.imageUrl ? (
          currentScene.imageUrl.startsWith('https://picsum.photos') ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-300 p-4">
              <i className="fas fa-image fa-3x text-gray-400 mb-2"></i>
              <p className="text-purple-700 text-center">Illustration crafting had a hiccup!<br/>Enjoy this placeholder art.</p>
            </div>
          ) : (<img src={currentScene.imageUrl} alt={currentScene.illustration_prompt || `Scene ${currentSceneIndex + 1} illustration`} className="w-full h-full object-cover"/>)
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-500"><LoadingSpinner /><p className="mt-2 text-purple-200">Conjuring illustration...</p></div>
        )}
      </div>

      <div className="bg-white bg-opacity-70 p-6 rounded-lg shadow-md w-full max-w-3xl mb-6" role="region" aria-label="Scene text">
         <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">{currentScene.scene_text}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row w-full justify-center items-center gap-2 mb-6">
        <button onClick={onExportBrowserHtml} disabled={story.isExporting} className="py-2 px-3 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 transform hover:scale-105 flex items-center justify-center">
            <i className="fas fa-download mr-2"></i>Download HTML (Browser Voice)
        </button>
        <button onClick={onExportElevenLabsAudiobook} disabled={story.isExporting || story.ttsProvider !== TtsProvider.ELEVENLABS} className="py-2 px-3 rounded-lg text-sm font-semibold text-white bg-teal-500 hover:bg-teal-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-150 transform hover:scale-105 flex items-center justify-center" title={story.ttsProvider !== TtsProvider.ELEVENLABS ? "This option is only available when ElevenLabs is selected as the provider." : "Download a self-contained HTML file with high-quality audio."}>
            <ExportButtonContent />
        </button>
      </div>

      <div className="flex justify-between w-full items-center flex-wrap gap-y-3">
        <button onClick={onPrevScene} disabled={currentSceneIndex === 0 || story.isExporting} className="py-3 px-6 rounded-lg text-lg font-semibold text-white bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 disabled:opacity-70 transition duration-150 transform hover:scale-105 disabled:transform-none">
          <i className="fas fa-arrow-left mr-2"></i>Previous
        </button>
        <button onClick={onRestart} disabled={story.isExporting} className="py-3 px-6 rounded-lg text-lg font-semibold text-white bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 transition duration-150 transform hover:scale-105">
          <i className="fas fa-redo mr-2"></i>New Story
        </button>
        <button onClick={onNextScene} disabled={currentSceneIndex === story.scenes.length - 1 || story.isExporting} className="py-3 px-6 rounded-lg text-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:opacity-70 transition duration-150 transform hover:scale-105 disabled:transform-none">
          Next<i className="fas fa-arrow-right ml-2"></i>
        </button>
      </div>
    </div>
  );
};
