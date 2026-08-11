# Raga Synthesizer Vocal Integration Walkthrough
This document summarizes the steps taken to integrate the natural vocal samples of Amma (teacher) and the Student into the client-side React scale synthesizer application (raga_synth_app).

## Changes Made
### 1. Extracted Vocal Swaras:

. Programmatically sliced the original 5-minute MP3 file ~/Desktop/MusicAlbums/0Carnatic/0AmmaLessons/01saraLe-varasegaLu.MP3 using the manual database coordinates.
. Saved 16 individual mono WAV files (8 for Teacher, 8 for Student) inside the web app's public assets folder at raga_synth_app/public/audio/.
. Peak normalized each slice to 0.95 to guarantee loudness balance against the synthesized instruments.
### 2. Asynchronous Audio Preloader:

. Added parallel sample preloading logic in App.tsx linked to the initialization of the AudioContext.
. When the user first interacts with the synthesizer, it fetches and decodes the 16 WAV files and caches them as raw floating-point samples inside a global cache voiceBuffers.
### 3. High-Performance Linear Interpolation Resampler:

. Extended generateAudioSamples() in AudioEngine.ts to accept the target swara name.
. When Voice (Amma) or Voice (Student) is selected, it translates the octave (dividing the target frequency by 2.0 to match the clean natural vocal register).
. Retrieves the matching swara sample from voiceBuffers and pitch-shifts it in real-time using linear interpolation resampling.
. Appends a linear decay envelope at the end of each sample to prevent audio clicks.
### 4. UI Integration:

. Added Voice (Teacher) and Voice (Student) options to the instrument selection panel in the React frontend.
## Verification Results
. Ran npm run build inside raga_synth_app/.
. The application compiled cleanly in 1.24 seconds with zero TypeScript or bundling errors, meaning all imports and types are fully verified and correct.