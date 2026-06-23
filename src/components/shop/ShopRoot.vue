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

            <div class="inventory_panel">
                <div class="inventory_item">
                    <div class="inventory_item__value color_yellow_light">{{ metaStore.goldens }}</div>
                    <div class="inventory_item__icon">
                        <img class="icon" src="@/assets/images/hud/cube_golden.svg" />
                    </div>
                </div>

                <div class="inventory_item">
                    <div class="inventory_item__value color_blue_light">{{ metaStore.energons }}</div>
                    <div class="inventory_item__icon energon_glow_general">
                        <img class="icon icon_abs" src="@/assets/images/hud/cube_energon_grid_backward.svg" />
                        <img class="icon icon_abs energon_glow_core" src="@/assets/images/hud/cube_energon_core.svg" />
                        <img class="icon icon_abs energon_glow_grid"
                            src="@/assets/images/hud/cube_energon_grid_frontal.svg" />
                    </div>
                </div>

                <div class="inventory_divider"></div>

                <div class="inventory_item">
                    <div class="inventory_item__value color_red_light">{{ playerStore.ammo }} / {{ metaStore.maxAmmo }}
                    </div>
                    <div class="inventory_item__icon">
                        <img class="icon" src="@/assets/images/hud/cube_bullet.svg" />
                    </div>
                </div>

                <div class="inventory_item">
                    <div class="inventory_item__value color_white">{{ playerStore.armor }} / {{ metaStore.maxArmor }}
                    </div>
                    <div class="inventory_item__icon">
                        <img class="icon" src="@/assets/images/hud/cube_armor.svg" />
                    </div>
                </div>
            </div>

            <!-- CONTENT -->
            <div class="shop_content" v-if="shopStore.activeCatalog.length > 0">

                <!-- LEFT -->
                <div class="cards">

                    <div v-for="(item, index) in shopStore.activeCatalog" :key="getItemId(item) + index" class="card"
                        :class="[
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

                                <div v-if="getProductStatus(item) === 'owned'" class="status_badge status_badge--owned">
                                    {{ foo.makeText("shop.ownedBadge") }}
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
                                {{ foo.makeText("shop.previewBtn.apply") }}
                            </button>

                            <div v-else-if="
                                selectedItem.type === 'cosmetic' &&
                                selectedItem.effect.skinId === metaStore.activeSkin
                            " class="preview__status">
                                {{ foo.makeText("shop.previewBtn.applied") }}
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
                            {{ foo.makeText("shop.previewBtn.buy") }}
                        </button>

                    </div>
                </div>

            </div>

            <div v-else class="shop_content shop_content--empty">
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
import { usePlayerStore } from "@/store/playerStore";

import type { Product as PurchaseProduct } from "@/purchase/types/Product";
import meta from "@/configs/meta";

const gameState = useGameState();
const shopStore = useShopStore();
const metaStore = useMetaStore();
const playerStore = usePlayerStore();

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
    let _c = ""
    switch (currency) {
        case "RUB":
            _c = "rub";
            break;
        case "USD":
            _c = "usd";
            break;
        case "EUR":
            _c = "euro";
            break;
        case "YAN":
            _c = "yan";
            break;
        default:
            _c = currency;
    }

    return foo.makeText(`currency.${_c}`)
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

.container {
    background-color: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(2px);
}

.shop_container {
    width: min(86rem, 100%);
    height: 100%;
    padding: clamp(1rem, 3vmin, 2rem);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: clamp(0.8rem, 2vmin, 1.5rem);
    box-sizing: border-box;
    min-height: 0;
}

.tabs {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: clamp(0.75rem, 2.2vmin, 2rem);
    margin-top: clamp(0.5rem, 1.4vmin, 1rem);
}

.btn_font_size_26 {
    font-size: clamp(1rem, 2.2vmin, 1.625rem);
}

.btn_font_size_30 {
    font-size: clamp(1.2rem, 2.5vmin, 1.875rem);
}

.tab_active {
    color: #72b3ee;
}

.preview__title {
    text-align: center;
    color: white;
    font-size: clamp(1.25rem, 2.5vmin, 2rem);
    font-family: 'vla_shu';
    line-height: 1.1;
}

.notification {
    position: fixed;
    top: clamp(1rem, 3vmin, 2rem);
    left: 50%;
    transform: translateX(-50%);
    padding: 0.75rem 1.25rem;
    color: white;
    font-family: 'jost-light';
    font-size: clamp(0.9rem, 1.8vmin, 1.2rem);
    text-transform: uppercase;
    z-index: 1001;
}

