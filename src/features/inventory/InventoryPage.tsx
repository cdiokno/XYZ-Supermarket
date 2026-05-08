import { useStore } from "@/app/providers/store-provider";
import { Inventory } from "./Inventory";

export default function InventoryPage() {
  const { products, saveProduct, deleteProduct, uploadProductImage } = useStore();

  return (
    <Inventory
      products={products}
      onSaveProduct={saveProduct}
      onDeleteProduct={deleteProduct}
      onUploadImage={uploadProductImage}
    />
  );
}
