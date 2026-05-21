import { useAuth } from "@/app/providers/auth-provider";
import { useStore } from "@/app/providers/store-provider";
import { canManagePurchaseOrders, canReceivePurchaseOrders } from "@/app/permissions";
import { PurchaseOrders } from "./PurchaseOrders";

export default function PurchaseOrdersPage() {
  const { currentUser } = useAuth();
  const {
    products,
    purchaseOrders,
    createPurchaseOrder,
    deletePurchaseOrder,
    receivePurchaseOrder,
    undoReceivePurchaseOrder,
  } = useStore();
  const canManagePOs = currentUser ? canManagePurchaseOrders(currentUser.role) : false;
  const canReceivePOs = currentUser ? canReceivePurchaseOrders(currentUser.role) : false;

  return (
    <PurchaseOrders
      products={products}
      purchaseOrders={purchaseOrders}
      onCreatePO={createPurchaseOrder}
      onDeletePO={deletePurchaseOrder}
      receivePO={receivePurchaseOrder}
      undoReceivePO={undoReceivePurchaseOrder}
      canCreatePO={canManagePOs}
      canDeletePO={canManagePOs}
      canReceivePO={canReceivePOs}
      canUndoReceivePO={canManagePOs}
    />
  );
}
