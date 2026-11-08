<template>
    <div
        class="currency_block"
        :class="[ `currency_block--${variant}`, { 'currency_block--clickable': isClickable }, ]"
        :role="isClickable ? 'button' : undefined"
        :tabindex="isClickable ? 0 : undefined"
        @click="handleClick"
        @keydown.enter.prevent="handleClick"
    >
        <div class="currency_subblock" :class="{ 'currency_subblock--pulse': pulseGoldens }">
            <div class="currency_value goldens">{{ displayedGoldens }}</div>
            <div ref="goldensIconRef" class="currency_image_container">
                <img class="icon" src="@/assets/images/hud/cube_golden.svg" />
            </div>
        </div>

        <div class="currency_subblock" :class="{ 'currency_subblock--pulse': pulseEnergons }">
            <div class="currency_value energons">{{ displayedEnergons }}</div>
            <div ref="energonsIconRef" class="currency_image_container energon_glow_general">
                <img class="icon icon_abs" src="@/assets/images/hud/cube_energon_grid_backward.svg" />
                <img class="icon icon_abs energon_glow_core" src="@/assets/images/hud/cube_energon_core.svg" />
                <img class="icon icon_abs energon_glow_grid" src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
            </div>
        </div>

        <!-- Плюсик (только в не-HUD вариантах (клик → магазин: вкладка "Валюта")) -->
        <!-- <div v-if="variant === 'menu'" class="currency_plus" aria-hidden="true">+</div> -->
        <div v-if="variant === 'menu'" class="currency_plus" aria-hidden="true">
            <img class="icon plus" src="@/assets/icons/icon_plus.svg" />
        </div>

        <!--
            Область с коэффициентом увеличения очков — только в HUD-варианте.
            Пока не реализовано, слот зарезервирован под будущую фичу.
        -->
        <!-- <div v-if="variant === 'hud'" class="currency_multiplier">...</div> -->
    </div>
</template>


