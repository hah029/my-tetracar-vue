<template>
    <div class="container" :class="setContainerPos()">
        <div class="shop_container">

            <!-- HEADER -->
            <Transition :name="gameState.currentState == 'menu' ? 'header_footer_block_anim' : ''">
                <div v-if="shopStore.isHeaderShown" class="header_block">

                    <div class="header_text" :class="setHeaderSize()">
                        {{ dynamicTitleName }}
                    </div>

                    <div class="header_image">
                        <img class="image" src="@/assets/images/title_line_image.svg" />
                    </div>

                    <!-- BALANCE -->
                    <div class="balance_block">
                        <div class="balance_subblock">
                            <div class="balance_value font_adaptation color_yellow_light">{{ metaStore.goldens }}</div>
                            <div class="balance_image_container">
                                <img class='icon' src="@/assets/images/hud/cube_golden.svg" />
                            </div>
                        </div>
                        <div class="balance_subblock">
                            <div class="balance_value font_adaptation color_blue_light">{{ metaStore.energons }}</div>
                            <div class="balance_image_container energon_glow_general">
                                <img class='icon icon_abs' src="@/assets/images/hud/cube_energon_grid_backward.svg" />
                                <img class='icon icon_abs energon_glow_core'
                                    src="@/assets/images/hud/cube_energon_core.svg" />
                                <img class='icon icon_abs energon_glow_grid'
                                    src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
                            </div>
                        </div>
                    </div>

                    <!-- TABS -->
                    <div class="tabs">

                        <div class="menu_btn btn_font_size_26"
                            :class="{ tab_active: shopStore.currentView === 'currency' }"
                            @click="shopStore.setView('currency')">
                            {{ foo.makeText("shop.tabList.currency", "Currency") }}
                        </div>

                        <div class="menu_btn btn_font_size_26"
                            :class="{ tab_active: shopStore.currentView === 'stuff' }"
                            @click="shopStore.setView('stuff')">
                            {{ foo.makeText("shop.tabList.stuff", "Stuff") }}
                        </div>

                        <div class="menu_btn btn_font_size_26"
                            :class="{ tab_active: shopStore.currentView === 'visual' }"
                            @click="shopStore.setView('visual')">
                            {{ foo.makeText("shop.tabList.visual", "Visual") }}
                        </div>

                    </div>

                </div>
            </Transition>

            <!-- NOTIFICATION -->
            <Transition name="notification_anim">
                <div v-if="shopStore.notificationMessage" class="notification"
                    :class="'notification--' + shopStore.notificationType">
                    {{
                        foo.makeText(
                            shopStore.notificationMessage,
                            shopStore.notificationMessage
                        )
                    }}
                </div>
            </Transition>

            <!-- CONTENT -->
            <div class="shop_content" v-if="shopStore.activeCatalog.length > 0">
                <!-- CONTENT -->

                <div class="shop_content" v-if="shopStore.activeCatalog.length > 0">

                    <!-- LEFT -->
                    <div class="cards">

                        <div v-for="(item, index) in shopStore.activeCatalog" :key="getItemId(item) + index"
                            class="card" :class="[
                                getCardClasses(item),
                                {
                                    card_selected:
                                        selectedItem &&
                                        getItemId(selectedItem) === getItemId(item)
                                }
                            ]" @click="selectedItem = item">

                            <div class="card__image">
                                <div class="card__image_placeholder">
                                    {{ getItemTitle(item).charAt(0) }}
                                </div>
                            </div>

                            <div class="card__content">

                                <div class="card__top">

                                    <div class="card__title">
                                        {{ getItemTitle(item) }}
                                    </div>


                                    <div v-if="getProductStatus(item) === 'owned'"
                                        class="status_badge status_badge--owned">
                                        OWNED
                                    </div>

                                    <div v-if="item.type === 'upgrade'" class="status_badge status_badge--upgrade">
                                        {{ getUpgradeLevelString(item) }}
                                    </div>

                                    <div v-if="item.type === 'timed_feature' && getTimedProductTimer(item)"
                                        class="status_badge status_badge--timer">
                                        {{ getTimedProductTimer(item) }}
                                    </div>

                                </div>

                                <div class="card__bottom">
                                    <div class="card__price_row">
                                        {{ getItemPrice(item) }}
                                        {{ getItemCurrency(item) }}
                                    </div>
                                </div>

                            </div>

                        </div>

                    </div>

                    <!-- RIGHT -->
                    <div v-if="selectedItem" class="preview">

                        <div class="preview__header">

                            <div class="preview__image">
                                <div class="preview__image_placeholder">
                                    {{ getItemTitle(selectedItem).charAt(0) }}
                                </div>
                            </div>

                            <div class="preview__title">
                                {{ getItemTitle(selectedItem) }}
                            </div>

                            <div v-if="selectedItem.type === 'upgrade'" class="preview__meta">
                                {{ getUpgradeLevelString(selectedItem) }}
                            </div>

                            <div v-if="selectedItem.type === 'timed_feature'" class="preview__meta">
                                {{ getTimedProductTimer(selectedItem) }}
                            </div>

                        </div>

                        <div v-if="getItemDescription(selectedItem)" class="preview__description">
                            {{ getItemDescription(selectedItem) }}
                        </div>

                        <div class="preview__footer">

                            <div v-if="getProductStatus(selectedItem) === 'available'" class="preview__price">
                                {{ getItemPrice(selectedItem) }}
                                {{ getItemCurrency(selectedItem) }}
                            </div>

                            <div v-if="getProductStatus(selectedItem) !== 'available'">

                                <button v-if="
                                    selectedItem.type === 'cosmetic' &&
                                    selectedItem.effect.skinId !== metaStore.activeSkin
                                " class="preview__buy_btn" @click="handleApplyClick(selectedItem)">
                                    APPLY
                                </button>

                                <div v-else-if="
                                    selectedItem.type === 'cosmetic' &&
                                    selectedItem.effect.skinId === metaStore.activeSkin
                                " class="preview__status">
                                    APPLIED
                                </div>

                                <div v-else class="preview__status">
                                    {{
                                        foo.makeText(
                                            getProductStatusLabel(selectedItem),
                                            getProductStatus(selectedItem)
                                        )
                                    }}
                                </div>

                            </div>

                            <button v-else class="preview__buy_btn" @click="handleBuyClick(selectedItem)">
                                BUY
                            </button>

                        </div>

                    </div>
                </div>

            </div>

            <div v-else class="shop_content"
                style="justify-content: center; align-items: center; width: 100%;  font-size: 2rem; color: white;">
                {{ foo.makeText("shop.noItems", "No items available") }}
            </div>

            <!-- BACK -->
            <Transition name="header_footer_block_anim">
                <button v-if="shopStore.isBackButtonShown" class="menu_btn btn_font_size_30" @click="backButtonClick">
                    {{ foo.makeText("mainMenu.goBack") }}
                </button>
            </Transition>

        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { useTranslation } from "i18next-vue";

