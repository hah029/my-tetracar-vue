export type PurchaseTransaction = {
  id: string;

  productId: string;

  status: "pending" | "completed" | "failed";

  createdAt: number;
};
