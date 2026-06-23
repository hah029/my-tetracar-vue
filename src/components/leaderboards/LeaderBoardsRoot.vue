<template>
    <!-- <div class="container correction"> -->
    <div class="container">
        <div class="leaderboards_container">

            <!-- HEADER -->
            <Transition :name="gameState.currentState == 'menu' ? 'header_footer_block_anim' : ''">
                <div v-if="isHeaderShown" class="header_block">
                    <div class="header_text" :class="setHeaderSize()">{{ dynamicTitleName }}</div>
                    <div class="header_image">
                        <img class="image" src="@/assets/images/title_line_image.svg" />
                    </div>

                    <div class="tabs">
                        <div class="menu_btn btn_font_size_26" @click="currentView = SettingsView.MyLeaderBoard">{{
                            foo.makeText("leaderboards.tabList.myBoard",
                                'leftLine') }}</div>
                        <div class="cube_divider">
                            <img class="image" src="@/assets/images/cube_divider.svg" />
                        </div>
                        <div class="menu_btn btn_font_size_26" @click="currentView = SettingsView.CommonLeaderBoard">{{
                            foo.makeText("leaderboards.tabList.topBoard",
                                'rightLine') }}</div>
                    </div>

                </div>
            </Transition>

            <!-- CONTENT -->
            <div class="records_container">
                <div class="leaderboard_table">
                    <div class="leaderboard_row leaderboard_row--head">
                        <span>#</span>
                        <span>{{ foo.makeText("leaderboards.table.player", "Player") }}</span>
                        <span>{{ foo.makeText("leaderboards.table.score", "Score") }}</span>
                    </div>

                    <TransitionGroup name="buttons_group_showing" tag="div" class="leaderboard_body">
                        <div v-for="(record, index) in leaderBoard" :key="record.player.uniqueId ?? record.rank"
                            class="leaderboard_row" :style="{ animationDelay: `${index * 0.06}s` }">
                            <span class="leaderboard_rank">{{ record.rank }}</span>
                            <span class="leaderboard_name">{{ record.player.publicName || "Player" }}</span>
                            <span class="leaderboard_score">{{ formatScore(record.score) }}</span>
                        </div>
                    </TransitionGroup>
                </div>
            </div>

        </div>


        <!-- BACK -->
        <Transition name="header_footer_block_anim">
            <button v-if="isBackButtonShown" class="menu_btn btn_font_size_30" @click="backButtonClick">
                {{ foo.makeText("mainMenu.goBack") }}
            </button>


        </Transition>
    </div>
</template>


<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { createNewText } from '@/helpers/functions';
import { useGameState } from "@/store/gameState";

import { Platform } from "@/sdk/Platform";
import type { LeaderBoard, LeaderBoardRecord } from "@/sdk/types/Leaderboard";
// import type { LeaderBoard, LeaderBoardRecord } from "@/sdk/IGamePlatform";

enum SettingsView {
    MyLeaderBoard,
    CommonLeaderBoard,
    null,
}

// ===== STORES =====
const gameState = useGameState();

// ===== LOCAL STATE =====
// const currentView = ref<SettingsView>(SettingsView.Main);
const currentView = ref<SettingsView>(SettingsView.MyLeaderBoard);

const isHeaderShown = ref(false);
const isBackButtonShown = ref(false);

// ===== TEXT =====
const foo = createNewText();

// ===== TITLE =====
const dynamicTitleName = computed(() => {
    return foo.makeText("leaderboards.title", "empty");
});
const myLeaderBoard = ref<LeaderBoardRecord[]>([])
const commonLeaderBoard = ref<LeaderBoardRecord[]>([])

const leaderBoard = computed(() => {
    switch (currentView.value) {
        case SettingsView.MyLeaderBoard:
            console.log("set myLeaderBoard")
            return myLeaderBoard.value;
        case SettingsView.CommonLeaderBoard:
            console.log("set commonLeaderBoard")
            return commonLeaderBoard.value;
        default:
            return myLeaderBoard.value;
    }
})

function formatScore(score: number) {
    return Math.floor(score).toLocaleString("ru-RU");
}

// ===== BACK =====
function backButtonClick() {
    if (gameState.currentState == 'menu') {
        isHeaderShown.value = false;
    };
    setTimeout(() => {
        currentView.value = SettingsView.null;
    }, 100);
    setTimeout(() => {
        isBackButtonShown.value = false;
    }, 400);

    setTimeout(() => {
        gameState.closeOverlay();
    }, 500);
};

