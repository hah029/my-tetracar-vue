// src/composables/useAnimate.ts
// import { onMounted, onUnmounted } from "vue";
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

  // let gameOverTimer: number | null = null;
  let previousState = gameState.currentState;
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  // FPS limiter
  const FPS = 30;
  const FRAME_TIME = 1000 / FPS;
  let lastTime = 0;
  let started = false;

  // let renders = 0;
  let rafId: number | null = null;
  let intervalId: number | null = null;

  // intervalId = window.setInterval(() => {
  //   console.log("renders/sec =", renders);
  //   renders = 0;
  // }, 1000);

  function animate(time: number) {
    rafId = requestAnimationFrame(animate);

    // ✅ Инициализация первого кадра
    if (!started) {
      lastTime = time;
      started = true;
      return;
    }

    const delta = time - lastTime;
    if (delta < FRAME_TIME) return;

    lastTime = time - (delta % FRAME_TIME);

    stats.begin();

    // =========================
    // ЛОГИКА ИГРЫ
    // =========================

    if (previousState === "gameover" && gameState.currentState === "playing") {
      game.reset();
      const carMesh = game.car.value.mesh;
      if (carMesh) {
        CameraSystem.reset(carMesh.position.clone());
      }
    }
    previousState = gameState.currentState;

    if (
      gameState.currentState !== "playing" &&
      gameState.currentState !== "gameover"
    ) {
      renderer.render(scene, camera);
      stats.end();
      return;
    }

    const realCar = game.car.value.mesh;

    if (realCar) {
      try {
        gameState.currentLane = (realCar as any).getCurrentLane();
      } catch {}
    }

    let currentSpeed = gameState.getCurrentSpeed();

    if (!game.car.value.isDestroyed) {
      if (gameState.baseSpeed < gameState.BASE_SPEED) {
        gameState.baseSpeed = gameState.BASE_SPEED;
      }
      gameState.baseSpeed += gameState.getCurrentAcceleration();
      // gameState.addScore(currentSpeed);
    }

    const dangerLevel = game.getDangerLevel();
    hud.updateHUD(currentSpeed, gameState.currentLane, dangerLevel);

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
        stats.end();
        return;
      }

      CameraSystem.update(realCar, currentSpeed);
    }

    // renders++;
    renderer.render(scene, camera);
    stats.end();
  }

  function start() {
    if (rafId !== null) return; // защита от двойного запуска
    rafId = requestAnimationFrame(animate);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  // onMounted(() => {
  //   rafId = requestAnimationFrame(animate);
  // });
  // onUnmounted(() => {
  //   if (rafId !== null) cancelAnimationFrame(rafId);
  //   if (intervalId !== null) clearInterval(intervalId);
  //   if (gameOverTimer) clearTimeout(gameOverTimer);
  // });

  return {
    start,
    stop,
  };
}
