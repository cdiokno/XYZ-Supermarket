import { useStore } from "@/app/providers/store-provider";
import { PurchaseOrders } from "./PurchaseOrders";

export default function PurchaseOrdersPage() {
  const {
    products,
    purchaseOrders,
    createPurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder,
    undoReceivePurchaseOrder,
  } = useStore();

  return (
    <PurchaseOrders
      products={products}
      purchaseOrders={purchaseOrders}
      onCreatePO={createPurchaseOrder}
      onDeletePO={deletePurchaseOrder}
      receivePO={receivePurchaseOrder}
      undoReceivePO={undoReceivePurchaseOrder}
    />
  );
}
