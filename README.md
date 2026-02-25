src/
├── main.ts                  # точка входа, монтирование Vue
├── App.vue                  # корневой компонент
├── assets/
│   └── style.css            # глобальные стили
├── components/
│   ├── HUD.vue              # индикатор скорости, нитро, очков
│   ├── PauseMenu.vue        # меню паузы
│   ├── GameOverMenu.vue     # меню Game Over
│   └── MainMenu.vue         # главное меню
├── composables/
│   ├── useThree.ts          # сцена, камера, renderer (сделано)
│   ├── useGame.ts           # car, player, obstacles, jumps (сделано)
│   ├── useAnimate.ts        # анимационный цикл, обновление игры (будет)
│   └── useHUD.ts            # обновление HUD, danger, nitro (будет)
├── store/
│   └── gameState.ts         # Pinia store для GameState, speed, nitro (сделано)
├── utils/
│   └── loaders.ts           # загрузка моделей glb (car, cube, road) (будет)
└── types/
    └── game.d.ts            # типы для Car, Obstacle, Jump (частично сделано в useGame.ts)