export type Player = 'X' | 'O';

export type SquareId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface PlayerEmoji {
  X: string;
  O: string;
}

export interface QuantumMove {
  id: string;
  player: Player;
  moveIndex: number;
  a: SquareId;
  b: SquareId;
  collapsedTo?: SquareId;
}

export interface ClassicalMark {
  player: Player;
  moveIndex: number;
}

export interface GameState {
  moves: QuantumMove[];
  classical: (ClassicalMark | null)[];
  currentPlayer: Player;
  moveNumber: number;
  pendingCycle?: {
    cycleMoveId: string;
    chooser: Player;
  };
  winner?: {
    player: Player;
    score: number;
  };
  gameOver: boolean;
  emojis?: PlayerEmoji;
  emojiSelectionComplete?: boolean;
}

export type GameMode = 'two-player' | 'vs-bot';

export type BotDifficulty = 'beginner' | 'medium' | 'advanced';

export interface GameConfig {
  mode: GameMode;
  botPlayer?: Player;
  botDifficulty?: BotDifficulty;
}

