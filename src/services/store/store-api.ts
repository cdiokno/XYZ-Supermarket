import {
  InventoryHistoryChange,
  InventoryHistoryEntry,
  Product,
  PurchaseOrder,
  ReceiptReturn,
  ReceiptReturnLineInput,
  ReceiptReturnRequest,
  Sale,
  SaleItem,
  initialCashiers,
  initialPOs,
  initialProducts,
  initialSales,
} from "@/domain/store";
import { getSupabaseClient, hasSupabaseConfig } from "@/services/supabase";
import type { Database, Json } from "@/services/supabase/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type CashierRow = Database["public"]["Tables"]["cashiers"]["Row"];
type PurchaseOrderRow = Database["public"]["Tables"]["purchase_orders"]["Row"];
type InventoryHistoryRow = Database["public"]["Tables"]["inventory_history"]["Row"];
type ReceiptReturnRow = Database["public"]["Tables"]["receipt_returns"]["Row"];
type SaleItemRow = Database["public"]["Tables"]["sale_items"]["Row"];
type SaleWithItems = Database["public"]["Tables"]["sales"]["Row"] & {
  sale_items: SaleItemRow[] | null;
};

export type StoreData = {
  products: Product[];
  cashiers: string[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  inventoryHistory: InventoryHistoryEntry[];
  receiptReturns: ReceiptReturn[];
};

function cloneSale(sale: Sale): Sale {
  return {
    ...sale,
    items: sale.items.map((item) => ({ ...item })),
  };
}

function cloneReceiptReturn(receiptReturn: ReceiptReturn): ReceiptReturn {
  return {
    ...receiptReturn,
    returnedItems: receiptReturn.returnedItems.map((item) => ({ ...item })),
    replacementItems: receiptReturn.replacementItems.map((item) => ({ ...item })),
  };
}

function cloneStoreData(store: StoreData): StoreData {
  return {
    products: store.products.map((product) => ({ ...product })),
    cashiers: [...store.cashiers],
    sales: store.sales.map(cloneSale),
    purchaseOrders: store.purchaseOrders.map((po) => ({ ...po })),
    inventoryHistory: store.inventoryHistory.map((entry) => ({
      ...entry,
      changes: entry.changes.map((change) => ({ ...change })),
    })),
    receiptReturns: store.receiptReturns.map(cloneReceiptReturn),
  };
}

function createLocalStore(): StoreData {
  return {
    products: initialProducts.map((product) => ({ ...product })),
    cashiers: [...initialCashiers],
    sales: initialSales.map(cloneSale),
    purchaseOrders: initialPOs.map((po) => ({ ...po })),
    inventoryHistory: [],
    receiptReturns: [],
  };
}

let localStore = createLocalStore();

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

  if (message.includes("received_qty") || message.includes("p_received_qty")) {
    return "Partial purchase-order receiving needs the latest Supabase migration. Apply it and try again.";
  }

  if (message.includes("inventory_history") || message.includes("upsert_product_with_history")) {
    return "Inventory history needs the latest Supabase migration. Apply it and try again.";
  }

  if (message.includes("receipt_returns") || message.includes("process_receipt_return")) {
    return "Receipt returns need the latest Supabase migration. Apply it and try again.";
  }

  if (message) return message;
  return "Unexpected Supabase error.";
}

function getPurchaseOrderStatus(receivedQty: number, orderedQty: number): PurchaseOrder["status"] {
  if (receivedQty <= 0) return "Pending";
  if (receivedQty >= orderedQty) return "Received";
  return "Partially Received";
}

function createHistoryId() {
  return `ih-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createReceiptReturnId() {
  return `rr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeHistoryValue(value: string | number | undefined | null) {
  return value ?? null;
}

function getManualProductChanges(previous: Product | null, next: Product): InventoryHistoryChange[] {
  const changes: InventoryHistoryChange[] = [];

  const addChange = (field: string, label: string, before: string | number | undefined | null, after: string | number | undefined | null) => {
    if (normalizeHistoryValue(before) === normalizeHistoryValue(after)) return;
    changes.push({
      field,
      label,
      before: normalizeHistoryValue(before),
      after: normalizeHistoryValue(after),
    });
  };

  addChange("sku", "SKU", previous?.sku, next.sku);
  addChange("name", "Name", previous?.name, next.name);
  addChange("category", "Category", previous?.category, next.category);
  addChange("price", "Price", previous?.price, next.price);
  addChange("stock", "Stock", previous?.stock ?? 0, next.stock);
  addChange("reorderLevel", "Reorder level", previous?.reorderLevel, next.reorderLevel);
  addChange("image", "Photo", previous?.image || null, next.image || null);

  return changes;
}

function addLocalInventoryHistory(entry: Omit<InventoryHistoryEntry, "id" | "date"> & { date?: string }) {
  const { date, ...rest } = entry;
  localStore.inventoryHistory = [
    {
      id: createHistoryId(),
      date: date || new Date().toISOString(),
      ...rest,
      changes: rest.changes.map((change) => ({ ...change })),
    },
    ...localStore.inventoryHistory,
  ];
}

function normalizeReceiptQty(receivedQty: number | undefined, fallback: number) {
  const qty = Math.floor(Number(receivedQty ?? fallback));

  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error("Received quantity must be greater than zero.");
  }

  return qty;
}

