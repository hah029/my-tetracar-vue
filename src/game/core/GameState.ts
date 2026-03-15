// src/game/core/GameStates.ts
export const GameStates = {
  Preloader: "preloader",
  Menu: "menu",
  Play: "play",
  Gameover: "gameover",
  Pause: "pause",
  Countdown: "countdown",
};

export type GameStates = (typeof GameStates)[keyof typeof GameStates];
