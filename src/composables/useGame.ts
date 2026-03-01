// src/composables/useGame.ts
import * as THREE from "three";
import { ref } from "vue";
import { RoadManager } from "@/game/road/RoadManager";
import { CarManager } from "@/game/car/CarManager";
import { ObstacleManager } from "@/game/obstacle/ObstacleManager";
import { CollisionSystem } from "@/game/collision/CollisionSystem";
import { InteractiveItemsManager } from "@/game/interactive/InteractiveItemsManager";

import cubeGLB from "@/assets/models/cube.glb";
import { CoinManager } from "@/game/coin/CoinManager";

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
    light.position.set(pos[0], pos[1], pos[2]);
    scene.add(light);
  });
}

export function useGame() {
  const car = ref<CarRef>({
    mesh: new THREE.Group(),
    targetX: 0,
    isDestroyed: false,
    cubes: [] as THREE.Object3D[],
    isJumping: false,
  });

  const obstacles = ref<{ mesh: THREE.Mesh; position: THREE.Vector3 }[]>([]);
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

  function init(scene: THREE.Scene) {
    sceneRef = scene;

    // === Настройка освещения ===
    setupLights(scene);

    // === Инициализация менеджеров ===
    roadManager = RoadManager.initialize(
      { lanes: [-4, -2, 0, 2, 4], edgeOffset: 0, length: 250 },
      scene,
    );

    obstacleManager = ObstacleManager.getInstance();
    obstacleManager.initialize(scene);
    coinManager = CoinManager.getInstance();
    coinManager.initialize(scene);

    interactiveManager = new InteractiveItemsManager(
      obstacleManager,
      coinManager,
      roadManager,
    );

    carManager = CarManager.getInstance();
    carManager.initialize(scene);

    // === Создание дороги и машины ===
    roadManager.createRoad();
    roadManager.addSpeedLines({ count: 30 });

    const newCar = carManager.createCar({
      startLane: 2,
      startPosition: new THREE.Vector3(0, 0.25, 3),
    });

    car.value.mesh = newCar;
    car.value.targetX = 0;
    car.value.isDestroyed = false;
    car.value.cubes = [];

    carManager.buildCar(true, cubeGLB);
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

  function destroyCar(impactPoint?: THREE.Vector3) {
    if (!carManager) return;

    const realCar = carManager.getCar();
    realCar.destroy(impactPoint || null);
    car.value.isDestroyed = true;
    car.value.cubes = realCar.getCubes();
  }

  function resetPlayer() {
    if (!carManager) return;

    carManager.resetCar(cubeGLB);
    updatePlayer();
  }

  function movePlayerLeft() {
    carManager.getCar().moveLeft();
    updatePlayer();
  }

  function movePlayerRight() {
    carManager.getCar().moveRight();
    updatePlayer();
  }

  function jumpPlayer() {
    carManager.getCar().jump();
    car.value.isJumping = true;
    updatePlayer();
  }

  // ==========================
  // Обновление препятствий (привязка к игровому циклу)
  // ==========================
  function updateInteractiveItems(deltaTime: number, speed: number) {
    interactiveManager.update(deltaTime, speed);

    obstacles.value = interactiveManager.getObstacles().map((o) => ({
      mesh: o,
      position: o.position.clone(),
    }));

    jumps.value = interactiveManager.getJumps().map((j) => ({
      mesh: j,
      lane: j.userData.lane,
      z: j.position.z,
    }));
  }

  function resetObstacles() {
    if (!obstacleManager) return;
    obstacleManager.reset();
    obstacles.value = [];
  }

  function updateRoad(speed: number) {
    if (!roadManager) return;
    roadManager.update(speed);
  }

  function updateJumps(speed: number) {
    if (!obstacleManager) return;

    // Обновление трамплинов через ObstacleManager
    // Сам менеджер уже двигает трамплины и удаляет их из своего массива
    obstacleManager.getJumps().forEach((jump, index) => {
      if (jump.update(speed)) {
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

  function checkCollision() {
    if (!carManager || !obstacleManager) return { collision: false };
    return CollisionSystem.checkCollision(
      carManager.getCar(),
      obstacleManager.getObstacles(),
      obstacleManager.getJumps(),
    );
  }

  function checkCoinCollision() {
    if (!carManager || !coinManager) return 0;
    return coinManager.checkCarCollision(carManager.getCar());
  }

  function getDangerLevel() {
    if (!carManager || !obstacleManager) return 0;
    return CollisionSystem.getDangerLevel(
      carManager.getCar(),
      obstacleManager.getObstacles(),
    );
  }

  function reset() {
    if (!carManager || !obstacleManager || !roadManager || !sceneRef) return;

    carManager.resetCar(cubeGLB);
    interactiveManager.reset();
    CollisionSystem.reset();
    roadManager.clear();

    roadManager.createRoad();
    roadManager.addSpeedLines({ count: 30 });

    const newCar = carManager.getCar();
    car.value.mesh = newCar;
    car.value.targetX = roadManager.getLanePosition(newCar.getCurrentLane());
    car.value.isDestroyed = false;
    car.value.cubes = [];

    resetJumps();
    obstacles.value = [];
    updateInteractiveItems(0, 0); // синхронизация
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
    updateRoad,
    updateJumps,
    resetJumps,
    checkCollision,
    checkCoinCollision,
    getDangerLevel,
    reset,
  };
}
