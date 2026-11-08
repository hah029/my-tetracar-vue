<template>
    <TransitionGroup name="notification_anim" tag="div" class="notifications_container"
        :class="{ 'notifications_container--light-bg': hasLightBackground }">
        <div v-for="notif in notificationsList" :key="notif.id" class="notifications_block">
            <div v-if="notif.message === 'newRecord'" class="flash_container">
                <img class="icon" src="@/assets/images/flashes/flash_golden.svg" />
            </div>

            <div :class="getNotificationColor(notif.message)">
                {{ makeNotification(notif.message) }}
            </div>

            <div v-if="notif.message === 'newRecord'" class="flash_container">
                <img class="icon" src="@/assets/images/flashes/flash_golden.svg" />
            </div>

            <div v-else class="boosters_image_container">
                <img v-if="getCubeType(notif.message) === 'ammo'" class="icon"
                    src="@/assets/images/hud/cube_bullet.svg" />

                <img v-else-if="getCubeType(notif.message) === 'armor'" class="icon"
                    src="@/assets/images/hud/cube_armor.svg" />

                <img v-else-if="getCubeType(notif.message) === 'nitro'" class="icon"
                    src="@/assets/images/hud/cube_nitro.svg" />

                <img v-else-if="getCubeType(notif.message) === 'magnet'" class="icon"
                    src="@/assets/images/hud/cube_magnet.svg" />
            </div>
        </div>
    </TransitionGroup>
</template>


<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePlayerStore } from "@/store/playerStore";
import { useEnvironmentStore } from "@/store/environmentStore";
import { createNewText } from "@/helpers/functions";

interface NotificationItem {
    id: number;
    message: string;
}


const DISPLAY_TIME = 1500;

const playerStore = usePlayerStore();
const environmentStore = useEnvironmentStore();
const foo = createNewText();

const notificationsList = ref<NotificationItem[]>([]);

const queue: NotificationItem[] = [];

let nextId = 0;
let isProcessing = false;

const notificationMessage = computed(
    () => playerStore.notificationMsg
);

function getColorLuminance(hexColor: string): number {
    const normalized = hexColor.replace("#", "").trim();
    const hex = normalized.length === 3
        ? normalized.split("").map((char) => char + char).join("")
        : normalized.padEnd(6, "0").slice(0, 6);

    const rgb = [0, 2, 4].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
    const [r, g, b] = rgb.map((channel) =>
        channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4)
    );

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const hasLightBackground = computed(() =>
    getColorLuminance(environmentStore.currentRender.backgroundColor) > 0.45
);

watch(notificationMessage, (message) => {
    if (!message) {
        return;
    }

    queue.push({
        id: nextId++,
        message,
    });

    processQueue();

    setTimeout(() => {
        playerStore.addNewMsg("");
    }, 100);
});

async function processQueue() {
    if (isProcessing || queue.length === 0) {
        return;
    }

    isProcessing = true;

    const notification = queue.shift();

    if (!notification) {
        isProcessing = false;
        return;
    }

    notificationsList.value.push(notification);

    await new Promise(resolve => {
        setTimeout(resolve, DISPLAY_TIME);
    });

    const index = notificationsList.value.findIndex(
        n => n.id === notification.id
    );

    if (index >= 0) {
        notificationsList.value.splice(index, 1);
    }

    isProcessing = false;

    processQueue();
}

function makeNotification(message: string) {
    return foo.makeText(
        `gamePlay.notificationsList.${message}`,
        "empty"
    );
}

function getCubeType(message: string) {
    const str = message.toLowerCase();

    if (str.includes("armor")) return "armor";
    if (str.includes("ammo")) return "ammo";
    if (str.includes("nitro")) return "nitro";
    if (str.includes("magnet")) return "magnet";

    return "";
}

function getNotificationColor(message: string) {
    const str = message.toLowerCase();

    if (str.includes("armor")) {
        return "color_white";
    }

    if (str.includes("ammo")) {
        return "color_red_light";
    }

    if (str.includes("nitro")) {
        return "color_green_light";
    }

    if (str.includes("magnet")) {
        return "color_ultramarine";
    }

    if (str.includes("newrecord")) {
        return "color_yellow new_record_msg";
    }

    return "";
}
</script>


<style scoped lang="scss">
@use "@/styles/colors" as *;

.notifications_container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: clamp(0.35rem, 1.3vmin, 0.5rem);
    max-width: min(34rem, 92vw);
    font-family: 'jost-medium', sans-serif;

    pointer-events: none;
}

.notifications_container--light-bg {
    .notifications_block {
        text-shadow:
            0 0.08rem 0.12rem rgba(255, 255, 255, 0.7),
            0 0 0.35rem rgba(255, 255, 255, 0.45);
    }

    .color_white {
        color: #1d2732;
    }

    .color_red_light {
        color: #9c242c;
    }

    .color_green_light {
        color: #2d681d;
    }

    .color_ultramarine {
        color: #1e4f95;
    }

    .color_yellow {
        color: $color-yellow;
    }

    .new_record_msg {
        text-shadow:
            0 0.08rem 0.12rem rgba(255, 255, 255, 0.75),
            0 0 0.45rem rgba(255, 229, 132, 0.35);
    }

    .icon {
        filter: drop-shadow(0 0.08rem 0.12rem rgba(20, 29, 40, 0.22));
    }
}

.notifications_block {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: clamp(0.5rem, 2vmin, 1.25rem);
    max-width: 100%;

    font-size: clamp(0.82rem, 1.8vmin, 1.125rem);
    line-height: 1.15;
    text-align: center;
    text-shadow: var(--hud-notification-shadow, var(--hud-text-shadow, 0 0 0.45rem rgba(0, 0, 0, 0.55)));
}

.boosters_image_container {
    width: clamp(1.25rem, 3vmin, 1.875rem);
    height: clamp(1.25rem, 3vmin, 1.875rem);

    position: relative;
    flex: 0 0 auto;
}

.flash_container {
    width: clamp(2.75rem, 8vmin, 5.5rem);
    height: clamp(2.75rem, 8vmin, 5.5rem);

    position: relative;
    flex: 0 0 auto;
}

.icon {
    width: 100%;
}

.new_record_msg {
    font-size: clamp(1.25rem, 4vmin, 2.25rem);
}

@media (max-width: 460px),
(max-height: 520px) {
    .notifications_container {
        max-width: calc(100vw - 1.25rem);
    }

    .notifications_block {
        gap: 0.45rem;
        font-size: clamp(0.72rem, 3vmin, 0.86rem);
    }
}
</style>
