<template>
    <div class="container correction">
        <div class="settings_container">

            <div class="sub_container">
                <!-- HEADER -->
                <Transition name="header_footer_block_anim">
                    <div v-if="isHeaderShown" class="header_block">
                        <div class="header_text">{{ dynamicTitleName }}</div>
                        <div class="header_image">
                            <img class="image" src="@/assets/images/title_line_image.svg" />
                        </div>
                    </div>
                </Transition>

                <!-- CONTENT -->
                <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group">
                    <!-- MAIN -->
                    <button
                        v-for="(btn, index) in menuButtons"
                        v-if="currentView === SettingsView.Main"
                        :key="btn.id" 
                        class="menu_btn"
                        :style="{ animationDelay: `${index * 0.06}s` }" 
                        @click="btn.action"
                    >
                        {{ btn.text }}
                    </button>
                </TransitionGroup>
    
                <!-- SUBMENUS -->
                <SoundSettings v-if="currentView === SettingsView.Sound" />
                <LanguageSettings v-else-if="currentView === SettingsView.Language" />
                <ControlSettings v-else-if="currentView === SettingsView.Controls" />
                <DebugSettings v-else-if="currentView === SettingsView.Debug" />
            </div>

            <!-- BACK -->
            <Transition name="header_footer_block_anim">
                <button v-if="isBackButtonsShown" class="menu_btn" @click="backButtonClick">
                    {{ foo_1.makeText("mainMenu.goBack") }}
                </button>
            </Transition>

        </div>
    </div>
</template>


<script setup lang="ts">
    import DebugSettings from "./DebugSettings.vue";
    import SoundSettings from "./SoundSettings.vue";
    import LanguageSettings from "./LanguageSettings.vue";
    import ControlSettings from "./ControlSettings.vue";

    import { onMounted, computed, ref } from "vue";
    import { createNewText, deleteTextLines } from '@/helpers/functions';
    import { useGameState } from "@/store/gameState";

    enum SettingsView {
        Main,
        Sound,
        Language,
        Controls,
        Debug,
        null,
    }

    // ===== STORES =====
    const gameState = useGameState();

    // ===== LOCAL STATE =====
    // const currentView = ref<SettingsView>(SettingsView.Main);
    const currentView = ref<SettingsView>(SettingsView.null);

    const isHeaderShown = ref(false);
    // const isMainButtonsShown = ref(false);
    const isBackButtonsShown = ref(false);

    // ===== TEXT =====
    const foo_1 = createNewText();
    const foo_2 = deleteTextLines();

    // ===== UI STATE (без таймаутов) =====
    const isInSubMenu = computed(() => currentView.value !== SettingsView.Main && currentView.value !== SettingsView.null);

    // ===== MENU =====
    const menuButtons = computed(() => [
        {
            id: 1,
            text: foo_1.makeText("settings.menuList.technical"),
            action: () => currentView.value = SettingsView.Sound,
        },
        {
            id: 2,
            text: foo_1.makeText("settings.menuList.lang"),
            action: () => currentView.value = SettingsView.Language,
        },
        {
            id: 3,
            text: foo_1.makeText("settings.menuList.controls"),
            action: () => currentView.value = SettingsView.Controls,
        },
        {
            id: 4,
            text: foo_1.makeText("settings.menuList.about"),
            action: () => currentView.value = SettingsView.Debug,
        },
    ]);

    // ===== TITLE =====
    const dynamicTitleName = computed(() => {
        if (isInSubMenu.value) {
            const map = {
                [SettingsView.Sound]: menuButtons.value[0]!.text,
                [SettingsView.Language]: menuButtons.value[1]!.text,
                [SettingsView.Controls]: menuButtons.value[2]!.text,
                [SettingsView.Debug]: menuButtons.value[3]!.text,
            };
            return foo_2.correctText(map[currentView.value]);
        } else {
            return foo_1.makeText("settings.title", "empty");
        };
    });

    // ===== BACK =====
    function backButtonClick() {
        if (isInSubMenu.value) {
            currentView.value = SettingsView.Main;
        } else {
            isHeaderShown.value = false;
            setTimeout(() => {
                currentView.value = SettingsView.null;
            }, 100);
            setTimeout(() => {
                isBackButtonsShown.value = false;
            }, 400);

            setTimeout(() => {
                gameState.closeOverlay();
            }, 500);
        };
    };

    onMounted(() => {
        isHeaderShown.value = true;
        setTimeout(() => {
            currentView.value = SettingsView.Main
        }, 200);
        setTimeout(() => {
            isBackButtonsShown.value = true;
        }, 500);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";

    .correction {
        justify-content: flex-end !important;
    }

    .settings_container {
        height: 30rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
        padding-bottom: 2.687rem;
    }

    .buttons_group {
        height: fit-content;
        display: flex;
        flex-direction: column;
        background: none;
        border: none;
        margin-top: 2.4rem;

        // имитируем row-gap (между кнопками)
        &>*+* {
            margin-top: 0.938rem;
        }
    }

    .menu_btn {
        background: none;
        border: none;
        // ---
        font-family: 'vla_shu';
        font-size: 1.875rem; // (30px)
        color: #FDFFE3;
        filter: drop-shadow(0 0 15px rgba(255, 246, 25, 0.4));
        cursor: pointer;
        transition: all 0.1s ease-in-out;

        &:hover {
            color: #72B3EE;
            filter: drop-shadow(0 0 20px rgba(121, 190, 255, 1));
            transition: all 0.1s ease-in-out;
        }
    }

    /* we will explain what these classes do next! */
    // .v-enter-active {
    //     transition: opacity 0.5s ease;
    // }

    // .v-enter-from,
    // .v-leave-to {
    //     opacity: 1;
    // }
</style>