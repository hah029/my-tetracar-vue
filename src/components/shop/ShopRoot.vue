<template>
    <!-- <div class="container correction"> -->
    <div class="container" :class="setContainerPos()">
        <div class="shop_container">

            <!-- HEADER -->
            <Transition :name="gameState.currentState == 'menu' ? 'header_footer_block_anim' : ''">
                <div v-if="isHeaderShown" class="header_block" style="width: 1000px;">
                    <div class="header_text" :class="setHeaderSize()">{{ dynamicTitleName }}</div>
                    <!-- <div class="header_text" :class="setHeaderSize()">Рекорды</div> -->
                    <div class="header_image">
                        <img class="image" src="@/assets/images/title_line_image.svg" />
                    </div>

                    <div class="tabs" style="width: 40%;">
                        <div class="menu_btn btn_font_size_26" @click="currentView = SettingsView.Currency">{{
                            foo.makeText("shop.tabList.currency",
                                'Currency') }}</div>
                        <div class="menu_btn btn_font_size_26" @click="currentView = SettingsView.Stuff">{{
                            foo.makeText("shop.tabList.stuff",
                                'Stuff') }}</div>
                        <div class="menu_btn btn_font_size_26" @click="currentView = SettingsView.Visual">{{
                            foo.makeText("shop.tabList.visual",
                                'Visual') }}</div>
                    </div>

                </div>
            </Transition>

            <!-- CONTENT -->
            <div class="cards">
                <div v-for="(item, index) in catalog" :key="item.id ?? index" class="card" @click="buyItem(item.id)">
                    <div class="card__title">{{ item.title }}</div>
                    <div class="card__description">{{ item.description }}</div>
                    <div class="card__price">{{ item.price }}</div>
                    <div class="card__currency">{{ item.currency }}</div>
                </div>
            </div>
            <!-- <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
            </TransitionGroup> -->

            <!-- BACK -->
            <Transition name="header_footer_block_anim">
                <button v-if="isBackButtonShown" class="menu_btn btn_font_size_30" @click="backButtonClick">
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

import type { Product } from "@/sdk/types/Shop";

// import { Platform } from "@/sdk/Platform";
// import type { LeaderBoard, LeaderBoardRecord } from "@/sdk";

enum SettingsView {
    Currency,
    Stuff,
    Visual,
    null,
}

// ===== STORES =====
const gameState = useGameState();
const shopStore = useShopStore();

// ===== LOCAL STATE =====
// const currentView = ref<SettingsView>(SettingsView.Main);
const currentView = ref<SettingsView>(SettingsView.Currency);

const isHeaderShown = ref(false);
const isBackButtonShown = ref(false);

// ===== TEXT =====
const foo = createNewText();

// ===== TITLE =====
const dynamicTitleName = computed(() => {
    return foo.makeText("shop.title", "empty");
});
const currencyInAppCatalog = ref<Product[]>([])
const stuffInAppCatalog = ref<Product[]>([])
const visualInAppCatalog = ref<Product[]>([])

function buyItem(prodId: string) {
    alert(`Item ${prodId} bought!`);
}

const catalog = computed(() => {
    switch (currentView.value) {
        case SettingsView.Currency:
            console.log("set Currency")
            return currencyInAppCatalog.value;
        case SettingsView.Stuff:
            console.log("set Stuff")
            return stuffInAppCatalog.value;
        case SettingsView.Visual:
            console.log("set Visual")
            return visualInAppCatalog.value;
        default:
            return currencyInAppCatalog.value;
    }
})

// ===== BACK =====
function backButtonClick() {
    if (gameState.currentState == 'menu') {
        isHeaderShown.value = false;
    };
    setTimeout(() => {
        currentView.value = SettingsView.null;
    }, 100);
    setTimeout(() => {
        isBackButtonShown.value = false;
    }, 400);

    setTimeout(() => {
        gameState.closeOverlay();
    }, 500);
};

function setContainerPos() {
    if (gameState.currentState == 'menu') {
        return 'container_pos_main_menu';
    } else if (gameState.currentState == 'pause') {
        return 'container_pos_pause';
    };
};
function setHeaderSize() {
    if (gameState.currentState == 'pause') {
        return 'header_pause';
    };
};

onMounted(() => {
    currencyInAppCatalog.value = shopStore.getCurrencyInAppCatalog();
    stuffInAppCatalog.value = shopStore.getStuffInAppCatalog();
    visualInAppCatalog.value = shopStore.getVisualInAppCatalog();

    isHeaderShown.value = true;
    setTimeout(() => {
        currentView.value = SettingsView.Currency;
    }, 200);
    setTimeout(() => {
        isBackButtonShown.value = true;
    }, 500);
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

.cube_divider {
    /* position: absolute; */
    /* left: 16.8366rem; */
    width: 0.9375rem;
    display: flex;
    align-items: center;
}

.container_pos_main_menu {
    justify-content: flex-end !important;
}

.container_pos_pause {
    justify-content: flex-start !important;
    top: 19.75rem !important;
}

.header_pause {
    font-size: 3.125rem; // (50px)
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

.group_correction {
    top: 10rem;

    &>*+* {
        margin-top: 0.938rem; // 15px - row-gap (между кнопками)

    }
}

.btn_font_size_30 {
    font-size: 1.875rem; // (30px)
    cursor: default;
}

.btn_font_size_26 {
    font-size: 1.625rem; // (26px)
}

.cards {
    display: flex;
    max-width: 50%;
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

    &:hover {
        background: rgba(255, 0, 0, 0.6);
    }

    &>.card__price {
        font-size: 32px;
    }
}
</style>