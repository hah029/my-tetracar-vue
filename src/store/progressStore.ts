// src/store/progressStore.ts
import { usePlayerStore } from "@/store/playerStore";
import { defineStore } from "pinia";
import { ref } from "vue";
import { SoundManager } from "@/game/sound/SoundManager";


export const useProgressStore = defineStore("progressStore", () => {
    const playerStore = usePlayerStore();
    const currentDistance = ref(0);
    const score = ref(0);
    const highScore = ref(0);
    const oldHighScore = ref(0);
    const goldens = ref(0);
    const energons = ref(0);
    const currentMultiplier = ref(1);
    const isNewRecord = ref(false);

    let lastReportedCubes = 0;

    // коэф-ты умножения очков при:
    const DISTANCE_MLT = 1;             // прохождении одной единицы дистанции
    const GOLDEN_MLT = 5;               // поимке Голдена
    const ENERGON_MLT = 50;             // поимке Энергона
    const OBSTACLE_CRUSHED_MLT = 50;    // разрушении препятствия (выстрелом или броней)
    const JUMP_MLT = 35;                // прыжке на трамплине

    // коэф-ты роста множителя:
    const MULTI_BASE = 1;               // базовый коэф-т
    const MULTI_GROW_NITRO = 2;         // умножение при поимке нитро
    const MULTI_GROW_GOLDENS = 0.5;     // суммирование при поимке N-го кол-ва голденов
    const MULTI_GROW_DISTANCE = 0.5;    // суммирование при прохождении N-го кол-ва дистанции
    const MULTI_GROW_BOOSTER = 2;       // суммирование при прохождении N-го кол-ва дистанции

    let soundManager: SoundManager;
    soundManager = SoundManager.getInstance();

    // #region - очки прогресса
        function calcScore(type_: string, amount_: number) {
            let points = 0;

            if (type_ == 'distance') {
                points = amount_ * DISTANCE_MLT;
            } else if (type_ == 'golden') {
                points = amount_ * GOLDEN_MLT;
            } else if (type_ == 'energon') {
                points = amount_ * ENERGON_MLT;
            } else if (type_ == 'jump') {
                points = amount_ * JUMP_MLT;
            } else if (type_ == 'consumeArmor') {
                points = amount_ * OBSTACLE_CRUSHED_MLT;
            } else if (type_ == 'bulletHit') {
                points = amount_ * OBSTACLE_CRUSHED_MLT;
            };

            score.value += points * currentMultiplier.value;

            if (highScore.value != 0) {
                if (score.value > highScore.value) {
                    if (!isNewRecord.value) {
                        isNewRecord.value = true;
                        playerStore.addNewMsg('newRecord');
                        soundManager.play("sfx_new_record");
                        oldHighScore.value = highScore.value;   // запоминаем предыдущий рекорд
                    };
                    highScore.value = score.value;
                };
            };
        };
        
        function resetScore() {
            score.value = 0;
        };

        function returnBackOldHighScore() {
            highScore.value = oldHighScore.value;
            resetNewRecord();
        };

        function saveHighScore(): void {
            isNewRecord.value = false;
            if (score.value > highScore.value) {
                highScore.value = score.value;
            };
        };

        function resetNewRecord() {
            isNewRecord.value = false;
        };
    // #endregion

    // #region - работа с множителем
        // увеличиваем множитель
        function riseMultiplier(amount_: number, operation_: string) {
            if (operation_ == 'multiply') {
                currentMultiplier.value *= amount_;
            } else if (operation_ == 'add') {
                currentMultiplier.value += amount_;
            };
        };
        
        // понижаем множитель
        function reduceMultiplier(amount_: number) {
            currentMultiplier.value /= amount_;
        };

        // сбрасываем множитель до единицы
        function clearMultiplier() {
            currentMultiplier.value = 1;
        };
    // #endregion

    // #region - софт и хард валюта
        function addGolden(amount: number) {
            goldens.value += amount;
            calcScore('golden', amount);
        };

        function addEnergon(amount: number) {
            energons.value += amount;
            calcScore('energon', amount);
        };
    // #endregion
    
    // #region - дистанция
        function getDangerLevel() {
            return 0;
        };

        function resetDistance() {
            currentDistance.value = 0;
            lastReportedCubes = 0;
        };

        function addDistance(value: number) {
            currentDistance.value += value;
            const currentCubes = getDistanceInCubes();
            const newCubes = currentCubes - lastReportedCubes;
            
            if (newCubes > 0) {
                calcScore('distance', newCubes);  // добавляем очки только за НОВЫЕ целые кубы
                lastReportedCubes = currentCubes;
            };
        };

        function getDistance(): number {
            return currentDistance.value;
        };

        function getDistanceInCubes(): number {
            return Math.floor(currentDistance.value);
        };
    // #endregion

    return {
        currentDistance,
        score,
        highScore,
        goldens,
        energons,
        currentMultiplier,
        isNewRecord,

        calcScore,
        resetScore,
        returnBackOldHighScore,
        saveHighScore,
        resetNewRecord,
        riseMultiplier,
        reduceMultiplier,
        clearMultiplier,

        addGolden,
        addEnergon,

        getDangerLevel,
        resetDistance,
        addDistance,
        getDistance,
        getDistanceInCubes,
    };
});
