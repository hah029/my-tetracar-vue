<template>
  <div class="settings">
    <div class="settings-row">
      <span>{{ t('settings.language.label') }}</span>
      <select :value="currentLang" @change="setLanguage">
        <option v-for="lang in availableLanguages" :key="lang.code" :value="lang.code">
          {{ lang.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useTranslation } from "i18next-vue";

const { t, i18next } = useTranslation();

const currentLang = computed(() => i18next.language)

const supportedLanguages = ['ru', 'en'];
const availableLanguages = computed(() => {
  return supportedLanguages.map((code) => ({
    code,
    name: t(`settings.language.availableList.${code}`),
  }));
});


function setLanguage(e: Event) {
  let newLanguage = e.target as HTMLSelectElement;
  i18next.changeLanguage(newLanguage.value);
}

</script>

<style lang="scss">
@use "@/styles/menu.scss";
@use "@/styles/settings.scss";
</style>
