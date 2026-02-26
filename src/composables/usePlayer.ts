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





// Вместо:
// import { moveLeft, car, updatePlayer } from './game/player.js';

// // Теперь:
// import { player } from './game/Player.js';

// // Управление
// player.moveLeft();
// player.moveRight();
// player.update(0.1);

// // Построение машины
// await player.buildCar('path/to/model.glb');

// // Проверка столкновений
// if (player.checkObstacleCollision(obstacle)) {
//   player.destroyCar(impactPoint);
// }

// // Сброс
// player.reset();