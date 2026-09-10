<template>
    <div class="container fortune_wheel">
        <div class="header_block">
            <div class="header_text">{{ t("fortuneWheel.title") }}</div>
            <div class="header_image"><img class="image" src="@/assets/images/title_line_image.svg" /></div>
        </div>

        <section class="fortune_wheel__content">
            <label class="fortune_wheel__preset">
                {{ t("fortuneWheel.preset") }}
                <select :value="wheel.selectedPresetId" :disabled="wheel.isSpinning" @change="selectPreset">
                    <option v-for="preset in wheel.presets" :key="preset.id" :value="preset.id">
                        {{ t(preset.nameKey) }} ({{ meta.getFortuneSpins(preset.id) }})
                    </option>
                </select>
            </label>
            <p class="fortune_wheel__spins">{{ t("fortuneWheel.spins", { count: wheel.spins }) }}</p>

            <div class="wheel-stage">
                <div class="wheel-frame" aria-hidden="true"></div>
                <div class="wheel-pointer"></div>
                <div class="wheel" :class="{ 'wheel--spinning': wheel.isSpinning }" :style="wheelStyle">
                    <span v-for="(sector, index) in sectors" :key="sector.id" class="wheel__label"
                        :style="getLabelStyle(index)">{{ getSectorLabel(sector) }}</span>
                    <span class="wheel__hub"><i>✦</i></span>
                </div>
            </div>

            <p v-if="wheel.error" class="fortune_wheel__error">{{ t("fortuneWheel.error") }}</p>
            <button class="menu_btn fortune_wheel__spin" :disabled="!wheel.canSpin" @click="spin">
                {{ wheel.isSpinning ? t("fortuneWheel.spinning") : t("fortuneWheel.spin") }}
            </button>
        </section>

        <div v-if="wheel.wonSector" class="fortune_wheel__result" role="dialog" aria-modal="true">
            <p>{{ t("fortuneWheel.won") }}</p>
            <strong v-for="(reward, index) in wheel.wonSector.rewards" :key="index">{{ getRewardLabel(reward)
            }}</strong>
            <button class="menu_btn" @click="wheel.clearWonSector()">{{ t("fortuneWheel.continue") }}</button>
        </div>

        <button class="menu_btn fortune_wheel__back" :disabled="wheel.isSpinning" @click="gameState.closeOverlay()">
            {{ t("mainMenu.goBack") }}
        </button>
    </div>
</template>


<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import { useTranslation } from "i18next-vue";
import { FORTUNE_WHEEL_PRESETS, type FortuneWheelPresetId, type FortuneWheelSector } from "@/configs/fortuneWheel";
import { useFortuneWheelStore } from "@/store/fortuneWheelStore";
import { useMetaStore } from "@/store/metaStore";
import { useGameState } from "@/store/gameState";
import type { RewardDefinition } from "@/purchase/types";
import { SoundManager } from "@/game/sound/SoundManager";

const { t } = useTranslation();
const wheel = useFortuneWheelStore();
const gameState = useGameState();
const meta = useMetaStore();
const sectors = computed(() => wheel.sectors);
const sectorAngle = computed(() => 360 / sectors.value.length);

function selectPreset(event: Event) {
    wheel.selectPreset((event.target as HTMLSelectElement).value as FortuneWheelPresetId);
}
const rotation = ref(0);
let spinTimer: ReturnType<typeof setTimeout> | null = null;

const wheelStyle = computed(() => ({
    transform: `rotate(${rotation.value}deg)`,
    background: `conic-gradient(from ${-sectorAngle.value / 2}deg, ${sectors.value.map((sector, index) => `${sector.color} ${index * sectorAngle.value}deg ${(index + 1) * sectorAngle.value}deg`).join(", ")})`,
}));

function getLabelStyle(index: number) {
    const angle = index * sectorAngle.value;
    return { transform: `rotate(${angle}deg) translateY(-8.6rem) rotate(${-angle}deg)` };
};

function getRewardLabel(reward: RewardDefinition): string {
    const amount = reward.effect?.amount ?? 1;
    switch (reward.type) {
        case "currency": return `${amount} ${t(`currency.${reward.effect.currency}`)}`;
        case "ammo": return `${amount} ${t("dailyGift.ammo")}`;
        case "armor": return `${amount} ${t("dailyGift.armor")}`;
        case "fortune_spin": return `${amount} ${t("fortuneWheel.spinUnit")} (${t(FORTUNE_WHEEL_PRESETS[reward.effect.presetId].nameKey)})`;
        default: return t("dailyGift.reward");
    };
};

