import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Volume2, Info } from 'lucide-react';
import { RagaSelector } from './components/RagaSelector';
import { Visualizer } from './components/Visualizer';
import { Keyboard } from './components/Keyboard';
import { Sequencer } from './components/Sequencer';
import { getSwaraFrequency, generateAudioSamples } from './audio/AudioEngine';
import { ragaByNumber, getScale } from './audio/RagaData';
import './styles/theme.css';

export default function App() {
  const [theme, setTheme] = useState<'dark-glass' | 'classical-acoustic'>('dark-glass');
  const [ragaNum, setRagaNum] = useState<number>(29); // Dheerasankarabharanam (Major Scale)
  const [instrument, setInstrument] = useState<string>('Piano');
  const [octave, setOctave] = useState<number>(4);
  const [duration, setDuration] = useState<number>(1.2);
  const [outputText, setOutputText] = useState<string>(
    'Welcome to Carnatic Melakarta Raga Synthesizer!\nInteract with any control above to synthesize classical raga scales.'
  );

  // Web Audio Context References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Clean up AudioContext on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Initialize Web Audio context
  const getAudioContext = (): { ctx: AudioContext; analyser: AnalyserNode } => {
    let ctx = audioCtxRef.current;
    let ana = analyserRef.current;

    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      ana = ctx.createAnalyser();
      ana.fftSize = 256;
      analyserRef.current = ana;

      ana.connect(ctx.destination);
      setAnalyser(ana);
    }

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    return { ctx, analyser: ana! };
  };

  // Helper to concatenate Float32Arrays for sequential play
  const concatenateArrays = (arrays: Float32Array[]): Float32Array => {
    let totalLength = 0;
    for (const arr of arrays) {
      totalLength += arr.length;
    }
    const result = new Float32Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
      result.set(arr, offset);
      offset += arr.length;
    }
    return result;
  };

  // Plays a synthesized sample buffer via Web Audio API
  const playSamples = (samples: Float32Array, sampleRate = 22050) => {
    try {
      const { ctx, analyser: ana } = getAudioContext();

      // Stop previous active source
      if (activeSourceRef.current) {
        try {
          activeSourceRef.current.stop();
        } catch {
          // Ignore if already stopped
        }
      }

      const buffer = ctx.createBuffer(1, samples.length, sampleRate);
      buffer.getChannelData(0).set(samples);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ana);
      source.start();

      activeSourceRef.current = source;
    } catch (err) {
      console.error('Audio playback error:', err);
    }
  };

