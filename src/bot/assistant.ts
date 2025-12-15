import type { GameState } from '../game/types';
import { getPlayerTip } from './tip';
import { determineWinner } from '../game/scoring';

export interface AssistantResponse {
  answer: string;
  shouldSuggestTip?: boolean;
}

/**
 * Handle user questions with intelligent, educational responses
 */
export function handleAssistantQuestion(
  question: string,
  gameState: GameState,
  personality: { name: string; responses: string[] }
): AssistantResponse {
  const lowerQuestion = question.toLowerCase().trim();
  
  // Analyze the current game state for context
  const winner = determineWinner(gameState.classical);
  const hasPendingCycle = !!gameState.pendingCycle;
  const moveCount = gameState.moves.length;
  const classicalCount = gameState.classical.filter(m => m !== null).length;
  
  // Best move / optimal move / what should I do
  if (lowerQuestion.match(/\b(best|optimal|should i|what.*move|recommend|suggest|advice|help.*move)\b/)) {
    const tip = getPlayerTip(gameState);
    if (tip) {
      const squareNames = ['top-left', 'top-center', 'top-right', 'middle-left', 'center', 'middle-right', 'bottom-left', 'bottom-center', 'bottom-right'];
      const moveDesc = `${squareNames[tip.move.a]} and ${squareNames[tip.move.b]}`;
      return {
        answer: `${personality.responses[Math.floor(Math.random() * personality.responses.length)]} I recommend playing between ${moveDesc}. ${tip.explanation} ${tip.reasoning}`,
        shouldSuggestTip: true,
      };
    }
    return {
      answer: "Let me analyze the board... The best move depends on controlling key squares. The center square is especially important as it's part of 4 winning lines. Try to create multiple threats while blocking your opponent's potential wins. Would you like me to suggest a specific move?",
    };
  }
  
  // Cycle / entanglement questions
  if (lowerQuestion.match(/\b(cycle|entangle|collapse|measurement|quantum.*loop)\b/)) {
    let answer = "Great question! Quantum cycles are a key strategic element:\n\n";
    answer += "**How cycles work:** When you place marks that create a loop in the entanglement graph, a measurement occurs. ";
    answer += "The OTHER player (who didn't create the cycle) gets to choose how to collapse it by picking one of the two squares from your last move.\n\n";
    answer += "**Why this matters:** This gives you strategic control! You can force your opponent into difficult choices. ";
    answer += "When creating a cycle, think about which collapse option would benefit you more, and try to make both options favorable.\n\n";
    if (hasPendingCycle) {
      answer += "Right now, there's a pending cycle! Your opponent will choose how to collapse it.";
    }
    return { answer };
  }
  
  // Strategy / how to win / tactics
  if (lowerQuestion.match(/\b(strategy|tactic|how.*win|winning|beat|defeat|outplay)\b/)) {
    let answer = "Here's a winning strategy for quantum tic-tac-toe:\n\n";
    answer += "**1. Control the center:** The center square (square 4) is crucial - it's part of 4 winning lines (both diagonals, middle row, and middle column).\n\n";
    answer += "**2. Create multiple threats:** Don't just focus on one winning line. Set up multiple potential wins so your opponent can't block them all.\n\n";
    answer += "**3. Use cycles strategically:** When you create a cycle, your opponent chooses the collapse. Try to make both collapse options work in your favor.\n\n";
    answer += "**4. Block your opponent:** Watch for their potential winning lines and block them before they can complete them.\n\n";
    answer += "**5. Think ahead:** Consider what happens after a collapse. Will it help or hurt your position?";
    return { answer };
  }
  
  // Center / middle square
  if (lowerQuestion.match(/\b(center|middle|square.*4|central)\b/)) {
    return {
      answer: "The center square is the most important square on the board! Here's why:\n\n" +
        "**Strategic value:** It's part of 4 winning lines:\n" +
        "• Top-left to bottom-right diagonal\n" +
        "• Top-right to bottom-left diagonal\n" +
        "• Middle row (left to right)\n" +
        "• Middle column (top to bottom)\n\n" +
        "**Why it matters:** Controlling the center gives you maximum flexibility and makes it much harder for your opponent to block all your winning opportunities. " +
        "If you can get the center early, you'll have a significant advantage!",
    };
  }
  
  // Rules / how to play / basics
  if (lowerQuestion.match(/\b(rule|how.*play|basic|beginner|start|learn|understand|explain.*game)\b/)) {
    let answer = "Let me explain the basics of quantum tic-tac-toe:\n\n";
    answer += "**1. Making moves:** Each turn, you place TWO marks (called 'spooky marks') in different empty squares. These squares become 'entangled'.\n\n";
    answer += "**2. Cycles and collapse:** When your marks create a loop (cycle), a measurement happens. The OTHER player chooses how to collapse it by picking one square from your last move. This forces connected entanglements to become 'classical marks' (permanent).\n\n";
    answer += "**3. Winning:** Get three classical marks in a row to win! If both players get three-in-a-row, the one with the lower maximum move number wins.\n\n";
    answer += "**4. Strategy:** Control key squares (especially the center), create multiple threats, and use cycles strategically!";
    return { answer };
  }
  
  // Spooky marks / entanglement
  if (lowerQuestion.match(/\b(spooky|entangle|quantum.*mark|mark.*mean)\b/)) {
    return {
      answer: "Spooky marks (also called quantum marks) are the marks you place each turn:\n\n" +
        "**What they are:** When you place two marks, they're in a 'superposition' - they could collapse to either square. They're labeled with your emoji and move number.\n\n" +
        "**How they work:** Spooky marks become 'entangled' - they're connected. When a cycle forms, the collapse determines which squares get classical (permanent) marks.\n\n" +
        "**Why they matter:** This quantum mechanic adds strategy! You can create multiple potential winning positions simultaneously.",
    };
  }
  
  // Classical marks
  if (lowerQuestion.match(/\b(classical|permanent|locked|fixed|collapsed)\b/)) {
    return {
      answer: "Classical marks are permanent marks that appear after a cycle collapse:\n\n" +
        "**How they form:** When a cycle is collapsed, the entanglement resolves and some squares get classical marks. These are the 'real' marks that count toward winning.\n\n" +
        "**Key property:** Once a square has a classical mark, it's locked - no more spooky marks can be placed there. This is how the game progresses toward a win!\n\n" +
        "**Winning condition:** You need three classical marks in a row (horizontally, vertically, or diagonally) to win.",
    };
  }
  
  // Current game state questions
  if (lowerQuestion.match(/\b(current|now|right now|this.*game|board.*state|position)\b/)) {
    let answer = "Let me analyze the current game state:\n\n";
    answer += `**Move number:** ${moveCount}\n`;
    answer += `**Classical marks:** ${classicalCount} squares have permanent marks\n`;
    if (hasPendingCycle) {
      answer += "**Status:** There's a pending cycle waiting to be collapsed!\n";
    } else {
      answer += "**Status:** No pending cycles - you can make a move\n";
    }
    if (winner) {
      answer += `**Winner:** ${winner.player} has won with ${winner.score} point(s)!`;
    } else {
      answer += "**Winner:** No winner yet - keep playing!";
    }
    return { answer };
  }
  
  // Help / stuck / confused
  if (lowerQuestion.match(/\b(help|stuck|confused|don.*understand|lost|what.*do|hint)\b/)) {
    const tip = getPlayerTip(gameState);
    let answer = "Don't worry, I'm here to help! Here are some tips:\n\n";
    answer += "**Quick tips:**\n";
    answer += "• Try to control the center square\n";
    answer += "• Create multiple winning opportunities\n";
    answer += "• Block your opponent's potential wins\n";
    answer += "• Use cycles strategically\n\n";
    if (tip) {
      answer += "I can also suggest a specific move if you'd like!";
      return { answer, shouldSuggestTip: true };
    }
    answer += "Would you like me to analyze the board and suggest a move?";
    return { answer };
  }
  
  // Default response - try to be helpful
  const tip = getPlayerTip(gameState);
  let answer = `${personality.responses[Math.floor(Math.random() * personality.responses.length)]} `;
  answer += "I'm here to help you understand and win at quantum tic-tac-toe! ";
  answer += "You can ask me about:\n\n";
  answer += "• **Strategy and tactics** - how to win\n";
  answer += "• **Rules and mechanics** - how the game works\n";
  answer += "• **Cycles and entanglement** - the quantum mechanics\n";
  answer += "• **Best moves** - what to play next\n";
  answer += "• **Current game state** - what's happening now\n\n";
  if (tip) {
    answer += "I can also suggest a specific move if you'd like!";
    return { answer, shouldSuggestTip: true };
  }
  answer += "What would you like to know?";
  return { answer };
}

