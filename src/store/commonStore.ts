// src/store/cameraStore.ts
import type { GeometryConfig, MaterialConfig } from "@/game/cube/types";
import { defineStore } from "pinia";

import { MODELS } from "@/assets/models";
import { TEXTURES } from "@/assets/textures";

export const useCommonStore = defineStore("common", () => {
  const XZ_SCALING = 1;
  // Основные параметры камеры
  const BASE_ITEM_ROTATION = 0.03; // скорость вращения айтемов (всех)
  const BASE_ITEM_YPOS = XZ_SCALING / 4; // базовая высота спавна айтемов

  // Z-координата спавна всех сегментов (здесь нужно именно в минус уводить)
  const BASE_SEGMENTS_ZPOS = -100;
  const ITEMS_REMOVING_ZPOS = 30;
  // шаг дистанции по нарастанию сложности (влияет на выборку доступных сегментов)
  const BASE_SEGMENT_DIFFICULTY_STEP = 100;

  // базовая "стоимость" любой монеты
  const BASE_COIN_VALUE = 1;

  // вероятность спавна энергона
  // работает в пределах 0...1 (0 - не выпадает вообще, 1 - выпадает только энергон)
  const COIN_SPAWN_PROBABILITIES = {
    energon: 5,
    golden: 1000,
  };
  const BOOSTER_SPAWN_PROBABILITIES = {
    nitro: 1,
    shield: 1,
    magnet: 1,
    bullet: 1,
  };

  const ITEM_GEOMETRY_CONFIG: GeometryConfig = {
    scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
    modelUrl: MODELS.cube,
  };

  // const ENERGON_GEOMETRY_CONFIG: GeometryConfig = {
  //   scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
  //   // modelUrl: energonUrl,
  //   modelUrl: MODELS.cube,
  // };

  const GOLDEN_MATERIAL_CONFIG: MaterialConfig = {
    textureUrl: TEXTURES.cube.golden,
    emissive: 0xefbf04,
    emissiveIntensity: 0.6,
    metalness: 4.0,
  };

  // const ENERGON_MATERIAL_CONFIG: MaterialConfig = {
  //   emissive: 0x82c8e5,
  //   emissiveIntensity: 0.6,
  //   metalness: 0,
  // };

  // глобальная физика
  const GRAVITY = 20;
  const FRICTION = 2.5;
  const BOUNCE_FACTOR = 0.4;
  //
  const COLLISION_FACTOR = 0.2;
  const REMOVAL_HEIGHT = 20;
  // физика взрыва
  const EXPLOSION_FORCE = 25;
  const EXPLOSION_UPWARD = 20;

  const BULLET_DEFAULT_SPEED = 0.15;
  const BULLET_MAX_DISTANCE = 50;
  const BULLET_DEFAULT_MATERIAL = {
    color: 0xff0000,
    emissive: 0xff0000,
    emissiveIntensity: 5,
  };
  // const BULLET_DEFAULT_GEOMETRY = {
  //   width: 1,
  //   height: 1,
  //   depth: 1,
  // };

  function getBulletGeometry() {
    return [1, 1, 1];
  }

  function getBasePhysics() {
    return {
      gravity: GRAVITY,
      friction: FRICTION,
      bounceFactor: BOUNCE_FACTOR,
      collisionFactor: COLLISION_FACTOR,
      removalHeight: REMOVAL_HEIGHT,
      explosionForce: EXPLOSION_FORCE,
      explosionUpward: EXPLOSION_UPWARD,
      cubeRotationSpeed: BASE_ITEM_ROTATION,
    };
  }

  const DESTROYED_ROLLDROP_WEIGHTS = {
    golden_coin: 20,
    bullet: 20,
    shield_booster: 10,
    energon_coin: 20,
    nitro_booster: 1,
    magnet_booster: 1,
  };

  const DANGER_DISTANCE = 30;
  const COLLISION_COOLDOWN_MS = 2000;

  const BASE_CUBE_MATERIAL_CONFIG = {
    textureUrl: null,
    color: 0xffffff,
    emissive: 0x000000,
    emissiveIntensity: 1,
    ior: 1,
    transmission: 1,
    metalness: 1,
    roughness: 1,
    thickness: 1,
  };

  const FLASH_SIZE_DEFAULT = 6;
  const EXPLOSION_SIZE_DEFAULT = 6;
  const FLASH_DURATION_DEFAULT = 100;
  const EXPLOSION_DURATION_DEFAULT = 500;

  const JUMP_WIDTH = 5;
  const JUMP_HEIGHT = 1;
  const JUMP_DEPTH = 8;

  const MOVING_OBSTACLE_SPEED = 0.005;

  const YPOS = BASE_ITEM_YPOS;
  const ZPOS = 0;
  const LXPS = -2 * XZ_SCALING;
  const RXPS = 2 * XZ_SCALING;
  const OPTIMIZED_OBSTACLE_FORMS: GeometryConfig[][] = [
    [
      {
        pos: [0, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.obstacle1x3,
      },
    ],
    [
      {
        pos: [0, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.obstacle2x3,
      },
    ],
    [
      {
        pos: [0, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.obstacle3x3,
      },
    ],
  ];
  const FULL_OBSTACLE_FORMS: GeometryConfig[][] = [
    // Стена из трёх кубиков в ряд
    [
      // нижний ряд
      {
        pos: [LXPS, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [0, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [RXPS, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
    ],

    // Стена из трёх кубиков в 2 ряда
    [
      // нижний ряд
      {
        pos: [LXPS, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [0, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [RXPS, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      // средний ряд
      {
        pos: [LXPS, YPOS, ZPOS - XZ_SCALING * 2],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [0, YPOS, ZPOS - XZ_SCALING * 2],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [RXPS, YPOS, ZPOS - XZ_SCALING * 2],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
    ],

    // квадрат 3x3
    [
      // нижний ряд
      {
        pos: [LXPS, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [0, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [RXPS, YPOS, ZPOS],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      // средний ряд
      {
        pos: [LXPS, YPOS, ZPOS - XZ_SCALING * 2],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [0, YPOS, ZPOS - XZ_SCALING * 2],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [RXPS, YPOS, ZPOS - XZ_SCALING * 2],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      // верхний ряд
      {
        pos: [LXPS, YPOS, ZPOS - XZ_SCALING * 4],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [0, YPOS, ZPOS - XZ_SCALING * 4],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
      {
        pos: [RXPS, YPOS, ZPOS - XZ_SCALING * 4],
        scale: [XZ_SCALING, XZ_SCALING, XZ_SCALING],
        modelUrl: MODELS.cube,
      },
    ],
  ];

  const MAGNET_MATERIAL_CONFIG: MaterialConfig = {
    textureUrl: TEXTURES.cube.base,
    // color: 0x00ff00,
    emissive: 0x000000,
    emissiveIntensity: 0.6,
  };
  const BULLET_MATERIAL_CONFIG: MaterialConfig = {
    textureUrl: TEXTURES.cube.bullet,
    emissive: 0xdd0000,
    emissiveIntensity: 0.6,
  };
  const NITRO_MATERIAL_CONFIG: MaterialConfig = {
    textureUrl: TEXTURES.cube.base,
    // color: 0x00ff00,
    emissive: 0x00dd00,
    emissiveIntensity: 0.6,
  };
  const SHIELD_MATERIAL_CONFIG: MaterialConfig = {
    textureUrl: TEXTURES.cube.base,
    // color: 0x00ff00,
    emissive: 0xffffff,
    emissiveIntensity: 0.6,
  };

  const SEGMENT_ROW_BODY_LENGTH = XZ_SCALING * 3;
  const SEGMENT_ROW_SPACING_LENGTH = SEGMENT_ROW_BODY_LENGTH;
  const SEGMENT_ROW_LENGTH =
    SEGMENT_ROW_BODY_LENGTH + SEGMENT_ROW_SPACING_LENGTH;

  return {
    XZ_SCALING,

    ITEM_GEOMETRY_CONFIG,
    GOLDEN_MATERIAL_CONFIG,

    BASE_ITEM_ROTATION,
    BASE_ITEM_YPOS,
    BASE_SEGMENTS_ZPOS,
    ITEMS_REMOVING_ZPOS,
    BASE_SEGMENT_DIFFICULTY_STEP,
    BASE_COIN_VALUE,
    COIN_SPAWN_PROBABILITIES,
    BOOSTER_SPAWN_PROBABILITIES,
    //
    GRAVITY,
    FRICTION,
    BOUNCE_FACTOR,
    EXPLOSION_FORCE,
    EXPLOSION_UPWARD,
    COLLISION_FACTOR,
    REMOVAL_HEIGHT,

    getBasePhysics,
    DESTROYED_ROLLDROP_WEIGHTS,

    DANGER_DISTANCE,
    COLLISION_COOLDOWN_MS,

    BULLET_DEFAULT_SPEED,
    BULLET_DEFAULT_MATERIAL,
    getBulletGeometry,
    BULLET_MAX_DISTANCE,

    BASE_CUBE_MATERIAL_CONFIG,

    FLASH_SIZE_DEFAULT,
    EXPLOSION_SIZE_DEFAULT,
    FLASH_DURATION_DEFAULT,
    EXPLOSION_DURATION_DEFAULT,

    JUMP_WIDTH,
    JUMP_HEIGHT,
    JUMP_DEPTH,

    MOVING_OBSTACLE_SPEED,
    OPTIMIZED_OBSTACLE_FORMS,
    FULL_OBSTACLE_FORMS,

    MAGNET_MATERIAL_CONFIG,
    NITRO_MATERIAL_CONFIG,
    SHIELD_MATERIAL_CONFIG,
    BULLET_MATERIAL_CONFIG,

    SEGMENT_ROW_BODY_LENGTH,
    SEGMENT_ROW_SPACING_LENGTH,
  };
});
