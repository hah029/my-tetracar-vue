<template>
    <div class="countdown_root">
        <TrainingScreen v-if="showTraining" />
        <Transition name="countdown_anim">
            <span v-if="showCountdown" class="countdown" :class="{ 'msgGo': count === 0 }" :key="count">
                {{ displayText }}
            </span>
        </Transition>
    </div>
</template>


<script setup lang="ts">
    import { ref, computed, watch } from "vue";
    import { useGameState } from "@/store/gameState";
    import { SoundManager } from "@/game/sound/SoundManager";
    import { GameStates } from "@/game/core/GameState";
    import { createNewText } from '@/helpers/functions';
    import { Platform } from "@/sdk/Platform";
    import TrainingScreen from "@/components/TrainingScreen.vue";

    const gameStore = useGameState();
    const soundManager = SoundManager.getInstance();
    const count = ref(3);
    const foo = createNewText();
    const goMessage = computed(() => foo.makeText("gamePlay.goMessage"));

    const showTraining = ref<boolean>(false);
    const showCountdown = ref<boolean>(false);

    // #region - функции работы с полями сторов и стораджей
        // запускаем запрос на проверку самого первого входа игрока при инициализации компоненты
        const platform = Platform.getInstance();
        platform!.getPlayerDataByKey("isFirstEnter").then((value: any) => {
            if (value == null) {
                showTraining.value = true;
                gameStore.activeOverlay = 'trainingScreen';
            } else {
                showTraining.value = value;
                startCountdown();
            };
            setFirstEnterVal(showTraining.value);
            gameStore.setFirstGameIndicator(showTraining.value);
        });
        
        // устанавливаем значение полю isFirstEnter в зависимости от условий
        async function setFirstEnterVal(value_: boolean) {
            await platform.setPlayerDataByKey("isFirstEnter", value_);
        };
    // #endregion

    // #region - функции работы с таймером
        // запускаем таймер обратного отсчёта
        function startCountdown() {
            showCountdown.value = true;
            playNext();
        };    
    
        // генерируем текст таймера (или цифры или текст в конце)
        const displayText = computed(() => {
            if (count.value === 0) {
                return goMessage.value;
            }
            return count.value.toString();
        });

        // сама функция-цикл работы таймера
        const playNext = () => {
            if (count.value === 0) {
                soundManager.playOneShot("sfx_start");
                setTimeout(() => {
                    gameStore.setState(GameStates.Play);
                }, 650);
                return;
            };
            
            soundManager.playOneShot(`sfx_${count.value}`);
            
            setTimeout(() => {
                count.value--;
                playNext();
            }, 650);
        };

        // следим за оверлеем и запускаем таймер в случае его изменения
        watch(
            () => gameStore.activeOverlay,
            (newState) => {
                if (newState == null) {
                    showTraining.value = false;
                    startCountdown();
                };
            },
        );
    // #endregion
</script>


<style lang="scss" scoped>
    .countdown_root {
        position: relative;
        width: 100%;
        height: 100%;
    }
    
    .countdown {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 7.5rem;
        color: #FDFFE3;
        filter: drop-shadow(0 0 1rem rgba(255, 246, 25, 0.4));
        font-weight: bold;
        font-family: 'vla_shu';
        transition: all 0.1s ease-in-out;
    }
    .msgGo {
        font-size: 5.625rem;
    }

    .countdown_anim-enter-active {
        transition: all 0.25s ease-out;
        transition-delay: 0.1s;
    }
    .countdown_anim-leave-active {
        transition: all 0.2s ease-out;
    }
    .countdown_anim-enter-from {
        opacity: 0;
        transform: scale(0.7);
    }
    .countdown_anim-leave-to {
        opacity: 0;
        transform: scale(2);
    }
</style>