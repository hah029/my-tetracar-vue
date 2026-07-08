<template>
    <div class="container container_correction">
        <div class="settings_container">

            <!-- HEADER -->
            <Transition :name="gameState.currentState == 'menu' ? 'header_footer_block_anim' : ''">
                <div v-if="isHeaderShown" class="header_block">
                    <div class="header_text" :class="setHeaderSize()">{{ dynamicTitleName }}</div>
                    <div class="header_image">
                        <img class="image" src="@/assets/images/title_line_image.svg" />
                    </div>
                </div>
            </Transition>

            <!-- CONTENT -->
            <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
                <!-- MAIN -->
                <button v-for="(btn, index) in menuButtons" v-if="currentView === SettingsView.Main" :key="btn.id"
                    class="menu_btn btn_correction" :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                    {{ btn.text }}
                </button>
            </TransitionGroup>

            <!-- SUBMENUS -->
            <SoundSettings v-if="currentView === SettingsView.Sound" :backStatus="isBackButtonClicked" />
            <GraphicSettings v-if="currentView === SettingsView.Graphics" :backStatus="isBackButtonClicked" />
            <LanguageSettings v-else-if="currentView === SettingsView.Language" :backStatus="isBackButtonClicked" />
            <ControlSettings v-else-if="currentView === SettingsView.Controls" :backStatus="isBackButtonClicked" />
            <AboutSettings v-else-if="currentView === SettingsView.About" :backStatus="isBackButtonClicked" />

        </div>

        <!-- BACK -->
        <Transition name="header_footer_block_anim">
            <button v-if="isBackButtonShown" class="menu_btn btn_correction back_button" @click="backButtonClick">
                {{ foo_1.makeText("mainMenu.goBack") }}
            </button>
        </Transition>
    </div>
</template>


