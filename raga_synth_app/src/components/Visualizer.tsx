import React, { useRef, useEffect } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  theme: 'dark-glass' | 'classical-acoustic';
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser, theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    
    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const bufferLength = analyser ? analyser.frequencyBinCount : 256;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      
      const W = canvas.width;
      const H = canvas.height;
      
      const isDark = theme === 'dark-glass';
      const lineColor = isDark ? '#06b6d4' : '#8c2d19';
      const bgColor = isDark ? 'rgba(17, 24, 39, 0.35)' : 'rgba(245, 238, 223, 0.35)';
      const gridColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)';
      
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      // Draw grid lines
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let y = H / 4; y < H; y += H / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      // Vertical grid lines
      for (let x = W / 8; x < W; x += W / 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      if (analyser) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        // Generate a gentle sine wave standby animation when idle
        const time = Date.now() * 0.004;
        for (let i = 0; i < bufferLength; i++) {
          const angle = (i / bufferLength) * Math.PI * 4 + time;
          dataArray[i] = 128 + Math.sin(angle) * 8;
        }
      }

      ctx.lineWidth = 3;
      ctx.strokeStyle = lineColor;
      
      if (isDark) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();

      const sliceWidth = W / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * H) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(W, H / 2);
      ctx.stroke();
      
      ctx.shadowBlur = 0; // Reset
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [analyser, theme]);

  return (
    <div className="visualizer-container">
      <canvas ref={canvasRef} className="visualizer-canvas" />
    </div>
  );
};
