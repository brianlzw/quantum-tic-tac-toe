import { useEffect, useState } from 'react';
import type { GameState, SquareId } from '../game/types';
import { collapseCycle, applyCollapse } from '../game/collapse';

interface CollapseAnimationProps {
  gameState: GameState;
  chosenEndpoint: SquareId;
  onComplete: () => void;
}

interface AnimationStep {
  from: SquareId;
  to: SquareId;
  emoji: string;
  delay: number;
}

export default function CollapseAnimation({ gameState, chosenEndpoint, onComplete }: CollapseAnimationProps) {
  const [animationSteps, setAnimationSteps] = useState<AnimationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && gameState.pendingCycle) {
      // Calculate steps on mount
      const lastMove = gameState.moves.find(m => m.id === gameState.pendingCycle!.cycleMoveId);
      if (!lastMove) return;

      const uncollapsedMoves = gameState.moves.filter(m => m.collapsedTo === undefined);
      const collapseMap = collapseCycle(lastMove, chosenEndpoint, uncollapsedMoves);

      const steps: AnimationStep[] = [];
      const processed = new Set<string>();
      const queue: { moveId: string; from: SquareId; to: SquareId }[] = [];

      const startMove = gameState.moves.find(m => m.id === gameState.pendingCycle!.cycleMoveId);
      if (startMove) {
        const from = startMove.a === chosenEndpoint ? startMove.b : startMove.a;
        queue.push({ moveId: startMove.id, from, to: chosenEndpoint });
      }

      let delay = 0;
      while (queue.length > 0) {
        const { moveId, from, to } = queue.shift()!;
        if (processed.has(moveId)) continue;
        processed.add(moveId);

        const move = gameState.moves.find(m => m.id === moveId);
        if (!move) continue;

        const emoji = gameState.emojis ? gameState.emojis[move.player] : move.player;
        steps.push({ from, to, emoji, delay });
        delay += 400; // Time between each movement

        for (const [nextMoveId, nextTo] of collapseMap.entries()) {
          if (processed.has(nextMoveId)) continue;
          const nextMove = gameState.moves.find(m => m.id === nextMoveId);
          if (!nextMove) continue;
          
          if (nextMove.a === to || nextMove.b === to) {
            const nextFrom = nextMove.a === to ? nextMove.b : nextMove.a;
            queue.push({ moveId: nextMoveId, from: nextFrom, to: nextTo });
          }
        }
      }

      setAnimationSteps(steps);
      setIsInitialized(true);
      return;
    }

    // Animate through steps sequentially
    if (isInitialized && animationSteps.length > 0) {
      if (currentStep < animationSteps.length) {
        const step = animationSteps[currentStep];
        const stepDelay = currentStep === 0 ? step.delay : 400; // Fixed delay between steps
        
        const timer = setTimeout(() => {
          if (currentStep < animationSteps.length - 1) {
            setCurrentStep(currentStep + 1);
          } else {
            // All steps completed, wait a bit then call onComplete
            setTimeout(onComplete, 300);
          }
        }, stepDelay);

        return () => clearTimeout(timer);
      }
    }
  }, [isInitialized, animationSteps, currentStep, onComplete, gameState, chosenEndpoint]);

  if (animationSteps.length === 0) return null;

  const getSquarePosition = (square: SquareId) => {
    const row = Math.floor(square / 3);
    const col = square % 3;
    const size = 150;
    const gap = 6;
    const x = col * (size + gap) + size / 2;
    const y = row * (size + gap) + size / 2;
    return { x, y };
  };

  // Render all steps up to currentStep
  const visibleSteps = animationSteps.slice(0, currentStep + 1);

  return (
    <div className="collapse-animation-overlay">
      <svg className="collapse-animation-svg" viewBox="0 0 468 468">
        {visibleSteps.map((step, index) => {
          const fromPos = getSquarePosition(step.from);
          const toPos = getSquarePosition(step.to);
          const isActive = index === currentStep;
          
          return (
            <g key={index} className={isActive ? 'active-step' : 'completed-step'}>
              <circle
                cx={fromPos.x}
                cy={fromPos.y}
                r="20"
                fill="none"
                stroke="rgba(255, 152, 0, 0.8)"
                strokeWidth="3"
                className="collapse-source"
                opacity={isActive ? 1 : 0.3}
              />
              <circle
                cx={toPos.x}
                cy={toPos.y}
                r="25"
                fill="rgba(255, 152, 0, 0.2)"
                stroke="rgba(255, 152, 0, 0.8)"
                strokeWidth="3"
                className="collapse-target"
                opacity={isActive ? 1 : 0.5}
              />
              {isActive && (
                <text
                  x={toPos.x}
                  y={toPos.y + 8}
                  textAnchor="middle"
                  fontSize="30"
                  className="collapse-emoji"
                >
                  {step.emoji}
                </text>
              )}
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="rgba(255, 152, 0, 0.6)"
                strokeWidth="3"
                strokeDasharray="5 5"
                className="collapse-path"
                opacity={isActive ? 1 : 0.4}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