// function setContainerPos() {
//     if (gameState.currentState == 'menu') {
//         return 'container_pos_main_menu';
//     } else if (gameState.currentState == 'pause') {
//         return 'container_pos_pause';
//     };
// };
function setHeaderSize() {
    if (gameState.currentState == 'pause') {
        return 'header_pause';
    };
};

async function loadLeaderboards() {
    const platform = Platform.getInstance();
    const [myBoard, commonBoard] = await Promise.all([
        platform.getLeaderboardEntries("debugLeaderboard1", 5, true, 1),
        platform.getLeaderboardEntries("debugLeaderboard1", 5, false, 1),
    ]);

    myLeaderBoard.value = myBoard.entries;
    commonLeaderBoard.value = commonBoard.entries;
}

onMounted(() => {
    loadLeaderboards();

    isHeaderShown.value = true;
    setTimeout(() => {
        currentView.value = SettingsView.MyLeaderBoard;
    }, 200);
    setTimeout(() => {
        isBackButtonShown.value = true;
    }, 500);
});
</script>


<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";

.tabs {
    position: relative;
    width: min(34.625rem, calc(100vw - 2rem));
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: clamp(0.5rem, 2vmin, 1.2rem);
    margin-top: 0.75rem;
    line-height: 1;
}

.cube_divider {
    width: min(0.9375rem, 90vw);
    display: flex;
    align-items: center;
}

.container_pos_main_menu {
    justify-content: flex-end !important;
}

.container_pos_pause {
    justify-content: flex-start !important;
    top: 19.75rem !important;
}

.header_pause {
    font-size: 3.125rem; // (50px)
}

.leaderboards_container {
    position: relative;
    width: min(56rem, 100%);
    min-height: 0;

    display: flex;
    flex-direction: column;
    align-items: center;

    gap: 1.5rem;

    box-sizing: border-box;
}

.group_correction {
    top: 10rem;

    &>*+* {
        margin-top: 0.938rem; // 15px - row-gap (между кнопками)

    }
}

.btn_font_size_30 {
    font-size: clamp(1.1rem, 2.4vmin, 1.875rem);
    cursor: default;
    position: fixed;
    bottom: 2rem;
}

.btn_font_size_26 {
    font-size: clamp(0.95rem, 2vmin, 1.625rem);
}


.records_container {
    width: min(42rem, 100vw - 2rem);
    min-height: 0;
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: #575757 transparent;

    font-family: "jost-light";
}

.leaderboard_table {
    min-width: 28rem;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(9, 14, 24, 0.46);
    box-shadow: inset 0 0 2rem rgba(114, 179, 238, 0.04);
}

.leaderboard_body {
    display: block;
}

.leaderboard_row {
    width: 100%;

    display: grid;
    grid-template-columns: minmax(3.5rem, 0.35fr) minmax(10rem, 1fr) minmax(6rem, 0.55fr);
    align-items: center;
    column-gap: clamp(0.5rem, 2vmin, 1rem);

    padding: clamp(0.55rem, 1.4vmin, 0.85rem) clamp(0.75rem, 2vmin, 1.2rem);
    box-sizing: border-box;

    font-size: clamp(0.9rem, 1.8vmin, 1.2rem);
    line-height: 1.2;
    text-transform: uppercase;

    color: #FDFFE3;
}

.leaderboard_row--head {
    position: sticky;
    top: 0;
    z-index: 1;
    color: #72B3EE;
    background: rgba(12, 23, 36, 0.92);
    border-bottom: 1px solid rgba(255, 255, 255, 0.14);
    font-size: clamp(0.76rem, 1.4vmin, 0.92rem);
    letter-spacing: 0;
}

.leaderboard_row:nth-child(odd) {
    background: rgba(255, 255, 255, 0.04);
}

.leaderboard_row:not(.leaderboard_row--head) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.leaderboard_name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.leaderboard_rank {
    color: #FFD95C;
}

.leaderboard_score {
    justify-self: end;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
    color: #5effb1;
}

.container {
    justify-content: center !important;
    background-color: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(2px);
}

@media (max-width: 520px) {
    .leaderboards_container {
        gap: 1rem;
    }

    .records_container {
        width: calc(100vw - 5rem);
    }

    .leaderboard_table {
        min-width: 24rem;
    }

    .leaderboard_row {
        grid-template-columns: 3rem minmax(8rem, 1fr) minmax(5.5rem, auto);
        padding: 0.55rem 0.65rem;
    }
}
</style>
