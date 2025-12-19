import type { GameState, SquareId, Player, QuantumMove, BotDifficulty } from '../game/types';
import { isLegalMove, addQuantumMove, resolveCycle } from '../game/engine';
import { determineWinner } from '../game/scoring';
import { wouldCreateCycle, getCycleEdges } from '../game/cycle';

/**
 * Make a bot move. Returns null if no legal moves available.
 */
export function makeBotMove(gameState: GameState, difficulty: BotDifficulty = 'medium'): { a: SquareId; b: SquareId } | null {
  if (gameState.gameOver || gameState.pendingCycle) {
    return null;
  }

  const legalMoves = getLegalMoves(gameState);
  if (legalMoves.length === 0) {
    return null;
  }

  // Filter out moves that would create trivial 2-line cycles
  const uncollapsedMoves = gameState.moves.filter(m => m.collapsedTo === undefined);
  const filteredMoves = legalMoves.filter(move => {
    // Check if this move would create a cycle
    if (!wouldCreateCycle(move.a, move.b, uncollapsedMoves)) {
      return true; // No cycle, keep it
    }
    
    // If it creates a cycle, check if it's a trivial 2-line cycle
    // A 2-line cycle happens when there's already a direct move between these squares
    const hasDirectConnection = uncollapsedMoves.some(m => 
      (m.a === move.a && m.b === move.b) || (m.a === move.b && m.b === move.a)
    );
    
    if (hasDirectConnection) {
      // This would create a trivial 2-line cycle, filter it out
      return false;
    }
    
    // Check cycle size using getCycleEdges - if cycle has only 2 edges, it's trivial
    const testMove: QuantumMove = {
      id: 'test',
      player: gameState.currentPlayer,
      moveIndex: gameState.moveNumber,
      a: move.a,
      b: move.b,
    };
    const cycleEdges = getCycleEdges(testMove, uncollapsedMoves);
    
    // If cycle has exactly 2 edges (the existing path + new move), it's trivial
    if (cycleEdges.length === 2) {
      return false;
    }
    
    return true; // Non-trivial cycle, keep it
  });

  // If all moves were filtered out, fall back to all legal moves
  const movesToEvaluate = filteredMoves.length > 0 ? filteredMoves : legalMoves;

  // Evaluate all moves strategically
  const evaluatedMoves = movesToEvaluate.map(move => ({
    move,
    score: evaluateMoveForBot(gameState, move),
    createsCycle: false, // Will be set below
  }));

  // Determine which moves create cycles and update scores
  for (const evaluated of evaluatedMoves) {
    const testState: GameState = {
      ...gameState,
      moves: [...gameState.moves],
      classical: [...gameState.classical],
      pendingCycle: gameState.pendingCycle ? {
        cycleMoveId: (gameState.pendingCycle as { cycleMoveId: string; chooser: Player }).cycleMoveId,
        chooser: (gameState.pendingCycle as { cycleMoveId: string; chooser: Player }).chooser,
      } : undefined,
    };
    const result = addQuantumMove(testState, evaluated.move.a, evaluated.move.b);
    evaluated.createsCycle = result.cycleCreated;
    
    // Re-evaluate cycle moves more carefully
    if (result.cycleCreated) {
      evaluated.score = evaluateCycleMoveForBot(testState, evaluated.move);
    }
  }

  // Separate into cycle and non-cycle moves
  const cycleMoves = evaluatedMoves.filter(m => m.createsCycle);
  const nonCycleMoves = evaluatedMoves.filter(m => !m.createsCycle);

  // Use difficulty-specific logic
  switch (difficulty) {
    case 'beginner':
      return makeBeginnerMove(gameState, evaluatedMoves, cycleMoves, nonCycleMoves);
    case 'medium':
      return makeMediumMove(gameState, evaluatedMoves, cycleMoves, nonCycleMoves);
    case 'advanced':
      return makeAdvancedMove(gameState, evaluatedMoves, cycleMoves, nonCycleMoves);
    default:
      return makeMediumMove(gameState, evaluatedMoves, cycleMoves, nonCycleMoves);
  }
}

/**
 * Beginner bot: Simpler logic, lower cycle probability, more randomness
 */
