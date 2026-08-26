<template>
    <div class="container">
        <!-- MAIN MENU -->
        <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
            <button v-for="(btn, index) in menuButtons" v-if="isMainMenuEnabled" key="btn.id"
                class="menu_btn btn_correction" :style="{ animationDelay: `${index * 0.1}s` }" @click="btn.action">
                {{ btn.text }}
            </button>
        </TransitionGroup>

        <!-- BUSINESS MECHANICS -->
        <TransitionGroup name="business_tab_showing" tag="div" class="busines_tab_group">
            
            <div v-if="isMainMenuEnabled" :key="'fortune-wheel'" class="btn_container" :style="{ animationDelay: '0s' }">
                <div class="icon_container" :class="{ 'icon_container--pulse': hasFortuneReward && showFortuneReminder }" @click="businessButtons[0].action">
                    <img class="icon icon_wheel" src="@/assets/images/cube_buttons/btn_desktop_lucky_spin_wheel.svg" />
                    <div v-if="fortuneWheelStore.spins > 0" class="btn_marker">{{ fortuneWheelStore.spins }}</div>
                </div>
                <div v-if="hasFortuneReward && showFortuneReminder" class="btn_reminder hint_yellow">{{ businessButtons[0].reminder }}</div>
                <div class="btn_hint hint_pink">{{ businessButtons[0].text }}</div>
            </div>

            <div v-if="isMainMenuEnabled" :key="'daily-gift'" class="btn_container" :style="{ animationDelay: '0.1s' }">
                <div class="icon_container" :class="{ 'icon_container--pulse': hasDailyReward && showDailyReminder }" @click="businessButtons[1].action">
                    <img class="icon icon_daily" src="@/assets/images/cube_buttons/btn_desktop_daily_bonus.svg" />
                </div>
                <div v-if="hasDailyReward && showDailyReminder" class="btn_reminder hint_yellow">{{ businessButtons[1].reminder }}</div>
                <div class="btn_hint hint_yellow_light">{{ businessButtons[1].text }}</div>
            </div>

            <div v-if="isMainMenuEnabled" :key="'daily-tasks'" class="btn_container" :style="{ animationDelay: '0.2s' }">
                <div class="icon_container" :class="{ 'icon_container--pulse': hasQuestsReward && showQuestsReminder }" @click="businessButtons[2].action">
                    <img class="icon icon_quests" src="@/assets/images/cube_buttons/btn_desktop_quests.svg" />
                    <div v-if="objectivesStore.hasClaimableDaily" class="btn_marker">{{ reachedQuests }}</div>
                </div>
                <div v-if="hasQuestsReward && showQuestsReminder" class="btn_reminder hint_yellow">{{ businessButtons[2].reminder }}</div>
                <div class="btn_hint hint_blue">{{ businessButtons[2].text }}</div>
            </div>

            <div v-if="isMainMenuEnabled" :key="'achievements'" class="btn_container" :style="{ animationDelay: '0.3s' }">
                <div class="icon_container" :class="{ 'icon_container--pulse': hasAchievementsReward && showAchievementsReminder }" @click="businessButtons[3].action">
                    <img class="icon icon_achievement" src="@/assets/images/cube_buttons/btn_desktop_achievements.svg" />
                    <div v-if="objectivesStore.hasClaimableAchievement" class="btn_marker">{{ reachedAchievements }}</div>
                </div>
                <div v-if="hasAchievementsReward && showAchievementsReminder" class="btn_reminder hint_yellow">{{ businessButtons[3].reminder }}</div>
                <div class="btn_hint hint_green">{{ businessButtons[3].text }}</div>
            </div>

        </TransitionGroup>

        <!-- SHOP -->
        <ShopRoot v-if="gameStore.activeOverlay === 'shop'" />

        <!-- SETTINGS -->
        <SettingsRoot v-if="gameStore.activeOverlay === 'settings'" />

        <!-- LEADERBOARDS -->
        <LeaderBoardsRoot v-if="gameStore.activeOverlay === 'leaderBoards'" />

        <!-- DAILY GIFT -->
        <DailyGiftRoot v-if="gameStore.activeOverlay === 'dailyGift'" />

        <!-- FORTUNE WHEEL -->
        <FortuneWheelRoot v-if="gameStore.activeOverlay === 'fortuneWheel'" />

        <!-- DAILY TASKS AND ACHIEVEMENTS -->
        <ObjectivesRoot v-if="gameStore.activeOverlay === 'objectives'" />
    </div>
