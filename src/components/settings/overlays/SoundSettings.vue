<template>
    <TransitionGroup name="buttons_group_showing" tag="div" class="settings_sub_container addit_font">
        <div v-if="rowView[0]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.vfxEnabled", "empty") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': vfxTempStore }" @click="toggleVfx">
                {{ vfxTempStore ? 
                    foo.makeText("settings.toggleOn", "empty") : 
                    foo.makeText("settings.toggleOff", "empty") 
                }}
            </button>
        </div>

        <div v-if="rowView[1]" class="settings_row">
            <span>{{ foo.makeText("settings.vfxAndMusic.musicEnabled", "empty") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': audioStore.musicEnabled }" @click="toggleMusic" >
                {{ audioStore.musicEnabled ? 
                    foo.makeText("settings.toggleOn", "empty") : 
                    foo.makeText("settings.toggleOff", "empty") 
                }}
            </button>
        </div>

        <div v-if="rowView[2]" class="settings_row">
            <span>{{ $t("settings.vfxAndMusic.sfxEnabled") }}</span>
            <button class="toggle_btn" :class="{ 'toggle_btn--active': audioStore.sfxEnabled }" @click="toggleSound">
                {{ audioStore.sfxEnabled ? 
                    foo.makeText("settings.toggleOn", "empty") : 
                    foo.makeText("settings.toggleOff", "empty") 
                }}
            </button>
        </div>

        <div v-if="rowView[3]" class="settings_row">
            <span>{{ $t("settings.vfxAndMusic.volumeLevel") }}</span>
            <input 
                type="range" 
                min="0" max="1" step="0.01" 
                v-model="volume" 
                @input="updateVolume" 
                class="custom_slider"
            />
        </div>
    </TransitionGroup>
</template>


<script setup lang="ts">
    import { onMounted, defineProps, watch, ref } from "vue";
    import { useAudioStore } from "@/store/audioStore";
    import { SoundManager } from "@/game/sound/SoundManager";
    import { createNewText } from '@/helpers/functions';

    const audioStore = useAudioStore();
    const soundManager = SoundManager.getInstance();
    const volume = ref(Number(localStorage.getItem("masterVolume") ?? 0.6));
    const rowView = ref([false, false, false, false]);
    const vfxTempStore = ref(false);

    const foo = createNewText();
    
    function toggleVfx() {
        console.log('Включаем / выключаем графические эффекты...');
        vfxTempStore.value = !vfxTempStore.value;
        // audioStore.toggleMusic();
        // if (audioStore.vfxEnabled) soundManager.play("music_background");
    };

    function toggleMusic() {
        audioStore.toggleMusic();
        if (audioStore.musicEnabled) soundManager.play("music_background");
    };

    function toggleSound() {
        audioStore.toggleSFX();
    };

    function updateVolume() {
        soundManager.setMasterVolume(volume.value);
        localStorage.setItem("masterVolume", volume.value.toString());
        soundManager.play("sfx_click");
    };

    const props = defineProps<{
        backStatus: boolean;
    }>();

    watch(() => props.backStatus, (newVal) => {
        if (newVal) {
            rowView.value[0] = false;
            setTimeout(() => {
                rowView.value[1] = false;
            }, 100);
            setTimeout(() => {
                rowView.value[2] = false;
            }, 200);
            setTimeout(() => {
                rowView.value[3] = false;
            }, 300);
        };
    });

    onMounted(() => {
        setTimeout(() => {
            rowView.value[0] = true;
            setTimeout(() => {
                rowView.value[1] = true;
            }, 100);
            setTimeout(() => {
                rowView.value[2] = true;
            }, 200);
            setTimeout(() => {
                rowView.value[3] = true;
            }, 300);
        }, 400);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/settings.scss";
    @use "@/styles/animations.scss";

    // стили трека
    .custom_slider {
        appearance: none;   // сброс дефолтных стилей бегунка
        width: 7.5rem;
        height: 0.125rem;
        background-color: #72B3EE;
        border-radius: 2px;

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 1.125rem;
            height: 1.125rem;
            background-color: #72B3EE;
            border: 0.15rem solid #72B3EE;
            border-radius: 50%;
            // margin-top: -0.5rem; // центрируем относительно трека
            box-shadow: 0 0 0 0.3rem #000;
        }
    }

    // .custom_slider::-webkit-slider-runnable-track {
    //     width: 7.5rem;
    //     height: 0.125rem;
    //     background-color: #72B3EE;
    // }
    // .custom_slider::-moz-range-track {
    //     width: 7.5rem;
    //     height: 0.125rem;
    //     background-color: #72B3EE;
    // }

    // стили ручки
    // .custom_slider::-webkit-slider-thumb {
    //     -webkit-appearance: none;
    //     width: 1.125rem;
    //     height: 1.125rem;
    //     background-color: #72B3EE;
    //     border: solid #72B3EE 0.15rem;
    //     // border-radius: 0.1875rem;
    //     border-radius: 50%;
    // }
</style>