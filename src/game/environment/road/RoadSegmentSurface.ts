import * as THREE from "three";
import type { RoadConfig } from "./types";
import { loadTexture } from "@/helpers/loaders";
import { atlas } from "@/assets/textures/TextureAtlas";
import { ATLAS_SPRITES } from "@/assets/textures/atlasSprites";
import { applyCubeSpriteUV } from "@/helpers/applyAtlasUV";
import { useCommonStore } from "@/store/commonStore";

export type RoadSegmentSurfaceCoverage = {
  lanes: number[];
  rowStart: number;
  rowEnd: number;
};

export type RoadSegmentSurfaceCurve = {
  direction: "left" | "right";
  /** Полный угол дуги в радианах */
  totalAngleRad: number;
  /** Радиус дуги (вычисляется из totalAngleRad и длины сегмента) */
  radius: number;
  /** X-позиция pivot'а (центра окружности) в локальном пространстве группы */
  pivotX: number;
  rowStart: number;
  rowEnd: number;
  rotateStartZ: number;
  rotateEndZ: number;
};

export type RoadCurveMotion = {
  direction: "left" | "right";
  pivotX: number;
  pivotZ: number;
  turnStartZ: number;
  radius: number;
  totalAngleRad: number;
  angleRad: number;
  phase: "approach" | "turning" | "completed";
  completed: boolean;
};

export type RoadRouteAttachment = {
  motion: RoadCurveMotion;
  /** Расстояние от дальнего конца дуги до начала прямого сегмента. */
  startDistance: number;
};

export type RoadSegmentSurfaceInterval = {
  lane: number;
  back: number;
  front: number;
};

type SurfaceMeshRecord = {
  mesh: THREE.Mesh;
  lane: number;
  length: number;
  rowIndex?: number;
  leftX?: number;
  rightX?: number;
  frontZ?: number;
  backZ?: number;
};

type CurveSideObjectRecord = {
  mesh: THREE.Mesh;
  side: "left" | "right";
  rowIndex: number;
  localZ: number;
  localX: number;
};

export class RoadSegmentSurface {
  private static readonly SAFE_REMOVE_Z = 90;
  private static readonly OCCLUSION_EPSILON = 0.08;
  private static readonly TEXTURE_TILE_SIZE = 2;
  private static readonly SURFACE_SEAM_OVERLAP = 0.08;
  private static readonly IDLE_SURFACE_Y_OFFSET = -0.025;
  private group = new THREE.Group();
  /** Дочерняя группа для curved-сегментов: вращается вокруг pivot */
  private pivotGroup: THREE.Group | null = null;
  private attachmentGroup: THREE.Group | null = null;
  private meshes: THREE.Mesh[] = [];
  private surfaceMeshes: SurfaceMeshRecord[] = [];
  private curveSideObjects: CurveSideObjectRecord[] = [];
  private sideObjectsDetached = false;
  private readonly routeAttachment: RoadRouteAttachment | null;
  private readonly motion: RoadCurveMotion | null;
  private readonly loop: boolean;
  private loopOcclusionProvider: (() => RoadSegmentSurfaceInterval[]) | null =
    null;

  constructor(
    private scene: THREE.Scene,
    private config: RoadConfig,
    private lanePositions: number[],
    private laneWidth: number,
    private baseZ: number,
    private rowLength: number,
    private rowCount: number,
    private coverage: RoadSegmentSurfaceCoverage[],
    options: {
      loop?: boolean;
      curve?: RoadSegmentSurfaceCurve;
      motion?: RoadCurveMotion;
      routeAttachment?: RoadRouteAttachment;
    } = {},
  ) {
    this.loop = options.loop ?? false;
    this.curve = options.curve ?? null;
    this.routeAttachment = options.routeAttachment ?? null;
    this.motion =
      options.motion ?? this.routeAttachment?.motion ?? null;
    this.group.position.z = this.loop
      ? 0
      : this.motion
        ? this.motion.pivotZ
        : baseZ;

    // Для curved-сегментов создаём pivotGroup
    if (this.motion) {
      this.pivotGroup = new THREE.Group();
      this.pivotGroup.position.set(this.motion.pivotX, 0, 0);
      this.group.add(this.pivotGroup);
      if (this.routeAttachment) {
        this.attachmentGroup = new THREE.Group();
        const directionSign =
          this.motion.direction === "left" ? 1 : -1;
        const endAngle = directionSign * this.motion.totalAngleRad;
        const startVectorX = -this.motion.pivotX;
        const farX = startVectorX * Math.cos(endAngle);
        const farZ = -startVectorX * Math.sin(endAngle);
        const tangentX = -Math.sin(endAngle);
        const tangentZ = -Math.cos(endAngle);
        this.attachmentGroup.position.set(
          farX + tangentX * this.routeAttachment.startDistance,
          0,
          farZ + tangentZ * this.routeAttachment.startDistance,
        );
        this.attachmentGroup.rotation.y = endAngle;
        this.pivotGroup.add(this.attachmentGroup);
      }
    }

    this.createMeshes();
    this.updatePivotRotation();
    this.scene.add(this.group);
  }

