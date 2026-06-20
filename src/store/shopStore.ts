// src/store/shopStore.ts
import { defineStore } from "pinia";
import { Platform } from "@/sdk/Platform";
import { ref, computed } from "vue";

import metaConfig from "@/configs/meta";

import currencyJson from "@/configs/in_apps/currency.json";
import stuffJson from "@/configs/in_apps/stuff.json";
import visualJson from "@/configs/in_apps/visual.json";
import type { Product as SdkProduct } from "@/sdk/types/Shop";
import type { Product as PurchaseProduct } from "@/purchase/types/Product";
import { PurchaseService } from "@/purchase/PurchaseService";
import { useMetaStore } from "@/store/metaStore";

export const useShopStore = defineStore("shopStore", () => {
  const platform = Platform.getInstance();
  const purchaseService = new PurchaseService();

  // ===== CATALOGS =====
  const currencyInAppCatalog = ref<PurchaseProduct[]>([]);
  const stuffInAppCatalog = ref<PurchaseProduct[]>([]);
  const visualInAppCatalog = ref<PurchaseProduct[]>([]);

  // ===== UI STATE =====
  const currentView = ref<"currency" | "stuff" | "visual">("currency");
  const isHeaderShown = ref(false);
  const isBackButtonShown = ref(false);
  const notificationMessage = ref("");
  const notificationType = ref<"success" | "error" | "">("");

  // ===== COMPUTED =====
  const activeCatalog = computed(() => {
    switch (currentView.value) {
      case "currency":
        return currencyInAppCatalog.value;
      case "stuff":
        return stuffInAppCatalog.value;
      case "visual":
        return visualInAppCatalog.value;
      default:
        return currencyInAppCatalog.value;
    }
  });

  // ===== CATALOG LOADING =====
  async function loadCatalogs() {
    let sdkCatalog: SdkProduct[] = [];

    try {
      const data = await platform.getShopCatalog();
      if (data) {
        sdkCatalog = data;
      }
    } catch (err) {
      console.error("currencyInAppCatalog loading error: ", err);
    }

    currencyInAppCatalog.value = (currencyJson as PurchaseProduct[]).map(
      (product) => mergeCurrencyWithSdkProduct(product, sdkCatalog),
    );

    try {
      stuffInAppCatalog.value = stuffJson as PurchaseProduct[];
    } catch (err) {
      console.error("stuffInAppCatalog loading error: ", err);
    }

    try {
      visualInAppCatalog.value = visualJson as PurchaseProduct[];
    } catch (err) {
      console.error("visualInAppCatalog loading error: ", err);
    }
  }

  function mergeCurrencyWithSdkProduct(
    product: PurchaseProduct,
    sdkCatalog: SdkProduct[],
  ): PurchaseProduct {
    const sdkProduct = sdkCatalog.find((item) => item.id === product.id);

    if (!sdkProduct) {
      return product;
    }

    return {
      ...product,
      title: product.title || sdkProduct.title,
      description: product.description || sdkProduct.description || "",
      price: {
        value: Number(sdkProduct.priceValue ?? product.price.value),
        currency:
          (sdkProduct.priceCurrencyCode as PurchaseProduct["price"]["currency"]) ??
          product.price.currency,
      },
      platformPriceLabel: sdkProduct.price,
      imageURI: sdkProduct.imageURI,
    };
  }

  // ===== PRODUCT HELPERS =====
  function isProductOwned(product: PurchaseProduct): boolean {
    const meta = useMetaStore();

    switch (product.type) {
      case "cosmetic":
        return meta.isSkinOwned(product.effect?.skinId);

      case "permanent_feature":
        return meta.hasPermanentFeature(product.effect?.feature);

      case "timed_feature": {
        const feature = product.effect?.feature;

        // Иерархия: если есть permanent-версия этой фичи — timed считается owned
        if (meta.hasPermanentFeature(feature)) return true;

        // Иерархия: если есть активный timed-эффект с той же или большей длительностью
        const activeTimed = meta.getTimedEffect(feature);
        if (activeTimed && product.effect?.durationHours) {
          return activeTimed.durationHours >= product.effect.durationHours;
        }

        return meta.isTimedFeatureActive(feature);
      }

      case "upgrade": {
        const upgradeKey = product.effect?.upgrade;
        const currentLevel = meta.getUpgradeLevel(upgradeKey);
        const maxLevel = metaConfig.max_upgrades[upgradeKey];
        return currentLevel >= maxLevel;
      }

      default:
        return false;
    }
  }

  function canAfford(product: PurchaseProduct): boolean {
    const meta = useMetaStore();
    const currency = product.price.currency;
    const amount = product.price.value;

    if (currency === "golden") {
      return meta.goldens >= amount;
    }
    if (currency === "energon") {
      return meta.energons >= amount;
    }
    // Real money purchases are always affordable (SDK handles it)
    return true;
  }

  // ===== PURCHASE =====
  async function buyItem(product: PurchaseProduct) {
    try {
      const result = await purchaseService.purchase(product);

      if (result.success) {
        notificationType.value = "success";
        notificationMessage.value = "shop.product.purchaseSuccess";
      } else {
        notificationType.value = "error";
        const errMsg =
          result.error instanceof Error
            ? result.error.message
            : String(result.error);
        if (errMsg === "already_owned") {
          notificationMessage.value = "shop.product.alreadyOwned";
        } else if (errMsg === "Not enough currency") {
          notificationMessage.value = "shop.product.notEnoughCurrency";
        } else {
          notificationMessage.value = "shop.product.purchaseError";
        }
      }
    } catch (err) {
      notificationType.value = "error";
      notificationMessage.value = "shop.product.purchaseError";
      console.error("[ShopStore] buyItem error:", err);
    }

    // Auto-clear notification after 3 seconds
    setTimeout(() => {
      notificationMessage.value = "";
      notificationType.value = "";
    }, 3000);
  }

  // ===== UI ACTIONS =====
  function setView(view: "currency" | "stuff" | "visual") {
    currentView.value = view;
  }

  function show() {
    isHeaderShown.value = true;
    isBackButtonShown.value = true;
  }

  function hide() {
    isHeaderShown.value = false;
    isBackButtonShown.value = false;
  }

  return {
    // catalogs
    currencyInAppCatalog,
    stuffInAppCatalog,
    visualInAppCatalog,
    activeCatalog,

    // ui state
    currentView,
    isHeaderShown,
    isBackButtonShown,
    notificationMessage,
    notificationType,

    // methods
    loadCatalogs,
    isProductOwned,
    canAfford,
    buyItem,
    setView,
    show,
    hide,
  };
});
