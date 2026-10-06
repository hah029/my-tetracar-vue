<template>
    <div class="container daily_gift">
        <Transition name="header_footer_block_anim">
            <div v-if="isHeaderShown" class="header_block">
                <div class="header_text">
                    {{ t("dailyGift.title") }}
                </div>
                <div class="header_image"><img class="image" src="@/assets/images/title_line_image.svg" /></div>
            </div>
        </Transition>

        <div class="daily_gift_content">

            <!-- Блок с карточками -->
            <div class="daily_gift_cards_block">

                <!-- Стрелки переключения недель (по бокам) — обёрнуты в свой Transition -->
                <Transition name="arrow_anim">
                    <div v-if="selectedWeek > 1 && areTipsShown" class="arrow_big_image_container left_arrow" @click="selectWeek(-1)">
                        <img class='arrow_big_image' src="@/assets/images/arrow_big.svg" />
                    </div>
                </Transition>

                <Transition name="arrow_anim">
                    <div v-if="selectedWeek < 4 && areTipsShown" class="arrow_big_image_container right_arrow" @click="selectWeek(1)">
                        <img class='arrow_big_image' src="@/assets/images/arrow_big.svg" />
                    </div>
                </Transition>

                <!-- Обёртка блока карточек (фиксированной высоты) -->
                <div class="daily_gift_cards_wrapper">
                    <TransitionGroup 
                        :name="transitionMode === 'initial' ? 'buttons_group_showing' : 'week_switching'" 
                        tag="div" 
                        class="daily_gift_cards_container"
                        :class="{ 'switch-left': transitionMode === 'switch-left', 'switch-right': transitionMode === 'switch-right' }"
                    >
                        <!-- Карточка -->
                        <div v-for="(day, index) in weekDays" :key="day" 
                            v-if="isGiftCardShown"
                            class="daily_gift_card" :class="cardStates[index]"
                            :aria-current="day === selectedDay ? 'true' : undefined" 
                            :style="{ animationDelay: `${index * switchingDelay}s` }"
                            role="button" 
                            tabindex="0" 
                            @click="selectDay(day)"
                            @keydown.enter="selectDay(day)"
                        >
                            <!-- Свечение за иконками -->
                            <div class="card_background_glow" :class="setBgGlow(index, day)"></div>

                            <!-- Лучи за иконками -->
                            <div v-if="checkDayPrize(index, day)" class="rays_image_container">
                                <img v-if="checkRaysType(day) == 1" class='rays_image' src="@/assets/images/business/gift_rays1.svg" />
                                <img v-else-if="checkRaysType(day) == 2" class='rays_image' src="@/assets/images/business/gift_rays2.svg" />
                                <img v-else-if="checkRaysType(day) == 3" class='rays_image' src="@/assets/images/business/gift_rays3.svg" />
                                <img v-else-if="checkRaysType(day) == 4" class='rays_image' src="@/assets/images/business/gift_rays4.svg" />
                                <img v-else class='rays_image' src="@/assets/images/business/gift_rays5.svg" />
                            </div>

                            <!-- Титул -->
                            <div class="daily_gift_title" :class="cardStates[index]">{{ t("dailyGift.day", { day }) }}</div>

                            <!-- Блок с иконками и числами наград -->
                            <div class="daily_gift_rewards_block_wrapper" :class="cardStates[index]">
                                <div class="daily_gift_rewards_block">
                                    <div v-for="(reward, rewardIndex) in rewardsList[index]" :key="rewardIndex" class="daily_gift_reward">
                                        <div 
                                            class="daily_gift_reward_icon_container" 
                                            :class="setGiftIconSize(reward, rewardsList[index].length)"
                                            :style="setRewardIconGlow(reward, day)"
                                        >
                                            <EnergonIcon v-if="reward.effect?.currency === 'energon'"/>
                                            <img v-else class="reward_img" :class="setImgLevitation(reward, day)" :src="getRewardIcon(reward)" />
                                        </div>
            
                                        <span v-if="reward.type != 'fortune_spin'" class="daily_gift_reward_value" :style="setGiftValueStyle(reward)">
                                            {{ getRewardAmount(reward) }}
                                        </span>
                                    </div>
                                </div>

                                <!-- Таймер обратного отсчета -->
                                <div v-if="cardStates[index] === 'next'" class="countdown_timer">{{ timerText }}</div>
                            </div>

                            <!-- Рекламный бонус (x2) -->
                            <div v-if="canDoubleDailyGift(day) && cardStates[index] !== 'available'" class="advertisement_block">
                                <span class="advertisement_text" :class="cardStates[index]">×2</span>
                                <div class="advertisement_image_container">
                                    <img class='adv_image' :class="cardStates[index]" src="@/assets/images/business/advertisement_icon.svg" />
                                </div>
                            </div>

                            <div v-if="day % 7 == 0" class="level_value" :style="setLevelValueStyle(day)">
                                <span v-if="i18next.resolvedLanguage == 'en'" class="level_value_2 lvl_en">{{ t("dailyGift.levelText") }}</span>
                                <span class="level_value_1">{{ getSkinLevelValue(day) }}</span>
                                <span v-if="i18next.resolvedLanguage == 'ru'" class="level_value_2">{{ t("dailyGift.levelText") }}</span>
                            </div>

                            <!-- Галочка (бонус взят) -->
                            <div v-if="cardStates[index] === 'claimed'" class="checker_image_container">
                                <img class="checker_img" src="@/assets/images/checker.svg" />
                            </div>

                            <!-- Блок кнопок "Забрать" ("Забрать x2") -->
                            <div v-if="cardStates[index] === 'available'" class="claim_buttons_block">
                                <!-- Кнопка х2 -->
                                <div v-if="canDoubleDailyGift(day)" class="claim_double_button">
                                    <span class="menu_btn claim_button small">-</span>
                                    <button 
                                        class="menu_btn claim_button small" 
                                        :disabled="!dailyGift.isReady || dailyGift.isClaiming || dailyGift.isRecovering || !!dailyGift.state.pendingRecovery || selectedDay !== currentDay" 
                                        @click="claimDouble()"
                                    >
                                        {{ foo.makeText("dailyGift.claim", 'empty') }} ×2
                                    </button>
                                    <div class="advertisement_image_container">
                                        <img class='adv_image' :class="cardStates[index]" src="@/assets/images/business/advertisement_icon.svg" />
                                    </div>
                                    <span class="menu_btn claim_button small">-</span>
                                </div>
                                <!-- {{ dailyGift.isWatchingAd ? t("dailyGift.watchingAd") : t("dailyGift.claimDouble") }} -->
                                
                                <!-- Обычная кнопка -->
                                <button 
                                    :class="['menu_btn claim_button', { 'small pink': canDoubleDailyGift(day) }]" 
                                    :disabled="!dailyGift.isReady || dailyGift.isClaiming || dailyGift.isRecovering || !!dailyGift.state.pendingRecovery || selectedDay !== currentDay" 
                                    @click="claim()"
                                >
                                    {{ foo.makeText("dailyGift.claim") }}
                                </button>
                                
                            </div>

                            <!-- Рамки -->
                            <div v-if="cardStates[index] !== 'claimed'" class="daily_gift_card_corners_group">
                                <div class="daily_gift_card_corner corner_top_left" :class="cardStates[index]"></div>
                                <div class="daily_gift_card_corner corner_top_right" :class="cardStates[index]"></div>
                                <div class="daily_gift_card_corner corner_bottom_left" :class="cardStates[index]"></div>
                                <div class="daily_gift_card_corner corner_bottom_right" :class="cardStates[index]"></div>
                            </div>
                        </div>
                    </TransitionGroup>
                </div>
            </div>

            <!-- Блок с подсказками (под карточками) -->
            <Transition name="header_footer_block_anim">
                <div v-if="areTipsShown" class="daily_gift_tips_block">
                    <div :class="['text_claimed', { 'text_claimed_hidden': isAvailableRewardOnCurrentWeek }]">
                        {{ tipsText }}
                    </div>
                    <div class="text_week_caption">
                        {{ weekName }}
                    </div>
                </div>
            </Transition>

