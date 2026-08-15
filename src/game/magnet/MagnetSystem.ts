import * as THREE from "three";
import { Car } from "@/game/car/Car";
import { BaseItem } from "@/game/interactive/items/BaseItem";
import { usePlayerStore } from "@/store/playerStore";
import { SoundManager } from "@/game/sound/SoundManager";

import magnetLineVertex from "@/game/shaders/magnet/line/vertex.glsl";
import magnetLineFragment from "@/game/shaders/magnet/line/fragment.glsl";

export class MagnetSystem {
  private static instance: MagnetSystem | null = null;
  private scene!: THREE.Scene;
  private magnetField: THREE.Group | null = null;
  private readonly fieldLineCount = 24;
  private readonly markersPerFieldLine = 1;
  private lastPullSoundAt = 0;

  public static getInstance(): MagnetSystem {
    if (!MagnetSystem.instance) {
      MagnetSystem.instance = new MagnetSystem();
    }
    return MagnetSystem.instance;
  }

  public initialize(scene: THREE.Scene) {
    this.scene = scene;
  }

  /* =======================
     SPAWN
     ======================= */

  public updateMagnetedItems(
    car: Car,
    magnetedItems: BaseItem[],
    deltaTime: number,
    now: number,
  ): void {
    if (magnetedItems.length == 0) return;

    const playerStore = usePlayerStore();

    const force =
      (playerStore.magnetForce ?? 8) *
      (playerStore.magnetMode === "lethalPull" ? 0.45 : 1);
    const dt = deltaTime / 1000;

    const carPos = car.position;
    const dir = new THREE.Vector3();

    for (let i = magnetedItems.length - 1; i >= 0; i--) {
      const item = magnetedItems[i];

      dir.subVectors(carPos, item.position);

      const dist = dir.length();

      if (dist > 0.01) {
        dir.normalize();

        item.position.addScaledVector(dir, force * dt);
        item.collider.center.copy(item.position);
      }

      this.updateMagnetBeam(item, carPos, now);
    }
  }

  public applyMagnet(car: Car, items: BaseItem[], types: (typeof BaseItem)[]) {
    const playerStore = usePlayerStore();
    const now = performance.now();
    this.updateMagnetField(car, playerStore.isMagnetEnabled, now);

    if (!playerStore.isMagnetEnabled) {
      items.forEach((item) => this.removeRepulseBeam(item));
      return;
    }

    const radius = playerStore.magnetRadius ?? 4.5;
    const radiusSq = radius * radius;
    const carPos = car.position;

    for (let i = items.length - 1; i >= 0; i--) {
      const item = items[i];
      if (!item) continue;

      const isAllowedType = types.some((T) => item instanceof T);
      if (!isAllowedType) {
        this.removeRepulseBeam(item);
        continue;
      }

      const distSq = item.position.distanceToSquared(carPos);
      const isInRadius = distSq <= radiusSq;

      if (!isInRadius) {
        this.removeRepulseBeam(item);
        continue;
      }

      if (playerStore.magnetMode === "repulse") {
        const dir = item.position.clone().sub(carPos);
        if (dir.lengthSq() > 0.0001) {
          dir.normalize();
          item.position.addScaledVector(
            dir,
            (playerStore.magnetForce ?? 8) * 0.018,
          );
          item.collider.center.copy(item.position);
        }
        this.ensureRepulseBeam(item);
        this.updateMagnetBeam(item, carPos, now, "repulseLine");
        continue;
      }

      this.removeRepulseBeam(item);

      if (item.userData.magnetLine == undefined) {
        item.userData.status = "magnetized";
        if (now - this.lastPullSoundAt > 120) {
          SoundManager.getInstance().playCueOneShot("magnetPull");
          this.lastPullSoundAt = now;
        }
        if (playerStore.magnetMode === "lethalPull") {
          item.markAsLethalMagnetObstacle();
        }

        const line = this.createMagnetLine(
          playerStore.magnetMode === "lethalPull" ? "#ff1f1f" : "#00eaff",
        );
        this.scene.add(line);
        item.userData.magnetLine = line;
      }
    }
  }

