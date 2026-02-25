// src/composables/useGame.ts
import * as THREE from "three";
import { ref } from "vue";
import { createRoad, updateRoadLines, setScene as setRoadScene } from "../game/road";
import { createSideObjects, updateSideObjects, setScene as setSideScene } from "../game/roadObjects";
import { spawnRow } from "../game/spawnRow";

interface Obstacle {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
}

interface Car {
  mesh: THREE.Group;
  targetX: number;
  isDestroyed: boolean;
  cubes?: THREE.Mesh[];
}

const CAMERA_FOLLOW_SPEED = 0.08;
const CAMERA_Y_OFFSET = 4;
const CAMERA_SPEED_Z_MIN = 5;
const CAMERA_SPEED_Z_MAX = 3;
const SPEED_FOR_MAX_Z = 2;
const FOV_MIN = 55;
const FOV_MAX = 120;
const SPEED_FOR_MAX_FOV = 3;
const DANGER_DISTANCE = 30;

const MAX_CAR_TILT = 0.3;
const CAR_TILT_SPEED = 0.1;

export function useGame() {
  const car = ref<Car>({
    mesh: new THREE.Group(),
    targetX: 0,
    isDestroyed: false,
    cubes: [],
  });

  const obstacles = ref<Obstacle[]>([]);
  const collisionCooldown = ref(false);
  const jumps = ref<{ active: boolean; progress: number }[]>([]); 

  let sceneRef: THREE.Scene | null = null;

  /** Инициализация сцены и дороги */
  function init(scene: THREE.Scene) {
    sceneRef = scene;

    // Передаём сцену в модули дороги и обочин
    setRoadScene(scene);
    setSideScene(scene);

    createRoad();
    createSideObjects();

    // Пример спавна препятствий
    setInterval(() => spawnRow(0.1), 1500);
  }

  /** ---- Игрок ---- */
  function updatePlayer(maxTilt = 0.3, tiltSpeed = 0.1) {
    if (car.value.isDestroyed) return;

    const deltaX = car.value.targetX - car.value.mesh.position.x;
    car.value.mesh.rotation.y += (-deltaX * maxTilt - car.value.mesh.rotation.y) * tiltSpeed;
    car.value.mesh.position.x += deltaX * 0.1;
  }

  function destroyCar(impactPoint?: THREE.Vector3) {
    car.value.isDestroyed = true;
  }

  function resetPlayer() {
    car.value.isDestroyed = false;
    car.value.targetX = 0;
    car.value.cubes = [];
    collisionCooldown.value = false;
    car.value.mesh.position.set(0, 0, 0);
    car.value.mesh.rotation.set(0, 0, 0);
  }

  function checkObstacleCollision(): { collision: boolean; impactPoint?: THREE.Vector3 } {
    if (car.value.isDestroyed || collisionCooldown.value) return { collision: false };

    for (const obs of obstacles.value) {
      const distance = car.value.mesh.position.distanceTo(obs.position);
      if (distance < 1) {
        collisionCooldown.value = true;
        return { collision: true, impactPoint: obs.position.clone() };
      }
    }
    return { collision: false };
  }

  /** ---- Препятствия ---- */
  function addObstacle(obstacle: Obstacle) {
    obstacles.value.push(obstacle);
    sceneRef?.add(obstacle.mesh);
  }

  function updateObstacles(speed: number) {
    obstacles.value.forEach(obs => {
      obs.position.z += speed;
      obs.mesh.position.z = obs.position.z;
    });
    obstacles.value = obstacles.value.filter(obs => obs.position.z < 50);
  }

  function resetObstacles() {
    obstacles.value.forEach(obs => sceneRef?.remove(obs.mesh));
    obstacles.value = [];
  }

  /** ---- Прыжки ---- */
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

  /** ---- Обновление дороги и обочин ---- */
  function updateRoad(speed: number) {
    updateRoadLines(speed);
    updateSideObjects(speed);
  }

  function getDangerLevel(speed: number) {
    if (car.value.isDestroyed) return 0;

    const carPos = car.value.mesh.position.clone();
    let maxDanger = 0;

    for (const obstacle of obstacles.value) {
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

  function updateCamera(camera: THREE.PerspectiveCamera, speed: number) {
    if (car.value.isDestroyed) return;

    const desiredX = car.value.mesh.position.x;
    const desiredY = CAMERA_Y_OFFSET;

    const speedFactorZ = Math.min(speed / SPEED_FOR_MAX_Z, 1);
    const dynamicZ = CAMERA_SPEED_Z_MIN + (CAMERA_SPEED_Z_MAX - CAMERA_SPEED_Z_MIN) * speedFactorZ;
    const desiredZ = car.value.mesh.position.z + dynamicZ;

    camera.position.x += (desiredX - camera.position.x) * CAMERA_FOLLOW_SPEED;
    camera.position.y += (desiredY - camera.position.y) * CAMERA_FOLLOW_SPEED;
    camera.position.z += (desiredZ - camera.position.z) * CAMERA_FOLLOW_SPEED;

    const targetTilt = -car.value.mesh.rotation.y * 0.5;
    camera.rotation.z += (targetTilt - camera.rotation.z) * CAMERA_FOLLOW_SPEED;

    const speedFactorFOV = Math.min(speed / SPEED_FOR_MAX_FOV, 1);
    const targetFOV = FOV_MIN + (FOV_MAX - FOV_MIN) * speedFactorFOV;
    camera.fov = THREE.MathUtils.clamp(camera.fov + (targetFOV - camera.fov) * CAMERA_FOLLOW_SPEED, 10, 170);
    camera.updateProjectionMatrix();

    const lookAtPos = car.value.mesh.position.clone();
    lookAtPos.z -= 10;
    camera.lookAt(lookAtPos);

    if (!isNaN(car.value.mesh.position.x) && !isNaN(car.value.mesh.position.z)) {
      camera.position.x += (car.value.mesh.position.x - camera.position.x) * CAMERA_FOLLOW_SPEED;
      camera.position.z += ((car.value.mesh.position.z + dynamicZ) - camera.position.z) * CAMERA_FOLLOW_SPEED;
    }
  }

  function updateCameraForDestroyedState(camera: THREE.PerspectiveCamera) {
    // Камера следует за центром масс разлетающихся кубиков
    if (car.value.cubes && car.value.cubes.length > 0) {
      const center = new THREE.Vector3();
      car.value.cubes.forEach(cube => {
        center.add(cube.position);
      });
      center.divideScalar(car.value.cubes.length);

      // Плавно двигаем камеру к центру разлёта
      camera.position.lerp(center.clone().add(new THREE.Vector3(0, 2, 5)), 0.05);
      camera.lookAt(center);
    }
  }

  function updateDestroyedCubes(scene: THREE.Scene) {
    if (!car.value.isDestroyed) return;

    if (car.value.cubes != undefined) {
      car.value.cubes.forEach((cube) => {
        // Применяем физику
        cube.position.add(cube.userData.velocity);
        cube.rotation.x += cube.userData.rotationSpeed.x;
        cube.rotation.y += cube.userData.rotationSpeed.y;
        cube.rotation.z += cube.userData.rotationSpeed.z;
  
        // Простая гравитация
        cube.userData.velocity.y -= 0.005;
  
        // Если упал слишком низко, останавливаем или удаляем
        if (cube.position.y < -5) {
          scene.remove(cube);
        }
      });
    }

    // Обновляем позицию камеры (она теперь отдельно)
    // if (cameraTarget.parent === scene) {
    //   // Камера следует за местом разрушения
    //   const center = new THREE.Vector3();
    //   car.value.cubes.forEach(cube => {
    //     center.add(cube.position);
    //   });
    //   if (car.value.cubes.length > 0) {
    //     center.divideScalar(car.value.cubes.length);
    //     cameraTarget.position.lerp(center, 0.1);
    //   }
    // }
    
  }

  function updateCar() {
    if (car.value.isDestroyed) return;

    const targetX = car.value.targetX ?? car.value.mesh.position.x;
    const deltaX = targetX - car.value.mesh.position.x;
    updatePlayer(MAX_CAR_TILT, CAR_TILT_SPEED);
    car.value.mesh.rotation.y += (-deltaX * MAX_CAR_TILT - car.value.mesh.rotation.y) * CAR_TILT_SPEED;
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

    addObstacle,
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
  };
}