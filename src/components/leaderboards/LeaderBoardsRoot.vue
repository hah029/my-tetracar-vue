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
                    :key="getLeaderboardPlayerId(record.player) ?? record.rank"
                    class="leaderboard_row_first" :class="setPlayerRowStyle(record.player)"
                    :style="{ animationDelay: `${index * switchingDelay}s` }"
                >
                    <span class="player_rank">{{ record.rank }}</span>
                    <div class="leaderboard_row_second">
                        <div class="leaderboard_row_third">
                            <div class="player_avatar_img_container" :class="setPlayerCornerStyle(record.player)">
                                <img class="avatar_img" :src="getAvatarUrl(record.player)" />
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
    import { SoundManager } from "@/game/sound/SoundManager";
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
    const currentPlayerId = ref<string | null>(null);
    const { i18next } = useTranslation();
    const foo = createNewText();

    // ===== TITLE =====
    const dynamicTitleName = computed(() => {
        return foo.makeText("leaderboards.title", "empty");
    });

    const myLeaderBoard = ref<LeaderBoardRecord[]>([])
    const commonLeaderBoard = ref<LeaderBoardRecord[]>([])

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
        SoundManager.getInstance().playCue("uiSelect");
        
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
    function getLeaderboardPlayerId(player: LeaderBoardRecord["player"]): string | null {
        // В контракте приложения используется uniqueId, но Yandex SDK
        // возвращает uniqueID. Поддерживаем оба варианта на границе UI.
        const rawPlayer = player as LeaderBoardRecord["player"] & { uniqueID?: unknown };
        if (typeof rawPlayer.uniqueId === "string") return rawPlayer.uniqueId;
        return typeof rawPlayer.uniqueID === "string" ? rawPlayer.uniqueID : null;
    };

    function isCurrentPlayer(player: LeaderBoardRecord["player"]): boolean {
        const playerId = getLeaderboardPlayerId(player);
        return playerId !== null && playerId === currentPlayerId.value;
    };

    function setPlayerRowStyle(player: LeaderBoardRecord["player"]) {
        if (isCurrentPlayer(player)) {
            return 'row_text_markered';
        };
    };

    // меняем цвет рамки в строке с текущим игроком
    function setPlayerCornerStyle(player: LeaderBoardRecord["player"]) {
        if (isCurrentPlayer(player)) {
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
        SoundManager.getInstance().playCue("uiSelect");
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
        try {
            const [myBoard, commonBoard, playerId] = await Promise.all([
                platform.getLeaderboardEntries("debugLeaderboard1", 5, true, 1),
                // includeUser гарантирует, что активный игрок попадёт и в top
                // board, даже если его результат не входит в top-5.
                platform.getLeaderboardEntries("debugLeaderboard1", 5, true, 1),
                platform.getPlayerId(),
            ]);

            currentPlayerId.value = typeof playerId === "string" ? playerId : null;
            myLeaderBoard.value = myBoard?.entries ?? [];
            commonLeaderBoard.value = commonBoard?.entries ?? [];
        } catch (error) {
            console.error("Failed to load leaderboards:", error);
            myLeaderBoard.value = [];
            commonLeaderBoard.value = [];
        }
    };

    // выводим аватарку игрока в зависимости от разных условий
    function getAvatarUrl(player: any): string {
        const fallback = DEFAULT_AVATAR[0]!;
        if (!player) return fallback;
        let src = '';
        if (typeof player.getAvatarSrc === 'function') {
            src = player.getAvatarSrc();
        } else if (typeof player.getAvatarSrc === 'string') {
            src = player.getAvatarSrc;
        };

        // если результат пустой или undefined, возвращаем дефолт
        return src || fallback;
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
        @include text-button-size-s;
        color: $color-yellow-super-light;
    }
    // #endregion

    // #region - таблица
    .leaderboard_table {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        width: 85.47vh;
        gap: 1.709vh;
        margin-top: 3.077vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 85.47vh;
            gap: 1.709vh;
            margin-top: 3.077vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     width: 420px;
        //     gap: 12px;
        //     margin-top: 50px;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            width: 27.778vw;
            gap: 0.417vw;
            margin-top: 0.6vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 21.875vw;
            gap: 0.625vw;
            margin-top: 0;
        }
    }

    .leaderboard_row_first {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        @include text-info-size-m;
        color: $color-yellow-super-light;   
        gap: 3.846vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            gap: 3.846vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     gap: 20px;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            gap: 1.111vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 1.042vw;
        }
    }

    .row_text_markered {
        color: #F79CFF;
        font-weight: 600;
        text-decoration: underline;
        text-decoration-color: rgba(247, 156, 255, 0.5);
        font-size: 5.128vh;
        text-underline-offset: 1.2vh;
        text-decoration-thickness: 0.171vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            font-size: 5.128vh;
            text-underline-offset: 1.2vh;
            text-decoration-thickness: 0.171vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     font-size: 26px;
        //     text-underline-offset: 6px;
        //     text-decoration-thickness: 1px;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            font-size: 1.667vw;
            text-underline-offset: 0.417vw;
            text-decoration-thickness: 0.069vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            font-size: 1.354vw;
            text-underline-offset: 0.313vw;
            text-decoration-thickness: 0.052vw;
        }
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
        gap: 3.846vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            gap: 3.846vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     gap: 20px;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            gap: 1.111vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 1.042vw;
        }
    }

    .player_avatar_img_container {
        display: flex;
        justify-content: center;
        align-items: center;
        border: solid 1px rgba(253, 255, 227, 0.3);
        width: 5.641vh;
        height: 5.641vh;
        border-radius: 0.94vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 5.641vh;
            height: 5.641vh;
            border-radius: 0.94vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     width: 30px;
        //     height: 30px;
        //     border-radius: 5px;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            width: 1.944vw;
            height: 1.944vw;
            border-radius: 0.347vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 1.563vw;
            height: 1.563vw;
            border-radius: 0.26vw;
        }
    }

    .img_container_markered {
        border: solid 1px rgba(247, 156, 255, 1);
        margin-left: -0.6vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            margin-left: -0.6vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     margin-left: -3px;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            margin-left: -0.208vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            margin-left: -0.156vw;
        }
    }

    .avatar_img {
        width: 82%;
        height: 82%;
        border-radius: 0.564vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 82%;
            height: 82%;
            border-radius: 0.564vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
        //     width: 22px;
        //     height: 22px;
        //     border-radius: 3px;
        // }  
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            width: 79%;
            height: 79%;
            border-radius: 0.208vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 74%;
            height: 74%;
            border-radius: 0.156vw;
        }
    }
    // #endregion
</style>
