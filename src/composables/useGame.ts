// src/composables/useGame.ts
import * as THREE from "three";
import { ref } from "vue";
import { RoadManager } from "@/game/road/RoadManager";
import { CarManager } from "@/game/car/CarManager";
import { ObstacleManager } from "@/game/obstacle/ObstacleManager";
import { CollisionSystem } from "@/game/collision/CollisionSystem";

// Константы для камеры
// const DANGER_DISTANCE = 30;

// Интерфейс для реактивной ссылки car
interface CarRef {
  mesh: THREE.Group;
  targetX: number;
  isDestroyed: boolean;
  cubes: THREE.Object3D[];
}

export function useGame() {
  const car = ref<CarRef>({
    mesh: new THREE.Group(),
    targetX: 0,
    isDestroyed: false,
    cubes: [],
  });

  const obstacles = ref<{ mesh: THREE.Mesh; position: THREE.Vector3 }[]>([]);
  // const collisionCooldown = ref(false);
  const jumps = ref<{ active: boolean; progress: number }[]>([]);

  let sceneRef: THREE.Scene | null = null;

  // Менеджеры
  let roadManager: RoadManager;
  let carManager: CarManager;
  let obstacleManager: ObstacleManager;

  function init(scene: THREE.Scene) {
    sceneRef = scene;

    // Освещение
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

    // ВАЖНО: Инициализируем ВСЕ менеджеры с переданной сценой
    roadManager = RoadManager.initialize(
      {
        lanes: [-3, -1, 1, 3],
        edgeOffset: 1.5,
        length: 200,
      },
      scene,
    );

    obstacleManager = ObstacleManager.getInstance();
    obstacleManager.initialize(scene);

    carManager = CarManager.getInstance();
    carManager.initialize(scene); // ← ИНИЦИАЛИЗАЦИЯ!

    // Создаем дорогу
    roadManager.createRoad(false);
    roadManager.addSpeedLines({ count: 30 });

    // Создаем машину
    const newCar = carManager.createCar({
      startLane: 1,
      startPosition: new THREE.Vector3(0, 0.25, 3),
    });

    car.value.mesh = newCar as unknown as THREE.Group;
    car.value.targetX = 0;
    car.value.isDestroyed = false;
    car.value.cubes = [];

    // Строим машину из кубиков
    carManager.buildCar(false);

    // Спавн препятствий
    setTimeout(() => {
      // console.log('Starting obstacle spawn interval');

      // Сохраняем интервал в глобальной переменной или в ref
      (window as any).obstacleInterval = setInterval(() => {
        if (sceneRef && carManager && !carManager.getCar().isDestroyed()) {
          const lane = Math.floor(Math.random() * 4);
          const obstacle = obstacleManager.spawnObstacleRow(lane, -60);
          if (obstacle) {
            obstacles.value.push({
              mesh: obstacle,
              position: obstacle.position.clone(),
            });
            // console.log('Obstacle spawned at:', obstacle.position);
          }
        }
      }, 1500);
    }, 500);
  }

  function updatePlayer() {
    if (!carManager) return;

    carManager.update();

    const realCar = carManager.getCar();
    car.value.mesh = realCar as unknown as THREE.Group;
    car.value.isDestroyed = realCar.isDestroyed();

    if (roadManager) {
      car.value.targetX = roadManager.getLanePosition(realCar.getCurrentLane());
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
    // collisionCooldown.value = false;

    const realCar = carManager.getCar();
    car.value.mesh = realCar as unknown as THREE.Group;
    car.value.isDestroyed = false;
    car.value.targetX = 0;
    car.value.cubes = [];
  }

  function checkCollision() {
    if (!carManager || !obstacleManager) {
      return { collision: false };
    }

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

  function updateDestroyedCubes() {
    if (!carManager) return;

    const realCar = carManager.getCar();
    if (realCar.isDestroyed()) {
      realCar.update();
      car.value.cubes = realCar.getCubes();
    }
  }

  function updateCar() {
    if (!carManager) return;

    carManager.update();

    const realCar = carManager.getCar();
    car.value.mesh = realCar as unknown as THREE.Group;
    car.value.isDestroyed = realCar.isDestroyed();

    if (roadManager) {
      car.value.targetX = roadManager.getLanePosition(realCar.getCurrentLane());
    }
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

  function reset() {
    if (!carManager || !obstacleManager || !roadManager || !sceneRef) return;

    console.log("🔄 Полный сброс игры...");

    // 1. стопаем спавн
    if ((window as any).obstacleInterval) {
      clearInterval((window as any).obstacleInterval);
      (window as any).obstacleInterval = null;
    }

    // 2. сбрасываем машину
    carManager.resetCar();

    // 3. сбрасываем препятствия
    obstacleManager.reset();
    obstacles.value = [];

    // 🔥 3.5 СБРОС COLLISION SYSTEM
    CollisionSystem.reset();

    // 4. пересоздаём дорогу
    roadManager.clear();
    roadManager.createRoad(false);
    roadManager.addSpeedLines({ count: 30 });

    // 5. прыжки
    resetJumps();

    // 6. состояние машины
    const realCar = carManager.getCar();
    car.value = {
      mesh: realCar as unknown as THREE.Group,
      targetX: roadManager.getLanePosition(realCar.getCurrentLane()),
      isDestroyed: false,
      cubes: [],
    };

    // 7. перезапуск спавна
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

    console.log("✅ Сброс игры завершён");
  }

  return {
    car,
    obstacles,
    jumps,

    init,
    updatePlayer,
    destroyCar,
    resetPlayer,

    addObstacle: (obstacle: THREE.Mesh) => {
      if (sceneRef) sceneRef.add(obstacle);
    },
    updateObstacles,
    resetObstacles,

    updateJumps,
    resetJumps,

    updateRoad,
    updateDestroyedCubes,
    updateCar,

    checkCollision,
    getDangerLevel,

    reset,
  };
}
