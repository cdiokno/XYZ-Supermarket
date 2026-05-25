import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Label } from "@/shared/ui/label";
import {
  getSaleNetQty,
  getSaleNetTotal,
  peso,
  Product,
  ReceiptReturn,
  ReceiptReturnRequest,
  ReceiptReturnType,
  receiptReturnTypeLabels,
  Sale,
} from "@/domain/store";
import { getStoreErrorMessage } from "@/services/store";
import { BadgeDollarSign, RefreshCcw, Receipt, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

const RETURN_TYPE_OPTIONS: ReceiptReturnType[] = ["cash_refund", "replacement", "store_credit"];

function readQty(value: string) {
  const qty = Math.floor(Number(value));
  return Number.isFinite(qty) && qty > 0 ? qty : 0;
}

function getReturnOutcome(receiptReturn: ReceiptReturn) {
  if (receiptReturn.additionalDue > 0) return `Additional due ${peso(receiptReturn.additionalDue)}`;
  if (receiptReturn.refundAmount > 0) return `Refund ${peso(receiptReturn.refundAmount)}`;
  if (receiptReturn.storeCreditAmount > 0) return `Store credit ${peso(receiptReturn.storeCreditAmount)}`;
  return "Even exchange";
}

export function History({
  products,
  sales,
  receiptReturns,
  cashierName,
  onDeleteSale,
  onProcessReceiptReturn,
}: {
  products: Product[];
  sales: Sale[];
  receiptReturns: ReceiptReturn[];
  cashierName: string;
  onDeleteSale: (sale: Sale) => Promise<void>;
  onProcessReceiptReturn: (request: ReceiptReturnRequest) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnType, setReturnType] = useState<ReceiptReturnType>("cash_refund");
  const [returnQtyByProduct, setReturnQtyByProduct] = useState<Record<string, string>>({});
  const [replacementQtyByProduct, setReplacementQtyByProduct] = useState<Record<string, string>>({});
  const [replacementQuery, setReplacementQuery] = useState("");
  const [processingReturn, setProcessingReturn] = useState(false);

  const returnsBySale = useMemo(() => {
    const map = new Map<string, ReceiptReturn[]>();
    for (const receiptReturn of receiptReturns) {
      const entries = map.get(receiptReturn.saleId) || [];
      entries.push(receiptReturn);
      map.set(receiptReturn.saleId, entries);
    }
    return map;
  }, [receiptReturns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...sales].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (!q) return sorted;
    return sorted.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.cashier.toLowerCase().includes(q) ||
        s.items.some((i) => i.name.toLowerCase().includes(q)) ||
        (returnsBySale.get(s.id) || []).some((receiptReturn) => receiptReturnTypeLabels[receiptReturn.type].toLowerCase().includes(q))
    );
  }, [returnsBySale, sales, query]);

  const totalRevenue = filtered.reduce((sum, sale) => sum + getSaleNetTotal(sale, returnsBySale.get(sale.id) || []), 0);
  const totalItems = filtered.reduce((sum, sale) => sum + getSaleNetQty(sale, returnsBySale.get(sale.id) || []), 0);
  const selectedReturns = selected ? returnsBySale.get(selected.id) || [] : [];

  const returnedQtyByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const receiptReturn of selectedReturns) {
      for (const item of receiptReturn.returnedItems) {
        map.set(item.productId, (map.get(item.productId) || 0) + item.qty);
      }
    }
    return map;
  }, [selectedReturns]);

  const returnableItems = useMemo(
    () =>
      selected
        ? selected.items.map((item) => ({
            item,
            returnedQty: returnedQtyByProduct.get(item.productId) || 0,
            returnableQty: Math.max(0, item.qty - (returnedQtyByProduct.get(item.productId) || 0)),
          }))
        : [],
    [returnedQtyByProduct, selected]
  );

  const selectedReturnedItems = returnableItems.flatMap(({ item, returnableQty }) => {
    const qty = Math.min(readQty(returnQtyByProduct[item.productId] || ""), returnableQty);
    return qty > 0 ? [{ ...item, qty }] : [];
  });

  const selectedReplacementItems =
    returnType === "replacement"
      ? products.flatMap((product) => {
          const qty = Math.min(readQty(replacementQtyByProduct[product.id] || ""), product.stock);
          return qty > 0 ? [{ productId: product.id, name: product.name, price: product.price, qty }] : [];
        })
      : [];

  const returnedValue = selectedReturnedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const replacementValue = selectedReplacementItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const refundPreview =
    returnType === "cash_refund" ? returnedValue : returnType === "replacement" ? Math.max(0, returnedValue - replacementValue) : 0;
  const additionalDuePreview = returnType === "replacement" ? Math.max(0, replacementValue - returnedValue) : 0;
  const storeCreditPreview = returnType === "store_credit" ? returnedValue : 0;

  const replacementProducts = useMemo(() => {
    const q = replacementQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) => product.name.toLowerCase().includes(q) || product.sku.toLowerCase().includes(q));
  }, [products, replacementQuery]);

  useEffect(() => {
    setShowReturnForm(false);
    setReturnType("cash_refund");
    setReturnQtyByProduct({});
    setReplacementQtyByProduct({});
    setReplacementQuery("");
  }, [selected?.id]);

  const deleteSale = async (sale: Sale) => {
    if ((returnsBySale.get(sale.id) || []).length > 0) {
      toast.error("Receipts with return history cannot be deleted");
      return;
    }

    const confirmed = window.confirm(`Delete receipt #${sale.id.toUpperCase()}? Sold quantities will be returned to inventory.`);
    if (!confirmed) return;

    setDeletingId(sale.id);
    try {
      await onDeleteSale(sale);
      toast.success("Transaction deleted");
      setSelected((current) => (current?.id === sale.id ? null : current));
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const submitReturn = async () => {
    if (!selected || processingReturn) return;

    if (selectedReturnedItems.length === 0) {
      toast.error("Select at least one returned item");
      return;
    }

    if (returnType === "replacement" && selectedReplacementItems.length === 0) {
      toast.error("Select at least one replacement item");
      return;
    }

    setProcessingReturn(true);
    try {
      await onProcessReceiptReturn({
        saleId: selected.id,
        cashier: cashierName,
        type: returnType,
        returnedItems: selectedReturnedItems.map((item) => ({ productId: item.productId, qty: item.qty })),
        replacementItems: selectedReplacementItems.map((item) => ({ productId: item.productId, qty: item.qty })),
      });
      toast.success("Return recorded");
      setShowReturnForm(false);
      setReturnQtyByProduct({});
      setReplacementQtyByProduct({});
      setReplacementQuery("");
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setProcessingReturn(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2>Transaction History</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="rounded-3xl border-black/5 shadow-sm">
          <CardContent className="p-4">
            <p className="text-muted-foreground">Transactions</p>
            <p style={{ fontSize: 24, fontWeight: 600 }}>{filtered.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-black/5 shadow-sm">
          <CardContent className="p-4">
            <p className="text-muted-foreground">Net items</p>
            <p style={{ fontSize: 24, fontWeight: 600 }}>{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-black/5 shadow-sm">
          <CardContent className="p-4">
            <p className="text-muted-foreground">Net revenue</p>
            <p style={{ fontSize: 24, fontWeight: 600 }}>{peso(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by receipt, cashier, product, or return type"
          className="rounded-full pl-10 h-11"
        />
      </div>

      <Card className="rounded-3xl border-black/5 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table className="[&_th]:py-3 [&_td]:py-3 [&_th:first-child]:pl-6 [&_td:first-child]:pl-6 [&_th:last-child]:pr-6 [&_td:last-child]:pr-6">
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Net Qty</TableHead>
                <TableHead className="text-right">Net Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sale) => {
                const saleReturns = returnsBySale.get(sale.id) || [];
                const netQty = getSaleNetQty(sale, saleReturns);
                const netTotal = getSaleNetTotal(sale, saleReturns);
                return (
                  <TableRow key={sale.id} className="cursor-pointer" onClick={() => setSelected(sale)}>
                    <TableCell className="text-muted-foreground">#{sale.id.toUpperCase()}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleString()}</TableCell>
                    <TableCell>{sale.cashier}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {sale.items.map((i) => i.name).join(", ")}
                      {saleReturns.length > 0 && (
                        <Badge variant="secondary" className="ml-2 rounded-full">
                          {saleReturns.length} return{saleReturns.length === 1 ? "" : "s"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{netQty}</TableCell>
                    <TableCell className="text-right">
                      <div>{peso(netTotal)}</div>
                      {saleReturns.length > 0 && <div className="text-xs text-muted-foreground">Original {peso(sale.total)}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Badge variant="secondary" className="rounded-full">
                          <Receipt className="size-3 mr-1" />View
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete receipt #${sale.id.toUpperCase()}`}
                          title={saleReturns.length > 0 ? "Receipts with return history cannot be deleted" : `Delete receipt #${sale.id.toUpperCase()}`}
                          className="size-7 rounded-full text-[#ff3b30] hover:bg-[#ff3b30]/10"
                          onClick={(event) => {
                            event.stopPropagation();
                            void deleteSale(sale);
                          }}
                          disabled={deletingId === sale.id || saleReturns.length > 0}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Receipt #{selected?.id.toUpperCase()}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between gap-2 text-muted-foreground">
                <span>{new Date(selected.date).toLocaleString()}</span>
                <span>Cashier: {selected.cashier}</span>
              </div>

              <div className="rounded-2xl border border-black/5 divide-y divide-black/5">
                {selected.items.map((item) => {
                  const returnedQty = returnedQtyByProduct.get(item.productId) || 0;
                  return (
                    <div key={item.productId} className="flex justify-between gap-4 px-4 py-3">
                      <div>
                        <p>{item.name}</p>
                        <p className="text-muted-foreground">{peso(item.price)} x {item.qty}</p>
                        {returnedQty > 0 && <p className="text-xs text-[#ff3b30]">{returnedQty} returned</p>}
                      </div>
                      <p>{peso(item.price * item.qty)}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 rounded-2xl bg-[#f2f2f7] px-4 py-3">
                <div className="flex justify-between">
                  <span>Original total</span>
                  <span>{peso(selected.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Net total</span>
                  <span>{peso(getSaleNetTotal(selected, selectedReturns))}</span>
                </div>
              </div>

              {selectedReturns.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCcw className="size-4 text-[#007AFF]" />
                    <h3 className="tracking-tight">Return History</h3>
                  </div>
                  {selectedReturns.map((receiptReturn) => (
                    <div key={receiptReturn.id} className="rounded-2xl border border-black/5 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <Badge variant="secondary" className="rounded-full">
                            {receiptReturnTypeLabels[receiptReturn.type]}
                          </Badge>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(receiptReturn.date).toLocaleString()} by {receiptReturn.cashier}
                          </p>
                        </div>
                        <p className="text-sm">{getReturnOutcome(receiptReturn)}</p>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-sm text-muted-foreground">Returned</p>
                          {receiptReturn.returnedItems.map((item) => (
                            <p key={`${receiptReturn.id}-returned-${item.productId}`} className="text-sm">
                              {item.name} x {item.qty}
                            </p>
                          ))}
                        </div>
                        {receiptReturn.replacementItems.length > 0 && (
                          <div>
                            <p className="text-sm text-muted-foreground">Replacement</p>
                            {receiptReturn.replacementItems.map((item) => (
                              <p key={`${receiptReturn.id}-replacement-${item.productId}`} className="text-sm">
                                {item.name} x {item.qty}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showReturnForm && (
                <div className="space-y-4 rounded-2xl border border-black/5 p-4">
                  <div className="flex flex-wrap gap-2">
                    {RETURN_TYPE_OPTIONS.map((type) => {
                      const active = type === returnType;
                      return (
                        <Button
                          key={type}
                          type="button"
                          variant="outline"
                          onClick={() => setReturnType(type)}
                          className={active ? "rounded-full bg-[#007AFF] text-white hover:bg-[#0051D5] hover:text-white" : "rounded-full"}
                        >
                          {receiptReturnTypeLabels[type]}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="space-y-2">
                    <Label>Returned Items</Label>
                    <div className="rounded-2xl border border-black/5 divide-y divide-black/5">
                      {returnableItems.map(({ item, returnedQty, returnableQty }) => (
                        <div key={item.productId} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_7rem] sm:items-center">
                          <div className="min-w-0">
                            <p className="truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {peso(item.price)} each - {returnableQty} available{returnedQty > 0 ? `, ${returnedQty} returned` : ""}
                            </p>
                          </div>
                          <Input
                            type="number"
                            min={0}
                            max={returnableQty}
                            value={returnQtyByProduct[item.productId] || ""}
                            onChange={(event) => {
                              const qty = Math.max(0, Math.min(returnableQty, Math.floor(Number(event.target.value || 0))));
                              setReturnQtyByProduct((current) => ({ ...current, [item.productId]: qty > 0 ? String(qty) : "" }));
                            }}
                            disabled={returnableQty === 0}
                            className="h-10 rounded-xl"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {returnType === "replacement" && (
                    <div className="space-y-2">
                      <Label>Replacement Items</Label>
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={replacementQuery}
                          onChange={(event) => setReplacementQuery(event.target.value)}
                          placeholder="Search replacement products"
                          className="h-10 rounded-full pl-9"
                        />
                      </div>
                      <div className="max-h-64 overflow-y-auto rounded-2xl border border-black/5 divide-y divide-black/5">
                        {replacementProducts.map((product) => (
                          <div key={product.id} className="grid gap-3 px-4 py-3 sm:grid-cols-[1fr_7rem] sm:items-center">
                            <div className="min-w-0">
                              <p className="truncate">{product.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {peso(product.price)} each - {product.stock} in stock
                              </p>
                            </div>
                            <Input
                              type="number"
                              min={0}
                              max={product.stock}
                              value={replacementQtyByProduct[product.id] || ""}
                              onChange={(event) => {
                                const qty = Math.max(0, Math.min(product.stock, Math.floor(Number(event.target.value || 0))));
                                setReplacementQtyByProduct((current) => ({ ...current, [product.id]: qty > 0 ? String(qty) : "" }));
                              }}
                              disabled={product.stock === 0}
                              className="h-10 rounded-xl"
                            />
                          </div>
                        ))}
                        {replacementProducts.length === 0 && (
                          <div className="px-4 py-8 text-center text-muted-foreground">No replacement products found.</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2 rounded-2xl bg-[#f2f2f7] px-4 py-3 sm:grid-cols-2">
                    <div className="flex justify-between gap-3">
                      <span className="text-muted-foreground">Returned value</span>
                      <span>{peso(returnedValue)}</span>
                    </div>
                    {returnType === "replacement" && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Replacement value</span>
                        <span>{peso(replacementValue)}</span>
                      </div>
                    )}
                    {refundPreview > 0 && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Refund</span>
                        <span>{peso(refundPreview)}</span>
                      </div>
                    )}
                    {additionalDuePreview > 0 && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Additional due</span>
                        <span>{peso(additionalDuePreview)}</span>
                      </div>
                    )}
                    {storeCreditPreview > 0 && (
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Store credit</span>
                        <span>{peso(storeCreditPreview)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {selected && (
            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                className="rounded-full border-[#ff3b30]/25 text-[#ff3b30] hover:bg-[#ff3b30]/10"
                onClick={() => deleteSale(selected)}
                disabled={deletingId === selected.id || selectedReturns.length > 0}
                title={selectedReturns.length > 0 ? "Receipts with return history cannot be deleted" : undefined}
              >
                <Trash2 className="size-4 mr-1" />
                {deletingId === selected.id ? "Deleting..." : "Delete Transaction"}
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                {showReturnForm ? (
                  <>
                    <Button variant="outline" className="rounded-full" onClick={() => setShowReturnForm(false)} disabled={processingReturn}>
                      Cancel Return
                    </Button>
                    <Button className="rounded-full bg-[#007AFF] hover:bg-[#0051D5]" onClick={submitReturn} disabled={processingReturn}>
                      <BadgeDollarSign className="size-4 mr-1" />
                      {processingReturn ? "Recording..." : "Record Return"}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="rounded-full bg-[#007AFF] hover:bg-[#0051D5]"
                    onClick={() => setShowReturnForm(true)}
                    disabled={returnableItems.every((entry) => entry.returnableQty === 0)}
                  >
                    <RefreshCcw className="size-4 mr-1" />
                    Process Return
                  </Button>
                )}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
