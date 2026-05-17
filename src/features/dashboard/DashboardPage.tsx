import { useStore } from "@/app/providers/store-provider";
import { useAuth } from "@/app/providers/auth-provider";
import { Dashboard } from "./Dashboard";

export default function DashboardPage() {
  const { products, sales, purchaseOrders } = useStore();
  const { currentUser } = useAuth();

  return <Dashboard products={products} sales={sales} purchaseOrders={purchaseOrders} userName={currentUser?.name || "Cashier"} />;
}
