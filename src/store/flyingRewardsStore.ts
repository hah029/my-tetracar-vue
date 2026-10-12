import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";

export type FlyingRewardType = "golden" | "energon";

export interface FlyingSprite {
    id: number;
    batchId: number;
    type: FlyingRewardType;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    size: number;
    delay: number;     // ms
    duration: number;  // ms
};

export interface FlyingRewardItem {
    type: FlyingRewardType;
    amount: number;
};

export interface LaunchRequest {
    from: { x: number; y: number };   // экранные координаты источника
    items: FlyingRewardItem[];
};

export const useFlyingRewardsStore = defineStore("flyingRewards", () => {
    // Якорь: DOM-элемент CurrencyPanel регистрирует себя здесь.
    const targetElement = shallowRef<HTMLElement | null>(null);

    // Активные спрайты для рендера.
    const sprites = ref<FlyingSprite[]>([]);

    // Сколько полётов в воздухе по каждому типу. CurrencyPanel смотрит сюда
    // и решает — анимировать счётчик сразу или подождать.
    const pendingCount = ref<Record<FlyingRewardType, number>>({ golden: 0, energon: 0 });

    // Подписчики на «прилетело».
    const landedCallbacks = new Set<(type: FlyingRewardType) => void>();

    let idCounter = 0;
    let batchIdCounter = 0;

    // ===== Настройка количества спрайтов =====
    const SPRITE_COUNT_DIVISOR = { golden: 60, energon: 2 } as const;   // ← плотность
    const SPRITE_COUNT_MIN = 5;     // ← минимум монеток
    const SPRITE_COUNT_MAX = 16;    // ← максимум (потолок «толпы»)

    // ===== Настройка длительности полёта =====
    const FLIGHT_DURATION_BASE = 1300;      // мс, базовая длительность полета
    const FLIGHT_DURATION_JITTER = 500;     // мс, разброс (добавляется к базовой)
    const INITIAL_DELAY_MS = 500;           // мс, стартовая пауза перед стартом полета
    const STAGGER_MS = 70;                  // мс, частота вылета (пауза между спавнами в батче)

    function setTarget(el: HTMLElement | null) {
        targetElement.value = el;
    };

    function isPending(type: FlyingRewardType): boolean {
        return pendingCount.value[type] > 0;
    };

    function onLanded(cb: (type: FlyingRewardType) => void) {
        landedCallbacks.add(cb);
        return () => { landedCallbacks.delete(cb); };
    };

    function notifyLanded(type: FlyingRewardType) {
        for (const cb of landedCallbacks) cb(type);
    };

    function getTargetCenter() {
        const el = targetElement.value;
        if (!el) return { x: window.innerWidth - 80, y: 40 };
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    };

    // Сколько спрайтов спавнить: 3..10 в зависимости от суммы.
    function spriteCountFor(item: FlyingRewardItem): number {
        const divisor = SPRITE_COUNT_DIVISOR[item.type];
        const raw = Math.ceil(item.amount / divisor);
        return Math.max(SPRITE_COUNT_MIN, Math.min(SPRITE_COUNT_MAX, raw));
    };

    function spriteSizeFor(amount: number): number {
        if (amount < 50) return 22;
        if (amount < 200) return 28;
        if (amount < 500) return 34;
        return 40;
    };

        function launch(request: LaunchRequest) {
        const target = getTargetCenter();
        const batchId = batchIdCounter++;

        const allSprites: FlyingSprite[] = [];
        const typesInBatch = new Set<FlyingRewardType>();
        let stagger = INITIAL_DELAY_MS;   // стартовая задержка сохранена

        for (const item of request.items) {
            typesInBatch.add(item.type);
            const count = spriteCountFor(item);
            const size = spriteSizeFor(item.amount);

            for (let i = 0; i < count; i++) {
                allSprites.push({
                    id: idCounter++,
                    batchId,
                    type: item.type,
                    startX: request.from.x + (Math.random() - 0.5) * 44,
                    startY: request.from.y + (Math.random() - 0.5) * 44,
                    endX: target.x + (Math.random() - 0.5) * 24,
                    endY: target.y + (Math.random() - 0.5) * 24,
                    size,
                    delay: stagger,
                    duration: FLIGHT_DURATION_BASE + Math.random() * FLIGHT_DURATION_JITTER,
                });
                stagger += STAGGER_MS;
            };
        };

        for (const t of typesInBatch) pendingCount.value[t]++;
        sprites.value.push(...allSprites);

        const lastSprite = allSprites[allSprites.length - 1];
        const totalMs = (lastSprite?.delay ?? 0) + (lastSprite?.duration ?? 0);

        setTimeout(() => {
            const ids = new Set(allSprites.map((s) => s.id));
            sprites.value = sprites.value.filter((s) => !ids.has(s.id));

            for (const t of typesInBatch) {
                pendingCount.value[t] = Math.max(0, pendingCount.value[t] - 1);
                notifyLanded(t);
            };
        }, totalMs + 30);
    };

    function lock(type: FlyingRewardType) {
        pendingCount.value[type]++;
    };

    function unlock(type: FlyingRewardType) {
        pendingCount.value[type] = Math.max(0, pendingCount.value[type] - 1);
    };

    return {
        sprites,
        targetElement,
        setTarget,
        isPending,
        onLanded,
        launch,
        lock,
        unlock,
    };
});