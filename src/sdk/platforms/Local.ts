import type { LeaderboardDescription, LeaderboardEntry, LeaderboardEntriesData } from "ysdk";
import type { IGamePlatform } from "../IGamePlatform";

type Stats = Record<string | number, number>;
type PlayerData = import("ysdk").Serializable | undefined;
type PlayerDataSet = Record<string, PlayerData>;
type Locale = string;

interface LocalPlayer {
  id: string;
  name: string;
  stats: Stats;
  data: PlayerDataSet;
  getAvatarSrc: string;
}

interface LocalLeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  getAvatarSrc: string;
}

// Описание таблицы лидеров
interface ILeaderboardDescription {
    appID: string;
    default: boolean;
    description: {
        invert_sort_order: boolean;
        score_format: {
            options: {
                decimal_offset: number;
            };
            type: 'numeric' | 'time';
        };
        sort_order: string;
    };
    name: string;
    title: Record<Locale, string>;
}

// Запись в таблице лидеров
interface ILeaderboardEntry {
    extraData: string;
    rank: number;
    score: number;
    player: {
        publicName: string;
        uniqueID: string;
        getAvatarSrc: (size?: 'small' | 'medium' | 'large') => string;
        getAvatarSrcSet: (size?: 'small' | 'medium' | 'large') => string;
    }
}

// Результат метода getEntries()
interface ILeaderboardEntries {
    leaderboard: ILeaderboardDescription;
    ranges: { start: number; size: number; }[];
    userRank: number;
    entries: ILeaderboardEntry[];
}

export class LocalStoragePlatform implements IGamePlatform {
  private storage: Storage | null = null;

  private readonly PLAYER_KEY = "dev_player";
  private readonly LEADERBOARD_KEY = "dev_leaderboards";
  private readonly LANG_KEY = "lang";

  async init(): Promise<void> {
    this.storage = localStorage;

    // Инициализация игрока
    if (!this.storage.getItem(this.PLAYER_KEY)) {
      const defaultPlayer: LocalPlayer = {
        id: "local_player_1",
        name: "Developer",
        stats: {},
        data: {},
        getAvatarSrc: '',
      };
      this.storage.setItem(this.PLAYER_KEY, JSON.stringify(defaultPlayer));
    }

    // Инициализация таблиц лидеров
    if (!this.storage.getItem(this.LEADERBOARD_KEY)) {
      this.storage.setItem(this.LEADERBOARD_KEY, JSON.stringify({}));
    }

    // Язык по умолчанию
    if (!this.storage.getItem(this.LANG_KEY)) {
      this.storage.setItem(this.LANG_KEY, "ru");
    }
  }

  // Приватные хелперы для работы с localStorage
  private ensureStorage(): Storage {
    if (!this.storage) throw new Error("LocalStorage not initialized");
    return this.storage;
  }

