import { useStore } from "@/app/providers/store-provider";
import { POS } from "./POS";

export default function POSPage() {
  const { products, cashiers, addCashier, checkout } = useStore();

  return <POS products={products} cashiers={cashiers} onAddCashier={addCashier} onCheckout={checkout} />;
}
