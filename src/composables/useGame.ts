// src/composables/useGame.ts
import * as THREE from "three";
import { ref } from "vue";
// managers
import { RoadManager } from "@/game/road/RoadManager";
import { CarManager } from "@/game/car/CarManager";
import { ObstacleManager } from "@/game/interactive/obstacle/ObstacleManager";
import { CollisionSystem } from "@/game/collision/CollisionSystem";
import { InteractiveItemsManager } from "@/game/interactive/InteractiveItemsManager";
import { BoosterManager } from "@/game/interactive/booster/BoosterManager";
import { CoinManager } from "@/game/interactive/coin/CoinManager";
import { CityManager } from "@/game/environment/city/CityManager";
import { SoundManager } from "@/game/sound/SoundManager";
// enums
import { DEFAULT_LANES } from "@/game/road/config/RoadConfig";
import { UpdateMode } from "@/game/core/UpdateMode";
// stores
import { useProgressStore } from "@/store/progressStore";
import { usePlayerStore } from "@/store/playerStore";

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
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const frontLight = new THREE.DirectionalLight(0xffffff, 1.0);
  frontLight.position.set(0, 5, 10);
  scene.add(frontLight);

  const backLight = new THREE.PointLight(0xffffff, 2.0);
  backLight.position.set(0, 5, -10);
  scene.add(backLight);

  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
  const positions: number[][] = [
    [5, 5, 5],
    [-5, 5, 5],
    [5, 5, -5],
    [-5, 5, -5],
  ];

  positions.forEach((pos, i) => {
    const light = new THREE.PointLight(colors[i], 0.5);
    const x = pos[0];
    const y = pos[1];
    const z = pos[2];
    if (x === undefined || y === undefined || z === undefined) {
      throw new Error("Light position is undefined");
    }
    light.position.set(x, y, z);
    scene.add(light);
  });
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
  let cityManager: CityManager;
  let boosterManager: BoosterManager;
  let soundManager: SoundManager;

  function init(scene: THREE.Scene) {
    sceneRef = scene;

    // === Настройка освещения ===
    setupLights(scene);

    // === Инициализация менеджеров ===
    roadManager = RoadManager.initialize(
      { lanes: DEFAULT_LANES, length: 250 },
      scene,
    );
    cityManager = CityManager.getInstance();
    cityManager.initialize(scene);

    obstacleManager = ObstacleManager.getInstance();
    obstacleManager.initialize(scene, true);

    coinManager = CoinManager.getInstance();
    coinManager.initialize(scene);

    boosterManager = BoosterManager.getInstance();
    boosterManager.initialize(scene);

    interactiveManager = new InteractiveItemsManager(
      obstacleManager,
      coinManager,
      boosterManager,
    );

    carManager = CarManager.getInstance();
    carManager.initialize(scene);

    // === Создание дороги и машины ===
    roadManager.createRoad();

    soundManager = SoundManager.getInstance();

    const newCar = carManager.createCar({
      startLane: 2,
      startPosition: new THREE.Vector3(0, 0.25, 3),
    });

    car.value.mesh = newCar;
    car.value.targetX = 0;
    car.value.isDestroyed = false;
    car.value.cubes = [];

    carManager.buildCar(true);
  }

  // === Обновление позиции и состояния машины (вызывать каждый кадр) ===
  function updatePlayer() {
    if (!carManager || !roadManager) return;

    const realCar = carManager.getCar();
    realCar.update();

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

  function destroyObstacles(impactPoint?: THREE.Vector3) {
    if (!obstacleManager) return;
    const obstacles = obstacleManager.getObstacles();
    obstacles.forEach((o) => {
      o.destroy(impactPoint);
    });
    // Не нужно обновлять obstacles.value здесь, т.к. следующий кадр updateInteractiveItems сделает это
  }

  function destroyCar(impactPoint?: THREE.Vector3) {
    if (!carManager) return;

    const realCar = carManager.getCar();
    realCar.destroy(impactPoint || null);
    car.value.isDestroyed = true;
    car.value.cubes = realCar.getCubes();
  }

  function resetPlayer() {
    if (!carManager) return;

    carManager.resetCar();
    updatePlayer();
  }

  function movePlayerLeft() {
    carManager.getCar().moveLeft();
    soundManager.play("sfx_click");
    updatePlayer();
  }

  function movePlayerRight() {
    carManager.getCar().moveRight();
    soundManager.play("sfx_click");
    updatePlayer();
  }

  function jumpPlayer() {
    carManager.getCar().jump();
    car.value.isJumping = true;
    updatePlayer();
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

    // Обновление трамплинов через ObstacleManager
    // Сам менеджер уже двигает трамплины и удаляет их из своего массива
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
    if (!carManager || !coinManager) return 0;
    return coinManager.checkCarCollision(carManager.getCar());
  }

  function checkBoosterCollision() {
    if (!carManager || !boosterManager)
      return { collision: false, subject: "" };
    return boosterManager.checkCarCollision(carManager.getCar());
  }

  function getDangerLevel() {
    if (!carManager || !obstacleManager) return 0;
    return CollisionSystem.getDangerLevel(carManager.getCar(), [
      ...obstacleManager.getObstacles(),
    ]);
  }

  function reset() {
    if (!carManager || !obstacleManager || !roadManager || !sceneRef) return;

    carManager.resetCar();
    interactiveManager.reset();
    roadManager.clear();
    CollisionSystem.reset();

    roadManager.createRoad();

    const newCar = carManager.getCar();
    car.value.mesh = newCar;
    car.value.targetX = roadManager.getLanePosition(newCar.getCurrentLane());
    car.value.isDestroyed = false;
    car.value.cubes = [];

    resetJumps();
    obstacles.value = [];
    updateInteractiveItems(0, 0, UpdateMode.Destruction); // синхронизация

    playerStore.disableNitro();
    useProgressStore().resetDistance();
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

    addObstacle: (obstacle: THREE.Mesh) => {
      if (sceneRef) sceneRef.add(obstacle);
    },
    updateInteractiveItems,
    resetObstacles,
    destroyObstacles,
    updateRoad,
    updateJumps,
    updateCity,
    resetJumps,
    checkCollision,
    checkCoinCollision,
    checkBoosterCollision,
    getDangerLevel,
    reset,
  };
}
