<template>
    <TransitionGroup name="notification_anim" tag="div" class="notifications_container">
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
import { createNewText } from "@/helpers/functions";

interface NotificationItem {
    id: number;
    message: string;
}


const DISPLAY_TIME = 1500;

const playerStore = usePlayerStore();
const foo = createNewText();

const notificationsList = ref<NotificationItem[]>([]);

const queue: NotificationItem[] = [];

let nextId = 0;
let isProcessing = false;

const notificationMessage = computed(
    () => playerStore.notificationMsg
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
.notifications_container {
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    gap: 0.5rem;

    pointer-events: none;
}

.notifications_block {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 1.25rem;

    font-size: 1.125rem;
}

.boosters_image_container {
    width: 1.875rem;
    height: 1.875rem;

    position: relative;
}

.flash_container {
    width: 5.5rem;
    height: 5.5rem;

    position: relative;
}

.icon {
    width: 100%;
}

.new_record_msg {
    font-size: 2.25rem;
}
</style>