function makeBeginnerMove(
  gameState: GameState,
  evaluatedMoves: Array<{ move: { a: SquareId; b: SquareId }; score: number; createsCycle: boolean }>,
  cycleMoves: typeof evaluatedMoves,
  nonCycleMoves: typeof evaluatedMoves
): { a: SquareId; b: SquareId } | null {
  const uncollapsedCount = gameState.moves.filter(m => m.collapsedTo === undefined).length;
  
  // Lower cycle probability for beginners
  // Early game (0-2 uncollapsed): 20% chance
  // Mid game (3-5 uncollapsed): 30% chance  
  // Late game (6+ uncollapsed): 40% chance
  let cycleProbability = 0.2;
  if (uncollapsedCount >= 6) {
    cycleProbability = 0.4;
  } else if (uncollapsedCount >= 3) {
    cycleProbability = 0.3;
  }

  const shouldCreateCycle = Math.random() < cycleProbability;
  
  let movesToChoose: typeof evaluatedMoves;
  
  if (shouldCreateCycle && cycleMoves.length > 0) {
    movesToChoose = cycleMoves;
  } else if (nonCycleMoves.length > 0) {
    movesToChoose = nonCycleMoves;
  } else {
    movesToChoose = evaluatedMoves;
  }
  
  // More randomness for beginners - just pick randomly from available moves
  // Slight preference for better moves (top 50%)
  movesToChoose.sort((a, b) => b.score - a.score);
  const topCount = Math.max(1, Math.ceil(movesToChoose.length * 0.5));
  const topMoves = movesToChoose.slice(0, topCount);
  
  // 50% chance to pick from top moves, 50% completely random
  if (Math.random() < 0.5 && topMoves.length > 0) {
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  }
  
  return movesToChoose[Math.floor(Math.random() * movesToChoose.length)].move;
}

/**
 * Medium bot: Current balanced logic
 */
function makeMediumMove(
  gameState: GameState,
  evaluatedMoves: Array<{ move: { a: SquareId; b: SquareId }; score: number; createsCycle: boolean }>,
  cycleMoves: typeof evaluatedMoves,
  nonCycleMoves: typeof evaluatedMoves
): { a: SquareId; b: SquareId } | null {
  const uncollapsedCount = gameState.moves.filter(m => m.collapsedTo === undefined).length;
  
  // Dynamic probability: more likely to create cycles as game progresses
  // Early game (0-2 uncollapsed): 45% chance
  // Mid game (3-5 uncollapsed): 60% chance  
  // Late game (6+ uncollapsed): 75% chance
  let cycleProbability = 0.45;
  if (uncollapsedCount >= 6) {
    cycleProbability = 0.75;
  } else if (uncollapsedCount >= 3) {
    cycleProbability = 0.6;
  }

  const shouldCreateCycle = Math.random() < cycleProbability;
  
  let movesToChoose: typeof evaluatedMoves;
  
  if (shouldCreateCycle && cycleMoves.length > 0) {
    movesToChoose = cycleMoves;
  } else if (nonCycleMoves.length > 0) {
    movesToChoose = nonCycleMoves;
  } else {
    movesToChoose = evaluatedMoves;
  }
  
  // Sort by score (higher is better for bot)
  movesToChoose.sort((a, b) => b.score - a.score);
  
  // Pick from top moves with some randomness
  // Top 30% of moves get higher weight, but still allow some variety
  const topCount = Math.max(1, Math.ceil(movesToChoose.length * 0.3));
  const topMoves = movesToChoose.slice(0, topCount);
  
  // 70% chance to pick from top moves, 30% from all moves
  const useTopMoves = Math.random() < 0.7 && topMoves.length > 0;
  const candidates = useTopMoves ? topMoves : movesToChoose;
  
  // Weighted random selection (prefer higher scores)
  const totalScore = candidates.reduce((sum, m) => sum + Math.max(0, m.score + 100), 0);
  let random = Math.random() * totalScore;
  
  for (const candidate of candidates) {
    const weight = Math.max(0, candidate.score + 100);
    if (random < weight) {
      return candidate.move;
    }
    random -= weight;
  }
  
  // Fallback to random if something goes wrong
  return candidates[Math.floor(Math.random() * candidates.length)].move;
}

/**
 * Advanced bot: More strategic, higher cycle probability, better evaluation
 */
