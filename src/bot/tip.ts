import type { GameState, SquareId } from '../game/types';
import { isLegalMove, addQuantumMove, resolveCycle } from '../game/engine';
import { determineWinner } from '../game/scoring';

export interface Tip {
  move: { a: SquareId; b: SquareId };
  explanation: string;
  reasoning: string;
}

/**
 * Get a tip for the player (X) to optimize their winning chances.
 * Returns null if no good tip is available.
 */
export function getPlayerTip(gameState: GameState): Tip | null {
  if (gameState.gameOver || gameState.pendingCycle || gameState.currentPlayer !== 'X') {
    return null;
  }

  const legalMoves = getLegalMoves(gameState);
  if (legalMoves.length === 0) {
    return null;
  }

  // Evaluate all moves and find the best one
  const evaluatedMoves = legalMoves.map(move => ({
    move,
    score: evaluateMoveForPlayer(gameState, move),
  }));

  // Sort by score (higher is better)
  evaluatedMoves.sort((a, b) => b.score - a.score);
  const bestMove = evaluatedMoves[0];

  if (!bestMove) {
    return null;
  }

  // Generate explanation based on the move's characteristics
  const explanation = generateExplanation(gameState, bestMove.move, bestMove.score);

  return {
    move: bestMove.move,
    explanation: explanation.short,
    reasoning: explanation.detailed,
  };
}

/**
 * Evaluate a move for the player (X) by simulating it and scoring the result.
 * Returns a score (higher is better for X).
 */
function evaluateMoveForPlayer(gameState: GameState, move: { a: SquareId; b: SquareId }): number {
  // Create a deep copy to avoid mutating the original state
  const testState: GameState = {
    ...gameState,
    moves: [...gameState.moves],
    classical: [...gameState.classical],
    pendingCycle: gameState.pendingCycle ? { ...gameState.pendingCycle } : undefined,
  };

  const result = addQuantumMove(testState, move.a, move.b);
  let state = result.state;

  // If a cycle was created, we need to evaluate both collapse options
  if (result.cycleCreated && state.pendingCycle) {
    // The bot (O) will choose, so evaluate both options and take the worst case for X
    const optionA = move.a;
    const optionB = move.b;

    const scoreA = evaluateCollapseOption(state, optionA, 'X');
    const scoreB = evaluateCollapseOption(state, optionB, 'X');

    // Bot will choose the option that's worse for X, so take the minimum
    return Math.min(scoreA, scoreB);
  }

  // No cycle created - evaluate the current state
  return evaluateStateForPlayer(state, 'X');
}

/**
 * Evaluate a collapse option by simulating it and scoring the result.
 */
function evaluateCollapseOption(gameState: GameState, endpoint: SquareId, forPlayer: 'X' | 'O'): number {
  const testState: GameState = {
    ...gameState,
    moves: [...gameState.moves],
    classical: [...gameState.classical],
    pendingCycle: gameState.pendingCycle ? { ...gameState.pendingCycle } : undefined,
  };

  const resolved = resolveCycle(testState, endpoint);
  return evaluateStateForPlayer(resolved, forPlayer);
}

/**
 * Evaluate a game state for a player.
 * Returns a score (higher is better for the player).
 */
function evaluateStateForPlayer(gameState: GameState, player: 'X' | 'O'): number {
  const winner = determineWinner(gameState.classical);

  if (winner) {
    if (winner.player === player) {
      return 1000 + winner.score * 100; // Prefer full wins
    } else {
      return -1000 - winner.score * 100;
    }
  }

  // No winner yet - evaluate position
  const opponent = player === 'X' ? 'O' : 'X';
  
  // Count potential winning lines
  const playerPotential = countPotentialWins(gameState, player);
  const opponentPotential = countPotentialWins(gameState, opponent);

  // Prefer moves that create more opportunities and block opponent
  return playerPotential * 10 - opponentPotential * 15;
}

/**
 * Count potential winning lines for a player.
 */
function countPotentialWins(gameState: GameState, player: 'X' | 'O'): number {
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
    
    // Count lines where player has marks but opponent doesn't
    if (hasPlayer && !hasOpponent) {
      const playerCount = marks.filter(m => m?.player === player).length;
      count += playerCount; // More marks = better
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

/**
 * Generate a conversational explanation for why this move is good.
 */
function generateExplanation(
  gameState: GameState,
  move: { a: SquareId; b: SquareId },
  score: number
): { short: string; detailed: string } {
  const testState: GameState = {
    ...gameState,
    moves: [...gameState.moves],
    classical: [...gameState.classical],
    pendingCycle: gameState.pendingCycle ? { ...gameState.pendingCycle } : undefined,
  };

  const result = addQuantumMove(testState, move.a, move.b);
  const createsCycle = result.cycleCreated;

  // Get square names for better readability
  const squareNames = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  const moveDesc = `${squareNames[move.a]} and ${squareNames[move.b]}`;

  // Determine the type of move
  const isCenterMove = move.a === 4 || move.b === 4;

  let short = '';
  let detailed = '';

  if (score > 500) {
    // Very good move (likely winning)
    short = `This move gives you a strong advantage!`;
    detailed = `Playing ${moveDesc} is excellent because it positions you for a potential win. This move maximizes your control over key squares and creates multiple winning opportunities.`;
  } else if (score > 100) {
    // Good strategic move
    if (isCenterMove) {
      short = `Controlling the center is key!`;
      detailed = `Playing ${moveDesc} is smart because the center square is crucial in tic-tac-toe. It gives you control over 4 winning lines (both diagonals, middle row, and middle column), making it much harder for your opponent to block you.`;
    } else if (createsCycle) {
      short = `This creates a cycle, giving you control!`;
      detailed = `Playing ${moveDesc} creates a quantum cycle, which means your opponent will have to choose how to collapse it. This gives you strategic control and can lead to favorable outcomes depending on their choice.`;
    } else {
      short = `This move strengthens your position!`;
      detailed = `Playing ${moveDesc} is a solid choice because it improves your board position without creating unnecessary complications. It sets you up for future winning opportunities while maintaining flexibility.`;
    }
  } else if (score > 0) {
    // Decent move
    short = `This is a reasonable move!`;
    detailed = `Playing ${moveDesc} is a decent option. While not the absolute best, it keeps your options open and doesn't put you at a disadvantage. Sometimes playing it safe is the right strategy!`;
  } else {
    // Less ideal but still playable
    short = `This move works, but be careful!`;
    detailed = `Playing ${moveDesc} is playable, though there might be better options. The move doesn't create major problems, but it might give your opponent more opportunities. Consider your alternatives carefully!`;
  }

  // Add cycle information if relevant
  if (createsCycle) {
    detailed += ` Note: This move will create a quantum cycle, and your opponent will choose how to collapse it.`;
  }

  return { short, detailed };
}

