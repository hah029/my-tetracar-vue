<template>
    <div class="container level_select">
        <section class="level_select_panel">
            <div class="select_columns">
                <div class="select_group">
                    <h2 class="select_title">{{ $t("levelMenu.levelSelect.label") }}</h2>
                    <div class="option_grid">
                        <button v-for="level in levelStore.levels" :key="level.id" class="option_btn" :class="{
                            active: levelStore.currentLevelId === level.id,
                            unavailable: !level.enabled,
                        }" :disabled="!level.enabled" @click="selectLevel(level.id)">
                            <span class="option_swatch" :style="{
                                background: level.visual.render.backgroundColor,
                                borderColor: level.environment.road.laneColor,
                            }" />
                            <span class="option_text">
                                <span class="option_name">{{ $t(`levelMenu.levelSelect.variants.${level.id}`) }}</span>
                                <!-- <span class="option_meta">{{ level.environment.scenery.scenerySets.join(" / ") }}</span> -->
                            </span>
                            <span v-if="!level.enabled" class="option_status">{{ $t("levelMenu.soon") }}</span>
                        </button>
                    </div>
                </div>

                <div class="select_group">
                    <h2 class="select_title">{{ $t("levelMenu.difficultySelect.label") }}</h2>
                    <div class="option_grid difficulty_grid">
                        <button v-for="difficulty in levelStore.availableDifficulties" :key="difficulty.id"
                            class="option_btn" :class="{ active: levelStore.currentDifficultyId === difficulty.id }"
                            @click="selectDifficulty(difficulty.id)">
                            <span class="option_name">{{ $t(`levelMenu.difficultySelect.variants.${difficulty.id}`)
                            }}</span>
                        </button>
                    </div>
                </div>
            </div>

        </section>
        <div class="actions">
            <button class="menu_btn btn_correction" @click="goBack">назад</button>
            <button class="menu_btn btn_correction primary" @click="startRace">старт</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useGameState } from "@/store/gameState";
import { useLevelStore } from "@/store/levelStore";
import { GameStates } from "@/game/core/GameState";
import type { DifficultyId } from "@/levels/difficulties";
import type { LevelId } from "@/levels";
import { SoundManager } from "@/game/sound/SoundManager";

const gameStore = useGameState();
const levelStore = useLevelStore();
const soundManager = SoundManager.getInstance();

function selectLevel(id: string) {
    soundManager.playCue("uiSelect");
    levelStore.selectLevel(id as LevelId);
}

function selectDifficulty(id: string) {
    soundManager.playCue("uiSelect");
    levelStore.selectDifficulty(id as DifficultyId);
}

function goBack() {
    soundManager.playCue("uiSelect");
    gameStore.setState(GameStates.Menu);
}

function startRace() {
    soundManager.playCue("uiSelect");
    gameStore.confirmLevelSelection();
}
</script>

<style lang="scss" scoped>
@use "@/styles/menu.scss";
@use "@/styles/typography" as *;
@use "@/styles/colors" as *;

.btn_correction {
    @include text-button-size-s;
    color: $color-yellow-super-light;
}

.level_select {
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(2px);
}

.level_select_panel {
    width: min(68rem, 92vw);
    max-height: calc(100vh - clamp(7rem, 14vmin, 9rem));
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: clamp(1.2rem, 3vmin, 2rem);
    margin-top: clamp(5rem, 12vmin, 8rem);
    padding: 0 clamp(0.35rem, 1vmin, 0.65rem) 0.25rem 0;
    align-items: start;
    overflow-y: auto;
    overflow-x: hidden;
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: #575757 transparent;
}

.level_select_panel::-webkit-scrollbar {
    width: 0.45rem;
}

.level_select_panel::-webkit-scrollbar-track {
    background: transparent;
}

.level_select_panel::-webkit-scrollbar-thumb {
    background: rgba(87, 87, 87, 0.86);
}

.level_select_panel::-webkit-scrollbar-thumb:hover {
    background: rgba(114, 179, 238, 0.82);
}

.select_columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 1.4rem;
    align-items: start;
}

.select_group {
    display: grid;
    gap: 0.85rem;
}

.select_title {
    margin: 0;
    font-family: "vla_shu";
    font-size: clamp(1rem, 2vmin, 1.25rem);
    color: #72B3EE;
    text-align: center;
    font-weight: 400;
    filter: drop-shadow(0 0 14px rgba(121, 190, 255, 0.75));
}

.option_grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
}

.difficulty_grid {
    grid-template-columns: 1fr;
}

.option_btn {
    min-height: 4.0rem;
    padding: 0.85rem 1rem;
    border: 1px solid rgba(215, 251, 255, 0.28);
    background: rgba(2, 7, 16, 0.56);
    color: #FDFFE3;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.85rem;
    text-align: left;
    font-family: "jost-regular";
    transition: border-color 0.12s ease, background 0.12s ease, filter 0.12s ease;
}

.option_btn:hover,
.option_btn.active {
    border-color: rgba(114, 179, 238, 0.95);
    background: rgba(10, 25, 44, 0.76);
    filter: drop-shadow(0 0 14px rgba(121, 190, 255, 0.55));
}

.option_btn.unavailable {
    cursor: not-allowed;
    opacity: 0.5;
    filter: grayscale(0.75);
}

.option_btn.unavailable:hover {
    border-color: rgba(215, 251, 255, 0.28);
    background: rgba(2, 7, 16, 0.56);
    filter: grayscale(0.75);
}

.option_name,
.option_meta {
    display: block;
    overflow-wrap: anywhere;
    align-items: center;
    text-transform: capitalize;
}

.option_status {
    margin-left: auto;
    padding: 0.2rem 0.45rem;
    border: 1px solid rgba(255, 217, 92, 0.72);
    color: #FFD95C;
    font-size: clamp(0.68rem, 1.2vmin, 0.78rem);
    text-transform: uppercase;
}

.option_swatch {
    flex: 0 0 1.6rem;
    width: 1.6rem;
    height: 1.6rem;
    border: 2px solid rgba(215, 251, 255, 0.75);
    box-shadow: inset 0 0 16px rgba(255, 255, 255, 0.18);
}

.option_text {
    min-width: 0;
}

.option_name {
    font-size: clamp(0.9rem, 1.6vmin, 1rem);
}

.option_meta {
    margin-top: 0.35rem;
    font-size: clamp(0.68rem, 1.25vmin, 0.78rem);
    color: rgba(215, 251, 255, 0.72);
}

.actions {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin: 1rem;
}

.action_btn {
    font-size: clamp(1.25rem, 2.8vmin, 1.8rem);
}

.primary {
    color: #FFD95C;
}

@media (max-width: 720px) {
    .level_select_panel {
        width: min(92vw, 36rem);
        margin-top: 6.4rem;
        gap: 1.4rem;
        max-height: calc(100vh - 8rem);
        padding-bottom: 2rem;
    }

    .select_columns {
        grid-template-columns: 1fr;
    }

    .option_btn {
        min-height: 4.0rem;
    }

    .actions {
        gap: 1rem;
        flex-wrap: wrap;
    }
}
</style>
