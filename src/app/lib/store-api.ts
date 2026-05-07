import { Product, PurchaseOrder, Sale, initialCashiers, initialPOs, initialProducts, initialSales } from "../components/store-data";
import { getSupabaseClient, hasSupabaseConfig } from "./supabase";
import type { Database, Json } from "./database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type CashierRow = Database["public"]["Tables"]["cashiers"]["Row"];
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];
type SaleItemRow = Database["public"]["Tables"]["sale_items"]["Row"];
type SaleWithItems = Database["public"]["Tables"]["sales"]["Row"] & {
  sale_items: SaleItemRow[] | null;
};

export type StoreData = {
  products: Product[];
  cashiers: string[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
};

const productSelect = "id, sku, name, category, price, stock, reorder_level, image, deleted_at";
const legacyProductSelect = "id, sku, name, category, price, stock, reorder_level, image";

export function getStoreErrorMessage(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "";

  if (message.includes("Could not find the function public.delete_")) {
    return "The Supabase delete functions are not installed yet. Apply the latest Supabase migration and try again.";
  }

  if (message) return message;
  return "Unexpected Supabase error.";
}

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    stock: row.stock,
    reorderLevel: row.reorder_level,
    image: row.image || undefined,
  };
}

function mapSale(row: SaleWithItems): Sale {
  return {
    id: row.id,
    date: row.date,
    cashier: row.cashier,
    total: Number(row.total),
    items: (row.sale_items || []).map((item) => ({
      productId: item.product_id,
      name: item.name,
      price: Number(item.price),
      qty: item.qty,
    })),
  };
}

function mapPurchaseOrder(row: PurchaseOrderRow): PurchaseOrder {
  return {
    id: row.id,
    date: row.date,
    supplier: row.supplier,
    productId: row.product_id,
    productName: row.product_name,
    qty: row.qty,
    status: row.status,
  };
}

function productToRow(product: Product): Database["public"]["Tables"]["products"]["Insert"] {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    reorder_level: product.reorderLevel,
    image: product.image || null,
  };
}

function purchaseOrderToRow(po: PurchaseOrder): Database["public"]["Tables"]["purchase_orders"]["Insert"] {
  return {
    id: po.id,
    date: po.date,
    supplier: po.supplier,
    product_id: po.productId,
    product_name: po.productName,
    qty: po.qty,
    status: po.status,
  };
}

export async function fetchStoreData(): Promise<StoreData> {
  if (!hasSupabaseConfig) {
    return {
      products: initialProducts,
      cashiers: initialCashiers,
      sales: initialSales,
      purchaseOrders: initialPOs,
    };
  }

  const client = getSupabaseClient();
  let productsResult = await client.from("products").select(productSelect).is("deleted_at", null).order("name");

  if (productsResult.error && productsResult.error.message.toLowerCase().includes("deleted_at")) {
    productsResult = await client.from("products").select(legacyProductSelect).order("name");
  }

  const [cashiersResult, salesResult, purchaseOrdersResult] = await Promise.all([
    client.from("cashiers").select("name, created_at").order("name"),
    client.from("sales").select("id, date, cashier, total, created_at, sale_items(name, price, product_id, qty, sale_id)").order("date", {
      ascending: false,
    }),
    client.from("purchase_orders").select("*").order("date", { ascending: false }),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (cashiersResult.error) throw cashiersResult.error;
  if (salesResult.error) throw salesResult.error;
  if (purchaseOrdersResult.error) throw purchaseOrdersResult.error;

  return {
    products: ((productsResult.data || []) as ProductRow[]).map(mapProduct),
    cashiers: ((cashiersResult.data || []) as CashierRow[]).map((cashier) => cashier.name),
    sales: ((salesResult.data || []) as SaleWithItems[]).map(mapSale),
    purchaseOrders: ((purchaseOrdersResult.data || []) as PurchaseOrderRow[]).map(mapPurchaseOrder),
  };
}

export async function saveProduct(product: Product) {
  if (!hasSupabaseConfig) return product;

  const client = getSupabaseClient();
  let result = await client
    .from("products")
    .upsert(productToRow(product), { onConflict: "id" })
    .select(productSelect)
    .single();

  if (result.error && result.error.message.toLowerCase().includes("deleted_at")) {
    result = await client
      .from("products")
      .upsert(productToRow(product), { onConflict: "id" })
      .select(legacyProductSelect)
      .single();
  }

  if (result.error) throw result.error;
  return mapProduct(result.data as ProductRow);
}

export async function deleteProduct(id: string) {
  if (!hasSupabaseConfig) return;

  const client = getSupabaseClient();
  const { error } = await client.rpc("delete_product", { p_product_id: id });

  if (error) throw error;
}

export async function addCashier(name: string) {
  if (!hasSupabaseConfig) return name;

  const client = getSupabaseClient();
  const { data, error } = await client.from("cashiers").upsert({ name }, { onConflict: "name" }).select("name, created_at").single();

  if (error) throw error;
  return (data as CashierRow).name;
}

export async function checkoutSale(sale: Sale) {
  if (!hasSupabaseConfig) return;

  const client = getSupabaseClient();
  const items: Json = sale.items.map((item) => ({
    product_id: item.productId,
    qty: item.qty,
  }));

  const { error } = await client.rpc("checkout_sale", {
    p_cashier: sale.cashier,
    p_date: sale.date,
    p_items: items,
    p_sale_id: sale.id,
  });

  if (error) throw error;
}

export async function deleteSale(id: string) {
  if (!hasSupabaseConfig) return;

  const client = getSupabaseClient();
  const { error } = await client.rpc("delete_sale", { p_sale_id: id });

  if (error) throw error;
}

export async function createPurchaseOrder(po: PurchaseOrder) {
  if (!hasSupabaseConfig) return po;

  const client = getSupabaseClient();
  const { data, error } = await client.from("purchase_orders").insert(purchaseOrderToRow(po)).select("*").single();

  if (error) throw error;
  return mapPurchaseOrder(data as PurchaseOrderRow);
}

export async function deletePurchaseOrder(id: string) {
  if (!hasSupabaseConfig) return;

  const client = getSupabaseClient();
  const { error } = await client.rpc("delete_purchase_order", { p_po_id: id });

  if (error) throw error;
}

export async function receivePurchaseOrder(id: string) {
  if (!hasSupabaseConfig) return;

  const client = getSupabaseClient();
  const { error } = await client.rpc("receive_purchase_order", { p_po_id: id });

  if (error) throw error;
}

export async function undoReceivePurchaseOrder(id: string) {
  if (!hasSupabaseConfig) return;

  const client = getSupabaseClient();
  const { error } = await client.rpc("undo_receive_purchase_order", { p_po_id: id });

  if (error) throw error;
}

export async function uploadProductImage(file: File, productId: string) {
  if (!hasSupabaseConfig) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error || new Error("Could not read image file."));
      reader.readAsDataURL(file);
    });
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const path = `${productId}/${Date.now()}-${safeName || `product.${extension}`}`;
  const client = getSupabaseClient();

  const { error } = await client.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;

  const { data } = client.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
