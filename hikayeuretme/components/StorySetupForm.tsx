
import React from 'react';
import { StoryConfig, StoryPreferences, StoryLength, Gender, PersonalizedCharacter, TtsProvider } from '../types';
import { STORY_PREFERENCES_OPTIONS, STORY_LENGTH_OPTIONS, GENDER_OPTIONS, MIN_AGE, MAX_AGE, SUPPORTED_LANGUAGES, TTS_PROVIDER_OPTIONS } from '../constants';

interface StorySetupFormProps {
  config: StoryConfig;
  onConfigChange: (newConfig: Partial<StoryConfig>) => void;
  onSubmit: () => void;
  onCharacterUpdate: (characterId: string, file: File) => void;
  geminiApiKey: string;
  elevenLabsApiKey: string;
  onApiKeyChange: (type: 'gemini' | 'elevenlabs', key: string) => void;
}

export const StorySetupForm: React.FC<StorySetupFormProps> = ({ config, onConfigChange, onSubmit, onCharacterUpdate, geminiApiKey, elevenLabsApiKey, onApiKeyChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "age") {
      onConfigChange({ [name]: parseInt(value, 10) });
    } else {
      onConfigChange({ [name]: value });
    }
  };

  const handleAddCharacter = () => {
    const newCharacter: PersonalizedCharacter = {
      id: crypto.randomUUID(),
      name: '',
      imagePreviewUrl: '',
      base64Data: '',
      mimeType: '',
      isProcessing: false,
      description: null
    };
    onConfigChange({ personalizedCharacters: [...config.personalizedCharacters, newCharacter] });
  };

  const handleCharacterNameChange = (id: string, name: string) => {
    onConfigChange({
      personalizedCharacters: config.personalizedCharacters.map(pc =>
        pc.id === id ? { ...pc, name } : pc
      )
    });
  };

  const handleCharacterImageChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCharacterUpdate(id, file);
    }
  };

  const handleRemoveCharacter = (id: string) => {
    const character = config.personalizedCharacters.find(pc => pc.id === id);
    if (character && character.imagePreviewUrl) {
      URL.revokeObjectURL(character.imagePreviewUrl);
    }
    onConfigChange({
      personalizedCharacters: config.personalizedCharacters.filter(pc => pc.id !== id)
    });
  };

  const formInputClass = "mt-1 block w-full p-3 bg-white bg-opacity-80 border border-purple-300 rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-lg text-gray-700 placeholder-gray-400";
  const formLabelClass = "block text-lg font-medium text-purple-100";

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-md p-6 md:p-8 rounded-xl shadow-2xl max-w-2xl w-full">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">Let's Weave a Story!</h2>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-6">
        
        {/* API Keys Section */}
        <div className="border-t border-purple-300/50 pt-6 mt-6">
            <h3 className="text-xl font-bold text-white mb-2">API Keys</h3>
            <p className={`${formLabelClass} font-normal !text-purple-200 text-sm mb-4`}>
                Enter your API keys to enable story generation and high-quality narration.
            </p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="geminiApiKey" className={formLabelClass}>Gemini API Key:</label>
                    <input
                        type="password"
                        name="geminiApiKey"
                        id="geminiApiKey"
                        value={geminiApiKey}
                        onChange={(e) => onApiKeyChange('gemini', e.target.value)}
                        className={formInputClass}
                        placeholder="Enter your Gemini API Key"
                        required
                    />
                </div>
                {config.ttsProvider === TtsProvider.ELEVENLABS && (
                    <div>
                        <label htmlFor="elevenLabsApiKey" className={formLabelClass}>ElevenLabs API Key:</label>
                        <input
                            type="password"
                            name="elevenLabsApiKey"
                            id="elevenLabsApiKey"
                            value={elevenLabsApiKey}
                            onChange={(e) => onApiKeyChange('elevenlabs', e.target.value)}
                            className={formInputClass}
                            placeholder="Enter your ElevenLabs API Key"
                            required
                        />
                    </div>
                )}
            </div>
        </div>

        <div>
          <label htmlFor="theme" className={formLabelClass}>Story Theme/Topic:</label>
          <input
            type="text"
            name="theme"
            id="theme"
            value={config.theme}
            onChange={handleChange}
            className={formInputClass}
            placeholder="e.g., A magical adventure in space"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="age" className={formLabelClass}>Child's Age ({MIN_AGE}-{MAX_AGE} years):</label>
            <input
              type="number"
              name="age"
              id="age"
              value={config.age}
              onChange={handleChange}
              min={MIN_AGE}
              max={MAX_AGE}
              className={formInputClass}
              required
            />
          </div>
          <div>
            <label htmlFor="gender" className={formLabelClass}>Character Gender Focus:</label>
            <select name="gender" id="gender" value={config.gender} onChange={handleChange} className={formInputClass}>
              {GENDER_OPTIONS.map(option => (<option key={option} value={option}>{option}</option>))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="preference" className={formLabelClass}>Story Preference:</label>
            <select name="preference" id="preference" value={config.preference} onChange={handleChange} className={formInputClass}>
              {STORY_PREFERENCES_OPTIONS.map(option => (<option key={option} value={option}>{option}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="length" className={formLabelClass}>Story Length:</label>
            <select name="length" id="length" value={config.length} onChange={handleChange} className={formInputClass}>
              {STORY_LENGTH_OPTIONS.map(option => (<option key={option} value={option}>{option}</option>))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="language" className={formLabelClass}>Language:</label>
              <select name="language" id="language" value={config.language} onChange={handleChange} className={formInputClass}>
                {SUPPORTED_LANGUAGES.map(lang => (<option key={lang.code} value={lang.code}>{lang.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="ttsProvider" className={formLabelClass}>Narration Provider:</label>
              <select name="ttsProvider" id="ttsProvider" value={config.ttsProvider} onChange={handleChange} className={formInputClass}>
                {TTS_PROVIDER_OPTIONS.map(option => (<option key={option} value={option}>{option}</option>))}
              </select>
            </div>
        </div>
        <div className="text-purple-200 text-sm -mt-4 px-1">
            <p><strong>Browser:</strong> Free, unlimited standard voice. <strong className="text-white">Recommended.</strong></p>
            <p><strong>ElevenLabs:</strong> High-quality voice, requires API quota.</p>
        </div>
        
        <div>
          <label htmlFor="characterNames" className={formLabelClass}>Main Character Name(s) (Not Personalized):</label>
          <input
            type="text"
            name="characterNames"
            id="characterNames"
            value={config.characterNames}
            onChange={handleChange}
            className={formInputClass}
            placeholder="e.g., Lily, Tom the Turtle"
          />
        </div>

        <div>
          <label htmlFor="elementsToInclude" className={formLabelClass}>Specific Elements to Include:</label>
          <textarea
            name="elementsToInclude"
            id="elementsToInclude"
            value={config.elementsToInclude}
            onChange={handleChange}
            rows={3}
            className={formInputClass}
            placeholder="e.g., A talking animal, a secret map, a funny misunderstanding"
          />
        </div>
        
        {/* PERSONALIZED CHARACTERS SECTION */}
        <div className="border-t border-purple-300/50 pt-6 mt-6">
            <h3 className="text-xl font-bold text-white mb-2">Personalize Characters (Optional)</h3>
            <p className={`${formLabelClass} font-normal !text-purple-200 text-sm mb-4`}>Upload an image for a character to make the story's illustrations look like them! For best results, use a clear portrait photo.</p>
            <div className="space-y-4">
                {config.personalizedCharacters.map((char) => (
                    <div key={char.id} className="bg-white/20 p-3 rounded-lg flex flex-col sm:flex-row items-center gap-4 relative">
                        <div className="w-24 h-24 bg-purple-200/50 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {char.imagePreviewUrl ? (
                                <img src={char.imagePreviewUrl} alt="Character preview" className="w-full h-full object-cover" />
                            ) : (
                                <i className="fas fa-user text-4xl text-purple-100"></i>
                            )}
                             {char.isProcessing && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                                </div>
                            )}
                        </div>
                        <div className="flex-grow w-full">
                            <input type="text" placeholder="Character Name" value={char.name} onChange={(e) => handleCharacterNameChange(char.id, e.target.value)} className={`${formInputClass} mb-2`} aria-label="Character name"/>
                            <input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => handleCharacterImageChange(char.id, e)} className="block w-full text-sm text-purple-100 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" aria-label="Upload character image"/>
                        </div>
                        <button type="button" onClick={() => handleRemoveCharacter(char.id)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-transform transform hover:scale-110" aria-label="Remove character"><i className="fas fa-times"></i></button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={handleAddCharacter} className="mt-4 w-full flex justify-center items-center py-2 px-4 border border-dashed border-purple-200 rounded-lg text-purple-100 hover:bg-white/10 transition">
                <i className="fas fa-plus mr-2"></i>Add Character
            </button>
        </div>

        <div>
          <button type="submit" className="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-lg text-xl font-medium text-white bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-400 transition duration-150 ease-in-out transform hover:scale-105" aria-label="Generate My Story button">
            <i className="fas fa-wand-magic-sparkles mr-2" aria-hidden="true"></i> Generate My Story!
          </button>
        </div>
      </form>
    </div>
  );
};