<script setup lang="ts">
    import { computed, nextTick, onMounted, onUnmounted, ref } from "vue";
    import { useMetaStore } from "@/store/metaStore";
    import { useGameState } from "@/store/gameState";
    import { useShopStore } from "@/store/shopStore";
    import { useFlyingRewardsStore, type FlyingRewardType } from "@/store/flyingRewardsStore";
    import { useAnimatedNumber } from "@/composables/useAnimatedNumber";
    import { SoundManager } from "@/game/sound/SoundManager";

    type CurrencyPanelVariant = "hud" | "menu";

    const props = withDefaults(
        defineProps<{ variant?: CurrencyPanelVariant }>(),
        { variant: "menu" },
    );

    const metaStore = useMetaStore();
    const gameState = useGameState();
    const shopStore = useShopStore();
    const isClickable = computed(() => props.variant === "menu");

    const flyingStore = useFlyingRewardsStore();
    const pulseGoldens = ref(false);
    const pulseEnergons = ref(false);
    const goldensIconRef = ref<HTMLDivElement | null>(null);
    const energonsIconRef = ref<HTMLDivElement | null>(null);

    // Счётчики: пока летит хотя бы одна награда данного типа — держим,
    //      (по прилёту анимируем скачок к актуальному значению)
    const { displayed: displayedGoldens, release: releaseGoldens } = useAnimatedNumber(
        computed(() => metaStore.goldens),
        { shouldHold: () => flyingStore.isPending("golden") },
    );

    const { displayed: displayedEnergons, release: releaseEnergons } = useAnimatedNumber(
        computed(() => metaStore.energons),
        { shouldHold: () => flyingStore.isPending("energon") },
    );

    // Троттлинг пульсации: в игровом режиме монеты подбираются часто,
    //      (пульс на каждую монету был бы слишком навязчивым)
    let lastPulseGoldens = 0;
    let lastPulseEnergons = 0;

    function triggerPulse(type: FlyingRewardType) {
        const now = performance.now();
        if (type === "golden") {
            if (now - lastPulseGoldens < 200) return;
            lastPulseGoldens = now;
            pulseGoldens.value = false;
            nextTick(() => {
                pulseGoldens.value = true;
                setTimeout(() => { pulseGoldens.value = false; }, 700);
            });
        } else {
            if (now - lastPulseEnergons < 200) return;
            lastPulseEnergons = now;
            pulseEnergons.value = false;
            nextTick(() => {
                pulseEnergons.value = true;
                setTimeout(() => { pulseEnergons.value = false; }, 700);
            });
        };
    };

    // Подписка на прилёт спрайтов.
    let unsubscribeLanded: (() => void) | null = null;

    function handleClick(e: MouseEvent) {
        if (!isClickable.value) return;

        SoundManager.getInstance().playCue("uiSelect");

        shopStore.setView("currency");
        gameState.openShop();

        // снимаем фокус, чтобы при нажатии физических клавиш
        // браузер не подсвечивал панель через :focus-visible
        (e.currentTarget as HTMLElement | null)?.blur();
    };

    onMounted(() => {
        if (goldensIconRef.value)  flyingStore.setTarget("golden",  goldensIconRef.value);
        if (energonsIconRef.value) flyingStore.setTarget("energon", energonsIconRef.value);

        unsubscribeLanded = flyingStore.onLanded((type) => {
            if (type === "golden") {
                releaseGoldens();
                triggerPulse("golden");
            } else {
                releaseEnergons();
                triggerPulse("energon");
            };
        });
    });

    onUnmounted(() => {
        if (unsubscribeLanded) unsubscribeLanded();
        if (flyingStore.targetElements.golden  === goldensIconRef.value)  flyingStore.setTarget("golden",  null);
        if (flyingStore.targetElements.energon === energonsIconRef.value) flyingStore.setTarget("energon", null);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss" as *;
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;
    @use "@/styles/mixins" as *;

    $icon-size: 2.3125rem;

    .currency_block {
        position: absolute;
        top: 30px;
        right: 50px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
        z-index: z("currency");
    }

    // Кликабельная версия (variant === 'menu')
    .currency_block--clickable {
        pointer-events: auto;
        cursor: pointer;
        transition: filter 0.15s ease-in-out;

        &:hover {
            filter: drop-shadow(0 0 12px rgba(114, 179, 238, 0.6));
        }

        &:hover .currency_plus {
            transform: scale(1.08);
            border-color: $color-yellow-light;
            color: $color-yellow-light;
        }

        &:focus-visible {
            outline: 2px solid rgba(132, 210, 255, 0.8);
            outline-offset: 6px;
        }
    }

    .currency_subblock {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 10px;
        transform-origin: right center;
    }

    .currency_subblock--pulse {
        animation: currency_subblock_pulse 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    }

    @keyframes currency_subblock_pulse {
        0%   { transform: scale(1);     filter: brightness(1); }
        18%  { transform: scale(1.18);  filter: brightness(1.75) drop-shadow(0 0 14px rgba(255, 245, 173, 0.95)); }
        55%  { transform: scale(1.05);  filter: brightness(1.3)  drop-shadow(0 0 8px  rgba(255, 245, 173, 0.55)); }
        100% { transform: scale(1);     filter: brightness(1); }
    }

    .currency_value {
        text-align: right;
        @include text-info-size-s;
        // min-width: 3ch;
        // font-feature-settings: "tnum";
        // font-variant-numeric: tabular-nums;
        white-space: nowrap;
        transition: width 0.1s ease;
    }

    .currency_value.goldens {
        color: $color-yellow-light;
    }

    .currency_value.energons {
        color: $color-blue-light;
    }

    .currency_image_container {
        width: 30px;
        height: 30px;
        position: relative;
    }

    .energon_glow_general {
        // filter: drop-shadow(0 0 0.44rem rgb(43, 157, 229));
        filter: drop-shadow(0 0 5px rgba(43, 157, 229, 0.6));
    }

    .energon_glow_grid {
        filter: drop-shadow(0 0 1.25rem rgb(20, 212, 255));
    }

    .energon_glow_core {
        filter: drop-shadow(0 0 0.625rem rgb(20, 212, 255));
    }

    

    .icon_abs {
        position: absolute;
        top: 0;
        left: 0;
    }

    

    .currency_plus {
        position: absolute;
        top: -12px;
        right: -20px;
        width: 12px;
        height: 12px;
        opacity: 0.7;
        transition: all 0.15s ease-in-out;
        @include unselectable;
    }

    .icon {
        width: 100%;
    }
    .icon.plus {
        filter: invert(98%) sepia(4%) saturate(25%) hue-rotate(76deg) brightness(112%) contrast(94%);
    }
</style>