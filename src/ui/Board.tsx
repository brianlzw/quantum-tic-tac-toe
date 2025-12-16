import { useState, useEffect, useMemo, useRef } from 'react';
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
  const [touchedCycleEndpoint, setTouchedCycleEndpoint] = useState<SquareId | null>(null);
  const isResolvingRef = useRef(false);
  const resolvingCycleMoveIdRef = useRef<string | null>(null);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    // Validate that hoveredCycleEndpoint is actually one of the cycle endpoints
    if (hoveredCycleEndpoint !== lastMove.a && hoveredCycleEndpoint !== lastMove.b) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Board.tsx:50',message:'Invalid hoveredCycleEndpoint in preview calculation',data:{hoveredCycleEndpoint,lastMoveA:lastMove.a,lastMoveB:lastMove.b,cycleMoveId:gameState.pendingCycle.cycleMoveId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return null; // Return null if endpoint doesn't match
    }

    const uncollapsedMoves = gameState.moves.filter(m => m.collapsedTo === undefined);
    let collapseMap: Map<string, SquareId>;
    try {
      collapseMap = collapseCycle(lastMove, hoveredCycleEndpoint, uncollapsedMoves);
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Board.tsx:58',message:'Error in collapseCycle for preview',data:{error:String(error),hoveredCycleEndpoint,lastMoveA:lastMove.a,lastMoveB:lastMove.b},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      return null; // Return null on error instead of crashing
    }
    
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
  }, [gameState.pendingCycle, hoveredCycleEndpoint, gameState.moves, cycleEndpoints]);

  const handleSquareClick = (square: SquareId) => {
    // If cycle is pending and this is a cycle endpoint, resolve cycle
    if (gameState.pendingCycle && cycleEndpoints.includes(square)) {
      // On touch devices, if this endpoint is already being previewed, confirm it
      if (touchedCycleEndpoint === square && hoveredCycleEndpoint === square) {
        // Clear touch state and proceed with resolution
        setTouchedCycleEndpoint(null);
        if (touchTimeoutRef.current) {
          clearTimeout(touchTimeoutRef.current);
          touchTimeoutRef.current = null;
        }
      } else {
        // First tap - just show preview (handled by touch handler)
        return;
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Board.tsx:73',message:'Square click for cycle resolution',data:{square,isAnimating,animationEndpoint,isResolving:isResolvingRef.current,resolvingCycleMoveId:resolvingCycleMoveIdRef.current,hasPendingCycle:!!gameState.pendingCycle,cycleMoveId:gameState.pendingCycle?.cycleMoveId,chooser:gameState.pendingCycle?.chooser,uncollapsedMovesCount:gameState.moves.filter(m=>m.collapsedTo===undefined).length,collapsedMovesCount:gameState.moves.filter(m=>m.collapsedTo!==undefined).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Prevent multiple clicks while animating, already resolving, or if already processing this cycle
      if (isAnimating || animationEndpoint !== null || isResolvingRef.current || resolvingCycleMoveIdRef.current === gameState.pendingCycle.cycleMoveId) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Board.tsx:82',message:'Ignoring duplicate cycle resolution click',data:{square,isAnimating,animationEndpoint,isResolving:isResolvingRef.current,resolvingCycleMoveId:resolvingCycleMoveIdRef.current,currentCycleMoveId:gameState.pendingCycle?.cycleMoveId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return;
      }
      setIsAnimating(true);
      setAnimationEndpoint(square);
      resolvingCycleMoveIdRef.current = gameState.pendingCycle.cycleMoveId;
      // Start animation, then resolve after animation completes
    } else {
      // Clear any touch preview when clicking non-endpoint square
      if (touchedCycleEndpoint !== null) {
        setTouchedCycleEndpoint(null);
        onHoverCycleEndpoint(null);
        if (touchTimeoutRef.current) {
          clearTimeout(touchTimeoutRef.current);
          touchTimeoutRef.current = null;
        }
      }
      onSquareClick(square);
    }
  };

  const handleCycleResolutionFromButton = (endpoint: SquareId) => {
    if (gameState.pendingCycle && cycleEndpoints.includes(endpoint)) {
      // Prevent multiple calls while animating
      if (isAnimating || animationEndpoint !== null) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Board.tsx:88',message:'Ignoring duplicate cycle resolution from button',data:{endpoint,isAnimating,animationEndpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return;
      }
      setIsAnimating(true);
      setAnimationEndpoint(endpoint);
    }
  };

  const handleAnimationComplete = () => {
    // Only resolve if we have an endpoint, a pending cycle, and we're not already resolving
    if (animationEndpoint !== null && gameState.pendingCycle && !isResolvingRef.current) {
      // Verify this is still the cycle we started resolving
      if (resolvingCycleMoveIdRef.current === gameState.pendingCycle.cycleMoveId) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Board.tsx:103',message:'Animation complete, calling onCycleResolution',data:{animationEndpoint,hasPendingCycle:!!gameState.pendingCycle,cycleMoveId:gameState.pendingCycle?.cycleMoveId,resolvingCycleMoveId:resolvingCycleMoveIdRef.current,uncollapsedMovesCount:gameState.moves.filter(m=>m.collapsedTo===undefined).length,collapsedMovesCount:gameState.moves.filter(m=>m.collapsedTo!==undefined).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const endpointToResolve = animationEndpoint;
        // Set resolving flag BEFORE clearing state to prevent race conditions
        isResolvingRef.current = true;
        setIsAnimating(false);
        setAnimationEndpoint(null);
        // Then call resolution
        onCycleResolution(endpointToResolve);
      } else {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Board.tsx:115',message:'Animation complete but cycle changed, ignoring',data:{animationEndpoint,resolvingCycleMoveId:resolvingCycleMoveIdRef.current,currentCycleMoveId:gameState.pendingCycle?.cycleMoveId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        // Cycle changed, just clear animation state
        setIsAnimating(false);
        setAnimationEndpoint(null);
        resolvingCycleMoveIdRef.current = null;
      }
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

  // Reset animation state and hovered endpoint when pendingCycle is cleared (cycle resolved)
  useEffect(() => {
    if (!gameState.pendingCycle) {
      // #region agent log
      if (isAnimating || animationEndpoint !== null || hoveredCycleEndpoint !== null || isResolvingRef.current) {
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Board.tsx:162',message:'Resetting state after cycle resolved',data:{wasAnimating:isAnimating,animationEndpoint,hoveredCycleEndpoint,wasResolving:isResolvingRef.current,resolvingCycleMoveId:resolvingCycleMoveIdRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
      // #endregion
      setIsAnimating(false);
      setAnimationEndpoint(null);
      isResolvingRef.current = false;
      resolvingCycleMoveIdRef.current = null;
      setTouchedCycleEndpoint(null);
      // Clear hovered endpoint to prevent stale preview calculations
      if (hoveredCycleEndpoint !== null) {
        onHoverCycleEndpoint(null);
      }
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
        touchTimeoutRef.current = null;
      }
    } else {
      // If a new cycle starts while we're resolving an old one, reset the resolving flag
      if (isResolvingRef.current && resolvingCycleMoveIdRef.current !== gameState.pendingCycle.cycleMoveId) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Board.tsx:175',message:'New cycle detected while resolving old one, resetting',data:{oldResolvingCycleMoveId:resolvingCycleMoveIdRef.current,newCycleMoveId:gameState.pendingCycle.cycleMoveId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        isResolvingRef.current = false;
        resolvingCycleMoveIdRef.current = null;
      }
    }
  }, [gameState.pendingCycle, isAnimating, animationEndpoint, hoveredCycleEndpoint, onHoverCycleEndpoint]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (touchTimeoutRef.current) {
        clearTimeout(touchTimeoutRef.current);
      }
    };
  }, []);

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

            // Touch handler for cycle endpoint preview
            const handleSquareTouchStart = (e: React.TouchEvent) => {
              if (isCycleEndpoint && gameState.pendingCycle) {
                e.preventDefault();
                // If already previewing this endpoint, the click handler will confirm it
                if (touchedCycleEndpoint === square) {
                  return;
                }
                // Clear any existing touch preview
                if (touchedCycleEndpoint !== null && touchedCycleEndpoint !== square) {
                  setTouchedCycleEndpoint(null);
                  onHoverCycleEndpoint(null);
                  if (touchTimeoutRef.current) {
                    clearTimeout(touchTimeoutRef.current);
                    touchTimeoutRef.current = null;
                  }
                }
                // Set preview
                setTouchedCycleEndpoint(square);
                onHoverCycleEndpoint(square);
                // Clear preview after delay if not confirmed
                if (touchTimeoutRef.current) {
                  clearTimeout(touchTimeoutRef.current);
                }
                touchTimeoutRef.current = setTimeout(() => {
                  if (touchedCycleEndpoint === square && hoveredCycleEndpoint === square) {
                    // Keep preview visible for user to tap again
                    // Don't auto-clear
                  }
                }, 3000); // Keep preview for 3 seconds
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
                onTouchStart={handleSquareTouchStart}
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

