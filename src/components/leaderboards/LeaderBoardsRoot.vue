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
                        <div class="tab tab_left">
                            <div class="menu_btn btn_tab_correction" :class="setTabStyle('mine')" @click="switchTabButton('mine')">
                                {{ foo.makeText("leaderboards.tabList.myBoard", 'leftLine') }}
                            </div>
                        </div>
                        <div class="cube_divider">
                            <img class="image" src="@/assets/images/cube_divider.svg" />
                        </div>
                        <div class="tab tab_right">
                            <div class="menu_btn btn_tab_correction" :class="setTabStyle('common')" @click="switchTabButton('common')">
                                {{ foo.makeText("leaderboards.tabList.topBoard", 'rightLine') }}
                            </div>
                        </div>
                    </div>

                </div>
            </Transition>

            <!-- CONTENT -->
            <TransitionGroup name="buttons_group_showing" tag="div" class="leaderboard_table">
                <div v-for="(record, index) in leaderBoard" v-if="currentView !== LeaderboardsView.null"
                    :key="record.player.uniqueId ?? record.rank"
                    class="leaderboard_row_first" :class="setPlayerRowStyle(record.player)"
                    :style="{ animationDelay: `${index * switchingDelay}s` }"
                >
                    <span class="player_rank">{{ record.rank }}</span>
                    <div class="leaderboard_row_second">
                        <div class="leaderboard_row_third">
                            <div class="player_avatar_img_container" :class="setPlayerCornerStyle(record.player)">
                                <img class="img" :src="getAvatarUrl(record.player)" />
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
    import { useTranslation } from "i18next-vue";

    import { Platform } from "@/sdk/Platform";
    import type { LeaderBoardRecord } from "@/sdk/types/Leaderboard";
    // import type { LeaderBoard, LeaderBoardRecord } from "@/sdk/IGamePlatform";

    enum LeaderboardsView {
        MyLeaderBoard,
        CommonLeaderBoard,
        null,
    };

    const DEFAULT_AVATAR = [
        '/src/assets/images/avatars/awatar_anonymous_1.jpg',
        '/src/assets/images/avatars/awatar_anonymous_2.jpg',
        '/src/assets/images/avatars/awatar_anonymous_3.jpg',
        '/src/assets/images/avatars/awatar_anonymous_4.jpg'
    ];

    // ===== STORES =====
    const gameState = useGameState();

    // ===== LOCAL STATE =====
    // const currentView = ref<LeaderboardsView>(LeaderboardsView.Main);
    const currentView = ref<LeaderboardsView>(LeaderboardsView.MyLeaderBoard);
    const currentViewStaus = ref('mine');
    const switchingDelay = ref(0.05);

    const isHeaderShown = ref(false);
    const isBackButtonShown = ref(false);
    const { i18next } = useTranslation();
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
                getAvatarSrc: '/src/assets/images/avatars/15.jpg',
            },
            rank: 15,
            score: 2500,
        },
        {
            player: {
                publicName: 'Nora',
                uniqueId: 'local_player_2',
                getAvatarSrc: '/src/assets/images/avatars/16.jpg',
            },
            rank: 16,
            score: 2460,
        },
        {
            player: {
                publicName: 'Констант М',
                uniqueId: 'local_player_3',
                getAvatarSrc: '/src/assets/images/avatars/17.jpg',
            },
            rank: 17,
            score: 2300,
        },
        {
            player: {
                publicName: 'Щукин***',
                uniqueId: 'local_player_4',
                getAvatarSrc: '/src/assets/images/avatars/18.jpg',
            },
            rank: 18,
            score: 1905,
        },
        {
            player: {
                publicName: 'Степа***',
                uniqueId: 'local_player_5',
                getAvatarSrc: '/src/assets/images/avatars/19.jpg',
            },
            rank: 19,
            score: 619,
        },
        {
            player: {
                publicName: 'Mia***',
                uniqueId: 'local_player_6',
                getAvatarSrc: '/src/assets/images/avatars/20.jpg',
            },
            rank: 20,
            score: 84,
        },
    ];

    // генерируем таблицу игроков для ее последующего отображения
    const leaderBoard = computed(() => {
        switch (currentView.value) {
            case LeaderboardsView.MyLeaderBoard:
                return myLeaderBoard.value;
            case LeaderboardsView.CommonLeaderBoard:
                return commonLeaderBoard.value;
            default:
                return myLeaderBoard.value;
        };
    });

    // переключаем вкладку
    function switchTabButton(type_: string) {
        // переключаем саму вкладку
        if (type_ == 'mine') {
            if (currentView.value == LeaderboardsView.MyLeaderBoard) return;     // защита от повт. нажатия
            currentViewStaus.value = 'mine';
        } else if (type_ == 'common') {
            if (currentView.value == LeaderboardsView.CommonLeaderBoard) return; // защита от повт. нажатия
            currentViewStaus.value = 'common';
        };
        
        // скрываем старые строки таблицы 
        switchingDelay.value = 0.03;
        setTimeout(() => {
            currentView.value = LeaderboardsView.null;
        }, 50);

        // показываем новые строки таблицы
        setTimeout(() => {
            if (type_ == 'mine') {
                currentView.value = LeaderboardsView.MyLeaderBoard;
            } else if (type_ == 'common') {
                currentView.value = LeaderboardsView.CommonLeaderBoard;
            };
        }, 750);
    };

    // меняем стиль активной вкладки
    function setTabStyle(type_: string) {
        if ((currentViewStaus.value == 'mine' && type_ == 'mine') || (currentViewStaus.value == 'common' && type_ == 'common')) {
            return 'btn_tab_markered';
        };
    };

    // подсвечиваем текст в строке с текущим игроком
    function setPlayerRowStyle(player_) {
        if (player_.uniqueId == 'local_player_3') {
            return 'row_text_markered';
        };
    };

    // меняем цвет рамки в строке с текущим игроком
    function setPlayerCornerStyle(player_) {
        if (player_.uniqueId == 'local_player_3') {
            return 'img_container_markered';
        };
    };

    // приводим в нужный формат очки игрока (с учетом его страны)
    function formatScore(score: number) {
        const locale = i18next.language || "ru-RU";
        return Math.floor(score).toLocaleString(locale);
    };

    // ===== BACK =====
    function backButtonClick() {
        switchingDelay.value = 0.05;
        isHeaderShown.value = false;
        setTimeout(() => {
            currentView.value = LeaderboardsView.null;
        }, 100);
        setTimeout(() => {
            isBackButtonShown.value = false;
        }, 450);

        setTimeout(() => {
            gameState.closeOverlay();
        }, 500);
    };

    // запрос с сервера Яндекса таблиц с рекордами
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

    // выводим аватарку игрока в зависимости от разных условий
    function getAvatarUrl(player: any): string {
        const imageIndex = Math.floor(Math.random() * 4);
        if (!player) return DEFAULT_AVATAR[imageIndex];
        let src = '';
        if (typeof player.getAvatarSrc === 'function') {
            src = player.getAvatarSrc();
        } else if (typeof player.getAvatarSrc === 'string') {
            src = player.getAvatarSrc;
        };

        // если результат пустой или undefined, возвращаем дефолт
        return src || DEFAULT_AVATAR[imageIndex];
    };

    onMounted(() => {
        loadLeaderboards();
        isHeaderShown.value = true;
        setTimeout(() => {
            currentView.value = LeaderboardsView.MyLeaderBoard;
            currentViewStaus.value = 'mine';
        }, 200);
        setTimeout(() => {
            isBackButtonShown.value = true;
        }, 400);
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
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 40px;
        margin-top: 10px;
    }

    .tab {
        flex: 1;
        display: flex;
    }

    .tab_left {
        justify-content: flex-end;
    }

    .tab_right {
        justify-content: flex-start;
    }

    .cube_divider {
        width: 0.9375rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .btn_tab_correction {
        @include text-tab-button;
        color: $color-yellow-super-light;
    }

    .btn_tab_markered {
        color: $color-blue;
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
        text-decoration: underline;
        text-decoration-color: rgba(247, 156, 255, 0.5);
        text-decoration-thickness: 1px;
        text-underline-offset: 6px;
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
        border: solid 1px rgba(253, 255, 227, 0.5);
        border-radius: 5px;
    }

    .img_container_markered {
        border: solid 1px rgba(247, 156, 255, 1);
        margin-left: -3px;
    }

    .img {
        width: 22px;
        height: 22px;
        border-radius: 3px;
    }
    // #endregion
</style>