  private getPlayer(): LocalPlayer | null {
    const raw = this.ensureStorage().getItem(this.PLAYER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  private savePlayer(player: LocalPlayer): void {
    this.ensureStorage().setItem(this.PLAYER_KEY, JSON.stringify(player));
  }

  private getLeaderboards(): Record<string, LocalLeaderboardEntry[]> {
    const raw = this.ensureStorage().getItem(this.LEADERBOARD_KEY);
    return raw ? JSON.parse(raw) : {};
  }

  private saveLeaderboards(
    data: Record<string, LocalLeaderboardEntry[]>,
  ): void {
    this.ensureStorage().setItem(this.LEADERBOARD_KEY, JSON.stringify(data));
  }

  // ------------------------------------------------------------------
  // Реклама (имитация)
  // ------------------------------------------------------------------
  async showFullscreenAd(
    callbackObject: any,
    openCallbackMethod?: Function,
    closeCallbackMethod?: Function,
  ): Promise<void> {
    console.log("DEV Fullscreen Ad");
    openCallbackMethod?.(callbackObject);
    setTimeout(() => {
      closeCallbackMethod?.(callbackObject);
    }, 1000);
  }

  async showRewardedVideoAd(
    callbackObject: any,
    openCallbackMethod?: Function,
    rewardCallbackMethod?: Function,
    closeCallbackMethod?: Function,
  ): Promise<void> {
    console.log("DEV Rewarded Ad");
    openCallbackMethod?.(callbackObject);
    setTimeout(() => {
      rewardCallbackMethod?.(callbackObject);
    }, 1500);
  }

  // ------------------------------------------------------------------
  // Игрок – авторизация, имя, id
  // ------------------------------------------------------------------
  async isPlayerAuthorized(): Promise<boolean> {
    return true; // В dev‑режиме всегда авторизован
  }

  async getPlayerId(): Promise<string> {
    return this.getPlayer()!.id;
  }

  async getPlayerName(): Promise<string> {
    return this.getPlayer()!.name;
  }

  // ------------------------------------------------------------------
  // Данные игрока
  // ------------------------------------------------------------------
  async getPlayerData(): Promise<PlayerDataSet> {
    return this.getPlayer()!.data;
  }

  async getPlayerDataByKey(key: string): Promise<PlayerData | null> {
    const data = this.getPlayer()!.data;
    return key in data ? data[key] : null;
  }

  async setPlayerData(data: PlayerDataSet): Promise<void> {
    const player = this.getPlayer();
    player!.data = { ...player!.data, ...data };
    this.savePlayer(player!);
  }

  async setPlayerDataByKey(key: string, value: PlayerData): Promise<void> {
    const player = this.getPlayer();
    player!.data[key] = value;
    this.savePlayer(player!);
  }

  // ------------------------------------------------------------------
  // Статистика игрока
  // ------------------------------------------------------------------
  async getPlayerStats(keys?: string[]): Promise<Partial<Stats>> {
    const stats = this.getPlayer()!.stats;
    if (!keys) return { ...stats };
    const filtered: Partial<Stats> = {};
    for (const key of keys) {
      if (key in stats) filtered[key] = stats[key];
    }
    return filtered;
  }

  async setPlayerStats(stats: Stats): Promise<void> {
    const player = this.getPlayer();
    player!.stats = { ...player!.stats, ...stats };
    this.savePlayer(player!);
  }

  async setPlayerStatByKey(stat: string, value: number): Promise<void> {
    await this.setPlayerStats({ [stat]: value });
  }

  async getPlayerStatByKey(key: string): Promise<number> {
    const stats = this.getPlayer()!.stats;
    const val = stats[key];
    return typeof val === "number" && !isNaN(val) ? val : 0;
  }

  // ------------------------------------------------------------------
  // Лидерборды
  // ------------------------------------------------------------------
  async setLeaderboardScore(
    leaderboardName: string,
    score: number,
  ): Promise<void> {
    const boards = this.getLeaderboards();
    const player = this.getPlayer();

    if (!boards[leaderboardName]) {
      boards[leaderboardName] = [];
    }

    const board = boards[leaderboardName];
    const existing = board.find((entry) => entry.playerId === player!.id);

    if (existing) {
      if (score > existing.score) existing.score = score;
    } else {
      board.push({
        playerId: player!.id,
        playerName: player!.name,
        score,
        getAvatarSrc: player!.getAvatarSrc || '',
      });
    }

    board.sort((a, b) => b.score - a.score);
    this.saveLeaderboards(boards);
  }

  async getLeaderboardEntries(
    leaderboardName: string,
    quantityTop: number,
    includeUser: boolean,
    quantityAround: number,
  ): Promise<LeaderboardEntriesData> {
    const boards = this.getLeaderboards();
    const board = boards[leaderboardName] || [];
    const player = this.getPlayer();
  
    // 1. Формируем leaderboard (убран лишний sort_order)
    const leaderboardDescription: LeaderboardDescription = {
      appID: 'local_app',
      default: false,
      description: {
        invert_sort_order: false,
        score_format: {
          options: { decimal_offset: 0 },
        },
        type: 'numberic', // ← "numberic" (с опечаткой, как в SDK)
      },
      name: leaderboardName,
      title: {
        ru: 'Таблица лидеров',
        en: 'Leaderboard',
      },
    };
  
    // 2. Формируем entries с правильным player
    const topEntries: LeaderboardEntry[] = board.slice(0, quantityTop).map((entry, index) => ({
      rank: index + 1,
      score: entry.score,
      extraData: '',
      formattedScore: String(entry.score),
      player: {
        lang: 'ru', // ← обязательное поле
        publicName: entry.playerName,
        scopePermissions: { // ← обязательное поле
          avatar: '',
          public_name: entry.playerName,
        },
        uniqueID: entry.playerId,
        getAvatarSrc: (size?: 'small' | 'medium' | 'large') => {
          return entry.getAvatarSrc || '/default-avatar.png';
        },
        getAvatarSrcSet: (size?: 'small' | 'medium' | 'large') => {
          return entry.getAvatarSrc || '/default-avatar.png';
        },
      },
    }));
  
    // 3. Поиск пользователя (только rank)
    let userRank: number = 0;
  
    if (includeUser) {
      const userRankIndex = board.findIndex(
        (entry) => entry.playerId === player!.id,
      );
      if (userRankIndex !== -1) {
        userRank = userRankIndex + 1;
      }
    }
  
    // 4. Возвращаем объект без userEntry
    return {
        leaderboard: leaderboardDescription,
        entries: topEntries,
        userRank,
        ranges: [],
      };
  }

  // ------------------------------------------------------------------
  // Язык и готовность
  // ------------------------------------------------------------------
  getLocale(): string {
    return this.ensureStorage().getItem(this.LANG_KEY) || "ru";
  }

  gameReady(): void {
    console.log("DEV SDK READY");
  }

  gameStart(): void {
    console.log("DEV SDK GAME START");
  }

  gameStop(): void {
    console.log("DEV SDK GAME STOP");
  }

  // ------------------------------------------------------------------
  // Платежи (не поддерживаются в локальной версии)
  // ------------------------------------------------------------------
  async consumePrevPurchases(consumePurchase: Function): Promise<void> {
    // Ничего не делаем
  }

  async buyShopItem(
    productId: string,
    consumePurchase: Function,
  ): Promise<void> {
    console.log(`DEV покупка "${productId}" симулирована`);
  }

  async getShopCatalog(): Promise<null> {
    return null;
  }
}
