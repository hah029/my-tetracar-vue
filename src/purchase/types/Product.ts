import type { RewardType } from "./Reward";

export type Product = {
  id: string;

  type: RewardType;

  title: string;

  price: {
    value: number;

    currency: "USD" | "EUR" | "RUB" | "YAN" | "golden" | "energon";
  };

  effect: any;

  description?: string;

  titleEn?: string;

  descriptionEn?: string;

  platformPriceLabel?: string;

  imageURI?: string;
};
