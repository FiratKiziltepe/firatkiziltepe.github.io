# 🎙️ Audio to Text Transcription App

A powerful, free, browser-based audio transcription tool using OpenAI's Whisper AI model via Transformers.js.

## ✨ Features

### Core Functionality
- **High-Quality Transcription**: Uses Whisper AI model for accurate speech-to-text conversion
- **Multi-Language Support**: Supports English, Turkish, and 10+ other languages
- **No Length Limit**: Process audio files of any duration
- **100% Free**: No API keys, no subscriptions, completely free
- **Privacy First**: All processing happens in your browser - no data sent to servers

### User Experience
- **Drag & Drop Upload**: Easy file upload with drag-and-drop support
- **Real-Time Progress**: Visual progress bar showing transcription status
- **Audio Playback**: Built-in audio player to listen to your file
- **Synchronized Highlighting**: Text highlights automatically as audio plays, allowing you to follow along
- **Click-to-Jump**: Click any word in the transcript to jump to that point in the audio
- **Edit Mode**: Edit the transcription text directly in the browser
- **Download**: Export your transcript as a text file
- **Speaker Diarization**: Automatically detects and separates different speakers (Speaker 1, Speaker 2, etc.)

### Technical Features
- **No Installation Required**: Runs entirely in the browser
- **Offline Capable**: After first load, can work without internet
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Modern UI**: Beautiful gradient design with smooth animations

## 🚀 How to Use

1. **Open the App**: Navigate to `ses/index.html` in your web browser

2. **Select Language** (Optional): Choose your audio language or use auto-detect

3. **Upload Audio**:
   - Click "Choose Audio File" button, or
   - Drag and drop an audio file onto the upload area
   - Supported formats: MP3, WAV, M4A, OGG, FLAC

4. **Wait for Processing**:
   - First time: Model download takes 2-5 minutes
   - Subsequent uses: Processing starts immediately
   - Progress bar shows real-time status

5. **Review Transcript**:
   - Play audio using the built-in player
   - Watch text highlight automatically as audio plays
   - Click any word to jump to that time in the audio
   - Check speaker separations

6. **Edit & Download**:
   - Click "Edit" to modify the text
   - Click "Save" when done editing
   - Click "Download" to save as .txt file

## 🎯 Supported Languages

- English (en)
- Turkish (tr)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Russian (ru)
- Japanese (ja)
- Chinese (zh)
- Auto-detect for other languages

## 🔧 Technical Details

### Technology Stack
- **Whisper AI**: OpenAI's state-of-the-art speech recognition model
- **Transformers.js**: Runs transformer models directly in the browser
- **Web Audio API**: For audio processing and playback synchronization
- **Vanilla JavaScript**: No frameworks, lightweight and fast

### Speaker Diarization
The app uses a pause-detection algorithm to identify speaker changes:
- Pauses longer than 2 seconds suggest speaker changes
- Automatically labels speakers as "Speaker 1", "Speaker 2", etc.
- Shows timestamps for each speaker segment

### Performance
- **First Load**: 2-5 minutes (model download, ~150MB)
- **Subsequent Loads**: Instant (model cached)
- **Processing Speed**: ~1-2x real-time (varies by device)
- **Memory Usage**: ~500MB-1GB during processing

## 💡 Tips for Best Results

1. **Use High-Quality Audio**: Clear audio produces better transcriptions
2. **Minimize Background Noise**: Reduces transcription errors
3. **Choose Correct Language**: Manual language selection improves accuracy
4. **Be Patient on First Use**: Model download is one-time only
5. **Use Modern Browser**: Chrome, Edge, or Firefox recommended
6. **Check Speakers**: Review and adjust speaker labels if needed

## 🌐 Browser Compatibility

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 15.4+
- ✅ Opera 76+

## 📱 Mobile Support

The app works on mobile devices but:
- Processing may be slower
- Large files may consume significant memory
- Best experience on desktop/laptop

## 🔒 Privacy & Security

- **No Server Upload**: Audio stays on your device
- **No Tracking**: No analytics or tracking code
- **No API Keys**: No external services required
- **Open Source**: Transparent code you can review

## ⚡ Troubleshooting

### Model Won't Load
- Check internet connection (needed for first download)
- Clear browser cache and try again
- Try a different browser

### Transcription Errors
- Ensure audio quality is good
- Select the correct language manually
- Check for background noise in audio

### Performance Issues
- Close other browser tabs
- Use a more powerful device for large files
- Consider splitting very long audio files

## 🎓 Use Cases

- **Podcasts**: Transcribe podcast episodes
- **Interviews**: Convert interview recordings to text
- **Meetings**: Create meeting notes from recordings
- **Lectures**: Transcribe educational content
- **Content Creation**: Generate subtitles or captions
- **Accessibility**: Create text versions of audio content
- **Language Learning**: Follow along with audio in different languages

## 📄 License

This application uses open-source technologies:
- Whisper model by OpenAI
- Transformers.js by Xenova
- All processing is done client-side in your browser

## 🙏 Credits

- **Whisper AI**: OpenAI
- **Transformers.js**: Xenova
- **UI Design**: Custom gradient design
- **Icons**: Unicode emoji

---

**Enjoy transcribing your audio files! 🎉**
