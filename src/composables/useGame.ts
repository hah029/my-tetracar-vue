// src/composables/useGame.ts
import * as THREE from "three";
import { ref } from "vue";
// managers
import { type CollisionResult } from "@/game/collision/CollisionSystem";
import { type FlashType } from "@/game/effects/FlashEffectManager";
import { RoadManager } from "@/game/road/RoadManager";
import { CarManager } from "@/game/car/CarManager";
import { ObstacleManager } from "@/game/interactive/obstacle/ObstacleManager";
import { InteractiveItemsManager } from "@/game/interactive/InteractiveItemsManager";
import { CityManager } from "@/game/environment/city/CityManager";
import { SoundManager } from "@/game/sound/SoundManager";
import { CollisionSystem } from "@/game/collision/CollisionSystem";
import { BulletSystem } from "@/game/combat/BulletSystem";
import { FlashEffectManager } from "@/game/effects/FlashEffectManager";
// enums
import { UpdateMode } from "@/game/core/UpdateMode";
// stores
import { useProgressStore } from "@/store/progressStore";
import { usePlayerStore } from "@/store/playerStore";
// objects
import type { CarRef } from "@/game/car";
import { CameraSystem } from "@/game/camera/CameraSystem";
import { useGameState } from "@/store/gameState";
import { GameStates } from "@/game/core/GameState";
import { setupLights } from "@/game/light/setupLight";
import { BaseObstacle } from "@/game/interactive/obstacle/BaseObstacle";
import { Golden } from "@/game/interactive/items/coin/Golden";
import { Energon } from "@/game/interactive/items/coin/Energon";
import { BaseItem } from "@/game/interactive/items/BaseItem";
import { BulletItem } from "@/game/interactive/items/booster/BulletItem";
import { NitroItem } from "@/game/interactive/items/booster/NitroItem";
import { ShieldItem } from "@/game/interactive/items/booster/ShieldItem";
import { MagnetItem } from "@/game/interactive/items/booster/MagnetItem";
import { MagnetSystem } from "@/game/magnet/MagnetSystem";
import { useEnvironmentStore } from "@/store/environmentStore";

