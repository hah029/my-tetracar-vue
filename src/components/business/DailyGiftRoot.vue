<template>
    <div class="container daily-gift">
        <div class="header_block">
            <div class="header_text">
                <!-- {{ t("dailyGift.title") }} | {{ t("dailyGift.cycle", { cycle: dailyGift.status.cycleNumber }) }} -->
                {{ t("dailyGift.title") }}
            </div>
            <div class="header_image"><img class="image" src="@/assets/images/title_line_image.svg" /></div>
        </div>

        <div class="daily_gift_content">
            <!-- <div class="daily-gift__week-tabs">
                <button v-for="week in weeks" :key="week" class="daily-gift__week-tab"
                :class="{ active: week === selectedWeek }" @click="selectWeek(week)">
                {{ week }}
                </button>
            </div> -->

            <!-- Блок с карточками -->
            <div class="daily_gift_cards_block">
                <div v-for="day in weekDays" :key="day" class="daily_gift_card" :class="getDayClass(day)"
                    :aria-current="day === selectedDay ? 'true' : undefined" role="button" tabindex="0" @click="selectDay(day)"
                    @keydown.enter="selectDay(day)"
                >
                    <!-- Свечение за иконками -->
                    <div class="card_background_glow"></div>

                    <!-- Титул -->
                    <div class="daily_gift_title_block">
                        <span class="daily_gift_title">{{ t("dailyGift.day", { day }) }}</span>
                        <span class="daily_gift_separator"></span>
                    </div>

                    <!-- Блок с иконками и числами наград -->
                    <div class="daily_gift_rewards_block">
                        <div v-for="(reward, rewardIndex) in getRewards(day)" :key="rewardIndex" class="daily_gift_reward">
                            
                            <div class="daily_gift_reward_icon_container" :class="setGiftIconSize(reward, getRewards(day).length)">
                                <img class="reward_img" :src="getRewardIcon(reward)" />
                            </div>

                            <!-- :class="`daily_gift_reward_icon--${reward.type}`" -->

                            <span class="daily_gift_reward_value" :style="setGiftValueStyle(reward)">{{ getRewardAmount(reward) }}</span>

                        </div>
                    </div>

                    <!-- Рекламный бонус (x2) -->
                    <span v-if="canDoubleDailyGift(day)" class="daily-gift__bonus">×2</span>

                    <!-- Галочка (бонус взят) -->
                    <span v-if="getDayClass(day).claimed" class="daily-gift__status daily-gift__status--claimed">✓</span>

                    <!-- Рамки -->
                    <div class="daily_gift_card_corner corner_top_left"></div>
                    <div class="daily_gift_card_corner corner_top_right"></div>
                    <div class="daily_gift_card_corner corner_bottom_left"></div>
                    <div class="daily_gift_card_corner corner_bottom_right"></div>
                </div>
            </div>

            <!-- Блок с подсказками (под карточками) -->
            <div class="daily_gift_tips_block">
                <div class="text_claimed">{{ t("dailyGift.claimed") }}</div>
                <div class="text_week_caption">
                    <!-- {{ t("dailyGift.cycle", { cycle: dailyGift.status.cycleNumber }) }} · {{ selectedWeek }} / {{ weeks.length }} -->
                    {{ weekName }}
                </div>
            </div>

            <div v-if="dailyGift.recovery.available || dailyGift.state.pendingRecovery" class="daily-gift__recovery">
                <p>
                    {{ t("dailyGift.recoveryInfo", {
                        missed: dailyGift.recovery.missedDays,
                        week: dailyGift.state.pendingRecovery ? Math.ceil(dailyGift.state.pendingRecovery.day / DAILY_GIFT_WEEK_LENGTH) : dailyGift.recovery.week,
                        day: dailyGift.state.pendingRecovery?.day ?? dailyGift.recovery.day,
                    }) }}
                </p>
                <button class="menu_btn daily-gift__recover" :disabled="!dailyGift.canRecover" @click="recover">
                {{ dailyGift.isRecovering ? t("dailyGift.recovering") : dailyGift.state.pendingRecovery
                    ? t("dailyGift.retryRecovery") : t("dailyGift.recover", { cost: dailyGift.recovery.cost }) }}
                </button>
                <p v-if="!dailyGift.state.pendingRecovery && meta.energons < dailyGift.recovery.cost">{{ t("dailyGift.notEnoughEnergons") }}</p>
            </div>

            <p v-if="dailyGift.error" class="daily-gift__error">{{ t(errorKey) }}</p>

            <button v-if="dailyGift.status.canClaim" class="menu_btn daily-gift__claim"
                :disabled="!dailyGift.isReady || dailyGift.isClaiming || dailyGift.isRecovering || !!dailyGift.state.pendingRecovery || selectedDay !== currentDay" @click="claim">{{ dailyGift.isClaiming ?
                t("dailyGift.claiming") : dailyGift.recovery.available ? t("dailyGift.restart") : t("dailyGift.claim") }}
            </button>
            

            <button v-if="dailyGift.canDouble" class="menu_btn daily-gift__double"
                :disabled="!dailyGift.isReady || dailyGift.isClaiming || dailyGift.isRecovering || !!dailyGift.state.pendingRecovery || selectedDay !== currentDay"
                @click="claimDouble">
                {{ dailyGift.isWatchingAd ? t("dailyGift.watchingAd") : t("dailyGift.claimDouble") }}
            </button>
        </div>

        <button class="menu_btn daily-gift__back" :disabled="dailyGift.isClaiming || dailyGift.isRecovering || !!dailyGift.state.pendingRecovery" @click="gameState.closeOverlay()">{{ t("mainMenu.goBack") }}</button>
    </div>