<!-- (позже доделать) -->
<!-- ---------------- -->
            <!-- Блок платного восстановления пропущенных дней, если игрок пропустил 1–3 дня -->
            <div v-if="dailyGift.recovery.available || dailyGift.state.pendingRecovery" class="daily_gift__recovery">
                <p>
                    {{ t("dailyGift.recoveryInfo", {
                        missed: dailyGift.recovery.missedDays,
                        week: dailyGift.state.pendingRecovery ? Math.ceil(dailyGift.state.pendingRecovery.day / DAILY_GIFT_WEEK_LENGTH) : dailyGift.recovery.week,
                        day: dailyGift.state.pendingRecovery?.day ?? dailyGift.recovery.day,
                    }) }}
                </p>
                <button class="menu_btn daily_gift__recover" :disabled="!dailyGift.canRecover" @click="recover">
                {{ dailyGift.isRecovering ? t("dailyGift.recovering") : dailyGift.state.pendingRecovery
                    ? t("dailyGift.retryRecovery") : t("dailyGift.recover", { cost: dailyGift.recovery.cost }) }}
                </button>
                <p v-if="!dailyGift.state.pendingRecovery && meta.energons < dailyGift.recovery.cost">{{ t("dailyGift.notEnoughEnergons") }}</p>
            </div>

            <!-- Блок с ошибкой (если кнопка «Забрать» не сработает) -->
            <p v-if="dailyGift.error" class="daily_gift__error">{{ t(errorKey) }}</p>
        </div>
