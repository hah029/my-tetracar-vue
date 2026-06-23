export default {
  // Основные настройки следования камеры
  settings: {
    height: 20,
    distance: 25,
    lookahead: 20,
    follow_speed: 0.7,
    distance_reduction_factor: 0.8, // уменьшение дистанции при наборе скорости
    lookat_y_offset: 2, // дополнительное смещение точки взгляда по Y
  },

  // Начальные положение и точка взгляда
  inits: {
    position: { x: 0, y: 15, z: 20 },
    lookat: { x: 0, y: 1, z: -10 },
  },

  // Поле зрения (FOV)
  fov: {
    min: 60,
    max: 100,
    follow_speed: 0.05,
    clamp: { min: 10, max: 170 },
  },

  // Наклон камеры при поворотах
  tilt: {
    factor: 0.3,
  },

  // Фоновая/постоянная тряска (шейк)
  shake: {
    base: { amplitude: 0.05, frequency: 1.05 },
    max: { amplitude: 0.18, frequency: 1.75 },
    multiplier: { y: 0.9, z: 0.55 },
    lookat: 0.45,
    roll: 0.011,
  },

  // Тряска при ударе (impact shake)
  impact_shake: {
    min: 0.6,
    max: 0.9,
    decay_rate: 6.5,
    duration: 0.32,
  },

  event_shake: {
    shot: { strength: 0.28, duration: 0.1 },
    nitro: { strength: 0.28, duration: 0.6 },
    heavy_nitro: { strength: 0.42, duration: 0.7 },
    landing: { strength: 0.28, duration: 0.2 },
  },

  // Поведение камеры при разрушении (destroyed state)
  destroyed: {
    lerp_factor: 0.05, // DESTROYED_LERP_FACTOR
    offset: { x: 0, y: 3, z: 8 }, // DESTROYED_CAMERA_OFFSET_*
  },
};
