<template>
    <div class="container correction">
        <div class="settings_container">

            <!-- <div class="sub_container"> -->
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
                <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group group_correction">
                    <!-- MAIN -->
                    <button
                        v-for="(btn, index) in menuButtons"
                        v-if="currentView === SettingsView.Main"
                        :key="btn.id" 
                        class="menu_btn btn_correction"
                        :style="{ animationDelay: `${index * 0.06}s` }" 
                        @click="btn.action"
                    >
                        {{ btn.text }}
                    </button>
                </TransitionGroup>
    
                <!-- SUBMENUS -->
                <SoundSettings v-if="currentView === SettingsView.Sound" :backStatus="isBackButtonClicked" />
                <LanguageSettings v-else-if="currentView === SettingsView.Language" :backStatus="isBackButtonClicked" />
                <ControlSettings v-else-if="currentView === SettingsView.Controls" />
                <DebugSettings v-else-if="currentView === SettingsView.Debug" />
            <!-- </div> -->

            <!-- BACK -->
            <Transition name="header_footer_block_anim">
                <button v-if="isBackButtonShown" class="menu_btn btn_correction" @click="backButtonClick">
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
            isBackButtonClicked.value = true;
            setTimeout(() => {
                isBackButtonClicked.value = false;
                currentView.value = SettingsView.Main;
            }, 500);
        } else {
            isHeaderShown.value = false;
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

    onMounted(() => {
        isHeaderShown.value = true;
        setTimeout(() => {
            currentView.value = SettingsView.Main
        }, 200);
        setTimeout(() => {
            isBackButtonShown.value = true;
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
        position: relative;
        height: 30rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-between;
        box-sizing: border-box;
        padding-bottom: 2.687rem;
    }

    .group_correction {
        top: 8.75rem;
        
        &>*+* {
            margin-top: 0.938rem; // 15px - row-gap (между кнопками)
        }
    }

    .btn_correction {
        font-size: 1.875rem; // (30px)
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