function makeAdvancedMove(
  gameState: GameState,
  evaluatedMoves: Array<{ move: { a: SquareId; b: SquareId }; score: number; createsCycle: boolean }>,
  cycleMoves: typeof evaluatedMoves,
  nonCycleMoves: typeof evaluatedMoves
): { a: SquareId; b: SquareId } | null {
  const uncollapsedCount = gameState.moves.filter(m => m.collapsedTo === undefined).length;
  
  // Higher cycle probability for advanced
  // Early game (0-2 uncollapsed): 60% chance
  // Mid game (3-5 uncollapsed): 75% chance  
  // Late game (6+ uncollapsed): 85% chance
  let cycleProbability = 0.6;
  if (uncollapsedCount >= 6) {
    cycleProbability = 0.85;
  } else if (uncollapsedCount >= 3) {
    cycleProbability = 0.75;
  }

  const shouldCreateCycle = Math.random() < cycleProbability;
  
  let movesToChoose: typeof evaluatedMoves;
  
  if (shouldCreateCycle && cycleMoves.length > 0) {
    movesToChoose = cycleMoves;
  } else if (nonCycleMoves.length > 0) {
    movesToChoose = nonCycleMoves;
  } else {
    movesToChoose = evaluatedMoves;
  }
  
  // Sort by score (higher is better for bot)
  movesToChoose.sort((a, b) => b.score - a.score);
  
  // Advanced bot is more strategic - prefer top moves more often
  // Top 20% of moves get higher weight
  const topCount = Math.max(1, Math.ceil(movesToChoose.length * 0.2));
  const topMoves = movesToChoose.slice(0, topCount);
  
  // 85% chance to pick from top moves, 15% from all moves
  const useTopMoves = Math.random() < 0.85 && topMoves.length > 0;
  const candidates = useTopMoves ? topMoves : movesToChoose;
  
  // Stronger weight on better moves for advanced bot
  const totalScore = candidates.reduce((sum, m) => sum + Math.max(0, m.score + 200), 0);
  let random = Math.random() * totalScore;
  
  for (const candidate of candidates) {
    const weight = Math.max(0, candidate.score + 200);
    if (random < weight) {
      return candidate.move;
    }
    random -= weight;
  }
  
  // Fallback to best move if something goes wrong
  return candidates[0].move;
}

/**
 * Evaluate a move for the bot (O) by simulating it and scoring the result.
 * Returns a score (higher is better for O).
 */
function evaluateMoveForBot(gameState: GameState, move: { a: SquareId; b: SquareId }): number {
  const testState: GameState = {
    ...gameState,
    moves: [...gameState.moves],
    classical: [...gameState.classical],
    pendingCycle: gameState.pendingCycle ? { ...gameState.pendingCycle } : undefined,
  };

  const result = addQuantumMove(testState, move.a, move.b);
  
  // If no cycle created, evaluate the position
  if (!result.cycleCreated) {
    return evaluateStateForBot(result.state);
  }
  
  // For cycle moves, use the specialized evaluation
  return evaluateCycleMoveForBot(result.state, move);
}

/**
 * Evaluate a cycle-creating move for the bot.
 * Since the opponent (X) will choose the collapse, we evaluate both options
 * and assume they pick the worst one for us (minimax approach).
 */
function evaluateCycleMoveForBot(
  gameState: GameState,
  move: { a: SquareId; b: SquareId }
): number {
  if (!gameState.pendingCycle) {
    return evaluateStateForBot(gameState);
  }

  const lastMove = gameState.moves.find(m => m.id === gameState.pendingCycle!.cycleMoveId);
  if (!lastMove) {
    return evaluateStateForBot(gameState);
  }

  // Evaluate both collapse options
  const optionA = lastMove.a;
  const optionB = lastMove.b;

  const scoreA = evaluateCollapseOption(gameState, optionA);
  const scoreB = evaluateCollapseOption(gameState, optionB);

  // Opponent (X) will choose the option that's worse for us (O)
  // So we take the minimum (worst case for bot)
  return Math.min(scoreA, scoreB);
}

/**
 * Evaluate a game state for the bot (O).
 * Returns a score (higher is better for O).
 */
function evaluateStateForBot(gameState: GameState): number {
  const winner = determineWinner(gameState.classical);

  if (winner) {
    if (winner.player === 'O') {
      return 1000 + winner.score * 100; // Prefer full wins
    } else {
      return -1000 - winner.score * 100;
    }
  }

  // No winner yet - evaluate position
  const playerPotential = countPotentialWins(gameState, 'O');
  const opponentPotential = countPotentialWins(gameState, 'X');

  // Prefer moves that create more opportunities and block opponent
  return playerPotential * 10 - opponentPotential * 15;
}

/**
 * Make a bot choice for cycle resolution.
 * Returns the chosen endpoint, or null if invalid.
 */
export function makeBotCycleChoice(gameState: GameState, difficulty: BotDifficulty = 'medium'): SquareId | null {
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
  // Advanced bot always picks best, others might add slight randomness
  if (difficulty === 'beginner' && Math.abs(scoreA - scoreB) < 50) {
    // Beginner might pick randomly if scores are close
    return Math.random() < 0.5 ? optionA : optionB;
  }
  
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
  return evaluateStateForBot(resolved);
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

