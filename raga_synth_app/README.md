# 🎵 Carnatic Melakarta Raga Synthesizer

An interactive, browser-based digital synthesizer and visualizer that bridges ancient Indian musicology (specifically the 72 Melakarta Raga system of Carnatic music) with modern web audio technology, digital signal processing (DSP), and physical modeling.

---

## 🌟 Vision & Purpose

Indian Classical music, particularly the Carnatic tradition, is built on a sophisticated microtonal and melodic scale framework called the **Melakarta system**. The 72 parent scales (Melakarta ragas) utilize specific combinations of 16 swara (note) variants. 

This project aims to:
1. **Demystify the Melakarta System:** Provide a tactile, visual, and acoustic environment to explore the construction and relationships of all 72 primary ragas.
2. **Execute DSP entirely on the Client-Side:** Implement complex musical instruments (strings, voice, keyboard) through mathematical and physical/subtractive modeling in pure Web Audio, eliminating the need for pre-recorded audio samples.
3. **Bridge East & West:** Show real-time mappings between the Carnatic swaras (`S R G M P D N`) and standard Western musical note counterparts under the equal temperament system, complete with multilingual representations (IAST, Kannada, Devanagari).

---

## 🚀 Key Features

*   **72 Melakarta Raga Database:** Comprehensive lookup and mathematical derivation of all 72 raga scales categorized by their respective *Chakras*.
*   **Physical & Formant Sound Synthesis:** Select between 6 distinct acoustic models:
    *   *Piano:* Harmonic modeling with inharmonicity (string stiffness), Hammer strike noise, and ADSR envelope.
    *   *Violin:* Vibrato frequency modulation (FM), custom body resonances, and bow-friction scraping noise.
    *   *Human Male & Female Voice:* Glottal source pulse generator with vowel formant filtering (4-band peaking resonators).
    *   *Sitar:* Jawari buzzing bridge distortion (non-linear polynomial waveshaping), meend pitch glide, and sympathetic string resonances.
    *   *Veena:* Gourd soundboard resonators, meend glide, and non-linear bridge buzz.
*   **Quantized Hrasva Matra (Note Duration):** Note trigger system where note hold and release is quantized to the nearest multiple of the base *hrasva* (short note duration). Release events feature an 80ms linear ramp fade-out to prevent audio pops and clicks.
*   **3-Octave Interactive Swara Keyboard:** Responsive grid layout for live improvisation, customized to the active raga's notes, supporting multitouch/pointer hold mechanics.
*   **Practice Sequencer:** Automatically plays standard melodic movements:
    *   *Arohana* (Ascending scale)
    *   *Avarohana* (Descending scale)
    *   *Combination* (Ascending and Descending joined)
    *   *Full Practice* (Sequential run-through of Arohana, Avarohana, and Combination with natural pauses)
*   **Random Phrase Generator:** Synthesizes randomized, musically valid phrases in the selected raga with configurable length.
*   **Real-time Oscilloscope:** High-performance HTML5 Canvas visualizer mapping output amplitude in the time domain, showing standby animations when idle.
*   **Dual-Aesthetics Interface:** Toggle between **Sleek Cyber Theme** (Glassmorphism, dark gradient, glowing neon visualizers) and **Classical Acoustic Theme** (Warm parchment paper, serif typography, rich wood/brass tones).
*   **Multilingual Swara Notation:** Renders scales instantly in English (IAST), Kannada (ಕನ್ನಡ), and Devanagari (देवनागरी).

---

## 🛠️ The Sound Synthesis Engine (DSP Deep Dive)

The entire synthesizer is written in native TypeScript and operates within the browser's Web Audio API using direct `Float32Array` sample buffer rendering. The sound models inside [AudioEngine.ts](file:///Users/narasimhanm.g./Desktop/Playground/MusicalAcoustics/raga-synth-app/src/audio/AudioEngine.ts) utilize the following DSP concepts:

