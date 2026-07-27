export type Product = {
  id: string;

  type:
    | "currency"
    | "consumable"
    | "upgrade"
    | "cosmetic"
    | "timed_feature"
    | "permanent_feature";

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
