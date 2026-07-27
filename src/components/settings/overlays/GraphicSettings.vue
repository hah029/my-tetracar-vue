<template>
    <TransitionGroup name="buttons_group_showing" tag="div" class="settings_sub_container addit_font">
        <!-- Bloom -->
        <div v-if="rowView[1]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.bloomEnabled", "Bloom") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.bloomEnabled }" @click="toggleBloom">
                {{ defineSwitcherState(graphicsStore.bloomEnabled) }}
            </button>
        </div>

        <!-- Bloom -->
        <div v-if="rowView[2]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.afterimageEnabled", "Motion Blur") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.afterimageEnabled }" @click="toggleMotionBlur">
                {{ defineSwitcherState(graphicsStore.afterimageEnabled) }}
            </button>
        </div>

        <!-- FXAA -->
        <div v-if="rowView[3]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.fxaaEnabled", "FXAA") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.fxaaEnabled }" @click="toggleFxaa">
                {{ defineSwitcherState(graphicsStore.fxaaEnabled) }}
            </button>
        </div>

        <!-- RGB смещение -->
        <div v-if="rowView[4]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.rgbShiftEnabled", "RGB Shift") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.rgbShiftEnabled }" @click="toggleRGBShift">
                {{ defineSwitcherState(graphicsStore.rgbShiftEnabled) }}
            </button>
        </div>

        <!-- Тени -->
        <div v-if="rowView[5]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.shadowEnabled", "Тени") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.shadowEnabled }" @click="toggleShadows">
                {{ shadowLabel }}
            </button>
        </div>
    </TransitionGroup>
</template>


<script setup lang="ts">
    import { onMounted, watch, ref, computed } from "vue";
    import { createNewText } from '@/helpers/functions';
    import { useGraphicsStore } from "@/store/graphicsStore";

    const graphicsStore = useGraphicsStore();
    const rowView = ref(Array(7).fill(false));
    const foo = createNewText();
    const shadowLabel = ref('');

    // вкл / выкл свечения (Bloom)
    function toggleBloom() {
        graphicsStore.toggleBloom();
    };

    // вкл / выкл размытия при движении (Motion blur)
    function toggleMotionBlur() {
        graphicsStore.toggleMotionBlur();
    };

    // вкл / выкл сглаживания (FXAA - Fast Approximate Anti-Aliasing)
    function toggleFxaa() {
        graphicsStore.toggleFxaa();
    };

    // вкл / выкл хроматических аберраций (RGBShift или Chromatic Aberration)
    function toggleRGBShift() {
        graphicsStore.toggleRGBShift();
    };

    // вкл / выкл теней (4 состояния: выкл, низкие, средние, высокие)
    function toggleShadows() {
        if (!graphicsStore.shadowEnabled) {
            graphicsStore.toggleShadow();
            graphicsStore.shadowQuality === "low";
            shadowLabel.value = foo.makeText("settings.low", 'empty');
        } else {
            if (graphicsStore.shadowQuality === "low") {
                graphicsStore.setShadowQuality("medium");
                shadowLabel.value = foo.makeText("settings.medium", 'empty');
            } else if (graphicsStore.shadowQuality === "medium") {
                graphicsStore.setShadowQuality("high");
                shadowLabel.value = foo.makeText("settings.high", 'empty');
            } else {
                graphicsStore.setShadowQuality("low");
                graphicsStore.toggleShadow();
                shadowLabel.value = foo.makeText("settings.toggleOff", 'empty');
            };
        };
    };

    // переключение между двумя состояниями свитчера: вкл / выкл
    function defineSwitcherState(statement_) {
        return statement_ ? 
            foo.makeText("settings.toggleOn", "empty") : 
            foo.makeText("settings.toggleOff", "empty")
    };

    const props = defineProps<{
        backStatus: boolean;
    }>();

    watch(() => props.backStatus, (newVal) => {
        if (newVal) {
            // Скрываем в обратном порядке с задержками
            const total = rowView.value.length;
            for (let i = 0; i < total; i++) {
                setTimeout(() => {
                    rowView.value[total - 1 - i] = false;
                }, i * 100);
            };
        };
    });

    onMounted(() => {
        if (!graphicsStore.shadowEnabled) {
            shadowLabel.value = foo.makeText("settings.toggleOff", 'empty');
        } else {
            if (graphicsStore.shadowQuality === "low") {
                shadowLabel.value = foo.makeText("settings.low", 'empty');
            } else if (graphicsStore.shadowQuality === "medium") {
                shadowLabel.value = foo.makeText("settings.medium", 'empty');
            } else {
                shadowLabel.value = foo.makeText("settings.high", 'empty');
            };
        };

        // Появление с задержками
        const total = rowView.value.length;
        for (let i = 0; i < total; i++) {
            setTimeout(() => {
                rowView.value[i] = true;
            }, 750 + i * 100);
        };
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/settings.scss";
    @use "@/styles/animations.scss";
</style>