  private readonly curve: RoadSegmentSurfaceCurve | null;

  public update(deltaTime: number, speed: number): boolean {
    if (this.loop) {
      this.updateLoopRows(deltaTime, speed);
      return false;
    }

    if (this.motion) {
      if (!this.motion.completed) {
        this.group.position.z = this.motion.pivotZ;
      }
      this.updatePivotRotation();
      if (this.motion.completed) {
        if (!this.sideObjectsDetached) {
          this.curveSideObjects.forEach(({ mesh }) => {
            mesh.visible = false;
          });
          this.sideObjectsDetached = true;
        }
        this.group.position.z += deltaTime * speed;
      }
    } else {
      this.group.position.z += deltaTime * speed;
    }

    return this.getBackEdgeZ() > RoadSegmentSurface.SAFE_REMOVE_Z;
  }

  public setLoopOcclusionProvider(
    provider: (() => RoadSegmentSurfaceInterval[]) | null,
  ): void {
    this.loopOcclusionProvider = provider;
  }

  public isCurved(): boolean {
    return this.motion !== null && !this.motion.completed;
  }

  private updateLoopRows(deltaTime: number, speed: number): void {
    const move = deltaTime * speed;
    const wrapDistance = this.rowCount * this.rowLength;
    const intervals = this.loopOcclusionProvider?.() ?? [];

    for (const row of this.surfaceMeshes) {
      const { mesh, lane } = row;
      mesh.position.z += move;

      if (mesh.position.z > RoadSegmentSurface.SAFE_REMOVE_Z) {
        mesh.position.z -= wrapDistance;
      }

    //   mesh.visible = true;  // 👈 Всегда видим

      mesh.visible = !this.overlapsAnyInterval(
        mesh.position.z - this.rowLength / 2,
        mesh.position.z + this.rowLength / 2,
        lane,
        intervals,
      );
    }
  }

  public getFrontZ(): number {
    if (this.loop) {
      return this.surfaceMeshes.reduce(
        (front, row) => Math.max(front, row.mesh.position.z + row.length / 2),
        -Infinity,
      );
    }

    if (this.motion) return this.getWorldZBounds().front;
    return this.group.position.z;
  }

  public getBackZ(): number {
    if (this.loop) {
      return this.surfaceMeshes.reduce(
        (back, row) => Math.min(back, row.mesh.position.z - row.length / 2),
        Infinity,
      );
    }

    if (this.motion) return this.getWorldZBounds().back;
    return this.group.position.z - this.rowCount * this.rowLength;
  }

  public getFrontEdgeZ(): number {
    return this.getFrontZ();
  }

  public getBackEdgeZ(): number {
    return this.getBackZ();
  }

