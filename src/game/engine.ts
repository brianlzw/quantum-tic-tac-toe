import type { GameState, QuantumMove, SquareId, Player, ClassicalMark } from './types';
import { wouldCreateCycle } from './cycle';
import { collapseCycle, applyCollapse } from './collapse';
import { determineWinner } from './scoring';

/**
 * Create initial game state.
 */
export function createGameState(): GameState {
  return {
    moves: [],
    classical: Array(9).fill(null),
    currentPlayer: 'X',
    moveNumber: 1,
    gameOver: false,
    emojiSelectionComplete: false,
  };
}

/**
 * Check if a square is available for a quantum move (not classical).
 */
export function isSquareAvailable(square: SquareId, classical: (ClassicalMark | null)[]): boolean {
  return classical[square] === null;
}

/**
 * Check if a move is legal (both squares are available and different).
 */
export function isLegalMove(
  a: SquareId,
  b: SquareId,
  classical: (ClassicalMark | null)[]
): boolean {
  if (a === b) return false;
  return isSquareAvailable(a, classical) && isSquareAvailable(b, classical);
}

/**
 * Create a new quantum move.
 */
function createMove(
  player: Player,
  moveIndex: number,
  a: SquareId,
  b: SquareId
): QuantumMove {
  return {
    id: `${player}${moveIndex}`,
    player,
    moveIndex,
    a,
    b,
  };
}

/**
 * Get all uncollapsed moves.
 */
function getUncollapsedMoves(moves: QuantumMove[]): QuantumMove[] {
  return moves.filter(m => m.collapsedTo === undefined);
}

/**
 * Add a quantum move to the game state.
 * Returns the updated state and whether a cycle was created.
 */
export function addQuantumMove(
  state: GameState,
  a: SquareId,
  b: SquareId
): { state: GameState; cycleCreated: boolean } {
  if (state.gameOver) {
    return { state, cycleCreated: false };
  }

  if (!isLegalMove(a, b, state.classical)) {
    return { state, cycleCreated: false };
  }

  const newMove = createMove(state.currentPlayer, state.moveNumber, a, b);
  const uncollapsedMoves = getUncollapsedMoves(state.moves);
  const cycleCreated = wouldCreateCycle(a, b, uncollapsedMoves);

  const newMoves = [...state.moves, newMove];
  const nextPlayer: Player = state.currentPlayer === 'X' ? 'O' : 'X';
  const nextMoveNumber = state.moveNumber + 1;

  let newState: GameState = {
    ...state,
    moves: newMoves,
    currentPlayer: nextPlayer,
    moveNumber: nextMoveNumber,
  };

  if (cycleCreated) {
    // The other player (who didn't create the cycle) chooses the collapse
    newState.pendingCycle = {
      cycleMoveId: newMove.id,
      chooser: state.currentPlayer === 'X' ? 'O' : 'X',
    };
  } else {
    // Check for winner after move (though unlikely without collapse)
    const winner = determineWinner(newState.classical);
    if (winner) {
      newState.winner = winner;
      newState.gameOver = true;
    }
  }

  return { state: newState, cycleCreated };
}

/**
 * Resolve a cycle collapse by choosing an endpoint.
 */
export function resolveCycle(
  state: GameState,
  chosenEndpoint: SquareId
): GameState {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.ts:117',message:'resolveCycle entry',data:{hasPendingCycle:!!state.pendingCycle,cycleMoveId:state.pendingCycle?.cycleMoveId,chosenEndpoint,uncollapsedMovesCount:state.moves.filter(m=>m.collapsedTo===undefined).length,collapsedMovesCount:state.moves.filter(m=>m.collapsedTo!==undefined).length,classicalMarksCount:state.classical.filter(m=>m!==null).length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  if (!state.pendingCycle) {
    return state;
  }

  const lastMove = state.moves.find(m => m.id === state.pendingCycle!.cycleMoveId);
  if (!lastMove) {
    return state;
  }

  if (chosenEndpoint !== lastMove.a && chosenEndpoint !== lastMove.b) {
    return state;
  }

  const uncollapsedMoves = getUncollapsedMoves(state.moves);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.ts:134',message:'Before collapseCycle call',data:{uncollapsedMovesCount:uncollapsedMoves.length,lastMoveId:lastMove.id,lastMoveA:lastMove.a,lastMoveB:lastMove.b,chosenEndpoint},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  let collapseMap: Map<string, SquareId>;
  try {
    collapseMap = collapseCycle(lastMove, chosenEndpoint, uncollapsedMoves);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.ts:137',message:'After collapseCycle call',data:{collapseMapSize:collapseMap.size},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.ts:140',message:'Error in collapseCycle',data:{error:String(error),errorMessage:error instanceof Error?error.message:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw error;
  }
  let updatedMoves: typeof state.moves;
  let newClassicalMarks: Map<SquareId, typeof state.classical[0]>;
  try {
    const result = applyCollapse(state.moves, collapseMap);
    updatedMoves = result.updatedMoves;
    newClassicalMarks = result.newClassical;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.ts:150',message:'After applyCollapse call',data:{newClassicalMarksSize:newClassicalMarks.size,updatedMovesCount:updatedMoves.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.ts:154',message:'Error in applyCollapse',data:{error:String(error),errorMessage:error instanceof Error?error.message:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    throw error;
  }
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.ts:136',message:'After applyCollapse call',data:{newClassicalMarksSize:newClassicalMarks.size,updatedMovesCount:updatedMoves.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Apply new classical marks to the classical array
  const updatedClassical = [...state.classical];
  for (const [square, mark] of newClassicalMarks.entries()) {
    // #region agent log
    const existingMark = updatedClassical[square];
    if (existingMark !== null) {
      fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'engine.ts:140',message:'Overwriting existing classical mark',data:{square,existingMark,newMark:mark},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    }
    // #endregion
    updatedClassical[square] = mark;
  }

  // Check for winner
  const winner = determineWinner(updatedClassical);
  
  // Check if all squares are filled (tie condition)
  const allSquaresFilled = updatedClassical.every(sq => sq !== null);
  
  const newState: GameState = {
    ...state,
    moves: updatedMoves,
    classical: updatedClassical,
    pendingCycle: undefined,
    winner: winner || undefined,
    gameOver: winner !== null || allSquaresFilled,
  };

  return newState;
}

/**
 * Get all spooky marks in a square.
 */
export function getSpookyMarksInSquare(
  square: SquareId,
  moves: QuantumMove[]
): QuantumMove[] {
  return moves.filter(m => 
    m.collapsedTo === undefined && 
    (m.a === square || m.b === square)
  );
}

