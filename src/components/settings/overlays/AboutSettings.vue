<template>
    <TransitionGroup name="buttons_group_showing" tag="div" class="settings_sub_container group_correction">
        <button 
            v-for="(btn, index) in aboutButtons" 
            v-if="isRowsEnabled"
            key="btn.id" 
            class="menu_btn btn_correction"
            :style="{ animationDelay: `${index * 0.06}s` }" 
            @click="btn.action"
        >
            {{ btn.text }}
        </button>
    </TransitionGroup>
</template>


<script setup lang="ts">
    import { onMounted, ref, watch, defineProps, computed } from "vue";
    import { createNewText } from '@/helpers/functions';

    const foo = createNewText();
    const isRowsEnabled = ref(false);

    const aboutButtons = computed(() => [
        // { id: 1, text: foo.makeText("settings.about.eula"), action: goToEula },
        { id: 1, text: foo.makeText("settings.about.eula"), action: null },
        { id: 2, text: foo.makeText("settings.about.thirdParty"), action: null },
        { id: 3, text: foo.makeText("settings.about.aboutUs"), action: null },
    ]);

    // function goToEula() {
    //     gameStore.setState(GameStates.Countdown);
    // };

    // function goToSettings() {
    //     isRowsEnabled.value = false;
    //     setTimeout(() => {
    //         gameStore.openSettings();
    //     }, 300);
    // };

    const props = defineProps<{
        backStatus: boolean;
    }>();

    watch(() => props.backStatus, (newVal) => {
        if (newVal) {
            isRowsEnabled.value = false;
        };
    });

    onMounted(() => {
        setTimeout(() => {
            isRowsEnabled.value = true;
        }, 400);
    });
</script>


<style lang="scss" scoped>
    @use "@/styles/menu.scss";
    @use "@/styles/animations.scss";

    .group_correction {
        bottom: 19.57%;
        width: max-content;

        &>*+* {
            margin-top: 0.9375rem; // 15px - row-gap (между кнопками)
        }
    }

    .btn_correction {
        font-size: 1.875rem; // (30px)
    }
</style>