</template>


<script setup lang="ts">
    import { watch, ref, computed, onMounted, onUnmounted } from "vue";
    import { createNewText } from "@/helpers/functions";
    import { SoundManager } from "@/game/sound/SoundManager";
    
    import { useGameState } from "@/store/gameState";
    import { useDailyGiftStore } from "@/store/dailyGiftStore";
    import { useFortuneWheelStore } from "@/store/fortuneWheelStore";
    import { useObjectivesStore } from "@/store/objectivesStore";

    import ShopRoot from "./shop/ShopRoot.vue";
    import SettingsRoot from "./settings/SettingsRoot.vue";
    import LeaderBoardsRoot from "./leaderboards/LeaderBoardsRoot.vue";

    import FortuneWheelRoot from "@/components/business/FortuneWheelRoot.vue";
    import DailyGiftRoot from "@/components/business/DailyGiftRoot.vue";
    import ObjectivesRoot from "@/components/business/ObjectivesRoot.vue"

    const dailyGiftStore = useDailyGiftStore();
    const fortuneWheelStore = useFortuneWheelStore();
    const objectivesStore = useObjectivesStore();
    const foo = createNewText();
    const gameStore = useGameState();
    const isMainMenuEnabled = ref(false);
    const soundManager = SoundManager.getInstance();

    // переменные для напоминаний
    const showFortuneReminder = ref(false);
    const showDailyReminder = ref(false);
    const showQuestsReminder = ref(false);
    const showAchievementsReminder = ref(false);

    const fortuneTimer = ref<ReturnType<typeof setTimeout> | null>(null);
    const dailyTimer = ref<ReturnType<typeof setTimeout> | null>(null);
    const questsTimer = ref<ReturnType<typeof setTimeout> | null>(null);
    const achievementsTimer = ref<ReturnType<typeof setTimeout> | null>(null);

    const fortuneInterval = ref<ReturnType<typeof setInterval> | null>(null);
    const dailyInterval = ref<ReturnType<typeof setInterval> | null>(null);
    const questsInterval = ref<ReturnType<typeof setInterval> | null>(null);
    const achievementsInterval = ref<ReturnType<typeof setInterval> | null>(null);

    const REMINDER_DURATION = 2500; // сколько показывается подсказка
    const REMINDER_INTERVAL = 8000; // интервал между напоминаниями (для каждого независимо)

    // --- проверки для каждой кнопки ---
    const hasFortuneReward = computed(() => fortuneWheelStore.spins > 0);
    const hasDailyReward = computed(() => false); // у награды дня нет маркера
    const hasQuestsReward = computed(() => objectivesStore.hasClaimableDaily);
    const hasAchievementsReward = computed(() => objectivesStore.hasClaimableAchievement);

    const menuButtons = computed(() => [
        { id: 1, text: foo.makeText("mainMenu.startGame"), action: startGame },
        { id: 2, text: foo.makeText("mainMenu.shop"), action: goToShop },
        { id: 3, text: foo.makeText("mainMenu.settings"), action: goToSettings },
        { id: 4, text: foo.makeText("mainMenu.leaderboards"), action: goToLeaderBoards },
    ]);

    const businessButtons = computed(() => [
        { id: 1, 
            text: foo.makeText("businessMenu.namesList.luckySpin", 'empty'), 
            reminder: foo.makeText("businessMenu.remindersList.luckySpin", 'empty'), 
            action: goToFortuneWheel 
        },
        { id: 2, 
            text: foo.makeText("businessMenu.namesList.dailyBonus", 'empty'), 
            reminder: foo.makeText("businessMenu.remindersList.dailyBonus", 'empty'), 
            action: goToDailyGift 
        },
        { id: 3, 
            text: foo.makeText("businessMenu.namesList.quests", 'empty'), 
            reminder: foo.makeText("businessMenu.remindersList.quests", 'empty'), 
            action: goToDailyTasks 
        },
        { id: 4, 
            text: foo.makeText("businessMenu.namesList.achievements", 'empty'), 
            reminder: foo.makeText("businessMenu.remindersList.achievements", 'empty'), 
            action: goToAchievements 
        },
    ]);

    // расчет количества выполненных заданий, которые можно забрать
    const reachedQuests = computed(() => {
        return objectivesStore.dailyObjectives.filter((objective) =>
            objectivesStore.isClaimable(objective, true)
        ).length;
    });

    // расчет количества полученных достижений, которые можно забрать
    const reachedAchievements = computed(() => {
        return objectivesStore.achievements.filter((objective) =>
            objectivesStore.isClaimable(objective, false)
        ).length;
    });

    // #region - действия по кнопкам главного меню 
        function startGame() {
            soundManager.playCue("uiSelect");
            gameStore.startGame();
        };

        function goToShop() {
            soundManager.playCue("uiSelect");
            isMainMenuEnabled.value = false;
            setTimeout(() => {
                gameStore.openShop();
            }, 300);
        };

        function goToSettings() {
            soundManager.playCue("uiSelect");
            isMainMenuEnabled.value = false;
            setTimeout(() => {
                gameStore.openSettings('main');
            }, 300);
        };

        function goToLeaderBoards() {
            soundManager.playCue("uiSelect");
            isMainMenuEnabled.value = false;
            setTimeout(() => {
                gameStore.openLeaderBoards();
            }, 300);
        };
    // #endregion

    // #region - действия по кнопкам бизнес-панели (в левой части экрана)
        function goToFortuneWheel() {
            soundManager.playCue("uiSelect");
            isMainMenuEnabled.value = false;
            setTimeout(() => gameStore.openFortuneWheel(), 300);
        };

        function goToDailyGift() {
            soundManager.playCue("uiSelect");
            isMainMenuEnabled.value = false;
            setTimeout(() => gameStore.openDailyGift(), 300);
        };

        function goToDailyTasks() {
            soundManager.playCue("uiSelect");
            isMainMenuEnabled.value = false;
            setTimeout(() => gameStore.openObjectives("daily"), 300);
        };

        function goToAchievements() {
            soundManager.playCue("uiSelect");
            isMainMenuEnabled.value = false;
            setTimeout(() => gameStore.openObjectives("achievements"), 300);
        };
    // #endregion

    // #region - периодические напоминания о наградах
        // --- Функции триггера для каждой кнопки ---
        function triggerFortuneReminder() {
            if (!hasFortuneReward.value || !isMainMenuEnabled.value) return;
            showFortuneReminder.value = true;
            if (fortuneTimer.value) clearTimeout(fortuneTimer.value);
            fortuneTimer.value = setTimeout(() => {
                showFortuneReminder.value = false;
            }, REMINDER_DURATION);
        }

        function triggerDailyReminder() {
            if (!hasDailyReward.value || !isMainMenuEnabled.value) return;
            showDailyReminder.value = true;
            if (dailyTimer.value) clearTimeout(dailyTimer.value);
            dailyTimer.value = setTimeout(() => {
                showDailyReminder.value = false;
            }, REMINDER_DURATION);
        }

        function triggerQuestsReminder() {
            if (!hasQuestsReward.value || !isMainMenuEnabled.value) return;
            showQuestsReminder.value = true;
            if (questsTimer.value) clearTimeout(questsTimer.value);
            questsTimer.value = setTimeout(() => {
                showQuestsReminder.value = false;
            }, REMINDER_DURATION);
        }

        function triggerAchievementsReminder() {
            if (!hasAchievementsReward.value || !isMainMenuEnabled.value) return;
            showAchievementsReminder.value = true;
            if (achievementsTimer.value) clearTimeout(achievementsTimer.value);
            achievementsTimer.value = setTimeout(() => {
                showAchievementsReminder.value = false;
            }, REMINDER_DURATION);
        }

        // --- Запуск интервалов для каждой кнопки ---
        function startFortuneLoop() {
            if (fortuneInterval.value) clearInterval(fortuneInterval.value);
            setTimeout(() => triggerFortuneReminder(), 1000);
            fortuneInterval.value = setInterval(triggerFortuneReminder, REMINDER_INTERVAL);
        }

        function startDailyLoop() {
            if (dailyInterval.value) clearInterval(dailyInterval.value);
            setTimeout(() => triggerDailyReminder(), 2000);
            dailyInterval.value = setInterval(triggerDailyReminder, REMINDER_INTERVAL);
        }

        function startQuestsLoop() {
            if (questsInterval.value) clearInterval(questsInterval.value);
            setTimeout(() => triggerQuestsReminder(), 3000);
            questsInterval.value = setInterval(triggerQuestsReminder, REMINDER_INTERVAL);
        }

        function startAchievementsLoop() {
            if (achievementsInterval.value) clearInterval(achievementsInterval.value);
            setTimeout(() => triggerAchievementsReminder(), 4000);
            achievementsInterval.value = setInterval(triggerAchievementsReminder, REMINDER_INTERVAL);
        }

        // --- Остановка всех циклов ---
        function stopAllReminderLoops() {
            const intervals = [fortuneInterval, dailyInterval, questsInterval, achievementsInterval];
            const timers = [fortuneTimer, dailyTimer, questsTimer, achievementsTimer];
            
            intervals.forEach((interval) => {
                if (interval.value) {
                    clearInterval(interval.value);
                    interval.value = null;
                }
            });
            timers.forEach((timer) => {
                if (timer.value) {
                    clearTimeout(timer.value);
                    timer.value = null;
                }
            });
            
            showFortuneReminder.value = false;
            showDailyReminder.value = false;
            showQuestsReminder.value = false;
            showAchievementsReminder.value = false;
        }

        // --- Запуск всех активных циклов ---
        function startAllReminderLoops() {
            stopAllReminderLoops();
            
            if (hasFortuneReward.value && isMainMenuEnabled.value) startFortuneLoop();
            if (hasDailyReward.value && isMainMenuEnabled.value) startDailyLoop();
            if (hasQuestsReward.value && isMainMenuEnabled.value) startQuestsLoop();
            if (hasAchievementsReward.value && isMainMenuEnabled.value) startAchievementsLoop();
        }
    // #endregion

    watch(
        () => gameStore.activeOverlay,
        (newState) => {
            if (["settings", "leaderBoards", "shop", "dailyGift", "fortuneWheel", "objectives"].includes(newState as string)) {
                isMainMenuEnabled.value = false;
            } else {
                isMainMenuEnabled.value = true;
            };
        },
    );

    // следим за появлением наград и запускаем / останавливаем цикл
    watch(
        [
            () => hasFortuneReward.value,
            () => hasDailyReward.value,
            () => hasQuestsReward.value,
            () => hasAchievementsReward.value,
            () => isMainMenuEnabled.value
        ],
        () => {
            if (isMainMenuEnabled.value) {
                startAllReminderLoops();
            } else {
                stopAllReminderLoops();
            }
        },
        { immediate: true }
    );

    onMounted(async () => {
        setTimeout(() => {
            isMainMenuEnabled.value = true;
        }, 400);

        if (dailyGiftStore.isReady && dailyGiftStore.status.canClaim) {
            setTimeout(() => gameStore.openDailyGift(), 450);
        };
    });

    onUnmounted(() => {
        stopAllReminderLoops();
    });
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    // #region - элементы главного меню
        .group_correction {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            position: fixed;

            // #region - bottom and gap
            bottom: 11.111vh;
            gap: 5.56vh;

            @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) {
                bottom: 11.111vh;
                gap: 5.56vh;
            }

            // позже расчитать:
            // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            //     bottom: 9.722vw;
            //     gap: 1.736vw; 
            // }  
            @media (min-width: $breakpoint-laptop) and (orientation: landscape) {
                bottom: 9.722vw;
                gap: 1.736vw;
            }

            @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
                bottom: 10.677vw;
                gap: 1.667vw;
            }

            // #endregion
        }

        .btn_correction {
            @include text-button-size-m;
            color: $color-yellow-super-light;
        }
    // #endregion

    // #region - элементы бизнес-панели (в левой части экрана)
        .busines_tab_group {
            position: absolute;
            left: 40px;
            bottom: 250px;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .btn_container {
            display: flex;
            gap: 12px;
            justify-content: flex-start;
            align-items: center;
        }

        .icon_container {
            position: relative;
            width: 68px;
            cursor: pointer;
            pointer-events: auto;
            transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);

            &--pulse {
                animation: rewardPulse 1.2s ease-in-out infinite;
            }

            &:hover .btn_marker {
                transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
                transform: translateX(5px);
            }
            &:hover +.btn_hint {
                opacity: 1;
                transition: all 0.65s cubic-bezier(0,.29,.25,1);
                transform: translateX(16px);
            }
            &:hover .icon {
                transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
                transform: translateX(5px);
            }
            &:hover .icon_wheel {
                filter: drop-shadow(0 0 30px rgba(137, 35, 146, 1));
            }
            &:hover .icon_daily {
                filter: drop-shadow(0 0 30px rgba(151, 145, 11, 1));
            }
            &:hover .icon_quests {
                filter: drop-shadow(0 0 30px rgba(73, 114, 153, 1));
            }
            &:hover .icon_achievement {
                filter: drop-shadow(0 0 30px rgba(76, 147, 62, 1));
            }
        }

        .icon {
            width: 100%;
            transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .btn_marker {
            position: absolute;
            top: 0;
            right: -10px;
            width: 18px;
            height: 18px;
            background-color: $color-yellow;
            display: flex;
            justify-content: center;
            align-items: center;
            @include text-info-size-xs;
            line-height: 1;
            font-weight: 600;
            color: $color-black;
            transition: all 0.2s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .btn_hint {
            opacity: 0;
            @include text-info-size-s;
            text-transform: uppercase;
        }

        .hint_pink {
            color: $color-pink;
        }

        .hint_yellow {
            color: $color-yellow;
            margin-top: -5px;
        }

        .hint_yellow_light {
            color: $color-yellow-super-light;
            margin-top: -5px;
        }

        .hint_blue {
            color: $color-blue;
            margin-top: -12px;
        }

        .hint_green {
            color: $color-green-light;
            margin-top: -16px;
        }

        @keyframes rewardPulse {
            0%, 100% {
                transform: scale(1);
                filter: drop-shadow(0 0 0 rgba(255, 215, 0, 0));
            }
            50% {
                transform: scale(1.08);
                filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.6));
            }
        }

        .btn_reminder {
            opacity: 0;
            @include text-info-size-s;
            text-transform: uppercase;
            white-space: nowrap;
            animation: reminderSlideIn 2.5s ease-out forwards;
            margin-left: 16px;
        }

        @keyframes reminderSlideIn {
            0% {
                opacity: 0;
                transform: translateX(-10px);
            }
            15% {
                opacity: 1;
                transform: translateX(0);
            }
            85% {
                opacity: 1;
                transform: translateX(0);
            }
            100% {
                opacity: 0;
                transform: translateX(-10px);
            }
        }
    // #endregion
</style>
