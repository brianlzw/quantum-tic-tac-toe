import { useState, useEffect } from 'react';
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

export default function EmojiSelector({ mode, onModeChange, onSelect, onStartGame, onEmojiChange }: EmojiSelectorProps) {
  const [selectedX, setSelectedX] = useState<string | null>(null);
  const [selectedO, setSelectedO] = useState<string | null>(null);
  const [emojisConfirmed, setEmojisConfirmed] = useState(false);

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

  return (
    <div className="emoji-selector">
      {mode === 'two-player' ? (
        <>
          {!selectedX ? (
            <div className="emoji-selection-step">
              <h2 className="player-prompt">Player 1, choose your emoji:</h2>
              <div className="emoji-grid">
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
            <div className="emoji-selection-step">
              <h2 className="player-prompt">Player 2, choose your emoji:</h2>
              <div className="emoji-grid">
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
            <div className="emoji-selection-step">
              <h2 className="player-prompt">Both players have chosen their emojis!</h2>
              <div className="emoji-grid">
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
            <div className="emoji-selection-step">
              <h2 className="player-prompt">Choose your emoji (Bot will use 🤖):</h2>
              <div className="emoji-grid">
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
            <div className="emoji-selection-step">
              <h2 className="player-prompt">You have chosen your emoji!</h2>
              <div className="emoji-grid">
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

      <div className="start-game-section">
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

