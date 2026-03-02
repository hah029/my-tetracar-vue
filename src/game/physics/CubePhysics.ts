// src/game/physics/CubePhysics.ts
import * as THREE from "three";
import { RoadEdge } from "../road/edges/RoadEdge";

export interface CubePhysicsConfig {
  gravity: number;
  bounceFactor: number;
  friction: number;
  collisionFactor: number;
  removalHeight: number;
}

export class CubePhysics {
  static updateCubes(
    cubes: THREE.Object3D[],
    config: CubePhysicsConfig,
    edges: RoadEdge[],
    onRemove?: (cube: THREE.Object3D) => void,
  ) {
    const groundY = 0;

    for (let i = 0; i < cubes.length; i++) {
      const cube = cubes[i];
      if (!cube) continue;
      const ud = cube.userData as any;

      const nextPos = cube.position.clone().add(ud.velocity);

      // Коллизии с бортиками
      edges.forEach((edge) => {
        const edgeBox = edge.collider.clone().expandByScalar(0.01);
        const cubeBox = new THREE.Box3().setFromCenterAndSize(
          nextPos,
          new THREE.Vector3(0.5, 0.5, 0.5),
        );
        if (cubeBox.intersectsBox(edgeBox)) {
          const dir = nextPos.x < edge.position.x ? -1 : 1;
          const edgeHalfWidth =
            (edge.geometry as THREE.BoxGeometry).parameters.width / 2;
          const cubeHalfWidth = 0.25;
          nextPos.x = edge.position.x + dir * (edgeHalfWidth + cubeHalfWidth);
          ud.velocity.x *= -0.5;
          ud.velocity.z *= 0.9;
        }
      });

      // Гравитация и земля
      if (nextPos.y < groundY) {
        nextPos.y = groundY;
        ud.velocity.y *= -config.bounceFactor;
        ud.velocity.x *= config.friction;
        ud.velocity.z *= config.friction;
      } else {
        ud.velocity.y -= config.gravity;
      }

      // Столкновения между кубиками
      for (let j = i + 1; j < cubes.length; j++) {
        const other = cubes[j];
        if (!other) continue;
        const otherUd = other.userData as any;
        const otherNext = other.position.clone().add(otherUd.velocity);

        const dir = nextPos.clone().sub(otherNext);
        const dist = dir.length();
        const minDist = 0.5;

        if (dist < minDist && dist > 0) {
          dir.normalize();
          const push = (minDist - dist) * config.collisionFactor;

          nextPos.add(dir.clone().multiplyScalar(push / 2));
          other.position.add(dir.clone().multiplyScalar(-push / 2));

          ud.velocity.add(dir.clone().multiplyScalar(push * 0.5));
          otherUd.velocity.add(dir.clone().multiplyScalar(-push * 0.5));
        }
      }

      cube.position.copy(nextPos);
      cube.rotation.x += ud.rotationSpeed.x;
      cube.rotation.y += ud.rotationSpeed.y;
      cube.rotation.z += ud.rotationSpeed.z;

      if (cube.position.y < config.removalHeight) {
        if (onRemove) onRemove(cube);
        cubes.splice(i, 1);
        i--;
      }
    }
  }
}
