import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product, PurchaseOrder, Sale } from "@/domain/store";
import {
  addCashier,
  checkoutSale,
  createPurchaseOrder,
  deleteProduct,
  deletePurchaseOrder,
  deleteSale,
  fetchStoreData,
  getStoreErrorMessage,
  receivePurchaseOrder,
  saveProduct,
  undoReceivePurchaseOrder,
  uploadProductImage,
} from "@/services/store";
import { hasSupabaseConfig } from "@/services/supabase";
import { toast } from "sonner";

type StoreContextValue = {
  products: Product[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  cashiers: string[];
  loading: boolean;
  syncing: boolean;
  loadError: string | null;
  hasSupabaseConfig: boolean;
  checkout: (sale: Sale) => Promise<void>;
  saveProduct: (product: Product) => Promise<void>;
  deleteProduct: (product: Product) => Promise<void>;
  addCashier: (name: string) => Promise<void>;
  createPurchaseOrder: (purchaseOrder: PurchaseOrder) => Promise<void>;
  deletePurchaseOrder: (purchaseOrder: PurchaseOrder) => Promise<void>;
  deleteSale: (sale: Sale) => Promise<void>;
  receivePurchaseOrder: (purchaseOrder: PurchaseOrder) => Promise<void>;
  undoReceivePurchaseOrder: (purchaseOrder: PurchaseOrder) => Promise<void>;
  uploadProductImage: (file: File, productId: string) => Promise<string>;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [cashiers, setCashiers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStore = useCallback(async (initial = false) => {
    try {
      if (initial) {
        setLoading(true);
      } else {
        setSyncing(true);
      }

      setLoadError(null);
      const data = await fetchStoreData();
      setProducts(data.products);
      setSales(data.sales);
      setPurchaseOrders(data.purchaseOrders);
      setCashiers(data.cashiers);
    } catch (error) {
      const message = getStoreErrorMessage(error);
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    void loadStore(true);
  }, [loadStore]);

  const handleCheckout = useCallback(
    async (sale: Sale) => {
      await checkoutSale(sale);
      await loadStore();
    },
    [loadStore]
  );

  const handleSaveProduct = useCallback(async (product: Product) => {
    const saved = await saveProduct(product);
    setProducts((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved];
    });
  }, []);

  const handleDeleteProduct = useCallback(
    async (product: Product) => {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      void loadStore();
    },
    [loadStore]
  );

  const handleAddCashier = useCallback(async (name: string) => {
    const saved = await addCashier(name);
    setCashiers((current) => (current.includes(saved) ? current : [...current, saved].sort()));
  }, []);

  const handleCreatePurchaseOrder = useCallback(async (purchaseOrder: PurchaseOrder) => {
    const saved = await createPurchaseOrder(purchaseOrder);
    setPurchaseOrders((current) => [saved, ...current]);
  }, []);

  const handleDeletePurchaseOrder = useCallback(
    async (purchaseOrder: PurchaseOrder) => {
      await deletePurchaseOrder(purchaseOrder.id);
      setPurchaseOrders((current) => current.filter((item) => item.id !== purchaseOrder.id));

      if (purchaseOrder.status === "Received") {
        setProducts((current) =>
          current.map((product) =>
            product.id === purchaseOrder.productId ? { ...product, stock: Math.max(0, product.stock - purchaseOrder.qty) } : product
          )
        );
      }

      void loadStore();
    },
    [loadStore]
  );

  const handleDeleteSale = useCallback(
    async (sale: Sale) => {
      await deleteSale(sale.id);
      setSales((current) => current.filter((item) => item.id !== sale.id));
      setProducts((current) =>
        current.map((product) => {
          const soldItem = sale.items.find((item) => item.productId === product.id);
          return soldItem ? { ...product, stock: product.stock + soldItem.qty } : product;
        })
      );
      void loadStore();
    },
    [loadStore]
  );

  const handleReceivePurchaseOrder = useCallback(
    async (purchaseOrder: PurchaseOrder) => {
      await receivePurchaseOrder(purchaseOrder.id);
      setPurchaseOrders((current) =>
        current.map((item) => (item.id === purchaseOrder.id ? { ...item, status: "Received" } : item))
      );
      setProducts((current) =>
        current.map((product) => (product.id === purchaseOrder.productId ? { ...product, stock: product.stock + purchaseOrder.qty } : product))
      );
      void loadStore();
    },
    [loadStore]
  );

  const handleUndoReceivePurchaseOrder = useCallback(
    async (purchaseOrder: PurchaseOrder) => {
      await undoReceivePurchaseOrder(purchaseOrder.id);
      setPurchaseOrders((current) =>
        current.map((item) => (item.id === purchaseOrder.id ? { ...item, status: "Pending" } : item))
      );
      setProducts((current) =>
        current.map((product) =>
          product.id === purchaseOrder.productId ? { ...product, stock: Math.max(0, product.stock - purchaseOrder.qty) } : product
        )
      );
      void loadStore();
    },
    [loadStore]
  );

  const contextValue = useMemo<StoreContextValue>(
    () => ({
      products,
      sales,
      purchaseOrders,
      cashiers,
      loading,
      syncing,
      loadError,
      hasSupabaseConfig,
      checkout: handleCheckout,
      saveProduct: handleSaveProduct,
      deleteProduct: handleDeleteProduct,
      addCashier: handleAddCashier,
      createPurchaseOrder: handleCreatePurchaseOrder,
      deletePurchaseOrder: handleDeletePurchaseOrder,
      deleteSale: handleDeleteSale,
      receivePurchaseOrder: handleReceivePurchaseOrder,
      undoReceivePurchaseOrder: handleUndoReceivePurchaseOrder,
      uploadProductImage,
    }),
    [
      products,
      sales,
      purchaseOrders,
      cashiers,
      loading,
      syncing,
      loadError,
      handleCheckout,
      handleSaveProduct,
      handleDeleteProduct,
      handleAddCashier,
      handleCreatePurchaseOrder,
      handleDeletePurchaseOrder,
      handleDeleteSale,
      handleReceivePurchaseOrder,
      handleUndoReceivePurchaseOrder,
    ]
  );

  return <StoreContext.Provider value={contextValue}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used inside StoreProvider.");
  }

  return context;
}
