<template>
    <div class="container level_select">
        <section class="level_select_panel">
            <div class="select_column">
                <div class="select_group">
                    <h2 class="select_title">визуальный уровень</h2>
                    <div class="option_grid">
                        <button
                            v-for="level in levelStore.levels"
                            :key="level.id"
                            class="option_btn"
                            :class="{ active: levelStore.currentLevelId === level.id }"
                            @click="selectLevel(level.id)"
                        >
                            <span
                                class="option_swatch"
                                :style="{
                                    background: level.visual.render.backgroundColor,
                                    borderColor: level.environment.road.laneColor,
                                }"
                            />
                            <span class="option_text">
                                <span class="option_name">{{ level.name }}</span>
                                <span class="option_meta">{{ level.environment.scenery.scenerySets.join(" / ") }}</span>
                            </span>
                        </button>
                    </div>
                </div>

                <div class="select_group">
                    <h2 class="select_title">сложность</h2>
                    <div class="option_grid difficulty_grid">
                        <button
                            v-for="difficulty in levelStore.difficulties"
                            :key="difficulty.id"
                            class="option_btn"
                            :class="{ active: levelStore.currentDifficultyId === difficulty.id }"
                            @click="selectDifficulty(difficulty.id)"
                        >
                            <span class="option_name">{{ difficulty.name }}</span>
                            <span class="option_meta">
                                {{ difficulty.gameplay.startSpeed.toFixed(2) }} → {{ difficulty.gameplay.maxSpeed.toFixed(2) }}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="actions">
                <button class="menu_btn action_btn" @click="goBack">назад</button>
                <button class="menu_btn action_btn primary" @click="startRace">старт</button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { useGameState } from "@/store/gameState";
import { useLevelStore } from "@/store/levelStore";
import { GameStates } from "@/game/core/GameState";
import type { DifficultyId } from "@/levels/difficulties";
import type { LevelId } from "@/levels";

const gameStore = useGameState();
const levelStore = useLevelStore();

function selectLevel(id: string) {
    levelStore.selectLevel(id as LevelId);
}

function selectDifficulty(id: string) {
    levelStore.selectDifficulty(id as DifficultyId);
}

function goBack() {
    gameStore.setState(GameStates.Menu);
}

function startRace() {
    gameStore.confirmLevelSelection();
}
</script>

<style lang="scss" scoped>
@use "@/styles/menu.scss";

.level_select {
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(2px);
}

.level_select_panel {
    width: min(46rem, 92vw);
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

.select_column {
    display: grid;
    gap: 1.4rem;
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
}

.option_btn {
    min-height: 4.8rem;
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

.option_name,
.option_meta {
    display: block;
    overflow-wrap: anywhere;
}

.option_swatch {
    flex: 0 0 2.2rem;
    width: 2.2rem;
    height: 2.2rem;
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
    margin-top: 0.5rem;
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

    .difficulty_grid {
        grid-template-columns: 1fr;
    }

    .option_btn {
        min-height: 4.5rem;
    }

    .actions {
        gap: 1rem;
        flex-wrap: wrap;
    }
}
</style>