function normalizeReturnQty(qty: number) {
  const normalizedQty = Math.floor(Number(qty));

  if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
    throw new Error("Return quantity must be greater than zero.");
  }

  return normalizedQty;
}

function combineLineInputs(lines: ReceiptReturnLineInput[] | undefined) {
  const combined = new Map<string, number>();

  for (const line of lines || []) {
    const productId = line.productId.trim();
    if (!productId) continue;

    const qty = normalizeReturnQty(line.qty);
    combined.set(productId, (combined.get(productId) || 0) + qty);
  }

  return Array.from(combined.entries()).map(([productId, qty]) => ({ productId, qty }));
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
  const legacyRow = row as PurchaseOrderRow & { received_qty?: number | null };
  const receivedQty = Math.max(
    0,
    Math.min(row.qty, Number(legacyRow.received_qty ?? (row.status === "Received" ? row.qty : 0)))
  );

  return {
    id: row.id,
    date: row.date,
    supplier: row.supplier,
    productId: row.product_id,
    productName: row.product_name,
    qty: row.qty,
    receivedQty,
    status: getPurchaseOrderStatus(receivedQty, row.qty),
  };
}

function mapInventoryHistory(row: InventoryHistoryRow): InventoryHistoryEntry {
  const changes = Array.isArray(row.changes) ? (row.changes as InventoryHistoryChange[]) : [];

  return {
    id: row.id,
    date: row.date,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    source: row.source,
    action: row.action,
    quantityDelta: row.quantity_delta,
    stockBefore: row.stock_before,
    stockAfter: row.stock_after,
    changes,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
  };
}

function mapReceiptReturnItems(value: Json): SaleItem[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return [];

    const item = entry as Record<string, unknown>;
    const productId = typeof item.productId === "string" ? item.productId : "";
    const name = typeof item.name === "string" ? item.name : "";
    const price = Number(item.price);
    const qty = Number(item.qty);

    if (!productId || !name || !Number.isFinite(price) || !Number.isFinite(qty) || qty <= 0) return [];

    return [{ productId, name, price, qty }];
  });
}

function mapReceiptReturn(row: ReceiptReturnRow): ReceiptReturn {
  return {
    id: row.id,
    saleId: row.sale_id,
    date: row.date,
    cashier: row.cashier,
    type: row.type,
    returnedItems: mapReceiptReturnItems(row.returned_items),
    replacementItems: mapReceiptReturnItems(row.replacement_items),
    returnedValue: Number(row.returned_value),
    replacementValue: Number(row.replacement_value),
    refundAmount: Number(row.refund_amount),
    additionalDue: Number(row.additional_due),
    storeCreditAmount: Number(row.store_credit_amount),
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
    received_qty: po.receivedQty,
    status: po.status,
  };
}

