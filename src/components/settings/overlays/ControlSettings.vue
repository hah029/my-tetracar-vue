<template>
    <div class="controls_global_container" @click="changeControlType()">
        <Transition v-if="controlsType=='mobile'" name="buttons_group_showing" tag="div">
            <div v-if="imageView" class="mobile_container">
                <img class="vector_img" :src="mobileImages[currentLang]" />
            </div>
        </Transition>

        <TransitionGroup v-if="controlsType=='desktop'" name="buttons_group_showing" tag="div" class="settings_sub_container container_correction">
            <!-- v-if="currentView === SettingsView.Main" -->
            <div 
                v-for="(row, index) in availableControls" 
                v-if="rowView"
                class="settings_row addit_font"
                :key="row.id" 
                :style="{ animationDelay: `${index * 0.06}s` }"
            >
                <span >{{ row.text }}</span>
                <div class="right_part">
                    <div v-if="row.id==1 || row.id==2" class="button_icon">
                        <img 
                            class="vector_img img_correction" 
                            :class="{ 'arrow--right': row.id==2 }"
                            src="@/assets/images/arrow.svg" 
                        />
                    </div>
                    <div class="button_icon" :class="{ 'button_icon--extended': row.id==3 || row.id==4 }">{{ row.key }}</div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>


<script setup lang="ts">
    import { onMounted, ref, watch, defineProps, computed } from "vue";
    import { useTranslation } from "i18next-vue";
    import mobile_ru from "@/assets/images/controls_mobile_ru.svg";
    import mobile_en from "@/assets/images/controls_mobile_en.svg";
    import { createNewText } from '@/helpers/functions';

    const { i18next } = useTranslation();
    const currentLang = computed(() => i18next.language)
    const imageView = ref(false);
    const rowView = ref(false);

    // const controlsType = ref('mobile');
    const controlsType = ref('desktop');
    const foo = createNewText();

    const mobileImages = {
        ru: mobile_ru,
        en: mobile_en,
    };

    const availableControls = computed(() => [
        {
            id: 1,
            text: foo.makeText("settings.controls.labels.left", "empty"),
            key: foo.makeText("settings.controls.keys.left", "empty"),
        },
        {
            id: 2,
            text: foo.makeText("settings.controls.labels.right", "empty"),
            key: foo.makeText("settings.controls.keys.right", "empty"),
        },
        {
            id: 3,
            text: foo.makeText("settings.controls.labels.fire", "empty"),
            key: foo.makeText("settings.controls.keys.fire", "empty"),
        },
        {
            id: 4,
            text: foo.makeText("settings.controls.labels.pause", "empty"),
            key: foo.makeText("settings.controls.keys.pause", "empty"),
        },
        {
            id: 5,
            text: foo.makeText("settings.controls.labels.shop", "empty"),
            key: foo.makeText("settings.controls.keys.shop", "empty"),
        },
    ]);

    const props = defineProps<{
        backStatus: boolean;
    }>();

    watch(() => props.backStatus, (newVal) => {
        if (newVal) {
            imageView.value = false;
            rowView.value = false;
        };
    });

    function changeControlType() {
        if (controlsType.value=='mobile') {
            imageView.value = false;
            setTimeout(() => {
                controlsType.value = 'desktop';
            }, 400);
            setTimeout(() => {
                rowView.value = true;
            }, 600);

        } else if (controlsType.value=='desktop') {
            rowView.value = false;
            setTimeout(() => {
                controlsType.value = 'mobile';
            }, 400);
            setTimeout(() => {
                imageView.value = true;
            }, 600);
        };
    };

    onMounted(() => {
        setTimeout(() => {
            rowView.value = true;
        }, 400);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/settings.scss";
    @use "@/styles/animations.scss";

    // #region - общее
        .controls_global_container {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            line-height: 1;
        }
        .vector_img {
            width: 100%;
            height: 100%;
        }
    // #endregion

    // #region - стили мобильных контролов
        .mobile_container {
            width: 34.625rem;
        }
    // #endregion

    // #region - стили desktop контролов
        .container_correction {
            &>*+* {
                margin-top: 1rem; // 16px - row-gap (между кнопками)
            }
        }
        .right_part {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 0.3125rem;
        }
        .button_icon {
            width: 1.875rem;
            height: 1.875rem;
            box-sizing: border-box;
            font-size: 1rem;
            display: flex;
            justify-content: center;
            align-items: center;
            border: solid 2px #FDFFE3;
            border-radius: 0.3125rem;

            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
        }
        .button_icon--extended {
            padding: 0rem 0.9375rem;
            width: auto;
        }
        .img_correction {
            width: 50%;
            height: 50%;
            filter: invert(92%) sepia(19%) saturate(274%) hue-rotate(26deg) brightness(107%) contrast(105%);
        }
        .arrow--right {
            rotate: 180deg;
        }
    // #endregion
</style>