<!-- ---------------- -->

        <Transition name="header_footer_block_anim">
            <button v-if="isBackButtonShown" class="menu_btn btn_correction back_button_menu" @click="backButtonClick">
                {{ foo.makeText("mainMenu.goBack") }}
            </button>
        </Transition>
    </div>
</template>


<script setup lang="ts">
    // #region - импорты
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
    // #endregion

    // #region - константы
        const { t } = useTranslation();
        const { i18next } = useTranslation();
        const foo = createNewText();
        const dailyGift = useDailyGiftStore();
        const gameState = useGameState();
        const meta = useMetaStore();
        const days = Array.from({ length: DAILY_GIFT_CYCLE_LENGTH }, (_, index) => index + 1);
        const rewardsList = ref([] as any[]);

        const isHeaderShown = ref(false);
        const isGiftCardShown = ref(false);
        const isBackButtonShown = ref(false);
        const areTipsShown = ref(false);
        const switchingDelay = ref(0.05);

        const transitionMode = ref<'initial' | 'switch-left' | 'switch-right'>('initial');
        const isSwitchingWeek = ref(false);
        const isClosing = ref(false);   // защита от повторного вызова, пока идёт закрытие окна

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

        // доступна ли награда, которую можно взять (ещё не взята)
        const isRewardAvailable = computed(() => dailyGift.status.canClaim);

        // неделя, в которой находится доступная награда
        const availableRewardWeek = computed(() => 
            Math.ceil(dailyGift.status.day / DAILY_GIFT_WEEK_LENGTH)
        );

        // игрок находится на неделе с доступной наградой?
        const isAvailableRewardOnCurrentWeek = computed(() => 
            isRewardAvailable.value && selectedWeek.value === availableRewardWeek.value
        );

        // выбор фразы-подсказки (в левом-нижнем углу экрана) при разных сценариях
        const tipsText = computed(() => {
            if (isAvailableRewardOnCurrentWeek.value) return '';
            if (isRewardAvailable.value) return t('dailyGift.claimPrompt');
            return t('dailyGift.claimed');
        });
    // #endregion

    getRewardsList();

    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    watch(
        currentDay, 
        (day) => { 
            selectedDay.value = day; 
        },
    );

    watch(
        weekDays, 
        (days) => { 
            getRewardsList();
        },
    );

    // получаем коллекцию доступных наград за текущую неделю
    function getRewardsList() {
        const newArr = weekDays.value.map((day) => {
            const rewards = getRewards(day);

            // глубокая копия: копируем и сам reward, и вложенный effect
            const copy = rewards.map((reward) => ({
                ...reward,
                effect: reward.effect ? { ...reward.effect } : reward.effect,
            }));

            // склейка задвоенных наград внутри одной карточки
            if (copy.length > 1) {
                const [a, b] = copy;
                if (a.type === b.type && a.effect?.amount === b.effect?.amount) {
                    return [{
                        ...a,
                        effect: { ...a.effect, amount: a.effect.amount * 2 },
                    }];
                };
            };

            return copy;
        });
        
        rewardsList.value = newArr;
    };

    // получаем массив доступных наград за конкретный день
    function getRewards(day: number) {
        return dailyGift.getDisplayRewards(day);
    };

    // проверяем на тип приза: Колесо фортуны или Скин (если да, то показываем лучи)
    function checkDayPrize(index_, day_) {
        const { canClaim, day: availableDay } = dailyGift.status;

        if (day_ < availableDay || (!canClaim && day_ === availableDay)) {
            return;
        } else if (canClaim && day_ === availableDay) {
        // включаем лучи если награда готова к получению
            return true;
        } else {
        // включаем лучи если награда еще не была получена (только Колесо фортуны и Скин)
            const prizeType = rewardsList.value[index_][0].type;
            return (prizeType == 'fortune_spin' || prizeType == 'cosmetic') ? true : false;
        };
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

    // получаем значение уровня скина машинки
    function getSkinLevelValue(day_) {
        return day_ / 7;
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
            if (reward_.effect.skinId == 'basic1') return skinIcon1;
            else if (reward_.effect.skinId == 'basic2') return skinIcon2;
            else if (reward_.effect.skinId == 'premium1') return skinIcon3;
            else if (reward_.effect.skinId == 'premium2') return skinIcon4;
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

    // переключаем недели (клики по стрелкам Вправо / Влево)
    function selectWeek(direction_: number) {
        if (isSwitchingWeek.value) return;
        isSwitchingWeek.value = true;

        // указываем направление
        transitionMode.value = direction_ > 0 ? 'switch-left' : 'switch-right';

        // запускаем leave-анимацию
        isGiftCardShown.value = false;

        // ждём полного завершения leave-анимации (400ms + запас)
        setTimeout(() => {
            let newWeek = selectedWeek.value + direction_;
            const day = (newWeek - 1) * DAILY_GIFT_WEEK_LENGTH + 1;
            selectDay(day);

            // небольшая задержка, чтобы Vue обновил DOM с новыми ключами
            setTimeout(() => {
                // запускаем enter-анимацию
                isGiftCardShown.value = true;

                // сбрасываем режим только ПОСЛЕ завершения enter-анимации
                setTimeout(() => {
                    isSwitchingWeek.value = false;
                    transitionMode.value = 'initial';
                }, 300); // длительность enter-анимации + запас
            }, 50);
        }, 300); // длительность leave-анимации + запас
    };

    // переключаем день
    function selectDay(day: number) {
        if (day < 1 || day > DAILY_GIFT_CYCLE_LENGTH) return;
        selectedDay.value = day;
    };

    // обработчик клавиш
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

    // #region - функции таймера
        const secondsLeft = ref(0);
        const timerText = ref('');
        let timerInterval: ReturnType<typeof setInterval> | null = null;

        // вычисление остатка секунд до ближайшей полуночи
        function calcSecondsUntilLocalMidnight(): number {
            const now = new Date();
            const tomorrow = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate() + 1,
                0, 0, 0, 0
            );
            return Math.max(0, Math.floor((tomorrow.getTime() - now.getTime()) / 1000));
        };

        // запуск таймера
        function startNextTimer() {
            stopNextTimer();
            secondsLeft.value = calcSecondsUntilLocalMidnight();
            timerText.value = formatTimer(secondsLeft.value);

            timerInterval = setInterval(() => {
                secondsLeft.value = Math.max(0, secondsLeft.value - 1);
                timerText.value = formatTimer(secondsLeft.value);

                if (secondsLeft.value <= 0) {
                    stopNextTimer();
                    // сброс дня наступил — обновляем статус, чтобы карточки пересчитались
                    dailyGift.refreshStatus();
                };
            }, 1000);
        };

        // оставнока таймера
        function stopNextTimer() {
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            };
        };

        // преобразуем число с секундами в строковое значение
        function formatTimer(total: number): string {
            const hours   = Math.floor(total / 3600);
            const minutes = Math.floor((total % 3600) / 60);
            const seconds = total % 60;
            const pad = (n: number) => (n < 10 ? "0" + n : String(n));

            return `${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
        };
    // #endregion

    // #region - стили и классы
        // назначаем стили элементам (через computed вместо функции):
            //      1. подписям и линиям подчеркивания в титуле карточки
            //      2. надписи "x2" в рекламном блоке
            //      3. иконке в рекламном блоке    
        const cardStates = computed(() => {
            const { canClaim, day: availableDay } = dailyGift.status;
            return weekDays.value.map((day) => {
                if (canClaim && day === availableDay) return 'available';
                if (day < availableDay || (!canClaim && day === availableDay)) return 'claimed';
                if (!canClaim && day === availableDay + 1) return 'next';
                return 'ordinary';
            });
        });

        watch(
            () => cardStates.value.some((s) => s === 'next'),
            (hasNext) => {
                if (hasNext) startNextTimer();
                else stopNextTimer();
            },
            { immediate: true }
        );

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
            let textStyle = '';

            if (reward_.type == 'currency') {
                newColor = reward_.effect.currency == 'golden' ? 'FFF5AD' : 'D7FBFF';

            } else if (reward_.type == 'ammo') {
                newColor = 'FFC3C5';

            } else if (reward_.type == 'armor') {
                newColor = 'FFFFFF';

            } else if (reward_.type == 'cosmetic') {
                const skinId = reward_.effect.skinId;
                if (skinId == 'basic1') newColor = '79BEFF';
                else if (skinId == 'basic2') newColor = 'FF6E6E';
                else if (skinId == 'premium1') newColor = 'FFF080';
                else if (skinId == 'premium2') newColor = 'F477FF';

            } else if (reward_.type == 'upgrade') {
                // newColor = 'F477FF';
                newColor = 'ffffff';
            };

            textStyle = reward_.type != 'upgrade' ? 'uppercase' : 'auto';

            return {
                color: `#${newColor}`,
                textTransform: textStyle,
            };
        };

        // придаем свечение иконкам наград
        function setRewardIconGlow(reward_, day_) {
            const { canClaim, day: availableDay } = dailyGift.status;
            let filterColor = '';

            if (day_ < availableDay || (!canClaim && day_ === availableDay)) {
                return;
            } else {
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
            }
        };

        // меняем цвет свечения заднего плана карточки
        function setBgGlow(index_, day_) {
            const { canClaim, day: availableDay } = dailyGift.status;
            const gift = rewardsList.value[index_][0];
            const prizeType = gift.type;
            
            if (day_ < availableDay || (!canClaim && day_ === availableDay)) {
                return 'background_glow_none';
            } else if (canClaim && day_ === availableDay) {
                return 'background_glow_yellow';
            } else if (prizeType != 'cosmetic') {
                return 'background_glow_blue';
            } else {
                const skinId = gift.effect.skinId;
                if (skinId == 'basic1') return 'background_glow_blue';
                else if (skinId == 'basic2') return 'background_glow_red';
                else if (skinId == 'premium1') return 'background_glow_light_yellow';
                else if (skinId == 'premium2') return 'background_glow_pink';
            };
        };

        // назначаем цвет уровня скина машинки (в зависимости от номера недели)
        function setLevelValueStyle(day_) {
            const weekNumber = day_ / 7;
            let textColor = '';

            if (weekNumber == 1) textColor = '79BEFF';
            else if (weekNumber == 2) textColor = 'FF6E6E';
            else if (weekNumber == 3) textColor = 'FFF080';
            else if (weekNumber == 4) textColor = 'F477FF';

            return { 
                color: `#${textColor}`,
            };
        };

        // заставляем некоторые иконки левитировать (Колесо фортуны и Скин)
        function setImgLevitation(reward_, day_) {
            const { canClaim, day: availableDay } = dailyGift.status;

            if (day_ < availableDay || (!canClaim && day_ === availableDay)) {
                return;
            } else {
            // включаем левитацию если только награда еще не была получена
                if (reward_.type == 'cosmetic') {
                    return 'flying_img_1';
                } else if (reward_.type == 'fortune_spin') {
                    return 'flying_img_2';
                };
            };
        };
    // #endregion

    // ===== BACK =====
    function backButtonClick() {
        SoundManager.getInstance().playCue("uiSelect");
        switchingDelay.value = 0.03;
        isBackButtonShown.value = false;
        setTimeout(() => { areTipsShown.value = false; }, 100);
        setTimeout(() => { isGiftCardShown.value = false; }, 200);
        setTimeout(() => { isHeaderShown.value = false; }, 450);
        setTimeout(() => { gameState.closeOverlay(); }, 750);
    };

    async function recover() {
        const recovered = await dailyGift.recover();
        SoundManager.getInstance().playCue(recovered ? "uiSelect" : "actionRejected");
    };

    // клик по кнопке "Забрать!"
    async function claim() {
        const claimed = await dailyGift.claim();
        SoundManager.getInstance().playCue(claimed ? "goldenPickup" : "actionRejected");
    };

    // клик по кнопке "Забрать х2!"
    async function claimDouble() {
        const claimed = await dailyGift.claim(true);
        SoundManager.getInstance().playCue(claimed ? "goldenPickup" : "actionRejected");
    };

    // следим за закрытием окна оверлея
    watch(
        () => gameState.overlayCloseRequestId,
        () => {
            if (isClosing.value) return;
            isClosing.value = true;
            backButtonClick();
        },
    );

    onMounted(async () => {
        isHeaderShown.value = true;
        setTimeout(() => { isGiftCardShown.value = true; }, 200);
        setTimeout(() => { areTipsShown.value = true; }, 600);
        setTimeout(() => { isBackButtonShown.value = true; }, 700);

        refreshTimer = setInterval(() => dailyGift.refreshStatus(), 60_000);
        window.addEventListener("keydown", handleKeydown);
    });

    onUnmounted(() => {
        stopNextTimer();
        if (refreshTimer) clearInterval(refreshTimer);
        window.removeEventListener("keydown", handleKeydown);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;
    @use "@/styles/mixins" as *;

    // #region - основное
        .daily_gift {
            padding-top: 18.75vw;   // позже сделать через адаптив
        }
        
        .daily_gift_content {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            gap: 30px;
        }

        .daily_gift_cards_block {
            position: relative;
            display: flex;
            gap: 24px;
            min-height: 280px;
            width: 1544px;
            justify-content: center;
        }

        // обёртка для карточек — держит высоту и центрирует их
        .daily_gift_cards_wrapper {
            height: 280px;
            width: 1544px;                  // фиксируем ширину
            @include flex-c;
            position: relative;
            overflow: visible;
            flex-shrink: 0;                 // запрещаем сжатие
        }

        .daily_gift_cards_container {
            gap: 24px;
            position: relative;
            @include flex-c;
            width: 100%;    
        }

        .header_block {
            margin-bottom: 38px;
        }

        .btn_correction {
            @include text-button-size-s;
            color: $color-yellow-super-light;
        }
    // #endregion

    // #region - карточки наград
        // #region - тело карточки
        .daily_gift_card {
            position: relative;
            min-width: 200px;
            height: 280px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding: 26px 25px;
            box-sizing: border-box;

            background-color: rgba($color: #000000, $alpha: 0.5);
            border: 1px solid rgba(121, 190, 255, 0.6);
            color: $color-gray;
            cursor: pointer;

            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            transition: all 0.2s linear;
        }

        .daily_gift_card:hover {
        // .daily_gift_card:hover, 
        // .daily_gift_card.active {
            transform: translateY(-.25rem);
            border-color: rgba(132, 210, 255, 0.8);
            box-shadow: 0 .5rem 1.8rem rgba(58, 150, 225, .16), inset 0 0 2rem rgba(74, 159, 220, .08);
        }
        .daily_gift_card.available {
            min-width: 220px;
            height: 320px;
            border-color: $color-yellow-light;
            background-color: rgba($color: #5B573B, $alpha: 0.15);
            box-shadow: 0 0 30px rgba(255, 250, 212, 0.35);
        }
        .daily_gift_card.claimed {
            // background-color: none;
            // background-color: transparent;
            border: 1px solid rgba(60, 60, 60, 0.6);
        }
        // #endregion

        // #region - рамки
        .daily_gift_card_corner {
            position: absolute;
            width: var(--body-width);
            height: var(--body-width);
            pointer-events: none;
            border-style: solid;
            border-width: 0;
            border-color: var(--corner-color);
        }

        .corner_top_left { 
            top: var(--body-offset); 
            left: var(--body-offset); 
            border-top-width: var(--corner-width);
            border-left-width: var(--corner-width);
        }

        .corner_top_right { 
            top: var(--body-offset); 
            right: var(--body-offset); 
            border-top-width: var(--corner-width);
            border-right-width: var(--corner-width);
        }

        .corner_bottom_left { 
            left: var(--body-offset); 
            bottom: var(--body-offset); 
            border-left-width: var(--corner-width);
            border-bottom-width: var(--corner-width);
        }

        .corner_bottom_right { 
            right: var(--body-offset); 
            bottom: var(--body-offset); 
            border-right-width: var(--corner-width);
            border-bottom-width: var(--corner-width);
        }

        // модификаторы задают ширину и цвет
        .daily_gift_card_corner.ordinary,
        .daily_gift_card_corner.next {
            --body-width: 15px;
            --body-offset: -2px;
            --corner-width: 3px;
            --corner-color: #{$color-blue};
        }

        .daily_gift_card_corner.available {
            --body-width: 20px;
            --body-offset: -3px;
            --corner-width: 5px;
            --corner-color: #{$color-yellow-light};
        }
        // #endregion

        // #region - титул
        .daily_gift_title {
            position: relative;
            width: 100%;
            min-height: 47px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            border-bottom: 1px solid;

            @include text-info-size-m;
            text-transform: uppercase;
            line-height: 1;
        }

        .daily_gift_title.ordinary,
        .daily_gift_title.next {
            color: $color-yellow-super-light;
            border-image: linear-gradient(
                to right,
                rgba(121, 190, 255, 0) 5%,
                rgba(121, 190, 255, 1) 40%,
                rgba(121, 190, 255, 1) 60%,
                rgba(121, 190, 255, 0) 100%
            ) 1;
        }
        .daily_gift_title.claimed {
            color: $color-gray;
            border-image: linear-gradient(
                to right,
                rgba(94, 94, 94, 0) 5%,
                rgba(94, 94, 94, 1) 40%,
                rgba(94, 94, 94, 1) 60%,
                rgba(94, 94, 94, 0) 100%
            ) 1;
        }
        .daily_gift_title.available {
            @include text-info-size-l;
            color: $color-yellow-light;
            border-image: linear-gradient(
                to right,
                rgba(253, 255, 227, 0) 5%,
                rgba(253, 255, 227, 1) 40%,
                rgba(253, 255, 227, 1) 60%,
                rgba(253, 255, 227, 0) 100%
            ) 1;
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
            margin-top: 30px;
        }
        .daily_gift_rewards_block_wrapper.available, 
        .daily_gift_rewards_block_wrapper.available { margin-top: -15px; } 
        .daily_gift_rewards_block_wrapper.next { margin-top: 10px; }

        .daily_gift_rewards_block_wrapper.claimed { opacity: 0.3; }

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
            gap: 12px;
        }

        .daily_gift_reward_value {
            @include text-info-size-m;
            text-align: center;
            line-height: 1;
        }

        .daily_gift_reward_icon_container {
            z-index: 1;
        }

        .reward_img {
            width: 100%;
            height: 100%;
        }

        .flying_img_1 {
            animation: img_levitation_1 2.5s ease-in-out infinite;
        }

        .flying_img_2 {
            animation: img_levitation_2 2.5s ease-in-out infinite;
        }

        // @keyframes img_levitation_1 {
        //     0% {
        //         transform: translateY(0px);
        //     }
        //     25% {
        //         transform: translateY(-5px);
        //     }
        //     75% {
        //         transform: translateY(5px);
        //     }
        //     100% {
        //         transform: translateY(0px);
        //     }
        // }

        @keyframes img_levitation_1 {
            0% { 
                transform: translateY(5px); 
            }
            50% { 
                transform: translateY(-5px); 
            }
            100% { 
                transform: translateY(5px); 
            }
        }

        @keyframes img_levitation_2 {
            0% { 
                transform: translateY(-5px); 
            }
            50% { 
                transform: translateY(5px); 
            }
            100% { 
                transform: translateY(-5px); 
            }
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
        // #endregion

        // #region - свечения
        .card_background_glow {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 82.14%;
        }

        .background_glow_none {
            background: none;
        }

        .background_glow_blue {
            background: radial-gradient(circle at center, rgba(121, 190, 255, 0.45) 0%, rgba(121, 190, 255, 0.25) 30%, rgba(121, 190, 255, 0) 65%);
        }

        .background_glow_red {
            background: radial-gradient(circle at center, rgba(255, 121, 121, 0.45) 0%, rgba(255, 121, 121, 0.25) 30%, rgba(255, 121, 121, 0) 65%);
        }

        .background_glow_yellow {
            width: 100%;
            height: 104%;
            bottom: -4%;
            background: radial-gradient(
                circle at center,
                rgba(255, 250, 212, 0.9)  0%,    /* #FFFAD4, 100% */
                rgba(255, 250, 212, 0.30) 21%,   /* #FFFAD4, 29%  */
                rgba(255, 250, 212, 0.14) 38%,   /* #FFFAD4, 29%  */
                rgba(255, 250, 212, 0) 70%,   /* #FFFAD4, 6%   */
                rgba(255, 245, 173, 0)    100%   /* #FFF5AD, 0%   */
            );
            
            // background: radial-gradient(
            //     circle at center,
            //     rgba(255, 250, 212, 1)    0%,
            //     rgba(255, 250, 212, 0.55)  15%,
            //     rgba(255, 250, 212, 0.32) 33%,
            //     rgba(255, 250, 212, 0.06) 70%,
            //     rgba(255, 245, 173, 0)    100%
            // );
        }

        .background_glow_light_yellow {
            background: radial-gradient(circle at center, rgba(255, 250, 212, 0.45) 0%, rgba(255, 250, 212, 0.25) 30%, rgba(255, 250, 212, 0) 65%);
        }

        .background_glow_pink {
            background: radial-gradient(circle at center, rgba(253, 151, 255, 0.45) 0%, rgba(253, 151, 255, 0.25) 30%, rgba(253, 151, 255, 0) 65%);
        }

        .rays_image_container {
            position: absolute;
            top: 30px;
            width: 270px;
            height: 270px;
            pointer-events: none;   // чтобы не мешал кликам по карточке
        }

        .rays_image {
            width: 100%;
            height: 100%;
            transform-origin: 50% 50%;  // центр вращения — центр иконки
            animation: rays-rotate 40s linear infinite;
            will-change: transform;     // подсказка браузеру для плавности
        }

        @keyframes rays-rotate {
            from { 
                transform: rotate(0deg); 
            }
            to   { 
                transform: rotate(360deg); 
            }
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
            line-height: 0.8;
        }

        .lvl_en::first-letter {
            text-transform: uppercase;
        }
        // #endregion

        // #region - таймер
        .countdown_timer {
            display: flex;
            justify-content: center;
            margin-bottom: 10px;
            @include text-info-size-m;
            color: $color-pink;
            line-height: 1;
            filter: drop-shadow(0 0 10px rgba(247, 156, 255, 1));
            font-variant-numeric: tabular-nums;
            font-feature-settings: "tnum" 1;
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
            line-height: 0.7;
        }
        .advertisement_text.ordinary,
        .advertisement_text.next { color: $color-hard-blue; }
        .advertisement_text.available { color: $color-yellow-light; }
        .advertisement_text.claimed { color: $color-gray; }

        .advertisement_image_container {
            width: 20px;
            height: 20px;
        }

        .adv_image {
            width: 100%;
            height: 100%;
        }
        .adv_image.ordinary,
        .adv_image.next { filter: invert(63%) sepia(61%) saturate(1006%) hue-rotate(186deg) brightness(105%) contrast(111%); }
        .adv_image.available { filter: invert(87%) sepia(30%) saturate(401%) hue-rotate(356deg) brightness(104%) contrast(102%); }
        .adv_image.claimed { filter: invert(47%) sepia(10%) saturate(17%) hue-rotate(323deg) brightness(93%) contrast(95%); }
        // #endregion

        // #region - кнопки: "Забрать" и "Забрать х2"
        .claim_buttons_block {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 90px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 12px;
        }

        .claim_button {
            @include text-info-size-l;
            color: $color-yellow-light;
            text-transform: uppercase;
            line-height: 1;
            padding: 0;
            transition: all 0.1s ease-in-out;
        }
        .claim_button.small { @include text-info-size-m; }
        .claim_button.pink { 
            color: $color-pink; 

            &:hover {
                color: $color-blue;
                filter: drop-shadow(0 0 1.25rem rgb(140, 186, 229));
                transition: all 0.1s ease-in-out;
            }
        }

        .claim_double_button {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;

            &:hover .claim_button, 
            &:hover .small {
                color: $color-blue;
                filter: drop-shadow(0 0 1.25rem rgb(140, 186, 229));
                transition: all 0.1s ease-in-out;
            }
             &:hover .adv_image {
                filter: invert(63%) sepia(61%) saturate(1006%) hue-rotate(186deg) brightness(105%) contrast(111%);
                transition: all 0.1s ease-in-out;
            }
        }
        // #endregion
    // #endregion

    // #region - блок с подсказками (под карточками)
        .daily_gift_tips_block {
            width: 100%;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            @include unselectable;  
        }
        
        .text_claimed {
            @include text-info-size-s;
            color: $color-yellow-super-light;
            text-transform: uppercase;
            white-space: pre-line;
            transition: all 0.2s linear;
            transition-delay: 0.2s;
        }

        .text_claimed_hidden {
            opacity: 0;
        }
        
        .text_week_caption {
            @include text-info-size-s;
            color: $color-pink;
            text-transform: uppercase;
        }
    // #endregion
    
    // #region - стрелки переключения недель (по бокам)
        .arrow_big_image_container {
            position: absolute;
            top: 100px;
            width: 40px;
            height: 80px;
            cursor: pointer;

            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            transition: all 0.2s linear;
            z-index: 5;

            &:hover {
                scale: 1.1;
                transition: all 0.2s linear;
            }

            &:hover .arrow_big_image {
                filter: invert(97%) sepia(0%) saturate(2788%) hue-rotate(270deg) brightness(121%) contrast(96%);
                transition: all 0.2s linear;
            }
        }

        .left_arrow {
            left: -70px;
        }

        .right_arrow {
            right: -70px;
            rotate: 180deg;
        }

        .arrow_big_image {
            width: 100%;
            height: 100%;
            filter: invert(70%) sepia(10%) saturate(2612%) hue-rotate(180deg) brightness(100%) contrast(103%);
            transition: all 0.2s linear;
        }
    // #endregion

    // #region - иконки
    .checker_image_container {
        position: absolute;
        top: 25px;
        right: 20px;
        width: 24px;
        height: 24px;
    }
    
    .checker_img {
        width: 100%;
        height: 100%;
    }
    // #endregion

    

    .daily_gift__error {
        @include text-info-size-s;
        margin: 0;
        text-transform: uppercase;
    }

    .daily_gift__error {
        color: $color-red-light;
        margin-top: 1rem;
    }



    .daily_gift__claim,
    .daily_gift__double,
    .daily_gift__recover,
    .daily_gift__back {
        @include text-button-size-s;
        color: $color-yellow-super-light;
    }

    .daily_gift__claim {
        margin-top: 1.8rem;
    }

    .daily_gift__back {
        position: absolute;
        bottom: 5.556vh;
        color: $color-blue-light;
    }

    .daily_gift__double:disabled,
    .daily_gift__claim:disabled,
    .daily_gift__recover:disabled,
    .daily_gift__back:disabled {
        opacity: 0.45;
        cursor: default;
    }

    .daily_gift__double { 
        margin-top: 0.7rem; 
    }

    .daily_gift__recovery {
        @include text-info-size-s;
        max-width: min(36rem, 90vw);
        margin-top: 1rem;
        color: $color-blue-light;
        text-align: center;
    }

    .daily_gift__recovery p { margin: 0.5rem 0; }
</style>