export async function fetchStoreData(): Promise<StoreData> {
  if (!hasSupabaseConfig) {
    return cloneStoreData(localStore);
  }

  const client = getSupabaseClient();
  let productsResult: any = await client.from("products").select(productSelect).is("deleted_at", null).order("name");

  if (productsResult.error && productsResult.error.message.toLowerCase().includes("deleted_at")) {
    productsResult = await client.from("products").select(legacyProductSelect).order("name");
  }

  const [cashiersResult, salesResult, purchaseOrdersResult, inventoryHistoryResult, receiptReturnsResult] = await Promise.all([
    client.from("cashiers").select("name, created_at").order("name"),
    client.from("sales").select("id, date, cashier, total, created_at, sale_items(name, price, product_id, qty, sale_id)").order("date", {
      ascending: false,
    }),
    client.from("purchase_orders").select("*").order("date", { ascending: false }),
    client.from("inventory_history").select("*").order("date", { ascending: false }),
    client.from("receipt_returns").select("*").order("date", { ascending: false }),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (cashiersResult.error) throw cashiersResult.error;
  if (salesResult.error) throw salesResult.error;
  if (purchaseOrdersResult.error) throw purchaseOrdersResult.error;
  if (inventoryHistoryResult.error) throw inventoryHistoryResult.error;
  if (receiptReturnsResult.error) throw receiptReturnsResult.error;

  return {
    products: ((productsResult.data || []) as ProductRow[]).map(mapProduct),
    cashiers: ((cashiersResult.data || []) as CashierRow[]).map((cashier) => cashier.name),
    sales: ((salesResult.data || []) as SaleWithItems[]).map(mapSale),
    purchaseOrders: ((purchaseOrdersResult.data || []) as PurchaseOrderRow[]).map(mapPurchaseOrder),
    inventoryHistory: ((inventoryHistoryResult.data || []) as InventoryHistoryRow[]).map(mapInventoryHistory),
    receiptReturns: ((receiptReturnsResult.data || []) as ReceiptReturnRow[]).map(mapReceiptReturn),
  };
}

export async function saveProduct(product: Product) {
  if (!hasSupabaseConfig) {
    const next = { ...product };
    const existingIndex = localStore.products.findIndex((item) => item.id === next.id);
    const previous = existingIndex >= 0 ? localStore.products[existingIndex] : null;

    if (existingIndex >= 0) localStore.products[existingIndex] = next;
    else localStore.products.push(next);

    const changes = getManualProductChanges(previous, next);
    if (!previous || changes.length > 0) {
      addLocalInventoryHistory({
        productId: next.id,
        productName: next.name,
        sku: next.sku,
        source: "manual",
        action: previous ? "product_updated" : "product_created",
        quantityDelta: (previous?.stock ?? 0) === next.stock ? null : next.stock - (previous?.stock ?? 0),
        stockBefore: previous?.stock ?? 0,
        stockAfter: next.stock,
        changes,
        referenceType: "product",
        referenceId: next.id,
      });
    }

    return { ...next };
  }

  const client = getSupabaseClient();
  const result = await client.rpc("upsert_product_with_history", {
    p_category: product.category,
    p_image: product.image || null,
    p_name: product.name,
    p_price: product.price,
    p_product_id: product.id,
    p_reorder_level: product.reorderLevel,
    p_sku: product.sku,
    p_stock: product.stock,
  });

  if (result.error) throw result.error;
  return mapProduct(result.data as ProductRow);
}

export async function deleteProduct(id: string) {
  if (!hasSupabaseConfig) {
    const product = localStore.products.find((entry) => entry.id === id);
    if (product) {
      addLocalInventoryHistory({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        source: "manual",
        action: "product_deleted",
        quantityDelta: null,
        stockBefore: product.stock,
        stockAfter: product.stock,
        changes: [],
        referenceType: "product",
        referenceId: product.id,
      });
    }

    localStore.products = localStore.products.filter((product) => product.id !== id);
    return;
  }

  const client = getSupabaseClient();
  const { error } = await client.rpc("delete_product", { p_product_id: id });

  if (error) throw error;
}

export async function addCashier(name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error("Cashier name is required.");

  if (!hasSupabaseConfig) {
    if (!localStore.cashiers.includes(trimmedName)) {
      localStore.cashiers.push(trimmedName);
      localStore.cashiers.sort((a, b) => a.localeCompare(b));
    }
    return trimmedName;
  }

  const client = getSupabaseClient();
  const { data, error } = await client
    .from("cashiers")
    .upsert({ name: trimmedName }, { ignoreDuplicates: true, onConflict: "name" })
    .select("name, created_at")
    .maybeSingle();

  if (error) throw error;
  return data ? (data as CashierRow).name : trimmedName;
}

export async function checkoutSale(sale: Sale) {
  if (!hasSupabaseConfig) {
    for (const item of sale.items) {
      const product = localStore.products.find((entry) => entry.id === item.productId);
      if (!product) throw new Error(`Could not find product "${item.name}".`);
      if (product.stock < item.qty) throw new Error(`Not enough stock for "${item.name}".`);
    }

    for (const item of sale.items) {
      const product = localStore.products.find((entry) => entry.id === item.productId);
      if (!product) continue;
      product.stock -= item.qty;
    }

    localStore.sales = [cloneSale(sale), ...localStore.sales];
    return;
  }

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
  if (!hasSupabaseConfig) {
    const sale = localStore.sales.find((entry) => entry.id === id);
    if (!sale) return;

    if (localStore.receiptReturns.some((receiptReturn) => receiptReturn.saleId === id)) {
      throw new Error("Receipts with return history cannot be deleted.");
    }

    for (const item of sale.items) {
      const product = localStore.products.find((entry) => entry.id === item.productId);
      if (product) product.stock += item.qty;
    }

    localStore.sales = localStore.sales.filter((entry) => entry.id !== id);
    return;
  }

  const client = getSupabaseClient();
  const { error } = await client.rpc("delete_sale", { p_sale_id: id });

  if (error) throw error;
}

export async function processReceiptReturn(request: ReceiptReturnRequest) {
  const id = request.id?.trim() || createReceiptReturnId();
  const cashier = request.cashier.trim();
  const date = request.date || new Date().toISOString();

  if (!cashier) throw new Error("Cashier is required.");

  if (!["cash_refund", "replacement", "store_credit"].includes(request.type)) {
    throw new Error("Choose a valid return type.");
  }

  if (!hasSupabaseConfig) {
    if (localStore.receiptReturns.some((receiptReturn) => receiptReturn.id === id)) {
      throw new Error(`Return ${id} already exists.`);
    }

    const sale = localStore.sales.find((entry) => entry.id === request.saleId);
    if (!sale) throw new Error(`Receipt ${request.saleId.toUpperCase()} was not found.`);

    const returnedInputs = combineLineInputs(request.returnedItems);
    if (returnedInputs.length === 0) throw new Error("Select at least one returned item.");

    const previouslyReturned = new Map<string, number>();
    for (const receiptReturn of localStore.receiptReturns.filter((entry) => entry.saleId === request.saleId)) {
      for (const item of receiptReturn.returnedItems) {
        previouslyReturned.set(item.productId, (previouslyReturned.get(item.productId) || 0) + item.qty);
      }
    }

    const returnedItems: SaleItem[] = returnedInputs.map((input) => {
      const soldItem = sale.items.find((item) => item.productId === input.productId);
      if (!soldItem) throw new Error("Returned item must be from the selected receipt.");

      const alreadyReturned = previouslyReturned.get(input.productId) || 0;
      const remainingQty = soldItem.qty - alreadyReturned;
      if (input.qty > remainingQty) {
        throw new Error(`Only ${remainingQty} ${soldItem.name} can still be returned from this receipt.`);
      }

      return { ...soldItem, qty: input.qty };
    });

    const replacementInputs = request.type === "replacement" ? combineLineInputs(request.replacementItems) : [];
    if (request.type === "replacement" && replacementInputs.length === 0) {
      throw new Error("Select at least one replacement item.");
    }

    const replacementItems: SaleItem[] = replacementInputs.map((input) => {
      const product = localStore.products.find((entry) => entry.id === input.productId);
      if (!product) throw new Error("Replacement item was not found.");
      if (product.stock < input.qty) throw new Error(`Not enough stock for "${product.name}".`);

      return { productId: product.id, name: product.name, price: product.price, qty: input.qty };
    });

    for (const item of replacementItems) {
      const product = localStore.products.find((entry) => entry.id === item.productId);
      if (product) product.stock -= item.qty;
    }

    if (!localStore.cashiers.includes(cashier)) {
      localStore.cashiers.push(cashier);
      localStore.cashiers.sort((a, b) => a.localeCompare(b));
    }

    const returnedValue = returnedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const replacementValue = replacementItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const refundAmount =
      request.type === "cash_refund"
        ? returnedValue
        : request.type === "replacement"
          ? Math.max(0, returnedValue - replacementValue)
          : 0;
    const additionalDue = request.type === "replacement" ? Math.max(0, replacementValue - returnedValue) : 0;
    const storeCreditAmount = request.type === "store_credit" ? returnedValue : 0;

    const receiptReturn: ReceiptReturn = {
      id,
      saleId: sale.id,
      date,
      cashier,
      type: request.type,
      returnedItems,
      replacementItems,
      returnedValue,
      replacementValue,
      refundAmount,
      additionalDue,
      storeCreditAmount,
    };

    localStore.receiptReturns = [cloneReceiptReturn(receiptReturn), ...localStore.receiptReturns];
    return cloneReceiptReturn(receiptReturn);
  }

  const client = getSupabaseClient();
  const returnedItems: Json = request.returnedItems.map((item) => ({
    product_id: item.productId,
    qty: item.qty,
  }));
  const replacementItems: Json = (request.replacementItems || []).map((item) => ({
    product_id: item.productId,
    qty: item.qty,
  }));

  const { data, error } = await client.rpc("process_receipt_return", {
    p_cashier: cashier,
    p_date: date,
    p_replacement_items: replacementItems,
    p_return_id: id,
    p_returned_items: returnedItems,
    p_sale_id: request.saleId,
    p_type: request.type,
  });

  if (error) throw error;
  return mapReceiptReturn(data as ReceiptReturnRow);
}

export async function createPurchaseOrder(po: PurchaseOrder) {
  if (!hasSupabaseConfig) {
    const next = { ...po };
    localStore.purchaseOrders = [next, ...localStore.purchaseOrders];
    return { ...next };
  }

  const client = getSupabaseClient();
  const { data, error } = await client.from("purchase_orders").insert(purchaseOrderToRow(po)).select("*").single();

  if (error) throw error;
  return mapPurchaseOrder(data as PurchaseOrderRow);
}

export async function deletePurchaseOrder(id: string) {
  if (!hasSupabaseConfig) {
    const target = localStore.purchaseOrders.find((po) => po.id === id);
    if (!target) return;

    if (target.receivedQty > 0) {
      const product = localStore.products.find((entry) => entry.id === target.productId);
      if (product) {
        const stockBefore = product.stock;
        product.stock = Math.max(0, product.stock - target.receivedQty);
        addLocalInventoryHistory({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          source: "purchase_order",
          action: "po_deleted",
          quantityDelta: product.stock - stockBefore,
          stockBefore,
          stockAfter: product.stock,
          changes: [],
          referenceType: "purchase_order",
          referenceId: target.id,
        });
      }
    }

    localStore.purchaseOrders = localStore.purchaseOrders.filter((po) => po.id !== id);
    return;
  }

  const client = getSupabaseClient();
  const { error } = await client.rpc("delete_purchase_order", { p_po_id: id });

  if (error) throw error;
}

export async function receivePurchaseOrder(id: string, receivedQty?: number) {
  if (!hasSupabaseConfig) {
    const target = localStore.purchaseOrders.find((po) => po.id === id);
    if (!target || target.receivedQty >= target.qty) return target ? { ...target } : undefined;

    const remainingQty = target.qty - target.receivedQty;
    const qtyToReceive = normalizeReceiptQty(receivedQty, remainingQty);

    if (qtyToReceive > remainingQty) {
      throw new Error(`Cannot receive ${qtyToReceive} units; only ${remainingQty} remain for ${target.productName}.`);
    }

    target.receivedQty += qtyToReceive;
    target.status = getPurchaseOrderStatus(target.receivedQty, target.qty);
    const product = localStore.products.find((entry) => entry.id === target.productId);
    if (product) {
      const stockBefore = product.stock;
      product.stock += qtyToReceive;
      addLocalInventoryHistory({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        source: "purchase_order",
        action: "po_received",
        quantityDelta: qtyToReceive,
        stockBefore,
        stockAfter: product.stock,
        changes: [],
        referenceType: "purchase_order",
        referenceId: target.id,
      });
    }
    return { ...target };
  }

  const client = getSupabaseClient();
  const { data, error } = await client.rpc("receive_purchase_order", {
    p_po_id: id,
    p_received_qty: receivedQty ?? null,
  });

  if (error) throw error;
  return mapPurchaseOrder(data as PurchaseOrderRow);
}

export async function undoReceivePurchaseOrder(id: string, receivedQty?: number) {
  if (!hasSupabaseConfig) {
    const target = localStore.purchaseOrders.find((po) => po.id === id);
    if (!target || target.receivedQty <= 0) return target ? { ...target } : undefined;

    const qtyToUndo = normalizeReceiptQty(receivedQty, target.receivedQty);

    if (qtyToUndo > target.receivedQty) {
      throw new Error(`Cannot undo ${qtyToUndo} units; only ${target.receivedQty} were received for ${target.productName}.`);
    }

    target.receivedQty -= qtyToUndo;
    target.status = getPurchaseOrderStatus(target.receivedQty, target.qty);
    const product = localStore.products.find((entry) => entry.id === target.productId);
    if (product) {
      const stockBefore = product.stock;
      product.stock = Math.max(0, product.stock - qtyToUndo);
      addLocalInventoryHistory({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        source: "purchase_order",
        action: "po_receipt_undone",
        quantityDelta: product.stock - stockBefore,
        stockBefore,
        stockAfter: product.stock,
        changes: [],
        referenceType: "purchase_order",
        referenceId: target.id,
      });
    }
    return { ...target };
  }

  const client = getSupabaseClient();
  const { data, error } = await client.rpc("undo_receive_purchase_order", {
    p_po_id: id,
    p_received_qty: receivedQty ?? null,
  });

  if (error) throw error;
  return mapPurchaseOrder(data as PurchaseOrderRow);
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
