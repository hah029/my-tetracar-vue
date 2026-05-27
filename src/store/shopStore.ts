// src/store/gameState.ts
import { defineStore } from "pinia";
import { Platform } from "@/sdk/Platform";
import { ref } from "vue";

import stuffJson from "@/configs/in_apps/stuff.json";
import visualJson from "@/configs/in_apps/visual.json";
import type { Product } from "@/sdk/types/Shop";

export const useShopStore = defineStore("shopStore", () => {
  const platform = Platform.getInstance();

  const currencyInAppCatalog = ref<Product[]>([]);
  const stuffInAppCatalog = ref<Product[]>([]);
  const visualInAppCatalog = ref<Product[]>([]);

  function getCurrencyInAppCatalog(): Product[] {
    return currencyInAppCatalog.value;
  }
  function getStuffInAppCatalog(): Product[] {
    return stuffInAppCatalog.value;
  }
  function getVisualInAppCatalog(): Product[] {
    return visualInAppCatalog.value;
  }

  // onmounted calls
  async function getCatalogs() {
    platform.getShopCatalog().then((data: any) => {
      if (data) {
        currencyInAppCatalog.value = data;
      }
    });

    try {
      stuffInAppCatalog.value = stuffJson;
    } catch (err) {
      console.error("stuffInAppCatalog loading error: ", err);
    }

    try {
      visualInAppCatalog.value = visualJson;
    } catch (err) {
      console.error("visualInAppCatalog loading error: ", err);
    }
  }
  getCatalogs().catch((err) => console.error("Catalog fetch error: ", err));

  return {
    getCurrencyInAppCatalog,
    getStuffInAppCatalog,
    getVisualInAppCatalog,
  };
});
