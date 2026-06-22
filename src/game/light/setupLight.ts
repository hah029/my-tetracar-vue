import * as THREE from "three";
import { useEnvironmentStore } from "@/store/environmentStore";

export function applyLevelLights(scene: THREE.Scene) {
  const environmentStore = useEnvironmentStore();
  const lighting = environmentStore.currentLighting;
  const lights = scene.userData.lights;

  if (!lights) return;

  lights.ambientLight.color.set(lighting.ambientLightColor);
  lights.ambientLight.intensity = lighting.ambientLightIntensity;

  lights.dirLight.color.set(lighting.directionalLightColor);
  lights.dirLight.intensity = lighting.directionalLightIntensity;

  lights.fillLight.color.set(lighting.fillLightColor);
  lights.fillLight.intensity = lighting.fillLightIntensity;

  lights.backAccent.color.set(lighting.backAccentLightColor);
  lights.backAccent.intensity = lighting.backAccentLightIntensity;
}

export function setupLights(scene: THREE.Scene) {
  const environmentStore = useEnvironmentStore();
  const lighting = environmentStore.currentLighting;

  // 1. Очень слабый фоновый свет (теперь холодный оттенок)
  const ambientLight = new THREE.AmbientLight(
    lighting.ambientLightColor,
    lighting.ambientLightIntensity,
  );
  scene.add(ambientLight);

  // 2. Основной направленный свет (имитация солнца/луны) — тёплый, с тенями
  const dirLight = new THREE.DirectionalLight(
    lighting.directionalLightColor,
    lighting.directionalLightIntensity,
  );
  dirLight.position.set(-10, 20, 5);
  dirLight.castShadow = true; // включаем тени для глубины
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  const d = 30;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.near = 1;
  dirLight.shadow.camera.far = 50;
  scene.add(dirLight);

  // 3. Заполняющий свет спереди-сверху (холодный, чтобы создать контраст с тёплым основным)
  const fillLight = new THREE.DirectionalLight(
    lighting.fillLightColor,
    lighting.fillLightIntensity,
  );
  fillLight.position.set(-5, 10, 5);
  fillLight.castShadow = true;
  scene.add(fillLight);

  // 4. Акцентный свет сзади (имитация света от города / задних фар) — тёплый, слабый
  const backAccent = new THREE.PointLight(
    lighting.backAccentLightColor,
    lighting.backAccentLightIntensity,
  );
  backAccent.position.set(0, 3, 15);
  fillLight.castShadow = true;
  scene.add(backAccent);

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

  scene.userData.lights = { ambientLight, dirLight, fillLight, backAccent };
}
