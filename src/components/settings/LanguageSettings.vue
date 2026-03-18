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
  // const availableLanguages = computed(() => i18next.languages.map((el) => {
  //   return { code: el, name: t(`settings.language.availableList.${el}`) }
  // }));
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
  
  <style scoped lang="scss">
  .settings {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }
  
  .settings-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  
  .toggle-btn {
    background: none;
    border: 1px solid white;
    color: white;
    padding: 6px 14px;
    cursor: pointer;
    transition: 0.1s;
  
    &:hover {
      background: white;
      color: black;
    }
  }
  
  .volume-row input {
    flex: 1;
  }
  
  .volume-value {
    width: 50px;
    text-align: right;
  }
  </style>
