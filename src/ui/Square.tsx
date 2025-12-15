import type { GameState, SquareId } from '../game/types';
import { getSpookyMarksInSquare } from '../game/engine';

interface PreviewData {
  confirmedBySquare: Map<SquareId, string>; // square -> moveId that becomes classical
  removedMoves: Set<string>;
}

interface SquareProps {
  square: SquareId;
  gameState: GameState;
  isSelected: boolean;
  isCycleEndpoint?: boolean;
  isHoveredEndpoint?: boolean;
  hoveredMoveId?: string | null;
  previewData?: PreviewData | null;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onSpookyMarkHover?: (moveId: string | null) => void;
}

export default function Square({ 
  square, 
  gameState, 
  isSelected, 
  isCycleEndpoint = false,
  isHoveredEndpoint = false,
  hoveredMoveId = null,
  previewData = null,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onSpookyMarkHover,
}: SquareProps) {
  const classical = gameState.classical[square];
  const spookyMarks = getSpookyMarksInSquare(square, gameState.moves);
  const row = Math.floor(square / 3);
  const col = square % 3;

  const isAvailable = classical === null && !gameState.gameOver && !gameState.pendingCycle;
  const isClickable = isAvailable || (gameState.pendingCycle && isCycleEndpoint);

  // Determine preview state for each spooky mark
  const getMarkPreviewClass = (moveId: string) => {
    if (!previewData) return '';
    // Only highlight the move that will become classical in THIS square
    if (previewData.confirmedBySquare.get(square) === moveId) return 'preview-confirmed';
    if (previewData.removedMoves.has(moveId)) return 'preview-removed';
    return '';
  };

  return (
    <div
      className={`square ${isSelected ? 'selected' : ''} ${isAvailable ? 'available' : ''} ${classical ? 'classical' : ''} ${isCycleEndpoint ? 'cycle-endpoint' : ''} ${isHoveredEndpoint ? 'hovered-endpoint' : ''}`}
      onClick={isClickable ? onClick : undefined}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        gridRow: row + 1,
        gridColumn: col + 1,
        cursor: isClickable ? 'pointer' : 'default',
      }}
    >
      {classical ? (
        <div className="classical-mark">
          {gameState.emojis ? gameState.emojis[classical.player] : classical.player}
          <sub>{classical.moveIndex}</sub>
        </div>
      ) : (
        <div className="spooky-marks">
          {spookyMarks.map(move => {
            const isHovered = hoveredMoveId === move.id;
            return (
              <span 
                key={move.id} 
                className={`spooky-mark ${getMarkPreviewClass(move.id)} ${isHovered ? 'hovered-entanglement' : ''}`}
                onMouseEnter={onSpookyMarkHover ? () => onSpookyMarkHover(move.id) : undefined}
                onMouseLeave={onSpookyMarkHover ? () => onSpookyMarkHover(null) : undefined}
                style={{ cursor: onSpookyMarkHover ? 'pointer' : 'default' }}
              >
                {gameState.emojis ? gameState.emojis[move.player] : move.player}
                <sub>{move.moveIndex}</sub>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

