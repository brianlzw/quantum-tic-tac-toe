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
  const collapseMap = collapseCycle(lastMove, chosenEndpoint, uncollapsedMoves);
  const { updatedMoves, newClassical: newClassicalMarks } = applyCollapse(state.moves, collapseMap);

  // Apply new classical marks to the classical array
  const updatedClassical = [...state.classical];
  for (const [square, mark] of newClassicalMarks.entries()) {
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

