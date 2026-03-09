// src/composables/useAnimate.ts
import * as THREE from "three";
import { useGameState } from "../store/gameState";
import { usePlayerStore } from "../store/playerStore";
import { useHUD } from "./useHUD";
import { useGame } from "./useGame";
import { CameraSystem } from "@/game/camera/CameraSystem";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { UpdateMode } from "@/game/core/UpdateMode";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
import { SoundManager } from "@/game/sound/SoundManager";
import type { DebugColliderVisualizer } from "@/helpers/debug/DebugColliderVisualizer";

export function GameLoop(
  game: ReturnType<typeof useGame>,
  composer: EffectComposer,
  motionBlur: AfterimagePass,
  debugCollider?: DebugColliderVisualizer,
) {
  const gameState = useGameState();
  const playerStore = usePlayerStore();
  const hud = useHUD();

  // вот это мой менеджер (он уже имеет все нужные звуки)
  const soundManager = SoundManager.getInstance();

  let previousState = gameState.currentState;
  const stats = new Stats();
  document.body.appendChild(stats.dom);

  // FPS limiter
  const FPS = 60;
  const FRAME_TIME = 1000 / FPS;
  let lastTime = 0;
  let started = false;
  let rafId: number | null = null;

  function updateDestruction(deltaTime: number) {
    // 🔥 ТОЛЬКО разрушения
    CameraSystem.updateDestroyed(game.car.value.cubes, deltaTime);
    game.updateInteractiveItems(deltaTime, 0, UpdateMode.Destruction);
  }

  function updateGame(deltaTime: number, currentSpeed: number) {
    gameState.addDistance(deltaTime * currentSpeed);

    game.updateInteractiveItems(deltaTime, currentSpeed, UpdateMode.Gameplay);
    game.updateRoad(deltaTime, currentSpeed);
    game.updateCity(deltaTime, currentSpeed);

    const collisionResult = game.checkCollision(performance.now());
    if (collisionResult.collision) {
      if (collisionResult.jump) {
        game.jumpPlayer();
      } else {
        game.destroyCar(collisionResult.impactPoint);
        game.destroyObstacles(collisionResult.impactPoint);
        soundManager.play("sfx_destroy_bot");
        const strength = Math.min(currentSpeed / playerStore.maxSpeed, 1);
        CameraSystem.triggerImpactShake(strength);
        motionBlur.damp = 0.82;
        gameState.endGame();
        return false; // ❗ сигнал «игра закончена»
      }
    }

    const coins = game.checkCoinCollision();
    if (coins > 0) {
      soundManager.play("sfx_add_patron");
      gameState.addScore(coins);
    }

    const boostCollisions = game.checkBoosterCollision();
    if (boostCollisions.collision) {
      if (boostCollisions.subject === "nitro") {
        playerStore.enableNitro();
      } else {
        console.error(
          "Undefined booster collision subject:",
          boostCollisions.subject,
        );
      }
    }

    const realCar = game.car.value.mesh;
    if (realCar) {
      CameraSystem.update(
        {
          position: realCar.position,
          rotation: realCar.rotation,
          isDestroyed: () => game.car.value.isDestroyed,
        },
        currentSpeed,
      );
    }
    return true;
  }

  function animate(time: number) {
    rafId = requestAnimationFrame(animate);

    if (!started) {
      started = true;
      return;
    }

    const deltaTime = time - lastTime;
    if (deltaTime < FRAME_TIME) return;

    lastTime = time;

    stats.begin();

    // =========================
    // STATE TRANSITIONS
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
      composer.render();
      stats.end();
      return;
    }

    const realCar = game.car.value.mesh;
    if (realCar) {
      try {
        playerStore.currentLane = (realCar as any).getCurrentLane();
      } catch {}
    }

    const isGameOver = game.car.value.isDestroyed;
    let currentSpeed = playerStore.getCurrentSpeed();
    const speedFactor = Math.min(currentSpeed / playerStore.maxSpeed, 1);

    // меньше damp = сильнее blur
    motionBlur.damp = THREE.MathUtils.lerp(0.2, 0.99, speedFactor);
    // motionBlur.damp = speedFactor;

    // motionBlur.uniforms["damp"] = speedFactor;
    if (!isGameOver) {
      if (playerStore.baseSpeed < playerStore.BASE_SPEED) {
        playerStore.baseSpeed = playerStore.BASE_SPEED;
      }

      playerStore.baseSpeed += playerStore.getCurrentAcceleration();
      if (playerStore.baseSpeed > playerStore.maxSpeed) {
        playerStore.baseSpeed = playerStore.maxSpeed;
      }
    }

    const dangerLevel = game.getDangerLevel();
    hud.updateHUD(currentSpeed, playerStore.currentLane, dangerLevel);

    game.updatePlayer();

    // =========================
    // MAIN UPDATE
    // =========================

    if (isGameOver) {
      updateDestruction(deltaTime);
    } else {
      const stillPlaying = updateGame(deltaTime, currentSpeed);
      debugCollider?.update();
      if (!stillPlaying) {
        stats.end();
        return;
      }
    }

    composer.render();
    stats.end();
  }

  function start() {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(animate);
  }

  function stop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return {
    start,
    stop,
  };
}
