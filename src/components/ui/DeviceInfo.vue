<template>
    <!-- <div v-if="isDebug" class="device_info"> -->
    <div class="device_info">
        <span class="info_item">{{ deviceType }}</span>
        <span class="info_item">{{ resolution }}</span>
        <span class="info_item">DPR: {{ dpr }}</span>
        <span class="info_item">{{ os }}</span>
    </div>
</template>


<script setup lang="ts">
    import { ref, onMounted, onUnmounted } from 'vue';

    const deviceType = ref<string>('тип устройства не определен...');
    const resolution = ref<string>('разрешение не определено...');
    const dpr = ref<number>(window.devicePixelRatio || 1);
    const os = ref<string>('ОС не определена...');
    const userAgent = navigator.userAgent;

    // функция определения типа устройства
    function detectDeviceType(): string {
        console.log(navigator);
        
        if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
            return 'Mobile';
        } else if (/Tablet|iPad/i.test(userAgent)) {
            return 'Tablet';
        } else {
            return 'Desktop';
        };
    };

    // функция определения ОС
    function detectOS(): string {
        if (userAgent.indexOf('Win') !== -1) return 'Windows';
        if (userAgent.indexOf('Mac') !== -1) return 'macOS';
        if (userAgent.indexOf('Linux') !== -1) return 'Linux';
        if (userAgent.indexOf('Android') !== -1) return 'Android';
        if (/iPhone|iPad|iPod/.test(userAgent)) return 'iOS';
        return 'Unknown OS';
    }

    // функция обновления разрешения
    function updateResolution() {
        resolution.value = `${window.innerWidth}×${window.innerHeight}`;
    };

    // определяем всё необходимое по текущему устройству
    function detectAll() {
        deviceType.value = detectDeviceType();
        os.value = detectOS();
        dpr.value = window.devicePixelRatio || 1;
        updateResolution();
    };

    // обработчик изменения размера окна
    let resizeObserver: ResizeObserver | null = null;
    let resizeCleanup: (() => void) | null = null;

    onMounted(() => {
        // определяем всё необходимое по текущему устройству
        detectAll();
        const handler = () => detectAll();
        window.addEventListener('resize', handler);
        resizeCleanup = () => window.removeEventListener('resize', handler);

        // следим за изменением размера окна
        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(() => updateResolution());
            resizeObserver.observe(document.body);
        } else {
            // fallback для старых браузеров
            window.addEventListener('resize', updateResolution);
        };
    });

    onUnmounted(() => {
        if (resizeCleanup) resizeCleanup();
        if (resizeObserver) {
            resizeObserver.disconnect();
        } else {
            window.removeEventListener('resize', updateResolution);
        };
    });

    // ===== Отображаем только в режиме отладки (можно убрать) =====
    // const isDebug = import.meta.env.DEV; // или true, если нужно всегда показывать
</script>


<style scoped lang="scss">
    .device_info {
        // position: absolute;
        // bottom: 0.5rem;
        // left: 0.5rem;
        // z-index: 9999;
        // font-family: monospace;
        // font-size: 0.7rem;
        // color: rgba(255, 255, 255, 0.6);
        // background: rgba(0, 0, 0, 0.5);
        // padding: 0.3rem 0.6rem;
        // border-radius: 4px;
        
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        margin-bottom: 1rem;

        // user-select: none;
        // pointer-events: none;
        // backdrop-filter: blur(4px);
        // line-height: 1.2;
    }

    .info_item {
        white-space: nowrap;
    }
</style>