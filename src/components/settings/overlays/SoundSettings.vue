<template>
    <TransitionGroup name="buttons_group_showing" tag="div" class="settings_sub_container addit_font">

        <div v-if="rowView[0]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.musicEnabled", "empty") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': audioStore.musicEnabled }" @click="toggleMusic">
                {{ audioStore.musicEnabled ?
                    foo.makeText("settings.toggleOn", "empty") :
                    foo.makeText("settings.toggleOff", "empty")
                }}
            </button>
        </div>

        <div v-if="rowView[1]" class="settings_row">
            <span>{{ $t("settings.vfxAndMusic.sfxEnabled") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': audioStore.sfxEnabled }" @click="toggleSound">
                {{ audioStore.sfxEnabled ?
                    foo.makeText("settings.toggleOn", "empty") :
                    foo.makeText("settings.toggleOff", "empty")
                }}
            </button>
        </div>

        <div v-if="rowView[2]" class="settings_row">
            <span>{{ $t("settings.vfxAndMusic.volumeLevel") }}</span>
            <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="updateVolume" class="custom_slider" />
        </div>

    </TransitionGroup>
</template>


<script setup lang="ts">
    import { onMounted, watch, ref } from "vue";
    import { useAudioStore } from "@/store/audioStore";
    import { SoundManager } from "@/game/sound/SoundManager";
    import { createNewText } from '@/helpers/functions';
    import { useGraphicsStore } from "@/store/graphicsStore";

    const audioStore = useAudioStore();
    const soundManager = SoundManager.getInstance();
    const volume = ref(audioStore.masterVolume);
    const rowView = ref([false, false, false]);
    const rowViewCount = rowView.value.length;

    const foo = createNewText();

    function toggleMusic() {
        audioStore.toggleMusic();
        if (audioStore.musicEnabled) soundManager.play("music_background");
    };

    function toggleSound() {
        audioStore.toggleSFX();
    };

    function updateVolume() {
        soundManager.setMasterVolume(volume.value);
        audioStore.setVolume(volume.value);
        soundManager.play("sfx_jump");
    };

    watch(
        () => audioStore.masterVolume,
        (value) => {
            volume.value = value;
        },
        { immediate: true },
    );

    const props = defineProps<{
        backStatus: boolean;
    }>();

    watch(() => props.backStatus, (newVal) => {
        if (newVal) {
            // Скрываем в обратном порядке с задержками
            for (let i = 0; i < rowViewCount; i++) {
                setTimeout(() => {
                    rowView.value[rowViewCount - 1 - i] = false;
                }, i * 100);
            }
        }
    });

    onMounted(() => {
        // Появление с задержками
        for (let i = 0; i < rowViewCount; i++) {
            setTimeout(() => {
                rowView.value[i] = true;
            }, 750 + i * 100);
        }
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/settings.scss";
    @use "@/styles/animations.scss";

    // стили трека
    .custom_slider {
        appearance: none; // сброс дефолтных стилей бегунка
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
</style>
