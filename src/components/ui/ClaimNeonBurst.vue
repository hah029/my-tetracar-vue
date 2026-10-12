<template>
    <div
        v-show="active"
        ref="rootRef"
        class="claim_neon_burst"
        aria-hidden="true"
    >
        <!-- Внутренний keyed-блок: при каждом play() пересоздаётся явно,
             между play() не трогается никакими перерисовками родителя. -->
        <div v-if="runId > 0" :key="runId" class="burst_run">
            <span class="flash_white"></span>

            <span
                v-for="spark in sparks"
                :key="spark.id"
                class="neon_spark"
                :class="[
                    `neon_spark--${spark.size}`,
                    `neon_spark--color-${spark.color}`,
                ]"
                :style="getSparkStyle(spark)"
            ></span>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { ref, watch, nextTick, onUnmounted } from "vue";

    // ЧАВО:
    //     - duration: 1.2 + Math.random() * 0.6 в generateSparks() — реальное время жизни искры (1.2–1.8s)
    //     - TOTAL_DURATION_MS = 2000 — только таймер эмита complete, всегда должен быть ≥ максимального duration + delay
    //     - PER_SIDE = 20 — плотность (80 искр всего)
    //     - HUES в спарках --color-cream / --color-gold — цвета из палитры проекта
    //     - @keyframes spark_fade — где держать яркость, а где гасить (сейчас: 25% ярко, 75% плавное затухание)

    type Side = "top" | "right" | "bottom" | "left";
    type SparkColor = "cream" | "gold";

    interface NeonSpark {
        id: number;
        side: Side;
        pos: number;
        distance: number;
        drift: number;
        duration: number;
        delay: number;
        size: "small" | "medium" | "large";
        color: SparkColor;
    };

    const props = defineProps<{ active: boolean }>();
    const emit = defineEmits<{ (e: "complete"): void }>();

    const rootRef = ref<HTMLDivElement | null>(null);
    const sparks = ref<NeonSpark[]>([]);
    const width = ref(0);
    const height = ref(0);
    const runId = ref(0);                 // увеличивается при каждом play()

    let idCounter = 0;
    let completeTimeout: ReturnType<typeof setTimeout> | null = null;

    const TOTAL_DURATION_MS = 2000;
    const PER_SIDE = 20;

    function generateSparks() {
        const list: NeonSpark[] = [];
        const sides: Side[] = ["top", "right", "bottom", "left"];

        for (const side of sides) {
            for (let i = 0; i < PER_SIDE; i++) {
                const base = (i + 0.5) / PER_SIDE;
                const jitter = (Math.random() - 0.5) * (1 / PER_SIDE) * 0.6;
                const pos = Math.max(0.02, Math.min(0.98, base + jitter));

                const roll = Math.random();
                const size: NeonSpark["size"] =
                    roll < 0.55 ? "small" : roll < 0.88 ? "medium" : "large";

                list.push({
                    id: idCounter++,
                    side,
                    pos,
                    distance: 40 + Math.random() * 90,
                    drift: (Math.random() - 0.5) * 40,
                    duration: 1.2 + Math.random() * 0.6,   // было 0.6 + 0.3, стало 1.2 + 0.6 (1.2–1.8s)
                    delay: Math.random() * 0.12,
                    size,
                    color: Math.random() < 0.55 ? "cream" : "gold",
                });
            }
        }
        sparks.value = list;
    };

    function getSparkStyle(spark: NeonSpark) {
        const w = width.value || 220;
        const h = height.value || 320;
        const scale = Math.min(w, h) / 280;

        let startX = 0, startY = 0, dx = 0, dy = 0;

        switch (spark.side) {
            case "top":
                startX = spark.pos * w; startY = 0;
                dx = spark.drift * scale; dy = -spark.distance * scale;
                break;
            case "right":
                startX = w; startY = spark.pos * h;
                dx = spark.distance * scale; dy = spark.drift * scale;
                break;
            case "bottom":
                startX = spark.pos * w; startY = h;
                dx = spark.drift * scale; dy = spark.distance * scale;
                break;
            case "left":
                startX = 0; startY = spark.pos * h;
                dx = -spark.distance * scale; dy = spark.drift * scale;
                break;
        }

        return {
            "--start-x": `${startX}px`,
            "--start-y": `${startY}px`,
            "--dx": `${dx}px`,
            "--dy": `${dy}px`,
            "--duration": `${spark.duration}s`,
            "--delay": `${spark.delay}s`,
        };
    };

    let isPlaying = false;

    async function play() {
        if (isPlaying) return;
        isPlaying = true;

        if (completeTimeout) {
            clearTimeout(completeTimeout);
            completeTimeout = null;
        }

        runId.value++;
        await nextTick();

        const parent = rootRef.value?.parentElement;
        if (parent) {
            const rect = parent.getBoundingClientRect();
            width.value = rect.width;
            height.value = rect.height;
        }

        generateSparks();

        completeTimeout = setTimeout(() => {
            isPlaying = false;
            emit("complete");
            completeTimeout = null;
        }, TOTAL_DURATION_MS);
    };

    watch(
        () => props.active,
        (isActive) => {
            if (isActive) play();
        },
        { immediate: true },
    );

    onUnmounted(() => {
        if (completeTimeout) clearTimeout(completeTimeout);
    });
