import * as THREE from "three";

export function setupLights(scene: THREE.Scene) {
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
