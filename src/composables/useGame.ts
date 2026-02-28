// src/composables/useGame.ts
import * as THREE from "three";
import { ref } from "vue";
import { RoadManager } from "@/game/road/RoadManager";
import { CarManager } from "@/game/car/CarManager";
import { ObstacleManager } from "@/game/obstacle/ObstacleManager";
import { CollisionSystem } from "@/game/collision/CollisionSystem";

// Интерфейс для реактивной ссылки car
interface CarRef {
  mesh: THREE.Group;
  targetX: number;
  isDestroyed: boolean;
  cubes: THREE.Object3D[];
}

// Вынесенная функция для создания всех источников света
function setupLights(scene: THREE.Scene) {
  // Основное освещение
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

  // Тестовые разноцветные источники света
  const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00];
  const positions = [
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
    cubes: [],
  });

  const obstacles = ref<{ mesh: THREE.Mesh; position: THREE.Vector3 }[]>([]);
  const jumps = ref<{ active: boolean; progress: number }[]>([]);
  let sceneRef: THREE.Scene | null = null;

  let roadManager: RoadManager;
  let carManager: CarManager;
  let obstacleManager: ObstacleManager;

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

    carManager.buildCar(false);

    // === Спавн препятствий ===
    setTimeout(() => {
      (window as any).obstacleInterval = setInterval(() => {
        if (sceneRef && carManager && !carManager.getCar().isDestroyed()) {
          const lane = Math.floor(Math.random() * 4);
          const obstacle = obstacleManager.spawnObstacleRow(lane, -60);
          if (obstacle) {
            obstacles.value.push({
              mesh: obstacle,
              position: obstacle.position.clone(),
            });
          }
        }
      }, 1500);
    }, 500);
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

    carManager.resetCar();
    updatePlayer(); // сразу синхронизируем реф
  }

  function movePlayerLeft() {
    carManager.getCar().moveLeft();
    updatePlayer();
  }

  function movePlayerRight() {
    carManager.getCar().moveRight();
    updatePlayer();
  }

  function updateObstacles(speed: number) {
    if (!obstacleManager) return;
    obstacleManager.update(speed);
    obstacles.value = obstacleManager.getObstacles().map((obs) => ({
      mesh: obs,
      position: obs.position.clone(),
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
    jumps.value.forEach((jump) => {
      if (jump.active) {
        jump.progress += speed * 0.05;
        if (jump.progress >= 1) jump.active = false;
      }
    });
  }

  function resetJumps() {
    jumps.value = [];
  }

  function checkCollision() {
    if (!carManager || !obstacleManager) return { collision: false };
    return CollisionSystem.checkCollision(
      carManager.getCar(),
      obstacleManager.getObstacles(),
    );
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

    // 1️⃣ Очистка старого интервала
    if ((window as any).obstacleInterval) {
      clearInterval((window as any).obstacleInterval);
      (window as any).obstacleInterval = null;
    }

    // 2️⃣ Сброс всех менеджеров
    carManager.resetCar();
    obstacleManager.reset();
    CollisionSystem.reset();
    roadManager.clear();

    // 3️⃣ Пересоздание дороги
    roadManager.createRoad();
    roadManager.addSpeedLines({ count: 30 });

    // 4️⃣ Обновление машины и синхронизация car.value
    const newCar = carManager.getCar();
    car.value.mesh = newCar;
    car.value.targetX = roadManager.getLanePosition(newCar.getCurrentLane());
    car.value.isDestroyed = false;
    car.value.cubes = [];

    // 5️⃣ Сброс прыжков
    resetJumps();

    // 6️⃣ Очистка препятствий и установка пустого массива
    obstacles.value = [];
    updateObstacles(0); // чтобы синхронизировать массив obstacles.value с менеджером

    // 7️⃣ Новый интервал спавна препятствий
    (window as any).obstacleInterval = setInterval(() => {
      if (sceneRef && carManager && !carManager.getCar().isDestroyed()) {
        const lane = Math.floor(Math.random() * 4);
        const obstacle = obstacleManager.spawnObstacleRow(lane, -60);
        if (obstacle) {
          obstacles.value.push({
            mesh: obstacle,
            position: obstacle.position.clone(),
          });
        }
      }
    }, 1500);
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

    addObstacle: (obstacle: THREE.Mesh) => {
      if (sceneRef) sceneRef.add(obstacle);
    },
    updateObstacles,
    resetObstacles,
    updateRoad,
    updateJumps,
    resetJumps,
    checkCollision,
    getDangerLevel,
    reset,
  };
}
