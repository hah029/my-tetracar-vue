// общий интерфейс для всех платформ
export type LeaderBoardPlayer = {
  publicName: string;
  uniqueId: string;
};

export type LeaderBoardRecord = {
  player: LeaderBoardPlayer;
  rank: number;
  score: number;
};

export type LeaderBoard = {
  entries: Array<LeaderBoardRecord>;
};
