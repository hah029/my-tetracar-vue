import * as THREE from "three";
import { LANES } from "./lanes";

export const roadLines: THREE.Mesh[] = [];
let scene: THREE.Scene;

export function setScene(s: THREE.Scene) {
  scene = s;
}

export function createRoad() {
  if (!scene) throw new Error("Scene not set for road");

  const roadWidth = 12;
  const roadLength = 200;
  const roadGeom = new THREE.PlaneGeometry(roadWidth, roadLength);
  const roadMat = new THREE.MeshStandardMaterial({
    color: 0x88ccff,
    emissive: 0x224466,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });

  const road = new THREE.Mesh(roadGeom, roadMat);
  road.rotation.x = -Math.PI / 2;
  road.position.z = -roadLength / 2 + 10;
  road.position.y = 0.01;
  road.receiveShadow = true;
  scene.add(road);

  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff });

  // Левая граница
  const leftEdgePoints = [
    new THREE.Vector3(-6, 0.02, -90),
    new THREE.Vector3(-6, 0.02, 110)
  ];
  const leftEdgeGeometry = new THREE.BufferGeometry().setFromPoints(leftEdgePoints);
  const leftEdgeLine = new THREE.Line(leftEdgeGeometry, edgeMaterial);
  scene.add(leftEdgeLine);

  // Правая граница
  const rightEdgePoints = [
    new THREE.Vector3(6, 0.02, -90),
    new THREE.Vector3(6, 0.02, 110)
  ];
  const rightEdgeGeometry = new THREE.BufferGeometry().setFromPoints(rightEdgePoints);
  const rightEdgeLine = new THREE.Line(rightEdgeGeometry, edgeMaterial);
  scene.add(rightEdgeLine);

  // параметры пунктирной линии
  const segmentLength = 1.5; // длина одного сегмента
  const gap = 1.5;           // промежуток между сегментами
  const totalSegments = Math.ceil(roadLength / (segmentLength + gap)) + 10;

  // линии между полосами - теперь с флуоресцентным эффектом
  for (let i = 0; i < LANES.length - 1; i++) {
    const x = (LANES[i] + LANES[i + 1]) / 2;

    for (let j = 0; j < totalSegments; j++) {
      // Делаем линии более заметными и светящимися
      const lineGeometry = new THREE.BoxGeometry(0.1, 0.02, segmentLength);
      const lineMaterial = new THREE.MeshStandardMaterial({
        color: 0x44ffff,
        emissive: 0x226688,      // добавляем свечение
        emissiveIntensity: 1.2,
        transparent: true,
        opacity: 0.9
      });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);

      line.position.set(
        x,
        0.06,
        -segmentLength / 2 - j * (segmentLength + gap)
      );

      line.castShadow = false;
      line.receiveShadow = false;

      roadLines.push(line);
      scene.add(line);
    }
  }

  // Добавляем дополнительные декоративные линии для эффекта скорости
  // addSpeedLines();
}

export function updateRoadLines(speed: number) {
  roadLines.forEach(line => {
    line.position.z += speed;
    if (line.position.z > 10) line.position.z -= 200;
  });
}

// function addSpeedLines() {
//   const lineCount = 20;
//   const lineMaterial = new THREE.LineBasicMaterial({ color: 0x88aaff });

//   for (let i = 0; i < lineCount; i++) {
//     const x = (Math.random() - 0.5) * 10;
//     const z = Math.random() * 200 - 100;

//     const points = [
//       new THREE.Vector3(x, 0.1, z),
//       new THREE.Vector3(x + (Math.random() - 0.5) * 2, 0.1, z + 5)
//     ];

//     const geometry = new THREE.BufferGeometry().setFromPoints(points);
//     const line = new THREE.Line(geometry, lineMaterial);
//     line.userData.isSpeedLine = true;
//     scene.add(line);
//   }
// }