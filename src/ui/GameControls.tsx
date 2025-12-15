import type { GameState, GameMode, SquareId } from '../game/types';
import CycleResolutionPrompt from './CycleResolutionPrompt';

interface GameControlsProps {
  gameState: GameState;
  mode: GameMode;
  onNewGame: (mode: GameMode) => void;
  onCycleResolution?: (endpoint: SquareId) => void;
  onHoverCycleEndpoint?: (endpoint: SquareId | null) => void;
}

export default function GameControls({ gameState, mode, onNewGame, onCycleResolution, onHoverCycleEndpoint }: GameControlsProps) {
  const xEmoji = gameState.emojis ? gameState.emojis.X : 'X';
  const oEmoji = gameState.emojis ? gameState.emojis.O : 'O';
  const chooserEmoji = gameState.pendingCycle && gameState.emojis 
    ? gameState.emojis[gameState.pendingCycle.chooser] 
    : gameState.pendingCycle?.chooser;

  return (
    <div className="game-controls">
      <div className="game-info">
        <div className="player-display">
          {mode === 'two-player' ? (
            <>
              <div className={`player-info ${gameState.currentPlayer === 'X' ? 'current' : ''} ${gameState.pendingCycle && gameState.pendingCycle.chooser === 'X' ? 'has-cycle-prompt' : ''}`}>
                <div>
                  <span className="player-label">Player 1:</span>
                  <span className="player-emoji">{xEmoji}</span>
                  {gameState.currentPlayer === 'X' && <span className="current-indicator">Current</span>}
                </div>
                {gameState.pendingCycle && gameState.pendingCycle.chooser === 'X' && onCycleResolution && (
                  <div className="cycle-prompt-inline">
                    <p className="cycle-prompt-text">
                      Choose how to collapse the cycle!
                    </p>
                    <CycleResolutionPrompt
                      gameState={gameState}
                      onResolve={onCycleResolution}
                      onHoverEndpoint={onHoverCycleEndpoint}
                    />
                  </div>
                )}
              </div>
              <div className={`player-info ${gameState.currentPlayer === 'O' ? 'current' : ''} ${gameState.pendingCycle && gameState.pendingCycle.chooser === 'O' ? 'has-cycle-prompt' : ''}`}>
                <div>
                  <span className="player-label">Player 2:</span>
                  <span className="player-emoji">{oEmoji}</span>
                  {gameState.currentPlayer === 'O' && <span className="current-indicator">Current</span>}
                </div>
                {gameState.pendingCycle && gameState.pendingCycle.chooser === 'O' && onCycleResolution && (
                  <div className="cycle-prompt-inline">
                    <p className="cycle-prompt-text">
                      Choose how to collapse the cycle!
                    </p>
                    <CycleResolutionPrompt
                      gameState={gameState}
                      onResolve={onCycleResolution}
                      onHoverEndpoint={onHoverCycleEndpoint}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className={`player-info ${gameState.currentPlayer === 'X' ? 'current' : ''} ${gameState.pendingCycle && gameState.pendingCycle.chooser === 'X' ? 'has-cycle-prompt' : ''}`}>
                <div>
                  <span className="player-label">You:</span>
                  <span className="player-emoji">{xEmoji}</span>
                  {gameState.currentPlayer === 'X' && <span className="current-indicator">Current</span>}
                </div>
                {gameState.pendingCycle && gameState.pendingCycle.chooser === 'X' && onCycleResolution && (
                  <div className="cycle-prompt-inline">
                    <p className="cycle-prompt-text">
                      Choose how to collapse the cycle!
                    </p>
                    <CycleResolutionPrompt
                      gameState={gameState}
                      onResolve={onCycleResolution}
                      onHoverEndpoint={onHoverCycleEndpoint}
                    />
                  </div>
                )}
              </div>
              <div className={`player-info ${gameState.currentPlayer === 'O' ? 'current' : ''} ${gameState.pendingCycle && gameState.pendingCycle.chooser === 'O' ? 'has-cycle-prompt' : ''}`}>
                <div>
                  <span className="player-label">Bot:</span>
                  <span className="player-emoji">{oEmoji}</span>
                  {gameState.currentPlayer === 'O' && !gameState.gameOver && <span className="current-indicator">Thinking...</span>}
                </div>
                {gameState.pendingCycle && gameState.pendingCycle.chooser === 'O' && onCycleResolution && (
                  <div className="cycle-prompt-inline">
                    <p className="cycle-prompt-text">
                      Bot is choosing...
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

