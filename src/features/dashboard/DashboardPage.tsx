import { useStore } from "@/app/providers/store-provider";
import { Dashboard } from "./Dashboard";

export default function DashboardPage() {
  const { products, sales } = useStore();
  return <Dashboard products={products} sales={sales} />;
}
