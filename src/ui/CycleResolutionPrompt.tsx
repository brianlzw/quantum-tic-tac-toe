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
  const [selectedEndpoint, setSelectedEndpoint] = useState<SquareId | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const handleHover = (endpoint: SquareId | null) => {
    setHoveredEndpoint(endpoint);
    onHoverEndpoint?.(endpoint);
  };

  const handleTouchStart = (endpoint: SquareId) => {
    setHoveredEndpoint(endpoint);
    onHoverEndpoint?.(endpoint);
  };

  const handleTouchEnd = () => {
    // Keep preview visible for a moment after touch ends
    setTimeout(() => {
      setHoveredEndpoint(null);
      onHoverEndpoint?.(null);
    }, 500);
  };

  const handleClick = (endpoint: SquareId) => {
    if (isMobile) {
      // On mobile, toggle preview instead of resolving
      if (selectedEndpoint === endpoint) {
        // Unclick to remove preview
        setSelectedEndpoint(null);
        setHoveredEndpoint(null);
        onHoverEndpoint?.(null);
      } else {
        // Click to preview
        setSelectedEndpoint(endpoint);
        setHoveredEndpoint(endpoint);
        onHoverEndpoint?.(endpoint);
      }
    } else {
      // On desktop, resolve immediately
      onResolve(endpoint);
    }
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
              className={`endpoint-button-inline ${hoveredEndpoint === endpoint ? 'hovered' : ''} ${selectedEndpoint === endpoint ? 'selected' : ''}`}
              onClick={() => handleClick(endpoint)}
              onMouseEnter={() => !isMobile && handleHover(endpoint)}
              onMouseLeave={() => !isMobile && handleHover(null)}
              onTouchStart={() => handleTouchStart(endpoint)}
              onTouchEnd={handleTouchEnd}
            >
              <div className="endpoint-grid-preview">
                <GridPreview highlightedSquare={endpoint} size={50} />
              </div>
              <span className="endpoint-label mobile-hidden">Square ({row}, {col})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

