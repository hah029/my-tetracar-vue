// src/store/progressStore.ts
import { usePlayerStore } from "@/store/playerStore";
import { defineStore } from "pinia";
import { ref } from "vue";


export const useProgressStore = defineStore("progressStore", () => {
    const playerStore = usePlayerStore();
    const currentDistance = ref(0);
    const score = ref(0);
    const highScore = ref(0);
    const goldens = ref(0);
    const energons = ref(0);
    const currentMultiplier = ref(1);
    const isNewRecord = ref(false);

    let lastReportedCubes = 0;

    // коэф-ты умножения очков при:
    const DISTANCE_MLT = 1;             // прохождении одной единицы дистанции
    const GOLDEN_MLT = 5;               // поимке Голдена
    const ENERGON_MLT = 50;             // поимке Энергона
    const SPEED_MLT = 0.2;              // фиксированной величине скорости
    const OBSTACLE_CRUSHED_MLT = 35;    // разрушении препятствия (выстрелом или броней)
    const JUMP_MLT = 15;                // прыжке на трамплине

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
                highScore.value = score.value;
                if (!isNewRecord.value) {
                    isNewRecord.value = true;
                    playerStore.addNewMsg('newRecord');
                };
            };
        };
    };
    
    function resetScore() {
        score.value = 0;
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
        saveHighScore,
        resetNewRecord,

        addGolden,
        addEnergon,

        getDangerLevel,
        resetDistance,
        addDistance,
        getDistance,
        getDistanceInCubes,
    };
});
