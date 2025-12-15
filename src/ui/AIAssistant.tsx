import { useState, useEffect, useRef } from 'react';
import type { GameState, SquareId } from '../game/types';
import type { Tip } from '../bot/tip';
import { getPlayerTip } from '../bot/tip';
import { handleAssistantQuestion } from '../bot/assistant';
import BoardPreview from './BoardPreview';

interface AIAssistantProps {
  gameState: GameState;
  mode: 'two-player' | 'vs-bot';
  onTipMove?: (a: SquareId, b: SquareId) => void;
  isOpen: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

interface Message {
  role: 'assistant' | 'user';
  content: string;
  timestamp: number;
  tip?: Tip | null;
  visual?: {
    type: 'board';
    highlightedSquares: SquareId[];
  };
}

const ASSISTANT_PERSONALITIES = [
  {
    name: 'Quinn',
    emoji: '🪄',
    greetings: [
      "Hey there! I'm Quinn, your quantum gaming assistant!",
      "Hello! Quinn here, ready to help you master quantum tic-tac-toe!",
      "Hi! I'm Quinn, and I've got your back!",
    ],
    tipPhrases: [
      "I've analyzed the board, and I think I've got a great suggestion for you!",
      "Ooh, I see an interesting move here! Let me share my thoughts.",
      "After running some calculations, I believe this move could work well for you!",
      "I've been watching the game, and I think I found something clever!",
    ],
    closingPhrases: [
      "Hope that helps! Good luck out there!",
      "Give it a try and see how it goes!",
      "You've got this! Let me know if you need another tip later!",
    ],
    responses: [
      "That's a great question! Let me think...",
      "Interesting! Here's what I think about that:",
      "Good point! Let me explain:",
      "I'm glad you asked! Here's my take:",
    ],
  },
  {
    name: 'Qubit',
    emoji: '🪄',
    greetings: [
      "Greetings! I'm Qubit, your quantum strategy advisor!",
      "Hello! Qubit at your service!",
      "Hey! I'm Qubit, here to help you win!",
    ],
    tipPhrases: [
      "I've crunched the quantum probabilities, and here's what I found!",
      "My analysis suggests this move could be quite effective!",
      "Based on the current entanglement state, I recommend this!",
      "I've calculated the optimal path forward for you!",
    ],
    closingPhrases: [
      "May the quantum odds be in your favor!",
      "That should give you an edge!",
      "Good luck with that move!",
    ],
    responses: [
      "Ah, excellent question! From a quantum perspective:",
      "Let me analyze that for you:",
      "Great observation! Here's what the probabilities suggest:",
      "I'm happy to explain! Here's my analysis:",
    ],
  },
];

// Parse message content and format it properly
function formatMessageContent(content: string): JSX.Element[] {
  const parts: JSX.Element[] = [];
  const lines = content.split('\n');
  let currentParagraph: string[] = [];
  let key = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      if (currentParagraph.length > 0) {
        parts.push(
          <p key={key++}>
            {currentParagraph.map((text, i) => (
              <span key={i}>{formatText(text)}</span>
            ))}
          </p>
        );
        currentParagraph = [];
      }
    } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      // Bold text
      if (currentParagraph.length > 0) {
        parts.push(
          <p key={key++}>
            {currentParagraph.map((text, i) => (
              <span key={i}>{formatText(text)}</span>
            ))}
          </p>
        );
        currentParagraph = [];
      }
      parts.push(
        <p key={key++} className="message-bold">
          {formatText(trimmed.slice(2, -2))}
        </p>
      );
    } else if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      // List item
      if (currentParagraph.length > 0) {
        parts.push(
          <p key={key++}>
            {currentParagraph.map((text, i) => (
              <span key={i}>{formatText(text)}</span>
            ))}
          </p>
        );
        currentParagraph = [];
      }
      parts.push(
        <p key={key++} className="message-list-item">
          {formatText(trimmed)}
        </p>
      );
    } else {
      currentParagraph.push(line);
    }
  });

  if (currentParagraph.length > 0) {
    parts.push(
      <p key={key++}>
        {currentParagraph.map((text, i) => (
          <span key={i}>{formatText(text)}</span>
        ))}
      </p>
    );
  }

  return parts;
}

