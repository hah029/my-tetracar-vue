import { onMounted, onUnmounted, type Ref } from "vue";
import { useGameState } from "../store/gameState";
import { useHUD } from "./useHUD";
import type { useGame } from "./useGame";
import type { Camera, Scene, WebGLRenderer } from "three";

export function GameLoop(game: ReturnType<typeof useGame>, scene: Scene, camera: Camera, renderer: WebGLRenderer) {
  const gameState = useGameState();
  const hud = useHUD();

  // let collisionCooldown = false;
  let gameOverTimer: number | null = null;

  // function animate() {
  //   const currentSpeed = gameStore.getCurrentSpeed();

  //   renderer.render(scene, camera);

  //   if (gameStore.currentState !== "playing") return;

  //   game.updatePlayer();
  //   game.updateObstacles(currentSpeed);
  //   game.updateRoad(currentSpeed);

  //   if (!game.car.value.isDestroyed) {
  //     gameStore.baseSpeed += gameStore.baseSpeed < gameStore.maxSpeed ? 0.0005 : 0;
  //     gameStore.speed = currentSpeed;

  //     // Обновление машины
  //     const deltaX = game.car.value.targetX - game.car.value.mesh.position.x;
  //     game.car.value.mesh.rotation.y += (-deltaX * 0.3 - game.car.value.mesh.rotation.y) * 0.1;
  //     game.car.value.mesh.position.x += deltaX * 0.1;
  //   }

  //   // Обновление HUD
  //   const dangerLevel = game.getDangerLevel(currentSpeed);
  //   hud.updateHUD(currentSpeed, gameStore.currentLane, dangerLevel);

  //   requestAnimationFrame(animate);
  // }
  function animate() {
    requestAnimationFrame(animate);

    renderer.render(scene, camera);

    // Инициализация дебаг коллайдера
    // if (!debugCollider) {
    //   debugCollider = createDebugCollider();
    // }

    // Если не в игре, просто рендерим
    if (gameState.currentState !== "playing") {
      return;
    }

    // Обновляем скорость
    let currentSpeed = gameState.baseSpeed;
    if (gameState.isNitroEnabled && !game.car.value.isDestroyed) {
      currentSpeed *= gameState.NITRO_MULTIPLIER;
      // pulseNitro();
    }

    if (!game.car.value.isDestroyed) {
      gameState.baseSpeed += gameState.baseSpeed < gameState.maxSpeed ? 0.0005 : 0.0;
    }
    gameState.speed = currentSpeed;

    // Обновляем счёт и HUD
    if (!game.car.value.isDestroyed) {
      gameState.addScore(currentSpeed * 1.0);
    }
    const dangerLevel = gameState.getDangerLevel();
    hud.updateHUD(currentSpeed, gameState.currentLane, dangerLevel);

    // // Если машина разрушена, обновляем анимацию разлёта
    if (game.car.value.isDestroyed) {
      game.updateDestroyedCubes(scene);
      game.updateCameraForDestroyedState(camera);
    } else {
      // Нормальное обновление игры
      game.updateCar();
      game.updateObstacles(currentSpeed);

      // game.updateJumps(currentSpeed);
      // game.applyJump();

      // Проверка столкновений
      const collisionResult = game.checkObstacleCollision();
      if (collisionResult.collision) {
        // Разрушаем машину
        game.destroyCar(collisionResult.impactPoint);

        // Запускаем таймер для показа меню Game Over
        if (gameOverTimer) clearTimeout(gameOverTimer);
        gameState.setState("gameover");

        return; // Выходим, чтобы не обновлять камеру дальше
      }
    }

    // // Обновляем дебаг коллайдер
    // if (debugCollider) {
    //   debugCollider.updateDebug();
    // }

    // Обновляем камеру
    game.updateCamera(camera, currentSpeed);

    // Обновляем дорожные объекты
    game.updateRoad(currentSpeed);
  }

  onMounted(() => animate());
  onUnmounted(() => {
    if (gameOverTimer) clearTimeout(gameOverTimer);
  });

  return { animate };
}