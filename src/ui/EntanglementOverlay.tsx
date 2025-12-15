import { useMemo } from 'react';
import type { GameState, SquareId } from '../game/types';

interface EntanglementOverlayProps {
  gameState: GameState;
  hoveredEntanglementId?: string | null;
}

export default function EntanglementOverlay({ gameState, hoveredEntanglementId = null }: EntanglementOverlayProps) {
  const lines = useMemo(() => {
    const uncollapsedMoves = gameState.moves.filter(m => m.collapsedTo === undefined);
    return uncollapsedMoves.map(move => ({
      id: move.id,
      a: move.a,
      b: move.b,
    }));
  }, [gameState.moves]);

  const getSquarePosition = (square: SquareId) => {
    const row = Math.floor(square / 3);
    const col = square % 3;
    const size = 150; // Square size in pixels
    const gap = 6; // Gap between squares
    const x = col * (size + gap) + size / 2;
    const y = row * (size + gap) + size / 2;
    return { x, y };
  };

  if (lines.length === 0) return null;

  return (
    <svg className="entanglement-overlay" viewBox="0 0 468 468" preserveAspectRatio="none">
      {lines.map(line => {
        const posA = getSquarePosition(line.a);
        const posB = getSquarePosition(line.b);
        const isHovered = hoveredEntanglementId === line.id;
        return (
          <line
            key={line.id}
            x1={posA.x}
            y1={posA.y}
            x2={posB.x}
            y2={posB.y}
            stroke={isHovered ? "rgba(102, 126, 234, 0.9)" : "rgba(102, 126, 234, 0.5)"}
            strokeWidth={isHovered ? "3" : "2"}
            strokeDasharray={isHovered ? "8 8" : "4 4"}
            className={isHovered ? "entanglement-line-hovered" : ""}
          />
        );
      })}
    </svg>
  );
}