<script setup lang="ts">
    import SoundSettings from "./overlays/SoundSettings.vue";
    import GraphicSettings from "./overlays/GraphicSettings.vue";
    import LanguageSettings from "./overlays/LanguageSettings.vue";
    import ControlSettings from "./overlays/ControlSettings.vue";
    import AboutSettings from "./overlays/AboutSettings.vue";

    import { onMounted, computed, ref, watch } from "vue";
    import { createNewText, deleteTextLines } from '@/helpers/functions';
    import { useGameState } from "@/store/gameState";

    enum SettingsView {
        Main,
        Sound,
        Graphics,
        Language,
        Controls,
        About,
        null,
    }

    // ===== STORES =====
    const gameState = useGameState();
    
    // ===== LOCAL STATE =====
    const currentView = ref<SettingsView>(SettingsView.null);

    const isHeaderShown = ref(false);
    const isBackButtonShown = ref(false);
    const isBackButtonClicked = ref(false);

    // ===== TEXT =====
    const foo_1 = createNewText();
    const foo_2 = deleteTextLines();

    // ===== UI STATE (без таймаутов) =====
    const isInSubMenu = computed(() => currentView.value !== SettingsView.Main && currentView.value !== SettingsView.null);

    // ===== MENU =====
    const menuButtons = computed(() => [
        {
            id: 1,
            text: foo_1.makeText("settings.menuList.graphics"),
            action: () => currentView.value = SettingsView.Graphics,
        },
        {
            id: 2,
            text: foo_1.makeText("settings.menuList.sounds"),
            action: () => currentView.value = SettingsView.Sound,
        },
        {
            id: 3,
            text: foo_1.makeText("settings.menuList.lang"),
            action: () => currentView.value = SettingsView.Language,
        },
        {
            id: 4,
            text: foo_1.makeText("settings.menuList.controls"),
            action: () => currentView.value = SettingsView.Controls,
        },
        {
            id: 5,
            text: foo_1.makeText("settings.menuList.about"),
            action: () => currentView.value = SettingsView.About,
        },
    ]);

    // ===== TITLE =====
    const dynamicTitleName = computed(() => {
        if (isInSubMenu.value) {
            const map = {
                [SettingsView.Graphics]: menuButtons.value[0]!.text,
                [SettingsView.Sound]: menuButtons.value[1]!.text,
                [SettingsView.Language]: menuButtons.value[2]!.text,
                [SettingsView.Controls]: menuButtons.value[3]!.text,
                [SettingsView.About]: menuButtons.value[4]!.text,
            };
            return foo_2.correctText(map[currentView.value]);
        } else {
            return foo_1.makeText("settings.title", "empty");
        };
    });

    // ===== BACK =====
    function backButtonClick() {
        if (isInSubMenu.value) {
            isBackButtonClicked.value = true;
            setTimeout(() => {
                isBackButtonClicked.value = false;
                currentView.value = SettingsView.Main;
            }, 500);

        } else {
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
    };

    // function setContainerPos() {
    //     if (gameState.currentState == 'menu') {
    //         return 'container_pos_main_menu';
    //     } else if (gameState.currentState == 'pause') {
    //         return 'container_pos_pause';
    //     };
    // };

    function setHeaderSize() {
        if (gameState.currentState == 'pause') {
            return 'header_pause';
        };
    };

    // 🔥 Следим за изменением секции настроек
    watch(
        () => gameState.settingsSection,
        (section) => {
            if (section === 'about') {
                currentView.value = SettingsView.About;
            } else if (section === 'sound') {
                currentView.value = SettingsView.Sound;
            } else if (section === 'graphics') {
                currentView.value = SettingsView.Graphics;
            } else if (section === 'language') {
                currentView.value = SettingsView.Language;
            } else if (section === 'controls') {
                currentView.value = SettingsView.Controls;
            } else if (section === 'main' || section === null) {
                currentView.value = SettingsView.Main;
            }
        },
        // { immediate: true }
    );

    onMounted(() => {
        isHeaderShown.value = true;
        
        // setTimeout(() => {
        //     currentView.value = SettingsView.Main;
        // }, 200);
        // setTimeout(() => {
        //     isBackButtonShown.value = true;
        // }, 550);

        // 🔥 Если settingsSection уже установлен — применяем его
        const section = gameState.settingsSection;

        if (section && section !== 'main') {
            if (section === 'about') {
                currentView.value = SettingsView.About;
            } else if (section === 'sound') {
                currentView.value = SettingsView.Sound;
            } else if (section === 'graphics') {
                currentView.value = SettingsView.Graphics;
            } else if (section === 'language') {
                currentView.value = SettingsView.Language;
            } else if (section === 'controls') {
                currentView.value = SettingsView.Controls;
            }
            // setTimeout(() => {
            // }, 300); // Задержка, чтобы Main успел отрендериться
            setTimeout(() => {
                isBackButtonShown.value = true;
            }, 1000);
            
        } else {
            setTimeout(() => {
                currentView.value = SettingsView.Main;
            }, 200);
            setTimeout(() => {
                isBackButtonShown.value = true;
            }, 550);
        };
        
        // setTimeout(() => {
        //     isBackButtonShown.value = true;
        // }, 550);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    .container_correction {
        position: relative;
        padding: 7.265vh 0 0 0;             // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) { 
            padding: 7.265vh 0 0 0;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) { 
            // padding: 7.265vh 0 0 0;
        // @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            // padding: 7.265vh 0 0 0;
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            padding: 22.5rem 0 0 0;
        }
    }

    .settings_container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
    }

    .header_pause {
        font-size: clamp(2rem, 4vmin, 3.125rem);
    }

    .group_correction {
        // position: static !important;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;

        gap: 3.846vh;   // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) { 
            gap: 3.846vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) { 
        //     bottom: 12.8125rem;
        //     gap: 5.56vh; 
        //     justify-content: center !important;
        // }  
        // @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
        //     bottom: 12.8125rem;
        //     gap: 5.56vh; 
        //     justify-content: center !important;
        // }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 1.125rem;
        }
    }

    .btn_correction {
        @include text-secondary-menu-button;
        color: $color-yellow-super-light;
    }

    .back_button {
        position: absolute;
        bottom: 7.265vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) { 
            bottom: 7.265vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) { 
            // bottom: 3.75rem;
        // @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            // bottom: 3.75rem;
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            bottom: 3.75rem;
        }
    }
</style>
