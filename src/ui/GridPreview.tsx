import type { SquareId } from '../game/types';

interface GridPreviewProps {
  highlightedSquare: SquareId;
  size?: number;
}

export default function GridPreview({ highlightedSquare, size = 60 }: GridPreviewProps) {
  const cellSize = size / 3;
  const strokeWidth = 1.5;
  const padding = 4;
  
  const row = Math.floor(highlightedSquare / 3);
  const col = highlightedSquare % 3;
  
  const highlightX = padding + col * cellSize;
  const highlightY = padding + row * cellSize;

  return (
    <svg 
      width={size + padding * 2} 
      height={size + padding * 2} 
      viewBox={`0 0 ${size + padding * 2} ${size + padding * 2}`}
      style={{ display: 'block' }}
    >
      {/* Grid lines */}
      <line 
        x1={padding + cellSize} 
        y1={padding} 
        x2={padding + cellSize} 
        y2={size + padding} 
        stroke="#86868b" 
        strokeWidth={strokeWidth}
      />
      <line 
        x1={padding + cellSize * 2} 
        y1={padding} 
        x2={padding + cellSize * 2} 
        y2={size + padding} 
        stroke="#86868b" 
        strokeWidth={strokeWidth}
      />
      <line 
        x1={padding} 
        y1={padding + cellSize} 
        x2={size + padding} 
        y2={padding + cellSize} 
        stroke="#86868b" 
        strokeWidth={strokeWidth}
      />
      <line 
        x1={padding} 
        y1={padding + cellSize * 2} 
        x2={size + padding} 
        y2={padding + cellSize * 2} 
        stroke="#86868b" 
        strokeWidth={strokeWidth}
      />
      
      {/* Highlighted cell */}
      <rect
        x={highlightX}
        y={highlightY}
        width={cellSize}
        height={cellSize}
        fill="rgba(0, 122, 255, 0.2)"
        stroke="#007AFF"
        strokeWidth={2}
        rx={2}
      />
    </svg>
  );
}

