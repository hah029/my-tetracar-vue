<template>
    <Transition name="modal_message_fade">
        <div v-if="modal.isVisible" class="modal_message_root" role="dialog" aria-modal="true">
            <div class="modal_message_content">
                <div class="modal_message_text">{{ modal.text }}</div>
                <button class="menu_btn modal_message_ok_btn" @click="exitModal()">{{ foo.makeText("modalMessage.ok") }}</button>
            </div>
        </div>
    </Transition>
</template>


<script setup lang="ts">
    import { watch, nextTick } from "vue";
    import { createNewText } from '@/helpers/functions';
    import { useModalMessageStore } from "@/store/modalMessageStore";
    import { SoundManager } from "@/game/sound/SoundManager";

    const modal = useModalMessageStore();
    const foo = createNewText();

    // при открытии модалки снимаем фокус с активного элемента (карточки),
    //      (чтобы браузер не подсвечивал её фокус-кольцом после закрытия и чтобы при нажатии клавиш не «светилась» кнопка «Ок»)
    watch(
        () => modal.isVisible,
        async (isVisible) => {
            if (!isVisible) return;
            await nextTick();
            (document.activeElement as HTMLElement | null)?.blur();
        },
    );

    // выход из модалки
    function exitModal() {
        SoundManager.getInstance().playCue("uiSelect");
        modal.hide();
    };
</script>


<style scoped lang="scss">
    @use "@/styles/menu.scss" as *;
    @use "@/styles/typography" as *;
    @use "@/styles/colors" as *;
    @use "@/styles/mixins" as *;

    .modal_message_root {
        position: fixed;
        inset: 0;
        z-index: z("overlays");
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 400px;
        background-color: rgba(0, 0, 0, 0.85);   // отдельный затемнённый фон
        backdrop-filter: blur(3px);
    }

    .modal_message_content {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 90px;
    }

    .modal_message_text {
        @include text-info-size-m;
        color: $color-pink;
        text-transform: uppercase;
        text-align: center;
        white-space: pre-line;                   // ← чтобы \n из json работал как перенос строки
        line-height: 1.5;
        letter-spacing: 5%;
        filter: drop-shadow(0 0 20px rgba(255, 245, 173, 0.35));
        @include unselectable;
    }

    .modal_message_ok_btn {
        @include text-button-size-m;
        color: $color-yellow-super-light;
    }

    .modal_message_fade-enter-active,
    .modal_message_fade-leave-active {
        transition: opacity 0.3s ease-out,
    }

    .modal_message_fade-enter-from,
    .modal_message_fade-leave-to {
        opacity: 0;
    }
</style>