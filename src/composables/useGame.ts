// src/composables/useGame.ts
import * as THREE from "three";
import { ref } from "vue";
import { RoadManager } from "@/game/sceneStaticObjects/road/RoadManager";
import { CarManager } from "@/game/sceneStaticObjects/car/CarManager";
import { ObstacleManager } from "@/game/obstacles";
// import HUD from "@/components/HUD.vue";

// Константы для камеры
const CAMERA_HEIGHT = 4;
const CAMERA_DISTANCE = 8;
const CAMERA_LOOKAHEAD = 10;
const DANGER_DISTANCE = 30;
const CAMERA_FOLLOW_SPEED = 0.08;
// const CAMERA_Y_OFFSET = 4;
// const CAMERA_SPEED_Z_MIN = 3;
// const CAMERA_SPEED_Z_MAX = 1;
// const SPEED_FOR_MAX_Z = 2;
const FOV_MIN = 55;
const FOV_MAX = 120;
const SPEED_FOR_MAX_FOV = 3;


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
  const collisionCooldown = ref(false);
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
      [-5, 5, -5]
    ];

    positions.forEach((pos, i) => {
      const light = new THREE.PointLight(colors[i], 0.5);
      light.position.set(pos[0], pos[1], pos[2]);
      scene.add(light);
    });

    // ВАЖНО: Инициализируем ВСЕ менеджеры с переданной сценой
    roadManager = RoadManager.initialize({
      lanes: [-3, -1, 1, 3],
      edgeOffset: 1.5,
      length: 200,
    }, scene);

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
              position: obstacle.position.clone()
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
    collisionCooldown.value = false;

    const realCar = carManager.getCar();
    car.value.mesh = realCar as unknown as THREE.Group;
    car.value.isDestroyed = false;
    car.value.targetX = 0;
    car.value.cubes = [];
  }

  function checkObstacleCollision(): { collision: boolean; impactPoint?: THREE.Vector3 } {
    if (!carManager || !obstacleManager) return { collision: false };
    if (car.value.isDestroyed || collisionCooldown.value) return { collision: false };

    const realCar = carManager.getCar();
    const collidingObstacle = obstacleManager.checkCollision(realCar.getCollider());

    if (collidingObstacle) {
      collisionCooldown.value = true;
      setTimeout(() => {
        collisionCooldown.value = false;
      }, 1000);

      return {
        collision: true,
        impactPoint: collidingObstacle.position.clone()
      };
    }

    return { collision: false };
  }

  function updateObstacles(speed: number) {
    if (!obstacleManager) return;

    obstacleManager.update(speed);
    obstacles.value = obstacleManager.getObstacles().map(obs => ({
      mesh: obs,
      position: obs.position.clone()
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

  function getDangerLevel() {
    if (!carManager || !obstacleManager) return 0;

    const realCar = carManager.getCar();
    if (realCar.isDestroyed()) return 0;

    const carPos = realCar.position.clone();
    let maxDanger = 0;

    const obstacles = obstacleManager.getObstacles();
    for (const obstacle of obstacles) {
      const obstaclePos = obstacle.position.clone();

      if (obstaclePos.z >= carPos.z) continue;

      const zDiff = Math.abs(obstaclePos.z - carPos.z);
      const xDiff = Math.abs(obstaclePos.x - carPos.x);

      if (zDiff > DANGER_DISTANCE * 2 || xDiff > 1.0) continue;

      const dangerByZ = Math.max(0, 1 - (zDiff / DANGER_DISTANCE));
      const dangerByX = Math.max(0, 1 - (xDiff / 1.0));
      const danger = (dangerByZ * 0.7 + dangerByX * 0.3);

      maxDanger = Math.max(maxDanger, danger);
    }

    return maxDanger;
  }

  function updateCameraForDestroyedState(camera: THREE.PerspectiveCamera) {
    if (!carManager) return;

    const realCar = carManager.getCar();
    const cubes = realCar.getCubes();

    if (cubes.length > 0) {
      const center = new THREE.Vector3();
      cubes.forEach(cube => {
        center.add(cube.position);
      });
      center.divideScalar(cubes.length);

      const targetCamPos = center.clone().add(new THREE.Vector3(0, 3, -8));
      camera.position.lerp(targetCamPos, 0.05);
      camera.lookAt(center);
    }
  }

  function updateCamera(camera: THREE.PerspectiveCamera, speed: number) {
    if (!carManager) return;

    const realCar = carManager.getCar();

    if (realCar.isDestroyed()) {
      // updateCameraForDestroyedState(camera);
      return;
    }

    const carPos = realCar.position.clone();

    const targetCamPos = new THREE.Vector3(
      carPos.x,
      CAMERA_HEIGHT,
      carPos.z + CAMERA_DISTANCE
    );

    // 2. Используем константу для плавности
    camera.position.lerp(targetCamPos, CAMERA_FOLLOW_SPEED);

    // 3. Восстанавливаем наклон при поворотах
    const targetTilt = -realCar.rotation.y * 0.5;
    camera.rotation.z += (targetTilt - camera.rotation.z) * CAMERA_FOLLOW_SPEED;

    // 4. Восстанавливаем динамический FOV
    const speedFactorFOV = Math.min(speed / SPEED_FOR_MAX_FOV, 1);
    const targetFOV = FOV_MIN + (FOV_MAX - FOV_MIN) * speedFactorFOV;
    camera.fov = THREE.MathUtils.clamp(
      camera.fov + (targetFOV - camera.fov) * CAMERA_FOLLOW_SPEED,
      10, 170
    );
    camera.updateProjectionMatrix();

    const lookAtPos = new THREE.Vector3(
      carPos.x,
      carPos.y + 1,
      carPos.z - CAMERA_LOOKAHEAD
    );

    camera.lookAt(lookAtPos);
  }

  function resetCameraPosition(camera: THREE.PerspectiveCamera) {
    if (!carManager) return;
    
    const realCar = carManager.getCar();
    const carPos = realCar.position.clone();
    
    // Устанавливаем камеру в начальную позицию
    camera.position.set(carPos.x, CAMERA_HEIGHT, carPos.z + CAMERA_DISTANCE);
    camera.lookAt(carPos.x, carPos.y + 1, carPos.z - CAMERA_LOOKAHEAD);
    camera.fov = FOV_MIN;
    camera.updateProjectionMatrix();
    camera.rotation.z = 0;
    
    console.log('📷 Камера сброшена вручную');
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
    jumps.value.forEach(jump => {
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

    console.log('🔄 Полный сброс игры...');

    // 1. Очищаем интервал спавна препятствий
    if ((window as any).obstacleInterval) {
      clearInterval((window as any).obstacleInterval);
      (window as any).obstacleInterval = null;
    }

    // 2. Сбрасываем машину
    carManager.resetCar();

    // 3. Очищаем все препятствия
    obstacleManager.reset();
    obstacles.value = [];

    // 4. Полностью пересоздаем дорогу
    roadManager.clear(); // удаляем старую
    roadManager.createRoad(false); // создаем новую
    roadManager.addSpeedLines({ count: 30 }); // добавляем линии скорости

    // 5. Сбрасываем прыжки
    resetJumps();

    // 6. Сбрасываем состояние машины в реактивной ссылке
    const realCar = carManager.getCar();
    car.value = {
      mesh: realCar as unknown as THREE.Group,
      targetX: roadManager.getLanePosition(realCar.getCurrentLane()),
      isDestroyed: false,
      cubes: [],
    };

    // 7. Сбрасываем кулдаун коллизий
    collisionCooldown.value = false;

    // 8. Перезапускаем спавн препятствий
    (window as any).obstacleInterval = setInterval(() => {
      if (sceneRef && carManager && !carManager.getCar().isDestroyed()) {
        const lane = Math.floor(Math.random() * 4);
        const obstacle = obstacleManager.spawnObstacleRow(lane, -60);
        if (obstacle) {
          obstacles.value.push({
            mesh: obstacle,
            position: obstacle.position.clone()
          });
        }
      }
    }, 1500);

    console.log('✅ Сброс игры завершен');
  }

  return {
    car,
    obstacles,
    jumps,
    collisionCooldown,

    init,
    updatePlayer,
    destroyCar,
    resetPlayer,
    checkObstacleCollision,

    addObstacle: (obstacle: THREE.Mesh) => {
      if (sceneRef) sceneRef.add(obstacle);
    },
    updateObstacles,
    resetObstacles,

    updateJumps,
    resetJumps,

    updateRoad,
    getDangerLevel,
    updateCamera,
    updateCameraForDestroyedState,
    updateDestroyedCubes,
    updateCar,

    reset,
    resetCameraPosition,
  };
}