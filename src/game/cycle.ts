import type { QuantumMove, SquareId } from './types';

/**
 * Check if adding an edge between squares a and b would create a cycle
 * in the entanglement graph (using only uncollapsed moves).
 */
export function wouldCreateCycle(
  a: SquareId,
  b: SquareId,
  uncollapsedMoves: QuantumMove[]
): boolean {
  // If there's already a path between a and b using uncollapsed moves, adding a-b creates a cycle
  return hasPath(a, b, uncollapsedMoves);
}

/**
 * Check if there's a path between two squares using uncollapsed moves.
 */
function hasPath(
  start: SquareId,
  end: SquareId,
  moves: QuantumMove[]
): boolean {
  if (start === end) return true;

  const visited = new Set<SquareId>();
  const queue: SquareId[] = [start];
  visited.add(start);

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    for (const move of moves) {
      if (move.collapsedTo !== undefined) continue; // Skip collapsed moves
      
      let next: SquareId | null = null;
      if (move.a === current) next = move.b;
      else if (move.b === current) next = move.a;
      
      if (next !== null && !visited.has(next)) {
        if (next === end) return true;
        visited.add(next);
        queue.push(next);
      }
    }
  }

  return false;
}

/**
 * Get all squares involved in the cycle created by the last move.
 * Returns the cycle edges (moves) that form the cycle.
 */
export function getCycleEdges(
  lastMove: QuantumMove,
  uncollapsedMoves: QuantumMove[]
): QuantumMove[] {
  // Find the path from lastMove.a to lastMove.b (excluding lastMove itself)
  const path = findPath(lastMove.a, lastMove.b, uncollapsedMoves.filter(m => m.id !== lastMove.id));
  
  if (path.length === 0) return [];
  
  // The cycle consists of the path plus the last move
  return [...path, lastMove];
}

/**
 * Find a path between two squares using uncollapsed moves.
 * Returns the moves that form the path.
 */
function findPath(
  start: SquareId,
  end: SquareId,
  moves: QuantumMove[]
): QuantumMove[] {
  if (start === end) return [];

  // Build adjacency list
  const adj: Map<SquareId, QuantumMove[]> = new Map();
  for (let i = 0; i < 9; i++) {
    adj.set(i as SquareId, []);
  }

  for (const move of moves) {
    if (move.collapsedTo !== undefined) continue;
    adj.get(move.a)!.push(move);
    adj.get(move.b)!.push(move);
  }

  // BFS to find path
  const visited = new Set<SquareId>();
  const parent = new Map<SquareId, { square: SquareId; move: QuantumMove | null }>();
  const queue: SquareId[] = [start];
  visited.add(start);
  parent.set(start, { square: start, move: null });

  while (queue.length > 0) {
    const current = queue.shift()!;
    
    for (const move of adj.get(current)!) {
      const next = move.a === current ? move.b : move.a;
      
      if (!visited.has(next)) {
        visited.add(next);
        parent.set(next, { square: current, move });
        queue.push(next);
        
        if (next === end) {
          // Reconstruct path
          const path: QuantumMove[] = [];
          let node: SquareId | undefined = end;
          while (node !== undefined && node !== start) {
            const p = parent.get(node);
            if (p?.move) {
              path.unshift(p.move);
            }
            node = p?.square;
          }
          return path;
        }
      }
    }
  }

  return [];
}

