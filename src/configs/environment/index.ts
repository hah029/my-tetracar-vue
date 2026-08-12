import textureUrl from "@/assets/textures/road_tile.svg";
import { MODELS } from "@/assets/models";
import { atlas } from "@/assets/textures/TextureAtlas";
import { ATLAS_SPRITES } from "@/assets/textures/atlasSprites";

export default {
  axesSize: 5,

  fog: {
    near: 0.01,
    far: 200,
  },

  // Функция для вычисления дефолтных полос (зависит от XZ_SCALING)
  getDefaultLanes: (xzScaling: number, laneCount = 5) => {
    const spacing = 6 * xzScaling;
    const centerOffset = (laneCount - 1) / 2;

    return Array.from(
      { length: laneCount },
      (_, index) => (index - centerOffset) * spacing,
    );
  },

  // Базовый конфиг дороги (без lanes — они вычисляются динамически)
  defaultRoadBase: {
    length: 800,
    // length: 200,
    color: 0xeeeeee,
    emissive: 0xeeeeee,
    opacity: 0.25,
    yPosition: 0.0,
    gap: 0,
    edgeOffset: 0.3,
    textureUrl,
  },

  // Дополнительные параметры для неоновой дороги
  neonRoadExtras: {
    emissiveIntensity: 0.1,
  },

  // Конфигурация боковых объектов
  sideObjectGeometryConfig: {
    scale: [2, 2, 2],
    modelUrl: MODELS.cube,
  },

  sideObjectMaterialConfig: {
    atlas,
    atlasSprite: ATLAS_SPRITES.cube.base,
  },
};
