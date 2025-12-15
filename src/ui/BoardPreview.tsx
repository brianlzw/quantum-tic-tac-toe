import type { SquareId } from '../game/types';

interface BoardPreviewProps {
  highlightedSquares?: SquareId[];
  size?: number;
  showLabels?: boolean;
}

export default function BoardPreview({ highlightedSquares = [], size = 120, showLabels = false }: BoardPreviewProps) {
  const cellSize = size / 3;
  const strokeWidth = 2;
  const padding = 8;
  
  const squareNames = ['TL', 'TC', 'TR', 'ML', 'C', 'MR', 'BL', 'BC', 'BR'];
  
  return (
    <div className="board-preview-container">
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
        
        {/* Highlighted cells */}
        {highlightedSquares.map((square) => {
          const row = Math.floor(square / 3);
          const col = square % 3;
          const x = padding + col * cellSize;
          const y = padding + row * cellSize;
          
          return (
            <g key={square}>
              <rect
                x={x}
                y={y}
                width={cellSize}
                height={cellSize}
                fill="rgba(0, 122, 255, 0.15)"
                stroke="#007AFF"
                strokeWidth={2.5}
                rx={3}
              />
              {showLabels && (
                <text
                  x={x + cellSize / 2}
                  y={y + cellSize / 2 + 4}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#007AFF"
                  fontWeight="600"
                >
                  {squareNames[square]}
                </text>
              )}
            </g>
          );
        })}
        
        {/* Connection line if two squares are highlighted */}
        {highlightedSquares.length === 2 && (
          <line
            x1={padding + (highlightedSquares[0] % 3) * cellSize + cellSize / 2}
            y1={padding + Math.floor(highlightedSquares[0] / 3) * cellSize + cellSize / 2}
            x2={padding + (highlightedSquares[1] % 3) * cellSize + cellSize / 2}
            y2={padding + Math.floor(highlightedSquares[1] / 3) * cellSize + cellSize / 2}
            stroke="#007AFF"
            strokeWidth={2}
            strokeDasharray="4 4"
            opacity={0.6}
          />
        )}
      </svg>
    </div>
  );
}

