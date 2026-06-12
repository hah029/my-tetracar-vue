<template>
    <div class="container" :class="setContainerPos()">
        <div class="shop_container">

            <!-- HEADER -->
            <Transition :name="gameState.currentState == 'menu' ? 'header_footer_block_anim' : ''">
                <div v-if="shopStore.isHeaderShown" class="header_block" style="width: 1000px;">
                    <div class="header_text" :class="setHeaderSize()">{{ dynamicTitleName }}</div>
                    <div class="header_image">
                        <img class="image" src="@/assets/images/title_line_image.svg" />
                    </div>

                    <!-- BALANCE -->
                    <div class="balance_row">
                        <div class="balance_item">
                            <span class="balance_icon balance_icon--golden">●</span>
                            <span class="balance_value">{{ metaStore.goldens }}</span>
                        </div>
                        <div class="balance_item">
                            <span class="balance_icon balance_icon--energon">◆</span>
                            <span class="balance_value">{{ metaStore.energons }}</span>
                        </div>
                    </div>

                    <!-- TABS -->
                    <div class="tabs" style="width: 40%;">
                        <div class="menu_btn btn_font_size_26"
                            :class="{ tab_active: shopStore.currentView === 'currency' }"
                            @click="shopStore.setView('currency')">
                            {{ foo.makeText("shop.tabList.currency", 'Currency') }}
                        </div>
                        <div class="menu_btn btn_font_size_26"
                            :class="{ tab_active: shopStore.currentView === 'stuff' }"
                            @click="shopStore.setView('stuff')">
                            {{ foo.makeText("shop.tabList.stuff", 'Stuff') }}
                        </div>
                        <div class="menu_btn btn_font_size_26"
                            :class="{ tab_active: shopStore.currentView === 'visual' }"
                            @click="shopStore.setView('visual')">
                            {{ foo.makeText("shop.tabList.visual", 'Visual') }}
                        </div>
                    </div>
                </div>
            </Transition>

            <!-- NOTIFICATION -->
            <Transition name="notification_anim">
                <div v-if="shopStore.notificationMessage" class="notification"
                    :class="'notification--' + shopStore.notificationType">
                    {{ foo.makeText(shopStore.notificationMessage, shopStore.notificationMessage) }}
                </div>
            </Transition>

            <!-- CONTENT -->
            <div class="cards">
                <div v-for="(item, index) in shopStore.activeCatalog" :key="(item as any).id ?? index" class="card"
                    :class="getCardClasses(item)" @click="handleBuyClick(item)">
                    <div class="card__title">{{ (item as any).title }}</div>
                    <div class="card__description" v-if="(item as any).description">{{ (item as any).description }}
                    </div>
                    <div class="card__price_row">
                        <span class="card__price">{{ getItemPrice(item) }}</span>
                        <span class="card__currency">{{ getItemCurrency(item) }}</span>
                    </div>
                    <div class="card__status" v-if="getProductStatus(item) !== 'available'">
                        {{ foo.makeText(getProductStatusLabel(item), getProductStatus(item)) }}
                    </div>
                </div>
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
import { onMounted, computed, ref } from "vue";
import { createNewText } from '@/helpers/functions';
import { useGameState } from "@/store/gameState";
import { useShopStore } from "@/store/shopStore";
import { useMetaStore } from "@/store/metaStore";

import type { Product as PurchaseProduct } from "@/purchase/types/Product";

// ===== STORES =====
const gameState = useGameState();
const shopStore = useShopStore();
const metaStore = useMetaStore();

// ===== TEXT =====
const foo = createNewText();

// ===== TITLE =====
const dynamicTitleName = computed(() => {
    return foo.makeText("shop.title", "empty");
});

// ===== PRODUCT STATUS =====
type ProductStatus = "available" | "owned" | "not_enough_currency";

function getProductStatus(product: any): ProductStatus {
    // Для товаров из SDK (currency) не показываем статус
    if (!product.type) return "available";

    const p = product as PurchaseProduct;

    if (shopStore.isProductOwned(p)) {
        return "owned";
    }

    if (!shopStore.canAfford(p)) {
        return "not_enough_currency";
    }

    return "available";
}

