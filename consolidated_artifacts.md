# Consolidated Master Project Artifacts

This document compiles the historical implementation plans, tasks, and walkthroughs for the Raga Synthesizer vocal integration.

## Part 1: High-Level Blueprints & Plans

### Source: task.md
```markdown
- [x] Parse `ExtractVoicedSwaras.ipynb` and locate the placeholder Cell 6
- [x] Replace Cell 6 with the auto-detection and refinement Python code (dictionary structures, YIN tracking, local search, comparison table print, and `_auto` suffix variable unpacking)
- [x] Save the updated notebook
- [x] Verify that the notebook remains valid and executes successfully
```

### Source: implementation_plan.md
```markdown
# Implementation Plan - Automatic Swara Detection and Refinement

This plan details the implementation of an automated pitch-analysis tool in [ExtractVoicedSwaras.ipynb](file:///Users/narasimhanm.g./Desktop/Playground/MusicalAcoustics/ExtractVoicedSwaras.ipynb) to refine the start and end timestamps of individual notes (swaras) and phrases.

## Proposed Changes

### [Jupyter Notebook] [ExtractVoicedSwaras.ipynb](file:///Users/narasimhanm.g./Desktop/Playground/MusicalAcoustics/ExtractVoicedSwaras.ipynb)

#### [MODIFY] [ExtractVoicedSwaras.ipynb](file:///Users/narasimhanm.g./Desktop/Playground/MusicalAcoustics/ExtractVoicedSwaras.ipynb)

We will replace the placeholder Cell 6 (containing `# Play the slice safely...`) with a self-contained automatic segmentation block that does the following:

1. **Structured Data Representation**:
   Organizes the manual selections inside a nested dictionary structure `manual_selections` grouped by voice (`amma`, `student`) and phrase type (`ascent_1`, `ascent_2`, `descent_1`, `descent_2`).

2. **Automated DSP Refinement**:
   * Loads the audio segment once (`offset=3:40`, `duration=60s`).
   * Tracks the fundamental frequency ($f_0$) using `librosa.yin` (robust to soft singing).
   * Smooths the pitch curve using a 1D median filter (`scipy.signal.medfilt`) and computes its absolute derivative in log space:
     $$D(t) = \left| \log_2 f_0(t) - \log_2 f_0(t-1) \right|$$
   * For the start of each phrase and the end of each phrase, it keeps the user's manual time boundaries (which cleanly represent voice onset/offset).
   * For the internal transitions (e.g., $S \rightarrow R$, $R \rightarrow G$), it searches in a window of $\pm 0.6$ seconds around the manual transition boundary to locate the frame where the log-pitch derivative $D(t)$ peaks. This identifies the exact moment of pitch shift.

3. **Comparison Output**:
   Compiles the computed time ranges into `auto_selections` and prints a formatted side-by-side comparison table showing:
   * Swara name
   * Manual range
   * Auto-refined range
   * Start/End differences in seconds

4. **Variables Injection**:
   Unpacks the refined timestamps from the dict structure into flat global variables matching the original names but with an `_auto` suffix (e.g., `ascending_sa_amma_auto`, `ascending_ri1_amma_auto`). This allows the user to immediately use them in their existing audio concatenation cells to hear the difference.

---

## Verification Plan

### Automated Verification
We will run a validation python script to check that:
* The notebook parses as valid JSON.
* The newly inserted code cell runs cleanly and executes pitch tracking successfully on the host conda environment.
* All 32 refined swara variables are successfully unpacked and verified.

### Manual Verification
* The user can open the notebook, execute the new cell, view the comparison table, and play/concatenate the `_auto` swaras to hear the auditory improvement.
```

## Part 2: Operational Walkthroughs & Logs

### Source: walkthrough.md
```markdown
# Raga Synthesizer Vocal Integration Walkthrough

This document summarizes the steps taken to integrate the natural vocal samples of Amma (teacher) and the Student into the client-side React scale synthesizer application (`raga_synth_app`).

## Changes Made

1. **Extracted Vocal Swaras**:
   - Programmatically sliced the original 5-minute MP3 file `/Users/narasimhanm.g./Desktop/MusicAlbums/0Carnatic/0AmmaLessons/01saraLe-varasegaLu.MP3` using the manual database coordinates.
   - Saved 16 individual mono WAV files (8 for Amma, 8 for Student) inside the web app's public assets folder at `raga_synth_app/public/audio/`.
   - Peak normalized each slice to `0.95` to guarantee loudness balance against the synthesized instruments.

2. **Asynchronous Audio Preloader**:
   - Added parallel sample preloading logic in `App.tsx` linked to the initialization of the `AudioContext`.
   - When the user first interacts with the synthesizer, it fetches and decodes the 16 WAV files and caches them as raw floating-point samples inside a global cache `voiceBuffers`.

3. **High-Performance Linear Interpolation Resampler**:
   - Extended `generateAudioSamples()` in `AudioEngine.ts` to accept the target swara name.
   - When `Voice (Amma)` or `Voice (Student)` is selected, it translates the octave (dividing the target frequency by 2.0 to match the clean natural vocal register).
   - Retrieves the matching swara sample from `voiceBuffers` and pitch-shifts it in real-time using linear interpolation resampling.
   - Appends a linear decay envelope at the end of each sample to prevent audio clicks.

4. **UI Integration**:
   - Added `Voice (Amma)` and `Voice (Student)` options to the instrument selection panel in the React frontend.

## Verification Results

- Ran `npm run build` inside `raga_synth_app/`.
- The application compiled cleanly in 1.24 seconds with **zero** TypeScript or bundling errors, meaning all imports and types are fully verified and correct.
```