.notification--success {
    background: rgba(0, 128, 0, .8);
}

.notification--error {
    background: rgba(255, 0, 0, .8);
}

.inventory_panel {
    width: min(76rem, 94vw);
    display: flex;
    justify-content: center;
    align-items: center;
    flex-wrap: wrap;
    gap: clamp(0.55rem, 1.8vmin, 1.2rem);
    padding: clamp(0.45rem, 1.2vmin, 0.7rem) clamp(0.75rem, 2vmin, 1.25rem);
    box-sizing: border-box;
    background: linear-gradient(90deg,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.42) 12%,
            rgba(0, 0, 0, 0.42) 88%,
            rgba(0, 0, 0, 0) 100%);
}

.inventory_item {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(0.35rem, 1.2vmin, 0.6rem);
    min-width: 0;
    font-family: 'jost-light';
    font-size: clamp(0.95rem, 1.8vmin, 1.25rem);
    line-height: 1;
    text-transform: uppercase;
}

.inventory_item__value {
    min-width: 3ch;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
}

.inventory_item__icon {
    width: clamp(1.35rem, 3.2vmin, 2rem);
    height: clamp(1.35rem, 3.2vmin, 2rem);
    position: relative;
    flex: 0 0 auto;
}

.inventory_divider {
    width: 1px;
    height: clamp(1.4rem, 3vmin, 2rem);
    background: linear-gradient(180deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.38) 50%,
            rgba(255, 255, 255, 0) 100%);
}

.icon {
    width: 100%;
}

