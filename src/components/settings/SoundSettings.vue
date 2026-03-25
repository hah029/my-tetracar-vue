<template>
    <TransitionGroup name="buttons_group_showing" tag="div" class="settings_sub_container">
        <div v-if="rowView[0]" class="settings-row">
            <span>{{ $t("settings.music.musicEnabled") }}</span>
            <button class="toggle-btn" @click="toggleMusic">
                {{ audioStore.musicEnabled ? $t("settings.toggleOn") : $t("settings.toggleOff") }}
            </button>
        </div>

        <div v-if="rowView[1]" class="settings-row">
            <span>{{ $t("settings.music.sfxEnabled") }}</span>
            <button class="toggle-btn" @click="toggleSound">
                {{ audioStore.sfxEnabled ? $t("settings.toggleOn") : $t("settings.toggleOff") }}
            </button>
        </div>

        <div v-if="rowView[2]" class="settings-row volume-row">
            <span>{{ $t("settings.music.volumeLevel") }}</span>
            <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="updateVolume" />
            <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
        </div>
    </TransitionGroup>
</template>


<script setup lang="ts">
    import { onMounted, defineProps, watch, ref } from "vue";
    import { useAudioStore } from "@/store/audioStore";
    import { SoundManager } from "@/game/sound/SoundManager";

    const audioStore = useAudioStore();
    const soundManager = SoundManager.getInstance();
    const volume = ref(Number(localStorage.getItem("masterVolume") ?? 0.6));
    const rowView = ref([false, false, false]);

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
        }, 300);
    });
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss";
    @use "@/styles/settings.scss";
    @use "@/styles/animations.scss";

    .volume-row input {
        flex: 1;
    }

    .volume-value {
        width: 50px;
        text-align: right;
    }
</style>