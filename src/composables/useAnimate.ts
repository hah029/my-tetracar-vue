// src/composables/useAnimate.ts
// import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
// import { AfterimagePass } from "three/examples/jsm/postprocessing/AfterimagePass.js";
// composables
import { useGameState } from "@/store/gameState";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { useGame } from "./useGame";
// managers
import { CameraSystem } from "@/game/camera/CameraSystem";
import { SoundManager } from "@/game/sound/SoundManager";
import { DebugColliderVisualizer } from "@/helpers/debug/DebugColliderVisualizer";
import { UpdateMode } from "@/game/core/UpdateMode";
import { CarManager } from "@/game/car";
import { BulletSystem } from "@/game/combat/BulletSystem";
import { GameStates } from "@/game/core/GameState";

export function GameLoop(
  game: ReturnType<typeof useGame>,
  composer: EffectComposer,
  // motionBlur: AfterimagePass,
  debugCollider?: DebugColliderVisualizer,
) {
  const gameState = useGameState();
  const playerStore = usePlayerStore();
  const progressStore = useProgressStore();

  const soundManager = SoundManager.getInstance();

  const stats = new Stats();
  document.body.appendChild(stats.dom);

  let lastTime = 0;
  let rafId: number | null = null;

  // --- Вспомогательные функции (без изменений) ---
  function updateDestruction(deltaTime: number, speed: number) {
    CameraSystem.updateDestroyed(game.car.value.cubes, deltaTime);
    game.updateInteractiveItems(deltaTime, speed, UpdateMode.Destruction);
    game.updateDestructionItems(deltaTime, speed);
  }

  function updateGame(deltaTime: number, currentSpeed: number) {
    progressStore.addDistance(deltaTime * currentSpeed);

    game.updateInteractiveItems(deltaTime, currentSpeed, UpdateMode.Gameplay);
    game.updateRoad(deltaTime, currentSpeed);
    game.updateCity(deltaTime, currentSpeed);
    game.updateDestructionItems(deltaTime, currentSpeed);
    BulletSystem.getInstance().update(deltaTime);

    const collisionResult = game.checkCollision(performance.now());
    if (collisionResult.collision) {
      if (collisionResult.jump) {
        game.jumpPlayer(deltaTime);
      } else if (collisionResult.obstacle) {
        if (playerStore.isShieldEnabled) {
          game.destroyObstacles(collisionResult.impactPoint!, [
            collisionResult.obstacle,
          ]);
          CarManager.getInstance().disableShield();
          playerStore.disableShield();
        } else {
          game.destroyCar(collisionResult.impactPoint);
          game.destroyObstacles(
            collisionResult.impactPoint!,
            [collisionResult.obstacle],
            false,
          );
          soundManager.play("sfx_destroy_bot");
          const strength = Math.min(currentSpeed / playerStore.maxSpeed, 1);
          CameraSystem.triggerImpactShake(strength);
          // motionBlur.damp = 0.82;
          gameState.endGame();
          return false;
        }
      }
    }

    const coins = game.checkCoinCollision();
    if (coins.total > 0) {
      soundManager.play("sfx_add_patron");

      if (playerStore.isNitroEnabled) {
        coins.gold *= playerStore.goldNitroMultiplier;
        coins.diamond *= playerStore.diamondNitroMultiplier;
      }
      if (coins.gold > 0) progressStore.addScore(coins.gold);
      if (coins.diamond > 0) progressStore.addDiamondScore(coins.diamond);
    }

    const bulletItems = game.checkBulletItemCollision();
    if (bulletItems > 0) {
      soundManager.play("sfx_add_patron");
      playerStore.addAmmo();
    }

    const boostCollisions = game.checkBoosterCollision();
    if (boostCollisions.collision) {
      if (boostCollisions.subject === "nitro") {
        playerStore.enableNitro();
        CarManager.getInstance().enableNitro();
      } else if (boostCollisions.subject === "shield") {
        playerStore.enableShield();
        CarManager.getInstance().enableShield();
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

  // --- Основной цикл анимации ---
  function animate(time: number) {
    rafId = requestAnimationFrame(animate);

    if (lastTime === 0) {
      lastTime = time;
      stats.begin();
      composer.render();
      stats.end();
      return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    stats.begin();

    const currentState = gameState.currentState;
    if (currentState === GameStates.Pause) {
      return;
    }

    // =========================
    // 1. Активные состояния игры
    // =========================
    if (
      currentState === GameStates.Play ||
      currentState === GameStates.Gameover
    ) {
      const realCar = game.car.value.mesh;
      if (realCar) {
        try {
          playerStore.currentLane = (realCar as any).getCurrentLane();
        } catch {}
      }

      const isGameOver = game.car.value.isDestroyed;
      let currentSpeed = playerStore.getCurrentSpeed();
      // const speedFactor = Math.min(currentSpeed / playerStore.maxSpeed, 1);

      // Настройка motion blur
      // motionBlur.damp = THREE.MathUtils.lerp(0.2, 0.99, speedFactor);

      if (!isGameOver) {
        if (playerStore.baseSpeed < playerStore.BASE_SPEED) {
          playerStore.baseSpeed = playerStore.BASE_SPEED;
        }
        playerStore.baseSpeed += playerStore.getCurrentAcceleration();
        if (playerStore.baseSpeed > playerStore.maxSpeed) {
          playerStore.baseSpeed = playerStore.maxSpeed;
        }
      }

      game.updatePlayer(deltaTime);

      if (isGameOver) {
        updateDestruction(deltaTime, 0);
      } else {
        const stillPlaying = updateGame(deltaTime, currentSpeed);
        debugCollider?.update();
        if (!stillPlaying) {
          stats.end();
          return;
        }
      }
    }
    // =========================
    // 2. Фоновые состояния (меню, загрузка, отсчёт)
    // =========================
    else {
      // Двигаем только дорогу и город с текущей скоростью (без спавна объектов)
      const currentSpeed = playerStore.baseSpeed;

      game.updateRoad(deltaTime, currentSpeed);
      game.updateCity(deltaTime, currentSpeed);

      // Камера не обновляется, остаётся на месте
      // Интерактивные объекты, пули и игрок не обновляются
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

  return { start, stop };
}
