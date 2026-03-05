### Структура проекта
```bash
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
```


## Звуки
### Музыка
- music_intro - музыка, которую игрок слышит, когда включается игра (gameState=menu)
- music_background - "продолжение" музыки (после music_intro), но она зацикливается в рамках gameState=playing || menu
- music_gameover -  включается для gameState=gameover

### SFX
<!-- отсчет до старта гонки - порядок важен -->
- sfx_3 - 3
- sfx_2 - 2
- sfx_1 - 1
- sfx_start - старт!
<!--  -->
- sfx_add_patron - звук поднятия монетки
- sfx_change_mode - ???
- sfx_click - звук смены полосы
- sfx_destroy_bot - уничтожение бота (другой машинки) или препятствия
- sfx_inc_100_progress - ???
- sfx_shot - звук выстрела