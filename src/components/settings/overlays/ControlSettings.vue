<template>
    <div class="controls_global_container">
        <Transition v-if="deviceType==='mobile' || deviceType==='tablet'" name="buttons_group_showing" tag="div">
            <div class="mobile_container" v-if="imageView">
                <span v-for="(control, index) in mobileControls" :key="control.id"
                    class="addit_font" :class="setMobileTextStyle(control.id)"
                    :style="{ animationDelay: `${index * 0.06}s` }">
                    {{ control.text }}
                </span>
                <img class="vector_img"  src="@/assets/images/controls_mobile.svg" />
            </div>
        </Transition>

        <TransitionGroup v-if="deviceType==='laptop' || deviceType==='desktop'" name="buttons_group_showing" tag="div"
            class="settings_sub_container">
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
    import { createNewText } from '@/helpers/functions';
    import { useDevice } from '@/composables/useDevice';

    const imageView = ref(false);
    const rowView = ref(false);
    const foo = createNewText();
    const { deviceType } = useDevice();

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
        // {
        //     id: 3,
        //     text: foo.makeText("settings.controls.labels.drop", "empty"),
        //     key: foo.makeText("settings.controls.keys.drop", "empty"),
        // },
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
            text: foo.makeText("settings.controls.mobileLabels.left", "empty"),
        },
        {
            id: 4,
            text: foo.makeText("settings.controls.mobileLabels.right", "empty"),
        },
    ]);

    const props = defineProps<{
        backStatus: boolean;
    }>();

    // отлавливаем нажатие кнопки "Назад"
    watch(() => props.backStatus, (newVal) => {
        if (newVal) {
            if (deviceType.value==='mobile' || deviceType.value==='tablet') {
                imageView.value = false;
            } else if (deviceType.value==='laptop' || deviceType.value==='desktop') {
                rowView.value = false;
            };
        };
    });

    // определяем направление значка стрелки внутри кнопки
    function setArrowDirection(id_) {
        if (id_ == 2) {
            return 'arrow--right';
        } else if (id_ == 3) {
            return 'arrow--down';
        };
    };

    // расставляем текст над линиями-выносками (в мобильной версии)
    function setMobileTextStyle(id_) {
        if (id_ == 1) {
            return 'pause_text';
        } else if (id_ == 2) {
            return 'fire_text';
        } else if (id_ == 3) {
            return 'left_text';
        } else if (id_ == 4) {
            return 'right_text';
        };
    };

    onMounted(() => {
        setTimeout(() => {
            if (deviceType.value==='mobile' || deviceType.value==='tablet') {
                imageView.value = true;
            } else if (deviceType.value==='laptop' || deviceType.value==='desktop') {
                rowView.value = true;
            };
        }, 750);
    }); 
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/settings.scss";
    @use "@/styles/animations.scss";
    @use "@/styles/typography" as *;

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
    }
    // #endregion

    // #region - стили мобильных контролов
    .mobile_container {
        position: relative;
        text-align: center;

        width: 102.564vh;   // позже расчитать (для мини-мобил)    
        // height: 42.274vh;   // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 102.564vh;
            // height: 42.274vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // width: 102.564vh;
            // height: 42.274vh;
        // }
    }

    .pause_text {
        position: absolute;
        top: 0.8vh;         // позже расчитать (для мини-мобил)
        left: 2.222vh;      // позже расчитать (для мини-мобил)
        width: 18.889vh;    // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            top: 0.8vh;
            left: 2.222vh;
            width: 18.889vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // top: 0.8vh;
            // left: 2.222vh;
            // width: 18.889vh;
        // }
    }

    .fire_text {
        position: absolute;
        top: 38vh;         // позже расчитать (для мини-мобил)
        left: 82.051vh;      // позже расчитать (для мини-мобил)
        width: 20.513vh;    // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            top: 38vh;
            left: 82.051vh;
            width: 20.513vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // top: 38.889vh;
            // left: 82.051vh;
            // width: 20.513vh;
        // }
    }

    .left_text {
        position: absolute;
        top: 19.1vh;         // позже расчитать (для мини-мобил)
        left: 0vh;      // позже расчитать (для мини-мобил)
        width: 17.179vh;    // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            top: 19.1vh;
            left: 0vh;
            width: 17.179vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // top: 19.1vh;
            // left: 0vh;
            // width: 17.179vh;
        // }
    }

    .right_text {
        position: absolute;
        top: 19.3vh;         // позже расчитать (для мини-мобил)
        left: 84.188vh;      // позже расчитать (для мини-мобил)
        width: 18.462vh;    // позже расчитать (для мини-мобил)

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            top: 19.3vh;
            left: 84.188vh;
            width: 18.462vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // top: 19.3vh;
            // left: 84.188vh;
            // width: 18.462vh;
        // }
    }
    // #endregion

    // #region - стили desktop контролов
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