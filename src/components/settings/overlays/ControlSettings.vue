<template>
    <div class="controls_global_container" @click="changeControlType()">
        <Transition v-if="controlsType=='mobile'" name="buttons_group_showing" tag="div">
            <div v-if="imageView" class="mobile_container">
                <img class="mobile_img" :src="mobileImages[currentLang]" />
            </div>
        </Transition>
        <TransitionGroup v-if="controlsType=='desktop'" name="buttons_group_showing" tag="div" class="buttons_group group_correction">
            <!-- v-if="currentView === SettingsView.Main" -->
            <div 
                v-for="(row, index) in availableControls" 
                class="settings_row"
                :key="row.id" 
                :style="{ animationDelay: `${index * 0.06}s` }"
                style="color: white;"
            >
                <span>{{ row.text }}</span>
                <span>{{ row.key }}</span>
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
    const controlsType = ref('mobile');
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
        };
    });

    function changeControlType() {
        controlsType.value = controlsType.value=='mobile' ? 'desktop' : 'mobile';
        console.log(controlsType.value);
        
    };

    onMounted(() => {
        setTimeout(() => {
            imageView.value = true;
        }, 400);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/settings.scss";
    @use "@/styles/animations.scss";

    .mobile_container {
        width: 34.625rem;
    }

    .mobile_img {
        width: 100%;
        height: 100%;
    }
</style>