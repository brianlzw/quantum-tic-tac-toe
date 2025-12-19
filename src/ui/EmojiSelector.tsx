import { useState, useEffect, useRef } from 'react';
import type { GameMode, PlayerEmoji } from '../game/types';

interface EmojiSelectorProps {
  mode: GameMode;
  onModeChange?: (mode: GameMode) => void;
  onSelect: (emojis: PlayerEmoji) => void;
  onStartGame: (emojis: PlayerEmoji) => void;
  onEmojiChange?: (selectedX: string | null, selectedO: string | null) => void;
}

const EMOJI_OPTIONS = [
  // Big cats and predators
  '🐊', '🦁', '🐯', '🐅', '🐆', '🐺', '🦊', '🐻',
  // Large mammals
  '🐘', '🦏', '🦣', '🦒', '🦓', '🦌', '🐃', '🦬',
  // Farm animals
  '🐷', '🐮', '🐄', '🐑', '🐐', '🐎', '🐖', '🐓',
  // Cute mammals
  '🐼', '🐨', '🐰', '🐶', '🐱', '🐭', '🐹', '🐻‍❄️',
  // Birds
  '🦉', '🦅', '🦜', '🦚', '🦩', '🐦', '🐧', '🦆', '🦢', '🦤',
  // Insects and small creatures
  '🐝', '🦋', '🐛', '🦗', '🕷️', '🦟', '🦂', '🐌',
  // Reptiles and amphibians
  '🐢', '🐍', '🦎', '🐸',
  // Sea creatures
  '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐋', '🦈', '🐚',
  // Other animals
  '🦄', '🦘', '🦡', '🦨', '🦝', '🦧', '🦫', '🦥', '🦦', '🐿️', '🦔',
];