import { createNewText } from "@/helpers/functions";

import { useGameState } from "@/store/gameState";
import { useShopStore } from "@/store/shopStore";
import { useMetaStore } from "@/store/metaStore";

import type { Product as PurchaseProduct } from "@/purchase/types/Product";
import meta from "@/configs/meta";

const gameState = useGameState();
const shopStore = useShopStore();
const metaStore = useMetaStore();

const foo = createNewText();
const { i18next } = useTranslation();

const selectedItem = ref<any | null>(null);

// Реактивный тик для обновления таймеров в реальном времени
const tick = ref(0);
let tickTimer: ReturnType<typeof setInterval> | null = null;

const dynamicTitleName = computed(() => {
    return foo.makeText("shop.title", "Shop");
});

type ProductStatus =
    | "available"
    | "owned"
    | "not_enough_currency";

function getItemId(item: any): string {
    return item.id ?? item.title ?? "";
}

function getItemTitle(item: any): string {
    if (i18next.language === "en" && item.titleEn) {
        return item.titleEn;
    }

    return item.title ?? "Unknown";
}

function getItemDescription(item: any): string {
    if (i18next.language === "en" && item.descriptionEn) {
        return item.descriptionEn;
    }

    return item.description ?? "";
}

function getProductStatus(product: any): ProductStatus {

    if (!product.type) {
        return "available";
    }

    const p = product as PurchaseProduct;

    if (shopStore.isProductOwned(p)) {
        return "owned";
    }

    if (!shopStore.canAfford(p)) {
        return "not_enough_currency";
    }

    return "available";
}

