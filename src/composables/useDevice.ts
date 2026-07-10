import { ref, onMounted, onUnmounted, readonly } from 'vue';

export function useDevice() {
//   type DeviceType = 'mobile-small' | 'mobile' | 'tablet' | 'laptop' | 'desktop';
  type DeviceType = 
    | 'mobile' 
    | 'tablet' 
    | 'laptop' 
    | 'desktop';

  type BrowserType =
    | 'Chrome'
    | 'Firefox'
    | 'Safari'
    | 'Edge'
    | 'Opera'
    | 'Yandex'
    | 'Samsung Internet'
    | 'Brave'
    | 'Vivaldi'
    | 'UC'
    | 'Unknown';

  const deviceType = ref<DeviceType>('desktop'); // по умолчанию mobile-first
  const browser = ref<BrowserType>('Unknown');
  const os = ref<string>('ОС не определена...');
  const resolution = ref<string>('разрешение не определено...');
  const dpr = ref<number>(window.devicePixelRatio || 1);

  // функция обновления всех данных
  function updateDevice() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    const userAgent = navigator.userAgent;

    // определение типа устройства по ширине окна браузера (Mobile-first)
    if (isLandscape) {
        if (width < 1024) {
            deviceType.value = 'mobile'
        } else if (width >= 1024 && width < 1440) {
            deviceType.value = 'tablet'
        } else if (width >= 1440 && width < 1920) {
            deviceType.value = 'laptop'
        } else if (width >= 1920) {
            deviceType.value = 'desktop'
        };
    };
    
    // определение ОС устройства
    if (userAgent.indexOf('Android') !== -1) {
        os.value = 'Android';
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
        os.value = 'iOS';
    } else if (userAgent.indexOf('Win') !== -1) {
        os.value = 'Windows';
    } else if (userAgent.indexOf('Mac') !== -1) {
        os.value = 'macOS';
    } else if (userAgent.indexOf('Linux') !== -1) {
        os.value = 'Linux';
    } else {
        os.value = 'Unknown OS';
    };

    // определение браузера устройства
    if (userAgent.indexOf('YaBrowser') !== -1) {
        browser.value = 'Yandex';
    } else if (userAgent.indexOf('Edg') !== -1) {
        browser.value = 'Edge';
    } else if (userAgent.indexOf('OPR') !== -1 || userAgent.indexOf('Opera') !== -1) {
        browser.value = 'Opera';
    } else if (userAgent.indexOf('Firefox') !== -1) {
        browser.value = 'Firefox';
    } else if (userAgent.indexOf('SamsungBrowser') !== -1) {
        browser.value = 'Samsung Internet';
    } else if (userAgent.indexOf('Brave') !== -1) {
        browser.value = 'Brave';
    } else if (userAgent.indexOf('Vivaldi') !== -1) {
        browser.value = 'Vivaldi';
    } else if (userAgent.indexOf('UCBrowser') !== -1) {
        browser.value = 'UC';
    } else if (userAgent.indexOf('Safari') !== -1 && userAgent.indexOf('Chrome') === -1) {
        browser.value = 'Safari';
    } else if (userAgent.indexOf('Chrome') !== -1) {
        browser.value = 'Chrome';
    } else {
        browser.value = 'Unknown';
    };

    // определение разрешения экрана
    resolution.value = `${width}×${height}`;
    dpr.value = window.devicePixelRatio || 1;
  };

  // подписка на изменение размера окна
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

  // возвращаем только для чтения, чтобы избежать случайных мутаций
  return {
    deviceType: readonly(deviceType),
    os: readonly(os),
    resolution: readonly(resolution),
    browser: readonly(browser),
    dpr: readonly(dpr),
    updateDevice,   // если нужно обновить вручную (например, при изменении ориентации вручную)
  };
};