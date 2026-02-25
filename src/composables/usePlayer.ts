// src/composables/usePlayer.ts
export function usePlayer() {
  function moveLeft() {
    console.log("PLAYER moves LEFT (stub)");
  }

  function moveRight() {
    console.log("PLAYER moves RIGHT (stub)");
  }

  return { moveLeft, moveRight };
}