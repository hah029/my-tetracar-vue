// src/composables/usePlayer.ts
import { carManager } from "../game/sceneStaticObjects/car/CarManager";

export function usePlayer() {
  function moveLeft() {
    carManager.moveLeft();
  }

  function moveRight() {
    carManager.moveRight();
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