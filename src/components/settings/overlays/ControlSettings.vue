<template>
    <div class="controls_global_container" @click="changeControlType()">
        <Transition v-if="controlsType == 'mobile'" name="buttons_group_showing" tag="div">
            <div v-if="imageView" class="mobile_container">
                <span v-for="(control, index) in mobileControls" :class="setMobileTextStyle(control.id)" :key="control.id"
                :style="{ animationDelay: `${index * 0.06}s` }">
                    {{ control.text }}
                </span>
                <img class="vector_img"  src="@/assets/images/controls_mobile.svg" />
                <div class="left_right_handed_switcher_block" @click.stop="switchHandedDirection()">
                    <div class="content_block">
                        <span class="switcher_label">
                            {{ foo.makeText("settings.controls.mobileLabels.switcher", "empty") }}
                        </span>
                        <div class="switcher_image_block">
                            <div class="frame_container">
                                <img class="vector_img switcher_corr" src="@/assets/images/switcher_frame.svg" />
                            </div>
                            <div class="circle_container" :style="setCircleStyle">
                                <img class="vector_img switcher_corr" src="@/assets/images/switcher_circle.svg" />
                            </div>
                        </div>
                    </div>
                    <div class="divider_block">
                        <div class="divider" :style="setDividerStyle"></div>
                    </div>
                </div>
            </div>
        </Transition>

        <TransitionGroup v-if="controlsType == 'desktop'" name="buttons_group_showing" tag="div"
            class="settings_sub_container container_correction">
            <!-- v-if="currentView === SettingsView.Main" -->
            <div v-for="(row, index) in desktopControls" v-if="rowView" class="settings_row addit_font" :key="row.id"
                :style="{ animationDelay: `${index * 0.06}s` }">
                <span>{{ row.text }}</span>
                <div class="right_part">
                    <div v-if="row.id == 1 || row.id == 2 || row.id == 3" class="button_icon">
                        <img class="vector_img img_correction" :class="setArrowDirection(row.id)"
                            src="@/assets/images/arrow.svg" />
                    </div>
                    <div class="button_icon" :class="{ 'button_icon--extended': row.id == 4 || row.id == 5 }">{{ row.key }}</div>
                </div>
            </div>
        </TransitionGroup>
    </div>
</template>


<script setup lang="ts">
    import { onMounted, ref, watch, computed } from "vue";
    import { useTranslation } from "i18next-vue";
    import { createNewText } from '@/helpers/functions';

    const { i18next } = useTranslation();
    const currentLang = computed(() => i18next.language)
    const imageView = ref(false);
    const rowView = ref(false);
    const isRightHandedControls = ref(true);

    // const controlsType = ref('mobile');
    const controlsType = ref('desktop');
    const foo = createNewText();

    const desktopControls = computed(() => [
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
            text: foo.makeText("settings.controls.labels.drop", "empty"),
            key: foo.makeText("settings.controls.keys.drop", "empty"),
        },
        {
            id: 4,
            text: foo.makeText("settings.controls.labels.fire", "empty"),
            key: foo.makeText("settings.controls.keys.fire", "empty"),
        },
        {
            id: 5,
            text: foo.makeText("settings.controls.labels.pause", "empty"),
            key: foo.makeText("settings.controls.keys.pause", "empty"),
        },
    ]);

    const mobileControls = computed(() => [
        {
            id: 1,
            text: foo.makeText("settings.controls.mobileLabels.pause", "empty"),
        },
        {
            id: 2,
            text: foo.makeText("settings.controls.mobileLabels.fire", "empty"),
        },
        {
            id: 3,
            text: foo.makeText("settings.controls.mobileLabels.swipe", "empty"),
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

    // переключение контролов (PC - mobile)
    function changeControlType() {
        if (controlsType.value == 'mobile') {
            imageView.value = false;
            setTimeout(() => {
                controlsType.value = 'desktop';
            }, 400);
            setTimeout(() => {
                rowView.value = true;
            }, 600);

        } else if (controlsType.value == 'desktop') {
            rowView.value = false;
            setTimeout(() => {
                controlsType.value = 'mobile';
            }, 400);
            setTimeout(() => {
                imageView.value = true;
            }, 600);
        };
    };

    // определяем направление значка стрелки внутри кнопки
    function setArrowDirection(id_) {
        if (id_ == 2) {
            return 'arrow--right';
        } else if (id_ == 3) {
            return 'arrow--down';
        };
    };

    // определяем направление значка стрелки внутри кнопки
    function setMobileTextStyle(id_) {
        if (id_ == 1) {
            return 'pause_text';
        } else if (id_ == 2) {
            return 'fire_text';
        } else if (id_ == 3) {
            return 'swipe_text';
        };
    };

    function switchHandedDirection() {
        isRightHandedControls.value = !isRightHandedControls.value;
    };

    // устанавливаем стиль подчеркивания под текстом "Левша/правша"
    const setDividerStyle = computed(() => {
        let myPos;
        let myWidth;

        if (isRightHandedControls.value) {
            if (i18next.language == 'ru') {
                myPos = 3.125;
                myWidth = 5.5;
            } else if (i18next.language == 'en') {
                myPos = 3.3125;
                myWidth = 9;
            };
        } else {
            if (i18next.language == 'ru') {
                myPos = 9.5;
                myWidth = 4.75;
            } else if (i18next.language == 'en') {
                myPos = 13.375;
                myWidth = 2.75;
            };
        };

        return { 
            right: `${myPos}rem`,
            width: `${myWidth}rem`
        };
    });

    // меняем позицию кружка рядом с текстом "Левша/правша"
    const setCircleStyle = computed(() => {
        let myPos = isRightHandedControls.value ? 1.375 : 0.375;

        return { 
            left: `${myPos}rem`,
        };
    });

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
        position: relative;
        width: 31.9375rem;
        height: 13.75rem;
        margin-top: 3.25rem;
        font-size: 1.25rem;
        color: #FDFFE3;
        text-transform: uppercase;
        font-family: "jost-light";
        letter-spacing: 0.063rem;
        text-align: center;
    }
    .pause_text {
        position: absolute;
        top: 0.25rem;
        left: 0rem;
        width: 7rem;
    }
    .fire_text {
        position: absolute;
        top: 11.9rem;
        left: 0rem;
        width: 6.375rem;
    }
    .swipe_text {
        position: absolute;
        top: 11.9rem;
        right: 0rem;
        width: 6.375rem;
    }
    .left_right_handed_switcher_block {
        position: absolute;
        top: 1.5rem;
        right: 0rem;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        justify-content: flex-start;
        gap: 0.25rem;
        font-size: 1.125rem;
        cursor: pointer;
    }
    .content_block {
        // position: relative;
        // top: 1.5rem;
        // right: 0rem;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 1rem;
    }
    .switcher_image_block {
        position: relative;
        width: 2.5rem;
        height: 1.375rem;
    }
    .frame_container {
        position: absolute;
        width: 100%;
        height: 100%;
    }
    .circle_container {
        position: absolute;
        width: 0.75rem;
        height: 0.75rem;
        top: 0.1125rem;
    }
    .switcher_corr {
        filter: invert(92%) sepia(19%) saturate(274%) hue-rotate(26deg) brightness(107%) contrast(105%);
    }

    .divider_block {
        height: 0.0625rem;
        width: 100%;
    }
    .divider {
        height: 100%;
        background: rgba(255, 255, 255, 0.7);
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

        .arrow--down {
            rotate: 270deg;
        }
    // #endregion
</style>