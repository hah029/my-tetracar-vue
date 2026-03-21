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

// Интерфейс для реактивной ссылки car
interface CarRef {
  mesh: THREE.Group;
  targetX: number;
  isDestroyed: boolean;
  isJumping: boolean;
  cubes: THREE.Object3D[];
}

// Вынесенная функция для создания всех источников света
function setupLights(scene: THREE.Scene) {
  // 1. Очень слабый фоновый свет (теперь холодный оттенок)
  const ambientLight = new THREE.AmbientLight(0x404060, 0.1); // синеватый, низкая интенсивность
  scene.add(ambientLight);

  // 2. Основной направленный свет (имитация солнца/луны) — тёплый, с тенями
  const dirLight = new THREE.DirectionalLight(0xffeedd, 2);
  dirLight.position.set(-10, 20, 5);
  // dirLight.castShadow = true; // включаем тени для глубины
  // dirLight.shadow.mapSize.width = 1024;
  // dirLight.shadow.mapSize.height = 1024;
  // const d = 30;
  // dirLight.shadow.camera.left = -d;
  // dirLight.shadow.camera.right = d;
  // dirLight.shadow.camera.top = d;
  // dirLight.shadow.camera.bottom = -d;
  // dirLight.shadow.camera.near = 1;
  // dirLight.shadow.camera.far = 50;
  scene.add(dirLight);

  // 3. Заполняющий свет спереди-сверху (холодный, чтобы создать контраст с тёплым основным)
  const fillLight = new THREE.DirectionalLight(0xccddff, 2.5);
  fillLight.position.set(-5, 10, 5);
  fillLight.castShadow = true;
  scene.add(fillLight);

  // 4. Акцентный свет сзади (имитация света от города / задних фар) — тёплый, слабый
  // const backAccent = new THREE.PointLight(0xffaa66, 5);
  // backAccent.position.set(0, 3, 15);
  // scene.add(backAccent);

  // // 5. Цветные акценты по углам (теперь слабее и с меньшей насыщенностью)
  // const colors = [0x553333, 0x335533, 0x333355, 0x555533]; // приглушённые тона
  // const positions: [number, number, number][] = [
  //   [8, 4, 8],
  //   [-8, 4, 8],
  //   [8, 4, -8],
  //   [-8, 4, -8],
  // ];

  // positions.forEach((pos, i) => {
  //   const light = new THREE.PointLight(colors[i], 30);
  //   light.position.set(pos[0], pos[1], pos[2]);
  //   scene.add(light);
  // });

  // 6. Лёгкая дымка для глубины (не обязательно, но добавит атмосферы)
  scene.fog = new THREE.FogExp2(0x000000, 0.02);
}

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
    impactPoint?: THREE.Vector3,
    obstacles: BaseObstacle[] = [],
  ) {
    if (!obstacleManager) return;
    if (obstacles.length != 0) {
      obstacles.forEach((o) => {
        o.destroy(impactPoint);
      });
    } else {
      obstacleManager.getObstacles().forEach((o) => {
        o.destroy(impactPoint);
      });
    }
    // Не нужно обновлять obstacles.value здесь, т.к. следующий кадр updateInteractiveItems сделает это
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
    soundManager.play("sfx_click");
    updatePlayer(dt);
  }

  function movePlayerRight(dt: number) {
    if (useGameState().currentState != GameStates.Play) return;
    carManager.getCar().moveRight();
    soundManager.play("sfx_click");
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
    if (obstacleSyncTimer < 200) return; // ⛔ 5 раз в сек
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
    if (!carManager || !coinManager) return { gold: 0, diamond: 0, total: 0 };
    return coinManager.checkCarCollision(carManager.getCar());
  }

  function checkBoosterCollision() {
    if (!carManager || !boosterManager)
      return { collision: false, subject: "" };
    return boosterManager.checkCarCollision(carManager.getCar());
  }

  function checkBulletItemCollision() {
    if (!carManager || !bulletItemManager) return 0;
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

    while (current.parent && !current.parent.isScene) {
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

    // Логирование состояния сцены до очистки
    if (sceneRef) {
      const childrenBefore = sceneRef.children.length;
      console.log(`[useGame.reset] children before: ${childrenBefore}`);
      // Можно залогировать типы объектов
      sceneRef.children.forEach((child, idx) => {
        console.log(
          `  [${idx}] ${child.type} ${child.name || ""}`,
          child.userData,
        );
      });
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
      console.log(`[useGame.reset] removed ${toRemove.size} tagged objects`);
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

    // Логирование после очистки
    if (sceneRef) {
      const childrenAfter = sceneRef.children.length;
      console.log(`[useGame.reset] children after: ${childrenAfter}`);
      // Детальный вывод оставшихся объектов
      sceneRef.children.forEach((child, idx) => {
        console.log(
          `  [${idx}] ${child.type} ${child.name || ""}`,
          child.userData,
        );
      });
    }
  }

  function shoot() {
    if (useGameState().currentState != GameStates.Play) return;
    const playerStore = usePlayerStore();

    if (!playerStore.canShoot()) {
      console.warn("[useGame] cannot shoot, returning");
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

    addObstacle: (obstacle: THREE.Mesh) => {
      if (sceneRef) sceneRef.add(obstacle);
    },
    updateInteractiveItems,
    updateDestructionItems,
    updateRoad,
    updateJumps,
    updateCity,
    resetObstacles,
    destroyObstacles,
    resetJumps,
    checkCollision,
    checkCoinCollision,
    checkBoosterCollision,
    checkBulletItemCollision,
    getDangerLevel,
    reset,
  };
}
