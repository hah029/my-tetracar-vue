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
                    <div class="card_background_glow" :class="setBgGlow(day)"></div>

                    <!-- Лучи за иконками -->
                    <div v-if="checkDayPrize(day)" class="rays_image_container">
                        <img v-if="checkRaysType(day) == 1" class='rays_image' src="@/assets/images/business/gift_rays1.svg" />
                        <img v-else-if="checkRaysType(day) == 2" class='rays_image' src="@/assets/images/business/gift_rays2.svg" />
                        <img v-else-if="checkRaysType(day) == 3" class='rays_image' src="@/assets/images/business/gift_rays3.svg" />
                        <img v-else-if="checkRaysType(day) == 4" class='rays_image' src="@/assets/images/business/gift_rays4.svg" />
                    </div>

                    <!-- Титул -->
                    <div class="daily_gift_title_block">
                        <span class="daily_gift_title">{{ t("dailyGift.day", { day }) }}</span>
                        <span class="daily_gift_separator"></span>
                    </div>

                    <!-- Блок с иконками и числами наград -->
                    <div class="daily_gift_rewards_block_wrapper" :style="setRewardsWrapperStyle(day)">
                        
                        <div class="daily_gift_rewards_block">
                            <div v-for="(reward, rewardIndex) in getRewards(day)" :key="rewardIndex" class="daily_gift_reward">
                                
                                <div 
                                    class="daily_gift_reward_icon_container" 
                                    :class="setGiftIconSize(reward, getRewards(day).length)"
                                    :style="setRewardIconGlow(reward)"
                                >
                                    <EnergonIcon v-if="reward.effect?.currency === 'energon'"/>
                                    <img v-else class="reward_img" :src="getRewardIcon(reward)" />
                                </div>
    
                                <span 
                                    v-if="reward.type != 'fortune_spin'" 
                                    class="daily_gift_reward_value" 
                                    :style="setGiftValueStyle(reward)"
                                >
                                    {{ getRewardAmount(reward) }}
                                </span>
                                
                            </div>
                        </div>

                        <!-- Таймер обратного отсчета -->
                        <div v-if="day == 2" class="countdown_timer">
                            05 : 26 : 59
                        </div>

                    </div>

                    <!-- Рекламный бонус (x2) -->
                    <div v-if="canDoubleDailyGift(day)" class="advertisement_block">
                        <span class="advertisement_text">×2</span>
                        <div class="advertisement_image_container">
                            <img class='rays_image' src="@/assets/images/business/advertisement_icon.svg" />
                        </div>
                    </div>

                    <div v-if="day == 7" class="level_value">
                        <span class="level_value_1">1</span>
                        <span class="level_value_2">ур.</span>
                    </div>

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

    import EnergonIcon from "@/components/icons/EnergonIcon.vue";

    import goldenIcon from "@/assets/images/hud/cube_golden.svg";
    import ammoIcon from "@/assets/images/hud/cube_bullet.svg";
    import armorIcon from "@/assets/images/hud/cube_armor.svg";
    import dailyIcon from "@/assets/images/cube_buttons/btn_desktop_daily_bonus.svg";
    import skinIcon1 from "@/assets/images/business/gift_skin1_icon.png";
    import skinIcon2 from "@/assets/images/business/gift_skin2_icon.png";
    import skinIcon3 from "@/assets/images/business/gift_skin3_icon.png";
    import skinIcon4 from "@/assets/images/business/gift_skin4_icon.png";
    import wheelIcon from "@/assets/images/business/fortune_wheel_icon.png";
    
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

    // проверяем на тип приза: Колесо фортуны или Скин (если да, то показываем лучи)
    function checkDayPrize(day_) {
        const prizeType = getRewards(day_)[0].type;
        return (prizeType == 'fortune_spin' || prizeType == 'cosmetic') ? true : false;
    };

    // проверяем на тип приза: Колесо фортуны или Скин (если да, то показываем лучи)
    function checkRaysType(day_) {
        const prizeType = getRewards(day_)[0].type;

        if (prizeType == 'fortune_spin') {
            return 1;
        } else {
            const skinId = getRewards(day_)[0].effect.skinId;
            if (skinId == 'basic1') {
                return 1;
            } else if (skinId == 'basic2') {
                return 2;
            } else if (skinId == 'premium1') {
                return 3;
            } else if (skinId == 'premium2') {
                return 4;
            };
        };
    };

    // получаем текст под иконкой награды (или число в формате выбранного языка)
    function getRewardAmount(reward: RewardDefinition): string {
        let newString = '';
        if (reward.type === "cosmetic") {
            newString = t("dailyGift.skin");

        } else if (reward.type === "upgrade") {
            newString = t("dailyGift.upgrade");

        } else {
            newString = String(reward.effect?.amount ?? 1);
            newString = formatScore(Number(newString));
        };
        
        return newString;
    };

    // 
    function setRewardsWrapperStyle(day_) {
        const calcMarginTop = day_ == 2 ? 0 : 30;

        return {
            marginTop: `${calcMarginTop}px`,
        }
    };

    // загружаем нужное изображение для иконки награды
    function getRewardIcon(reward_) {
        if (reward_.type == 'currency') {
            return goldenIcon;
        } else if (reward_.type == 'ammo') {
            return ammoIcon;
        } else if (reward_.type == 'armor') {
            return armorIcon;
        } else if (reward_.type == 'fortune_spin') {
            return wheelIcon;
        } else if (reward_.type == 'cosmetic') {
            if (reward_.effect.skinId == 'basic1') {
                return skinIcon1;
            } else if (reward_.effect.skinId == 'basic2') {
                return skinIcon2;
            } else if (reward_.effect.skinId == 'premium1') {
                return skinIcon3;
            } else if (reward_.effect.skinId == 'premium2') {
                return skinIcon4;
            };
        } else if (reward_.type == 'upgrade') {
            return dailyIcon;
        } else {
            return dailyIcon;
        };
    };

    // приводим в нужный формат очки игрока (с учетом его страны) 
    // (дублируется с такой же функцией в LeaderBoarsRoot.vue - позже вынести как универсальную)
    function formatScore(score: number) {
        const locale = i18next.language || "ru-RU";
        return Math.floor(score).toLocaleString(locale);
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

    // -----------------
    // #region - стили
        // назначаем габариты иконкам наград
        function setGiftIconSize(reward_, rewardsCount_) {
            if (reward_.type == 'cosmetic') {
                return 'icon_skin_size';
            } else if (reward_.type == 'fortune_spin') {
                return 'icon_fortune_size';
            } else if (rewardsCount_ == 1) {
                return 'icon_normal_size';
            } else {
                return 'icon_small_size';
            };
        };

        // назначаем стиль подписи под иконками наград
        function setGiftValueStyle(reward_) {
            let newColor = '';
            
            if (reward_.type == 'currency') {
                newColor = reward_.effect.currency == 'golden' ? 'FFF5AD' : 'D7FBFF';

            } else if (reward_.type == 'ammo') {
                newColor = 'FFC3C5';

            } else if (reward_.type == 'armor') {
                newColor = 'FFFFFF';

            } else if (reward_.type == 'cosmetic') {
                const skinId = reward_.effect.skinId;

                if (skinId == 'basic1') {
                    newColor = '79BEFF';
                } else if (skinId == 'basic2') {
                    newColor = 'FF6E6E';
                } else if (skinId == 'premium1') {
                    newColor = 'FFF080';
                } else if (skinId == 'premium2') {
                    newColor = 'F477FF';
                };
            };

            return {
                color: `#${newColor}`,
            };
        };

        // придаем свечение иконкам наград
        function setRewardIconGlow (reward_) {
            let filterColor = '';

            if (reward_.type == 'currency') {
                if (reward_.effect.currency == 'golden') {
                    filterColor = '255, 220, 20';
                };

            } else if (reward_.type == 'ammo') {
                filterColor = '255, 116, 121';

            } else if (reward_.type == 'armor') {
                filterColor = '255, 255, 255';
            };
            
            return {
                filter: `drop-shadow(0 0 10px rgba(${filterColor}, 0.3))`
            };
        };

        // меняем цвет свечения заднего плана карточки
        function setBgGlow(day_) {
            const prizeType = getRewards(day_)[0].type;

            if (prizeType != 'cosmetic') {
                return 'background_glow_blue';
            } else {
                const skinId = getRewards(day_)[0].effect.skinId;
                if (skinId == 'basic1') {
                    return 'background_glow_blue';
                } else if (skinId == 'basic2') {
                    return 'background_glow_red';
                } else if (skinId == 'premium1') {
                    return 'background_glow_yellow';
                } else if (skinId == 'premium2') {
                    return 'background_glow_pink';
                };
            };
        };
    // #endregion
    // -----------------

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
        .daily_gift_rewards_block_wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            // padding-top: 30px;
        }

        .daily_gift_rewards_block {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
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
            line-height: 1;
        }

        .daily_gift_reward_icon_container {
            z-index: 1;
        }

        .reward_img {
            width: 100%;
            height: 100%;
        }

        .icon_normal_size {
            width: 66px;
            height: 66px;
            margin-bottom: 5px;
        }

        .icon_small_size {
            width: 52px;
            height: 52px;
            margin-bottom: 5px;
        }

        .icon_fortune_size {
            width: 123px;
            height: 125px;
        }

        .icon_skin_size {
            width: 103px;
            height: 120px;
            margin-bottom: -15px;
        }

        // .daily_gift_reward_icon--currency { 
        //     filter: drop-shadow(0 0 .75rem rgba(255, 215, 73, .48)); 
        // }

        // .daily_gift_reward_icon--fortune_spin,
        // .daily_gift_reward_icon--cosmetic,
        // .daily_gift_reward_icon--upgrade { 
        //     filter: drop-shadow(0 0 .8rem rgba(93, 183, 255, .55)); 
        // }
        // #endregion
        
        // #region - изображения на фоне карточки
        .card_background_glow {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 82.14%;
        }

        .background_glow_blue {
            background: radial-gradient(
                circle at center,
                rgba(121, 190, 255, 0.45) 0%,
                rgba(121, 190, 255, 0.25) 30%,
                rgba(121, 190, 255, 0) 65%
            );
        }

        .background_glow_red {
            background: radial-gradient(
                circle at center,
                rgba(255, 121, 121, 0.45) 0%,
                rgba(255, 121, 121, 0.25) 30%,
                rgba(255, 121, 121, 0) 65%
            );
        }

        .background_glow_yellow {
            background: radial-gradient(
                circle at center,
                rgba(255, 228, 121, 0.45) 0%,
                rgba(255, 228, 121, 0.25) 30%,
                rgba(255, 228, 121, 0) 65%
            );
        }

        .background_glow_pink {
            background: radial-gradient(
                circle at center,
                rgba(253, 151, 255, 0.45) 0%,
                rgba(253, 151, 255, 0.25) 30%,
                rgba(253, 151, 255, 0) 65%
            );
        }

        .rays_image_container {
            position: absolute;
            top: 40px;
            width: 270px;
            height: 270px;
        }

        .rays_image {
            width: 100%;
            height: 100%;
        }
        // #endregion

        // #region - текст с уровнем скина на карточке
        .level_value {
            position: absolute;
            top: 98px;
            right: 35px;
            display: flex;
            justify-content: flex-end;
            align-items: flex-end;
            gap: 4px;
            color: $color-hard-blue;
        }

        .level_value_1 {
            @include text-info-size-m;
            line-height: 1;
            font-weight: 600
        }

        .level_value_2 {
            @include text-info-size-s;
            line-height: 1;
        }
        // #endregion

        // #region - таймер
        .countdown_timer {
            display: flex;
            justify-content: center;
            @include text-info-size-m;
            color: $color-pink;
            line-height: 1;
            filter: drop-shadow(0 0 10px rgba(247, 156, 255, 1));
        }
        // #endregion

        // #region - значок с рекламой
        .advertisement_block {
            position: absolute;
            bottom: 16px;
            right: 16px;
            display: flex;
            justify-content: flex-end;
            align-items: flex-end;
            gap: 4px;
            opacity: 0.5;
        }
        
        .advertisement_text {
            @include text-info-size-s;
            color: $color-hard-blue;
            line-height: 0.7;
        }

        .advertisement_image_container {
            width: 20px;
            height: 20px;
        }

        .advertisement_image {
            width: 100%;
            height: 100%;
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
