// src/game/core/GameStates.ts
export const GameStates = {
  Preloader: "preloader",
  Menu: "menu",
  Play: "play",
  Gameover: "gameover",
  Pause: "pause",
};

export type GameStates = (typeof GameStates)[keyof typeof GameStates];
