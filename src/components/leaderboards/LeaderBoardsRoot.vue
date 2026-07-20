<template>
    <div class="container">
        <div class="leaderbords_container container_correction_menu">
            <!-- HEADER -->
            <Transition :name="gameState.currentState == 'menu' ? 'header_footer_block_anim' : ''">
                <div v-if="isHeaderShown" class="header_block">
                    <div class="header_text">{{ dynamicTitleName }}</div>
                    <div class="header_image">
                        <img class="image" src="@/assets/images/title_line_image.svg" />
                    </div>

                    <div class="tabs">
                        <div class="tab-left">
                            <div class="menu_btn btn_tab_correction" :class="setTabStyle(0)" @click="currentView = LeaderboardsView.MyLeaderBoard">
                                {{ foo.makeText("leaderboards.tabList.myBoard", 'leftLine') }}
                            </div>
                        </div>
                        <div class="cube_divider">
                            <img class="image" src="@/assets/images/cube_divider.svg" />
                        </div>
                        <div class="tab-right">
                            <div class="menu_btn btn_tab_correction" :class="setTabStyle(1)" @click="currentView = LeaderboardsView.CommonLeaderBoard">
                                {{ foo.makeText("leaderboards.tabList.topBoard", 'rightLine') }}
                            </div>
                        </div>
                    </div>

                </div>
            </Transition>

            <!-- CONTENT -->
            <TransitionGroup name="buttons_group_showing" tag="div" class="leaderboard_table">
                <div v-for="(record, index) in leaderBoard" :key="record.player.uniqueId ?? record.rank"
                    class="leaderboard_row_first" 
                    :style="{ animationDelay: `${index * 0.06}s` }"
                >
                    <span class="player_rank">{{ record.rank }}</span>

                    <div class="leaderboard_row_second">
                        <div class="leaderboard_row_third">
                            <div class="player_avatar_img_container">
                                <img class="img" :src="(record.player as any).getAvatarSrc" />
                            </div>
                            <span class="player_name">{{ record.player.publicName || "Player" }}</span>
                        </div>
                        <span class="player_score">{{ formatScore(record.score) }}</span>
                    </div>

                </div>
            </TransitionGroup>
        </div>

        <!-- BACK -->
        <Transition name="header_footer_block_anim">
            <button v-if="isBackButtonShown" class="menu_btn btn_correction back_button_menu" @click="backButtonClick">
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
    import type { LeaderBoardRecord } from "@/sdk/types/Leaderboard";
    // import type { LeaderBoard, LeaderBoardRecord } from "@/sdk/IGamePlatform";

    enum LeaderboardsView {
        MyLeaderBoard,
        CommonLeaderBoard,
        null,
    }

    // ===== STORES =====
    const gameState = useGameState();

    // ===== LOCAL STATE =====
    // const currentView = ref<LeaderboardsView>(LeaderboardsView.Main);
    const currentView = ref<LeaderboardsView>(LeaderboardsView.MyLeaderBoard);

    const isHeaderShown = ref(false);
    const isBackButtonShown = ref(false);
    const foo = createNewText();

    // ===== TITLE =====
    const dynamicTitleName = computed(() => {
        return foo.makeText("leaderboards.title", "empty");
    });
    const myLeaderBoard = ref<LeaderBoardRecord[]>([])
    const commonLeaderBoard = ref<LeaderBoardRecord[]>([])

    const leaderBoardTest = [
        {
            player: {
                publicName: 'Смерж***',
                uniqueId: 'local_player_1',
                getAvatarSrc: '/src/assets/images/avatars_test/15.jpg',
            },
            rank: 15,
            score: 2500,
        },
        {
            player: {
                publicName: 'Nora',
                uniqueId: 'local_player_2',
                getAvatarSrc: '/src/assets/images/avatars_test/16.jpg',
            },
            rank: 16,
            score: 2460,
        },
        {
            player: {
                publicName: 'Констант М',
                uniqueId: 'local_player_3',
                getAvatarSrc: '/src/assets/images/avatars_test/17.jpg',
            },
            rank: 17,
            score: 2300,
        },
        {
            player: {
                publicName: 'Щукин***',
                uniqueId: 'local_player_4',
                getAvatarSrc: '/src/assets/images/avatars_test/18.jpg',
            },
            rank: 18,
            score: 1905,
        },
        {
            player: {
                publicName: 'Степа***',
                uniqueId: 'local_player_5',
                getAvatarSrc: '/src/assets/images/avatars_test/19.jpg',
            },
            rank: 19,
            score: 619,
        },
        {
            player: {
                publicName: 'Mia***',
                uniqueId: 'local_player_6',
                getAvatarSrc: '/src/assets/images/avatars_test/20.jpg',
            },
            rank: 20,
            score: 84,
        },
    ];

    const leaderBoard = computed(() => {
        switch (currentView.value) {
            case LeaderboardsView.MyLeaderBoard:
                console.log("set myLeaderBoard")
                return myLeaderBoard.value;
            case LeaderboardsView.CommonLeaderBoard:
                console.log("set commonLeaderBoard")
                return commonLeaderBoard.value;
            default:
                return myLeaderBoard.value;
        };
    });

    // меняем стиль активной вкладки
    function setTabStyle(index_) {
        if ((currentView.value == 0 && index_ == 0) || (currentView.value == 1 && index_ == 1)) {
            return 'btn_tab_markered';
        };
    };

    function formatScore(score: number) {
        return Math.floor(score).toLocaleString("ru-RU");
    };

    // ===== BACK =====
    function backButtonClick() {
        if (gameState.currentState == 'menu') {
            isHeaderShown.value = false;
        };
        setTimeout(() => {
            currentView.value = LeaderboardsView.null;
        }, 100);
        setTimeout(() => {
            isBackButtonShown.value = false;
        }, 400);

        setTimeout(() => {
            gameState.closeOverlay();
        }, 500);
    };

    async function loadLeaderboards() {
        const platform = Platform.getInstance();
        const [myBoard, commonBoard] = await Promise.all([
            platform.getLeaderboardEntries("debugLeaderboard1", 5, true, 1),
            platform.getLeaderboardEntries("debugLeaderboard1", 5, false, 1),
        ]);

        // myLeaderBoard.value = myBoard.entries;
        myLeaderBoard.value = leaderBoardTest;
        commonLeaderBoard.value = commonBoard.entries;
    };

    onMounted(() => {
        loadLeaderboards();
        isHeaderShown.value = true;
        setTimeout(() => {
            currentView.value = LeaderboardsView.MyLeaderBoard;
        }, 200);
        setTimeout(() => {
            isBackButtonShown.value = true;
        }, 500);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    // #region - общие
    .leaderbords_container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
    }

    .btn_correction {
        @include text-secondary-menu-button;
        color: $color-yellow-super-light;
    }
    // #endregion

    // #region - вкладки
    .tabs {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        // gap: 35px;
        margin-top: 10px;
        line-height: 1;
    }

    .tab-left, .tab-right {
        flex: 1;               /* занимают равную ширину */
        display: flex;
    }
    .tab-left {
        justify-content: flex-start;
    }
    .tab-right {
        justify-content: flex-end;
    }

    .cube_divider {
        width: 0.9375rem;
        // flex: 0 0 auto;
        display: flex;
        align-items: center;
        margin: 0 0.5rem;
    }

    .btn_tab_correction {
        @include text-tab-button;
        color: $color-yellow-super-light;
    }

    .btn_tab_markered {
        color: #79BEFF;
        text-decoration: underline;
        text-decoration-thickness: 1px;
        text-underline-offset: 9px;
        filter: drop-shadow(0 0 0.9375rem rgba(169, 239, 247, 0.4));
    }
    // #endregion

    // #region - таблица
    .leaderboard_table {
        width: 420px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 12px;
    }

    .leaderboard_row_first {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;

        @include text-third-menu-button;
        color: $color-yellow-super-light;   
        text-transform: none;
    }

    .row_text_markered {
        color: #F79CFF;
        font-size: 26px;
        font-weight: 600;
    }

    .leaderboard_row_second {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .leaderboard_row_third {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 20px;
    }

    .player_avatar_img_container {
        width: 30px;
        height: 30px;
        display: flex;
        justify-content: center;
        align-items: center;
        border: solid 1px rgba(253, 255, 227, 0.5);;
        border-radius: 5px;
    }

    .img {
        width: 22px;
        height: 22px;
        border-radius: 3px;
    }
    // #endregion
</style>