</template>


<script setup lang="ts">
    import { computed, onMounted, onUnmounted, ref, watch } from "vue";
    import { useTranslation } from "i18next-vue";
    import { DAILY_GIFT_CYCLE_LENGTH, DAILY_GIFT_WEEK_LENGTH, canDoubleDailyGift } from "@/configs/dailyGift";
    import { useDailyGiftStore } from "@/store/dailyGiftStore";
    import { useMetaStore } from "@/store/metaStore";
    import { useGameState } from "@/store/gameState";
    import type { RewardDefinition } from "@/purchase/types";
    import { SoundManager } from "@/game/sound/SoundManager";
    import { createNewText } from '@/helpers/functions';

    import goldenIcon from "@/assets/images/hud/cube_golden.svg";
    import energonIcon from "@/assets/images/hud/cube_energon_core.svg";
    import ammoIcon from "@/assets/images/hud/cube_bullet.svg";
    import armorIcon from "@/assets/images/hud/cube_armor.svg";
    import dailyIcon from "@/assets/images/daily_gifts_icon.svg";
    import wheelIcon from "@/assets/images/daily_gifts/fortune_wheel_icon.png";
    

    const { t } = useTranslation();
    const { i18next } = useTranslation();
    const foo = createNewText();
    const dailyGift = useDailyGiftStore();
    const gameState = useGameState();
    const meta = useMetaStore();
    const days = Array.from({ length: DAILY_GIFT_CYCLE_LENGTH }, (_, index) => index + 1);
    const weeks = Array.from({ length: DAILY_GIFT_CYCLE_LENGTH / DAILY_GIFT_WEEK_LENGTH }, (_, index) => index + 1);
    
    const errorKey = computed(() => {
        switch (dailyGift.error) {
            case "recovery_failed": return "dailyGift.recoveryError";
            case "ad_failed": return "dailyGift.adError";
            case "ad_not_completed": return "dailyGift.adNotCompleted";
            default: return "dailyGift.claimError";
        }
    });

    const currentDay = computed(() => dailyGift.status.day);
    const selectedDay = ref(currentDay.value);
    const selectedWeek = computed(() => Math.ceil(selectedDay.value / DAILY_GIFT_WEEK_LENGTH));

    const weekName = computed(() => foo.getElementFromArray('dailyGift.weekName', selectedWeek.value - 1));
    
    const weekDays = computed(() => {
        const start = (selectedWeek.value - 1) * DAILY_GIFT_WEEK_LENGTH;
        return days.slice(start, start + DAILY_GIFT_WEEK_LENGTH);
    });

    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    watch(
        currentDay, 
        (day) => { 
            selectedDay.value = day; 
        },
    );

    function getDayClass(day: number) {
        const { canClaim, day: availableDay } = dailyGift.status;

        return {
            active: day === selectedDay.value,
            available: canClaim && day === availableDay,
            claimed: day < availableDay || (!canClaim && day === availableDay),
        };
    };

    // получаем массив доступных наград за конкретный день
    function getRewards(day: number) {
        return dailyGift.getDisplayRewards(day);
    };

    // получаем число под иконкой награды (в формате выбранного языка)
    function getRewardAmount(reward: RewardDefinition): string {
        let newString = '';
        if (reward.type === "cosmetic") {
            newString = t("dailyGift.skin");

        } else if (reward.type === "upgrade") {
            newString = t("dailyGift.upgrade");

        } else {
            newString = String(reward.effect?.amount ?? 1);
        }
        
        return formatScore(Number(newString));
    };

    function getRewardIcon(reward: RewardDefinition): string {
        switch (reward.type) {
            case "currency": return reward.effect?.currency === "energon" ? energonIcon : goldenIcon;
            case "ammo": return ammoIcon;
            case "armor": return armorIcon;
            case "fortune_spin": return wheelIcon;
            case "cosmetic": return dailyIcon;
            case "upgrade": return dailyIcon;
            default: return dailyIcon;
        };
    };

    function selectDay(day: number) {
        if (day < 1 || day > DAILY_GIFT_CYCLE_LENGTH) return;
        selectedDay.value = day;
    };

    function selectWeek(week: number) {
        const day = (week - 1) * DAILY_GIFT_WEEK_LENGTH + 1;
        selectDay(day);
    };

    function handleKeydown(event: KeyboardEvent) {
        const key = event.key.toLowerCase();

        if (key === "arrowleft" || key === "a") {
            event.preventDefault();
            selectDay(selectedDay.value - 1);
        };

        if (key === "arrowright" || key === "d") {
            event.preventDefault();
            selectDay(selectedDay.value + 1);
        };
    };

    // приводим в нужный формат очки игрока (с учетом его страны) 
    // (дублируется с такой же функцией в LeaderBoarsRoot.vue - позже вынести как универсальную)
    function formatScore(score: number) {
        const locale = i18next.language || "ru-RU";
        return Math.floor(score).toLocaleString(locale);
    };

    // назначаем габариты иконке награды
    function setGiftIconSize(reward_, rewardsCount_) {
      if (reward_.type == 'fortune_spin') {
        return 'icon_fortune_size';
      } else if (rewardsCount_ == 1) {
        return 'icon_normal_size';
      } else {
        return 'icon_small_size';
      };
    };

    // назначаем стиль подписи под иконкой награды
    function setGiftValueStyle(reward_) {
      let newColor = '';
      if (reward_.type == 'currency') {
        newColor = reward_.effect.currency == 'golden' ? 'FFF5AD' : 'D7FBFF';
      } else if (reward_.type == 'ammo') {
        newColor = 'FFC3C5';
      } else if (reward_.type == 'armor') {
        newColor = 'FFFFFF';
      };


      return {
        color: `#${newColor}`,
      };
    };

    async function recover() {
        const recovered = await dailyGift.recover();
        SoundManager.getInstance().playCue(recovered ? "uiSelect" : "actionRejected");
    };

    async function claimDouble() {
        const claimed = await dailyGift.claim(true);
        SoundManager.getInstance().playCue(claimed ? "goldenPickup" : "actionRejected");
    };

    async function claim() {
        const claimed = await dailyGift.claim();
        SoundManager.getInstance().playCue(claimed ? "goldenPickup" : "actionRejected");
    };

    onMounted(async () => {
        refreshTimer = setInterval(() => dailyGift.refreshStatus(), 60_000);
        window.addEventListener("keydown", handleKeydown);
    });

    onUnmounted(() => {
        if (refreshTimer) clearInterval(refreshTimer);
        window.removeEventListener("keydown", handleKeydown);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    // #region - основное
        .daily_gift_content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: 30px;
        }

        .daily_gift_cards_block {
            display: flex;
            gap: 24px;
        }

        .header_block {
            margin-bottom: 38px;
        }
    // #endregion

    // #region - карточки наград
        
        // #region - тело карточки    
        .daily_gift_card {
            position: relative;
            width: 200px;
            height: 280px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 26px 25px;
            box-sizing: border-box;
            // overflow: hidden;

            border: 1px solid rgba(121, 190, 255, 0.6);
            background-color: rgba($color: #000000, $alpha: 0.5);
            color: $color-gray;
            cursor: pointer;
            transition: 0.2s ease;
        }

        .daily_gift_card:hover,
        .daily_gift_card.active {
            transform: translateY(-.25rem);
            border-color: rgba(132, 210, 255, .8);
            box-shadow: 0 .5rem 1.8rem rgba(58, 150, 225, .16), inset 0 0 2rem rgba(74, 159, 220, .08);
        }

        .daily_gift_card.available {
            border-color: $color-blue-light;
            box-shadow: 0 0 1.6rem rgba(71, 171, 255, .36), inset 0 0 2rem rgba(57, 148, 225, .13);
        }

        .daily_gift_card.claimed {
            opacity: .38;
            filter: saturate(.45);
        }
        // #endregion

        // #region - рамки
        .daily_gift_card_corner {
            position: absolute;
            width: 15px;
            height: 15px;
            pointer-events: none;
        }

        .corner_top_left {
            top: -2px;
            left: -2px;
            border-top: 3px solid;
            border-left: 3px solid;
            border-color: $color-blue;
        }

        .corner_top_right {
            top: -2px;
            right: -2px;
            border-top: 3px solid;
            border-right: 3px solid;
            border-color: $color-blue;
        }

        .corner_bottom_left {
            left: -2px;
            bottom: -2px;
            border-left: 3px solid;
            border-bottom: 3px solid;
            border-color: $color-blue;
        }

        .corner_bottom_right {
            right: -2px;
            bottom: -2px;
            border-right: 3px solid;
            border-bottom: 3px solid;
            border-color: $color-blue;
        }
        // #endregion

        // #region - титул
        .daily_gift_title_block {
            width: 100%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            gap: 26px;
        }

        .daily_gift_title {
            @include text-info-size-m;
            color: $color-yellow-super-light;
            text-transform: uppercase;
            line-height: 1;
        }

        .daily_gift_separator {
            width: 100%;
            height: 1px;
            background: linear-gradient(to right,
                rgba(121, 190, 255, 0) 5%,
                rgba(121, 190, 255, 1) 40%,
                rgba(121, 190, 255, 1) 60%,
                rgba(121, 190, 255, 0) 100%
            );
        }
        // #endregion
        
        // #region - блок с иконками и числами наград
        .daily_gift_rewards_block {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            padding-top: 30px;
        }

        .daily_gift_reward {
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            align-items: center;
            gap: 15px;
        }

        .daily_gift_reward_value {
            @include text-info-size-m;
            text-align: center;
            text-transform: uppercase;
        }

        .daily_gift_reward_icon_container {
            z-index: 1;
            // filter: drop-shadow(0 0 .75rem rgba(121, 193, 255, .35));
        }

        .reward_img {
          width: 100%;
          height: 100%;
        }

        .icon_normal_size {
          width: 66px;
          height: 66px;
        }

        .icon_small_size {
          width: 52px;
          height: 52px;
        }

        .icon_fortune_size {
          width: 123px;
          height: 125px;
        }

        // .daily_gift_reward_icon--currency { 
        //     filter: drop-shadow(0 0 .75rem rgba(255, 215, 73, .48)); 
        // }

        // .daily_gift_reward_icon--fortune_spin,
        // .daily_gift_reward_icon--cosmetic,
        // .daily_gift_reward_icon--upgrade { 
        //     filter: drop-shadow(0 0 .8rem rgba(93, 183, 255, .55)); 
        // }

        .card_background_glow {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 82.14%;
            background: radial-gradient(
                circle at center,
                rgba(121, 190, 255, 0.45) 0%,
                rgba(121, 190, 255, 0.25) 30%,
                rgba(121, 190, 255, 0) 65%
            );
        }
        // #endregion
    
    // #endregion

    // #region - блок с подсказками (под карточками)
        .daily_gift_tips_block {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }

        .text_claimed {
            @include text-info-size-s;
            color: $color-yellow-super-light;
            text-transform: uppercase;
            white-space: pre-line;
        }
        
        .text_week_caption {
            @include text-info-size-s;
            color: $color-pink;
            text-transform: uppercase;
        }
    // #endregion

        




    .daily-gift {
        justify-content: flex-start;
        padding-top: clamp(14rem, 40vh, 29rem);
        // background: radial-gradient(ellipse at 50% 55%, rgba(40, 75, 105, .2), transparent 45%), rgba(0, 0, 0, .72);
    }

    .daily-gift {
        position: static;
        margin: 0 0 clamp(.7rem, 1.6vh, 1.25rem);
    }

    .daily-gift__error,
    .daily-gift__status {
        @include text-info-size-s;
        margin: 0;
        text-transform: uppercase;
    }

    .daily-gift__status {
        color: $color-blue-light;
    }

    .daily-gift__error {
        color: $color-red-light;
        margin-top: 1rem;
    }

    .daily-gift__week-tabs {
        display: flex;
        gap: .55rem;
        margin-bottom: clamp(.8rem, 2vh, 1.4rem);
    }

    .daily-gift__week-tab {
        min-width: 2.25rem;
        padding: .35rem .65rem;
        border: 1px solid rgba(114, 179, 238, .35);
        background: rgba(3, 12, 22, .55);
        color: $color-gray;
        cursor: pointer;
        font-family: 'vla_shu';
    }

    .daily-gift__week-tab.active {
        color: $color-blue-light;
        border-color: $color-blue-light;
        box-shadow: 0 0 .9rem rgba(80, 170, 255, .35);
    }

    .daily_gift_card.available {
        border-color: $color-blue-light;
        filter: drop-shadow(0 0 .3rem $color-blue-light);
    }

    .daily-gift__bonus {
        position: absolute;
        right: .55rem;
        bottom: .45rem;
        @include text-info-size-s;
        color: $color-blue-light;
    }

    .daily-gift__status {
        position: absolute;
        top: .5rem;
        right: .55rem;
        color: $color-blue-light;
    }

    .daily-gift__status--claimed {
        color: $color-green-light;
        font-weight: 700;
        font-size: 1.35em;
    }

    .daily-gift__claim,
    .daily-gift__double,
    .daily-gift__recover,
    .daily-gift__back {
        @include text-button-size-s;
        color: $color-yellow-super-light;
    }

    .daily-gift__claim {
        margin-top: 1.8rem;
    }

    .daily-gift__back {
        position: absolute;
        bottom: 5.556vh;
        color: $color-blue-light;
    }

    .daily-gift__double:disabled,
    .daily-gift__claim:disabled,
    .daily-gift__recover:disabled,
    .daily-gift__back:disabled {
        opacity: 0.45;
        cursor: default;
    }

    .daily-gift__double { 
        margin-top: 0.7rem; 
    }

    .daily-gift__recovery {
        @include text-info-size-s;
        max-width: min(36rem, 90vw);
        margin-top: 1rem;
        color: $color-blue-light;
        text-align: center;

        p { margin: 0.5rem 0; }
    }
</style>
