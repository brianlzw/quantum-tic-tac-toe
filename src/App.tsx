import { useReducer, useState, useEffect } from 'react';
import { createGameState, addQuantumMove, resolveCycle } from './game/engine';
import type { GameState, GameMode, SquareId, PlayerEmoji } from './game/types';
import Board from './ui/Board';
import GameControls from './ui/GameControls';
import TutorialPanel from './ui/TutorialPanel';
import EmojiSelector from './ui/EmojiSelector';
import Confetti from './ui/Confetti';
import SadFaces from './ui/SadFaces';
import AIAssistant from './ui/AIAssistant';
import { makeBotMove, makeBotCycleChoice } from './bot/bot';
import { soundManager } from './utils/sounds';
import './App.css';

type GameAction =
  | { type: 'MAKE_MOVE'; a: SquareId; b: SquareId }
  | { type: 'RESOLVE_CYCLE'; endpoint: SquareId }
  | { type: 'NEW_GAME'; mode: GameMode }
  | { type: 'SET_EMOJIS'; emojis: PlayerEmoji; complete?: boolean }
  | { type: 'BOT_MOVE' }
  | { type: 'UNDO' }
  | { type: 'SET_STATE'; state: GameState };

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'MAKE_MOVE': {
      const result = addQuantumMove(state, action.a, action.b);
      if (result.cycleCreated) {
        soundManager.playCycle();
      }
      return result.state;
    }
    case 'RESOLVE_CYCLE': {
      const newState = resolveCycle(state, action.endpoint);
      if (newState.winner) {
        soundManager.playWin();
      }
      return newState;
    }
    case 'NEW_GAME': {
      // Reset emoji selection - user will choose again
      return createGameState();
    }
    case 'SET_EMOJIS': {
      return {
        ...state,
        emojis: action.emojis,
        emojiSelectionComplete: action.complete === true, // Only complete if explicitly set to true
      };
    }
    case 'SET_STATE': {
      return action.state;
    }
    default:
      return state;
  }
}

