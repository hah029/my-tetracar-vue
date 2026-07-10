// src/composables/useDevice.ts
import { ref, onMounted, onUnmounted, readonly } from 'vue';

export function useDevice() {
  // Реактивные переменные
  const isMobile = ref(true);   // по умолчанию mobile-first
  const isTablet = ref(false);
  const isDesktop = ref(false);
  const deviceType = ref<string>('тип устройства не определен...');
  const os = ref<string>('ОС не определена...');
  const resolution = ref<string>('');
  const dpr = ref<number>(window.devicePixelRatio || 1);

  // Функция обновления всех данных
  function updateDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const ua = navigator.userAgent;

    // 1. Определение по ширине (Mobile-first)
    isDesktop.value = width >= 1920 && isLandscape;
    isTablet.value = width >= 1024 && width < 1920 && isLandscape;
    isMobile.value = width < 1024 && isLandscape;

    // 2. Определение типа по userAgent (для дополнительной информации)
    if (/Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      deviceType.value = 'Mobile';
    } else if (/Tablet|iPad/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
      deviceType.value = 'Tablet';
    } else {
      deviceType.value = 'Desktop';
    };

    // 3. Определение ОС
    if (ua.indexOf('Win') !== -1) os.value = 'Windows';
    else if (ua.indexOf('Mac') !== -1) os.value = 'macOS';
    else if (ua.indexOf('Linux') !== -1) os.value = 'Linux';
    else if (ua.indexOf('Android') !== -1) os.value = 'Android';
    else if (/iPhone|iPad|iPod/.test(ua)) os.value = 'iOS';
    else os.value = 'Unknown OS';

    // 4. Разрешение
    resolution.value = `${width}×${height}`;
    dpr.value = window.devicePixelRatio || 1;
  };

  // Подписка на изменение размера окна
  let resizeCleanup: (() => void) | null = null;

  onMounted(() => {
    updateDevice();
    const handler = () => updateDevice();
    window.addEventListener('resize', handler);
    resizeCleanup = () => window.removeEventListener('resize', handler);
  });

  onUnmounted(() => {
    if (resizeCleanup) resizeCleanup();
  });

  // Возвращаем только для чтения, чтобы избежать случайных мутаций
  return {
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop),
    deviceType: readonly(deviceType),
    os: readonly(os),
    resolution: readonly(resolution),
    dpr: readonly(dpr),
    // если нужно обновить вручную (например, при изменении ориентации вручную)
    updateDevice,
  };
};