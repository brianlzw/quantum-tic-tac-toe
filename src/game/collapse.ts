import type { QuantumMove, SquareId, ClassicalMark } from './types';

/**
 * Collapse a cycle by choosing one endpoint of the last move.
 * Returns the collapse results: which moves collapse to which squares.
 */
export function collapseCycle(
  lastMove: QuantumMove,
  chosenEndpoint: SquareId,
  allUncollapsedMoves: QuantumMove[]
): Map<string, SquareId> {
  const collapseMap = new Map<string, SquareId>();
  
  // Validate chosen endpoint
  if (chosenEndpoint !== lastMove.a && chosenEndpoint !== lastMove.b) {
    throw new Error('Chosen endpoint must be one of the last move endpoints');
  }

  // Start with the last move collapsing to chosen endpoint
  collapseMap.set(lastMove.id, chosenEndpoint);

  // Build adjacency list for uncollapsed moves
  const adj: Map<SquareId, QuantumMove[]> = new Map();
  for (let i = 0; i < 9; i++) {
    adj.set(i as SquareId, []);
  }

  for (const move of allUncollapsedMoves) {
    if (move.collapsedTo !== undefined) continue;
    adj.get(move.a)!.push(move);
    adj.get(move.b)!.push(move);
  }

  // Propagate collapses: if a square becomes classical, all incident moves must collapse
  const classicalSquares = new Set<SquareId>([chosenEndpoint]);
  let changed = true;

  while (changed) {
    changed = false;
    
    for (const [square, moves] of adj.entries()) {
      if (!classicalSquares.has(square)) continue;
      
      for (const move of moves) {
        if (collapseMap.has(move.id)) continue; // Already collapsed
        
        // This move must collapse to the other endpoint
        const otherEndpoint = move.a === square ? move.b : move.a;
        collapseMap.set(move.id, otherEndpoint);
        classicalSquares.add(otherEndpoint);
        changed = true;
      }
    }
  }

  return collapseMap;
}

/**
 * Apply collapse results to moves and compute new classical marks.
 */
export function applyCollapse(
  moves: QuantumMove[],
  collapseMap: Map<string, SquareId>
): { updatedMoves: QuantumMove[]; newClassical: Map<SquareId, ClassicalMark> } {
  const updatedMoves = moves.map(move => {
    const collapsedTo = collapseMap.get(move.id);
    if (collapsedTo !== undefined) {
      return { ...move, collapsedTo };
    }
    return move;
  });

  const newClassical = new Map<SquareId, ClassicalMark>();
  
  for (const [moveId, square] of collapseMap.entries()) {
    const move = moves.find(m => m.id === moveId);
    if (move) {
      newClassical.set(square, {
        player: move.player,
        moveIndex: move.moveIndex,
      });
    }
  }

  return { updatedMoves, newClassical };
}