function App() {
  const [gameState, dispatch] = useReducer(gameReducer, createGameState());
  const [mode, setMode] = useState<GameMode>('two-player');
  const [selectedSquare, setSelectedSquare] = useState<SquareId | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [hoveredCycleEndpoint, setHoveredCycleEndpoint] = useState<SquareId | null>(null);
  const [cycleResolutionHandler, setCycleResolutionHandler] = useState<((endpoint: SquareId) => void) | null>(null);
  const [gameHistory, setGameHistory] = useState<GameState[]>([]);
  const [selectedEmojiX, setSelectedEmojiX] = useState<string | null>(null);
  const [selectedEmojiO, setSelectedEmojiO] = useState<string | null>(null);

  // Handle bot moves
  useEffect(() => {
    if (mode === 'vs-bot' && !gameState.gameOver && !gameState.pendingCycle) {
      if (gameState.currentPlayer === 'O') {
        const timer = setTimeout(() => {
          const botMove = makeBotMove(gameState);
          if (botMove) {
            saveToHistory(gameState);
            dispatch({ type: 'MAKE_MOVE', a: botMove.a, b: botMove.b });
            soundManager.playMove();
          }
        }, 1500); // Slower bot response
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentPlayer, gameState.gameOver, gameState.pendingCycle, mode]);

  // Handle bot cycle resolution
  useEffect(() => {
    if (mode === 'vs-bot' && gameState.pendingCycle) {
      if (gameState.pendingCycle.chooser === 'O') {
        const timer = setTimeout(() => {
          const choice = makeBotCycleChoice(gameState);
          if (choice !== null) {
            saveToHistory(gameState);
            dispatch({ type: 'RESOLVE_CYCLE', endpoint: choice });
            soundManager.playCollapse();
          }
        }, 2000); // Slower bot response for cycle resolution
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.pendingCycle?.cycleMoveId, gameState.pendingCycle?.chooser, mode]);

  // Save state to history before making moves
  const saveToHistory = (state: GameState) => {
    // Deep clone the state to save
    const stateCopy: GameState = {
      ...state,
      moves: [...state.moves],
      classical: [...state.classical],
      pendingCycle: state.pendingCycle ? { ...state.pendingCycle } : undefined,
      winner: state.winner ? { ...state.winner } : undefined,
      emojis: state.emojis ? { ...state.emojis } : undefined,
    };
    setGameHistory(prev => [...prev, stateCopy]);
  };

  const handleSquareClick = (square: SquareId) => {
    if (gameState.gameOver) return;
    if (gameState.pendingCycle) return; // Waiting for cycle resolution
    if (mode === 'vs-bot' && gameState.currentPlayer === 'O') return; // Bot's turn

    if (selectedSquare === null) {
      // First square selected
      if (gameState.classical[square] === null) {
        setSelectedSquare(square);
        soundManager.playSelect();
      } else {
        soundManager.playError();
      }
    } else if (selectedSquare === square) {
      // Deselect
      setSelectedSquare(null);
    } else {
      // Second square selected - make move
      saveToHistory(gameState);
      dispatch({ type: 'MAKE_MOVE', a: selectedSquare, b: square });
      setSelectedSquare(null);
      soundManager.playMove();
    }
  };

  const handleCycleResolution = (endpoint: SquareId) => {
    if (mode === 'vs-bot' && gameState.pendingCycle?.chooser === 'O') return; // Bot's choice
    saveToHistory(gameState);
    dispatch({ type: 'RESOLVE_CYCLE', endpoint });
    soundManager.playCollapse();
  };

  const handleUndo = () => {
    if (gameHistory.length === 0) return;
    if (gameState.gameOver) return; // Can't undo after game over
    if (gameState.pendingCycle) return; // Can't undo during cycle resolution
    if (mode === 'vs-bot' && gameState.currentPlayer === 'O') return; // Can't undo during bot's turn

    const previousState = gameHistory[gameHistory.length - 1];
    setGameHistory(prev => prev.slice(0, -1));
    dispatch({ type: 'SET_STATE', state: previousState });
    setSelectedSquare(null);
    soundManager.playSelect();
  };

  const handleNewGame = () => {
    const newState = createGameState();
    // Reset emoji selection when starting new game
    newState.emojiSelectionComplete = false;
    dispatch({ type: 'NEW_GAME', mode: mode });
    setSelectedSquare(null);
    setGameHistory([]); // Clear history on new game
  };

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    setSelectedEmojiX(null);
    setSelectedEmojiO(null);
  };

  const handleEmojiChange = (selectedX: string | null, selectedO: string | null) => {
    setSelectedEmojiX(selectedX);
    setSelectedEmojiO(selectedO);
  };

  const handleEmojiSelect = (emojis: PlayerEmoji) => {
    // Store emojis but don't mark selection as complete yet
    dispatch({ type: 'SET_EMOJIS', emojis, complete: false });
  };

  const handleStartGame = (emojis: PlayerEmoji) => {
    // Mark emoji selection as complete to start the game
    // Use emojis parameter directly instead of checking gameState to avoid race condition
    dispatch({ type: 'SET_EMOJIS', emojis, complete: true });
  };

  const handleTipMove = (a: SquareId, b: SquareId) => {
    if (gameState.gameOver) return;
    if (gameState.pendingCycle) return;
    if (mode === 'vs-bot' && gameState.currentPlayer === 'O') return;
    
    saveToHistory(gameState);
    dispatch({ type: 'MAKE_MOVE', a, b });
    soundManager.playMove();
    setSelectedSquare(null);
  };

  // Check if bot won (in vs-bot mode and winner is O)
  const isBotWin = mode === 'vs-bot' && gameState.winner?.player === 'O';
  const isPlayerWin = gameState.winner && !isBotWin;
  
  // Check if it's a tie (game over but no winner)
  const isTie = gameState.gameOver && !gameState.winner && gameState.classical.every(sq => sq !== null);

  // #region agent log
  useEffect(() => {
    if (gameState.emojiSelectionComplete) {
      const appElement = document.querySelector('.app');
      const tutorialPanel = document.querySelector('.tutorial-panel');
      const aiAssistantPanel = document.querySelector('.ai-assistant-panel');
      const tutorialWrapper = document.querySelector('.tutorial-wrapper');
      const aiWrapper = document.querySelector('.ai-assistant-wrapper');
      const appMainArea = document.querySelector('.app-main-area');
      
      if (appElement && appMainArea) {
        const appRect = appElement.getBoundingClientRect();
        const tutorialRect = tutorialPanel?.getBoundingClientRect();
        const aiRect = aiAssistantPanel?.getBoundingClientRect();
        const tutorialWrapperRect = tutorialWrapper?.getBoundingClientRect();
        const aiWrapperRect = aiWrapper?.getBoundingClientRect();
        const mainAreaRect = appMainArea.getBoundingClientRect();
        const tutorialStyles = tutorialPanel ? window.getComputedStyle(tutorialPanel) : null;
        const aiStyles = aiAssistantPanel ? window.getComputedStyle(aiAssistantPanel) : null;
        const tutorialWrapperStyles = tutorialWrapper ? window.getComputedStyle(tutorialWrapper) : null;
        const aiWrapperStyles = aiWrapper ? window.getComputedStyle(aiWrapper) : null;
        const mainAreaStyles = window.getComputedStyle(appMainArea);
        
        // Calculate gaps using wrapper positions for accuracy
        const gapToTutorial = tutorialWrapperRect ? tutorialWrapperRect.left - appRect.right : (tutorialRect ? tutorialRect.left - appRect.right : null);
        const gapToAI = aiWrapperRect ? aiWrapperRect.left - (tutorialWrapperRect ? tutorialWrapperRect.right : appRect.right) : (aiRect ? aiRect.left - (tutorialRect ? tutorialRect.right : appRect.right) : null);
        
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:214',message:'Panel gap measurement post-fix v3',data:{appRight:appRect.right,tutorialLeft:tutorialRect?.left||null,tutorialRight:tutorialRect?.right||null,aiLeft:aiRect?.left||null,tutorialWrapperLeft:tutorialWrapperRect?.left||null,tutorialWrapperRight:tutorialWrapperRect?.right||null,aiWrapperLeft:aiWrapperRect?.left||null,aiWrapperRight:aiWrapperRect?.right||null,gapToTutorial,gapToAI,mainAreaGap:mainAreaStyles.gap,tutorialWidth:tutorialStyles?.width||'N/A',tutorialWrapperMarginRight:tutorialWrapperStyles?.marginRight||'N/A',aiWrapperMarginLeft:aiWrapperStyles?.marginLeft||'N/A',aiWidth:aiStyles?.width||'N/A',tutorialHasHidden:tutorialPanel?.classList.contains('hidden'),aiHasHidden:aiAssistantPanel?.classList.contains('hidden'),tutorialWrapperHasAiHidden:tutorialWrapper?.classList.contains('ai-hidden'),tutorialWrapperHasTutorialHidden:tutorialWrapper?.classList.contains('tutorial-hidden'),aiWrapperHasHidden:aiWrapper?.classList.contains('hidden')},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix-v3',hypothesisId:'A,B,C,D'})}).catch(()=>{});
      }
    }
  }, [gameState.emojiSelectionComplete, showTutorial, showAIAssistant]);
  // #endregion

  return (
    <div className="app-container">
      <Confetti active={!!isPlayerWin} duration={5000} />
      <SadFaces active={isBotWin} duration={5000} />
      
      <div className="left-sidebar">
        {/* Mode selector at the top - hide after game starts */}
        <div className={`sidebar-section mode-selector-section ${gameState.emojiSelectionComplete ? 'hidden' : ''}`}>
          <div className="section-title">Game Mode</div>
          <div className="mode-selector segmented-control">
            <button
              className={`mode-button ${mode === 'two-player' ? 'active' : ''}`}
              onClick={() => handleModeChange('two-player')}
            >
              2 Players
            </button>
            <button
              className={`mode-button ${mode === 'vs-bot' ? 'active' : ''}`}
              onClick={() => handleModeChange('vs-bot')}
            >
              vs Bot
            </button>
          </div>
        </div>

        {/* Sidebar content - show mode info during emoji selection, game controls during game */}
        <div className="sidebar-section">
          {!gameState.emojiSelectionComplete ? (
            <div className="game-controls">
              <div className="game-info">
                <div className="section-title">Players</div>
                <div className="player-display">
                  {mode === 'two-player' ? (
                    <>
                      <div className={`player-info ${!selectedEmojiX ? 'current-selecting' : ''}`}>
                        <div>
                          <span className="player-label">Player 1:</span>
                          <span className="player-emoji">{selectedEmojiX || '?'}</span>
                        </div>
                      </div>
                      <div className={`player-info ${selectedEmojiX && !selectedEmojiO ? 'current-selecting' : ''}`}>
                        <div>
                          <span className="player-label">Player 2:</span>
                          <span className="player-emoji">{selectedEmojiO || '?'}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={`player-info ${!selectedEmojiX ? 'current-selecting' : ''}`}>
                        <div>
                          <span className="player-label">You:</span>
                          <span className="player-emoji">{selectedEmojiX || '?'}</span>
                        </div>
                      </div>
                      <div className="player-info">
                        <div>
                          <span className="player-label">Bot:</span>
                          <span className="player-emoji">🤖</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <GameControls
              gameState={gameState}
              mode={mode}
              onNewGame={handleNewGame}
              onCycleResolution={cycleResolutionHandler || handleCycleResolution}
              onHoverCycleEndpoint={setHoveredCycleEndpoint}
            />
          )}
        </div>

        {/* Winner and tie messages - only show when game has started */}
        {gameState.emojiSelectionComplete && (
          <>
            {gameState.winner && gameState.winner.player && (
              <div className={`winner-message ${isBotWin ? 'bot-win' : ''}`}>
                <h2>
                  {mode === 'vs-bot' ? (
                    isBotWin 
                      ? 'You lost! Better luck next time.'
                      : 'You won! Congratulations!'
                  ) : (
                    gameState.winner.score === 1 
                      ? `Player ${gameState.emojis?.[gameState.winner.player] || gameState.winner.player} wins!`
                      : `Player ${gameState.emojis?.[gameState.winner.player] || gameState.winner.player} wins with ${gameState.winner.score} points! 🎉 ${gameState.winner.score === 0.5 ? '🎉' : ''}`
                  )}
                </h2>
              </div>
            )}
            {isTie && (
              <div className="winner-message tie-message">
                <h2>
                  {mode === 'vs-bot' ? "It's a tie! Good game!" : "It's a tie!"}
                </h2>
              </div>
            )}

            <div className="game-actions">
              <button 
                className="undo-button" 
                onClick={handleUndo}
                disabled={
                  gameHistory.length === 0 || 
                  gameState.gameOver || 
                  !!gameState.pendingCycle ||
                  (mode === 'vs-bot' && gameState.currentPlayer === 'O')
                }
                title="Retract last move"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '4px' }}>
                  <path d="M3.5 8C3.5 5.51472 5.51472 3 8 3C9.38071 3 10.6307 3.55964 11.5 4.5L10 6H13.5C13.7761 6 14 5.77614 14 5.5V2L12.5 3.5C11.3693 2.19036 9.78614 1.5 8 1.5C4.68629 1.5 2 4.18629 2 7.5C2 10.8137 4.68629 13.5 8 13.5C10.8137 13.5 13.1863 11.6363 13.5 9H12C11.7239 10.7761 10.0137 12 8 12C5.51472 12 3.5 9.98528 3.5 7.5Z" fill="currentColor"/>
                </svg>
                Undo
              </button>
              <button className="new-game-button" onClick={handleNewGame}>
                New Game
              </button>
            </div>
          </>
        )}
      </div>

      <div className="app-main-area">
        <div className="app">
          <div className="header">
            <h1>Quantum Tic-Tac-Toe</h1>
            <button 
              className="tutorial-toggle-button"
              onClick={() => {
                if (showAIAssistant) setShowAIAssistant(false);
                setShowTutorial(!showTutorial);
              }}
            >
              {showTutorial ? 'Hide Rules' : 'Game rule'}
            </button>
          </div>

          {!gameState.emojiSelectionComplete ? (
            <EmojiSelector 
              mode={mode} 
              onModeChange={handleModeChange}
              onSelect={handleEmojiSelect}
              onStartGame={handleStartGame}
              onEmojiChange={handleEmojiChange}
            />
          ) : (
            <Board
              gameState={gameState}
              selectedSquare={selectedSquare}
              onSquareClick={handleSquareClick}
              onCycleResolution={handleCycleResolution}
              hoveredCycleEndpoint={hoveredCycleEndpoint}
              onHoverCycleEndpoint={setHoveredCycleEndpoint}
              onCycleResolutionHandlerReady={setCycleResolutionHandler}
            />
          )}
        </div>

        <div className={`tutorial-wrapper ${!showAIAssistant ? 'ai-hidden' : ''} ${!showTutorial ? 'tutorial-hidden' : ''}`}>
          <TutorialPanel 
            isOpen={showTutorial} 
            onToggle={() => setShowTutorial(!showTutorial)} 
          />
        </div>

        <div className={`ai-assistant-wrapper ${!showAIAssistant ? 'hidden' : ''}`}>
          <AIAssistant 
            gameState={gameState}
            mode={mode}
            onTipMove={handleTipMove}
            isOpen={showAIAssistant}
            onToggle={() => {
              if (showTutorial) setShowTutorial(false);
              setShowAIAssistant(!showAIAssistant);
            }}
            onOpen={() => {
              if (showTutorial) setShowTutorial(false);
              setShowAIAssistant(true);
            }}
          />
        </div>
      </div>
      
      <div className="footer-credit">
        Made by <a href="https://github.com/brianlzw/quantum-tic-tac-toe" target="_blank" rel="noopener noreferrer">Zewen</a> ♡
      </div>
    </div>
  );
}

export default App;

