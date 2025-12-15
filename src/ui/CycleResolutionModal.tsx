import { useState } from 'react';
import type { GameState, SquareId } from '../game/types';

interface CycleResolutionModalProps {
  gameState: GameState;
  onResolve: (endpoint: SquareId) => void;
  onHoverEndpoint?: (endpoint: SquareId | null) => void;
}

export default function CycleResolutionModal({ gameState, onResolve, onHoverEndpoint }: CycleResolutionModalProps) {
  const [hoveredEndpoint, setHoveredEndpoint] = useState<SquareId | null>(null);

  const handleHover = (endpoint: SquareId | null) => {
    setHoveredEndpoint(endpoint);
    onHoverEndpoint?.(endpoint);
  };

  if (!gameState.pendingCycle) return null;

  const lastMove = gameState.moves.find(m => m.id === gameState.pendingCycle!.cycleMoveId);
  if (!lastMove) return null;

  const endpoints: SquareId[] = [lastMove.a, lastMove.b];

  const getSquarePosition = (square: SquareId) => {
    const row = Math.floor(square / 3);
    const col = square % 3;
    return { row, col };
  };

  return (
    <div className="cycle-modal-overlay">
      <div className="cycle-modal">
        <h3>Cycle Detected!</h3>
        <p>
          Player <strong>{gameState.pendingCycle.chooser}</strong>, choose how to collapse the cycle:
        </p>
        <p className="instruction">
          Click one of the two squares from the last move to determine the collapse:
        </p>
        <div className="endpoint-options">
          {endpoints.map(endpoint => {
            const { row, col } = getSquarePosition(endpoint);
            return (
              <button
                key={endpoint}
                className={`endpoint-button ${hoveredEndpoint === endpoint ? 'hovered' : ''}`}
                onClick={() => onResolve(endpoint)}
                onMouseEnter={() => handleHover(endpoint)}
                onMouseLeave={() => handleHover(null)}
              >
                Square ({row + 1}, {col + 1})
              </button>
            );
          })}
        </div>
        <div className="board-preview">
          <p>Click on one of the highlighted squares on the board, or use the buttons above to choose the collapse.</p>
        </div>
      </div>
    </div>
  );
}

