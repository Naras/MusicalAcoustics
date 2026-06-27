import React, { useState } from 'react';
import { Play, Shuffle } from 'lucide-react';

interface SequencerProps {
  onPlayScale: (type: 'Arohana' | 'Avarohana' | 'Arohana-Avarohana' | 'FullSequence') => void;
  onPlayRandomPhrase: (length: number) => void;
}

export const Sequencer: React.FC<SequencerProps> = ({ onPlayScale, onPlayRandomPhrase }) => {
  const [phraseLength, setPhraseLength] = useState(8);

  return (
    <div>
      {/* Scale Playback Section */}
      <div className="control-group">
        <h4 style={{ margin: '0 0 12px 0' }}>Scale Playback:</h4>
        <div className="action-row" style={{ marginBottom: '15px' }}>
          <button className="action-btn secondary" onClick={() => onPlayScale('Arohana')}>
            <Play size={15} /> Arohana
          </button>
          <button className="action-btn secondary" onClick={() => onPlayScale('Avarohana')}>
            <Play size={15} /> Avarohana
          </button>
          <button className="action-btn primary" onClick={() => onPlayScale('Arohana-Avarohana')}>
            <Play size={15} /> Combination
          </button>
          <button className="action-btn accent" onClick={() => onPlayScale('FullSequence')}>
            <Play size={15} /> Play Full Practice
          </button>
        </div>
      </div>

      {/* Random phrase generator Section */}
      <div className="control-group">
        <h4 style={{ margin: '0 0 12px 0' }}>Random Phrase Generator:</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
          <div className="slider-container" style={{ flexGrow: 1, marginBottom: 0, minWidth: '220px' }}>
            <span className="slider-label" style={{ minWidth: '95px' }}>Phrase Notes:</span>
            <input
              type="range"
              min="4"
              max="16"
              value={phraseLength}
              onChange={(e) => setPhraseLength(parseInt(e.target.value, 10))}
            />
            <span style={{ fontWeight: 'bold', width: '20px', textAlign: 'center' }}>{phraseLength}</span>
          </div>
          <button 
            className="action-btn" 
            style={{ backgroundColor: '#dc2626', color: 'white', minWidth: '170px' }}
            onClick={() => onPlayRandomPhrase(phraseLength)}
          >
            <Shuffle size={15} /> Play Random Phrase
          </button>
        </div>
      </div>
    </div>
  );
};
