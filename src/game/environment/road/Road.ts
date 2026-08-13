import * as THREE from "three";
import type { RoadConfig } from "./types";
import { loadTexture } from "@/helpers/loaders";
import { useEnvironmentStore } from "@/store/environmentStore";
import type { AtlasSpriteName } from "@/assets/textures/atlasSprites";

export class Road extends THREE.Mesh {
  public readonly lanes: number[];
  public readonly width: number;
  public readonly length: number;

  constructor(config?: RoadConfig) {
    const tmpConfig = {
      ...useEnvironmentStore().defaultRoadConfig,
      ...config,
    };

    if (!tmpConfig.lanes || tmpConfig.lanes.length === 0) {
      throw new Error("Road must have at least one lane");
    }

    const width = useEnvironmentStore().calculateRoadWidth(tmpConfig.lanes);
    const geometry = new THREE.PlaneGeometry(width, tmpConfig.length!);
    
    let material: THREE.Material = new THREE.MeshStandardMaterial({
      color: tmpConfig.color ?? 0xffffff,
      emissive: tmpConfig.emissive ?? tmpConfig.color ?? 0xffffff,
      emissiveIntensity: tmpConfig.emissiveIntensity ?? 0.8,
      transparent: true,
      opacity: tmpConfig.opacity ?? 0.2,
    });

    if (tmpConfig.atlas && tmpConfig.atlasSprite) {
      const sprite = tmpConfig.atlas.getSprite(tmpConfig.atlasSprite as AtlasSpriteName);
      const atlasTexture = tmpConfig.atlas.getAtlasTexture();
      
      if (sprite && atlasTexture) {
        // Вырезаем спрайт из атласа через canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          const img = atlasTexture.image as HTMLImageElement;
          const frame = sprite.frame.frame;
          
          canvas.width = frame.w;
          canvas.height = frame.h;
          
          ctx.drawImage(
            img,
            frame.x, frame.y, frame.w, frame.h,
            0, 0, frame.w, frame.h
          );
          
          const texture = new THREE.CanvasTexture(canvas);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          
          const tileSize = 2;
          texture.repeat.set(
            width / tileSize,
            tmpConfig.length! / tileSize
          );
          texture.needsUpdate = true;
          
          material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            emissive: tmpConfig.emissive ?? 0xffffff,
            emissiveIntensity: tmpConfig.emissiveIntensity ?? 1,
            opacity: tmpConfig.opacity ?? 0.45,
          });
        }
      }
    }

    super(geometry, material);
    this.lanes = [...tmpConfig.lanes];
    this.width = width;
    this.length = tmpConfig.length!;
    this.rotation.x = -Math.PI / 2;
    this.position.z = 0;
    this.position.y = tmpConfig.yPosition!;
    this.castShadow = false;
    this.receiveShadow = true;
  }

  public getLanePosition(index: number): number {
    if (index < 0 || index >= this.lanes.length) {
      throw new Error(
        `Lane index ${index} out of range (0-${this.lanes.length - 1})`,
      );
    }
    const lane = this.lanes[index];
    if (lane === undefined) {
      throw new Error(`Lane at index ${index} is undefined`);
    }
    return lane;
  }

  public getLanesCount(): number {
    return this.lanes.length;
  }

  public getLanePositions(): number[] {
    return [...this.lanes];
  }

  public getEdgePositions(): { left: number; right: number } {
    return useEnvironmentStore().getEdgePositions(this.lanes);
  }
}