// Format inline text (bold, etc.)
function formatText(text: string): JSX.Element[] {
  const parts: JSX.Element[] = [];
  let key = 0;

  // Simple bold detection (**text**)
  const boldRegex = /\*\*(.+?)\*\*/g;
  let match;
  let lastIndex = 0;

  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.substring(lastIndex, match.index)}</span>);
    }
    // Add bold text
    parts.push(<strong key={key++}>{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
}

export default function AIAssistant({ gameState, mode, onTipMove, isOpen, onToggle, onOpen }: AIAssistantProps) {
  const [tip, setTip] = useState<Tip | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [personality] = useState(ASSISTANT_PERSONALITIES[Math.floor(Math.random() * ASSISTANT_PERSONALITIES.length)]);
  const [tipAvailable, setTipAvailable] = useState(false);
  const [hasAppearedOnce, setHasAppearedOnce] = useState(false);
  const [hasNewTip, setHasNewTip] = useState(false);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if tip should be available (after first move, vs-bot mode, player's turn)
  useEffect(() => {
    // #region agent log
    console.log('[DEBUG] AIAssistant useEffect: Tip availability check', { mode, moveNumber: gameState.moveNumber, currentPlayer: gameState.currentPlayer, gameOver: gameState.gameOver, pendingCycle: !!gameState.pendingCycle, hasAppearedOnce });
    fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:197',message:'Tip availability check started',data:{mode,moveNumber:gameState.moveNumber,currentPlayer:gameState.currentPlayer,gameOver:gameState.gameOver,pendingCycle:!!gameState.pendingCycle,hasAppearedOnce},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D'})}).catch((e)=>console.error('Log fetch failed:', e));
    // #endregion
    
    if (mode === 'vs-bot' && gameState.moveNumber > 1 && gameState.currentPlayer === 'X' && !gameState.gameOver && !gameState.pendingCycle) {
      // #region agent log
      console.log('[DEBUG] AIAssistant: All conditions met, checking random chance');
      fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:200',message:'All conditions met, checking random chance',data:{mode,moveNumber:gameState.moveNumber,currentPlayer:gameState.currentPlayer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch((e)=>console.error('Log fetch failed:', e));
      // #endregion
      
      // 70% chance tip becomes available each turn
      const randomValue = Math.random();
      // #region agent log
      console.log('[DEBUG] AIAssistant: Random value generated', { randomValue, willShow: randomValue < 0.7 });
      fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:204',message:'Random value generated',data:{randomValue,willShow:randomValue < 0.7},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch((e)=>console.error('Log fetch failed:', e));
      // #endregion
      
      if (randomValue < 0.7) {
        setTipAvailable(true);
        setHasNewTip(true);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:207',message:'Setting tip available to true',data:{hasAppearedOnce},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
        // #endregion
        if (!hasAppearedOnce) {
          setHasAppearedOnce(true);
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:210',message:'Setting hasAppearedOnce to true',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
        }
      } else {
        setTipAvailable(false);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:214',message:'Random chance failed, tip not available',data:{randomValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      }
    } else {
      setTipAvailable(false);
      // #region agent log
      const conditionCheck = { modeVsBot: mode === 'vs-bot', moveNumberOk: gameState.moveNumber > 1, currentPlayerX: gameState.currentPlayer === 'X', notGameOver: !gameState.gameOver, noPendingCycle: !gameState.pendingCycle };
      console.log('[DEBUG] AIAssistant: Conditions not met', { mode, moveNumber: gameState.moveNumber, currentPlayer: gameState.currentPlayer, gameOver: gameState.gameOver, pendingCycle: !!gameState.pendingCycle, conditionCheck });
      fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:217',message:'Conditions not met',data:{mode,moveNumber:gameState.moveNumber,currentPlayer:gameState.currentPlayer,gameOver:gameState.gameOver,pendingCycle:!!gameState.pendingCycle,conditionCheck},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C'})}).catch((e)=>console.error('Log fetch failed:', e));
      // #endregion
    }
  }, [gameState.moveNumber, gameState.currentPlayer, mode, gameState.gameOver, gameState.pendingCycle, hasAppearedOnce]);

  // Reset messages when game resets
  useEffect(() => {
    if (gameState.moveNumber === 1) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:215',message:'Resetting state - game reset detected',data:{moveNumber:gameState.moveNumber,hasAppearedOnceBefore:hasAppearedOnce},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      setMessages([]);
      setTip(null);
      setHasAppearedOnce(false);
      setHasNewTip(false);
    }
  }, [gameState.moveNumber]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isThinking, isOpen]);

  // Focus input when assistant opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Add greeting when first opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = personality.greetings[Math.floor(Math.random() * personality.greetings.length)];
      setMessages([{ role: 'assistant', content: greeting, timestamp: Date.now() }]);
    }
  }, [isOpen, personality, messages.length]);

  const handleRequestTip = async () => {
    if (!tipAvailable && !hasAppearedOnce) return;

    // Open the panel if not already open
    if (!isOpen) {
      onOpen();
      // Wait a bit for the panel to open
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setIsThinking(true);
    setHasNewTip(false);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newTip = getPlayerTip(gameState);
    setTip(newTip);
    setIsThinking(false);
    setTipAvailable(false);

    if (newTip) {
      const tipPhrase = personality.tipPhrases[Math.floor(Math.random() * personality.tipPhrases.length)];
      const closingPhrase = personality.closingPhrases[Math.floor(Math.random() * personality.closingPhrases.length)];
      
      // Convert square numbers to user-friendly positions
      const squareNames = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
      const moveDesc = `${squareNames[newTip.move.a]} and ${squareNames[newTip.move.b]}`;
      
      const tipMessage = `${tipPhrase}\n\nSuggested Move: Play between ${moveDesc}\n\nWhy? ${newTip.explanation}\n\n${newTip.reasoning}\n\n${closingPhrase}`;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: tipMessage,
        timestamp: Date.now(),
        tip: newTip,
        visual: {
          type: 'board',
          highlightedSquares: [newTip.move.a, newTip.move.b],
        },
      }]);
    } else {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Hmm, I'm having trouble finding an optimal move right now. The board is quite complex! Try to think about controlling key squares and blocking your opponent.",
        timestamp: Date.now(),
      }]);
    }
  };

  const handleApplyTip = () => {
    if (tip && onTipMove) {
      const squareNames = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
      const moveDesc = `${squareNames[tip.move.a]} and ${squareNames[tip.move.b]}`;
      onTipMove(tip.move.a, tip.move.b);
      setMessages(prev => [...prev, {
        role: 'user',
        content: `I'll try playing ${moveDesc}!`,
        timestamp: Date.now(),
      }]);
      setTip(null);
      setTipAvailable(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || isThinking) return;

    const question = userInput.trim();
    setUserInput('');
    
    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: question,
      timestamp: Date.now(),
    }]);

    // Show thinking
    setIsThinking(true);

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate response using the improved assistant
    const response = handleAssistantQuestion(question, gameState, personality);
    
    setIsThinking(false);

    // Add assistant response
    const assistantMessage: Message = {
      role: 'assistant',
      content: response.answer,
      timestamp: Date.now(),
    };

    // If response suggests a tip, get it and add visual
    if (response.shouldSuggestTip) {
      const suggestedTip = getPlayerTip(gameState);
      if (suggestedTip) {
        assistantMessage.tip = suggestedTip;
        assistantMessage.visual = {
          type: 'board',
          highlightedSquares: [suggestedTip.move.a, suggestedTip.move.b],
        };
        setTip(suggestedTip);
      }
    }

    setMessages(prev => [...prev, assistantMessage]);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Don't show anything if not in vs-bot mode
  if (mode !== 'vs-bot') {
    // #region agent log
    console.log('[DEBUG] AIAssistant: mode !== vs-bot', { mode });
    fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:391',message:'Component returning null - not vs-bot mode',data:{mode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch((e)=>console.error('Log fetch failed:', e));
    // #endregion
    return null;
  }

  // #region agent log
  console.log('[DEBUG] AIAssistant: Rendering component - checking button visibility', { hasAppearedOnce, tipAvailable, willShowButton: hasAppearedOnce || tipAvailable });
  fetch('http://127.0.0.1:7242/ingest/e409a507-9c1d-4cc4-be6d-3240ad6256b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AIAssistant.tsx:396',message:'Rendering component - checking button visibility',data:{hasAppearedOnce,tipAvailable,willShowButton:hasAppearedOnce || tipAvailable},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E,F'})}).catch((e)=>console.error('Log fetch failed:', e));
  // #endregion

  return (
    <>
      {/* Button - always visible once appeared once */}
      {(hasAppearedOnce || tipAvailable) && (
        <button 
          className={`tip-button ${hasNewTip ? 'has-new-tip' : ''}`}
          onClick={handleRequestTip}
          title={hasNewTip ? "New tip available! Click for AI assistance" : "Open AI Tips"}
          style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 10000 }}
        >
          <span className="tip-button-icon">🪄</span>
          <span className="tip-button-text">AI Tips</span>
          {hasNewTip && <span className="tip-button-badge">!</span>}
        </button>
      )}

      {/* Side Panel */}
      <div className={`ai-assistant-panel ${!isOpen ? 'hidden' : ''}`}>
          <div className="ai-assistant-panel-header">
            <div className="ai-assistant-title">
              <span className="ai-assistant-emoji">{personality.emoji}</span>
              <span className="ai-assistant-name">{personality.name}</span>
            </div>
            <button className="ai-assistant-close" onClick={onToggle}>×</button>
          </div>
          
          <div className="ai-assistant-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-message ${msg.role}`}>
                {msg.role === 'assistant' && (
                  <div className="ai-message-avatar">{personality.emoji}</div>
                )}
                <div className="ai-message-content">
                  {formatMessageContent(msg.content)}
                  {msg.visual && msg.visual.type === 'board' && (
                    <div className="message-visual">
                      <BoardPreview 
                        highlightedSquares={msg.visual.highlightedSquares}
                        size={140}
                        showLabels={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isThinking && (
              <div className="ai-message assistant">
                <div className="ai-message-avatar">{personality.emoji}</div>
                <div className="ai-message-content">
                  <div className="thinking-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {tip && !isThinking && (
            <div className="ai-assistant-actions">
              <button className="ai-action-button primary" onClick={handleApplyTip}>
                Apply this move
              </button>
              <button className="ai-action-button secondary" onClick={() => setTip(null)}>
                Not this time
              </button>
            </div>
          )}

          <div className="ai-assistant-input-container">
            <input
              ref={inputRef}
              type="text"
              className="ai-assistant-input"
              placeholder="Ask me anything about the game..."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isThinking}
            />
            <button
              className="ai-assistant-send-button"
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isThinking}
            >
              Send
            </button>
          </div>
        </div>
    </>
  );
}
