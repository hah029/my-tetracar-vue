// src/composables/useAnimate.ts
import * as THREE from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { useGameState } from "@/store/gameState";
import { usePlayerStore } from "@/store/playerStore";
import { useProgressStore } from "@/store/progressStore";
import { useGame } from "./useGame";
import { CameraSystem } from "@/game/camera/CameraSystem";
import { DebugColliderVisualizer } from "@/helpers/debug/DebugColliderVisualizer";
import { UpdateMode } from "@/game/core/UpdateMode";
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
  debugCollider?: DebugColliderVisualizer,
  setRGBShiftAmount?: any,
) {
  const gameState = useGameState();
  const playerStore = usePlayerStore();
  const progressStore = useProgressStore();

  const stats = new Stats();
  document.body.appendChild(stats.dom);
  let isDevPanelVisible = false;
  const el = document.body.appendChild(stats.dom);
  el.style.visibility = isDevPanelVisible ? "visible" : "hidden";

  function handleKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "keyQ":
        if (event.ctrlKey) {
          isDevPanelVisible = !isDevPanelVisible;
          el.style.visibility = isDevPanelVisible ? "visible" : "hidden";
        }
        break;
    }
  }

  function updateDestruction(
    deltaTime: number,
    speed: number,
    carPosition?: THREE.Vector3,
  ) {
    CameraSystem.updateDestroyed(game.car.value.cubes, deltaTime, carPosition);
    game.updateInteractiveItems(deltaTime, speed, UpdateMode.Destruction);
  }

  let lastTime = 0;
  let rafId: number | null = null;

  function animate(time: number) {
    rafId = requestAnimationFrame(animate);

    if (lastTime === 0) {
      lastTime = time;
      stats.begin();
      // 👇 ВОЗВРАЩАЕМ РЕНДЕР
      if (composer) composer.render();
      stats.end();
      return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    stats.begin();

    const currentState = gameState.currentState;
    if (currentState === GameStates.Pause) {
      stats.end();
      return;
    }

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

      if (!isGameOver) {
        if (playerStore.baseSpeed < playerStore.startSpeed)
          playerStore.baseSpeed = playerStore.startSpeed;
        playerStore.baseSpeed += playerStore.getCurrentAcceleration();
        if (playerStore.baseSpeed > playerStore.maxSpeed)
          playerStore.baseSpeed = playerStore.maxSpeed;
      }

      game.updatePlayer(deltaTime);

      if (isGameOver) {
        const isValidVector = (v: THREE.Vector3) =>
          v &&
          !isNaN(v.x) &&
          !isNaN(v.y) &&
          !isNaN(v.z) &&
          isFinite(v.x) &&
          isFinite(v.y) &&
          isFinite(v.z);
        const carPos = realCar?.position;
        const cameraAnchor =
          realCar && "getGameOverCameraPosition" in realCar
            ? (realCar as any).getGameOverCameraPosition()
            : null;
        const safePosition =
          cameraAnchor && isValidVector(cameraAnchor)
            ? cameraAnchor
            : carPos && isValidVector(carPos)
              ? carPos
              : undefined;
        updateDestruction(deltaTime, 0, safePosition);
      } else {
        progressStore.addDistance(deltaTime * currentSpeed);
        game.updateInteractiveItems(
          deltaTime,
          currentSpeed,
          UpdateMode.Gameplay,
        );
        game.updateRoad(deltaTime, currentSpeed);
        game.updateCity(deltaTime, currentSpeed, game.car.value.mesh.position);

        BulletSystem.getInstance().update(deltaTime);

        let obstacleCollision = game.checkObstaclesCollision(performance.now());

        if (obstacleCollision != null) {
          if (obstacleCollision.impactSubject instanceof Jump) {
            game.handleJumpCollision(deltaTime);
          } else if (obstacleCollision.impactSubject instanceof BaseObstacle) {
            if (
              game.handleBaseObstacleCollision(obstacleCollision, currentSpeed)
            )
              gameState.endGame();
          }
        }

        const itemCollision = game.checkItemsCollision();
        if (itemCollision != null) {
          if (
            playerStore.magnetMode === "lethalPull" &&
            (itemCollision.impactSubject as BaseItem).userData.status ===
              "magnetized"
          ) {
            const impactSubject = itemCollision.impactSubject as BaseItem;
            game.destroyCar(impactSubject.position.clone());
            game.removeItem(impactSubject);
            gameState.endGame();
          } else if (itemCollision.impactSubject instanceof CoinItem) {
            game.handleCoinCollision(itemCollision);
            game.removeItem(itemCollision.impactSubject as BaseItem);
          } else if (itemCollision.impactSubject instanceof BoosterItem) {
            game.handleBoosterCollision(itemCollision);
            game.removeItem(itemCollision.impactSubject as BaseItem);
          }
        }

        const realCar = game.car.value.mesh;
        if (realCar) {
          const cameraFollowPosition =
            "getCameraFollowPosition" in realCar
              ? (realCar as any).getCameraFollowPosition()
              : realCar.position;
          CameraSystem.update(
            {
              position: cameraFollowPosition,
              rotation: realCar.rotation,
              isDestroyed: () => game.car.value.isDestroyed,
            },
            currentSpeed,
            deltaTime,
          );
        }

        game.updateEffects();
        usePlayerStore().updateNitro(deltaTime);
        usePlayerStore().updateStatusEffects(deltaTime);
        debugCollider?.update();
      }

      game.updateEffects();
    } else {
      const currentSpeed = playerStore.baseSpeed;
      game.updateRoad(deltaTime, currentSpeed);
      game.updateCity(deltaTime, currentSpeed);
    }

    // 👇 ВОЗВРАЩАЕМ РЕНДЕР
    if (composer) composer.render();
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
    setupEventListeners: () => {
      window.addEventListener("keydown", handleKeyDown);
    },
    cleanupEventListeners: () => {
      window.removeEventListener("keydown", handleKeyDown);
    },
  };
}