<template>
    <div class="flying_rewards_root" aria-hidden="true">
        <div
            v-for="sprite in flyingStore.sprites"
            :key="sprite.id"
            class="flying_sprite"
            :class="`flying_sprite--${sprite.type}`"
            :style="getSpriteStyle(sprite)"
        >
            <div class="flying_sprite__inner">
                <img v-if="sprite.type === 'golden'" class="flying_sprite__icon" src="@/assets/images/hud/cube_golden.svg"/>

                <div v-else class="energon_stack">
                    <img class="flying_sprite__icon flying_sprite__icon--abs" src="@/assets/images/hud/cube_energon_grid_backward.svg"/>
                    <img class="flying_sprite__icon flying_sprite__icon--abs energon_glow_core" src="@/assets/images/hud/cube_energon_core.svg"/>
                    <img class="flying_sprite__icon flying_sprite__icon--abs energon_glow_grid" src="@/assets/images/hud/cube_energon_grid_frontal.svg"/>
                </div>
            </div>
        </div>
    </div>
</template>


<script setup lang="ts">
    import { useFlyingRewardsStore, type FlyingSprite } from "@/store/flyingRewardsStore";

    const flyingStore = useFlyingRewardsStore();

    function getSpriteStyle(sprite: FlyingSprite) {
        return {
            "--start-x": `${sprite.startX}px`,
            "--start-y": `${sprite.startY}px`,
            "--end-x": `${sprite.endX}px`,
            "--end-y": `${sprite.endY}px`,
            "--sprite-size": `${sprite.size}px`,
            "--duration": `${sprite.duration}ms`,
            "--delay": `${sprite.delay}ms`,
        };
    };
</script>


<style scoped lang="scss">
    .flying_rewards_root {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 10001;   // выше всех оверлеев и модалок
        overflow: visible;
    }

    .flying_sprite {
        position: absolute;
        top: 0;
        left: 0;
        width: var(--sprite-size);
        height: var(--sprite-size);
        opacity: 0;

        // fill-mode: both — применяет "from"-кадр во время delay
        // и удерживает "to"-кадр после завершения.
        // Без этого спрайт стоял бы в top: 0 / left: 0 пока ждёт своей очереди.
        animation:
            fly_x var(--duration) var(--delay) cubic-bezier(0.33, 1, 0.68, 1) both,
            fly_y var(--duration) var(--delay) cubic-bezier(0.45, 0.05, 0.55, 0.95) both,
            fly_fade var(--duration) var(--delay) ease-out both;
        will-change: transform, translate, opacity;
    }

    @keyframes fly_fade {
        0%   { opacity: 0; }
        6%   { opacity: 1; }
        85%  { opacity: 1; }
        100% { opacity: 0; }
    }

    .flying_sprite__inner {
        width: 100%;
        height: 100%;
        position: relative;
        filter: drop-shadow(0 0 10px rgba(255, 245, 173, 0.75));
    }

    .flying_sprite--energon .flying_sprite__inner {
        filter: drop-shadow(0 0 10px rgba(20, 212, 255, 0.75));
    }

    .flying_sprite__icon {
        width: 100%;
        height: 100%;
        display: block;
    }

    .flying_sprite__icon--abs {
        position: absolute;
        top: 0;
        left: 0;
    }

    .energon_stack {
        width: 100%;
        height: 100%;
        position: relative;
    }

    .energon_glow_core {
        filter: drop-shadow(0 0 6px rgb(20, 212, 255));
    }

    .energon_glow_grid {
        filter: drop-shadow(0 0 12px rgb(20, 212, 255));
    }

    @keyframes fly_x {
        from { transform: translateX(var(--start-x)); }
        to   { transform: translateX(var(--end-x)); }
    }

    @keyframes fly_y {
        from { translate: 0 var(--start-y); }
        to   { translate: 0 var(--end-y); }
    }

    @media (prefers-reduced-motion: reduce) {
        .flying_sprite {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
        }
    }
</style>