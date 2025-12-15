import { useState, useEffect, useMemo } from 'react';
import type { GameState, SquareId } from '../game/types';
import { collapseCycle } from '../game/collapse';
import { findWinningLines } from '../game/scoring';
import Square from './Square';
import EntanglementOverlay from './EntanglementOverlay';
import CollapseAnimation from './CollapseAnimation';
import WinningLine from './WinningLine';

interface BoardProps {
  gameState: GameState;
  selectedSquare: SquareId | null;
  onSquareClick: (square: SquareId) => void;
  onCycleResolution: (endpoint: SquareId) => void;
  hoveredCycleEndpoint: SquareId | null;
  onHoverCycleEndpoint: (endpoint: SquareId | null) => void;
  onCycleResolutionHandlerReady?: (handler: (endpoint: SquareId) => void) => void;
}

export default function Board({ 
  gameState, 
  selectedSquare, 
  onSquareClick,
  onCycleResolution,
  hoveredCycleEndpoint,
  onHoverCycleEndpoint,
  onCycleResolutionHandlerReady
}: BoardProps) {
  const squares: SquareId[] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationEndpoint, setAnimationEndpoint] = useState<SquareId | null>(null);
  const [hoveredMoveId, setHoveredMoveId] = useState<string | null>(null);

  // Get cycle endpoints if pending
  const cycleEndpoints: SquareId[] = gameState.pendingCycle
    ? (() => {
        const lastMove = gameState.moves.find(m => m.id === gameState.pendingCycle!.cycleMoveId);
        return lastMove ? [lastMove.a, lastMove.b] : [];
      })()
    : [];

  // Calculate preview data for hovered endpoint
  const previewData = useMemo(() => {
    if (!gameState.pendingCycle || hoveredCycleEndpoint === null || hoveredCycleEndpoint === undefined) return null;
    
    const lastMove = gameState.moves.find(m => m.id === gameState.pendingCycle!.cycleMoveId);
    if (!lastMove) return null;

    const uncollapsedMoves = gameState.moves.filter(m => m.collapsedTo === undefined);
    const collapseMap = collapseCycle(lastMove, hoveredCycleEndpoint, uncollapsedMoves);
    
    // For each square, determine which emoji will be confirmed and which moves will be removed
    const confirmedBySquare = new Map<SquareId, string>(); // square -> moveId that becomes classical
    const removedMoves = new Set<string>();
    
    // Build map of which move collapses to which square
    for (const [moveId, square] of collapseMap.entries()) {
      confirmedBySquare.set(square, moveId);
    }
    
    // Moves that are not in collapseMap but are in uncollapsed moves will be removed
    for (const move of uncollapsedMoves) {
      if (!collapseMap.has(move.id)) {
        removedMoves.add(move.id);
      }
    }
    
    return { confirmedBySquare, removedMoves };
  }, [gameState.pendingCycle, hoveredCycleEndpoint, gameState.moves]);

  const handleSquareClick = (square: SquareId) => {
    // If cycle is pending and this is a cycle endpoint, resolve cycle
    if (gameState.pendingCycle && cycleEndpoints.includes(square)) {
      setIsAnimating(true);
      setAnimationEndpoint(square);
      // Start animation, then resolve after animation completes
    } else {
      onSquareClick(square);
    }
  };

  const handleCycleResolutionFromButton = (endpoint: SquareId) => {
    if (gameState.pendingCycle && cycleEndpoints.includes(endpoint)) {
      setIsAnimating(true);
      setAnimationEndpoint(endpoint);
    }
  };

  const handleAnimationComplete = () => {
    if (animationEndpoint !== null) {
      onCycleResolution(animationEndpoint);
      setIsAnimating(false);
      setAnimationEndpoint(null);
    }
  };

  // Expose the handler to parent
  useEffect(() => {
    if (onCycleResolutionHandlerReady) {
      onCycleResolutionHandlerReady(handleCycleResolutionFromButton);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCycleResolutionHandlerReady, gameState.pendingCycle]);

  // Auto-resolve if bot is choosing (no animation needed for bot)
  useEffect(() => {
    if (gameState.pendingCycle && !isAnimating) {
      // Bot will handle resolution via App.tsx useEffect
    }
  }, [gameState.pendingCycle, isAnimating]);

  // Get winning line if there's a winner
  const winningLine = useMemo(() => {
    if (!gameState.winner || !gameState.classical) return null;
    try {
      const wins = findWinningLines(gameState.classical);
      const playerWins = wins.get(gameState.winner.player);
      if (playerWins && playerWins.length > 0 && playerWins[0] && playerWins[0].line && playerWins[0].line.length === 3) {
        // Return the first winning line (or the one with lowest maxMoveIndex)
        return playerWins[0].line;
      }
    } catch (error) {
      console.error('Error finding winning line:', error);
    }
    return null;
  }, [gameState.winner, gameState.classical]);

  return (
    <>
      <div className="board-container">
        <div className="board">
          {squares.map(square => {
            const isCycleEndpoint = cycleEndpoints.includes(square);
            const isHoveredEndpoint = hoveredCycleEndpoint === square;
            
            const handleSquareMouseEnter = () => {
              if (isCycleEndpoint) {
                onHoverCycleEndpoint(square);
              }
            };

            const handleSquareMouseLeave = () => {
              if (isCycleEndpoint) {
                onHoverCycleEndpoint(null);
              }
            };

            return (
              <Square
                key={square}
                square={square}
                gameState={gameState}
                isSelected={selectedSquare === square}
                isCycleEndpoint={isCycleEndpoint}
                isHoveredEndpoint={isHoveredEndpoint}
                hoveredMoveId={hoveredMoveId}
                previewData={previewData}
                onClick={() => handleSquareClick(square)}
                onMouseEnter={handleSquareMouseEnter}
                onMouseLeave={handleSquareMouseLeave}
                onSpookyMarkHover={setHoveredMoveId}
              />
            );
          })}
          <EntanglementOverlay gameState={gameState} hoveredEntanglementId={hoveredMoveId} />
          {winningLine && <WinningLine line={winningLine} />}
        </div>
        
        {isAnimating && animationEndpoint !== null && (
          <CollapseAnimation
            gameState={gameState}
            chosenEndpoint={animationEndpoint}
            onComplete={handleAnimationComplete}
          />
        )}
      </div>
      
    </>
  );
}

