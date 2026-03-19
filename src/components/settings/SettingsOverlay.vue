<template>
    <div class="container correction">
        <div class="settings_container">

            <div class="sub_container">
                <Transition name="header_footer_block_anim">
                    <div v-if="isHeaderShown" class="header_block">
                        <div class="header_text">{{ dynamicTitleName }}</div>
                        <div class="header_image">
                            <img class='image' src="@/assets/images/title_line_image.svg">
                        </div>
                    </div>
                </Transition>

                <TransitionGroup name="buttons_group_showing" tag="div" class="buttons_group">
                    <button v-for="(btn, index) in menuButtons" v-if="isMainButtonsShown && settingsStateId == 0"
                        :key="btn.id" class="menu_btn" :style="{ animationDelay: `${index * 0.06}s` }"
                        @click="btn.action">
                            {{ btn.text }}
                    </button>
                    <div v-else-if="isMainButtonsShown && settingsStateId == 1" class="asd">
                        <SoundSettings />
                    </div>
                    <div v-else-if="isMainButtonsShown && settingsStateId == 2" class="asd">
                        <LanguageSettings />
                    </div>
                    <div v-else-if="isMainButtonsShown && settingsStateId == 3" class="asd">
                        <!-- Управление... -->
                        {{ foo_1.makeText("preloader.pressAnyButton") }}
                    </div>
                    <div v-else-if="isMainButtonsShown && settingsStateId == 4" class="asd">
                        <DebugSettings />
                    </div>
                </TransitionGroup>

            </div>

            <Transition name="header_footer_block_anim">
                <button v-if="isBackButtonsShown" class="menu_btn" @click="backButtonClick()">{{ foo_1.makeText("mainMenu.goBack") }}</button>
            </Transition>
        </div>
    </div>
</template>


<script setup lang="ts">
    import DebugSettings from "./DebugSettings.vue";
    import SoundSettings from "./SoundSettings.vue";
    import LanguageSettings from "./LanguageSettings.vue";
    import { onMounted, computed, defineEmits, ref } from "vue";
    import { createNewText } from '@/helpers/functions';
    import { deleteTextLines } from '@/helpers/functions';
    

    


    
    // подключаем emit
    const emit = defineEmits(['event']);

    // const settingsType = ref<'controls' | 'sound' | 'graphic' | 'debug' | 'lang'>("sound");

    const isHeaderShown = ref(false);
    const isMainButtonsShown = ref(false);
    // const isGraphicsButtonsShown = ref(false);
    const isBackButtonsShown = ref(false);
    const settingsStateId = ref(0);
    
    const foo_1 = createNewText();
    const foo_2 = deleteTextLines();



    

    const menuButtons = computed(() => [
        { id: 1, text: foo_1.makeText("settings.settingsMenuList.technical"), action: () => { settingsStateId.value = 1 } },
        { id: 2, text: foo_1.makeText("settings.settingsMenuList.lang"), action: () => { settingsStateId.value = 2 } },
        { id: 3, text: foo_1.makeText("settings.settingsMenuList.controls"), action: () => { settingsStateId.value = 3 } },
        { id: 4, text: foo_1.makeText("settings.settingsMenuList.about"), action: () => { settingsStateId.value = 4 } },
    ]);

    const dynamicTitleName = computed(() => {
        return foo_2.correctText(menuButtons.value[settingsStateId.value - 1]?.text || foo_1.makeText("settings.title", 'empty'));
    });

    // сценарии клика по кнопке "Назад"
    function backButtonClick() {
        if (settingsStateId.value == 0) {
            isHeaderShown.value = false;
            setTimeout(() => {
                isMainButtonsShown.value = false;
            }, 100);
            setTimeout(() => {
                isBackButtonsShown.value = false;
            }, 400);

            setTimeout(() => {
                emit('event', 'goBackToMainMenu');
            }, 500);

        } else {
            settingsStateId.value = 0;
        };
    };

    // монтируем компоненту
    onMounted(() => {
        settingsStateId.value = 0;
        isHeaderShown.value = true;
        setTimeout(() => {
            isMainButtonsShown.value = true;
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

.sub_container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
}

// #region - header
.header_block {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
}

.header_text {
    font-family: 'vla_shu';
    font-size: 2.5rem; // (40px)
    color: #72B3EE;
    margin-bottom: 1rem;
    line-height: 1;
}

.header_image {
    width: 34.625rem;
}

.image {
    filter: invert(86%) sepia(40%) saturate(5593%) hue-rotate(183deg) brightness(104%) contrast(101%);
}

// #endregion

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

// .back_button {
//     // margin-bottom: 0;
//     margin-top: 1rem;
// }




.settings-overlay {
    display: flex;
    justify-content: flex-start;
    gap: 60px;
    // border: 1px solid red;
    padding: 50px;
}

.settings-inner-overlay {
    min-width: 20rem;
    min-height: 10rem;
}

.settings-menu-list {
    list-style-type: none;
    margin: 0;
    padding: 0;
    width: 10rem;
    min-width: 100px;
    border-right: 1px solid rgb(255, 255, 255, 0.1);

    &>li {
        height: 50px;
        line-height: 50px;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 300ms;
        text-align: center;
        vertical-align: center;

        &:hover {
            background-color: rgb(255, 255, 255, 0.5);
        }

        &.selected {
            background-color: rgb(255, 255, 255, 0.2);
        }
    }
}


.menu-subtitle {
    font-size: 54px;
    text-transform: uppercase;
    margin: 0 0 30px 0;
    text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
}


/* we will explain what these classes do next! */
.v-enter-active {
    transition: opacity 0.5s ease;
}

.v-enter-from,
.v-leave-to {
    opacity: 0;
}
</style>