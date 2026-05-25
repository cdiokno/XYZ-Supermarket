import { useStore } from "@/app/providers/store-provider";
import { Inventory } from "./Inventory";

export default function InventoryPage() {
  const { products, inventoryHistory, saveProduct, deleteProduct, uploadProductImage, posCart } = useStore();

  return (
    <Inventory
      products={products}
      inventoryHistory={inventoryHistory}
      hasPendingOrder={posCart.length > 0}
      onSaveProduct={saveProduct}
      onDeleteProduct={deleteProduct}
      onUploadImage={uploadProductImage}
    />
  );
}
