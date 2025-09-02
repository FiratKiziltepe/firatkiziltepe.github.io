import { ELEVENLABS_API_BASE_URL, ELEVENLABS_VOICE_ID, ELEVENLABS_API_KEY } from '../constants';

/**
 * Generates speech from text using the ElevenLabs API and returns a Base64 data URL.
 * @param text The text to convert to speech.
 * @param voiceId The ID of the voice to use for the narration.
 * @returns A promise that resolves to a full Base64 data URL for the generated audio.
 */
export const generateSpeech = async (text: string, voiceId: string = ELEVENLABS_VOICE_ID): Promise<string> => {
    if (!ELEVENLABS_API_KEY) {
        throw new Error("ElevenLabs API key is not configured in constants.ts.");
    }
    if (!voiceId) {
        throw new Error("ElevenLabs Voice ID is not configured in constants.ts.");
    }

    const url = `${ELEVENLABS_API_BASE_URL}/text-to-speech/${voiceId}`;
    const headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
    };
    const body = JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.1,
            use_speaker_boost: true,
        },
    });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: body,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error("ElevenLabs API Error:", errorData);
            throw new Error(`Failed to generate speech. Status: ${response.status}. Message: ${errorData.detail?.message || 'Unknown error'}`);
        }

        // Fetch as a blob, which is a standard way to handle file-like objects
        const blob = await response.blob();

        // Use FileReader to reliably convert the blob to a Base64 Data URL
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result as string;
                // A valid audio file should be larger than a simple header. This is a basic sanity check.
                if (!base64data || base64data.length < 1000) {
                     console.error("Generated Base64 data is suspiciously short, likely an error.", base64data);
                     reject(new Error("Failed to generate complete audio data. Received an incomplete file."));
                     return;
                }
                resolve(base64data);
            };
            reader.onerror = (error) => {
                console.error("FileReader could not read the audio blob:", error);
                reject(new Error("Failed to read the generated audio data."));
            };
            reader.readAsDataURL(blob);
        });

    } catch (error) {
        console.error("Error during speech generation request:", error);
        throw error;
    }
};