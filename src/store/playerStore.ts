import { defineStore } from "pinia";
import { ref } from "vue";
import { useProgressStore } from "@/store/progressStore";

export const usePlayerStore = defineStore("playerStore", () => {
    // #region - основные константы
        const progressStore = useProgressStore();

        const BASE_SPEED = 0.017;           // м/с - стартовая скорость машинки
        const MAX_SPEED = 0.5;              // м/с - максимальная скорость машинки
        const NITRO_MULTIPLIER = 1.5;
        const ACCELERATION = 0.0000005;     // - темп ускорения машинки
        const BASE_NITRO_TIMER = 5000;

        // speed
        const speed = ref(BASE_SPEED);
        const baseSpeed = ref(BASE_SPEED);
        const maxSpeed = ref(MAX_SPEED);
        const acceleration = ref(ACCELERATION);
        const accelerationType = ref<"exponential" | "logarithmic">("logarithmic");

        // nitro
        const isNitroEnabled = ref(false);
        const nitroTimer = ref(BASE_NITRO_TIMER);
        const goldNitroMultiplier = ref(2);
        const diamondNitroMultiplier = ref(2);

        // armor
        const isShieldEnabled = ref(false);
        const armor = ref(0);
        const maxArmor = ref(5);

        //ammo
        const ammo = ref(0);
        const maxAmmo = ref(5);

        // position
        const currentLane = ref(1); // 0..3 для полос
        const carPosition = ref({ x: 0, y: 0, z: 0 });
        const cameraPosition = ref({ x: 0, y: 0, z: 0 });

        // быстрые сообщения
        const notificationMsg = ref('');
        const eventType = ref('');
        const eventCounter = ref(0);
    // #endregion

    // сбрасываем все бустеры игрока при поражении / выходе из игры
    function resetPlayerAchievements() {
        ammo.value = 0
        armor.value = 0;
        disableShield();
        disableNitro();
        console.log('all boosters reseted');
        
    };

    // #region - работаем с нитро
        // включаем нитро
        function enableNitro() {
            isNitroEnabled.value = true;
            if (!isNitroEnabled.value) progressStore.riseMultiplier(2, 'multiply');
        };``

        // отключаем нитро
        function disableNitro() {
            isNitroEnabled.value = false;
            nitroTimer.value = BASE_NITRO_TIMER;
            if (progressStore.currentMultiplier != 1) progressStore.reduceMultiplier(2);
        };
    // #endregion

    // #region - работаем с броней
        // добавляем кол-во брони (после поимки)
        function addArmor(): void {
            if (armor.value < maxArmor.value) armor.value += 1;
        };

        // уменьшаем кол-во брони (после выстрела)
        function consumeArmor() {
            if (armor.value > 0) armor.value -= 1;
        };

        // включаем броню
        function enableShield() {
            isShieldEnabled.value = true;
        };

        // отключаем броню
        function disableShield() {
            isShieldEnabled.value = false;
        };
    // #endregion

    // #region - работаем со скоростью и ускорением
    function resetGameData() {
        baseSpeed.value = BASE_SPEED;
        speed.value = BASE_SPEED;
        isNitroEnabled.value = false;
        currentLane.value = 1;
    };

    function getCurrentSpeed() {
        let multiplier = 1.0;
        if (isNitroEnabled.value) {
            multiplier = NITRO_MULTIPLIER;
        };
        let curSpeed = baseSpeed.value * multiplier;
        if (curSpeed > maxSpeed.value) {
            return maxSpeed.value;
        };
        return curSpeed;
    };

    function getCurrentSpeedInCubesPerHour(precision = 2) {
        return (getCurrentSpeed() * 3600).toFixed(precision);
    };

    function getCurrentAcceleration() {
        const currentSpeed = getCurrentSpeed();
        const ratio = currentSpeed / maxSpeed.value;
        if (accelerationType.value === "exponential") {
        return acceleration.value * (1 - ratio);
        } else {
        // Логарифмическая модель: ускорение обратно пропорционально скорости
        // Формула: a = acceleration * (maxSpeed / (currentSpeed + 1)) * (1 - ratio)
        // Это обеспечивает более медленный рост на высоких скоростях
        const logFactor = maxSpeed.value / (currentSpeed + 1);
        return acceleration.value * logFactor * (1 - ratio);
        };
    };

    function setAccelerationType(type: "exponential" | "logarithmic") {
        accelerationType.value = type;
    };
    // #endregion

    // #region - работаем с патронами
        // добавляем кол-во патронов (после поимки)
        function addAmmo(): void {
            if (ammo.value < maxAmmo.value) ammo.value += 1;
        };

        // уменьшаем кол-во патронов (после выстрела)
        function consumeAmmo() {
            if (ammo.value > 0) ammo.value -= 1;
        };

        // проверка на наличие патронов в обойме
        function canShoot(): boolean {
            return ammo.value > 0;
        };
    // #endregion
    
    // #region - работаем с событиями и сообщениями
        // ловим тип события (поймал патрон, броню, нитро или энергон)
        function makeEventHappened(type_) {
            eventType.value = type_;
            eventCounter.value++;
            setTimeout(() => {
                eventType.value = '';
            }, 1000);
        };

        // сохраняем новое сообщение в Store
        function addNewMsg(msg_) {
            notificationMsg.value = msg_;
        };
    // #endregion

    return {
        // states
        // NITRO_MULTIPLIER,
        BASE_NITRO_TIMER,
        BASE_SPEED,
        speed,
        baseSpeed,
        isNitroEnabled,
        isShieldEnabled,
        currentLane,
        maxSpeed,
        acceleration,
        accelerationType,
        carPosition,
        cameraPosition,
        nitroTimer,
        armor,
        maxArmor,
        ammo,
        maxAmmo,
        goldNitroMultiplier,
        diamondNitroMultiplier,
        notificationMsg,
        eventType,
        eventCounter,

        // methods
        resetPlayerAchievements,
        enableNitro,
        disableNitro,

        enableShield,
        disableShield,

        resetGameData,
        getCurrentSpeed,
        getCurrentSpeedInCubesPerHour,
        getCurrentAcceleration,
        setAccelerationType,

        addAmmo,
        consumeAmmo,
        addArmor,
        consumeArmor,
        canShoot,
        makeEventHappened,
        addNewMsg,
    };
});
