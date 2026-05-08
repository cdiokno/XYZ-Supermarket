import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { peso, Product, Sale, SaleItem } from "@/domain/store";
import { getStoreErrorMessage } from "@/services/store";
import { Plus, Minus, Trash2, Search, Receipt, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function POS({
  products,
  cashiers,
  onAddCashier,
  onCheckout,
}: {
  products: Product[];
  cashiers: string[];
  onAddCashier: (name: string) => Promise<void>;
  onCheckout: (sale: Sale) => Promise<void>;
}) {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [query, setQuery] = useState("");
  const [cashier, setCashier] = useState(cashiers[0]);
  const [tendered, setTendered] = useState("");
  const [addingCashier, setAddingCashier] = useState(false);
  const [newCashier, setNewCashier] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!cashier && cashiers.length > 0) setCashier(cashiers[0]);
  }, [cashier, cashiers]);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const addToCart = (p: Product) => {
    if (p.stock <= 0) { toast.error("Out of stock"); return; }
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.qty + 1 > p.stock) { toast.error("Not enough stock"); return c; }
        return c.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...c, { productId: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((c) =>
      c.flatMap((i) => {
        if (i.productId !== id) return [i];
        const next = i.qty + delta;
        if (next <= 0) return [];
        const prod = products.find((p) => p.id === id)!;
        if (next > prod.stock) { toast.error("Not enough stock"); return [i]; }
        return [{ ...i, qty: next }];
      })
    );
  };

  const remove = (id: string) => setCart((c) => c.filter((i) => i.productId !== id));

  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const change = Math.max(0, parseFloat(tendered || "0") - total);

  const checkout = async () => {
    if (cart.length === 0) { toast.error("Cart is empty"); return; }
    if (!cashier) { toast.error("Select a cashier"); return; }
    if (parseFloat(tendered || "0") < total) { toast.error("Insufficient payment"); return; }
    const sale: Sale = { id: `s-${Date.now()}`, date: new Date().toISOString(), cashier, items: cart, total };
    setProcessing(true);
    try {
      await onCheckout(sale);
      toast.success(`Sale completed. Change: ${peso(change)}`);
      setCart([]);
      setTendered("");
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const addCashier = async () => {
    const name = newCashier.trim();
    if (!name) return;
    if (cashiers.includes(name)) { toast.error("Cashier already exists"); return; }
    setProcessing(true);
    try {
      await onAddCashier(name);
      setCashier(name);
      setNewCashier("");
      setAddingCashier(false);
      toast.success(`Cashier ${name} added`);
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const products_initials = (name: string) => name.split(" ").slice(0, 2).map((w) => w[0]).join("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-5">
        <div>
          <h2 className="tracking-tight">Point of Sale</h2>
          <p className="text-muted-foreground">Tap a product to add to the order.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-11 h-12 rounded-full bg-white border-black/5" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              disabled={p.stock <= 0}
              className="group text-left bg-white rounded-3xl p-3 border border-black/5 hover:-translate-y-0.5 transition disabled:opacity-50 disabled:hover:translate-y-0 flex flex-col"
            >
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#f2f2f7]">
                <ImageWithFallback src={p.image || ""} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="px-1 pt-3 pb-1">
                <p className="line-clamp-1 tracking-tight">{p.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[#08f]">{peso(p.price)}</span>
                  <span className="size-7 rounded-full bg-[#08f] text-white grid place-items-center group-hover:scale-110 transition">
                    <Plus className="size-4" strokeWidth={2.5} />
                  </span>
                </div>
                {p.stock <= p.reorderLevel && (
                  <Badge variant="secondary" className="mt-2 rounded-full bg-orange-50 text-orange-600">{p.stock} left</Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Card className="lg:col-span-2 h-fit lg:sticky lg:top-4 rounded-3xl border-black/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 tracking-tight"><Receipt className="size-5 text-[#007AFF]" /> Current Order</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Cashier</Label>
            <div className="flex gap-2 mt-1.5">
              <Select value={cashier} onValueChange={setCashier}>
                <SelectTrigger className="rounded-xl bg-[#f2f2f7] border-0 h-full !h-11 min-h-11 flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {cashiers.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" className="rounded-full h-11 w-11 shrink-0 aspect-square" onClick={() => setAddingCashier(true)}>
                <UserPlus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {cart.length === 0 && <p className="text-muted-foreground text-center py-8">No items yet</p>}
            {cart.map((i) => {
              const product = products.find((p) => p.id === i.productId);
              return (
                <div key={i.productId} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-[#f2f2f7]">
                  <div className="size-11 rounded-xl overflow-hidden bg-[#f2f2f7] shrink-0">
                    {product?.image ? (
                      <ImageWithFallback src={product.image} alt={i.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground">{products_initials(i.name)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate tracking-tight">{i.name}</p>
                    <p className="text-muted-foreground">{peso(i.price)}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="rounded-full size-8 bg-[#f2f2f7]" onClick={() => updateQty(i.productId, -1)}><Minus className="size-3.5" /></Button>
                  <span className="w-5 text-center">{i.qty}</span>
                  <Button size="icon" variant="ghost" className="rounded-full size-8 bg-[#f2f2f7]" onClick={() => updateQty(i.productId, 1)}><Plus className="size-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="rounded-full size-8 text-[#ff3b30]" onClick={() => remove(i.productId)}><Trash2 className="size-3.5" /></Button>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-1.5">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{peso(total)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>VAT (incl.)</span><span>{peso(total * 0.12)}</span></div>
            <div className="flex justify-between pt-1"><span>Total</span><span className="tracking-tight">{peso(total)}</span></div>
          </div>

          <div>
            <Label className="text-muted-foreground">Cash Tendered</Label>
            <Input type="number" value={tendered} onChange={(e) => setTendered(e.target.value)} placeholder="0.00" className="mt-1.5 h-11 rounded-xl bg-[#f2f2f7] border-0" />
          </div>
          <div className="flex justify-between text-muted-foreground"><span>Change</span><span>{peso(change)}</span></div>
          <Button className="w-full h-12 rounded-2xl bg-[#007AFF] hover:bg-[#0051D5]" onClick={checkout} disabled={processing}>
            {processing ? "Processing..." : "Continue"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={addingCashier} onOpenChange={setAddingCashier}>
        <DialogContent className="rounded-3xl">
          <DialogHeader><DialogTitle>Add Cashier</DialogTitle></DialogHeader>
          <div>
            <Label>Name</Label>
            <Input value={newCashier} onChange={(e) => setNewCashier(e.target.value)} placeholder="e.g. Carlos M." className="mt-1.5 h-11 rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setAddingCashier(false)}>Cancel</Button>
            <Button className="rounded-xl bg-[#007AFF] hover:bg-[#0051D5]" onClick={addCashier} disabled={processing}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
