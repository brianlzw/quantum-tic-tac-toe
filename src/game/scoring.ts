import type { ClassicalMark, SquareId, Player } from './types';

/**
 * All winning lines (rows, columns, diagonals) in a 3x3 grid.
 */
const WINNING_LINES: SquareId[][] = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Columns
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

/**
 * Check if a line is complete (all three squares have classical marks of the same player).
 */
function isCompleteLine(
  line: SquareId[],
  classical: (ClassicalMark | null)[]
): { complete: boolean; player?: Player; maxMoveIndex?: number } {
  const marks = line.map(sq => classical[sq]);
  
  if (marks.some(m => m === null)) {
    return { complete: false };
  }

  const players = marks.map(m => m!.player);
  if (players[0] === players[1] && players[1] === players[2]) {
    const moveIndices = marks.map(m => m!.moveIndex);
    const maxMoveIndex = Math.max(...moveIndices);
    return {
      complete: true,
      player: players[0],
      maxMoveIndex,
    };
  }

  return { complete: false };
}

/**
 * Find all winning lines for each player.
 */
export function findWinningLines(
  classical: (ClassicalMark | null)[]
): Map<Player, { line: SquareId[]; maxMoveIndex: number }[]> {
  const wins = new Map<Player, { line: SquareId[]; maxMoveIndex: number }[]>();
  wins.set('X', []);
  wins.set('O', []);

  for (const line of WINNING_LINES) {
    const result = isCompleteLine(line, classical);
    if (result.complete && result.player && result.maxMoveIndex !== undefined) {
      wins.get(result.player)!.push({
        line,
        maxMoveIndex: result.maxMoveIndex,
      });
    }
  }

  return wins;
}

/**
 * Determine the winner based on classical marks.
 * Returns null if no winner, or winner info with score.
 */
export function determineWinner(
  classical: (ClassicalMark | null)[]
): { player: Player; score: number } | null {
  const wins = findWinningLines(classical);
  const xWins = wins.get('X')!;
  const oWins = wins.get('O')!;

  if (xWins.length === 0 && oWins.length === 0) {
    return null;
  }

  if (xWins.length > 0 && oWins.length === 0) {
    return { player: 'X', score: 1 };
  }

  if (oWins.length > 0 && xWins.length === 0) {
    return { player: 'O', score: 1 };
  }

  // Both have wins - use max subscript rule
  const xMax = Math.min(...xWins.map(w => w.maxMoveIndex));
  const oMax = Math.min(...oWins.map(w => w.maxMoveIndex));

  if (xMax < oMax) {
    return { player: 'X', score: 1 };
  } else if (oMax < xMax) {
    return { player: 'O', score: 1 };
  } else {
    // Same max - both get 1/2 point, but X wins by default (first player)
    return { player: 'X', score: 0.5 };
  }
}

