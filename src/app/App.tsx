import { useCallback, useEffect, useState } from "react";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Dashboard } from "./components/Dashboard";
import { POS } from "./components/POS";
import { Inventory } from "./components/Inventory";
import { PurchaseOrders } from "./components/PurchaseOrders";
import { Reports } from "./components/Reports";
import { History } from "./components/History";
import { Sidebar, navItems, View } from "./components/Sidebar";
import { Product, Sale, PurchaseOrder } from "./components/store-data";
import {
  addCashier,
  checkoutSale,
  createPurchaseOrder,
  fetchStoreData,
  getStoreErrorMessage,
  receivePurchaseOrder,
  saveProduct,
  uploadProductImage,
} from "./lib/store-api";
import { hasSupabaseConfig } from "./lib/supabase";
import { toast } from "sonner";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [pos, setPOs] = useState<PurchaseOrder[]>([]);
  const [cashiers, setCashiers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadStore = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true);
      else setSyncing(true);

      setLoadError(null);
      const data = await fetchStoreData();
      setProducts(data.products);
      setSales(data.sales);
      setPOs(data.purchaseOrders);
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

  const handleCheckout = async (sale: Sale) => {
    await checkoutSale(sale);
    await loadStore();
  };

  const handleSaveProduct = async (product: Product) => {
    const saved = await saveProduct(product);
    setProducts((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved];
    });
  };

  const handleAddCashier = async (name: string) => {
    const saved = await addCashier(name);
    setCashiers((current) => (current.includes(saved) ? current : [...current, saved].sort()));
  };

  const handleCreatePO = async (po: PurchaseOrder) => {
    const saved = await createPurchaseOrder(po);
    setPOs((current) => [saved, ...current]);
  };

  const receivePO = async (po: PurchaseOrder) => {
    await receivePurchaseOrder(po.id);
    await loadStore();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f2f2f7] grid place-items-center p-6">
        <div className="rounded-3xl bg-white border border-black/5 shadow-sm px-6 py-5 text-center">
          <p className="tracking-tight">Loading supermarket data...</p>
          <p className="text-muted-foreground mt-1">Connecting to Supabase</p>
        </div>
        <Toaster position="top-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f2f7] flex">
      <Sidebar view={view} setView={setView} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden border-b border-black/5 bg-white/80 backdrop-blur-xl p-3 flex gap-2 overflow-x-auto sticky top-0 z-20">
          {navItems.map((n) => (
            <Button key={n.key} size="sm" variant={view === n.key ? "default" : "outline"} onClick={() => setView(n.key)} className="rounded-full">
              <n.icon className="size-4 mr-1" />{n.label}
            </Button>
          ))}
        </header>

        <main className="flex-1 p-4 md:p-8">
          {loadError && (
            <div className="mb-4 rounded-2xl border border-[#ff3b30]/20 bg-[#ff3b30]/10 px-4 py-3 text-[#9f1d17]">
              {loadError}
            </div>
          )}
          {!hasSupabaseConfig && (
            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
              Supabase env vars are missing, so the app is using local seed data.
            </div>
          )}
          {view === "dashboard" && <Dashboard products={products} sales={sales} />}
          {view === "pos" && <POS products={products} cashiers={cashiers} onAddCashier={handleAddCashier} onCheckout={handleCheckout} />}
          {view === "inventory" && <Inventory products={products} onSaveProduct={handleSaveProduct} onUploadImage={uploadProductImage} />}
          {view === "po" && <PurchaseOrders products={products} pos={pos} onCreatePO={handleCreatePO} receivePO={receivePO} />}
          {view === "history" && <History sales={sales} />}
          {view === "reports" && <Reports sales={sales} products={products} />}
        </main>
      </div>

      {syncing && (
        <div className="fixed bottom-4 right-4 rounded-full bg-white border border-black/5 shadow-sm px-4 py-2 text-muted-foreground">
          Syncing...
        </div>
      )}
      <Toaster position="top-right" />
    </div>
  );
}
