// Real-time audio synthesis engine for Carnatic Raga Synthesizer

export const ref_carnatic_16 = ['S', 'R₁', 'R₂', 'R₃', 'G₁', 'G₂', 'G₃', 'M₁', 'M₂', 'P', 'D₁', 'D₂', 'D₃', 'N₁', 'N₂', 'N₃'];
export const ref_western_16 = ['C', 'C#', 'D', 'D#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'A', 'A#', 'B'];
export const ref_western_12 = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function getSwaraFrequency(swara: string, octave: number): number {
    try {
        const idx = ref_carnatic_16.indexOf(swara);
        if (idx === -1) return 261.63; // Fallback C4
        const westernNote = ref_western_16[idx];
        const noteIndex = ref_western_12.indexOf(westernNote);
        const midiNote = 12 * (octave + 1) + noteIndex;
        return 440.0 * Math.pow(2.0, (midiNote - 69) / 12.0);
    } catch {
        return 261.63; // Fallback C4
    }
}

// Box-Muller transform for normal distribution random noise
function randomNormal(mean = 0, std = 1): number {
    const u = 1 - Math.random();
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * std;
}

// Biquad filter implementation for DSP (equivalent to SciPy lfilter)
export function filterBiquad(signal: Float32Array, b: number[], a: number[]): Float32Array {
    const out = new Float32Array(signal.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    const b0 = b[0], b1 = b[1], b2 = b[2];
    const a0 = a[0], a1 = a[1], a2 = a[2];
    
    // Normalize coefficients by a0
    const nb0 = b0 / a0, nb1 = b1 / a0, nb2 = b2 / a0;
    const na1 = a1 / a0, na2 = a2 / a0;
    
    for (let i = 0; i < signal.length; i++) {
        const x = signal[i];
        const y = nb0 * x + nb1 * x1 + nb2 * x2 - na1 * y1 - na2 * y2;
        out[i] = y;
        
        x2 = x1;
        x1 = x;
        y2 = y1;
        y1 = y;
    }
    return out;
}

// Designs a constant-gain peaking resonator filter (equivalent to SciPy iirpeak)
export function designIIRPeak(fc: number, Q: number, sr: number = 22050) {
    const w0 = (2 * Math.PI * fc) / sr;
    const alpha = Math.sin(w0) / (2 * Q);
    const cosw0 = Math.cos(w0);
    
    const b = [alpha, 0, -alpha];
    const a = [1 + alpha, -2 * cosw0, 1 - alpha];
    return { b, a };
}

// 1. Piano Synthesizer
function synthPiano(freq: number, duration: number, sr: number): Float32Array {
    const size = Math.floor(sr * duration);
    const signal = new Float32Array(size);
    const numHarmonics = 8;
    const B = 0.00015; // Inharmonicity coefficient (stiff strings)
    
    // Generate harmonics
    for (let k = 1; k <= numHarmonics; k++) {
        const fk = k * freq * Math.sqrt(1 + B * k * k);
        if (fk > sr / 2) break;
        const decayRate = 0.8 + 0.4 * k;
        
        for (let i = 0; i < size; i++) {
            const t = i / sr;
            const amp = (1.0 / Math.pow(k, 1.2)) * Math.exp(-decayRate * t);
            signal[i] += amp * Math.sin(2 * Math.PI * fk * t);
        }
    }
    
    // Add hammer strike noise
    const strikeLen = Math.floor(0.015 * sr);
    if (strikeLen < size) {
        const noise = new Float32Array(strikeLen);
        for (let i = 0; i < strikeLen; i++) {
            noise[i] = randomNormal(0, 1);
        }
        
        const filteredNoise = new Float32Array(strikeLen);
        for (let i = 1; i < strikeLen; i++) {
            filteredNoise[i] = noise[i] + 0.7 * filteredNoise[i - 1];
        }
        
        // Normalize noise
        let maxNoise = 0.0001;
        for (let i = 0; i < strikeLen; i++) {
            const absN = Math.abs(filteredNoise[i]);
            if (absN > maxNoise) maxNoise = absN;
        }
        
        for (let i = 0; i < strikeLen; i++) {
            const env = Math.exp(-5 * (i / strikeLen));
            signal[i] += 0.08 * (filteredNoise[i] / maxNoise) * env;
        }
    }
    
    // Enveloping
    const attackSamples = Math.floor(0.005 * sr);
    const releaseSamples = Math.floor(0.15 * sr);
    for (let i = 0; i < size; i++) {
        let env = 1.0;
        if (i < attackSamples) {
            env = i / attackSamples;
        }
        if (i > size - releaseSamples) {
            env *= (size - i) / releaseSamples;
        }
        signal[i] *= env;
    }
    
    return signal;
}

// 2. Violin Synthesizer
function synthViolin(freq: number, duration: number, sr: number): Float32Array {
    const size = Math.floor(sr * duration);
    const signal = new Float32Array(size);
    const vibFreq = 6.0;
    const vibDepth = 0.008;
    
    const numHarmonics = 15;
    for (let k = 1; k <= numHarmonics; k++) {
        const fk = k * freq;
        if (fk > sr / 2) break;
        
        let resonanceFactor = 1.0;
        if (fk < 400) resonanceFactor *= 1.2;
        else if (fk > 800 && fk < 1500) resonanceFactor *= 1.4;
        else if (fk > 3000) resonanceFactor *= 0.3;
        
        const amp = (1.0 / k) * resonanceFactor;
        
        for (let i = 0; i < size; i++) {
            const t = i / sr;
            // Introduce frequency modulation (vibrato)
            const instPhase = 2 * Math.PI * freq * (t - (vibDepth / (2 * Math.PI * vibFreq)) * Math.cos(2 * Math.PI * vibFreq * t));
            signal[i] += amp * Math.sin(k * instPhase);
        }
    }
    
    // Subtle bow scraping noise
    const noise = new Float32Array(size);
    for (let i = 0; i < size; i++) {
        noise[i] = randomNormal(0, 0.015);
    }
    const filteredNoise = new Float32Array(size);
    for (let i = 1; i < size; i++) {
        filteredNoise[i] = noise[i] + 0.8 * filteredNoise[i - 1];
    }
    for (let i = 0; i < size; i++) {
        signal[i] += 0.03 * filteredNoise[i];
    }
    
    // Bowing ADSR envelope
    const attackSamples = Math.floor(0.12 * sr);
    const releaseSamples = Math.floor(0.15 * sr);
    for (let i = 0; i < size; i++) {
        let env = 1.0;
        if (i < attackSamples) {
            env = i / attackSamples;
        } else if (i > size - releaseSamples) {
            env = (size - i) / releaseSamples;
        }
        signal[i] *= env;
    }
    
    return signal;
}

// 3. Glottal wave generator for formant voice synthesizer
function generateGlottalSource(freq: number, duration: number, vibFreq: number, vibDepth: number, sr: number): Float32Array {
    const size = Math.floor(sr * duration);
    const source = new Float32Array(size);
    
    for (let i = 0; i < size; i++) {
        const t = i / sr;
        const instPhase = 2 * Math.PI * freq * (t - (vibDepth / (2 * Math.PI * vibFreq)) * Math.cos(2 * Math.PI * vibFreq * t));
        
        const maxHarm = Math.min(30, Math.floor(sr / (2 * freq)));
        for (let k = 1; k <= maxHarm; k++) {
            const amp = 1.0 / Math.pow(k, 1.8);
            source[i] += amp * Math.sin(k * instPhase);
        }
        // High-frequency aspiration noise
        source[i] += randomNormal(0, 0.005);
    }
    return source;
}

// 4. Human Voice Synthesizer (Vowel Formant Synthesis)
function synthVoice(freq: number, duration: number, voiceType: 'male' | 'female', sr: number): Float32Array {
    let vibFreq = 5.2;
    let vibDepth = 0.006;
    let formants: [number, number, number][] = [];
    
    if (voiceType === 'male') {
        formants = [
            [730, 50, 1.0],      // F1
            [1090, 60, 0.5],     // F2
            [2440, 100, 0.15],   // F3
            [3400, 120, 0.08]    // F4
        ];
    } else {
        vibFreq = 5.8;
        vibDepth = 0.007;
        formants = [
            [850, 60, 1.0],      // F1
            [1220, 70, 0.55],    // F2
            [2810, 110, 0.22],   // F3
            [3750, 130, 0.12]    // F4
        ];
    }
    
    const source = generateGlottalSource(freq, duration, vibFreq, vibDepth, sr);
    const size = source.length;
    const output = new Float32Array(size);
    
    // Apply resonators
    for (const [fc, bw, gain] of formants) {
        const { b, a } = designIIRPeak(fc, fc / bw, sr);
        const filtered = filterBiquad(source, b, a);
        for (let i = 0; i < size; i++) {
            output[i] += filtered[i] * gain;
        }
    }
    
    // Enveloping
    const attackSamples = Math.floor(0.08 * sr);
    const releaseSamples = Math.floor(0.12 * sr);
    for (let i = 0; i < size; i++) {
        let env = 1.0;
        if (i < attackSamples) {
            env = i / attackSamples;
        } else if (i > size - releaseSamples) {
            env = (size - i) / releaseSamples;
        }
        output[i] *= env;
    }
    
    return output;
}

// 5. Sitar Synthesizer (physical/subtractive modeling with non-linear jawari bridge)
function synthSitar(freq: number, duration: number, sr: number): Float32Array {
    const size = Math.floor(sr * duration);
    const signal = new Float32Array(size);
    const numHarmonics = 18;
    const decayBase = 2.5;
    
    for (let k = 1; k <= numHarmonics; k++) {
        const fk = k * freq;
        if (fk > sr / 2) break;
        const ampFactor = 1.0 / Math.pow(k, 1.1);
        const decayRate = decayBase * (1.0 + 0.1 * k);
        
        for (let i = 0; i < size; i++) {
            const t = i / sr;
            const amp = ampFactor * Math.exp(-decayRate * t);
            // Sitar meend glide
            const glide = 0.05 * Math.exp(-40 * t);
            const phase = 2 * Math.PI * fk * (t + glide * t);
            signal[i] += amp * Math.sin(phase);
        }
    }
    
    // Normalize and add jawari buzzing distortion
    let maxSig = 0.0001;
    for (let i = 0; i < size; i++) {
        const absVal = Math.abs(signal[i]);
        if (absVal > maxSig) maxSig = absVal;
    }
    
    // Generate sympathetic vibration string resonances
    const symSig = new Float32Array(size);
    const symFreqs = [freq, freq * 2, freq * 1.5];
    for (const sf of symFreqs) {
        if (sf < sr / 2) {
            for (let i = 0; i < size; i++) {
                const t = i / sr;
                symSig[i] += Math.exp(-0.8 * t) * Math.sin(2 * Math.PI * sf * t);
            }
        }
    }
    
    const output = new Float32Array(size);
    for (let i = 0; i < size; i++) {
        const t = i / sr;
        const normSig = signal[i] / maxSig;
        // Non-linear polynomial waveshaper representing buzzing bridge
        const buzzSig = normSig + 0.25 * Math.pow(normSig, 2) - 0.1 * Math.pow(normSig, 3);
        output[i] = buzzSig * Math.exp(-1.5 * t) + 0.15 * symSig[i];
    }
    
    // Envelope attack/release
    const attackSamples = Math.floor(0.005 * sr);
    const releaseSamples = Math.floor(0.1 * sr);
    for (let i = 0; i < size; i++) {
        let env = 1.0;
        if (i < attackSamples) {
            env = i / attackSamples;
        }
        if (i > size - releaseSamples) {
            env *= (size - i) / releaseSamples;
        }
        output[i] *= env;
    }
    
    return output;
}

// 6. Veena Synthesizer
function synthVeena(freq: number, duration: number, sr: number): Float32Array {
    const size = Math.floor(sr * duration);
    const signal = new Float32Array(size);
    const numHarmonics = 12;
    const decayBase = 1.6;
    
    for (let k = 1; k <= numHarmonics; k++) {
        const fk = k * freq;
        if (fk > sr / 2) break;
        const ampFactor = 1.0 / Math.pow(k, 1.3);
        const decayRate = decayBase * (1.0 + 0.08 * k);
        
        for (let i = 0; i < size; i++) {
            const t = i / sr;
            const amp = ampFactor * Math.exp(-decayRate * t);
            // Veena meend glide
            const glide = 0.04 * Math.exp(-25 * t);
            const phase = 2 * Math.PI * fk * (t + glide * t);
            signal[i] += amp * Math.sin(phase);
        }
    }
    
    // Normalize and add buzz
    let maxSig = 0.0001;
    for (let i = 0; i < size; i++) {
        const absVal = Math.abs(signal[i]);
        if (absVal > maxSig) maxSig = absVal;
    }
    
    const preFiltered = new Float32Array(size);
    for (let i = 0; i < size; i++) {
        const t = i / sr;
        const normSig = signal[i] / maxSig;
        const buzzSig = normSig + 0.12 * Math.pow(normSig, 2);
        preFiltered[i] = buzzSig * Math.exp(-1.2 * t);
    }
    
    // Apply peaking resonators representing the gourd soundboard
    let output = new Float32Array(size);
    try {
        const p1 = designIIRPeak(180.0, 180.0 / 50.0, sr);
        const p2 = designIIRPeak(500.0, 500.0 / 100.0, sr);
        const filtered1 = filterBiquad(preFiltered, p1.b, p1.a);
        const filtered2 = filterBiquad(preFiltered, p2.b, p2.a);
        
        for (let i = 0; i < size; i++) {
            output[i] = 0.6 * preFiltered[i] + 0.25 * filtered1[i] + 0.15 * filtered2[i];
        }
    } catch {
        output = preFiltered;
    }
    
    // Envelope attack/release
    const attackSamples = Math.floor(0.01 * sr);
    const releaseSamples = Math.floor(0.15 * sr);
    for (let i = 0; i < size; i++) {
        let env = 1.0;
        if (i < attackSamples) {
            env = i / attackSamples;
        }
        if (i > size - releaseSamples) {
            env *= (size - i) / releaseSamples;
        }
        output[i] *= env;
    }
    
    return output;
}

// Global cache for loaded voice buffers (stored with their decoded sample rates)
export interface VoiceBuffer {
    samples: Float32Array;
    sampleRate: number;
}
export const voiceBuffers: Record<string, VoiceBuffer> = {};

// Master synthesizer router
export function generateAudioSamples(
    inst: string,
    freq: number,
    duration: number,
    sr: number = 22050,
    swara?: string,
    octave?: number
): Float32Array {
    let samples: Float32Array;
    if (inst === 'Voice (Teacher)' || inst === 'Voice (Student)') {
        const voice = inst === 'Voice (Teacher)' ? 'teacher' : 'student';
        const swaraSym = swara ? swara.replace(/[⁺⁻\s]/g, '') : 'S';
        
        const voiceFreq = freq / 2.0; // Voice octave translation matching notebook
        
        // Determine octave register
        let octFolder = 'mid';
        if (octave !== undefined && octave !== null) {
            if (octave <= 3) octFolder = 'low';
            else if (octave >= 5) octFolder = 'high';
            else octFolder = 'mid';
        } else {
            if (voiceFreq < 100.0) octFolder = 'low';
            else if (voiceFreq > 200.0) octFolder = 'high';
            else octFolder = 'mid';
        }
        
        let noteKey = 'sa';
        let naturalFreq = 145.0;
        
        if (octFolder === 'low') {
            if (swaraSym === 'S') {
                if (voiceFreq > 100.0) { // Top Sa of low scale (Middle Sa)
                    noteKey = 'sa';
                    naturalFreq = 145.0;
                } else { // Mandra Sa
                    noteKey = 'sa2';
                    naturalFreq = 72.5;
                }
            } else {
                const mappingLow: Record<string, [string, number]> = {
                    'R₁': ['ri1', 76.81], 'R₂': ['ri1', 76.81], 'R₃': ['ri1', 76.81],
                    'G₁': ['ga3', 91.34], 'G₂': ['ga3', 91.34], 'G₃': ['ga3', 91.34],
                    'M₁': ['ma1', 96.77], 'M₂': ['ma1', 96.77],
                    'P':  ['pa',  108.63],
                    'D₁': ['da1', 115.09], 'D₂': ['da1', 115.09], 'D₃': ['da1', 115.09],
                    'N₁': ['ni3', 136.84], 'N₂': ['ni3', 136.84], 'N₃': ['ni3', 136.84]
                };
                const pair = mappingLow[swaraSym] || ['sa2', 72.5];
                noteKey = pair[0];
                naturalFreq = pair[1];
            }
        } else if (octFolder === 'high') {
            if (swaraSym === 'S') {
                if (voiceFreq > 380.0) { // Upper Sa of high scale (Ati-tara Sa)
                    noteKey = 'sa2';
                    naturalFreq = 580.0;
                } else { // Tara Sa
                    noteKey = 'sa';
                    naturalFreq = 290.0;
                }
            } else {
                const mappingHigh: Record<string, [string, number]> = {
                    'R₁': ['ri1', 307.24], 'R₂': ['ri1', 307.24], 'R₃': ['ri1', 307.24],
                    'G₁': ['ga3', 365.37], 'G₂': ['ga3', 365.37], 'G₃': ['ga3', 365.37],
                    'M₁': ['ma1', 387.10], 'M₂': ['ma1', 387.10],
                    'P':  ['pa',  434.54],
                    'D₁': ['da1', 460.37], 'D₂': ['da1', 460.37], 'D₃': ['da1', 460.37],
                    'N₁': ['ni3', 547.36], 'N₂': ['ni3', 547.36], 'N₃': ['ni3', 547.36]
                };
                const pair = mappingHigh[swaraSym] || ['sa', 290.0];
                noteKey = pair[0];
                naturalFreq = pair[1];
            }
        } else { // 'mid'
            if (swaraSym === 'S') {
                if (voiceFreq > 190.0) {
                    noteKey = 'sa2';
                    naturalFreq = 290.0;
                } else {
                    noteKey = 'sa';
                    naturalFreq = 145.0;
                }
            } else {
                const mappingMid: Record<string, [string, number]> = {
                    'R₁': ['ri1', 153.62], 'R₂': ['ri1', 153.62], 'R₃': ['ri1', 153.62],
                    'G₁': ['ga3', 182.69], 'G₂': ['ga3', 182.69], 'G₃': ['ga3', 182.69],
                    'M₁': ['ma1', 193.55], 'M₂': ['ma1', 193.55],
                    'P':  ['pa',  217.27],
                    'D₁': ['da1', 230.19], 'D₂': ['da1', 230.19], 'D₃': ['da1', 230.19],
                    'N₁': ['ni3', 273.68], 'N₂': ['ni3', 273.68], 'N₃': ['ni3', 273.68]
                };
                const pair = mappingMid[swaraSym] || ['sa', 145.0];
                noteKey = pair[0];
                naturalFreq = pair[1];
            }
        }
        
        const primaryKey = `${voice}_${octFolder}_${noteKey}`;
        const fallbackKey = `${voice}_${noteKey}`;
        const voiceBuffer = voiceBuffers[primaryKey] || voiceBuffers[fallbackKey];
        
        if (voiceBuffer && voiceBuffer.samples.length > 0) {
            const inputSamples = voiceBuffer.samples;
            const ratio = (voiceFreq / naturalFreq) * (voiceBuffer.sampleRate / sr);
            const targetLen = Math.floor(sr * duration);
            samples = new Float32Array(targetLen);
            
            // Linear interpolation resampling
            for (let i = 0; i < targetLen; i++) {
                const pos = i * ratio;
                const idx = Math.floor(pos);
                const frac = pos - idx;
                if (idx >= inputSamples.length - 1) {
                    break;
                }
                samples[i] = (1.0 - frac) * inputSamples[idx] + frac * inputSamples[idx + 1];
            }
            
            // Apply linear decay envelope at the end to prevent clicks
            const fadeLen = Math.min(1100, Math.floor(samples.length / 10));
            for (let i = 0; i < fadeLen; i++) {
                const idx = samples.length - fadeLen + i;
                samples[idx] *= (fadeLen - i) / fadeLen;
            }
        } else {
            // Fallback to piano if sample is not loaded yet
            samples = synthPiano(freq, duration, sr);
        }
    } else if (inst === 'Piano') {
        samples = synthPiano(freq, duration, sr);
    } else if (inst === 'Violin') {
        samples = synthViolin(freq, duration, sr);
    } else if (inst === 'Human Male Voice') {
        samples = synthVoice(freq, duration, 'male', sr);
    } else if (inst === 'Human Female Voice') {
        samples = synthVoice(freq, duration, 'female', sr);
    } else if (inst === 'Sitar') {
        samples = synthSitar(freq, duration, sr);
    } else if (inst === 'Veena') {
        samples = synthVeena(freq, duration, sr);
    } else {
        samples = synthPiano(freq, duration, sr);
    }
    
    // Final scaling to prevent clipping
    let maxVal = 0.0001;
    for (let i = 0; i < samples.length; i++) {
        const absVal = Math.abs(samples[i]);
        if (absVal > maxVal) maxVal = absVal;
    }
    
    const scaled = new Float32Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        scaled[i] = (samples[i] / maxVal) * 0.75;
    }
    
    return scaled;
}
