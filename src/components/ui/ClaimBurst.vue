<template>
    <div class="claim_burst" aria-hidden="true">
        <!-- Центральная вспышка -->
        <span class="burst_flash"></span>

        <!-- Расходящиеся кольца (shockwave) -->
        <span class="burst_ring burst_ring--1"></span>
        <span class="burst_ring burst_ring--2"></span>
        <span class="burst_ring burst_ring--3"></span>

        <!-- Частицы (искры) -->
        <span
            v-for="spark in sparks"
            :key="spark.id"
            class="burst_spark"
            :class="`burst_spark--${spark.size}`"
            :style="getSparkStyle(spark)"
        ></span>
    </div>
</template>


<script setup lang="ts">
    import { onMounted, ref } from "vue";

    interface Spark {
        id: number;
        size: "small" | "medium" | "large";
        angle: number;      // radians
        distance: number;   // % от центра
        duration: number;   // seconds
        delay: number;      // seconds
        hue: number;        // оттенок искры
    };

    const emit = defineEmits<{ (e: "complete"): void }>();

    const sparks = ref<Spark[]>([]);
    let idCounter = 0;

    const TOTAL_SPARKS = 28;
    const TOTAL_DURATION_MS = 900;

    function generateSparks() {
        const list: Spark[] = [];
        for (let i = 0; i < TOTAL_SPARKS; i++) {
            // равномерно по кругу + лёгкий «шум», чтобы не выглядело механически
            const baseAngle = (i / TOTAL_SPARKS) * Math.PI * 2;
            const angle = baseAngle + (Math.random() - 0.5) * 0.35;

            const roll = Math.random();
            const size: Spark["size"] = roll < 0.55 ? "small" : roll < 0.9 ? "medium" : "large";

            list.push({
                id: idCounter++,
                size,
                angle,
                distance: 80 + Math.random() * 120,
                duration: 0.55 + Math.random() * 0.35,
                delay: Math.random() * 0.12,
                hue: 40 + Math.random() * 20,   // тёплое золото
            });
        };
        sparks.value = list;
    };

    function getSparkStyle(spark: Spark) {
        const endX = Math.cos(spark.angle) * spark.distance;
        const endY = Math.sin(spark.angle) * spark.distance;

        return {
            "--end-x": `${endX}%`,
            "--end-y": `${endY}%`,
            "--duration": `${spark.duration}s`,
            "--delay": `${spark.delay}s`,
            "--spark-hue": `${spark.hue}`,
        };
    };

    onMounted(() => {
        generateSparks();
        setTimeout(() => emit("complete"), TOTAL_DURATION_MS);
    });
</script>


<style scoped lang="scss">
    .claim_burst {
        position: absolute;
        inset: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: none;    // не мешает кликам
        overflow: visible;       // частицы улетают за границы карточки
        z-index: 10;
    }

    // === Центральная вспышка ===
    .burst_flash {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 40px;
        height: 40px;
        margin: -20px 0 0 -20px;
        border-radius: 50%;
        background: radial-gradient(
            circle,
            rgba(255, 255, 255, 1)    0%,
            rgba(255, 245, 190, 0.9) 30%,
            rgba(255, 210, 120, 0.35) 60%,
            rgba(255, 210, 120, 0)   100%
        );
        filter: blur(2px);
        transform: scale(0);
        opacity: 0;
        animation: flash_pop 0.5s cubic-bezier(0.15, 0.8, 0.3, 1) forwards;
        will-change: transform, opacity;
    }

    @keyframes flash_pop {
        0%   { transform: scale(0);   opacity: 0; }
        20%  { transform: scale(3.5); opacity: 1; }
        100% { transform: scale(6);   opacity: 0; }
    }

    // === Кольца (shockwave) ===
    .burst_ring {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border-radius: 50%;
        border: 2px solid rgba(255, 240, 180, 0.9);
        transform: scale(0);
        opacity: 0;
        animation: ring_expand 0.7s cubic-bezier(0.2, 0.7, 0.3, 1) forwards;
        will-change: transform, opacity;

        &--1 { animation-delay: 0s;    border-color: rgba(255, 240, 180, 0.95); }
        &--2 { animation-delay: 0.08s; border-color: rgba(255, 210, 120, 0.8); }
        &--3 { animation-delay: 0.16s; border-color: rgba(255, 180, 80, 0.65); }
    }

    @keyframes ring_expand {
        0%   { transform: scale(0);  opacity: 0; }
        15%  { transform: scale(1);  opacity: 1; }
        100% { transform: scale(18); opacity: 0; }
    }

    // === Частицы (искры) ===
    .burst_spark {
        position: absolute;
        top: 50%;
        left: 50%;
        border-radius: 50%;
        background: hsl(var(--spark-hue), 100%, 78%);
        box-shadow:
            0 0 6px 2px hsla(var(--spark-hue), 100%, 65%, 0.85),
            0 0 14px 4px hsla(var(--spark-hue), 100%, 55%, 0.45);
        transform: translate(-50%, -50%) scale(1);
        opacity: 0;
        animation: spark_fly var(--duration) cubic-bezier(0.15, 0.6, 0.35, 1) var(--delay) forwards;
        will-change: transform, opacity;

        &--small  { width: 4px;  height: 4px; }
        &--medium { width: 7px;  height: 7px; }
        &--large  { width: 11px; height: 11px; }
    }

    @keyframes spark_fly {
        0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
        15%  { opacity: 1; }
        60%  { opacity: 1; }
        100% {
            transform:
                translate(calc(-50% + var(--end-x)), calc(-50% + var(--end-y)))
                scale(0.4);
            opacity: 0;
        }
    }

    // Мягко отключаем для пользователей с reduced motion
    @media (prefers-reduced-motion: reduce) {
        .burst_flash,
        .burst_ring,
        .burst_spark {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
        }
    }
</style>