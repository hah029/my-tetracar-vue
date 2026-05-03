// src/composables/useGame.ts
import * as THREE from "three";
import { ref } from "vue";
// managers
import { RoadManager } from "@/game/road/RoadManager";
import { CarManager } from "@/game/car/CarManager";
import { ObstacleManager } from "@/game/interactive/obstacle/ObstacleManager";
import { CollisionSystem } from "@/game/collision/CollisionSystem";
import { InteractiveItemsManager } from "@/game/interactive/InteractiveItemsManager";
import { BoosterManager } from "@/game/interactive/items/booster/BoosterManager";
import { CoinManager } from "@/game/interactive/items/coin/CoinManager";
import { CityManager } from "@/game/environment/city/CityManager";
import { SoundManager } from "@/game/sound/SoundManager";
import { BulletSystem } from "@/game/combat/BulletSystem";
import { BulletItemManager } from "@/game/interactive/items/bullet/BulletItemManager";
import { DestructionManager } from "@/game/interactive/DestructionManager";
import {
  FlashEffectManager,
  type FlashType,
} from "@/game/effects/FlashEffectManager";
// enums
import { DEFAULT_LANES } from "@/game/road/config/RoadConfig";
import { UpdateMode } from "@/game/core/UpdateMode";
// stores
import { useProgressStore } from "@/store/progressStore";
import { usePlayerStore } from "@/store/playerStore";
import { CameraSystem } from "@/game/camera/CameraSystem";
import { useGameState } from "@/store/gameState";
import { GameStates } from "@/game/core/GameState";
import type { BaseObstacle } from "@/game/interactive/obstacle/BaseObstacle";
import { setupLights } from "@/game/light/setupLight";
import type { CarRef } from "@/game/car";

// Вынесенная функция для создания всех источников света

