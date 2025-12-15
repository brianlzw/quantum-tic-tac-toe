import type { SquareId } from '../game/types';

interface WinningLineProps {
  line: SquareId[];
}

export default function WinningLine({ line }: WinningLineProps) {
  // Validate line array
  if (!line || line.length !== 3) {
    return null;
  }

  const getSquarePosition = (square: SquareId) => {
    const row = Math.floor(square / 3);
    const col = square % 3;
    const size = 150; // Square size in pixels
    const gap = 8; // Gap between squares (matches board gap)
    const padding = 8; // Board padding
    const x = padding + col * (size + gap) + size / 2;
    const y = padding + row * (size + gap) + size / 2;
    return { x, y };
  };

  try {
    const pos1 = getSquarePosition(line[0]);
    const pos2 = getSquarePosition(line[2]);

    return (
      <svg 
        className="winning-line-overlay" 
        viewBox="0 0 466 466" 
        preserveAspectRatio="none"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}
      >
        <line
          x1={pos1.x}
          y1={pos1.y}
          x2={pos2.x}
          y2={pos2.y}
          stroke="#2e7d32"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.9"
          className="winning-line"
        />
      </svg>
    );
  } catch (error) {
    console.error('Error rendering winning line:', error);
    return null;
  }
}