  private updateMagnetBeam(
    item: BaseItem,
    carPos: THREE.Vector3,
    time: number,
    lineKey: "magnetLine" | "repulseLine" = "magnetLine",
  ) {
    const beam = item.userData[lineKey] as THREE.Mesh;
    if (!beam) return;

    const target = item.position.clone();

    const mid = new THREE.Vector3()
      .addVectors(carPos, target)
      .multiplyScalar(0.5);

    beam.position.copy(mid);

    const dir = new THREE.Vector3().subVectors(target, carPos);
    beam.scale.z = dir.length();
    beam.lookAt(target);

    const mat = beam.material as THREE.ShaderMaterial;
    mat.uniforms.time.value = time * 0.001;
  }

  private createMagnetLine(color: string): THREE.Mesh {
    const geometry = new THREE.PlaneGeometry(0.6, 1, 1, 20);
    geometry.rotateX(Math.PI / 2);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,

      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(color) },
        opacity: { value: 1 },
      },

      vertexShader: magnetLineVertex,
      fragmentShader: magnetLineFragment,
    });

    return new THREE.Mesh(geometry, material);
  }

  private ensureRepulseBeam(item: BaseItem) {
    if (item.userData.repulseLine) return;

    const line = this.createMagnetLine("#ff7a2a");
    this.scene.add(line);
    item.userData.repulseLine = line;
  }

  public removeRepulseBeam(item: BaseItem) {
    const line = item.userData.repulseLine as THREE.Mesh | undefined;
    if (!line) return;

    this.scene.remove(line);
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
    item.userData.repulseLine = undefined;
  }

  private updateMagnetField(car: Car, enabled: boolean, now: number) {
    if (!enabled) {
      this.removeMagnetField();
      return;
    }

    const playerStore = usePlayerStore();
    const direction = playerStore.magnetMode === "repulse" ? -1 : 1;
    const radius = playerStore.magnetRadius ?? 4.5;
    const color =
      playerStore.magnetMode === "lethalPull"
        ? "#ff1f1f"
        : playerStore.magnetMode === "repulse"
          ? "#ff7a2a"
          : "#00eaff";

    if (!this.magnetField || this.magnetField.userData.radius !== radius) {
      this.removeMagnetField();
      this.magnetField = this.createMagnetField(color, radius);
      this.scene.add(this.magnetField);
    }

    this.magnetField.position.copy(car.position);
    this.magnetField.position.y += 0.8;
    this.magnetField.userData.direction = direction;

    this.magnetField.traverse((child) => {
      const material = (child as THREE.Line | THREE.Mesh).material as
        | THREE.ShaderMaterial
        | THREE.MeshBasicMaterial
        | undefined;
      if (!material) return;

      if (material instanceof THREE.ShaderMaterial) {
        material.uniforms.color.value.set(color);
        material.uniforms.time.value = now * 0.001 * direction;
      } else if (material instanceof THREE.MeshBasicMaterial) {
        material.color.set(color);
      }
    });

    this.updateMagnetFieldMarkers(now, direction);
  }

  private createMagnetField(color: string, radius: number): THREE.Group {
    const field = new THREE.Group();
    field.userData.radius = radius;

    const lineMaterial = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(color) },
        opacity: { value: 0.8 },
      },
      vertexShader: magnetLineVertex,
      fragmentShader: magnetLineFragment,
    });
    const markerGeometry = new THREE.ConeGeometry(0.075, 0.22, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    for (let i = 0; i < this.fieldLineCount; i++) {
      const lineGroup = new THREE.Group();
      const majorAngle = (i / this.fieldLineCount) * Math.PI * 2;
      const majorRadius = radius * 0.58;
      const minorRadius = radius * 0.28;
      lineGroup.userData.majorRadius = majorRadius;
      lineGroup.userData.minorRadius = minorRadius;
      lineGroup.userData.majorAngle = majorAngle;
      lineGroup.userData.phase = (i / this.fieldLineCount) * Math.PI * 2;

      const geometry = this.createFieldLineGeometry(
        majorRadius,
        minorRadius,
        majorAngle,
        radius * 0.012,
      );
      const line = new THREE.Mesh(geometry, lineMaterial);
      lineGroup.add(line);

      for (
        let markerIndex = 0;
        markerIndex < this.markersPerFieldLine;
        markerIndex++
      ) {
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.userData.isMagnetFieldMarker = true;
        marker.userData.phaseOffset =
          (markerIndex / this.markersPerFieldLine) * Math.PI * 2;
        lineGroup.add(marker);
      }

      field.add(lineGroup);
    }

    return field;
  }

  private createFieldLineGeometry(
    majorRadius: number,
    minorRadius: number,
    majorAngle: number,
    width: number,
  ): THREE.BufferGeometry {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const segments = 80;

    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const sinT = Math.sin(t);
      const cosT = Math.cos(t);
      const ringRadius = majorRadius + minorRadius * cosT;
      // Линия огибает поперечное сечение тора. При majorAngle=0 она
      // лежит в XZ — это поворот направления линий на 90° по поверхности.
      const x = ringRadius * Math.cos(majorAngle);
      const y = ringRadius * Math.sin(majorAngle);
      const z = minorRadius * sinT;
      const center = new THREE.Vector3(x, y, z);
      const tangent = new THREE.Vector3(
        -minorRadius * sinT * Math.cos(majorAngle),
        -minorRadius * sinT * Math.sin(majorAngle),
        minorRadius * cosT,
      ).normalize();
      const surfaceNormal = new THREE.Vector3(
        cosT * Math.cos(majorAngle),
        cosT * Math.sin(majorAngle),
        sinT,
      ).normalize();
      const normal = new THREE.Vector3()
        .crossVectors(tangent, surfaceNormal)
        .normalize();
      if (normal.lengthSq() < 0.0001) normal.set(1, 0, 0);

      const inner = center.clone().addScaledVector(normal, -width * 0.5);
      const outer = center.clone().addScaledVector(normal, width * 0.5);

      positions.push(inner.x, inner.y, inner.z, outer.x, outer.y, outer.z);
      uvs.push(0, i / segments, 1, i / segments);

      if (i < segments) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  private updateMagnetFieldMarkers(now: number, direction: number) {
    if (!this.magnetField) return;

    this.magnetField.children.forEach((lineGroup) => {
      const majorRadius = lineGroup.userData.majorRadius as number;
      const minorRadius = lineGroup.userData.minorRadius as number;
      const majorAngle = lineGroup.userData.majorAngle as number;
      const phase = lineGroup.userData.phase as number;
      lineGroup.children
        .filter((child) => child.userData.isMagnetFieldMarker)
        .forEach((marker) => {
          const phaseOffset = marker.userData.phaseOffset as number;
          const t = phase + phaseOffset + now * 0.0022 * direction;
          const sinT = Math.sin(t);
          const cosT = Math.cos(t);
          const ringRadius = majorRadius + minorRadius * cosT;
          marker.position.set(
            ringRadius * Math.cos(majorAngle),
            ringRadius * Math.sin(majorAngle),
            minorRadius * sinT,
          );

          const tangent = new THREE.Vector3(
            -minorRadius * sinT * Math.cos(majorAngle) * direction,
            -minorRadius * sinT * Math.sin(majorAngle) * direction,
            minorRadius * cosT * direction,
          ).normalize();
          marker.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            tangent,
          );
        });
    });
  }

  private removeMagnetField() {
    if (!this.magnetField) return;

    this.scene.remove(this.magnetField);
    const disposedGeometries = new Set<THREE.BufferGeometry>();
    const disposedMaterials = new Set<THREE.Material>();
    this.magnetField.traverse((child) => {
      const line = child as THREE.Line;
      if (line.geometry && !disposedGeometries.has(line.geometry)) {
        line.geometry.dispose();
        disposedGeometries.add(line.geometry);
      }

      const material = line.material as THREE.Material | undefined;
      if (material && !disposedMaterials.has(material)) {
        material.dispose();
        disposedMaterials.add(material);
      }
    });
    this.magnetField = null;
  }

  //   public createMagnetField(): THREE.Mesh {
  //     const geometry = new THREE.SphereGeometry(2, 32, 32);

  //     const material = new THREE.ShaderMaterial({
  //       side: THREE.BackSide,
  //       transparent: true,
  //       depthWrite: false,
  //       blending: THREE.AdditiveBlending,

  //       uniforms: {
  //         time: { value: 0 },
  //         intensity: { value: 0.1 },
  //         color: { value: new THREE.Color("#00eaff") },
  //       },
  //       vertexShader: magnetFieldVertex,
  //       fragmentShader: magnetFieldFragment,
  //     });

  //     return new THREE.Mesh(geometry, material);
  //   }
}
