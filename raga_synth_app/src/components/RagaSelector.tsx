import React from 'react';
import { ragaByNumber, getScale, RagaDetails } from '../audio/RagaData';

interface RagaSelectorProps {
  ragaNum: number;
  setRagaNum: (num: number) => void;
}

// Kannada and Devanagari translation maps for scale swaras
const swaraKannadaMap: Record<string, string> = {
  'S': 'ಸ', 'R₁': 'ರಿ₁', 'R₂': 'ರಿ₂', 'R₃': 'ರಿ₃',
  'G₁': 'ಗ₁', 'G₂': 'ಗ₂', 'G₃': 'ಗ₃',
  'M₁': 'ಮ₁', 'M₂': 'ಮ₂', 'P': 'ಪ',
  'D₁': 'ದ₁', 'D₂': 'ದ₂', 'D₃': 'ದ₃',
  'N₁': 'ನಿ₁', 'N₂': 'ನಿ₂', 'N₃': 'ನಿ₃'
};

const swaraDevanagariMap: Record<string, string> = {
  'S': 'स', 'R₁': 'रि₁', 'R₂': 'रि₂', 'R₃': 'रि₃',
  'G₁': 'ग₁', 'G₂': 'ग₂', 'G₃': 'ग₃',
  'M₁': 'म₁', 'M₂': 'म₂', 'P': 'प',
  'D₁': 'द₁', 'D₂': 'द₂', 'D₃': 'द₃',
  'N₁': 'नि₁', 'N₂': 'नि₂', 'N₃': 'नि₃'
};

const refCarnatic16 = ['S', 'R₁', 'R₂', 'R₃', 'G₁', 'G₂', 'G₃', 'M₁', 'M₂', 'P', 'D₁', 'D₂', 'D₃', 'N₁', 'N₂', 'N₃'];
const refWestern16 = ['C', 'C#', 'D', 'D#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'A', 'A#', 'B'];

export const RagaSelector: React.FC<RagaSelectorProps> = ({ ragaNum, setRagaNum }) => {
  const raga: RagaDetails = ragaByNumber[ragaNum] || {
    IAST: 'Kanakāngi',
    kannada: 'ಕನಕಾನ್ಗಿ',
    devanagari: 'कनकान्गि',
    chakra: 'Indu'
  };

  const scaleStr = getScale(ragaNum);
  const scaleNotes = scaleStr.split(' ');

  const kannadaScale = scaleNotes.map(s => swaraKannadaMap[s] || s);
  const devanagariScale = scaleNotes.map(s => swaraDevanagariMap[s] || s);

  const westernNotes = scaleNotes.map(s => {
    const idx = refCarnatic16.indexOf(s);
    return idx !== -1 ? refWestern16[idx] : s;
  });

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (val >= 1 && val <= 72) {
      setRagaNum(val);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value, 10);
    if (isNaN(val)) return;
    if (val < 1) val = 1;
    if (val > 72) val = 72;
    setRagaNum(val);
  };

  return (
    <div>
      <div className="control-group">
        <div className="slider-container">
          <span className="slider-label">Select Raga:</span>
          <input
            type="range"
            min="1"
            max="72"
            value={ragaNum}
            onChange={handleSliderChange}
          />
          <input
            type="number"
            min="1"
            max="72"
            className="number-input"
            value={ragaNum}
            onChange={handleTextChange}
          />
        </div>
      </div>

      <div className="raga-card">
        <div className="raga-title">
          Melakarta Raga #{ragaNum}: {raga.IAST}
        </div>
        <table className="raga-table">
          <tbody>
            <tr>
              <td>IAST Name:</td>
              <td style={{ fontWeight: 600 }}>{raga.IAST}</td>
            </tr>
            <tr>
              <td>Devanagari:</td>
              <td style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>{raga.devanagari}</td>
            </tr>
            <tr>
              <td>Kannada:</td>
              <td style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>{raga.kannada}</td>
            </tr>
            <tr>
              <td>Chakra:</td>
              <td style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{raga.chakra}</td>
            </tr>
          </tbody>
        </table>

        <div className="scale-box">
          <div className="scale-row">
            <strong>English (IAST):</strong>
            <span className="scale-swaras">{scaleNotes.join(' ')}</span>
          </div>
          <div className="scale-row">
            <strong>Kannada (ಕನ್ನಡ):</strong>
            <span className="scale-swaras" style={{ fontFamily: "'Noto Sans Kannada', sans-serif" }}>
              {kannadaScale.join(' ')}
            </span>
          </div>
          <div className="scale-row">
            <strong>Devanagari (देवनागरी):</strong>
            <span className="scale-swaras" style={{ fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
              {devanagariScale.join(' ')}
            </span>
          </div>
          <div className="scale-row" style={{ marginTop: '8px' }}>
            <strong>Western notes:</strong>
            <span className="scale-swaras" style={{ color: 'var(--text-accent)', fontSize: '1rem', letterSpacing: '1px' }}>
              {westernNotes.join(' ')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
