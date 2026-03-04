import * as THREE from "three";
import { Road } from "./Road";
import { RoadLine } from "./RoadLine";
import { SpeedLine } from "./SpeedLine";
import { RoadEdge } from "./edges";
import { type RoadConfig, type SpeedLineConfig, type RoadStats } from "./types";
import { DEFAULT_ROAD_CONFIG } from "./config";
import { SideObject } from "./SideObject";

export class RoadManager {
  private static instance: RoadManager | null = null;

  private road: Road | null = null;
  private roadLines: RoadLine[] = [];
  private speedLines: SpeedLine[] = [];
  private edges: THREE.Mesh[] = [];
  // private sideObjects: SideObject[] = [];
  private leftSideObjects: SideObject[] = [];
  private rightSideObjects: SideObject[] = [];
  private sideObjectSpacing = 1.2;

  private config: RoadConfig;
  private scene: THREE.Scene;

  private constructor(config: RoadConfig, scene: THREE.Scene) {
    if (!config.lanes) {
      throw new Error(
        "RoadManager must be initialized with lanes configuration",
      );
    }
    this.config = { ...DEFAULT_ROAD_CONFIG, ...config };
    this.scene = scene;
  }

  public static initialize(
    config: RoadConfig,
    scene: THREE.Scene,
  ): RoadManager {
    if (!config.lanes) {
      throw new Error(
        "Cannot initialize RoadManager without lanes configuration",
      );
    }
    RoadManager.instance = new RoadManager(config, scene);
    return RoadManager.instance;
  }

  public static isInitialized(): boolean {
    return RoadManager.instance !== null;
  }

  public static getInstance(): RoadManager {
    if (!RoadManager.instance) {
      throw new Error(
        "RoadManager not initialized. Call RoadManager.initialize() first.",
      );
    }
    return RoadManager.instance;
  }

  public createRoad(): void {
    this.clear();
    this.createStandardRoad();
  }

  private createStandardRoad(): void {
    this.road = new Road(this.config);
    this.scene.add(this.road);
    this.scene.add(this.road);
    this.addEdges();
    this.addRoadLines();
    this.addSideObjects();
  }

  private addSideObjects(): void {
    this.clearSideObjects();

    if (!this.road) return;

    const { left, right } = this.road.getEdgePositions();
    const offset = 0.2;
    const leftX = left - offset;
    const rightX = right + offset;

    for (let z = -this.config.length; z <= 10; z += this.sideObjectSpacing) {
      // Левый столбик
      const leftObj = new SideObject(leftX, 0.1, z);
      this.scene.add(leftObj);
      this.leftSideObjects.push(leftObj);

      // Правый столбик
      const rightObj = new SideObject(rightX, 0.1, z);
      this.scene.add(rightObj);
      this.rightSideObjects.push(rightObj);
    }
  }

  private clearSideObjects(): void {
    this.leftSideObjects.forEach((obj) => {
      this.scene.remove(obj);
    });
    this.rightSideObjects.forEach((obj) => {
      this.scene.remove(obj);
    });
    this.leftSideObjects = [];
    this.rightSideObjects = [];
  }

  private addEdges(): void {
    if (!this.road) return;

    const { left, right } = this.road.getEdgePositions();
    const height = 10;

    const leftEdge = new RoadEdge(left, height, this.config.length);
    this.scene.add(leftEdge);
    this.edges.push(leftEdge);

    const rightEdge = new RoadEdge(right, height, this.config.length);
    this.scene.add(rightEdge);
    this.edges.push(rightEdge);
  }

  private addRoadLines(): void {
    if (!this.road) return;

    const { length } = this.config;
    if (!length) {
      throw new Error();
    }
    const lanes = this.road.getLanePositions();

    for (let i = 0; i < lanes.length - 1; i++) {
      const prev_ = lanes[i];
      const next_ = lanes[i + 1];
      if (prev_ == undefined || next_ == undefined) continue;
      const x = (prev_ + next_) / 2;

      const line = new RoadLine({
        x,
        z: -length / 2,
        length,
      });
      this.roadLines.push(line);
      this.scene.add(line);
    }
  }

  public addSpeedLines(config: SpeedLineConfig = {}): void {
    if (!this.road) return;

    const count = config.count ?? 20;
    const lanes = this.road.getLanePositions();
    const { left, right } = this.road.getEdgePositions();

    for (let i = 0; i < count; i++) {
      const line = new SpeedLine({
        ...config,
        lanes,
        bounds: { left, right },
      });

      this.speedLines.push(line);
      this.scene.add(line);
    }
  }

  public update(speed: number): void {
    for (const obj of this.leftSideObjects) {
      obj.update(speed, this.sideObjectSpacing, this.leftSideObjects);
    }
    for (const obj of this.rightSideObjects) {
      obj.update(speed, this.sideObjectSpacing, this.rightSideObjects);
    }
  }

  public clear(): void {
    if (this.road) {
      this.scene.remove(this.road);
      this.road = null;
    }
    this.roadLines.forEach((line) => this.scene.remove(line));
    this.roadLines = [];
    this.edges.forEach((edge) => this.scene.remove(edge));
    this.edges = [];

    this.clearSideObjects();
  }

  public setRoadColor(color: number, emissive?: number): void {
    if (this.road) {
      const material = this.road.material as THREE.MeshStandardMaterial;
      material.color.setHex(color);
      if (emissive) {
        material.emissive.setHex(emissive);
      }
    }
  }

  public setOpacity(opacity: number): void {
    if (this.road) {
      (this.road.material as THREE.MeshStandardMaterial).opacity = opacity;
    }
  }

  public getConfig(): Readonly<RoadConfig> {
    return { ...this.config };
  }

  public getLanes(): number[] {
    return this.road ? this.road.getLanePositions() : this.config.lanes;
  }

  public getLanesCount(): number {
    return this.road ? this.road.getLanesCount() : this.config.lanes.length;
  }

  public getLanePosition(index: number): number {
    if (this.road) {
      return this.road.getLanePosition(index);
    }
    const lane = this.config.lanes[index];
    return lane ? lane : 0;
  }

  public updateConfig(config: Partial<RoadConfig>): void {
    this.config = { ...this.config, ...config };
    this.createRoad();
  }

  public getRoad(): Road | null {
    return this.road;
  }

  public getStats(): RoadStats {
    const lanes = this.getLanes();
    return {
      hasRoad: this.road !== null,
      lanesCount: lanes.length,
      linesCount: this.roadLines.length,
      speedLinesCount: this.speedLines.length,
      edgesCount: this.edges.length,
      sideObjectsCount:
        this.leftSideObjects.length + this.rightSideObjects.length,
      lanePositions: lanes,
    };
  }

  public getEdges(): THREE.Mesh[] {
    return this.edges;
  }

  public reset(): void {
    this.clear();
    this.createRoad();
  }
}
