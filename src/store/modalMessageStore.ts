import { defineStore } from "pinia";
import { ref } from "vue";

export const useModalMessageStore = defineStore("modalMessage", () => {
    const isVisible = ref(false);
    const text = ref("");

    function show(message: string) {
        // пока окно открыто — новое сообщение проигнорируется
        if (isVisible.value) return;
        text.value = message;
        isVisible.value = true;
    };

    function hide() {
        isVisible.value = false;
        text.value = "";
    };

    return { 
        isVisible, 
        text, 
        show, 
        hide 
    };
});