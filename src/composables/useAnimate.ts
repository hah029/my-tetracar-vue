// src/composables/useAnimate.ts
import { onMounted, onUnmounted } from "vue";
import { useGameState } from "../store/gameState";
import { useHUD } from "./useHUD";
import type { useGame } from "./useGame";
import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { carManager } from "@/game/sceneStaticObjects/car";

export function GameLoop(game: ReturnType<typeof useGame>, scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer) {
  const gameState = useGameState();
  const hud = useHUD();

  let gameOverTimer: number | null = null;

  let previousState = gameState.currentState;

  function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);

    if (previousState === 'gameover' && gameState.currentState === 'playing') {
      console.log('🔄 Рестарт detected, сбрасываем камеру');
      game.resetCameraPosition(camera); // ← вызываем сброс камеры
    }
    previousState = gameState.currentState;

    // Если не в игре, просто рендерим
    if (gameState.currentState !== "playing" && gameState.currentState !== "gameover") {
      return;
    }

    // ВАЖНО: синхронизируем currentLane в gameState
    try {
      const realCar = carManager.getCar();
      gameState.currentLane = realCar.getCurrentLane();
    } catch (e) {
      // Машина еще не создана
    }

    // Получаем текущую скорость
    let currentSpeed = gameState.getCurrentSpeed();

    // Увеличиваем базовую скорость со временем (только если машина не разрушена)
    if (!game.car.value.isDestroyed) {
      // Проверяем, не был ли сброшен baseSpeed
      if (gameState.baseSpeed < 0.5) { // Если скорость слишком мала, возможно был сброс
        gameState.baseSpeed = 0.5; // Устанавливаем начальную скорость
      }
      gameState.baseSpeed += gameState.baseSpeed < gameState.maxSpeed ? 0.0005 : 0.0;
    }

    // Обновляем счёт (только если машина не разрушена)
    if (!game.car.value.isDestroyed) {
      gameState.addScore(currentSpeed * 1.0);
    }

    // Получаем уровень опасности
    const dangerLevel = game.getDangerLevel();

    // Обновляем HUD
    hud.updateHUD(currentSpeed, gameState.currentLane, dangerLevel);

    // Если машина разрушена, обновляем анимацию разлёта
    if (game.car.value.isDestroyed) {
      game.updateDestroyedCubes();
      // game.updateCameraForDestroyedState(camera);
    } else {
      // Нормальное обновление игры
      game.updateCar();
      game.updateObstacles(currentSpeed);
      game.updateRoad(currentSpeed);

      // Проверка столкновений
      const collisionResult = game.checkObstacleCollision();
      if (collisionResult.collision) {
        // Разрушаем машину
        game.destroyCar(collisionResult.impactPoint);

        // Запускаем таймер для показа меню Game Over
        if (gameOverTimer) clearTimeout(gameOverTimer);
        gameState.endGame();

        return;
      }
    }

    // Обновляем камеру
    game.updateCamera(camera, currentSpeed);
  }

  onMounted(() => animate());
  onUnmounted(() => {
    if (gameOverTimer) clearTimeout(gameOverTimer);
  });

  return { animate };
}