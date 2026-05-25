import { useStore } from "@/app/providers/store-provider";
import { useAuth } from "@/app/providers/auth-provider";
import { POS } from "./POS";

export default function POSPage() {
  const { products, sales, checkout, posCart, setPosCart, posTendered, setPosTendered } = useStore();
  const { currentUser } = useAuth();
  const cashierName = currentUser?.name || "Cashier";
  const cashierImage = currentUser?.profileImage || "";

  return (
    <POS
      products={products}
      sales={sales}
      cashierName={cashierName}
      cashierImage={cashierImage}
      cart={posCart}
      setCart={setPosCart}
      tendered={posTendered}
      setTendered={setPosTendered}
      onCheckout={checkout}
    />
  );
}