export function useGame() {
  const playerStore = usePlayerStore();
  const progressStore = useProgressStore();
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
  let interactiveManager: InteractiveItemsManager;
  let cityManager: CityManager;
  let soundManager: SoundManager;
  let flashEffectManager: FlashEffectManager;

  let bulletSystem: BulletSystem;
  let collisionSystem: CollisionSystem;

  function init(scene: THREE.Scene) {
    sceneRef = scene;

    // === Настройка освещения ===
    setupLights(scene);

    // === Инициализация менеджеров ===
    roadManager = RoadManager.getInstance();
    roadManager.initialize(
      { lanes: useEnvironmentStore().DEFAULT_LANES, length: 250 },
      scene,
    );

    cityManager = CityManager.getInstance();
    cityManager.initialize(scene);

    obstacleManager = ObstacleManager.getInstance();
    obstacleManager.initialize(scene, true);

    interactiveManager = InteractiveItemsManager.getInstance();
    interactiveManager.initialize(scene, obstacleManager);

    carManager = CarManager.getInstance();
    carManager.initialize(scene);

    flashEffectManager = FlashEffectManager.getInstance();
    flashEffectManager.initialize(scene);

    bulletSystem = BulletSystem.getInstance();
    bulletSystem.initialize(scene);

    MagnetSystem.getInstance().initialize(scene);

    collisionSystem = CollisionSystem.getInstance();

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
  function spawnFlash(
    type: FlashType,
    position: THREE.Vector3,
    size?: number,
    duration?: number,
  ) {
    flashEffectManager.spawnFlash(type, position, size, duration);
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
    interactiveManager.update(carManager.getCar(), deltaTime, speed, mode);

    obstacleSyncTimer += deltaTime;
    if (obstacleSyncTimer < 1000) return; // ⛔ 1 раз в сек
    obstacleSyncTimer = 0;

    obstacles.value.length = 0;
    interactiveManager.getObstacles().forEach((o) => {
      obstacles.value.push({ mesh: o, position: o.position });
    });
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

  function resetJumps() {
    if (!obstacleManager) return;
    obstacleManager.getJumps().forEach((jump) => {
      sceneRef?.remove(jump);
    });
    obstacleManager.getJumps().length = 0;
    jumps.value = [];
  }

  function checkObstaclesCollision(now?: number) {
    if (!carManager || !obstacleManager) return null;
    return collisionSystem.checkObstacleCollision(
      carManager.getCar(),
      obstacleManager.getJumps(),
      obstacleManager.getObstacles(),
      now,
    );
  }

  function checkItemsCollision() {
    if (!carManager || !interactiveManager) return null;
    return collisionSystem.checkItemsCollision(
      carManager.getCar(),
      interactiveManager.getItems(),
    );
  }

  function getDangerLevel() {
    if (!carManager || !obstacleManager) return 0;
    return collisionSystem.getDangerLevel(carManager.getCar(), [
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
    roadManager.clear();
    collisionSystem.reset();
    bulletSystem.reset();
    flashEffectManager.clear();

    // Дополнительная очистка: удаляем оставшиеся объекты по тегам
    if (sceneRef) {
      const toRemove = new Set<THREE.Object3D>();

      sceneRef.traverse((obj) => {
        const ud = obj.userData;

        if (ud.isObstacle || ud.isJump || ud.isInteractiveItem) {
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

    playerStore.disableNitro();
    playerStore.disableMagnet();
    playerStore.resetGameData();
    // reset progress
    progressStore.resetScore();
    progressStore.resetDistance();

    CameraSystem.reset(car.value.mesh.position);
  }

  function shoot() {
    if (useGameState().currentState != GameStates.Play) return;
    const playerStore = usePlayerStore();

    if (!playerStore.canShoot()) {
      playerStore.addNewMsg("outOfAmmo");
      return;
    }

    bulletSystem.spawnBullet(carManager.getCar());
    playerStore.consumeAmmo();
    soundManager.play("sfx_shot");
  }

  function handleJumpCollision(deltaTime: number) {
    jumpPlayer(deltaTime);
    progressStore.calcScore("jump", 1);
    soundManager.play("sfx_jump");
  }

  function handleBaseObstacleCollision(
    collision: CollisionResult,
    currentSpeed: number,
  ): boolean {
    // Проверка наличия брони
    if (playerStore.isShieldEnabled) {
      destroyObstacles(collision.impactPoint!, [
        collision.impactSubject as BaseObstacle,
      ]);

      playerStore.reduceShield();
      if (playerStore.armor == 0) {
        CarManager.getInstance().disableShield();
        playerStore.disableShield();
      }
      progressStore.calcScore("reduceShield", 1);
      return false;
    }

    // Обработка уничтожения машины
    destroyCar(collision.impactPoint);
    destroyObstacles(
      collision.impactPoint!,
      [collision.impactSubject as BaseObstacle],
      false,
    );
    soundManager.play("sfx_destroy_bot");
    const strength = Math.min(currentSpeed / playerStore.maxSpeed, 1);
    CameraSystem.triggerImpactShake(strength);

    return true;
  }

  function handleCoinCollision(collision: CollisionResult) {
    let coins = 1;
    const carPos = car.value.mesh.position;

    if (collision.impactSubject instanceof Golden) {
      coins *= playerStore.isNitroEnabled
        ? playerStore.goldenNitroMultiplier
        : 1;
      progressStore.addGolden(coins);
      soundManager.play("sfx_add_golden");
      spawnFlash("golden", carPos, 4);
      return;
    }

    if (collision.impactSubject instanceof Energon) {
      coins *= playerStore.isNitroEnabled
        ? playerStore.energonNitroMultiplier
        : 1;
      progressStore.addEnergon(coins);
      playerStore.makeEventHappened("addEnergon");

      soundManager.play("sfx_add_energon");
      spawnFlash("energon", carPos);
      return;
    }
  }

  function handleBoosterCollision(collision: CollisionResult) {
    const carPos = car.value.mesh.position;

    if (collision.impactSubject instanceof BulletItem) {
      if (playerStore.ammo >= playerStore.maxAmmo) {
        playerStore.addNewMsg("maxAmmo");
        return;
      }

      playerStore.addAmmo();
      playerStore.addNewMsg("ammoRefilled");
      playerStore.makeEventHappened("addBullet");

      soundManager.play("sfx_add_patron");
      spawnFlash("bullet", carPos);
      return;
    }

    if (collision.impactSubject instanceof NitroItem) {
      CarManager.getInstance().enableNitro();

      playerStore.enableNitro();
      playerStore.addNewMsg("nitroActivated");
      playerStore.makeEventHappened("addNitro");

      soundManager.play("sfx_add_nitro");
      spawnFlash("nitro", carPos);

      return;
    }

    if (collision.impactSubject instanceof ShieldItem) {
      if (playerStore.armor >= playerStore.maxArmor) {
        playerStore.addNewMsg("maxArmor");
        return;
      }

      playerStore.addArmor();

      if (!playerStore.isShieldEnabled) {
        playerStore.enableShield();
        CarManager.getInstance().enableShield();
      }

      playerStore.addNewMsg("armorEquipped");
      playerStore.makeEventHappened("addArmor");

      soundManager.play("sfx_add_armor");
      spawnFlash("shield", carPos);
      return;
    }

    if (collision.impactSubject instanceof MagnetItem) {
      playerStore.enableMagnet(collision.impactSubject.userData.magnetTypes!);
      playerStore.addNewMsg("magnetActivated");
      playerStore.makeEventHappened("addMagnet");
      spawnFlash("magnet", carPos);
      return;
    }
  }

  function removeItem(item: BaseItem) {
    interactiveManager.removeItem(item);
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
    updateRoad,
    updateJumps,
    updateCity,
    // updateMagnet,
    resetObstacles,
    destroyObstacles,
    resetJumps,
    getDangerLevel,
    reset,
    spawnFlash,

    checkObstaclesCollision,
    checkItemsCollision,

    handleJumpCollision,
    handleBaseObstacleCollision,
    handleCoinCollision,
    handleBoosterCollision,

    removeItem,
  };
}
