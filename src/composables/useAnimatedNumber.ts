import { onUnmounted, ref, watch, type Ref } from "vue";

/**
 * Счётчик-догоняющий: displayed плавно догоняет source.
 * Если shouldHold() === true в момент изменения source — значение
 * запоминается и будет анимировано, когда вызовут release().
 */
export function useAnimatedNumber(
    source: Ref<number>,
    options?: { duration?: number; shouldHold?: () => boolean },
) {
    const duration = options?.duration ?? 550;
    const shouldHold = options?.shouldHold ?? (() => false);

    const displayed = ref(source.value);

    let heldValue: number | null = null;
    let rafId: number | null = null;
    let startTime = 0;
    let fromValue = 0;
    let toValue = 0;

    function cancelRaf() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        };
    };

    function animate(from: number, to: number) {
        cancelRaf();
        fromValue = from;
        toValue = to;
        startTime = performance.now();

        const step = () => {
            const t = Math.min(1, (performance.now() - startTime) / duration);
            const eased = 1 - Math.pow(1 - t, 3);  // easeOutCubic
            displayed.value = Math.round(fromValue + (toValue - fromValue) * eased);
            if (t < 1) rafId = requestAnimationFrame(step);
            else rafId = null;
        };
        rafId = requestAnimationFrame(step);
    };

    watch(source, (newVal) => {
        if (shouldHold()) {
            heldValue = newVal;
        } else {
            animate(displayed.value, newVal);
        };
    });

    function release() {
        if (heldValue !== null) {
            animate(displayed.value, heldValue);
            heldValue = null;
        };
    };

    onUnmounted(cancelRaf);

    return { displayed, release };
};