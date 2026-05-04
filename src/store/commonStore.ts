// src/store/cameraStore.ts
import { defineStore } from "pinia";

export const useCommonStore = defineStore("common", () => {
  // Основные параметры камеры
  const BASE_ITEM_ROTATION = 0.03; // скорость вращения айтемов (всех)
  const BASE_ITEM_YPOS = 0.2; // базовая высота спавна айтемов

  // Z-координата спавна всех сегментов (здесь нужно именно в минус уводить)
  const BASE_SEGMENTS_ZPOS = -60;
  const ITEMS_REMOVING_ZPOS = 10;
  // шаг дистанции по нарастанию сложности (влияет на выборку доступных сегментов)
  const BASE_SEGMENT_DIFFICULTY_STEP = 150;

  // базовая "стоимость" любой монеты
  const BASE_COIN_VALUE = 1;

  // вероятность спавна энергона
  // работает в пределах 0...1 (0 - не выпадает вообще, 1 - выпадает только энергон)
  const ENERGON_SPAWN_PROBABILITY = 0.005;

  // глобальная физика
  // const GRAVITY = 0.01;
  const GRAVITY = 9.81;
  const FRICTION = 2.5;
  const BOUNCE_FACTOR = 0.4;
  //
  const COLLISION_FACTOR = 0.2;
  const REMOVAL_HEIGHT = 10;
  // физика взрыва
  const EXPLOSION_FORCE = 15;
  const EXPLOSION_UPWARD = 8;

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
  };

  return {
    BASE_ITEM_ROTATION,
    BASE_ITEM_YPOS,
    BASE_SEGMENTS_ZPOS,
    ITEMS_REMOVING_ZPOS,
    BASE_SEGMENT_DIFFICULTY_STEP,
    BASE_COIN_VALUE,
    ENERGON_SPAWN_PROBABILITY,
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
  };
});