function getProductStatusLabel(product: any): string {
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

function getCardClasses(product: any): Record<string, boolean> {
    const status = getProductStatus(product);
    return {
        "card--owned": status === "owned",
        "card--disabled": status === "not_enough_currency" || status === "owned",
    };
}

function getItemPrice(item: any): string {
    if (typeof item.price === "object" && item.price !== null) {
        return String(item.price.value);
    }
    return String(item.price ?? "");
}

function getItemCurrency(item: any): string {
    if (typeof item.price === "object" && item.price !== null) {
        return item.price.currency;
    }
    return item.currency ?? "";
}

// ===== BUY =====
function handleBuyClick(product: any) {
    const status = getProductStatus(product);
    if (status !== "available") return;

    // Для товаров из SDK (без type) — просто алерт
    if (!product.type) {
        alert(`Item ${product.id} bought!`);
        return;
    }

    shopStore.buyItem(product as PurchaseProduct);
}

// ===== BACK =====
function backButtonClick() {
    if (gameState.currentState == 'menu') {
        shopStore.hide();
    }
    setTimeout(() => {
        shopStore.setView('currency');
    }, 100);
    setTimeout(() => {
        shopStore.hide();
    }, 400);

    setTimeout(() => {
        gameState.closeOverlay();
    }, 500);
}

function setContainerPos() {
    if (gameState.currentState == 'menu') {
        return 'container_pos_main_menu';
    } else if (gameState.currentState == 'pause') {
        return 'container_pos_pause';
    }
    return '';
}

function setHeaderSize() {
    if (gameState.currentState == 'pause') {
        return 'header_pause';
    }
    return '';
}

onMounted(() => {
    shopStore.loadCatalogs();
    shopStore.show();
});
</script>

<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";

.tabs {
    position: relative;
    width: 34.625rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.75rem;
    line-height: 1;
}

.tab_active {
    opacity: 1 !important;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

.balance_row {
    display: flex;
    gap: 2rem;
    margin-top: 0.5rem;
    font-size: 1.5rem;
    color: white;
}

.balance_item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.balance_icon--golden {
    color: #efbf04;
}

.balance_icon--energon {
    color: #82c8e5;
}

.balance_value {
    font-family: "Jost", sans-serif;
    font-weight: 700;
}

.container_pos_main_menu {
    justify-content: flex-end !important;
}

.container_pos_pause {
    justify-content: flex-start !important;
    top: 19.75rem !important;
}

.header_pause {
    font-size: 3.125rem;
}

.shop_container {
    position: relative;
    height: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    padding-bottom: 2.687rem;
}

.btn_font_size_30 {
    font-size: 1.875rem;
    cursor: default;
}

.btn_font_size_26 {
    font-size: 1.625rem;
}

.cards {
    display: flex;
    max-width: 75%;
    gap: 1rem;
    flex-wrap: wrap;
    align-content: flex-start;
    justify-content: center;
    align-items: center;
    overflow-y: auto;
    scrollbar-color: rgba(200, 200, 200, 0.1) rgba(255, 166, 0, 0);
    scrollbar-width: thin;
}

.card {
    display: flex;
    gap: 10px;
    flex-direction: column;
    padding: 2rem;
    height: 16rem;
    width: 16rem;
    background: rgba(255, 0, 0, 0.3);
    color: white;
    font-size: 12px;
    font-family: Arial, Helvetica, sans-serif;
    text-align: center;
    vertical-align: middle;
    cursor: pointer;
    transition: background 0.2s, opacity 0.2s;

    &:hover {
        background: rgba(255, 0, 0, 0.6);
    }

    &--owned {
        background: rgba(0, 128, 0, 0.3);
        cursor: default;

        &:hover {
            background: rgba(0, 128, 0, 0.5);
        }
    }

    &--disabled {
        opacity: 0.5;
        cursor: not-allowed;

        &:hover {
            background: rgba(255, 0, 0, 0.3);
        }
    }

    &>.card__price_row {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        align-items: baseline;
    }

    &>.card__price {
        font-size: 32px;
    }

    &>.card__currency {
        font-size: 16px;
        opacity: 0.7;
    }

    &>.card__status {
        font-size: 14px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
}

.notification {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    padding: 1rem 2rem;
    border-radius: 8px;
    font-size: 1.2rem;
    font-weight: bold;
    z-index: 1000;
    color: white;

    &--success {
        background: rgba(0, 128, 0, 0.8);
    }

    &--error {
        background: rgba(255, 0, 0, 0.8);
    }
}

.notification_anim-enter-active,
.notification_anim-leave-active {
    transition: all 0.3s ease;
}

.notification_anim-enter-from,
.notification_anim-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
}
</style>