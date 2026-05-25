import { useStore } from "@/app/providers/store-provider";
import { Reports } from "./Reports";

export default function ReportsPage() {
  const { products, sales, receiptReturns } = useStore();
  return <Reports products={products} sales={sales} receiptReturns={receiptReturns} />;
}
