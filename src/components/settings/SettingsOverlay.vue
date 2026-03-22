<template>
    <div class="container">
        <div class="settings_container">

            <div class="sub_container">
                <!-- HEADER -->
                <div class="header_block">
                    <div class="header_text">{{ dynamicTitleName }}</div>
                    <div class="header_image">
                        <img class="image" src="@/assets/images/title_line_image.svg" />
                    </div>
                </div>
                <!-- <Transition name="header_footer_block_anim">
                </Transition> -->

                <!-- CONTENT -->
                <div :key="currentView">

                    <!-- MAIN -->
                    <div v-if="currentView === SettingsView.Main" class="buttons_group">
                        <button v-for="(btn, index) in menuButtons" :key="btn.id" class="menu_btn"
                            :style="{ animationDelay: `${index * 0.06}s` }" @click="btn.action">
                            {{ btn.text }}
                        </button>
                    </div>

                    <!-- SUBMENUS -->
                    <SoundSettings v-else-if="currentView === SettingsView.Sound" />
                    <LanguageSettings v-else-if="currentView === SettingsView.Language" />
                    <ControlSettings v-else-if="currentView === SettingsView.Controls" />
                    <DebugSettings v-else-if="currentView === SettingsView.Debug" />

                </div>
                <!-- <Transition name="fade" mode="out-in"> -->
                <!-- </Transition> -->
            </div>

            <!-- BACK -->
            <button class="menu_btn" @click="backButtonClick">
                {{ foo_1.makeText("mainMenu.goBack") }}
            </button>
            <!-- <Transition name="header_footer_block_anim"> -->
            <!-- </Transition> -->

        </div>
    </div>
</template>


<script setup lang="ts">
import DebugSettings from "./DebugSettings.vue";
import SoundSettings from "./SoundSettings.vue";
import LanguageSettings from "./LanguageSettings.vue";
import ControlSettings from "./ControlSettings.vue";

import { computed, ref } from "vue";
import { createNewText, deleteTextLines } from '@/helpers/functions';
import { useGameState } from "@/store/gameState";

enum SettingsView {
    Main,
    Sound,
    Language,
    Controls,
    Debug,
}

// ===== STORES =====
const gameState = useGameState();

// ===== LOCAL STATE =====
const currentView = ref<SettingsView>(SettingsView.Main);

// ===== TEXT =====
const foo_1 = createNewText();
const foo_2 = deleteTextLines();

// ===== UI STATE (без таймаутов) =====
const isInSubMenu = computed(() => currentView.value !== SettingsView.Main);

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
    if (!isInSubMenu.value) {
        return foo_1.makeText("settings.title", "empty");
    }

    const map = {
        [SettingsView.Sound]: menuButtons.value[0]!.text,
        [SettingsView.Language]: menuButtons.value[1]!.text,
        [SettingsView.Controls]: menuButtons.value[2]!.text,
        [SettingsView.Debug]: menuButtons.value[3]!.text,
    };

    return foo_2.correctText(map[currentView.value]);
});

// ===== BACK =====
function backButtonClick() {
    if (isInSubMenu.value) {
        currentView.value = SettingsView.Main;
    } else {
        gameState.closeOverlay();
    }
}
</script>


<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/animations.scss";


.settings_container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    gap: 10rem;
}

/* we will explain what these classes do next! */
.v-enter-active {
    transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 1;
}
</style>