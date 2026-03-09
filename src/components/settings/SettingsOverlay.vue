<template>
  <h1 class="menu-subtitle">Настройки</h1>
  <div class="settings-overlay">
    <ul class="settings-menu-list">
      <li @click="settingsType = key" :class="settingsType == key ? 'selected' : ''"
        v-for="(value, key, _) in menuList">
        {{
          value.name
        }}</li>
    </ul>
    <div class="settings-inner-overlay">
      <component :is="getSettingsComponent" />
      <!-- <Transition>
      </Transition> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import DebugSettings from "./DebugSettings.vue";
import SoundSettings from "./SoundSettings.vue";
import { computed, ref } from "vue";

const settingsType = ref("sound")

const menuList = {
  controls: { name: "Управление", comp: null },
  sound: { name: "Звук", comp: SoundSettings },
  graphic: { name: "Графика", comp: null },
  debug: { name: "Дебаг", comp: DebugSettings },
}

const getSettingsComponent = computed(() => menuList[settingsType.value].comp || null)

</script>

<style scoped lang="scss">
.settings-overlay {
  display: flex;
  justify-content: flex-start;
  gap: 60px;
  // border: 1px solid red;
  padding: 50px;
}

.settings-inner-overlay {
  min-width: 20rem;
  min-height: 10rem;
}

.settings-menu-list {
  list-style-type: none;
  margin: 0;
  padding: 0;
  width: 10rem;
  min-width: 100px;
  border-right: 1px solid rgb(255, 255, 255, 0.1);

  &>li {
    height: 50px;
    line-height: 50px;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 300ms;
    text-align: center;
    vertical-align: center;

    &:hover {
      background-color: rgb(255, 255, 255, 0.5);
    }

    &.selected {
      background-color: rgb(255, 255, 255, 0.2);
    }
  }
}


.menu-subtitle {
  font-size: 54px;
  text-transform: uppercase;
  margin: 0 0 30px 0;
  text-shadow: 0 0 20px rgba(0, 255, 255, 0.741);
}


/* we will explain what these classes do next! */
.v-enter-active {
  transition: opacity 0.5s ease;
}


.v-enter-from,
.v-leave-to {
  opacity: 0;
}
</style>