function getProductStatusLabel(product: any) {

    const status = getProductStatus(product);

    switch (status) {
        case "owned":
            return "shop.product.owned";

        case "not_enough_currency":
            return "shop.product.notEnoughCurrency";

        default:
            return "";
    }
}

function getCardClasses(product: any) {

    const status = getProductStatus(product);

    return {
        "card--applied": product.type === "cosmetic" && product.effect.skinId === metaStore.activeSkin,
        "card--owned": status === "owned",
        "card--disabled":
            status === "owned" ||
            status === "not_enough_currency",
    };
}

function getItemPrice(item: any): string {
    if (item.platformPriceLabel) {
        return item.platformPriceLabel;
    }

    if (
        typeof item.price === "object" &&
        item.price !== null
    ) {
        return String(item.price.value);
    }

    return String(item.price ?? "");
}

function getItemCurrency(item: any): string {
    if (item.platformPriceLabel) {
        return "";
    }

    if (
        typeof item.price === "object" &&
        item.price !== null
    ) {
        return getCurrencyLabel(item.price.currency);
    }

    return getCurrencyLabel(
        item.currency ??
        item.priceCurrencyCode ??
        ""
    );
}

function getCurrencyLabel(currency: string): string {
    switch (currency) {
        case "RUB":
            return "₽";
        case "USD":
            return "$";
        case "EUR":
            return "€";
        case "YAN":
            return "YAN";
        default:
            return currency;
    }
}

function handleBuyClick(product: any) {

    const status = getProductStatus(product);

    if (status !== "available") {
        return;
    }

    if (!product.type) {
        alert(`Item ${product.id} bought!`);
        return;
    }

    shopStore.buyItem(product as PurchaseProduct);
}

function handleApplyClick(product: PurchaseProduct) {

    console.log("Apply click for", product);
    if (product.type !== "cosmetic") {
        return;
    }
    metaStore.setActiveSkin(product.effect.skinId);
}