function getSectorLabel(sector: FortuneWheelSector) {
    return sector.rewards.map(getRewardLabel).join(" + ");
};

async function spin() {
    const sector = await wheel.beginSpin();
    if (!sector) {
        SoundManager.getInstance().playCue("actionRejected");
        return;
    };

    SoundManager.getInstance().playCue("uiSelect");
    const selectedIndex = sectors.value.findIndex((item) => item.id === sector.id);
    const targetModulo = -(selectedIndex * sectorAngle.value);
    const currentModulo = ((rotation.value % 360) + 360) % 360;
    const delta = ((targetModulo - currentModulo) % 360 + 360) % 360;
    rotation.value += 5 * 360 + delta;

    spinTimer = setTimeout(async () => {
        const granted = await wheel.completeSpin();
        SoundManager.getInstance().playCue(granted ? "goldenPickup" : "actionRejected");
    }, 4200);
};

onUnmounted(() => {
    if (spinTimer) clearTimeout(spinTimer);
});
</script>


<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/typography" as *;
@use "@/styles/colors" as *;

.fortune_wheel {
    --wheel-pink: #f2a7ff;
    justify-content: flex-start;
    isolation: isolate;
}

.fortune_wheel .header_block {
    position: absolute;
    top: clamp(2.25rem, 10vh, 5rem);
    margin: 0;

    .header_text {
        margin-bottom: 0.65rem;
        color: var(--wheel-pink);
        text-shadow: 0 0 0.45rem rgba(214, 139, 255, 0.9), 0 0 1.25rem rgba(128, 65, 218, 0.65);
    }

    .header_image {
        display: none;
    }
}

