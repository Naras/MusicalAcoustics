import React from 'react';
import { getScale } from '../audio/RagaData';

interface KeyboardProps {
  ragaNum: number;
  onStartSwara: (swara: string, octave: number) => void;
  onStopSwara: (swara: string, octave: number) => void;
}

export const Keyboard: React.FC<KeyboardProps> = ({ ragaNum, onStartSwara, onStopSwara }) => {
  const scaleStr = getScale(ragaNum);
  const swaras = scaleStr.split(' ');
  const octavesList = [3, 4, 5];

  return (
    <div className="control-group">
      <h4 style={{ margin: '0 0 12px 0' }}>Play Individual Scale Swaras (3 Octaves):</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {octavesList.map(oct => {
          // For each octave, we render the 7 swaras
          const notes = swaras.map(s => ({ swara: s, playOct: oct, label: s }));
          
          // Only append the S⁺ peak note to the final octave row to avoid duplicates
          if (oct === 5) {
            notes.push({ swara: 'S', playOct: oct + 1, label: 'S⁺' });
          }

          return (
            <div key={oct} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Octave {oct} Range:
              </div>
              <div className="swara-grid" style={{ margin: 0 }}>
                {notes.map((n, index) => {
                  const isHigh = n.playOct > oct;
                  return (
                    <button
                      key={`${n.swara}-${n.playOct}-${index}`}
                      className={`swara-key ${isHigh ? 'high-sa' : ''}`}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        onStartSwara(n.swara, n.playOct);
                      }}
                      onPointerUp={(e) => {
                        e.preventDefault();
                        onStopSwara(n.swara, n.playOct);
                      }}
                      onPointerLeave={(e) => {
                        e.preventDefault();
                        onStopSwara(n.swara, n.playOct);
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                      }}
                      title={`Play ${n.label} in Octave ${n.playOct}`}
                      style={{ touchAction: 'none' }} // Prevents zoom/pan gestures on mobile
                    >
                      {n.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
