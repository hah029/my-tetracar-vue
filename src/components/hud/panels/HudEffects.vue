<template>
    <div class="effects_container">
        <div v-for="effect in effectsList" :key="effect.id" class="effects_group"
            :class="getAnimationClass(effect.type)">
            <!-- ENERGON -->
            <div v-if="effect.type === 'addEnergon'" class="currency_image_container energon_glow_general">
                <img class="icon icon_abs" src="@/assets/images/hud/cube_energon_grid_backward.svg" />
                <img class="icon icon_abs energon_glow_core" src="@/assets/images/hud/cube_energon_core.svg" />
                <img class="icon icon_abs energon_glow_grid" src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
            </div>

            <!-- BOOSTERS -->
            <img v-else-if="effect.type === 'addBullet'" class="icon" src="@/assets/images/hud/cube_bullet.svg" />

            <img v-else-if="effect.type === 'addArmor'" class="icon" src="@/assets/images/hud/cube_armor.svg" />

            <img v-else-if="effect.type === 'addNitro'" class="icon" src="@/assets/images/hud/cube_nitro.svg" />

            <img v-else-if="effect.type === 'addMagnet'" class="icon" src="@/assets/images/hud/cube_magnet.svg" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { usePlayerStore } from "@/store/playerStore";

interface EffectItem {
    id: number;
    type: string;
}

const playerStore = usePlayerStore();

const effectsList = ref<EffectItem[]>([]);
const nextId = ref(0);

watch(
    () => playerStore.eventCounter,
    () => {
        const effectType = playerStore.eventType;

        if (!effectType) {
            return;
        }

        const effect: EffectItem = {
            id: nextId.value++,
            type: effectType,
        };

        effectsList.value.push(effect);

        const duration =
            effectType === "addEnergon"
                ? 1800
                : 600;

        setTimeout(() => {
            const index = effectsList.value.findIndex(
                item => item.id === effect.id
            );

            if (index !== -1) {
                effectsList.value.splice(index, 1);
            }
        }, duration);
    }
);

function getAnimationClass(type: string) {
    const animationMap: Record<string, string> = {
        addEnergon: "energon_moving",
        addBullet: "bullet_moving",
        addArmor: "armor_moving",
        addNitro: "nitro_moving",
        addMagnet: "magnet_moving",
    };

    return animationMap[type] ?? "";
}
</script>

<style scoped lang="scss">
@use "@/styles/menu.scss" as *;

.effects_container {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: z("ui_component") + 1;
}

.effects_group {
    --effect-start-x: 50%;
    --effect-start-y: clamp(5rem, 18vmin, 13.125rem);
    --effect-end-y: clamp(0.25rem, 1vmin, 0.5rem);
    position: absolute;
    width: clamp(1.75rem, 5vmin, 2.813rem);
    height: clamp(1.75rem, 5vmin, 2.813rem);

    bottom: var(--effect-start-y);
    left: var(--effect-start-x);
    transform: translateX(-50%);
}

.icon {
    width: 100%;
}

.icon_abs {
    position: absolute;
    top: 0;
    left: 0;
}

.currency_image_container {
    width: 100%;
    height: 100%;
    position: relative;
}

.energon_glow_general {
    filter: drop-shadow(0 0 0.44rem rgb(43, 157, 229));
}

.energon_glow_grid {
    filter: drop-shadow(0 0 1.25rem rgb(20, 212, 255));
}

.energon_glow_core {
    filter: drop-shadow(0 0 0.625rem rgb(20, 212, 255));
}

/* ENERGON */

.energon_moving {
    animation: energonMovingAnim 2.1s cubic-bezier(0.41, 0, 0.04, 0.99) forwards;
}

@keyframes energonMovingAnim {
    0% {
        bottom: var(--effect-start-y);
        left: var(--effect-start-x);
    }

    100% {
        bottom: calc(100% - clamp(4rem, 9vmin, 6.25rem));
        left: calc(100% - clamp(2rem, 6vmin, 4rem));
    }
}

/* BULLET */

.bullet_moving {
    animation: bulletMovingAnim 0.6s cubic-bezier(0.42, 0, 1, 1) forwards;
}

@keyframes bulletMovingAnim {
    0% {
        bottom: var(--effect-start-y);
        left: var(--effect-start-x);
    }

    100% {
        bottom: var(--effect-end-y);
        left: calc(50% - clamp(9rem, 18vw, 19rem));
    }
}

/* ARMOR */

.armor_moving {
    animation: armorMovingAnim 0.6s cubic-bezier(0.42, 0, 1, 1) forwards;
}

@keyframes armorMovingAnim {
    0% {
        bottom: var(--effect-start-y);
        left: var(--effect-start-x);
    }

    100% {
        bottom: var(--effect-end-y);
        left: calc(50% - clamp(3rem, 6vw, 6.5rem));
    }
}

/* NITRO */

.nitro_moving {
    animation: nitroMovingAnim 0.6s cubic-bezier(0.42, 0, 1, 1) forwards;
}

@keyframes nitroMovingAnim {
    0% {
        bottom: var(--effect-start-y);
        left: var(--effect-start-x);
    }

    100% {
        bottom: var(--effect-end-y);
        left: calc(50% + clamp(3rem, 6vw, 6.5rem));
    }
}

/* MAGNET */

.magnet_moving {
    animation: magnetMovingAnim 0.6s cubic-bezier(0.42, 0, 1, 1) forwards;
}

@keyframes magnetMovingAnim {
    0% {
        bottom: var(--effect-start-y);
        left: var(--effect-start-x);
    }

    100% {
        bottom: var(--effect-end-y);
        left: calc(50% + clamp(9rem, 18vw, 19rem));
    }
}

@media (max-width: 460px), (max-height: 520px) {
    .effects_group {
        --effect-start-y: clamp(4rem, 15vmin, 5rem);
    }
}
</style>
