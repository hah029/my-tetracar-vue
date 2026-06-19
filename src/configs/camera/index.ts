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
    base: { amplitude: 0.000001, frequency: 1 },
    max: { amplitude: 0.01, frequency: 2 },
    multiplier: { y: 1.3, z: 0.7 },
    delta_time_default: 1,
  },

  // Тряска при ударе (impact shake)
  impact_shake: {
    min: 0.23, // IMPACT_SHAKE_MIN
    max: 0.42, // IMPACT_SHAKE_MAX
    decay_rate: 6, // IMPACT_SHAKE_DECAY_RATE
    duration: 50000, // IMPACT_DURATION
    max_amplitude: 10000, // MAX_IMPACT_AMPLITUDE
  },

  // Поведение камеры при разрушении (destroyed state)
  destroyed: {
    lerp_factor: 0.05, // DESTROYED_LERP_FACTOR
    offset: { x: 0, y: 3, z: 8 }, // DESTROYED_CAMERA_OFFSET_*
  },
};
