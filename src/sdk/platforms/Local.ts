import type { IGamePlatform } from "../IGamePlatform";

type PlayerData = {
  id: string;
  name: string;
  stats: Record<string, any>;
  data: Record<string, any>;
};

type LeaderboardEntry = {
  playerId: string;
  playerName: string;
  score: number;
};

export class LocalStoragePlatform implements IGamePlatform {
  private storage: Storage | null = null;

  private PLAYER_KEY = "dev_player";
  private LEADERBOARD_KEY = "dev_leaderboards";
  private LANG_KEY = "lang";

  async init(): Promise<void> {
    this.storage = localStorage;

    if (!this.storage.getItem(this.PLAYER_KEY)) {
      const player: PlayerData = {
        id: "local_player_1",
        name: "Developer",
        stats: {},
        data: {},
      };

      this.storage.setItem(this.PLAYER_KEY, JSON.stringify(player));
    }

    if (!this.storage.getItem(this.LEADERBOARD_KEY)) {
      this.storage.setItem(this.LEADERBOARD_KEY, JSON.stringify({}));
    }

    if (!this.storage.getItem(this.LANG_KEY)) {
      this.storage.setItem(this.LANG_KEY, "ru");
    }
  }

  private getPlayer(): PlayerData {
    return JSON.parse(this.storage!.getItem(this.PLAYER_KEY)!);
  }

  private savePlayer(player: PlayerData) {
    this.storage!.setItem(this.PLAYER_KEY, JSON.stringify(player));
  }

  private getLeaderboards(): Record<string, LeaderboardEntry[]> {
    return JSON.parse(this.storage!.getItem(this.LEADERBOARD_KEY)!);
  }

  private saveLeaderboards(data: Record<string, LeaderboardEntry[]>) {
    this.storage!.setItem(this.LEADERBOARD_KEY, JSON.stringify(data));
  }

  async showFullscreenAd(
    object: any,
    openCallbackMethod: Function,
    closeCallbackMethod: Function,
  ): Promise<void> {
    console.log("DEV Fullscreen Ad");

    openCallbackMethod?.(object);

    setTimeout(() => {
      closeCallbackMethod?.(object);
    }, 1000);
  }

  async showRewardedVideoAd(
    object: any,
    openCallbackMethod: Function,
    rewardCallbackMethod: Function,
  ): Promise<void> {
    console.log("DEV Rewarded Ad");

    openCallbackMethod?.(object);

    setTimeout(() => {
      rewardCallbackMethod?.(object);
    }, 1500);
  }

  async isPlayerAuthorized() {
    return true;
  }

  async getPlayerId() {
    return this.getPlayer().id;
  }

  async getPlayerName() {
    return this.getPlayer().name;
  }

  async getPlayerDataByKey(key: string) {
    return key in this.getPlayer().data ? this.getPlayer().data[key] : null;
  }

  async getPlayerData() {
    return this.getPlayer().data;
  }

  async setPlayerData(data: any) {
    const player = this.getPlayer();
    player.data = data;
    this.savePlayer(player);
    return data;
  }

  async setPlayerDataByKey(key: string, value: any) {
    const player = this.getPlayer();
    player.data[key] = value;
    this.savePlayer(player);

    return player.data;
  }

  async getPlayerStats(keys: string[] | null) {
    const stats = this.getPlayer().stats;

    if (!keys) return stats;

    const filtered: Record<string, any> = {};

    keys.forEach((key) => {
      if (key in stats) filtered[key] = stats[key];
    });

    return filtered;
  }

  async setPlayerStats(stats: any) {
    const player = this.getPlayer();
    player.stats = {
      ...player.stats,
      ...stats,
    };

    this.savePlayer(player);
    return player.stats;
  }

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

    const existing = board.find((x) => x.playerId === player.id);

    if (existing) {
      if (score > existing.score) {
        existing.score = score;
      }
    } else {
      board.push({
        playerId: player.id,
        playerName: player.name,
        score,
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
  ) {
    const boards = this.getLeaderboards();

    const board = boards[leaderboardName] || [];

    return {
      entries: board.slice(0, quantityTop).map((item, index) => ({
        rank: index + 1,
        score: item.score,
        player: {
          publicName: item.playerName,
          uniqueID: item.playerId,
        },
      })),
    };
  }

  consumePrevPurchases(consumePurchase: Function) {
  }

  async buyShopItem(productId: string, consumePurchase: Function) {
  }
  
  async getShopCatalog() {
    return null;
  }


  getLocale() {
    return this.storage?.getItem(this.LANG_KEY) || "ru";
  }

  gameReady() {
    console.log("DEV SDK READY");
  }
}
