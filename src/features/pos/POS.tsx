import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";
import { Label } from "@/shared/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { cn } from "@/shared/ui/utils";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { peso, Product, Sale, SaleItem } from "@/domain/store";
import { getStoreErrorMessage } from "@/services/store";
import { Plus, Minus, Trash2, Search, Receipt, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";

export function POS({
  products,
  cashierName,
  cashierImage,
  cart,
  setCart,
  tendered,
  setTendered,
  onCheckout,
}: {
  products: Product[];
  cashierName: string;
  cashierImage?: string;
  cart: SaleItem[];
  setCart: Dispatch<SetStateAction<SaleItem[]>>;
  tendered: string;
  setTendered: Dispatch<SetStateAction<string>>;
  onCheckout: (sale: Sale) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [processing, setProcessing] = useState(false);
  const [mobileOrderOpen, setMobileOrderOpen] = useState(false);

  useEffect(() => {
    const desktopMedia = window.matchMedia("(min-width: 1024px)");
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOrderOpen(false);
    };

    desktopMedia.addEventListener("change", onDesktop);
    if (desktopMedia.matches) setMobileOrderOpen(false);

    return () => {
      desktopMedia.removeEventListener("change", onDesktop);
    };
  }, []);

  useEffect(() => {
    if (!mobileOrderOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOrderOpen]);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const addToCart = (p: Product) => {
    if (p.stock <= 0) {
      toast.error("Out of stock");
      return;
    }

    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.qty + 1 > p.stock) {
          toast.error("Not enough stock");
          return c;
        }
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
        const prod = products.find((p) => p.id === id);
        if (!prod) return [i];
        if (next > prod.stock) {
          toast.error("Not enough stock");
          return [i];
        }
        return [{ ...i, qty: next }];
      })
    );
  };

  const remove = (id: string) => setCart((c) => c.filter((i) => i.productId !== id));

  const clearCart = () => {
    if (cart.length === 0) return;

    const confirmed = window.confirm("Remove all items from the current order?");
    if (!confirmed) return;

    setCart([]);
    setTendered("");
    toast.success("Current order cleared");
  };

  const total = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const itemCount = cart.reduce((a, i) => a + i.qty, 0);
  const change = Math.max(0, parseFloat(tendered || "0") - total);

  const checkout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (!cashierName) {
      toast.error("No logged in cashier");
      return;
    }
    if (parseFloat(tendered || "0") < total) {
      toast.error("Insufficient payment");
      return;
    }

    const sale: Sale = { id: `s-${Date.now()}`, date: new Date().toISOString(), cashier: cashierName, items: cart, total };
    setProcessing(true);

    try {
      await onCheckout(sale);
      toast.success(`Sale completed. Change: ${peso(change)}`);
      setCart([]);
      setTendered("");
      setMobileOrderOpen(false);
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setProcessing(false);
    }
  };

  const productsInitials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((word) => word[0])
      .join("");

  const cashierInitials = cashierName
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-5">
        <h2 className="tracking-tight">Point of Sale</h2>
      </div>

      <Card className="hidden lg:flex lg:col-start-4 lg:col-span-2 lg:row-start-2 lg:row-span-2 lg:self-start lg:-mt-5 h-fit sticky top-2 z-20 lg:top-24 rounded-3xl border-black/5 shadow-sm lg:h-[calc(100dvh-6rem)] lg:flex-col">
        <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 tracking-tight">
            <Receipt className="size-5 text-[#007AFF]" /> Current Order
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-full border-[#ff3b30]/25 text-[#ff3b30] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
            onClick={clearCart}
            disabled={cart.length === 0 || processing}
          >
            <Trash2 className="size-4 mr-1" />
            Clear All
          </Button>
        </CardHeader>
        <CardContent className="space-y-4 lg:flex-1 lg:min-h-0 lg:flex lg:flex-col">
          <div>
            <Label className="text-muted-foreground">Cashier</Label>
            <div className="mt-1.5 h-11 rounded-xl bg-[#f2f2f7] px-3.5 flex items-center gap-2.5">
              <Avatar className="size-7 border border-black/10">
                <AvatarImage src={cashierImage || ""} alt={cashierName} className="object-cover" />
                <AvatarFallback className="text-[10px]">{cashierInitials || "U"}</AvatarFallback>
              </Avatar>
              <span className="tracking-tight">{cashierName}</span>
            </div>
          </div>

          <div className="space-y-2 overflow-y-auto lg:max-h-none lg:flex-1">
            {cart.length === 0 && <p className="text-muted-foreground text-center py-8">No items yet</p>}
            {cart.map((i) => {
              const product = products.find((p) => p.id === i.productId);
              return (
                <div key={i.productId} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-[#f2f2f7]">
                  <div className="size-11 rounded-xl overflow-hidden bg-[#f2f2f7] shrink-0">
                    {product?.image ? (
                      <ImageWithFallback src={product.image} alt={i.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-muted-foreground">{productsInitials(i.name)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate tracking-tight">{i.name}</p>
                    <p className="text-muted-foreground">{peso(i.price)}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="rounded-full size-8 bg-[#f2f2f7]" onClick={() => updateQty(i.productId, -1)}>
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-5 text-center">{i.qty}</span>
                  <Button size="icon" variant="ghost" className="rounded-full size-8 bg-[#f2f2f7]" onClick={() => updateQty(i.productId, 1)}>
                    <Plus className="size-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full size-8 text-[#ff3b30]" onClick={() => remove(i.productId)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>

          <Separator />

          <div className="space-y-1.5">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{peso(total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT (incl.)</span>
              <span>{peso(total * 0.12)}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>Total</span>
              <span className="tracking-tight">{peso(total)}</span>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground">Cash Tendered</Label>
            <Input
              type="number"
              value={tendered}
              onChange={(e) => setTendered(e.target.value)}
              placeholder="0.00"
              className="mt-1.5 h-11 rounded-xl bg-[#f2f2f7] border-0"
            />
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Change</span>
            <span>{peso(change)}</span>
          </div>
          <Button className="w-full h-12 rounded-2xl bg-[#007AFF] hover:bg-[#0051D5]" onClick={checkout} disabled={processing}>
            {processing ? "Processing..." : "Continue"}
          </Button>
        </CardContent>
      </Card>

      <div className="lg:hidden fixed left-1/2 -translate-x-1/2 z-20 w-[calc(100%-1.75rem)] max-w-md bottom-[calc(env(safe-area-inset-bottom)+5rem)]">
        <Button
          type="button"
          onClick={() => setMobileOrderOpen(true)}
          className="h-12 w-full rounded-full bg-white border border-black/10 shadow-[0_10px_30px_rgba(0,0,0,0.14)] hover:bg-white text-[#1a1a1a] px-4 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <Receipt className="size-4 text-[#007AFF]" />
            <span className="tracking-tight">Cart</span>
          </span>
          <span className="text-muted-foreground text-xs">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
          <span className="tracking-tight">{peso(total)}</span>
          <ChevronUp className="size-4 text-muted-foreground" />
        </Button>
      </div>

      {mobileOrderOpen && (
        <>
          <button
            type="button"
            aria-label="Close current order panel"
            onClick={() => setMobileOrderOpen(false)}
            className="lg:hidden fixed inset-0 z-[19] bg-black/30 backdrop-blur-[1px]"
          />
          <div className="lg:hidden fixed inset-x-0 top-0 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-20 px-3 py-3">
            <Card className="relative z-10 h-full rounded-3xl border-black/10 shadow-[0_16px_40px_rgba(0,0,0,0.25)] flex flex-col">
            <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="flex items-center gap-2 tracking-tight">
                <Receipt className="size-5 text-[#007AFF]" /> Current Order
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-full border-[#ff3b30]/25 text-[#ff3b30] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30]"
                  onClick={clearCart}
                  disabled={cart.length === 0 || processing}
                >
                  <Trash2 className="size-4 mr-1" />
                  Clear All
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label="Close current order"
                  onClick={() => setMobileOrderOpen(false)}
                  className="size-9 rounded-full bg-[#f2f2f7]"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-1 min-h-0 flex flex-col">
              <div>
                <Label className="text-muted-foreground">Cashier</Label>
                <div className="mt-1.5 h-11 rounded-xl bg-[#f2f2f7] px-3.5 flex items-center gap-2.5">
                  <Avatar className="size-7 border border-black/10">
                    <AvatarImage src={cashierImage || ""} alt={cashierName} className="object-cover" />
                    <AvatarFallback className="text-[10px]">{cashierInitials || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="tracking-tight">{cashierName}</span>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1">
                {cart.length === 0 && <p className="text-muted-foreground text-center py-8">No items yet</p>}
                {cart.map((i) => {
                  const product = products.find((p) => p.id === i.productId);
                  return (
                    <div key={i.productId} className="flex items-center gap-3 p-2 rounded-2xl hover:bg-[#f2f2f7]">
                      <div className="size-11 rounded-xl overflow-hidden bg-[#f2f2f7] shrink-0">
                        {product?.image ? (
                          <ImageWithFallback src={product.image} alt={i.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-muted-foreground">{productsInitials(i.name)}</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate tracking-tight">{i.name}</p>
                        <p className="text-muted-foreground">{peso(i.price)}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="rounded-full size-8 bg-[#f2f2f7]" onClick={() => updateQty(i.productId, -1)}>
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-5 text-center">{i.qty}</span>
                      <Button size="icon" variant="ghost" className="rounded-full size-8 bg-[#f2f2f7]" onClick={() => updateQty(i.productId, 1)}>
                        <Plus className="size-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="rounded-full size-8 text-[#ff3b30]" onClick={() => remove(i.productId)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>

              <Separator />

              <div className="space-y-1.5">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{peso(total)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (incl.)</span>
                  <span>{peso(total * 0.12)}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span>Total</span>
                  <span className="tracking-tight">{peso(total)}</span>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Cash Tendered</Label>
                <Input
                  type="number"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder="0.00"
                  className="mt-1.5 h-11 rounded-xl bg-[#f2f2f7] border-0"
                />
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Change</span>
                <span>{peso(change)}</span>
              </div>
              <Button className="w-full h-12 rounded-2xl bg-[#007AFF] hover:bg-[#0051D5]" onClick={checkout} disabled={processing}>
                {processing ? "Processing..." : "Continue"}
              </Button>
            </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="lg:col-start-1 lg:col-span-3 lg:row-start-2 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-11 h-12 rounded-full bg-white border-black/5"
        />
      </div>

      <div className="lg:col-start-1 lg:col-span-3 lg:row-start-3 grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                <span
                  className={cn(
                    "size-7 rounded-full grid place-items-center transition",
                    p.stock <= 0 ? "bg-[#d1d1d6] text-[#8e8e93]" : "bg-[#08f] text-white group-hover:scale-110"
                  )}
                >
                  <Plus className="size-4" strokeWidth={2.5} />
                </span>
              </div>
              {p.stock <= p.reorderLevel && (
                <Badge variant="secondary" className="mt-2 rounded-full bg-orange-50 text-orange-600">
                  {p.stock} left
                </Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
