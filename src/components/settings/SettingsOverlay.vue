<template>
  <h1 class="menu-subtitle">{{ $t("settings.title") }}</h1>
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
import LanguageSettings from "./LanguageSettings.vue";
import { computed, ref } from "vue";
import { useTranslation } from "i18next-vue";
const { t } = useTranslation();

const settingsType = ref<'controls' | 'sound' | 'graphic' | 'debug' | 'lang'>("sound")

const menuList = computed(() => ({
  controls: { name: t("settings.settingsMenuList.controls"), comp: null },
  sound: { name: t("settings.settingsMenuList.sound"), comp: SoundSettings },
  graphic: { name: t("settings.settingsMenuList.graphic"), comp: null },
  debug: { name: t("settings.settingsMenuList.debug"), comp: DebugSettings },
  lang: { name: t("settings.settingsMenuList.lang"), comp: LanguageSettings },
}));

const getSettingsComponent = computed(() => menuList.value[settingsType.value]?.comp || null);

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