  public dispose(): void {
    this.scene.remove(this.group);

    for (const mesh of this.meshes) {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material) => material.dispose());
      } else {
        mesh.material.dispose();
      }
    }

    this.group.clear();
    this.meshes = [];
    this.surfaceMeshes = [];
    this.curveSideObjects = [];
  }

  public getSurfaceIntervals(): RoadSegmentSurfaceInterval[] {
    return this.surfaceMeshes.map((row) => {
      const { mesh, lane, length } = row;
      if (row.frontZ !== undefined && row.backZ !== undefined) {
        return {
          lane,
          back: this.group.position.z + row.backZ,
          front: this.group.position.z + row.frontZ,
        };
      }

      const z = this.group.position.z + mesh.position.z;
      return {
        lane,
        back: z - length / 2,
        front: z + length / 2,
      };
    });
  }

  public getSideObjectOcclusionInterval(): {
    back: number;
    front: number;
  } | null {
    if (!this.motion || this.motion.completed) {
      return null;
    }

    return {
      back: this.getBackZ(),
      front: this.getFrontZ(),
    };
  }

  // ============================================================
  // Создание мешей
  // ============================================================

  private createMeshes(): void {
    if (this.loop) {
      this.createLoopMeshes();
    } else {
      this.createSegmentMeshes();
    }
  }

  private createLoopMeshes(): void {
    for (let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
      for (let lane = 0; lane < this.lanePositions.length; lane++) {
        this.addSurfaceMesh(lane, this.getRowZ(rowIndex), this.rowLength);
      }
    }
  }

  private createSegmentMeshes(): void {
    if (this.curve) {
      this.createCurvedSegmentMeshes();
      return;
    }

    const target = this.attachmentGroup ?? this.group;
    for (let lane = 0; lane < this.lanePositions.length; lane++) {
      let rowIndex = 0;

      while (rowIndex < this.rowCount) {
        if (this.isCovered(lane, rowIndex)) {
          rowIndex++;
          continue;
        }

        const rangeStart = rowIndex;
        while (rowIndex < this.rowCount && !this.isCovered(lane, rowIndex)) {
          rowIndex++;
        }

        const rangeEnd = rowIndex;
        const length = (rangeEnd - rangeStart) * this.rowLength;
        const centerZ = -((rangeStart + rangeEnd) * this.rowLength) / 2;
        this.addSurfaceMesh(lane, centerZ, length, target);
      }
    }

    this.addStraightLaneLines(target);

    if (this.routeAttachment) {
      this.addAttachedSideObjects(target);
    }
  }

  private addSurfaceMesh(
    lane: number,
    z: number,
    length: number,
    target: THREE.Group = this.group,
  ): void {
    const renderedLength =
      length + RoadSegmentSurface.SURFACE_SEAM_OVERLAP;
    const geometry = new THREE.PlaneGeometry(
      this.laneWidth + RoadSegmentSurface.SURFACE_SEAM_OVERLAP,
      renderedLength,
    );
    const worldBackZ = this.loop
      ? undefined
      : this.group.position.z + z - length / 2;
    const mesh = new THREE.Mesh(
      geometry,
      this.createMaterial(renderedLength, worldBackZ),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
      this.getLaneX(lane),
      (this.config.yPosition ?? 0) +
        (this.loop ? RoadSegmentSurface.IDLE_SURFACE_Y_OFFSET : 0),
      z,
    );
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    target.add(mesh);
    this.meshes.push(mesh);
    this.surfaceMeshes.push({ mesh, lane, length });
  }

  private addStraightLaneLines(target: THREE.Group): void {
    const color = this.config.laneColor ?? this.config.emissive ?? 0xffffff;
    for (let lane = 0; lane < this.lanePositions.length - 1; lane++) {
      const left = this.lanePositions[lane];
      const right = this.lanePositions[lane + 1];
      if (left === undefined || right === undefined) continue;
      const geometry = new THREE.BoxGeometry(
        Math.max(0.08, this.laneWidth * 0.025),
        0.025,
        this.rowCount * this.rowLength +
          RoadSegmentSurface.SURFACE_SEAM_OVERLAP,
      );
      const material = new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 1,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        (left + right) / 2,
        (this.config.yPosition ?? 0) + 0.018,
        -(this.rowCount * this.rowLength) / 2,
      );
      target.add(mesh);
      this.meshes.push(mesh);
    }
  }

  private addAttachedSideObjects(target: THREE.Group): void {
    const sideConfig = this.config.sideObjects;
    if (!sideConfig?.enabled) return;

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const sprite = atlas.getSprite(ATLAS_SPRITES.cube.base);
    if (sprite) applyCubeSpriteUV(geometry, sprite);
    const atlasTexture = atlas.getAtlasTexture();
    const material = new THREE.MeshStandardMaterial({
      map: atlasTexture ?? null,
      color: sideConfig.color,
      emissive: sideConfig.emissive ?? 0x000000,
      emissiveIntensity: sideConfig.emissiveIntensity ?? 0,
      transparent: (sideConfig.opacity ?? 1) < 1,
      opacity: sideConfig.opacity ?? 1,
    });
    const leftLane = this.lanePositions[0] ?? 0;
    const rightLane = this.lanePositions[this.lanePositions.length - 1] ?? 0;
    const leftX = leftLane - this.laneWidth * 0.5 - sideConfig.offset;
    const rightX = rightLane + this.laneWidth * 0.5 + sideConfig.offset;
    const length = this.rowCount * this.rowLength;
    const spacing =
      sideConfig.spacing * useCommonStore().config.xzScaling;

    for (let distance = spacing / 2; distance < length; distance += spacing) {
      this.addCurveSideObject(
        leftX,
        -distance,
        Math.floor(distance / this.rowLength),
        geometry,
        material,
        target,
      );
      this.addCurveSideObject(
        rightX,
        -distance,
        Math.floor(distance / this.rowLength),
        geometry,
        material,
        target,
      );
    }

    geometry.dispose();
    material.dispose();
  }

  // ============================================================
  // Curved segment: pre-curved arc geometry
  // ============================================================

  private createCurvedSegmentMeshes(): void {
    if (!this.curve) return;

    const target = this.pivotGroup ?? this.group;

    // Геометрия сразу строится вокруг центра окружности. pivotGroup содержит
    // координаты относительно pivot, поэтому его вращение остаётся rigid-body
    // трансформацией и не деформирует отдельные ряды.
    for (let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
      const rowOverlap =
        RoadSegmentSurface.SURFACE_SEAM_OVERLAP / this.rowLength / 2;
      const frontAngle = this.getCurveRowAngle(rowIndex - rowOverlap);
      const backAngle = this.getCurveRowAngle(rowIndex + 1 + rowOverlap);

      for (let lane = 0; lane < this.lanePositions.length; lane++) {
        if (this.isCovered(lane, rowIndex)) {
          continue;
        }

        const laneCenter = this.getLaneX(lane);
        const halfWidth =
          this.laneWidth / 2 +
          RoadSegmentSurface.SURFACE_SEAM_OVERLAP / 2;
        const leftEdge = laneCenter - halfWidth;
        const rightEdge = laneCenter + halfWidth;

        this.addCurvedSurfaceMesh(
          lane,
          rowIndex,
          leftEdge,
          rightEdge,
          frontAngle,
          backAngle,
          target,
        );
      }
    }

    this.addCurvedLaneLines(target);
    this.addCurvedSideObjects(target);
  }

  private addCurvedLaneLines(target: THREE.Group): void {
    if (!this.curve || this.lanePositions.length < 2) return;

    const color = this.config.laneColor ?? this.config.emissive ?? 0xffffff;
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 1,
    });
    const lineWidth = Math.max(0.08, this.laneWidth * 0.025);

    for (let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
      const frontAngle = this.getCurveRowAngle(rowIndex);
      const backAngle = this.getCurveRowAngle(rowIndex + 1);

      for (let lane = 0; lane < this.lanePositions.length - 1; lane++) {
        const leftLane = this.lanePositions[lane];
        const rightLane = this.lanePositions[lane + 1];
        if (leftLane === undefined || rightLane === undefined) continue;

        const dividerX = (leftLane + rightLane) / 2;
        this.addCurvedLineMesh(
          dividerX,
          lineWidth,
          frontAngle,
          backAngle,
          material,
          target,
        );
      }
    }

    material.dispose();
  }

  private addCurvedLineMesh(
    centerX: number,
    width: number,
    frontAngle: number,
    backAngle: number,
    material: THREE.Material,
    target: THREE.Group,
  ): void {
    const leftFront = this.getCurvePoint(centerX - width / 2, frontAngle);
    const rightFront = this.getCurvePoint(centerX + width / 2, frontAngle);
    const leftBack = this.getCurvePoint(centerX - width / 2, backAngle);
    const rightBack = this.getCurvePoint(centerX + width / 2, backAngle);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([
          leftFront.x, 0.015, leftFront.y,
          rightFront.x, 0.015, rightFront.y,
          leftBack.x, 0.015, leftBack.y,
          rightBack.x, 0.015, rightBack.y,
        ]),
        3,
      ),
    );
    geometry.setIndex([0, 1, 2, 1, 3, 2]);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(geometry, material.clone());
    mesh.receiveShadow = true;
    target.add(mesh);
    this.meshes.push(mesh);
  }

  /**
   * Создаёт один quad дуги в системе координат pivot.
   * Все меши добавляются в pivotGroup.
   * Вращение pivotGroup создаёт иллюзию дуги.
   */
  private addCurvedSurfaceMesh(
    lane: number,
    rowIndex: number,
    leftEdge: number,
    rightEdge: number,
    frontAngle: number,
    backAngle: number,
    target: THREE.Group,
  ): void {
    const leftFront = this.getCurvePoint(leftEdge, frontAngle);
    const rightFront = this.getCurvePoint(rightEdge, frontAngle);
    const leftBack = this.getCurvePoint(leftEdge, backAngle);
    const rightBack = this.getCurvePoint(rightEdge, backAngle);
    const positions = new Float32Array([
      leftFront.x,
      0,
      leftFront.y,
      rightFront.x,
      0,
      rightFront.y,
      leftBack.x,
      0,
      leftBack.y,
      rightBack.x,
      0,
      rightBack.y,
    ]);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute(
      "uv",
      new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), 2),
    );
    geometry.setIndex([0, 1, 2, 1, 3, 2]);
    geometry.computeVertexNormals();

    const mesh = new THREE.Mesh(
      geometry,
      this.createMaterial(
        this.rowLength,
        this.group.position.z - rowIndex * this.rowLength,
      ),
    );
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    target.add(mesh);
    this.meshes.push(mesh);
    this.surfaceMeshes.push({
      mesh,
      lane,
      length: this.rowLength,
      rowIndex,
      leftX: leftEdge,
      rightX: rightEdge,
      frontZ: Math.max(
        leftFront.y,
        rightFront.y,
        leftBack.y,
        rightBack.y,
      ),
      backZ: Math.min(
        leftFront.y,
        rightFront.y,
        leftBack.y,
        rightBack.y,
      ),
    });
  }

  private getCurveRowAngle(rowIndex: number): number {
    if (!this.curve) return 0;
    const directionSign = this.curve.direction === "left" ? 1 : -1;
    return (
      directionSign *
      (rowIndex / this.rowCount) *
      this.curve.totalAngleRad
    );
  }

  /**
   * Возвращает точку дороги относительно pivot. При angle=0 её мировая
   * координата после добавления pivotGroup равна исходному laneX.
   */
  private getCurvePoint(x: number, angle: number): THREE.Vector2 {
    if (!this.curve) return new THREE.Vector2(x, 0);
    const relativeX = x - this.curve.pivotX;
    return new THREE.Vector2(
      relativeX * Math.cos(angle),
      -relativeX * Math.sin(angle),
    );
  }

  // ============================================================
  // Вращение pivotGroup
  // ============================================================

  /**
   * Обновляет rotation.y pivotGroup на основе прогресса движения сегмента.
   * При спавне (progress=0) угол = totalAngleRad → сегмент максимально изогнут.
   * При достижении игрока (progress=1) угол = 0 → сегмент выпрямлен.
   */
  private updatePivotRotation(): void {
    if (!this.motion || !this.pivotGroup) return;

    const angleSign = this.motion.direction === "left" ? 1 : -1;
    this.pivotGroup.rotation.y = angleSign * this.motion.angleRad;
  }

  // ============================================================
  // Side objects на дуге
  // ============================================================

  private addCurvedSideObjects(target: THREE.Group): void {
    if (!this.curve || !this.config.sideObjects?.enabled) {
      return;
    }

    const sideConfig = this.config.sideObjects;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const sprite = atlas.getSprite(ATLAS_SPRITES.cube.base);
    if (sprite) applyCubeSpriteUV(geometry, sprite);
    const atlasTexture = atlas.getAtlasTexture();
    if (atlasTexture) {
      atlasTexture.flipY = false;
      atlasTexture.colorSpace = THREE.SRGBColorSpace;
    }
    const material = new THREE.MeshStandardMaterial({
      map: atlasTexture ?? null,
      color: sideConfig.color,
      emissive: sideConfig.emissive ?? 0x000000,
      emissiveIntensity: sideConfig.emissiveIntensity ?? 0,
      transparent: (sideConfig.opacity ?? 1) < 1,
      opacity: sideConfig.opacity ?? 1,
    });
    const leftLane = this.lanePositions[0] ?? 0;
    const rightLane = this.lanePositions[this.lanePositions.length - 1] ?? 0;
    const leftX = leftLane - this.laneWidth * 0.5 - sideConfig.offset;
    const rightX = rightLane + this.laneWidth * 0.5 + sideConfig.offset;
    const segmentLength = this.rowCount * this.rowLength;
    const spacing =
      sideConfig.spacing * useCommonStore().config.xzScaling;
    const objectCount = Math.ceil(segmentLength / spacing);

    for (let index = 0; index < objectCount; index++) {
      const distance = Math.min(
        segmentLength,
        index * spacing + spacing / 2,
      );
      const rowPosition = distance / this.rowLength;
      const rowIndex = Math.min(
        this.rowCount - 1,
        Math.floor(rowPosition),
      );
      const angle = this.getCurveRowAngle(rowPosition);
      const leftPoint = this.getCurvePoint(leftX, angle);
      const rightPoint = this.getCurvePoint(rightX, angle);
      this.addCurveSideObject(
        leftPoint.x,
        leftPoint.y,
        rowIndex,
        geometry,
        material,
        target,
      );
      this.addCurveSideObject(
        rightPoint.x,
        rightPoint.y,
        rowIndex,
        geometry,
        material,
        target,
      );
    }

    geometry.dispose();
    material.dispose();
  }

  private addCurveSideObject(
    localX: number,
    localZ: number,
    rowIndex: number,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    target: THREE.Group,
  ): void {
    const mesh = new THREE.Mesh(geometry.clone(), material.clone());
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.scale.set(...this.config.sideObjects!.scale);
    mesh.position.set(localX, this.config.sideObjects?.y ?? 0, localZ);
    target.add(mesh);
    this.meshes.push(mesh);
    this.curveSideObjects.push({
      mesh,
      side: "left",
      rowIndex,
      localX,
      localZ,
    });
  }

  // ============================================================
  // Вспомогательные методы
  // ============================================================

  private isCovered(lane: number, rowIndex: number): boolean {
    return this.coverage.some(
      (section) =>
        section.lanes.includes(lane) &&
        rowIndex >= section.rowStart &&
        rowIndex < section.rowEnd,
    );
  }

  private createMaterial(
    length: number,
    worldBackZ?: number,
  ): THREE.MeshStandardMaterial {
    const offsetY =
      worldBackZ === undefined ? undefined : this.getTexturePhase(worldBackZ);
    const map = this.config.textureUrl
      ? loadTexture(this.config.textureUrl, {
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.RepeatWrapping,
          repeat: {
            x: Math.max(this.laneWidth / 2, 1),
            y: Math.max(length / 2, 1),
          },
          offset:
            offsetY === undefined
              ? undefined
              : {
                  x: 0,
                  y: offsetY,
                },
        })
      : undefined;

    return new THREE.MeshStandardMaterial({
      map,
      color: this.config.color ?? 0xffffff,
      emissive: this.config.emissive ?? this.config.color ?? 0xffffff,
      emissiveIntensity: this.config.emissiveIntensity ?? 0.1,
      transparent: (this.config.opacity ?? 1) < 1,
      opacity: this.config.opacity ?? 1,
      roughness: 0.62,
      metalness: 0.08,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });
  }

  private getLaneX(lane: number): number {
    const x = this.lanePositions[lane];
    if (x !== undefined) return x;
    return 0;
  }

  private getTexturePhase(worldZ: number): number {
    const phase = worldZ / RoadSegmentSurface.TEXTURE_TILE_SIZE;
    return ((phase % 1) + 1) % 1;
  }

  private getRowZ(rowIndex: number): number {
    if (this.loop) {
      return this.baseZ - (rowIndex + 0.5) * this.rowLength;
    }

    return -(rowIndex + 0.5) * this.rowLength;
  }

  private getWorldZBounds(): { back: number; front: number } {
    this.group.updateWorldMatrix(true, true);
    const bounds = new THREE.Box3().setFromObject(this.group);
    return Number.isFinite(bounds.min.z)
      ? { back: bounds.min.z, front: bounds.max.z }
      : { back: this.group.position.z, front: this.group.position.z };
  }

  private overlapsAnyInterval(
    back: number,
    front: number,
    lane: number,
    intervals: RoadSegmentSurfaceInterval[],
  ): boolean {
    return intervals.some(
      (interval) =>
        interval.lane === lane &&
        front > interval.back - RoadSegmentSurface.OCCLUSION_EPSILON &&
        back < interval.front + RoadSegmentSurface.OCCLUSION_EPSILON,
    );
  }
}
