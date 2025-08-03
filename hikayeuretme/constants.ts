
import { StoryConfig, StoryPreferences, StoryLength, Gender, LanguageOption, TtsProvider } from './types';

export const STORY_PREFERENCES_OPTIONS: StoryPreferences[] = [
  StoryPreferences.ADVENTURE,
  StoryPreferences.EDUCATIONAL,
  StoryPreferences.FANTASY,
  StoryPreferences.SCIFI,
  StoryPreferences.MYSTERY,
  StoryPreferences.FUNNY,
];

export const STORY_LENGTH_OPTIONS: StoryLength[] = [
  StoryLength.SHORT,
  StoryLength.MEDIUM,
  StoryLength.LONG,
];

export const GENDER_OPTIONS: Gender[] = [
  Gender.NONE,
  Gender.MALE,
  Gender.FEMALE,
  Gender.NON_BINARY,
];

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English' },
  { code: 'tr-TR', name: 'Turkish' },
];

export const TTS_PROVIDER_OPTIONS: TtsProvider[] = [
  TtsProvider.BROWSER,
  TtsProvider.ELEVENLABS,
];

export const INITIAL_STORY_CONFIG: StoryConfig = {
  theme: 'A brave knight and a friendly dragon',
  age: 5,
  gender: Gender.NONE,
  preference: StoryPreferences.FANTASY,
  length: StoryLength.SHORT,
  elementsToInclude: 'A magical crystal, a hidden cave',
  characterNames: 'Sir Reginald, Sparky the Dragon',
  language: SUPPORTED_LANGUAGES[0].code, // Default to English
  personalizedCharacters: [],
  ttsProvider: TtsProvider.BROWSER, // Default to browser to avoid quota errors
};

export const MIN_AGE = 2;
export const MAX_AGE = 12;

export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash';
export const GEMINI_IMAGE_MODEL = 'imagen-3.0-generate-002';

// == ElevenLabs Configuration ==
// WARNING: Storing API keys in client-side code is a major security risk.
// This key is visible to anyone inspecting the website's code.
// In a production application, this should be handled via a backend proxy.
export const ELEVENLABS_API_KEY = 'sk_d2274700894be3ce65f0cdb9cf3ea7d66cf2d1c8723c776b';
export const ELEVENLABS_VOICE_ID = '6GYyziau4Hk8qdg7od5c';
export const ELEVENLABS_API_BASE_URL = 'https://api.elevenlabs.io/v1';
