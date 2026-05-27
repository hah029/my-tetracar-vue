<template>
    <TransitionGroup name="buttons_group_showing" tag="div" class="settings_sub_container addit_font">
        <!-- VFX общий -->
        <div v-if="rowView[0]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.vfxEnabled", "empty") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.vfxEnabled }" @click="toggleVfx">
                {{ graphicsStore.vfxEnabled ?
                    foo.makeText("settings.toggleOn", "empty") :
                    foo.makeText("settings.toggleOff", "empty")
                }}
            </button>
        </div>

        <!-- Bloom (индивидуально) -->
        <div v-if="rowView[1]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.bloomEnabled", "Bloom") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.bloomEnabled }"
                @click="toggleBloom">
                {{ graphicsStore.bloomEnabled ?
                    foo.makeText("settings.toggleOn", "empty") :
                    foo.makeText("settings.toggleOff", "empty")
                }}
            </button>
        </div>

        <!-- Bloom (индивидуально) -->
        <div v-if="rowView[2]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.afterimageEnabled", "Motion Blur") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.afterimageEnabled }"
                @click="toggleAfterimage">
                {{ graphicsStore.afterimageEnabled ?
                    foo.makeText("settings.toggleOn", "empty") :
                    foo.makeText("settings.toggleOff", "empty")
                }}
            </button>
        </div>

        <!-- FXAA (индивидуально) -->
        <div v-if="rowView[3]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.fxaaEnabled", "FXAA") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.fxaaEnabled }" @click="toggleFxaa">
                {{ graphicsStore.fxaaEnabled ?
                    foo.makeText("settings.toggleOn", "empty") :
                    foo.makeText("settings.toggleOff", "empty")
                }}
            </button>
        </div>

        <div v-if="rowView[4]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.rgbShiftEnabled", "RGB Shift") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.rgbShiftEnabled }"
                @click="toggleRGBShift">
                {{ graphicsStore.rgbShiftEnabled ?
                    foo.makeText("settings.toggleOn", "empty") :
                    foo.makeText("settings.toggleOff", "empty")
                }}
            </button>
        </div>

        <!-- Тени (вкл/выкл) -->
        <div v-if="rowView[5]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.shadowEnabled", "Тени") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.shadowEnabled }"
                @click="toggleShadows">
                {{ graphicsStore.shadowEnabled ?
                    foo.makeText("settings.toggleOn", "empty") :
                    foo.makeText("settings.toggleOff", "empty")
                }}
            </button>
        </div>

        <!-- Качество теней (цикличное) -->
        <div v-if="rowView[6] && graphicsStore.shadowEnabled" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.shadowQuality", "Качество теней") }}</span>
            <button class="toggle_btn toggle_btn--quality" @click="cycleShadowQuality">
                {{ shadowQualityLabel }}
            </button>
        </div>

        <!-- Ночной режим -->
        <div v-if="rowView[7]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.nightMode", "Ночной режим") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': graphicsStore.nightMode }"
                @click="toggleNightMode">
                {{ graphicsStore.nightMode ?
                    foo.makeText("settings.toggleOn", "empty") :
                    foo.makeText("settings.toggleOff", "empty")
                }}
            </button>
        </div>
    </TransitionGroup>
</template>


<script setup lang="ts">
import { onMounted, watch, ref, computed } from "vue";
import { createNewText } from '@/helpers/functions';
import { useGraphicsStore } from "@/store/graphicsStore";

const graphicsStore = useGraphicsStore();
const rowView = ref(Array(9).fill(false)); // 9 строк

const foo = createNewText();

// Подписи качества теней
const shadowQualityLabels = {
    low: 'Низкое',
    medium: 'Среднее',
    high: 'Высокое'
};
const shadowQualityLabel = computed(() => shadowQualityLabels[graphicsStore.shadowQuality] || 'Среднее');

// Переключения
function toggleVfx() {
    graphicsStore.toggleVfx();
}
function toggleBloom() {
    graphicsStore.toggleBloom();
}
function toggleAfterimage() {
    graphicsStore.toggleAfterimage();
}
function toggleFxaa() {
    graphicsStore.toggleFxaa();
}
function toggleShadows() {
    graphicsStore.toggleShadow();
}
function cycleShadowQuality() {
    graphicsStore.cycleShadowQuality();
}
function toggleNightMode() {
    graphicsStore.toggleNightMode();
}
function toggleRGBShift() {
    graphicsStore.toggleRGBShift();
}


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
        }
    }
});

onMounted(() => {
    // Появление с задержками
    const total = rowView.value.length;
    for (let i = 0; i < total; i++) {
        setTimeout(() => {
            rowView.value[i] = true;
        }, 400 + i * 100); // начинаем с задержки 400 мс
    }
});
</script>


<style scoped lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/settings.scss";
@use "@/styles/animations.scss";

.custom_slider {
    appearance: none;
    width: 7.5rem;
    height: 0.125rem;
    background-color: #72B3EE;
    border-radius: 2px;

    &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 1.125rem;
        height: 1.125rem;
        background-color: #72B3EE;
        border: none;
        border-radius: 50%;
        position: relative;
    }
}

/* Дополнительный стиль для кнопки качества теней (не toggle) */
.toggle_btn--quality {
    background: none;
    border: 1px solid #72B3EE;
    color: #72B3EE;
    padding: 0.3rem 0.8rem;
    border-radius: 4px;
}
</style>