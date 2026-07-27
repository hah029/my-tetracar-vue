<template>
    <div class="device_info">
        <span class="info_item device_type">{{ deviceType }}</span>
        <span class="info_item">{{ resolution }}</span>
        <span class="info_item">DPR: {{ dpr }}</span>
        <span class="info_item">{{ os }}</span>
        <span class="info_item">{{ browser }}</span>
    </div>
</template>


<script setup lang="ts">
    import { useDevice } from '@/composables/useDevice';
    const { deviceType, resolution, dpr, os, browser } = useDevice();
</script>


<style scoped lang="scss">
    .device_info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-end;
        margin-bottom: 1rem;
    }
    .info_item {
        white-space: nowrap;
    }
    .device_type::first-letter {
        text-transform: uppercase;
    }
</style>