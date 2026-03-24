<template>
    <TransitionGroup name="buttons_group_showing" tag="div" class="settings_sub_container">
        <div v-if="rowView" class="settings-row">
            <span>{{ $t("settings.music.musicEnabled") }}</span>
            <button class="toggle-btn" @click="toggleMusic">
                {{ audioStore.musicEnabled ? $t("settings.toggleOn") : $t("settings.toggleOff") }}
            </button>
        </div>

        <div v-if="rowView" class="settings-row">
            <span>{{ $t("settings.music.sfxEnabled") }}</span>
            <button class="toggle-btn" @click="toggleSound">
                {{ audioStore.sfxEnabled ? $t("settings.toggleOn") : $t("settings.toggleOff") }}
            </button>
        </div>

        <div v-if="rowView" class="settings-row volume-row">
            <span>{{ $t("settings.music.volumeLevel") }}</span>
            <input type="range" min="0" max="1" step="0.01" v-model="volume" @input="updateVolume" />
            <span class="volume-value">{{ Math.round(volume * 100) }}%</span>
        </div>
    </TransitionGroup>
</template>


<script setup lang="ts">
    import { onMounted, ref } from "vue";
    import { useAudioStore } from "@/store/audioStore";
    import { SoundManager } from "@/game/sound/SoundManager";

    const audioStore = useAudioStore();
    const soundManager = SoundManager.getInstance();
    const volume = ref(Number(localStorage.getItem("masterVolume") ?? 0.6));
    const rowView = ref(false);

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

    onMounted(() => {
        setTimeout(() => {
            rowView.value = true;
        }, 500);
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