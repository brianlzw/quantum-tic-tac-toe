import { useState } from 'react';
import type { GameState, SquareId } from '../game/types';
import GridPreview from './GridPreview';

interface CycleResolutionPromptProps {
  gameState: GameState;
  onResolve: (endpoint: SquareId) => void;
  onHoverEndpoint?: (endpoint: SquareId | null) => void;
}

export default function CycleResolutionPrompt({ 
  gameState, 
  onResolve,
  onHoverEndpoint 
}: CycleResolutionPromptProps) {
  const [hoveredEndpoint, setHoveredEndpoint] = useState<SquareId | null>(null);

  const handleHover = (endpoint: SquareId | null) => {
    setHoveredEndpoint(endpoint);
    onHoverEndpoint?.(endpoint);
  };

  if (!gameState.pendingCycle) return null;

  const lastMove = gameState.moves.find(m => m.id === gameState.pendingCycle!.cycleMoveId);
  if (!lastMove) return null;

  const endpoints: SquareId[] = [lastMove.a, lastMove.b];

  return (
    <div className="cycle-prompt-inline-container">
      <div className="endpoint-buttons-inline">
        {endpoints.map(endpoint => {
          const row = Math.floor(endpoint / 3) + 1;
          const col = (endpoint % 3) + 1;
          return (
            <button
              key={endpoint}
              className={`endpoint-button-inline ${hoveredEndpoint === endpoint ? 'hovered' : ''}`}
              onClick={() => onResolve(endpoint)}
              onMouseEnter={() => handleHover(endpoint)}
              onMouseLeave={() => handleHover(null)}
            >
              <div className="endpoint-grid-preview">
                <GridPreview highlightedSquare={endpoint} size={50} />
              </div>
              <span className="endpoint-label">Square ({row}, {col})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

