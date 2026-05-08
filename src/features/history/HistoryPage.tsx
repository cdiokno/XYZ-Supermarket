import { useStore } from "@/app/providers/store-provider";
import { History } from "./History";

export default function HistoryPage() {
  const { sales, deleteSale } = useStore();
  return <History sales={sales} onDeleteSale={deleteSale} />;
}
