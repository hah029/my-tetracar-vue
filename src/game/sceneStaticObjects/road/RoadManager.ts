import * as THREE from "three";
import { Road } from "./Road";
import { RoadLine } from "./RoadLine";
import { SpeedLine } from "./SpeedLine";
import { RoadEdge, NeonEdge } from "./edges";
import { type RoadConfig, type SpeedLineConfig, type RoadStats } from "./types";
import { DEFAULT_ROAD_CONFIG, NEON_ROAD_CONFIG, getEdgePositions } from "./config";
import { SideObject, type SideObjectConfig } from "./SideObject";

export class RoadManager {
  private static instance: RoadManager | null = null;
  
  private road: Road | null = null;
  private roadLines: RoadLine[] = [];
  private speedLines: SpeedLine[] = [];
  private edges: THREE.Line[] = [];
  private sideObjects: SideObject[] = [];
  private sideObjectConfig: Required<SideObjectConfig>;
  
  private config: Required<RoadConfig>;
  private scene: THREE.Scene;

  private constructor(config: RoadConfig, scene: THREE.Scene, sideObjectConfig: SideObjectConfig = {}) {
    if (!config.lanes) {
      throw new Error('RoadManager must be initialized with lanes configuration');
    }
    this.config = { ...DEFAULT_ROAD_CONFIG, ...config };
    this.sideObjectConfig = {
      color: sideObjectConfig.color ?? 0xffff00,
      height: sideObjectConfig.height ?? 0.5,
      radius: sideObjectConfig.radius ?? 0.1,
      radialSegments: sideObjectConfig.radialSegments ?? 8,
      offset: sideObjectConfig.offset ?? 1.5,
      spacing: sideObjectConfig.spacing ?? 7
    };
    this.scene = scene;
  }

  public static initialize(config: RoadConfig, scene: THREE.Scene, sideObjectConfig: SideObjectConfig = {}): RoadManager {
    if (!config.lanes) {
      throw new Error('Cannot initialize RoadManager without lanes configuration');
    }
    RoadManager.instance = new RoadManager(config, scene, sideObjectConfig);
    return RoadManager.instance;
  }

  public static isInitialized(): boolean {
    return RoadManager.instance !== null;
  }

  public static getInstance(): RoadManager {
    if (!RoadManager.instance) {
      throw new Error('RoadManager not initialized. Call RoadManager.initialize() first.');
    }
    return RoadManager.instance;
  }

  public createRoad(useNeon: boolean = false): void {
    this.clear();

    if (useNeon) {
      this.createNeonRoad();
    } else {
      this.createStandardRoad();
    }
  }

  private createStandardRoad(): void {
    // console.log('Creating standard road');
    this.road = new Road(this.config);
    this.scene.add(this.road);
    this.addEdges();
    this.addRoadLines();
  }

  private createNeonRoad(): void {
    // console.log('Creating neon road');
    const neonConfig = { ...this.config, ...NEON_ROAD_CONFIG };
    this.road = new Road(neonConfig);
    this.scene.add(this.road);
    this.addNeonEdges();
    this.addRoadLines(0x66ffff, 0x3366aa);
  }

  public createSideObjects(): void {
    this.clearSideObjects();

    if (!this.road) return;
    
    const { left, right } = this.road.getEdgePositions();
    const leftX = left - this.sideObjectConfig.offset;
    const rightX = right + this.sideObjectConfig.offset;

    for (let z = -this.config.length; z <= 10; z += this.sideObjectConfig.spacing) {
      // Левый столбик
      const leftObj = new SideObject(-1, z, this.sideObjectConfig);
      leftObj.setPosition(leftX, z);
      this.scene.add(leftObj);
      this.sideObjects.push(leftObj);

      // Правый столбик
      const rightObj = new SideObject(1, z, this.sideObjectConfig);
      rightObj.setPosition(rightX, z);
      this.scene.add(rightObj);
      this.sideObjects.push(rightObj);
    }
  }

  private clearSideObjects(): void {
    this.sideObjects.forEach(obj => {
      this.scene.remove(obj);
    });
    this.sideObjects = [];
  }

  private addEdges(): void {
    if (!this.road) return;
    
    const { left, right } = this.road.getEdgePositions();
    
    const leftEdge = new RoadEdge(left);
    this.scene.add(leftEdge);
    this.edges.push(leftEdge);

    const rightEdge = new RoadEdge(right);
    this.scene.add(rightEdge);
    this.edges.push(rightEdge);
  }

  private addNeonEdges(): void {
    if (!this.road) return;
    
    const { left, right } = this.road.getEdgePositions();
    
    const leftEdge = new NeonEdge(left);
    this.scene.add(leftEdge);
    this.edges.push(leftEdge);

    const rightEdge = new NeonEdge(right);
    this.scene.add(rightEdge);
    this.edges.push(rightEdge);
  }

  private addRoadLines(color?: number, emissive?: number): void {
    if (!this.road) return;
    
    const { segmentLength, gap, length } = this.config;
    const lanes = this.road.getLanePositions();
    const totalSegments = Math.ceil(length / (segmentLength + gap)) + 10;

    // Создаем линии МЕЖДУ полосами
    for (let i = 0; i < lanes.length - 1; i++) {
      const x = (lanes[i] + lanes[i + 1]) / 2;

      for (let j = 0; j < totalSegments; j++) {
        const line = new RoadLine({
          x,
          z: -segmentLength / 2 - j * (segmentLength + gap),
          segmentLength,
          gap,
          color: color ?? 0x44ffff,
          emissive: emissive ?? 0x226688
        });

        this.roadLines.push(line);
        this.scene.add(line); // ← ИСПРАВЛЕНО: было scene.add(line)
      }
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
        bounds: { left, right }
      });
      
      this.speedLines.push(line);
      this.scene.add(line); // ← ИСПРАВЛЕНО: было scene.add(line)
    }
  }

  public update(speed: number): void {
    this.roadLines.forEach(line => line.update(speed));
    this.speedLines.forEach(line => line.update(speed));
    this.sideObjects.forEach(obj => obj.update(speed, this.config.length));
  }

  public clear(): void {
    if (this.road) {
      this.scene.remove(this.road);
      this.road = null;
    }

    this.roadLines.forEach(line => this.scene.remove(line));
    this.roadLines = [];

    this.speedLines.forEach(line => this.scene.remove(line));
    this.speedLines = [];

    this.edges.forEach(edge => this.scene.remove(edge));
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

  public getConfig(): Readonly<Required<RoadConfig>> {
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
    return this.config.lanes[index];
  }

  public updateConfig(config: Partial<RoadConfig>): void {
    this.config = { ...this.config, ...config };
    const useNeon = this.edges.some(edge => edge instanceof NeonEdge);
    this.createRoad(useNeon);
  }

  public setNeonMode(enabled: boolean): void {
    this.createRoad(enabled);
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
      sideObjectsCount: this.sideObjects.length,
      lanePositions: lanes
    };
  }
}

// Удаляем эту строку - она теперь не нужна и будет вызывать ошибку:
// export const roadManager = RoadManager.getInstance();