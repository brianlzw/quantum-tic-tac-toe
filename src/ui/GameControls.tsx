import { useState, useEffect, useRef } from 'react';
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
  const cyclePromptRefX = useRef<HTMLDivElement>(null);
  const cyclePromptRefO = useRef<HTMLDivElement>(null);
  
  const xEmoji = gameState.emojis ? gameState.emojis.X : 'X';
  const oEmoji = gameState.emojis ? gameState.emojis.O : 'O';
  const chooserEmoji = gameState.pendingCycle && gameState.emojis 
    ? gameState.emojis[gameState.pendingCycle.chooser] 
    : gameState.pendingCycle?.chooser;

  // #region agent log
  useEffect(() => {
    const measureDimensions = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) return;

      const measureElement = (ref: React.RefObject<HTMLDivElement>, id: string) => {
        if (!ref.current) return;
        const el = ref.current;
        const rect = el.getBoundingClientRect();
        const computed = window.getComputedStyle(el);
        const parent = el.parentElement;
        const parentRect = parent?.getBoundingClientRect();
        const parentComputed = parent ? window.getComputedStyle(parent) : null;
        const mobileContentArea = document.querySelector('.mobile-content-area');
        const contentAreaRect = mobileContentArea?.getBoundingClientRect();
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GameControls.tsx:measureDimensions',message:`cycle-prompt-inline ${id} full layout analysis`,data:{cyclePrompt:{width:rect.width,height:rect.height,top:rect.top,bottom:rect.bottom,paddingTop:computed.paddingTop,paddingBottom:computed.paddingBottom,minHeight:computed.minHeight,maxHeight:computed.maxHeight},parent:{width:parentRect?.width,height:parentRect?.height,top:parentRect?.top,bottom:parentRect?.bottom,minHeight:parentComputed?.minHeight,maxHeight:parentComputed?.maxHeight,display:parentComputed?.display,flexDirection:parentComputed?.flexDirection},contentArea:{top:contentAreaRect?.top,bottom:contentAreaRect?.bottom,height:contentAreaRect?.height},isMinimized:id==='X'?isMinimizedX:isMinimizedO},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      };

      if (gameState.pendingCycle?.chooser === 'X' && cyclePromptRefX.current) {
        measureElement(cyclePromptRefX, 'X');
      }
      if (gameState.pendingCycle?.chooser === 'O' && cyclePromptRefO.current) {
        measureElement(cyclePromptRefO, 'O');
      }
    };

    const timeoutId = setTimeout(measureDimensions, 100);
    return () => clearTimeout(timeoutId);
  }, [gameState.pendingCycle, isMinimizedX, isMinimizedO]);
  // #endregion

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
                  <div ref={cyclePromptRefX} className={`cycle-prompt-inline ${isMinimizedX ? 'minimized' : ''}`}>
                    <div 
                      className="cycle-prompt-header"
                      onClick={() => setIsMinimizedX(!isMinimizedX)}
                    >
                      <p className="cycle-prompt-text">
                        <span className="cycle-prompt-text-desktop">Click options to preview the collapsed cycle</span>
                        <span className="cycle-prompt-text-mobile">Preview</span>
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
                  <div ref={cyclePromptRefO} className={`cycle-prompt-inline ${isMinimizedO ? 'minimized' : ''}`}>
                    <div 
                      className="cycle-prompt-header"
                      onClick={() => setIsMinimizedO(!isMinimizedO)}
                    >
                      <p className="cycle-prompt-text">
                        <span className="cycle-prompt-text-desktop">Click options to preview the collapsed cycle</span>
                        <span className="cycle-prompt-text-mobile">Preview</span>
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
                        <span className="cycle-prompt-text-mobile">Preview</span>
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

