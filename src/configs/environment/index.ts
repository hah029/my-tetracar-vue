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
  getDefaultLanes: (xzScaling: number) => [
    -(12 * xzScaling),
    -(6 * xzScaling),
    0,
    6 * xzScaling,
    12 * xzScaling,
  ],

  // Базовый конфиг дороги (без lanes — они вычисляются динамически)
  defaultRoadBase: {
    length: 800,
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
