import { useState } from 'react';
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
  const [isMinimizedX, setIsMinimizedX] = useState(false);
  const [isMinimizedO, setIsMinimizedO] = useState(false);
  
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
                  <span className="player-label">Player<span className="player-number-mobile"> 1:</span></span>
                  <span className="player-emoji">{xEmoji}</span>
                  {gameState.currentPlayer === 'X' && <span className="current-indicator">Current</span>}
                </div>
                {gameState.pendingCycle && gameState.pendingCycle.chooser === 'X' && onCycleResolution && (
                  <div className={`cycle-prompt-inline ${isMinimizedX ? 'minimized' : ''}`}>
                    <div 
                      className="cycle-prompt-header"
                      onClick={() => setIsMinimizedX(!isMinimizedX)}
                    >
                      <p className="cycle-prompt-text">
                        <span className="cycle-prompt-text-desktop">Click options to preview the collapsed cycle</span>
                        <span className="cycle-prompt-text-mobile">Tap to preview</span>
                      </p>
                      <button 
                        className="cycle-prompt-caret" 
                        aria-label="Toggle preview"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMinimizedX(!isMinimizedX);
                        }}
                      >
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 12 12" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className={isMinimizedX ? 'caret-up' : 'caret-down'}
                        >
                          <path 
                            d="M2 4L6 8L10 4" 
                            stroke="rgba(148, 86, 0, 1)" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className={`cycle-prompt-content ${isMinimizedX ? 'minimized' : ''}`}>
                      <CycleResolutionPrompt
                        gameState={gameState}
                        onResolve={onCycleResolution}
                        onHoverEndpoint={onHoverCycleEndpoint}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className={`player-info ${gameState.currentPlayer === 'O' ? 'current' : ''} ${gameState.pendingCycle && gameState.pendingCycle.chooser === 'O' ? 'has-cycle-prompt' : ''}`}>
                <div>
                  <span className="player-label">Player<span className="player-number-mobile"> 2:</span></span>
                  <span className="player-emoji">{oEmoji}</span>
                  {gameState.currentPlayer === 'O' && <span className="current-indicator">Current</span>}
                </div>
                {gameState.pendingCycle && gameState.pendingCycle.chooser === 'O' && onCycleResolution && (
                  <div className={`cycle-prompt-inline ${isMinimizedO ? 'minimized' : ''}`}>
                    <div 
                      className="cycle-prompt-header"
                      onClick={() => setIsMinimizedO(!isMinimizedO)}
                    >
                      <p className="cycle-prompt-text">
                        <span className="cycle-prompt-text-desktop">Click options to preview the collapsed cycle</span>
                        <span className="cycle-prompt-text-mobile">Tap to preview</span>
                      </p>
                      <button 
                        className="cycle-prompt-caret" 
                        aria-label="Toggle preview"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMinimizedO(!isMinimizedO);
                        }}
                      >
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 12 12" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className={isMinimizedO ? 'caret-up' : 'caret-down'}
                        >
                          <path 
                            d="M2 4L6 8L10 4" 
                            stroke="rgba(148, 86, 0, 1)" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className={`cycle-prompt-content ${isMinimizedO ? 'minimized' : ''}`}>
                      <CycleResolutionPrompt
                        gameState={gameState}
                        onResolve={onCycleResolution}
                        onHoverEndpoint={onHoverCycleEndpoint}
                      />
                    </div>
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
                  <div className={`cycle-prompt-inline ${isMinimizedX ? 'minimized' : ''}`}>
                    <div 
                      className="cycle-prompt-header"
                      onClick={() => setIsMinimizedX(!isMinimizedX)}
                    >
                      <p className="cycle-prompt-text">
                        <span className="cycle-prompt-text-desktop">Click options to preview the collapsed cycle</span>
                        <span className="cycle-prompt-text-mobile">Tap to preview</span>
                      </p>
                      <button 
                        className="cycle-prompt-caret" 
                        aria-label="Toggle preview"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMinimizedX(!isMinimizedX);
                        }}
                      >
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 12 12" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className={isMinimizedX ? 'caret-up' : 'caret-down'}
                        >
                          <path 
                            d="M2 4L6 8L10 4" 
                            stroke="rgba(148, 86, 0, 1)" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className={`cycle-prompt-content ${isMinimizedX ? 'minimized' : ''}`}>
                      <CycleResolutionPrompt
                        gameState={gameState}
                        onResolve={onCycleResolution}
                        onHoverEndpoint={onHoverCycleEndpoint}
                      />
                    </div>
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

