import type { GameState, SquareId } from '../game/types';
import { isLegalMove, addQuantumMove, resolveCycle } from '../game/engine';
import { determineWinner } from '../game/scoring';

/**
 * Make a bot move. Returns null if no legal moves available.
 */
export function makeBotMove(gameState: GameState): { a: SquareId; b: SquareId } | null {
  if (gameState.gameOver || gameState.pendingCycle) {
    return null;
  }

  const legalMoves = getLegalMoves(gameState);
  if (legalMoves.length === 0) {
    return null;
  }

  // Simple heuristic: prefer moves that don't create cycles, or if all create cycles,
  // pick randomly (could be improved with minimax)
  const nonCycleMoves = legalMoves.filter(move => {
    const testState = { ...gameState };
    const result = addQuantumMove(testState, move.a, move.b);
    return !result.cycleCreated;
  });

  const movesToChoose = nonCycleMoves.length > 0 ? nonCycleMoves : legalMoves;
  
  // For now, pick randomly from available moves
  const randomMove = movesToChoose[Math.floor(Math.random() * movesToChoose.length)];
  return randomMove;
}

/**
 * Make a bot choice for cycle resolution.
 * Returns the chosen endpoint, or null if invalid.
 */
export function makeBotCycleChoice(gameState: GameState): SquareId | null {
  if (!gameState.pendingCycle) {
    return null;
  }

  const lastMove = gameState.moves.find(m => m.id === gameState.pendingCycle!.cycleMoveId);
  if (!lastMove) {
    return null;
  }

  // Evaluate both options by simulating the collapse
  const optionA = lastMove.a;
  const optionB = lastMove.b;

  const scoreA = evaluateCollapseOption(gameState, optionA);
  const scoreB = evaluateCollapseOption(gameState, optionB);

  // Bot is O, so prefer options that favor O
  // Higher score is better for the bot
  return scoreB >= scoreA ? optionB : optionA;
}

/**
 * Evaluate a collapse option by simulating it and scoring the result.
 * Returns a score (higher is better for the bot/O).
 */
function evaluateCollapseOption(gameState: GameState, endpoint: SquareId): number {
  // Create a deep copy to avoid mutating the original state
  const testState: GameState = {
    ...gameState,
    moves: [...gameState.moves],
    classical: [...gameState.classical],
    pendingCycle: gameState.pendingCycle ? { ...gameState.pendingCycle } : undefined,
  };
  
  const resolved = resolveCycle(testState, endpoint);
  
  const winner = determineWinner(resolved.classical);
  
  if (!winner) {
    // No winner yet - count potential winning lines
    return countPotentialWins(resolved, 'O') - countPotentialWins(resolved, 'X');
  }

  if (winner.player === 'O') {
    return 100 + winner.score * 10; // Prefer full wins
  } else {
    return -100 - winner.score * 10;
  }
}

/**
 * Count potential winning lines for a player (heuristic).
 */
function countPotentialWins(gameState: GameState, player: 'X' | 'O'): number {
  // Simple heuristic: count lines where player has at least one classical mark
  // and no opponent classical marks
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
  ];

  let count = 0;
  for (const line of lines) {
    const marks = line.map(sq => gameState.classical[sq]);
    const hasPlayer = marks.some(m => m?.player === player);
    const hasOpponent = marks.some(m => m?.player === (player === 'X' ? 'O' : 'X'));
    
    if (hasPlayer && !hasOpponent) {
      count++;
    }
  }

  return count;
}

/**
 * Get all legal moves for the current player.
 */
function getLegalMoves(gameState: GameState): { a: SquareId; b: SquareId }[] {
  const moves: { a: SquareId; b: SquareId }[] = [];
  
  for (let a = 0; a < 9; a++) {
    for (let b = a + 1; b < 9; b++) {
      if (isLegalMove(a as SquareId, b as SquareId, gameState.classical)) {
        moves.push({ a: a as SquareId, b: b as SquareId });
      }
    }
  }

  return moves;
}

