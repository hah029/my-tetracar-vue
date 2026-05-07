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
// import { SoundManager } from "@/game/sound/SoundManager";
import { DebugColliderVisualizer } from "@/helpers/debug/DebugColliderVisualizer";
import { UpdateMode } from "@/game/core/UpdateMode";
// import { CarManager } from "@/game/car";
import { BulletSystem } from "@/game/combat/BulletSystem";
import { GameStates } from "@/game/core/GameState";
import { Jump } from "@/game/interactive/obstacle";
import { BaseObstacle } from "@/game/interactive/obstacle/BaseObstacle";
import { CoinItem } from "@/game/interactive/items/coin/CoinItem";
import { BoosterItem } from "@/game/interactive/items/booster/BoosterItem";
import type { BaseItem } from "@/game/interactive/items/BaseItem";

export function GameLoop(
  game: ReturnType<typeof useGame>,
  composer: EffectComposer,
  // motionBlur: AfterimagePass,
  debugCollider?: DebugColliderVisualizer,
) {
  const gameState = useGameState();
  const playerStore = usePlayerStore();
  const progressStore = useProgressStore();

  // const soundManager = SoundManager.getInstance();

  // ----------------------------
  // показываем / скрываем FPS-панель через Ctrl+Q
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  let isDevPanelVisible = false;
  const el = document.body.appendChild(stats.dom);
  el.style.visibility = isDevPanelVisible ? "visible" : "hidden";
  // ---
  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "q":
      case "Q":
      case "й":
      case "Й":
        if (event.ctrlKey) {
          isDevPanelVisible = !isDevPanelVisible;
          el.style.visibility = isDevPanelVisible ? "visible" : "hidden";
        }
        break;
    }
  }

  // ----------------------------
  let lastTime = 0;
  let rafId: number | null = null;

  // --- Вспомогательные функции (без изменений) ---
  function updateDestruction(deltaTime: number, speed: number) {
    CameraSystem.updateDestroyed(game.car.value.cubes, deltaTime);
    game.updateInteractiveItems(deltaTime, speed, UpdateMode.Destruction);
  }

  function updateGame(deltaTime: number, currentSpeed: number) {
    progressStore.addDistance(deltaTime * currentSpeed);

    game.updateInteractiveItems(deltaTime, currentSpeed, UpdateMode.Gameplay);
    game.updateRoad(deltaTime, currentSpeed);
    game.updateCity(deltaTime, currentSpeed);

    BulletSystem.getInstance().update(deltaTime);

    game.updateEffects();

    // обрабатываем коллизии машинки с игровыми предметами
    let obstacleCollision = game.checkObstaclesCollision(performance.now());

    // если произошло столкновение с любым препятствием -> обрабатываем его
    if (obstacleCollision != null) {
      // обработка Jump
      if (obstacleCollision.impactSubject instanceof Jump) {
        game.handleJumpCollision(deltaTime);
        // обработка BaseObstacle
      } else if (obstacleCollision.impactSubject instanceof BaseObstacle) {
        // handleBaseObstacleCollision возвращает флаг уничтожения машины
        if (game.handleBaseObstacleCollision(obstacleCollision, currentSpeed))
          gameState.endGame();
      }
    }

    const itemCollision = game.checkItemsCollision();
    if (itemCollision != null) {
      if (itemCollision.impactSubject instanceof CoinItem) {
        // обработка Coin
        game.handleCoinCollision(itemCollision);
      } else if (itemCollision.impactSubject instanceof BoosterItem) {
        game.handleBoosterCollision(itemCollision);
      }
      game.removeItem(itemCollision.impactSubject as BaseItem);
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
    // const startTime = performance.now();
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

    // const frameTime = performance.now() - startTime;
    // if (frameTime > 25) { // 25ms = 40 FPS
    //     console.warn(`🐌 Долгий кадр: ${frameTime.toFixed(2)}ms`);
    // };
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

    setupEventListeners: () => {
      window.addEventListener("keydown", handleKeyDown);
    },
    cleanupEventListeners: () => {
      window.removeEventListener("keydown", handleKeyDown);
    },
  };
}