interface PlayingNote {
  swara: string;
  octave: number;
  startTime: number;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  hrasva: number;
}

  const activeNoteRef = useRef<PlayingNote | null>(null);

  // Play a single swara with persistent hold and release (quantized to hrasva matra)
  const handleStartSwara = (swara: string, playOctave: number) => {
    const { ctx, analyser: ana } = getAudioContext();

    // Stop any existing active note immediately
    if (activeNoteRef.current) {
      const active = activeNoteRef.current;
      try {
        active.source.stop();
      } catch {}
      activeNoteRef.current = null;
    }

    const freq = getSwaraFrequency(swara, playOctave);
    const hrasva = duration; // The duration slider acts as the base hrasva matra

    // Generate a long buffer for persistent holding
    const maxHoldDuration = 10.0;
    const samples = generateAudioSamples(instrument, freq, maxHoldDuration, 22050);

    const buffer = ctx.createBuffer(1, samples.length, 22050);
    buffer.getChannelData(0).set(samples);

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ana);

    const startTime = ctx.currentTime;
    source.start(startTime);

    activeNoteRef.current = {
      swara,
      octave: playOctave,
      startTime,
      source,
      gainNode,
      hrasva
    };

    setOutputText(
      `Playing Note: ${swara} (Octave ${playOctave}) (${freq.toFixed(2)} Hz)\n` +
      `Instrument: ${instrument} | Hrasva Matra: ${hrasva.toFixed(1)}s | Status: HOLDING...`
    );
  };

  const handleStopSwara = (swara: string, playOctave: number) => {
    const note = activeNoteRef.current;
    if (!note || note.swara !== swara || note.octave !== playOctave) return;

    const { ctx } = getAudioContext();
    const now = ctx.currentTime;
    const elapsed = now - note.startTime;

    // Quantize elapsed duration to the next integer multiple of the hrasva matra
    let multiples = Math.ceil(elapsed / note.hrasva);
    if (multiples < 1) multiples = 1;
    const targetDuration = multiples * note.hrasva;
    const stopTime = note.startTime + targetDuration;

    // Smoothly fade-out before stopping to prevent clicks
    const fadeTime = 0.08; // 80ms fade out
    const fadeStartTime = Math.max(now, stopTime - fadeTime);

    note.gainNode.gain.setValueAtTime(1.0, fadeStartTime);
    note.gainNode.gain.linearRampToValueAtTime(0.001, stopTime);

    try {
      note.source.stop(stopTime);
    } catch {}

    activeNoteRef.current = null;

    const freq = getSwaraFrequency(swara, playOctave);
    setOutputText(
      `Played Note: ${swara} (Octave ${playOctave}) (${freq.toFixed(2)} Hz)\n` +
      `Instrument: ${instrument} | Matras: ${multiples}x (${targetDuration.toFixed(2)}s) | Status: COMPLETED`
    );
  };

  // Play scale sequentially
  const handlePlayScale = (orderType: 'Arohana' | 'Avarohana' | 'Arohana-Avarohana' | 'FullSequence') => {
    const scaleStr = getScale(ragaNum);
    const swaras = scaleStr.split(' ');
    const ragaName = ragaByNumber[ragaNum]?.IAST || '';

    const sr = 22050;
    const aro = swaras.map(s => ({ s, oct: octave }));
    const extra = { s: 'S', oct: octave + 1 };
    const avar = [...swaras].reverse().map(s => ({ s, oct: octave }));

    let seq: { s: string; oct: number }[] = [];
    let label = '';
    let displaySwaras: string[] = [];

    if (orderType === 'Arohana') {
      seq = [...aro, extra];
      label = 'Arohana (Ascending)';
    } else if (orderType === 'Avarohana') {
      seq = [extra, ...avar];
      label = 'Avarohana (Descending)';
    } else if (orderType === 'Arohana-Avarohana') {
      seq = [...aro, extra, extra, ...avar];
      label = 'Arohana-Avarohana (Combination)';
    } else if (orderType === 'FullSequence') {
      label = 'Full Scale Practice (Arohana → Avarohana → Combination)';
    }

    if (orderType !== 'FullSequence') {
      displaySwaras = seq.map(item => item.s + (item.oct > octave ? '⁺' : ''));
      setOutputText(
        `🎵 Synthesizing Raga #${ragaNum} (${ragaName}) - ${label}\n` +
        `Swaras: ${displaySwaras.join(' → ')}\n` +
        `Instrument: ${instrument} | Octave: ${octave} | Duration: ${duration}s`
      );

      const noteSignals = seq.map(item => {
        const freq = getSwaraFrequency(item.s, item.oct);
        return generateAudioSamples(instrument, freq, duration, sr);
      });
      const combined = concatenateArrays(noteSignals);
      playSamples(combined);
    } else {
      // Full Sequence: Arohana + Pause + Avarohana + Pause + Combination
      const seqAro = [...aro, extra];
      const seqAvar = [extra, ...avar];
      const seqComb = [...aro, extra, extra, ...avar];

      setOutputText(
        `🎵 Synthesizing Raga #${ragaNum} (${ragaName}) - ${label}\n` +
        `Sequence parts: Arohana, Avarohana, Arohana-Avarohana\n` +
        `Instrument: ${instrument} | Octave: ${octave} | Duration: ${duration}s`
      );

      const silence = new Float32Array(Math.floor(sr * 0.4)); // 0.4s pause

      const sigAro = concatenateArrays(seqAro.map(item => generateAudioSamples(instrument, getSwaraFrequency(item.s, item.oct), duration, sr)));
      const sigAvar = concatenateArrays(seqAvar.map(item => generateAudioSamples(instrument, getSwaraFrequency(item.s, item.oct), duration, sr)));
      const sigComb = concatenateArrays(seqComb.map(item => generateAudioSamples(instrument, getSwaraFrequency(item.s, item.oct), duration, sr)));

      const combined = concatenateArrays([sigAro, silence, sigAvar, silence, sigComb]);
      playSamples(combined);
    }
  };

  // Play random phrase
  const handlePlayRandomPhrase = (length: number) => {
    const scaleStr = getScale(ragaNum);
    const swaras = scaleStr.split(' ');
    const ragaName = ragaByNumber[ragaNum]?.IAST || '';

    // Note pool: the 7 scale notes + high S
    const pool = [...swaras.map(s => ({ s, oct: octave })), { s: 'S', oct: octave + 1 }];
    const seq: { s: string; oct: number }[] = [];
    
    for (let i = 0; i < length; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      seq.push(pool[idx]);
    }

    const displaySwaras = seq.map(item => item.s + (item.oct > octave ? '⁺' : ''));
    setOutputText(
      `🎲 Random Phrase in Raga #${ragaNum} (${ragaName}):\n` +
      `Phrase: ${displaySwaras.join(' → ')}\n` +
      `Setting: ${instrument} | Octave: ${octave} | Duration: ${duration}s | Length: ${length} notes`
    );

    const sr = 22050;
    const noteSignals = seq.map(item => {
      const freq = getSwaraFrequency(item.s, item.oct);
      return generateAudioSamples(instrument, freq, duration, sr);
    });
    const combined = concatenateArrays(noteSignals);
    playSamples(combined);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark-glass' ? 'classical-acoustic' : 'dark-glass'));
  };

  return (
    <div className={`app-container theme-${theme}`}>
      <main className="main-card">
        {/* Header and Theme Toggle */}
        <header className="theme-toggle-header">
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Volume2 size={24} style={{ color: 'var(--text-accent)' }} />
              Melakarta Raga Player
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Interactive Browser Synthesizer
            </p>
          </div>
          <button
            className="toggle-btn"
            onClick={toggleTheme}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            title="Switch Theme"
          >
            {theme === 'dark-glass' ? (
              <>
                <Sun size={16} /> Classical Theme
              </>
            ) : (
              <>
                <Moon size={16} /> Cyber Theme
              </>
            )}
          </button>
        </header>

        {/* Local Synthesis & Instrument controls */}
        <section className="control-group">
          <h4 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={16} />
            Instrument & Synthesizer Settings
          </h4>
          
          {/* Instrument ToggleButtons */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>Instrument:</div>
            <div className="toggle-row">
              {['Piano', 'Violin', 'Human Male Voice', 'Human Female Voice', 'Sitar', 'Veena'].map(inst => (
                <button
                  key={inst}
                  className={`toggle-btn ${instrument === inst ? 'active' : ''}`}
                  onClick={() => setInstrument(inst)}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>

          {/* Octave ToggleButtons */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>Base Octave:</div>
            <div className="toggle-row">
              {[3, 4, 5].map(octVal => (
                <button
                  key={octVal}
                  className={`toggle-btn ${octave === octVal ? 'active' : ''}`}
                  onClick={() => setOctave(octVal)}
                >
                  Octave {octVal}
                </button>
              ))}
            </div>
          </div>

          {/* Note Duration Slider */}
          <div className="slider-container">
            <span className="slider-label">Note Duration:</span>
            <input
              type="range"
              min="0.2"
              max="3.0"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
            />
            <span style={{ fontWeight: 'bold', width: '35px', textAlign: 'right' }}>
              {duration.toFixed(1)}s
            </span>
          </div>
        </section>

        {/* Raga selector controls & data card */}
        <RagaSelector ragaNum={ragaNum} setRagaNum={setRagaNum} />

        {/* Real-time Oscilloscope canvas */}
        <div style={{ margin: '15px 0 5px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>
          Real-time Oscilloscope:
        </div>
        <Visualizer analyser={analyser} theme={theme} />

        {/* Interactive note grid keyboard */}
        <Keyboard ragaNum={ragaNum} onStartSwara={handleStartSwara} onStopSwara={handleStopSwara} />

        {/* Sequencer Sequential / Phrase actions */}
        <Sequencer onPlayScale={handlePlayScale} onPlayRandomPhrase={handlePlayRandomPhrase} />

        {/* Output console trace log */}
        <div className="output-text-panel">
          <span className="output-prompt">synthesizer_output$ </span>
          {outputText}
        </div>
      </main>
    </div>
  );
}
