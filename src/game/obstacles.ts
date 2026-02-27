// src/game/Obstacle.ts
import * as THREE from "three";
import { RoadManager } from "./sceneStaticObjects/road/RoadManager";

// Интерфейсы и типы
export interface ObstacleConfig {
  lane: number;
  variant: number;
  baseColor: THREE.Color;
  pulseSpeed: number;
  pulsePhase: number;
}

export interface ObstaclePatternOptions {
  zPos?: number;
  pattern?: 'wall' | 'zigzag' | 'random';
  count?: number;
  spacing?: number;
}

// Класс для отдельного препятствия
export class Obstacle extends THREE.Mesh {
  public userData: ObstacleConfig;

  constructor(laneIndex: number, scene: THREE.Scene, zPos: number = -60, variant: number | null = null) {
    // Создаём материалы для препятствий
    const materials = Obstacle.createMaterials();
    
    // Выбираем материал
    const materialIndex = variant !== null ? variant % materials.length : Math.floor(Math.random() * materials.length);
    const material = materials[materialIndex].clone();

    // Используем единую геометрию
    const geometry = new THREE.BoxGeometry(1.8, 0.5, 1.2);

    super(geometry, material);

    // Получаем позицию полосы из RoadManager
    let x: number;
    try {
      const roadManager = RoadManager.getInstance();
      x = roadManager.getLanePosition(laneIndex);
    } catch (error) {
      // Fallback на случай, если RoadManager еще не инициализирован
      console.warn('RoadManager not initialized, using default lane positions');
      const defaultLanes = [-3, -1, 1, 3];
      x = defaultLanes[laneIndex] || 0;
    }

    if (isNaN(x) || isNaN(zPos)) {
      throw new Error(`Invalid position: x=${x}, z=${zPos}`);
    }

    this.position.set(x, 0.25, zPos);
    this.rotation.y = Math.random() * Math.PI;

    // Настраиваем userData
    this.userData = {
      lane: laneIndex,
      variant: materialIndex,
      baseColor: (material as THREE.MeshStandardMaterial).color.clone(),
      pulseSpeed: 0.5 + Math.random() * 0.5,
      pulsePhase: Math.random() * Math.PI * 2
    };

    // Добавляем в сцену
    scene.add(this);
  }

  // Статический метод для создания материалов
  private static createMaterials(): THREE.MeshStandardMaterial[] {
    return [
      new THREE.MeshStandardMaterial({
        color: 0xff3366,
        emissive: 0x440011,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9
      }),
      new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        emissive: 0x442200,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9
      }),
      new THREE.MeshStandardMaterial({
        color: 0x44ff88,
        emissive: 0x004422,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9
      }),
      new THREE.MeshStandardMaterial({
        color: 0xaa44ff,
        emissive: 0x220044,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9
      })
    ];
  }

  // Обновление препятствия (анимация и движение)
  public update(speed: number): boolean {
    this.position.z += speed;

    // Анимация свечения
    const material = this.material as THREE.MeshStandardMaterial;
    if (material.emissive) {
      const pulse = Math.sin(Date.now() * 0.005 + this.userData.pulsePhase) * 0.5 + 0.5;
      material.emissiveIntensity = 1.0 + pulse * 1.0;
      this.rotation.y += 0.02;
    }

    // Возвращаем true, если препятствие нужно удалить
    return this.position.z > 10;
  }

  // Получить bounding box для коллизий
  public getBoundingBox(): THREE.Box3 {
    return new THREE.Box3().setFromObject(this);
  }
}

// Класс для управления всеми препятствиями
export class ObstacleManager {
  private static instance: ObstacleManager;
  private obstacles: Obstacle[] = [];
  private scene: THREE.Scene | null = null;
  
  private constructor() {}

  // Получение экземпляра (синглтон)
  public static getInstance(): ObstacleManager {
    if (!ObstacleManager.instance) {
      ObstacleManager.instance = new ObstacleManager();
    }
    return ObstacleManager.instance;
  }

  public initialize(scene: THREE.Scene): void {
      // console.log('ObstacleManager.initialize called with scene:', scene);
      this.scene = scene;
    }

  // Получить все препятствия
  public getObstacles(): Obstacle[] {
    return this.obstacles;
  }

  // Получить количество полос из RoadManager
  private getLanesCount(): number {
    try {
      const roadManager = RoadManager.getInstance();
      return roadManager.getLanesCount();
    } catch {
      // Fallback
      return 4;
    }
  }