</script>


<style scoped lang="scss">
    .claim_neon_burst {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: visible;
        z-index: 10;
    }

    // Изолированный внутренний контейнер — единственное, что пересоздаётся.
    .burst_run {
        position: absolute;
        inset: 0;
        pointer-events: none;
        overflow: visible;
    }

    // === Белая засветка ===
    .flash_white {
        position: absolute;
        inset: 0;
        background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 1)    0%,
            rgba(255, 255, 255, 0.92) 35%,
            rgba(255, 255, 255, 0.7)  70%,
            rgba(255, 255, 255, 0.45) 100%
        );
        opacity: 0;
        animation: flash_white 0.4s ease-out forwards;
        pointer-events: none;
        will-change: opacity;
    }

    @keyframes flash_white {
        0%   { opacity: 0; }
        20%  { opacity: 0.95; }
        55%  { opacity: 0.65; }
        100% { opacity: 0; }
    }

    // === Искры ===
    .neon_spark {
        position: absolute;
        top: 0;
        left: 0;
        border-radius: 50%;
        opacity: 0;
        transform: translate(var(--start-x), var(--start-y)) scale(1);
        animation:
            spark_move var(--duration) var(--delay) cubic-bezier(0.2, 0.7, 0.35, 1) forwards,
            spark_fade var(--duration) var(--delay) ease-out forwards;
        pointer-events: none;
        will-change: transform, opacity;

        &--small  { width: 5px;  height: 5px; }
        &--medium { width: 9px;  height: 9px; }
        &--large  { width: 14px; height: 14px; }

        &--color-cream {
            background: #FDFFE3;
            box-shadow:
                0 0 6px  2px #FDFFE3,
                0 0 12px 4px rgba(253, 255, 227, 0.55),
                0 0 22px 7px rgba(253, 255, 227, 0.3);
        }

        &--color-gold {
            background: #FFF5AD;
            box-shadow:
                0 0 6px  2px #FFF5AD,
                0 0 12px 4px rgba(255, 245, 173, 0.55),
                0 0 22px 7px rgba(255, 245, 173, 0.3);
        }
    }

    @keyframes spark_move {
        0% {
            transform: translate(var(--start-x), var(--start-y)) scale(1);
        }
        100% {
            transform:
                translate(
                    calc(var(--start-x) + var(--dx)),
                    calc(var(--start-y) + var(--dy))
                )
                scale(0.1);
        }
    }

    @keyframes spark_fade {
        0%   { opacity: 0; }
        8%   { opacity: 1; }
        25%  { opacity: 1; }
        100% { opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
        .flash_white,
        .neon_spark {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
        }
    }
</style>