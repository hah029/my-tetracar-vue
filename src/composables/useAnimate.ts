// src/composables/useAnimate.ts
import { onMounted, onUnmounted } from "vue";
import { useGameState } from "../store/gameState";
import { useHUD } from "./useHUD";
import type { useGame } from "./useGame";
import type { PerspectiveCamera, Scene, WebGLRenderer } from "three";
// import { carManager } from "@/game/car";
import { CameraSystem } from "@/game/camera/CameraSystem";
import Stats from "three/examples/jsm/libs/stats.module.js";

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
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  function animate() {
    requestAnimationFrame(animate);
    stats.begin();

    renderer.render(scene, camera);

    // Сброс камеры при рестарте игры
    if (previousState === "gameover" && gameState.currentState === "playing") {
      game.reset();

      const carMesh = game.car.value.mesh;
      if (carMesh) {
        CameraSystem.reset(carMesh.position.clone());
      }
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
    const realCar = game.car.value.mesh;
    if (realCar) {
      try {
        gameState.currentLane = (realCar as any).getCurrentLane();
      } catch (e) {
        // машина ещё не создана
      }
    }

    // Текущая скорость
    let currentSpeed = gameState.getCurrentSpeed();

    // Увеличение базовой скорости
    if (!game.car.value.isDestroyed) {
      if (gameState.baseSpeed < gameState.BASE_SPEED)
        gameState.baseSpeed = gameState.BASE_SPEED;
      gameState.baseSpeed += gameState.getCurrentAcceleration();
    }

    // Обновление счёта
    if (!game.car.value.isDestroyed) {
      gameState.addScore(currentSpeed * 1.0);
    }

    // Уровень опасности
    const dangerLevel = game.getDangerLevel();
    hud.updateHUD(currentSpeed, gameState.currentLane, dangerLevel);

    // === Основное обновление игрока ===
    game.updatePlayer();

    if (game.car.value.isDestroyed) {
      CameraSystem.updateDestroyed(game.car.value.cubes);
    } else {
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
    stats.end();
  }

  onMounted(() => animate());
  onUnmounted(() => {
    if (gameOverTimer) clearTimeout(gameOverTimer);
  });

  return { animate };
}
