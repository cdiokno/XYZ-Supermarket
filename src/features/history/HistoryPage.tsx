import { useStore } from "@/app/providers/store-provider";
import { useAuth } from "@/app/providers/auth-provider";
import { History } from "./History";

export default function HistoryPage() {
  const { products, sales, receiptReturns, deleteSale, processReceiptReturn } = useStore();
  const { currentUser } = useAuth();

  return (
    <History
      products={products}
      sales={sales}
      receiptReturns={receiptReturns}
      cashierName={currentUser?.name || "Cashier"}
      onDeleteSale={deleteSale}
      onProcessReceiptReturn={processReceiptReturn}
    />
  );
}