export default function EmojiSelector({ 
  mode, 
  onModeChange, 
  onSelect, 
  onStartGame, 
  onEmojiChange
}: EmojiSelectorProps) {
  const [selectedX, setSelectedX] = useState<string | null>(null);
  const [selectedO, setSelectedO] = useState<string | null>(null);
  const [emojisConfirmed, setEmojisConfirmed] = useState(false);
  const emojiSelectorRef = useRef<HTMLDivElement>(null);
  const emojiStepRef = useRef<HTMLDivElement>(null);
  const emojiGridRef = useRef<HTMLDivElement>(null);
  const startGameRef = useRef<HTMLDivElement>(null);
  const playerPromptRef = useRef<HTMLHeadingElement>(null);

  const handleXSelect = (emoji: string) => {
    setSelectedX(emoji);
    // Notify parent of emoji changes
    if (onEmojiChange) {
      onEmojiChange(emoji, selectedO);
    }
    // Don't call onSelect here - only store locally
    // Game will start only when Start Game button is clicked
  };

  const handleOSelect = (emoji: string) => {
    setSelectedO(emoji);
    // Notify parent of emoji changes
    if (onEmojiChange) {
      onEmojiChange(selectedX, emoji);
    }
    // Don't call onSelect here - only store locally
    // Game will start only when Start Game button is clicked
  };

  const handleStartGame = () => {
    if (!canStartGame) return;
    
    // Prepare emojis
    let emojis: PlayerEmoji | null = null;
    if (mode === 'two-player' && selectedX && selectedO) {
      emojis = { X: selectedX, O: selectedO };
    } else if (mode === 'vs-bot' && selectedX) {
      // Bot always uses robot emoji
      emojis = { X: selectedX, O: '🤖' };
    }
    
    if (emojis) {
      // Set emojis when starting the game
      onSelect(emojis);
      
      // Start the game - pass emojis directly to avoid race condition
      onStartGame(emojis);
    }
  };

  const canStartGame = mode === 'two-player' 
    ? (selectedX !== null && selectedO !== null)
    : (selectedX !== null);

  // Reset selections when mode changes
  useEffect(() => {
    setSelectedX(null);
    setSelectedO(null);
    setEmojisConfirmed(false);
    if (onEmojiChange) {
      onEmojiChange(null, null);
    }
  }, [mode]);

  // #region agent log
  useEffect(() => {
    const logLayout = () => {
      if (emojiSelectorRef.current && emojiStepRef.current && emojiGridRef.current && startGameRef.current && playerPromptRef.current) {
        const selector = emojiSelectorRef.current;
        const step = emojiStepRef.current;
        const grid = emojiGridRef.current;
        const startGame = startGameRef.current;
        const prompt = playerPromptRef.current;
        const selectorRect = selector.getBoundingClientRect();
        const stepRect = step.getBoundingClientRect();
        const gridRect = grid.getBoundingClientRect();
        const startGameRect = startGame.getBoundingClientRect();
        const promptRect = prompt.getBoundingClientRect();
        const selectorStyle = window.getComputedStyle(selector);
        const stepStyle = window.getComputedStyle(step);
        const gridStyle = window.getComputedStyle(grid);
        const startGameStyle = window.getComputedStyle(startGame);
        const promptStyle = window.getComputedStyle(prompt);
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'EmojiSelector.tsx:useEffect',message:'Start game button transparency check POST-FIX',data:{startGame:{width:startGameRect.width,height:startGameRect.height,top:startGameRect.top,left:startGameRect.left,position:startGameStyle.position,bottom:startGameStyle.bottom,backgroundColor:startGameStyle.backgroundColor,backdropFilter:startGameStyle.backdropFilter,opacity:startGameStyle.opacity},emojiGrid:{scrollHeight:grid.scrollHeight,clientHeight:grid.clientHeight,scrollTop:grid.scrollTop},viewportWidth:window.innerWidth,viewportHeight:window.innerHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      }
    };
    const timer = setTimeout(logLayout, 100);
    window.addEventListener('resize', logLayout);
    const grid = emojiGridRef.current;
    if (grid) {
      grid.addEventListener('scroll', logLayout);
    }
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', logLayout);
      if (grid) {
        grid.removeEventListener('scroll', logLayout);
      }
    };
  }, [selectedX, selectedO]);
  // #endregion

  return (
    <div className="emoji-selector" ref={emojiSelectorRef}>
      {mode === 'two-player' ? (
        <>
          {!selectedX ? (
            <div className="emoji-selection-step" ref={emojiStepRef}>
              <h2 className="player-prompt" ref={playerPromptRef}>Player 1, choose your emoji:</h2>
              <div className="emoji-grid" ref={emojiGridRef}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    className="emoji-button"
                    onClick={() => handleXSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : !selectedO ? (
            <div className="emoji-selection-step" ref={emojiStepRef}>
              <h2 className="player-prompt" ref={playerPromptRef}>Player 2, choose your emoji:</h2>
              <div className="emoji-grid" ref={emojiGridRef}>
                {EMOJI_OPTIONS.map(emoji => {
                  const isDisabled = emoji === selectedX;
                  return (
                    <button
                      key={emoji}
                      className={`emoji-button ${isDisabled ? 'disabled' : ''}`}
                      onClick={() => !isDisabled && handleOSelect(emoji)}
                      disabled={isDisabled}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="emoji-selection-step" ref={emojiStepRef}>
              <h2 className="player-prompt" ref={playerPromptRef}>Both players have chosen their emojis!</h2>
              <div className="emoji-grid" ref={emojiGridRef}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    className={`emoji-button ${emoji === selectedX || emoji === selectedO ? 'selected' : ''}`}
                    onClick={() => {
                      if (emoji === selectedX) {
                        setSelectedX(null);
                        setEmojisConfirmed(false);
                        if (onEmojiChange) {
                          onEmojiChange(null, selectedO);
                        }
                      } else if (emoji === selectedO) {
                        setSelectedO(null);
                        setEmojisConfirmed(false);
                        if (onEmojiChange) {
                          onEmojiChange(selectedX, null);
                        }
                      } else if (!selectedX || emoji === selectedX) {
                        handleXSelect(emoji);
                      } else {
                        handleOSelect(emoji);
                      }
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {!selectedX ? (
            <div className="emoji-selection-step" ref={emojiStepRef}>
              <h2 className="player-prompt" ref={playerPromptRef}>Choose your emoji (Bot will use 🤖):</h2>
              <div className="emoji-grid" ref={emojiGridRef}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    className="emoji-button"
                    onClick={() => handleXSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="emoji-selection-step" ref={emojiStepRef}>
              <h2 className="player-prompt" ref={playerPromptRef}>You have chosen your emoji!</h2>
              <div className="emoji-grid" ref={emojiGridRef}>
                {EMOJI_OPTIONS.map(emoji => (
                  <button
                    key={emoji}
                    className={`emoji-button ${emoji === selectedX ? 'selected' : ''}`}
                    onClick={() => handleXSelect(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="start-game-section" ref={startGameRef}>
        <button 
          className="start-game-button" 
          onClick={handleStartGame}
          disabled={!canStartGame}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}