  // Создать одно препятствие
  public spawnObstacle(laneIndex: number, zPos: number = -60, variant: number | null = null): Obstacle | null {
    const lanesCount = this.getLanesCount();
    
    if (laneIndex < 0 || laneIndex >= lanesCount) {
      console.warn(`Invalid lane index ${laneIndex}, max is ${lanesCount - 1}`);
      return null;
    }

    // Проверяем на дубликаты
    if (this.obstacles.some(o => Math.abs(o.position.z - zPos) < 0.1 && o.userData.lane === laneIndex)) {
      return null;
    }

    try {
      const obstacle = new Obstacle(laneIndex, this.scene, zPos, variant);
      this.obstacles.push(obstacle);
      return obstacle;
    } catch (error) {
      console.error('Failed to spawn obstacle:', error);
      return null;
    }
  }

  // Создать ряд препятствий
  public spawnObstacleRow(laneIndex: number, zPos: number = -60, variant: number | null = null): Obstacle | null {
    return this.spawnObstacle(laneIndex, zPos, variant);
  }

  // Создать паттерн препятствий
  public spawnObstaclePattern(options: ObstaclePatternOptions = {}): Obstacle[] {
    const {
      zPos = -60,
      pattern = 'random',
      count,
      spacing = 4
    } = options;

    const spawned: Obstacle[] = [];
    const lanesCount = this.getLanesCount();

    switch (pattern) {
      case 'wall':
        // Стена из препятствий на всех полосах
        for (let i = 0; i < lanesCount; i++) {
          const obstacle = this.spawnObstacle(i, zPos, i);
          if (obstacle) spawned.push(obstacle);
        }
        break;

      case 'zigzag':
        // Зигзаг
        for (let i = 0; i < lanesCount; i++) {
          const obstacle = this.spawnObstacle(i, zPos - i * spacing, i);
          if (obstacle) spawned.push(obstacle);
        }
        break;

      case 'random':
      default:
        // Случайные препятствия
        const obstacleCount = count ?? (2 + Math.floor(Math.random() * 3));
        for (let i = 0; i < obstacleCount; i++) {
          const lane = Math.floor(Math.random() * lanesCount);
          const obstacle = this.spawnObstacle(lane, zPos - i * spacing);
          if (obstacle) spawned.push(obstacle);
        }
        break;
    }

    return spawned;
  }

  // Обновить все препятствия
  public update(speed: number): void {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      const shouldRemove = obstacle.update(speed);

      if (shouldRemove) {
        this.scene.remove(obstacle);
        this.obstacles.splice(i, 1);
      }
    }
  }

  // Сбросить все препятствия
  public reset(): void {
    this.obstacles.forEach(obstacle => {
      this.scene.remove(obstacle);
    });
    this.obstacles = [];
  }

  // Получить препятствия в определенном диапазоне
  public getObstaclesInRange(zMin: number, zMax: number): Obstacle[] {
    return this.obstacles.filter(obstacle => 
      obstacle.position.z >= zMin && obstacle.position.z <= zMax
    );
  }

  // Проверить коллизию с препятствием
  public checkCollision(box: THREE.Box3): Obstacle | null {
    for (const obstacle of this.obstacles) {
      const obstacleBox = obstacle.getBoundingBox();
      if (box.intersectsBox(obstacleBox)) {
        return obstacle;
      }
    }
    return null;
  }

  // Удалить конкретное препятствие
  public removeObstacle(obstacle: Obstacle): void {
    const index = this.obstacles.indexOf(obstacle);
    if (index !== -1) {
      this.scene.remove(obstacle);
      this.obstacles.splice(index, 1);
    }
  }

  // Получить количество препятствий
  public getCount(): number {
    return this.obstacles.length;
  }

  // Получить статистику по препятствиям
  public getStats(): { total: number; byLane: Map<number, number> } {
    const byLane = new Map<number, number>();
    
    this.obstacles.forEach(obstacle => {
      const lane = obstacle.userData.lane;
      byLane.set(lane, (byLane.get(lane) || 0) + 1);
    });

    return {
      total: this.obstacles.length,
      byLane
    };
  }
}

// Создаем и экспортируем синглтон для удобства
export const obstacleManager = ObstacleManager.getInstance();

// Для обратной совместимости экспортируем также функции
export const obstacles = obstacleManager.getObstacles();
export const spawnObstacleRow = (laneIndex: number, zPos: number = -60, variant: number | null = null) => 
  obstacleManager.spawnObstacleRow(laneIndex, zPos, variant);
export const updateObstacles = (speed: number) => obstacleManager.update(speed);
export const resetObstacles = () => obstacleManager.reset();
export const spawnObstaclePattern = (zPos: number = -60, pattern: 'wall' | 'zigzag' | 'random' = 'random') => 
  obstacleManager.spawnObstaclePattern({ zPos, pattern });