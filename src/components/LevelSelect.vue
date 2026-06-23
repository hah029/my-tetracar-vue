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

            <aside class="selection_preview">
                <div class="preview_scene" :style="previewStyle">
                    <div class="preview_horizon"></div>
                    <div class="preview_road" :style="roadPreviewStyle">
                        <span class="preview_lane"></span>
                        <span class="preview_lane"></span>
                    </div>
                </div>

                <div class="preview_content">
                    <div>
                        <h2 class="preview_title">{{ selectedLevel.name }}</h2>
                        <p class="preview_description">{{ selectedLevel.description }}</p>
                    </div>

                    <div class="stat_grid">
                        <div class="stat_item">
                            <span class="stat_label">сцена</span>
                            <span class="stat_value">{{ selectedLevel.environment.scenery.scenerySets.join(" / ") }}</span>
                        </div>
                        <div class="stat_item">
                            <span class="stat_label">декор</span>
                            <span class="stat_value">{{ selectedLevel.environment.scenery.decorations.length }}</span>
                        </div>
                        <div class="stat_item">
                            <span class="stat_label">цель</span>
                            <span class="stat_value">{{ selectedDifficulty.gameplay.targetDistance }}м</span>
                        </div>
                        <div class="stat_item">
                            <span class="stat_label">препятствия</span>
                            <span class="stat_value">{{ obstaclePressure }}</span>
                        </div>
                    </div>

                    <div class="difficulty_summary">
                        <span class="difficulty_name">{{ selectedDifficulty.name }}</span>
                        <span class="difficulty_description">{{ selectedDifficulty.description }}</span>
                    </div>
                </div>
            </aside>

            <div class="actions">
                <button class="menu_btn action_btn" @click="goBack">назад</button>
                <button class="menu_btn action_btn primary" @click="startRace">старт</button>
            </div>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useGameState } from "@/store/gameState";
import { useLevelStore } from "@/store/levelStore";
import { GameStates } from "@/game/core/GameState";
import type { DifficultyId } from "@/levels/difficulties";
import type { LevelId } from "@/levels";

const gameStore = useGameState();
const levelStore = useLevelStore();

const selectedLevel = computed(() => levelStore.currentLevel);
const selectedDifficulty = computed(() => levelStore.currentDifficulty);

const previewStyle = computed(() => ({
    background: `linear-gradient(180deg, ${selectedLevel.value.visual.render.backgroundColor} 0%, ${selectedLevel.value.visual.render.fogColor} 100%)`,
    boxShadow: `0 0 28px ${selectedLevel.value.environment.road.laneColor}55`,
}));

const roadPreviewStyle = computed(() => ({
    background: selectedLevel.value.environment.road.color,
    borderColor: selectedLevel.value.environment.road.laneColor,
    "--lane-color": selectedLevel.value.environment.road.laneColor,
}));

const obstaclePressure = computed(() => {
    const value =
        selectedDifficulty.value.gameplay.obstacleSpawnChance *
        selectedLevel.value.interactive.obstacleDensity;

    if (value < 0.65) return "низкое";
    if (value < 1) return "среднее";
    return "высокое";
});

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
}

.level_select_panel {
    width: min(76rem, 88vw);
    display: grid;
    grid-template-columns: minmax(22rem, 1fr) minmax(22rem, 0.85fr);
    gap: 2rem;
    margin-top: 8rem;
    align-items: stretch;
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
    font-size: 1.25rem;
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
    font-size: 1rem;
}

.option_meta {
    margin-top: 0.35rem;
    font-size: 0.72rem;
    color: rgba(215, 251, 255, 0.72);
}

.selection_preview {
    min-height: 28rem;
    border: 1px solid rgba(215, 251, 255, 0.28);
    background: rgba(2, 7, 16, 0.58);
    overflow: hidden;
    display: grid;
    grid-template-rows: 11rem 1fr;
}

.preview_scene {
    position: relative;
    overflow: hidden;
}

.preview_horizon {
    position: absolute;
    left: 8%;
    right: 8%;
    bottom: 34%;
    height: 2px;
    background: rgba(255, 255, 255, 0.32);
}

.preview_road {
    position: absolute;
    left: 50%;
    bottom: -2rem;
    width: 10rem;
    height: 12rem;
    transform: translateX(-50%) perspective(9rem) rotateX(58deg);
    border-left: 2px solid;
    border-right: 2px solid;
    opacity: 0.76;
    display: flex;
    justify-content: space-evenly;
}

.preview_lane {
    width: 2px;
    height: 100%;
    background: var(--lane-color);
    box-shadow: 0 0 14px var(--lane-color);
}

.preview_content {
    padding: 1.2rem;
    display: grid;
    gap: 1rem;
    align-content: start;
}

.preview_title {
    margin: 0;
    color: #FDFFE3;
    font-family: "vla_shu";
    font-size: 1.45rem;
    font-weight: 400;
}

.preview_description {
    margin: 0.45rem 0 0;
    color: rgba(215, 251, 255, 0.76);
    font-family: "jost-regular";
    font-size: 0.88rem;
    line-height: 1.35;
}

.stat_grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
}

.stat_item {
    min-height: 3.4rem;
    padding: 0.65rem;
    border: 1px solid rgba(215, 251, 255, 0.16);
    background: rgba(255, 255, 255, 0.04);
    display: grid;
    align-content: center;
}

.stat_label,
.stat_value,
.difficulty_name,
.difficulty_description {
    display: block;
    overflow-wrap: anywhere;
}

.stat_label {
    color: rgba(215, 251, 255, 0.56);
    font-size: 0.68rem;
    font-family: "jost-regular";
}

.stat_value {
    margin-top: 0.2rem;
    color: #FDFFE3;
    font-size: 0.9rem;
    font-family: "jost-regular";
}

.difficulty_summary {
    border-top: 1px solid rgba(215, 251, 255, 0.18);
    padding-top: 0.9rem;
    font-family: "jost-regular";
}

.difficulty_name {
    color: #FFD95C;
    font-size: 1rem;
}

.difficulty_description {
    margin-top: 0.3rem;
    color: rgba(215, 251, 255, 0.7);
    font-size: 0.82rem;
    line-height: 1.3;
}

.actions {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 0.5rem;
}

.action_btn {
    font-size: 1.8rem;
}

.primary {
    color: #FFD95C;
}

@media (max-width: 720px) {
    .level_select_panel {
        width: min(92vw, 36rem);
        margin-top: 6.4rem;
        gap: 1.4rem;
        grid-template-columns: 1fr;
        max-height: calc(100vh - 8rem);
        overflow-y: auto;
        padding-bottom: 2rem;
    }

    .difficulty_grid {
        grid-template-columns: 1fr;
    }

    .option_btn {
        min-height: 4.5rem;
    }

    .selection_preview {
        min-height: 24rem;
        grid-template-rows: 8rem 1fr;
    }

    .stat_grid {
        grid-template-columns: 1fr;
    }
}
</style>