function getTimedProductTimer(product: any): string {

    if (product.type !== "timed_feature") {
        return "";
    }

    // Используем tick для реактивности — Vue будет перевычислять при каждом тике
    void tick.value;

    const effect = metaStore.getTimedEffect(product.effect.feature);

    if (!effect) {
        return "";
    }

    const remainingSeconds = Math.floor((effect.expiresAt - Date.now()) / 1000);

    if (remainingSeconds <= 0) {
        return "";
    }

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function getUpgradeLevel(product: any): { level: number; maxLevel: number } | null {

    if (product.type !== "upgrade") {
        return null;
    }

    const level = metaStore.getUpgradeLevel(product.effect?.upgrade);
    const maxLevel = meta.max_upgrades[product.effect?.upgrade];

    if (level === null) {
        return { level, maxLevel };
    }

    return { level, maxLevel };
}

function checkIfUpgradeMaxed(product: any): boolean {

    if (product.type !== "upgrade") {
        return false;
    }

    const upgradeInfo = getUpgradeLevel(product);

    if (!upgradeInfo) {
        return false;
    }

    return upgradeInfo.level >= upgradeInfo.maxLevel;
}

function getUpgradeLevelString(product: any): string {
    if (product.type !== "upgrade") {
        return "";
    }

    const upgradeInfo = getUpgradeLevel(product);
    return `Уровень: ${upgradeInfo!.level} / ${upgradeInfo!.maxLevel}`;
}

function backButtonClick() {

    if (gameState.currentState === "menu") {
        shopStore.hide();
    }

    setTimeout(() => {
        shopStore.setView("currency");
    }, 100);

    setTimeout(() => {
        shopStore.hide();
    }, 400);

    setTimeout(() => {
        gameState.closeOverlay();
    }, 500);
}

function setContainerPos() {

    if (gameState.currentState === "menu") {
        return "container_pos_main_menu";
    }

    if (gameState.currentState === "pause") {
        return "container_pos_pause";
    }

    return "";
}

function setHeaderSize() {

    if (gameState.currentState === "pause") {
        return "header_pause";
    }

    return "";
}

watch(
    () => shopStore.currentView,
    () => {
        selectedItem.value =
            shopStore.activeCatalog[0] ?? null;
    }
);

onMounted(async () => {

    await shopStore.loadCatalogs();

    selectedItem.value =
        shopStore.activeCatalog[0] ?? null;

    shopStore.show();

    // Запускаем тикер для обновления таймеров каждую секунду
    tickTimer = setInterval(() => {
        tick.value++;
    }, 1000);
});

onUnmounted(() => {
    if (tickTimer !== null) {
        clearInterval(tickTimer);
        tickTimer = null;
    }
});
</script>

<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";

.shop_container {
    width: 100%;
    height: 100%;
    padding: 2rem;

    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.5rem;

    box-sizing: border-box;
    min-height: 0;
}

.tabs {
    display: flex;
    gap: 2rem;
    margin-top: 1rem;
}

.tab_active {
    color: #72b3ee;
}

.balance_row {
    display: flex;
    gap: 2rem;
    margin-top: 1rem;

    font-size: 2rem;
}

.balance_item {
    display: flex;
    gap: .5rem;
    align-items: center;
    color: white;
}

.balance_icon--golden {
    color: #efbf04;
}

.balance_icon--energon {
    color: #82c8e5;
}

// .shop_content {
//     width: 90%;
//     flex: 1;

//     display: flex;
//     gap: 2rem;
//     padding: 5rem;

//     overflow: hidden;
// }

// .cards {
//     flex: 1;

//     display: flex;
//     flex-wrap: wrap;

//     gap: 1rem;

//     overflow-y: auto;
//     padding-right: .5rem;

//     scrollbar-width: thin;
//     scrollbar-color: #575757 #00000000;
// }

.card {
    height: 16rem;
    width: 100%;
    font-family: 'jost-light';

    display: flex;
    flex-direction: row;

    gap: 1rem;

    padding: 1rem;

    // border-radius: 16px;

    background: rgba(15, 20, 30, .3);

    border: 1px solid rgba(255, 255, 255, .1);

    cursor: pointer;

    transition: .2s;
}

.card:hover {
    border-color: #72b3ee;
}

.card_selected {
    border-color: #72b3ee;
    background: rgba(13, 58, 99, 0.9);

    box-shadow:
        0 0 20px rgba(114, 179, 238, .5);
}

.card__image {
    display: flex;
    justify-content: center;
    flex-shrink: 0;
}

// .card__content {
//     display: flex;
//     flex-direction: column;
//     width: 100%;
// }

.card--owned {
    background: rgba(0, 255, 179, 0.05);
    // border-color: rgba(255, 255, 255, .1);
}

.card--applied {
    background: rgba(255, 204, 0, 0.1);
    // border-color: rgba(255, 255, 255, .1);
}

// .card__image_placeholder {
//     // width: 5rem;
//     // height: 5rem;
//     width: 150px;

//     // border-radius: 50%;

//     display: flex;
//     justify-content: center;
//     align-items: center;

//     font-size: 1rem;
//     font-weight: 700;

//     color: white;

//     background: rgba(255, 255, 255, .08);
// }

.card__title {
    text-align: start;
    color: white;
    font-weight: 700;
    font-size: 1.5rem;

    align-self: flex-start;
}

.card__price_row {
    margin-top: auto;

    display: flex;
    justify-content: center;
    // gap: .5rem;
    font-size: 3rem;

    color: white;

    align-self: flex-end;
}

.preview {
    width: 50%;
    font-family: 'jost-light';

    flex-shrink: 0;

    display: flex;
    flex-direction: column;

    padding: 2rem;

    // border-radius: 20px;

    background: rgba(15, 20, 30, .85);

    border: 1px solid rgba(255, 255, 255, .1);
}

.preview__image {
    display: flex;
    justify-content: center;

    margin-bottom: 2rem;
}

.preview__image_placeholder {
    // width: 12rem;
    // height: 12rem;


    // border-radius: 50%;
    width: 250px;
    height: 250px;

    display: flex;
    justify-content: center;
    align-items: center;

    font-size: 5rem;

    // background: rgba(255, 255, 255, .08);

    color: white;
}

.preview__title {
    font-size: 3rem;
    color: white;
    text-align: center;
}

.preview__description {
    margin: 3rem;
    color: rgba(255, 255, 255, .8);
    text-align: center;
    font-size: 1.5rem;
    line-height: 1.5;
}

.preview__price {
    // margin-top: 2rem;

    display: flex;
    justify-content: center;
    gap: .5rem;

    font-size: 5rem;
    color: white;
}

.preview__status {
    margin-top: auto;

    text-align: center;

    color: #5effb1;
    font-size: 4rem;
}

.preview__buy_btn {
    margin-top: auto;
    padding: 2rem;
    border: none;
    font-size: 4rem;
    color: white;
    cursor: pointer;
    background: rgba(0, 157, 255, 0.3);
    transition: .2s;

    &:hover {
        background: rgba(0, 157, 255, 0.5);
    }
}

.notification {
    position: fixed;

    top: 2rem;
    left: 50%;

    transform: translateX(-50%);

    padding: 1rem 2rem;

    border-radius: 10px;

    color: white;
}

.notification--success {
    background: rgba(0, 128, 0, .8);
}

.notification--error {
    background: rgba(255, 0, 0, .8);
}

.balance_block {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    // gap: 0.25rem;
    gap: 5rem;
    padding: 0.5rem 1rem;
}

.balance_subblock {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1rem;
    font-size: 1.6rem;
}

.balance_value {
    text-align: right;
    font-family: 'jost-light';
    // min-width: 3ch;
    // font-feature-settings: "tnum";
    // font-variant-numeric: tabular-nums;
    // white-space: nowrap;
    // transition: width 0.1s ease;  // Плавное расширение
}

.balance_image_container {
    width: 2.3125rem;
    height: 2.3125rem;
    position: relative;
}

.energon_glow_general {
    filter: drop-shadow(0 0 0.44rem rgb(43, 157, 229));
}

.energon_glow_grid {
    filter: drop-shadow(0 0 1.25rem rgb(20, 212, 255));
}

.energon_glow_core {
    filter: drop-shadow(0 0 0.625rem rgb(20, 212, 255));
}

.yellow_divider {
    height: 1px;
    width: 11.5rem;
    background: linear-gradient(90deg,
            rgba(255, 217, 92, 0) 0%,
            rgba(255, 217, 92, 0.55) 25%,
            rgba(255, 217, 92, 0.55) 75%,
            rgba(255, 217, 92, 0) 100%);
}

.icon {
    width: 100%;
}

.icon_abs {
    position: absolute;
    top: 0;
    left: 0;
}

.preview_timer {
    margin-top: 1rem;
    text-align: center;
    font-size: 2rem;
    color: rgba(255, 255, 255, .8);
}

.shop_content {
    width: 90%;
    flex: 1;

    display: flex;
    gap: 2rem;

    overflow: hidden;
    min-height: 0;

}

.cards {
    flex: 1;

    display: flex;
    flex-direction: column;

    gap: .75rem;

    overflow-y: auto;

    padding-right: .5rem;

    scrollbar-width: thin;
    scrollbar-color: #575757 transparent;

    min-height: 0;

}

.card {
    // min-height: 8rem;

    display: flex;
    align-items: center;

    gap: 1rem;

    padding: 1rem 1.25rem;

    background: rgba(15, 20, 30, .35);

    border: 1px solid rgba(255, 255, 255, .08);

    transition: .2s;

    cursor: pointer;

    max-width: stretch;
    max-height: fit-content;

}

.card:hover {
    border-color: #72B3EE;
}

.card_selected {
    border-left: 4px solid #72B3EE;

    background:
        linear-gradient(90deg,
            rgba(114, 179, 238, .18),
            rgba(15, 20, 30, .7));

    box-shadow:
        inset 0 0 40px rgba(114, 179, 238, .08);

}

.card--owned {
    background:
        linear-gradient(90deg,
            rgba(94, 255, 177, .08),
            rgba(15, 20, 30, .35));
}

.card--applied {
    background:
        linear-gradient(90deg,
            rgba(255, 217, 92, .12),
            rgba(15, 20, 30, .35));
}

.card__image_placeholder {
    width: 96px;
    height: 96px;

    display: flex;
    justify-content: center;
    align-items: center;

    background: rgba(255, 255, 255, .06);

    font-size: 2rem;

    color: white;

}

.card__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    // gap: 10rem;
    justify-content: space-between;
    height: stretch;

}