### 1. Inharmonicity (Piano)
Stiff strings deviate from ideal harmonic frequencies. The piano engine models this using:
$$f_k = k \cdot f_0 \sqrt{1 + B \cdot k^2}$$
where $f_0$ is the fundamental frequency, $k$ is the harmonic number, and $B$ is the string stiffness coefficient ($0.00015$).

### 2. Formant Vowel Synthesis (Human Voice)
To synthesize vocal tones, the engine generates a glottal waveform source (sum of 30 harmonics decaying at $1.8$ power) and filters it using a cascade of biquad bandpass peaking resonators centered at human vowel formants ($F_1$ to $F_4$):
*   **Male Voice formants:** $730\text{ Hz}$, $1090\text{ Hz}$, $2440\text{ Hz}$, $3400\text{ Hz}$
*   **Female Voice formants:** $850\text{ Hz}$, $1220\text{ Hz}$, $2810\text{ Hz}$, $3750\text{ Hz}$

### 3. Jawari Buzzing & Meend Glides (Sitar & Veena)
Indian string instruments get their signature buzzing drone from the wide, flat *Jawari* bridge. The engine models this using a non-linear polynomial waveshaper:
$$y = x + 0.25x^2 - 0.1x^3$$
Combined with an exponential meend (pitch bend) glide on note start:
$$f(t) = f_{\text{target}} \cdot (1 + \text{glide} \cdot e^{-\lambda t})$$

---

## 📂 Project Structure

```
MusicalAcoustics/
├── README.md                     # Root directory documentation
├── katapayadi.py                 # Ancient Sanskrit decoder script
├── transliterate.py              # Multilingual script translation script
├── Experiments-01.ipynb          # Jupyter Notebook research & Western notes cell
├── MelakarthaRagas.csv           # Raga datasets
├── raga-synth-app/               # React Web Application
│   ├── public/                   # Public assets
│   ├── src/
│   │   ├── main.tsx              # React mounting file
│   │   ├── App.tsx               # Main layout, State managers, Web Audio triggers
│   │   ├── App.css               # Core container layouts
│   │   ├── styles/
│   │   │   └── theme.css         # Glassmorphism, colors, fonts, dual-themes
│   │   ├── audio/
│   │   │   ├── AudioEngine.ts    # DSP physical engines & sample concats
│   │   │   └── RagaData.ts       # Melakarta math scale formulas & database
│   │   └── components/
│   │       ├── RagaSelector.tsx  # Slider and script translators
│   │       ├── Keyboard.tsx      # Multi-octave swara trigger buttons
│   │       ├── Sequencer.tsx     # practice scales & phrase loops
│   │       └── Visualizer.tsx    # Canvas oscilloscope engine
│   ├── package.json              # App configuration & dependencies
│   ├── tsconfig.json             # TypeScript settings
│   └── vite.config.ts            # Vite compile settings
```

---

## ⚙️ Installation & Running

### 1. Interactive React App (`raga-synth-app`)

The application is built using React 18, Vite, and TypeScript.

#### Prerequisites
*   [Node.js](https://nodejs.org/) (Version 18.0.0 or higher recommended)
*   `npm` (comes bundled with Node.js)

#### Steps to Run
1.  Navigate into the application folder:
    ```bash
    cd raga-synth-app
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local development server:
    ```bash
    npm run dev
    ```
4.  Open the web application by clicking the link printed in your terminal (usually `http://localhost:5173`).

---

### 2. Python Research & Notebooks (Root Directory)

The root folder contains acoustics scripts and notebooks for mathematical analysis.

#### Prerequisites
*   Python 3.8 or higher
*   `pip` package manager

#### Setup Python Environment
1.  Initialize/activate your virtual environment (if one exists):
    ```bash
    source .venv/bin/activate
    ```
2.  Install recommended packages:
    ```bash
    pip install numpy scipy pandas jupyter indic-transliteration
    ```
3.  Launch Jupyter Notebook:
    ```bash
    jupyter notebook
    ```
4.  Open [Experiments-01.ipynb](file:///Users/narasimhanm.g./Desktop/Playground/MusicalAcoustics/Experiments-01.ipynb) to inspect the octave notes cell and run physical acoustics experiments.
