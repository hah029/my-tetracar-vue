// src/store/cameraStore.ts
import { defineStore } from "pinia";

export const useCameraStore = defineStore("camera", () => {
  // Основные параметры камеры
  const CAMERA_HEIGHT = 5;
  const CAMERA_DISTANCE = 8;
  const CAMERA_LOOKAHEAD = 10;
  const CAMERA_FOLLOW_SPEED = 2.0;

  // FOV
  const FOV_MIN = 60;
  const FOV_MAX = 80;
  const FOV_FOLLOW_SPEED = 0.5;
  const FOV_CLAMP_MIN = 10;
  const FOV_CLAMP_MAX = 170;

  // Наклон (tilt)
  const TILT_FACTOR = 0.3;

  // Коэффициент уменьшения расстояния при скорости
  const DISTANCE_REDUCTION_FACTOR = 0.8;

  // Смещение lookAt по Y
  const LOOKAT_Y_OFFSET = 1;

  // Параметры тряски (shake)
  const SHAKE_BASE_AMPLITUDE = 0.000001;
  const SHAKE_MAX_AMPLITUDE = 0.01;
  const SHAKE_BASE_FREQUENCY = 1;
  const SHAKE_MAX_FREQUENCY = 2;
  const SHAKE_FREQUENCY_MULTIPLIER_Y = 1.3;
  const SHAKE_FREQUENCY_MULTIPLIER_Z = 0.7;
  const SHAKE_DELTA_TIME_DEFAULT = 1;

  // Тряска при ударе (impact shake)
  const IMPACT_SHAKE_MIN = 0.23;
  const IMPACT_SHAKE_MAX = 0.42;
  const IMPACT_SHAKE_DECAY_RATE = 6;

  // Камера при разрушении
  const DESTROYED_LERP_FACTOR = 0.05;
  const DESTROYED_CAMERA_OFFSET_X = 0;
  const DESTROYED_CAMERA_OFFSET_Y = 3;
  const DESTROYED_CAMERA_OFFSET_Z = 8;

  return {
    CAMERA_HEIGHT,
    CAMERA_DISTANCE,
    CAMERA_LOOKAHEAD,
    CAMERA_FOLLOW_SPEED,
    FOV_MIN,
    FOV_MAX,
    FOV_FOLLOW_SPEED,
    FOV_CLAMP_MIN,
    FOV_CLAMP_MAX,
    TILT_FACTOR,
    DISTANCE_REDUCTION_FACTOR,
    LOOKAT_Y_OFFSET,
    SHAKE_BASE_AMPLITUDE,
    SHAKE_MAX_AMPLITUDE,
    SHAKE_BASE_FREQUENCY,
    SHAKE_MAX_FREQUENCY,
    SHAKE_FREQUENCY_MULTIPLIER_Y,
    SHAKE_FREQUENCY_MULTIPLIER_Z,
    SHAKE_DELTA_TIME_DEFAULT,
    IMPACT_SHAKE_MIN,
    IMPACT_SHAKE_MAX,
    IMPACT_SHAKE_DECAY_RATE,
    DESTROYED_LERP_FACTOR,
    DESTROYED_CAMERA_OFFSET_X,
    DESTROYED_CAMERA_OFFSET_Y,
    DESTROYED_CAMERA_OFFSET_Z,
  };
});
