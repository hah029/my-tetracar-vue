// src/purchase/services/InventoryService.ts
import { useMetaStore } from "@/store/metaStore";

class InventoryServiceClass {
  /**
   * Разблокировать скин
   */
  unlockSkin(skinId: string) {
    const meta = useMetaStore();
    meta.unlockSkin(skinId);
  }

  /**
   * Активировать скин (надеть)
   */
  activateSkin(skinId: string) {
    const meta = useMetaStore();
    if (meta.isSkinOwned(skinId)) {
      meta.setActiveSkin(skinId);
    }
  }

  /**
   * Проверить, разблокирован ли скин
   */
  isSkinOwned(skinId: string): boolean {
    const meta = useMetaStore();
    return meta.isSkinOwned(skinId);
  }

  /**
   * Получить список всех разблокированных скинов
   */
  getOwnedSkins(): string[] {
    const meta = useMetaStore();
    return meta.ownedSkins;
  }
}

export const InventoryService = new InventoryServiceClass();
