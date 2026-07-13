<template>
    <TransitionGroup name="buttons_group_showing" tag="div" class="lang_container_correction">
        <div v-for="(lang, index) in availableLanguages" v-if="rowView" :key="lang.code"
            :style="{ animationDelay: `${index * 0.06}s` }">
            <label class="settings_row row_correction" :for="lang.code">
                <div class="left_part">
                    <div class="flag_image_container" :class="{ 'flag_frame--active': selectedLang === lang.code }">
                        <div class="flag_inner_container">
                            <img class="flag_img" :src="lang.src" />
                        </div>
                    </div>
                    <div class="addit_font" :class="{ 'addit_font--active': selectedLang === lang.code }">
                        {{ writeLangName(lang) }}
                    </div>
                </div>
                <div class="checker_image_container">
                    <img v-if="selectedLang === lang.code" class="checker_img" src="@/assets/images/checker.svg" />
                </div>
            </label>
            <input :checked="selectedLang === lang.code" type="radio" :name="lang.name" :id="lang.code"
                :value="lang.code" @change="setLanguage(lang.code)" />
        </div>
    </TransitionGroup>
</template>


<script setup lang="ts">
    import { onMounted, ref, watch, computed } from "vue";
    import { useTranslation } from "i18next-vue";
    import { createNewText } from '@/helpers/functions';
    import { langSrc } from "@/locales";
    import { resolveAutoLanguage, uiLanguages } from "@/helpers/i18n";

    const { i18next } = useTranslation();

    const foo = createNewText();
    const rowView = ref(false);

    // 👉 что выбрал пользователь (auto | ru | en)
    const selectedLang = ref<string>(localStorage.getItem('lang') || 'auto');

    // 👉 языки для UI (включая auto)
    const availableLanguages = computed(() => {
        return uiLanguages.map((code) => ({
            code,
            name: foo.makeText(`settings.language.${code}`, 'empty'),
            src: langSrc[code],
        }));
    });

    const props = defineProps<{
        backStatus: boolean;
    }>();

    watch(() => props.backStatus, (newVal) => {
        if (newVal) {
            rowView.value = false;
        }
    });

    // 🎯 установка языка
    function setLanguage(code: string) {
        selectedLang.value = code;
        localStorage.setItem('lang', code);

        if (code === "auto") {
            i18next.changeLanguage(resolveAutoLanguage());
        } else {
            i18next.changeLanguage(code);
        }
    };

    function writeLangName(lang_) {
        if (lang_.code == 'auto') {
            return lang_.name + ' (' + resolveAutoLanguage() + ')';
        } else {
            return lang_.name;
        };
    };

    // 🚀 init
    onMounted(() => {
        window.addEventListener('languagechange', () => {
            if (selectedLang.value === 'auto') {
                const lang = resolveAutoLanguage();
                i18next.changeLanguage(lang);
            }
        });

        setTimeout(() => {
            rowView.value = true;
        }, 800);
    });
</script>


<style lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/settings.scss";
    @use "@/styles/animations.scss";
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;

    .lang_container_correction {
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        width: 78.632vh;
        gap: 3.5vh;
        
        // #region - кастомный скролл-бар 
        // overflow-y: scroll;

        // // для Firefox
        // scrollbar-width: thin;
        // scrollbar-color: #72B3EE transparent;

        // // для WebKit (Chrome, Safari, Edge)
        // &::-webkit-scrollbar {
        //     width: 0.625rem;
        // }

        // &::-webkit-scrollbar-track {
        //     background: transparent;
        //     border-radius: 0.5rem;
        // }

        // &::-webkit-scrollbar-thumb {
        //     background: url('/src/assets/images/slider.svg');
        //     background-size: contain;
        //     background-size: contain;
        //     background-position: 0 0;
        //     background-repeat: no-repeat;
        //     // background-position: center;
        //     min-height: 3.125rem;
        //     border-radius: 0.5rem;
        // }

        // // &::-webkit-scrollbar-thumb:hover {
        // //     // background: url('@/assets/images/slider_hover.svg');
        // //     background-image: url('/src/assets/images/slider.svg');
        // // }
        // #endregion

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 78.632vh;
            gap: 3.5vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // width: 25vw;
            // gap: 0.313vw;
        // }
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            width: 26.389vw;
            gap: 0.2vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 23.958vw;
            height: 15.833vw;
            gap: 0.2608vw;
        }
    }

    .row_correction {
        padding: 0vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            padding: 0vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // padding: 25vw;
        // }
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            padding: 0.694vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            padding: 0.521vw;
        }
        
        background: none;
        border: none;
        cursor: pointer;

        &:hover {
            background-color: rgba(253, 255, 227, 0.3);
        }
    }

    .left_part {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        background: none;
        gap: 3.419vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            gap: 3.419vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // gap: 25vw;
        // }
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            gap: 1.389vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            gap: 1.042vw;
        }
    }

    .checker_image_container {
        height: 5.7vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            height: 5.7vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // height: 1.875vw;
        // }
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            height: 1.667vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            height: 1.563vw;
        }
    }

    .flag_image_container {
        position: relative;
        width: 8.034vh; 
        height: 5.812vh;
        border: 0.289vh solid #FDFFE3;
        border-radius: 0.962vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            width: 8.034vh;
            height: 5.812vh;
            border: 0.289vh solid #FDFFE3;
            border-radius: 0.962vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // width: 2.625vw;
            // height: 1.875vw;
            // border: 0.0625vw solid #FDFFE3;
            // border-radius: 0.313vw;
        // }
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            width: 2.917vw;
            height: 2.083vw;
            border: 0.069vw solid #FDFFE3;
            border-radius: 0.347vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            width: 2.1875vw;
            height: 1.5625vw;
            border: 0.0521vw solid #FDFFE3;
            border-radius: 0.261vw;
        }
    }

    .flag_inner_container {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
    }

    .flag_img {
        width: 80%;
        border-radius: 0.962vh;

        @media (min-width: $breakpoint-mobile) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            border-radius: 0.962vh;
        }
        // позже расчитать:
        // @media (min-width: $breakpoint-tablet) and (orientation: landscape) and (hover: none) and (pointer: coarse) { 
            // border-radius: 0.962vh
        // }
        @media (min-width: $breakpoint-laptop) and (orientation: landscape) { 
            border-radius: 0.347vw;
        }
        @media (min-width: $breakpoint-desktop) and (orientation: landscape) {
            border-radius: 0.261vw;
        }
    }

    .flag_frame--active {
        border-color: #72B3EE;
        // border: 0.0625rem solid #72B3EE;
        // filter: invert(75%) sepia(7%) saturate(4910%) hue-rotate(179deg) brightness(96%) contrast(94%);
    }

    .checker_img {
        width: 90%;
        height: 90%;
        filter: invert(75%) sepia(7%) saturate(4910%) hue-rotate(179deg) brightness(96%) contrast(94%);
    }

    input[type="radio"] {
        display: none;
    }

    .addit_font--active {
        color: #72B3EE;
    }
</style>