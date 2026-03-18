import { BaseItem } from "../BaseItem";

export class CoinItem extends BaseItem {
  protected value!: number;

  public getValue(): number {
    return this.value;
  }
}
