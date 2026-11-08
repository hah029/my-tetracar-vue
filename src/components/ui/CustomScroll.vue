<template>
    <div class="scroll-container" ref="scrollContainerRef">
        <div class="scroll-content" ref="scrollContentRef" @scroll="handleScroll">
            <slot />
        </div>
        <div class="custom-scrollbar" @click="handleTrackClick">
            <div class="custom-thumb" :style="thumbStyle" @mousedown="startDrag">
                <img class="thumb-icon" src="@/assets/images/slider.svg" alt="scroll" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';

    const scrollContainerRef = ref<HTMLElement | null>(null);
    const scrollContentRef = ref<HTMLElement | null>(null);

    const currentScrollTop = ref(0);
    const thumbHeight = 60;
    const isDragging = ref(false);
    const dragStartY = ref(0);
    const scrollStart = ref(0);

    const containerHeight = computed(() => {
        return scrollContainerRef.value?.clientHeight || 0;
    });

    const contentHeight = computed(() => {
        return scrollContentRef.value?.scrollHeight || 0;
    });

    const maxScroll = computed(() => {
        return Math.max(0, contentHeight.value - containerHeight.value);
    });

    const thumbStyle = computed(() => {
        const containerH = containerHeight.value;
        const maxScrollVal = maxScroll.value;

        if (maxScrollVal <= 0 || containerH <= 0) {
            return { height: `${thumbHeight}px`, top: '0px' };
        }

        const scrollTop = currentScrollTop.value;
        const trackHeight = containerH - thumbHeight;
        const top = (scrollTop / maxScrollVal) * trackHeight;

        return {
            height: `${thumbHeight}px`,
            top: `${top}px`,
        };
    });

    function handleScroll() {
        if (scrollContentRef.value) {
            currentScrollTop.value = scrollContentRef.value.scrollTop;
        }
    }

    function handleTrackClick(event: MouseEvent) {
        if (!scrollContainerRef.value || !scrollContentRef.value) return;

        const rect = scrollContainerRef.value.getBoundingClientRect();
        const clickY = event.clientY - rect.top;
        const containerH = containerHeight.value;
        const maxScrollVal = maxScroll.value;

        if (maxScrollVal <= 0) return;

        const trackHeight = containerH - thumbHeight;
        const ratio = Math.max(0, Math.min(1, (clickY - thumbHeight / 2) / trackHeight));
        const newScrollTop = ratio * maxScrollVal;

        scrollContentRef.value.scrollTop = newScrollTop;
        currentScrollTop.value = newScrollTop;
    }

    function startDrag(event: MouseEvent) {
        isDragging.value = true;
        dragStartY.value = event.clientY;
        scrollStart.value = currentScrollTop.value;

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('mouseup', stopDrag);
        event.preventDefault();
    }

    function onDrag(event: MouseEvent) {
        if (!isDragging.value || !scrollContentRef.value) return;

        const deltaY = event.clientY - dragStartY.value;
        const maxScrollVal = maxScroll.value;

        if (maxScrollVal <= 0) return;

        const trackHeight = containerHeight.value - thumbHeight;
        const ratio = deltaY / trackHeight;
        const newScroll = scrollStart.value + ratio * maxScrollVal;

        const clampedScroll = Math.max(0, Math.min(maxScrollVal, newScroll));
        scrollContentRef.value.scrollTop = clampedScroll;
        currentScrollTop.value = clampedScroll;
    }

    function stopDrag() {
        isDragging.value = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    }

    // Обновляем скролл при изменении контента
    function updateScroll() {
        if (scrollContentRef.value) {
            currentScrollTop.value = scrollContentRef.value.scrollTop;
        }
    }

    // Наблюдатель за изменением размера
    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    onMounted(() => {
        nextTick(() => {
            updateScroll();
        });

        if (scrollContainerRef.value) {
            resizeObserver = new ResizeObserver(() => {
                updateScroll();
            });
            resizeObserver.observe(scrollContainerRef.value);
        }

        if (scrollContentRef.value) {
            mutationObserver = new MutationObserver(() => {
                updateScroll();
            });
            mutationObserver.observe(scrollContentRef.value, {
                childList: true,
                subtree: true,
                attributes: true,
            });
        }

        window.addEventListener('resize', updateScroll);

        // Дополнительная проверка через 300ms
        setTimeout(() => {
            updateScroll();
        }, 300);
    });

    onUnmounted(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
        }
        if (mutationObserver) {
            mutationObserver.disconnect();
        }
        window.removeEventListener('resize', updateScroll);
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
    });

    defineExpose({
        updateScroll,
    });
</script>

<style scoped lang="scss">
    .scroll-container {
        position: relative;
        overflow: hidden;
        height: 100%;
        width: 100%;
    }

    .scroll-content {
        height: 100%;
        overflow-y: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;

        &::-webkit-scrollbar {
            display: none;
        }
    }

    .custom-scrollbar {
        position: absolute;
        top: 0;
        right: 0;
        width: 0.625rem;
        height: 100%;
        background: transparent;
        border-radius: 0.5rem;
        cursor: pointer;
        z-index: 10;
    }

    .custom-thumb {
        position: absolute;
        width: 100%;
        left: 0;
        border-radius: 0.5rem;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: top 0.15s ease-out, filter 0.25s ease, transform 0.25s ease;

        filter: brightness(0) saturate(100%) invert(92%) sepia(19%) saturate(274%) hue-rotate(26deg) brightness(107%) contrast(105%);

        &:hover {
            filter: brightness(0) saturate(100%) invert(75%) sepia(7%) saturate(4910%) hue-rotate(179deg) brightness(96%) contrast(94%);
            transform: scale(1.1);
        }

        &:active {
            cursor: grabbing;
            transform: scale(0.95);
        }
    }

    .thumb-icon {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
        pointer-events: none;
        user-select: none;
    }
</style>