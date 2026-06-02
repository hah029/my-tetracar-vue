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

    currency: "USD" | "EUR" | "golden" | "energon";
  };

  effect: any;
};