.icon_abs {
    position: absolute;
    inset: 0;
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

.shop_content {
    width: min(76rem, 94vw);
    flex: 1;
    display: grid;
    grid-template-columns: minmax(20rem, 1fr) minmax(18rem, 0.82fr);
    gap: clamp(1rem, 2.4vmin, 2rem);
    overflow: hidden;
    min-height: 0;
    box-sizing: border-box;
}

.shop_content--empty {
    display: flex;
    justify-content: center;
    align-items: center;
    width: min(76rem, 94vw);
    color: white;
    font-family: 'jost-light';
    font-size: clamp(1.1rem, 2.5vmin, 2rem);
    text-align: center;
}

.cards {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: clamp(0.6rem, 1.4vmin, 0.85rem);
    overflow-y: auto;
    padding-right: 0.5rem;
    scrollbar-width: thin;
    scrollbar-color: #575757 transparent;
}

.card {
    display: flex;
    align-items: center;
    gap: clamp(0.75rem, 1.5vmin, 1rem);
    min-height: clamp(5.6rem, 12vmin, 7.5rem);
    padding: clamp(0.75rem, 1.6vmin, 1rem) clamp(0.85rem, 2vmin, 1.25rem);
    box-sizing: border-box;
    background: rgba(15, 20, 30, .35);
    border: 1px solid rgba(255, 255, 255, .08);
    transition: .2s;
    cursor: pointer;
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

.card__image {
    display: flex;
    justify-content: center;
    flex-shrink: 0;
}

.card__image_placeholder {
    width: clamp(4rem, 8vmin, 6rem);
    height: clamp(4rem, 8vmin, 6rem);
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(255, 255, 255, .06);
    font-size: clamp(1.4rem, 3vmin, 2rem);
    font-family: 'vla_shu';
    color: white;
}

.card__content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-self: stretch;
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
    font-size: clamp(1rem, 2vmin, 1.35rem);
    font-family: 'jost-light';
    line-height: 1.15;
    overflow-wrap: anywhere;
}

.card__price_row {
    font-family: 'vla_shu';
    font-size: clamp(0.95rem, 1.8vmin, 1.25rem);
    color: #FFD95C;
    margin-top: auto;
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    align-self: flex-end;
}

.status_badge {
    padding: .25rem .75rem;
    font-size: clamp(0.68rem, 1.25vmin, .85rem);
    text-transform: uppercase;
    border: 1px solid;
    line-height: 1.15;
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
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    background: rgba(15, 20, 30, .85);
    border: 1px solid rgba(255, 255, 255, .08);
    padding: clamp(1rem, 2.5vmin, 2rem);
    overflow-y: auto;
    box-sizing: border-box;
    scrollbar-width: thin;
    scrollbar-color: #575757 transparent;
}

.preview__header {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.preview__image {
    display: flex;
    justify-content: center;
    margin-bottom: clamp(0.75rem, 2vmin, 1.5rem);
}

.preview__image_placeholder {
    width: clamp(8rem, 22vmin, 16rem);
    height: clamp(8rem, 22vmin, 16rem);
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, .05);
    color: white;
    font-size: clamp(3rem, 8vmin, 5rem);
    font-family: 'vla_shu';
}

.preview__meta {
    margin-top: .75rem;
    color: #72B3EE;
    font-size: clamp(0.9rem, 1.8vmin, 1.25rem);
    font-family: 'jost-light';
    text-align: center;
}

.preview__description {
    margin: clamp(0.75rem, 2vmin, 1.25rem) 0;
    color: rgba(255, 255, 255, .85);
    text-align: center;
    line-height: 1.45;
    font-size: clamp(0.9rem, 1.6vmin, 1.1rem);
    font-family: 'jost-light';
    overflow-wrap: anywhere;
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
    font-size: clamp(1.25rem, 3vmin, 2rem);
    color: #FFD95C;
}

.preview__status {
    text-align: center;
    font-size: clamp(0.95rem, 1.8vmin, 1.25rem);
    color: #5effb1;
    font-family: 'jost-light';
    text-transform: uppercase;
}

.preview__buy_btn {
    border: 1px solid rgba(255, 255, 255, .15);
    background:
        linear-gradient(180deg,
            #3fa9ff,
            #0f6bb6);

    color: white;
    font-size: clamp(1rem, 2vmin, 1.35rem);
    font-family: 'vla_shu';
    cursor: pointer;
    transition: .2s;
    padding: clamp(0.75rem, 2vmin, 1rem);

    &:hover {
        transform: translateY(-2px);
        box-shadow:
            0 0 35px rgba(63, 169, 255, .35);
    }
}

@media (max-width: 860px) {
    .shop_container {
        align-items: stretch;
    }

    .shop_content {
        width: 100%;
        grid-template-columns: 1fr;
        grid-template-rows: auto minmax(0, 1fr);
        overflow: hidden;
        padding-right: 0;
    }

    .inventory_panel {
        width: 100%;
    }

    .cards {
        overflow-y: auto;
        padding-right: 0.35rem;
    }

    .preview {
        order: -1;
        max-height: clamp(11rem, 34vh, 17rem);
        overflow: hidden;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        grid-template-rows: auto minmax(0, 1fr) auto;
        column-gap: clamp(0.75rem, 2vmin, 1.25rem);
        row-gap: 0.65rem;
    }

    .preview__header {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        grid-column: 1 / -1;
        align-items: center;
        column-gap: clamp(0.75rem, 2vmin, 1.25rem);
    }

    .preview__image {
        grid-row: 1 / 3;
        margin-bottom: 0;
    }

    .preview__image_placeholder {
        width: clamp(5rem, 16vmin, 8rem);
        height: clamp(5rem, 16vmin, 8rem);
        font-size: clamp(2rem, 6vmin, 3.5rem);
    }

    .preview__title,
    .preview__meta {
        text-align: left;
    }

    .preview__title {
        align-self: end;
    }

    .preview__meta {
        align-self: start;
        margin-top: 0.35rem;
    }

    .preview__description {
        grid-column: 1 / -1;
        min-height: 0;
        overflow-y: auto;
        margin: 0;
        text-align: left;
        line-height: 1.35;
    }

    .preview__footer {
        grid-column: 1 / -1;
        margin-top: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 0.75rem;
    }

    .preview__price,
    .preview__status {
        text-align: left;
    }

    .preview__buy_btn {
        min-width: 8rem;
    }
}

@media (max-width: 520px) {
    .shop_container {
        padding: 0.75rem;
    }

    .card {
        align-items: flex-start;
    }

    .card__image_placeholder {
        width: 3.5rem;
        height: 3.5rem;
    }

    .tabs {
        gap: 0.65rem;
    }

    .inventory_panel {
        justify-content: space-evenly;
        gap: 0.45rem;
        padding: 0.45rem 0.5rem;
    }

    .inventory_item {
        font-size: clamp(0.8rem, 3vmin, 0.95rem);
    }

    .inventory_divider {
        display: none;
    }

    .preview {
        max-height: clamp(10rem, 38vh, 15rem);
        padding: 0.85rem;
    }

    .preview__image_placeholder {
        width: 4.5rem;
        height: 4.5rem;
    }

    .preview__footer {
        grid-template-columns: 1fr;
    }

    .preview__buy_btn {
        width: 100%;
        min-width: 0;
    }
}
</style>
