import { defineStore } from "pinia";
import { ref } from "vue";

export const useGraphicsStore = defineStore("graphics", () => {
    const vfxEnabled = ref(true);
    
    // загрузка сохранённых настроек
    function loadFromStorage() {
        const saved = localStorage.getItem('vfx_enabled');
        if (saved !== null) {
            vfxEnabled.value = saved === 'true';
        };
    };
    
    // переключение эффектов
    function toggleVfx() {
        vfxEnabled.value = !vfxEnabled.value;
        localStorage.setItem('vfx_enabled', vfxEnabled.value.toString());
    };
    
    // меняем текущий pixel ratio
    function getPixelRatio(): number {
        return vfxEnabled.value ? Math.min(window.devicePixelRatio, 1.0) : 0.8;
    };

    function getBloomStrength(): number {
        return vfxEnabled.value ? 0.3 : 0.0;
    };
    
    function getShadowQuality(): boolean {
        return vfxEnabled.value;
    };
    
    // Инициализация
    loadFromStorage();
    
    return {
        vfxEnabled,
        toggleVfx,
        getPixelRatio,
        getBloomStrength,
        getShadowQuality,
    };
});