// src/composables/useAnimate.ts
import { onMounted, onUnmounted } from "vue";
import { useGameState } from "../store/gameState";
import { useHUD } from "./useHUD";
import type { useGame } from "./useGame";
import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { carManager } from "@/game/car";
import { CameraSystem } from "@/game/camera/CameraSystem";

export function GameLoop(
  game: ReturnType<typeof useGame>,
  scene: Scene,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
) {
  const gameState = useGameState();
  const hud = useHUD();

  let gameOverTimer: number | null = null;
  let previousState = gameState.currentState;

  function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);

    // Сброс камеры при переходе в игру
    if (previousState === "gameover" && gameState.currentState === "playing") {
      const car = carManager.getCar();
      CameraSystem.reset(car.position.clone());
    }
    previousState = gameState.currentState;

    // Если не в игре, просто рендерим
    if (
      gameState.currentState !== "playing" &&
      gameState.currentState !== "gameover"
    ) {
      return;
    }

    // Синхронизация полосы
    try {
      const realCar = carManager.getCar();
      gameState.currentLane = realCar.getCurrentLane();
    } catch (e) {
      // Машина ещё не создана
    }

    // Текущая скорость
    let currentSpeed = gameState.getCurrentSpeed();

    // Увеличиваем базовую скорость со временем (если машина не разрушена)
    if (!game.car.value.isDestroyed) {
      if (gameState.baseSpeed < 0.5) {
        gameState.baseSpeed = 0.5;
      }
      gameState.baseSpeed +=
        gameState.baseSpeed < gameState.maxSpeed ? 0.0005 : 0;
    }

    // Обновляем счёт
    if (!game.car.value.isDestroyed) {
      gameState.addScore(currentSpeed * 1.0);
    }

    // Уровень опасности
    const dangerLevel = game.getDangerLevel();
    hud.updateHUD(currentSpeed, gameState.currentLane, dangerLevel);

    const realCar = carManager.getCar();
    game.updatePlayer();

    if (realCar.isDestroyed()) {
      CameraSystem.updateDestroyed(realCar.getCubes());
    } else {
      // === Основное обновление игрока ===

      game.updateObstacles(currentSpeed);
      game.updateRoad(currentSpeed);

      const collisionResult = game.checkCollision();
      if (collisionResult.collision) {
        game.destroyCar(collisionResult.impactPoint);
        gameState.endGame();
        return;
      }

      CameraSystem.update(realCar, currentSpeed);
    }
  }

  onMounted(() => animate());
  onUnmounted(() => {
    if (gameOverTimer) clearTimeout(gameOverTimer);
  });

  return { animate };
}