export function useGame() {
  const playerStore = usePlayerStore();
  const car = ref<CarRef>({
    mesh: new THREE.Group(),
    targetX: 0,
    isDestroyed: false,
    cubes: [] as THREE.Object3D[],
    isJumping: false,
  });

  const obstacles = ref<{ mesh: THREE.Object3D; position: THREE.Vector3 }[]>(
    [],
  );
  const jumps = ref<
    {
      mesh: THREE.Mesh;
      lane: number;
      z: number;
      active?: boolean;
      progress?: number;
    }[]
  >([]);
  let sceneRef: THREE.Scene | null = null;

  let roadManager: RoadManager;
  let carManager: CarManager;
  let obstacleManager: ObstacleManager;
  let coinManager: CoinManager;
  let interactiveManager: InteractiveItemsManager;
  let destructionManager: DestructionManager;
  let cityManager: CityManager;
  let boosterManager: BoosterManager;
  let bulletItemManager: BulletItemManager;
  let soundManager: SoundManager;
  let flashEffectManager: FlashEffectManager;

  function init(scene: THREE.Scene) {
    sceneRef = scene;

    // === Настройка освещения ===
    setupLights(scene);

    // === Инициализация менеджеров ===
    roadManager = RoadManager.getInstance();
    roadManager.initialize({ lanes: DEFAULT_LANES, length: 250 }, scene);

    cityManager = CityManager.getInstance();
    cityManager.initialize(scene);

    obstacleManager = ObstacleManager.getInstance();
    obstacleManager.initialize(scene, true);

    coinManager = CoinManager.getInstance();
    coinManager.initialize(scene);

    boosterManager = BoosterManager.getInstance();
    boosterManager.initialize(scene);

    bulletItemManager = BulletItemManager.getInstance();
    bulletItemManager.initialize(scene);

    interactiveManager = InteractiveItemsManager.getInstance();
    interactiveManager.initialize(
      obstacleManager,
      coinManager,
      boosterManager,
      bulletItemManager,
    );

    destructionManager = DestructionManager.getInstance();
    destructionManager.initialize(scene, interactiveManager);

    carManager = CarManager.getInstance();
    carManager.initialize(scene);

    flashEffectManager = FlashEffectManager.getInstance();
    flashEffectManager.initialize(scene);

    BulletSystem.getInstance().initialize(scene);

    // инициализация происходит на уровне App.vue
    soundManager = SoundManager.getInstance();

    // === Создание дороги и машины ===
    roadManager.createRoad();
    const newCar = carManager.createCar();
    car.value.mesh = newCar;
    car.value.targetX = 0;
    car.value.isDestroyed = false;
    car.value.cubes = [];
    carManager.buildCar(true);
  }

  // метод для вызова вспышки
  function spawnFlash(type: FlashType, position: THREE.Vector3) {
    flashEffectManager.spawnFlash(type, position);
  }

  // === Обновление позиции и состояния машины (вызывать каждый кадр) ===
  function updatePlayer(dt: number) {
    if (!carManager || !roadManager) return;

    const realCar = carManager.getCar();
    realCar.update(dt);

    car.value.mesh = realCar;
    car.value.isDestroyed = realCar.isDestroyed();
    car.value.targetX = roadManager.getLanePosition(realCar.getCurrentLane());

    if (realCar.isDestroyed()) {
      car.value.cubes = realCar.getCubes();
    }
  }

  function updateCity(deltaTime: number, speed: number) {
    if (!cityManager) return;

    cityManager.update(deltaTime, speed);
  }

  function destroyObstacles(
    impactPoint: THREE.Vector3,
    obstacles: BaseObstacle[] = [],
    transformRequired: boolean = true,
  ) {
    if (!obstacleManager) return;
    if (obstacles.length != 0) {
      obstacles.forEach((o) => {
        o.destroy(impactPoint, transformRequired);
      });
    } else {
      obstacleManager.getObstacles().forEach((o) => {
        o.destroy(impactPoint, transformRequired);
      });
    }
  }

  function destroyCar(impactPoint?: THREE.Vector3) {
    if (!carManager) return;

    const realCar = carManager.getCar();
    realCar.destroy(impactPoint || null);
    car.value.isDestroyed = true;
    car.value.cubes = realCar.getCubes();
  }

  function resetPlayer(dt: number) {
    if (!carManager) return;

    carManager.resetCar();
    updatePlayer(dt);
  }

  function movePlayerLeft(dt: number) {
    if (useGameState().currentState != GameStates.Play) return;
    carManager.getCar().moveLeft();
    soundManager.play("sfx_moving");
    updatePlayer(dt);
  }

  function movePlayerRight(dt: number) {
    if (useGameState().currentState != GameStates.Play) return;
    carManager.getCar().moveRight();
    soundManager.play("sfx_moving");
    updatePlayer(dt);
  }

  function jumpPlayer(dt: number) {
    if (useGameState().currentState != GameStates.Play) return;
    carManager.getCar().jump();
    car.value.isJumping = true;
    updatePlayer(dt);
  }

  let obstacleSyncTimer = 0;

  // ==========================
  // Обновление препятствий (привязка к игровому циклу)
  // ==========================
  function updateInteractiveItems(
    deltaTime: number,
    speed: number,
    mode: UpdateMode,
  ) {
    interactiveManager.update(deltaTime, speed, mode);

    obstacleSyncTimer += deltaTime;
    if (obstacleSyncTimer < 1000) return; // ⛔ 1 раз в сек
    obstacleSyncTimer = 0;

    obstacles.value.length = 0;
    interactiveManager.getObstacles().forEach((o) => {
      obstacles.value.push({ mesh: o, position: o.position });
    });
  }
  function updateDestructionItems(deltaTime: number, speed: number) {
    destructionManager.update(deltaTime, speed);
  }

  function resetObstacles() {
    if (!obstacleManager) return;
    obstacleManager.reset();
    obstacles.value = [];
  }

  function updateRoad(deltaTime: number, speed: number) {
    if (!roadManager) return;
    roadManager.update(deltaTime, speed);
  }

  function updateJumps(deltaTime: number, speed: number) {
    if (!obstacleManager) return;

    obstacleManager.getJumps().forEach((jump, index) => {
      if (jump.update(deltaTime, speed)) {
        // remove уже выполняется в менеджере, тут синхронизируем реактивный массив
        jumps.value.splice(index, 1);
      }
    });

    // Синхронизация реактивного массива
    jumps.value = obstacleManager.getJumps().map((jump) => ({
      mesh: jump,
      lane: jump.userData.lane,
      z: jump.position.z,
    }));
  }

  function updateMagnet(deltaTime: number) {
    const car = carManager.getCar();

    const enabled = usePlayerStore().isMagnetEnabled;

    coinManager.applyMagnet(car, deltaTime);
    coinManager.updateMagnetField(car, performance.now(), enabled);
  }

  function resetJumps() {
    if (!obstacleManager) return;
    obstacleManager.getJumps().forEach((jump) => {
      sceneRef?.remove(jump);
    });
    obstacleManager.getJumps().length = 0;
    jumps.value = [];
  }

  function checkCollision(now?: number) {
    if (!carManager || !obstacleManager) return { collision: false };
    return CollisionSystem.checkCollision(
      carManager.getCar(),
      obstacleManager.getJumps(),
      obstacleManager.getObstacles(),
      now,
    );
  }

  function checkCoinCollision() {
    if (!carManager || !coinManager) return { golden: 0, energon: 0, total: 0 };
    return coinManager.checkCarCollision(carManager.getCar());
  }

  function checkBoosterCollision() {
    if (!carManager || !boosterManager)
      return { collision: false, subject: "" };
    return boosterManager.checkCarCollision(carManager.getCar());
  }

  function checkBulletItemCollision() {
    if (!carManager || !bulletItemManager) return 0;
    // if (!carManager || !bulletItemManager) return { collision: false, subject: 0 };
    return bulletItemManager.checkCarCollision(carManager.getCar());
  }

  function getDangerLevel() {
    if (!carManager || !obstacleManager) return 0;
    return CollisionSystem.getDangerLevel(carManager.getCar(), [
      ...obstacleManager.getObstacles(),
    ]);
  }
  function findRootTaggedObject(obj: THREE.Object3D): THREE.Object3D {
    let current: THREE.Object3D | null = obj;

    //    while (current.parent && !current.parent.isScene) {
    while (
      current.parent &&
      (!("isScene" in current.parent) || !current.parent.isScene)
    ) {
      // а то компилятор ругался
      current = current.parent;
    }

    return current;
  }
  function reset() {
    if (!carManager || !obstacleManager || !roadManager || !sceneRef) {
      console.warn("[useGame.reset] missing managers:", {
        carManager: !!carManager,
        obstacleManager: !!obstacleManager,
        roadManager: !!roadManager,
        sceneRef: !!sceneRef,
      });
      return;
    }

    carManager.resetCar();
    interactiveManager.reset();
    destructionManager.reset();
    roadManager.clear();
    CollisionSystem.reset();
    BulletSystem.getInstance().reset();

    // Дополнительная очистка: удаляем оставшиеся объекты по тегам
    if (sceneRef) {
      // const toRemove: THREE.Object3D[] = [];
      // let traverseCount = 0;
      const toRemove = new Set<THREE.Object3D>();

      sceneRef.traverse((obj) => {
        const ud = obj.userData;

        if (
          ud.isObstacle ||
          ud.isCoin ||
          ud.isBooster ||
          ud.isBulletItem ||
          ud.isJump ||
          ud.isInteractiveItem
        ) {
          const root = findRootTaggedObject(obj);
          toRemove.add(root);
        }
      });

      toRemove.forEach((obj) => {
        obj.parent?.remove(obj);
      });
    }

    roadManager.createRoad();

    const newCar = carManager.getCar();
    car.value.mesh = newCar;
    car.value.targetX = roadManager.getLanePosition(newCar.getCurrentLane());
    car.value.isDestroyed = false;
    car.value.cubes = [];

    resetJumps();
    obstacles.value = [];
    // updateInteractiveItems(0, 0, UpdateMode.Destruction); // синхронизация

    playerStore.disableNitro();
    playerStore.resetGameData();
    useProgressStore().resetScore();
    useProgressStore().resetDistance();

    CameraSystem.reset(car.value.mesh.position);
  }

  function shoot() {
    if (useGameState().currentState != GameStates.Play) return;
    const playerStore = usePlayerStore();

    if (!playerStore.canShoot()) {
      playerStore.addNewMsg("outOfAmmo");
      return;
    }

    BulletSystem.getInstance().spawnBullet(CarManager.getInstance().getCar());
    playerStore.consumeAmmo();
    soundManager.play("sfx_shot");
  }

  return {
    car,
    obstacles,
    jumps,

    init,
    updatePlayer,
    destroyCar,
    resetPlayer,
    movePlayerLeft,
    movePlayerRight,
    jumpPlayer,
    shoot,

    updateEffects: () => {
      flashEffectManager?.update();
    },

    addObstacle: (obstacle: THREE.Mesh) => {
      if (sceneRef) sceneRef.add(obstacle);
    },
    updateInteractiveItems,
    updateDestructionItems,
    updateRoad,
    updateJumps,
    updateCity,
    updateMagnet,
    resetObstacles,
    destroyObstacles,
    resetJumps,
    checkCollision,
    checkCoinCollision,
    checkBoosterCollision,
    checkBulletItemCollision,
    getDangerLevel,
    reset,
    spawnFlash,
  };
}