.card__top {
    display: flex;
    align-items: center;
    gap: .75rem;
    flex-wrap: wrap;
}

.card__bottom {
    margin-top: auto;

    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: .5rem;

}

.card__title {
    color: white;
    font-size: 1.4rem;
    font-family: 'jost-light';
}

.card__price_row {
    font-family: 'vla_shu';

    font-size: 2rem;

    color: #FFD95C;

}

.status_badge {
    padding: .25rem .75rem;

    font-size: .85rem;

    text-transform: uppercase;

    border: 1px solid;

}

.status_badge--owned {
    color: #5effb1;
    border-color: #5effb1;
}

.status_badge--upgrade {
    color: #FFD95C;
    border-color: #FFD95C;
}

.status_badge--timer {
    color: #72B3EE;
    border-color: #72B3EE;
}

.preview {
    width: 34rem;

    flex-shrink: 0;

    display: flex;
    flex-direction: column;

    background: rgba(15, 20, 30, .85);

    border: 1px solid rgba(255, 255, 255, .08);

    padding: 2rem;

}

.preview__header {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.preview__image_placeholder {
    width: 240px;
    height: 240px;

    display: flex;
    align-items: center;
    justify-content: center;

    background: rgba(255, 255, 255, .05);

    color: white;

    font-size: 5rem;

}

.preview__title {
    margin-top: 1rem;

    text-align: center;

    color: white;

    font-size: 2.5rem;

}

.preview__meta {
    margin-top: .75rem;

    color: #72B3EE;

    font-size: 1.25rem;

}

.preview__description {
    margin-top: 2rem;

    color: rgba(255, 255, 255, .85);

    text-align: center;

    line-height: 1.7;

    font-size: 1.2rem;

}

.preview__footer {
    margin-top: auto;

    display: flex;
    flex-direction: column;

    gap: 1rem;

}

.preview__price {
    text-align: center;

    font-family: 'vla_shu';

    font-size: 4rem;

    color: #FFD95C;

}

.preview__status {
    text-align: center;

    font-size: 2rem;

    color: #5effb1;

}

.preview__buy_btn {
    height: 5rem;

    border: 1px solid rgba(255, 255, 255, .15);

    background:
        linear-gradient(180deg,
            #3fa9ff,
            #0f6bb6);

    color: white;

    font-size: 1.6rem;

    font-family: 'vla_shu';

    cursor: pointer;

    transition: .2s;

}

.preview__buy_btn:hover {
    transform: translateY(-2px);

    box-shadow:
        0 0 35px rgba(63, 169, 255, .35);

}
</style>