.fortune_wheel__content {
    position: absolute;
    top: clamp(7.2rem, 32vh, 20rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: none;
}

.fortune_wheel__preset {
    @include text-info-size-s;
    display: none;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.5rem;
    color: #e2b8ff;
    text-shadow: 0 0 0.6rem rgba(214, 139, 255, 0.7);

    select {
        max-width: 60vw;
        padding: 0.4rem;
        border: 1px solid rgba(227, 166, 255, 0.85);
        border-radius: 0.2rem;
        background: rgba(20, 13, 37, 0.88);
        color: #fff4ff;
        font: inherit;
        box-shadow: inset 0 0 0.8rem rgba(153, 75, 211, 0.2), 0 0 0.55rem rgba(193, 110, 255, 0.25);
    }
}

.fortune_wheel__spins,
.fortune_wheel__error {
    @include text-info-size-s;
    margin: 0;
    text-transform: uppercase;
}

.fortune_wheel__spins {
    color: #e4bbff;
    letter-spacing: 0.08em;
    text-shadow: 0 0 0.5rem rgba(214, 139, 255, 0.7);
}

.fortune_wheel__error {
    color: $color-red-light;
    margin-top: 0.8rem;
}

.wheel-stage {
    position: relative;
    width: min(46vw, 52vh, 24rem);
    aspect-ratio: 1;
    margin: 0.75rem 0 1rem;

    &::before {
        position: absolute;
        z-index: 0;
        inset: -0.55rem;
        content: "";
        border: 1px solid rgba(230, 168, 255, 0.52);
        border-radius: 50%;
        box-shadow: 0 0 0.7rem rgba(181, 82, 245, 0.35);
        pointer-events: none;
        scale: 102%;
    }
}

.wheel-frame {
    position: absolute;
    z-index: 1;
    top: 50%;
    left: 50%;
    width: calc(100% + 5rem);
    aspect-ratio: 1.1547;
    transform: translate(-50%, -50%);
    // background: linear-gradient(135deg, #f6c7ff, #9a47cc 46%, #f0aaff);
    clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
    filter: drop-shadow(0 0 0.45rem rgba(190, 95, 255, 0.55));
    pointer-events: none;

    &::before,
    &::after {
        position: absolute;
        inset: 1px;
        content: "";
        background: #0c0717;
        clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
    }

    &::after {
        inset: 0.38rem;
        // background: linear-gradient(135deg, rgba(240, 186, 255, 0.75), rgba(129, 57, 179, 0.8), rgba(232, 163, 255, 0.65));
    }

    &::before {
        z-index: 1;
        inset: 0.46rem;
    }
}

.wheel-pointer {
    position: absolute;
    z-index: 3;
    top: -0.7rem;
    left: 50%;
    width: 1.4rem;
    height: 1.35rem;
    border: 1px solid #f4c1ff;
    background: linear-gradient(145deg, #f3bbff 0%, #9e4fe1 45%, #43127d 100%);
    clip-path: polygon(0 0, 100% 0, 50% 100%);
    transform: translateX(-50%);
    filter: drop-shadow(0 0 0.25rem #fff2ff) drop-shadow(0 0 0.75rem rgba(207, 109, 255, 0.95));
}

.wheel {
    position: absolute;
    z-index: 2;
    inset: 0;
    overflow: hidden;
    border: 2px solid #e6a3ff;
    border-radius: 50%;
    transition: transform 4200ms cubic-bezier(0.12, 0.82, 0.14, 1);
    box-shadow: 0 0 0 0.18rem rgba(57, 26, 84, 0.92), 0 0 0 0.25rem rgba(226, 151, 255, 0.78), 0 0 1.25rem rgba(182, 74, 255, 0.78), inset 0 0 2.6rem rgba(5, 4, 14, 0.82);

    &::before {
        position: absolute;
        z-index: 1;
        inset: 0;
        content: "";
        border-radius: inherit;
        background: radial-gradient(circle, rgba(9, 5, 18, 0.08) 0 17%, rgba(8, 4, 16, 0.36) 58%, rgba(5, 2, 15, 0.7) 100%);
        box-shadow: inset 0 0 0 1px rgba(255, 222, 255, 0.23);
        pointer-events: none;
    }
}

.wheel__label {
    position: absolute;
    z-index: 2;
    top: 50%;
    left: 50%;
    width: 5.1rem;
    margin-left: -2.55rem;
    color: #fff9ff;
    font-family: $font-secondary;
    font-size: clamp(0.55rem, 1.2vw, 0.72rem);
    font-weight: 500;
    line-height: 1.15;
    text-align: center;
    text-shadow: 0 1px 0 #160b29, 0 0 0.35rem rgba(255, 235, 255, 0.5);
    pointer-events: none;
}

.wheel__hub {
    position: absolute;
    z-index: 3;
    top: 50%;
    left: 50%;
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border: 1px solid #f2b0ff;
    // border-radius: 50%;
    background: radial-gradient(circle, #261440 0%, #10091f 68%);
    color: #fcdbff;
    font-size: 1.55rem;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 0 0.17rem #150c26, 0 0 0 0.24rem rgba(223, 128, 255, 0.85), 0 0 1.05rem rgba(218, 111, 255, 0.9), inset 0 0 1.25rem rgba(181, 81, 255, 0.25);

    i {
        font-style: normal;
        text-shadow: 0 0 0.4rem #fff, 0 0 0.85rem #bf5fff;
    }
}

.fortune_wheel__spin {
    @include text-button-size-s;
    min-width: clamp(8.8rem, 17vw, 10.5rem);
    padding: 0.66rem 1.25rem 0.52rem;
    color: #ffe8ff;
    letter-spacing: 0.15em;
    border: 1px solid #edb4ff;
    background: linear-gradient(90deg, rgba(37, 14, 57, 0.94), rgba(79, 33, 112, 0.88), rgba(37, 14, 57, 0.94));
    clip-path: polygon(9% 0, 91% 0, 100% 26%, 100% 74%, 91% 100%, 9% 100%, 0 74%, 0 26%);
    filter: drop-shadow(0 0 0.65rem rgba(213, 123, 255, 0.7));
    text-shadow: 0 0 0.45rem rgba(255, 232, 255, 0.8);

    &:hover:not(:disabled) {
        color: white;
        background: linear-gradient(90deg, #542070, #8f42ba, #542070);
        filter: drop-shadow(0 0 0.95rem rgba(235, 161, 255, 0.95));
    }
}

.fortune_wheel__spin:disabled,
.fortune_wheel__back:disabled {
    opacity: 0.42;
    cursor: default;
}

.fortune_wheel__back {
    position: absolute;
    bottom: 5.556vh;
    color: #d8aaff;
}

.fortune_wheel__result {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    background: rgba(0, 0, 0, 0.68);
    color: $color-yellow-super-light;
}

.fortune_wheel__result p {
    @include text-button-size-m;
    margin: 0;
}

.fortune_wheel__result strong {
    @include text-info-size-l;
    color: $color-blue-light;
}

.fortune_wheel__result button {
    @include text-button-size-s;
    color: $color-yellow-super-light;
}


@media (max-width: 700px) {
    .fortune_wheel .header_block {
        top: 2rem;
    }

    .fortune_wheel__content {
        top: 7.5rem;
    }

    .wheel-stage {
        width: min(76vw, 47vh, 20rem);
    }

    .wheel-frame {
        width: calc(100% + 3.75rem);
    }

    .wheel__label {
        width: 3.8rem;
        margin-left: -1.9rem;
    }
}
</style>
