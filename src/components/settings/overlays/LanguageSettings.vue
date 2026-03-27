<template>
    <TransitionGroup name="buttons_group_showing" tag="div" class="settings_sub_container">
        <div
            v-for="(lang, index) in availableLanguages"
            v-if="rowView"
            :key="index"            
            :style="{ animationDelay: `${index * 0.06}s` }"
            class="container_correction"
        >
            <label class="settings_row row_correction" :for="lang.code">
                <div class="left_part">
                    <div class="flag_image_container">
                        <div class="flag_inner_container">
                            <img class="flag_img" :src="lang.src" />
                        </div>
                        <div class="flag_inner_container">
                            <img 
                                class="flag_frame" 
                                :class="{ 'flag_frame--active': currentLang == lang.code }"
                                src="@/assets/images/flag_frame.svg" 
                            />
                        </div>
                    </div>
                    <div class="addit_font" :class="{ 'addit_font--active': currentLang == lang.code }">{{ lang.name }}</div>
                </div>
                <div class="checker_image_container">
                    <img v-if="currentLang == lang.code" class="checker_img" src="@/assets/images/flag_checker.svg" />
                </div>
            </label>    
            <input :checked="currentLang == lang.code" type="radio" :name="lang.name" :id="lang.code" :value="lang.code" @change="setLanguage(lang.code)" />
        </div>
    </TransitionGroup>
</template>


<script setup lang="ts">
    import { onMounted, ref, watch, defineProps, computed } from "vue";
    import { useTranslation } from "i18next-vue";
    import { createNewText } from '@/helpers/functions';

    import flag_auto from "@/assets/images/flag_auto.svg";
    import flag_ru from "@/assets/images/flag_ru.svg";
    import flag_en from "@/assets/images/flag_en.svg";
    import flag_es from "@/assets/images/flag_es.svg";

    const { i18next } = useTranslation();
    const currentLang = computed(() => i18next.language)
    const AUTO_LANG = 'ru';
    const supportedLanguages = ['ru', 'en'];
    // const supportedLanguages = ['auto', 'ru', 'en'];
    const foo = createNewText();
    const rowView = ref(false);

    const langSrc = {
        auto: flag_auto,
        ru: flag_ru,
        en: flag_en,
        es: flag_es,
    };

    const availableLanguages = computed(() => {
        return supportedLanguages.map((code) => ({
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
        };
    });

    function setLanguage(code: string) {
        if (code == "auto") {
            i18next.changeLanguage(AUTO_LANG);
        } else {
            i18next.changeLanguage(code);
        };
    };

    onMounted(() => {
        setTimeout(() => {
            rowView.value = true;
        }, 400);
    });
</script>


<style lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/settings.scss";
    @use "@/styles/animations.scss";

    .container_correction {
        margin-top: 0;
    }

    .row_correction {
        padding: 0.625rem;
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
        gap: 0.9375rem;
        height: 100%;
    }

    .checker_image_container {
        height: 1.875rem;
    }

    .flag_image_container {
        position: relative;
        width: 2.625rem;
        height: 1.875rem;
    }

    .flag_inner_container {
        position: absolute;
        width: 100%;
    }

    .flag_img {
        width: 100%;
    }
    .flag_frame {
        width: 100%;
        filter: invert(92%) sepia(19%) saturate(274%) hue-rotate(26deg) brightness(107%) contrast(105%);
    }
    .flag_frame--active {
        filter: invert(75%) sepia(7%) saturate(4910%) hue-rotate(179deg) brightness(96%) contrast(94%);
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
