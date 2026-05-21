import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Badge } from "@/shared/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Label } from "@/shared/ui/label";
import { Product, PurchaseOrder } from "@/domain/store";
import { getStoreErrorMessage } from "@/services/store";
import { Plus, Check, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const UNDO_WINDOW_MS = 3000;

type UndoWindow = {
  expiresAt: number;
  qty: number;
};

function getRemainingQty(po: PurchaseOrder) {
  return Math.max(0, po.qty - po.receivedQty);
}

function getReceivedPercent(po: PurchaseOrder) {
  if (po.qty <= 0) return 0;
  return Math.min(100, Math.round((po.receivedQty / po.qty) * 100));
}

function statusBadge(po: PurchaseOrder) {
  if (po.status === "Received") {
    return <Badge className="border-transparent bg-emerald-50 text-emerald-700">Received</Badge>;
  }

  if (po.status === "Partially Received") {
    return <Badge className="border-transparent bg-amber-50 text-amber-700">Partial</Badge>;
  }

  return <Badge>Pending</Badge>;
}

export function PurchaseOrders({
  products,
  purchaseOrders,
  onCreatePO,
  onDeletePO,
  receivePO,
  undoReceivePO,
  canCreatePO = true,
  canDeletePO = true,
  canReceivePO = true,
  canUndoReceivePO = true,
}: {
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  onCreatePO: (po: PurchaseOrder) => Promise<void>;
  onDeletePO: (po: PurchaseOrder) => Promise<void>;
  receivePO: (po: PurchaseOrder, receivedQty: number) => Promise<void>;
  undoReceivePO: (po: PurchaseOrder, receivedQty: number) => Promise<void>;
  canCreatePO?: boolean;
  canDeletePO?: boolean;
  canReceivePO?: boolean;
  canUndoReceivePO?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ supplier: "", productId: products[0]?.id || "", qty: 0 });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [undoWindows, setUndoWindows] = useState<Record<string, UndoWindow>>({});
  const [now, setNow] = useState(Date.now());
  const [receivingPO, setReceivingPO] = useState<PurchaseOrder | null>(null);
  const [receiptQty, setReceiptQty] = useState(0);

  const lowStock = products.filter((p) => p.stock <= p.reorderLevel);

  useEffect(() => {
    const hasActiveUndo = Object.values(undoWindows).some(({ expiresAt }) => expiresAt > Date.now());
    if (!hasActiveUndo) return;

    const intervalId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setUndoWindows((current) =>
        Object.fromEntries(Object.entries(current).filter(([, window]) => window.expiresAt > currentTime))
      );
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [undoWindows]);

  const create = async () => {
    if (!canCreatePO) {
      toast.error("Only administrators can create purchase orders.");
      return;
    }

    const product = products.find((p) => p.id === form.productId);
    if (!product || !form.supplier.trim() || form.qty <= 0) {
      toast.error("Fill all fields");
      return;
    }

    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      date: new Date().toISOString(),
      supplier: form.supplier.trim(),
      productId: product.id,
      productName: product.name,
      qty: form.qty,
      receivedQty: 0,
      status: "Pending",
    };
    setCreating(true);
    try {
      await onCreatePO(po);
      toast.success("Purchase order created");
      setOpen(false);
      setForm({ supplier: "", productId: products[0]?.id || "", qty: 0 });
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setCreating(false);
    }
  };

  const openReceiveDialog = (po: PurchaseOrder) => {
    if (!canReceivePO) {
      toast.error("You do not have access to receive purchase orders.");
      return;
    }

    const remainingQty = getRemainingQty(po);
    setReceivingPO(po);
    setReceiptQty(remainingQty);
  };

  const receive = async () => {
    if (!receivingPO) return;
    if (!canReceivePO) {
      toast.error("You do not have access to receive purchase orders.");
      return;
    }

    const remainingQty = getRemainingQty(receivingPO);
    const qtyToReceive = Math.floor(Number(receiptQty));

    if (!Number.isFinite(qtyToReceive) || qtyToReceive <= 0) {
      toast.error("Enter a received quantity");
      return;
    }

    if (qtyToReceive > remainingQty) {
      toast.error(`Only ${remainingQty} units remain on this order`);
      return;
    }

    setReceivingId(receivingPO.id);
    try {
      await receivePO(receivingPO, qtyToReceive);
      const receivedAt = Date.now();
      setNow(receivedAt);
      setUndoWindows((current) => ({
        ...current,
        [receivingPO.id]: { expiresAt: receivedAt + UNDO_WINDOW_MS, qty: qtyToReceive },
      }));
      toast.success(`Received ${qtyToReceive} of ${receivingPO.qty} ${receivingPO.productName}`);
      setReceivingPO(null);
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setReceivingId(null);
    }
  };

  const deletePO = async (po: PurchaseOrder) => {
    if (!canDeletePO) {
      toast.error("Only administrators can delete purchase orders.");
      return;
    }

    const inventoryNote =
      po.receivedQty > 0 ? ` The ${po.receivedQty} received units will be removed from inventory.` : "";
    const confirmed = window.confirm(`Delete purchase order #${po.id.toUpperCase()} for ${po.productName}?${inventoryNote}`);
    if (!confirmed) return;

    setDeletingId(po.id);
    try {
      await onDeletePO(po);
      setUndoWindows((current) => {
        const next = { ...current };
        delete next[po.id];
        return next;
      });
      toast.success("Purchase order deleted");
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const undoReceive = async (po: PurchaseOrder, qty: number) => {
    if (!canUndoReceivePO) {
      toast.error("Only administrators can undo received purchase orders.");
      return;
    }

    setUndoingId(po.id);
    try {
      await undoReceivePO(po, qty);
      setUndoWindows((current) => {
        const next = { ...current };
        delete next[po.id];
        return next;
      });
      toast.success(`Receipt undone for ${qty} ${po.productName}`);
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setUndoingId(null);
    }
  };

  const renderActions = (po: PurchaseOrder) => {
    const remainingQty = getRemainingQty(po);
    const undoWindow = undoWindows[po.id];
    const canUndo = Boolean(undoWindow && undoWindow.expiresAt > now);
    const remainingSeconds = Math.max(0, ((undoWindow?.expiresAt || 0) - now) / 1000);
    const busy = deletingId === po.id || receivingId === po.id || undoingId === po.id;

    return (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canReceivePO && remainingQty > 0 && (
          <Button size="sm" variant="outline" onClick={() => openReceiveDialog(po)} disabled={busy}>
            <Check className="size-4 mr-1" /> {po.receivedQty > 0 ? "Receive more" : "Receive"}
          </Button>
        )}
        {canUndoReceivePO && canUndo && undoWindow && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => undoReceive(po, undoWindow.qty)}
            disabled={busy}
            className="gap-1.5"
          >
            <RotateCcw className="size-4" />
            Undo
            <span className="ml-1 text-[10px] tabular-nums text-muted-foreground">{remainingSeconds.toFixed(1)}s</span>
          </Button>
        )}
        {canDeletePO && (
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Delete purchase order #${po.id.toUpperCase()}`}
            title={`Delete purchase order #${po.id.toUpperCase()}`}
            className="size-8 rounded-full text-[#ff3b30] hover:bg-[#ff3b30]/10"
            onClick={() => deletePO(po)}
            disabled={busy}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    );
  };

  const receivingRemainingQty = receivingPO ? getRemainingQty(receivingPO) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Purchase Orders</h2>
        </div>
        {canCreatePO && (
          <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-1" /> New PO</Button>
        )}
      </div>

      {lowStock.length > 0 && (
        <Card className="rounded-2xl border-black/5 shadow-sm">
          <CardContent className="p-4">
            <p className="mb-2">Reorder suggestions</p>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <Badge key={p.id} variant="secondary">{p.name} - {p.stock} left</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="hidden rounded-2xl border-black/5 shadow-sm md:block">
        <CardContent className="p-0">
          <Table className="[&_th]:py-3 [&_td]:py-3 [&_th:first-child]:pl-6 [&_td:first-child]:pl-6 [&_th:last-child]:pr-6 [&_td:last-child]:pr-6">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Received</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No purchase orders yet.
                  </TableCell>
                </TableRow>
              )}
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                  <TableCell>{po.supplier}</TableCell>
                  <TableCell>{po.productName}</TableCell>
                  <TableCell className="text-right">
                    <div className="space-y-1">
                      <p>{po.receivedQty} / {po.qty}</p>
                      <p className="text-xs text-muted-foreground">{getRemainingQty(po)} remaining</p>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(po)}</TableCell>
                  <TableCell className="text-right">{renderActions(po)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {purchaseOrders.length === 0 && (
          <Card className="rounded-2xl border-black/5 shadow-sm">
            <CardContent className="p-5 text-center text-muted-foreground">No purchase orders yet.</CardContent>
          </Card>
        )}
        {purchaseOrders.map((po) => (
          <Card key={po.id} className="rounded-2xl border-black/5 shadow-sm">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate">{po.productName}</p>
                  <p className="truncate text-sm text-muted-foreground">{po.supplier}</p>
                </div>
                {statusBadge(po)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{po.receivedQty} / {po.qty} received</span>
                  <span className="text-muted-foreground">{getRemainingQty(po)} left</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f2f2f7]">
                  <div className="h-full rounded-full bg-[#007AFF]" style={{ width: `${getReceivedPercent(po)}%` }} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{new Date(po.date).toLocaleDateString()}</p>
                {renderActions(po)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Purchase Order</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Supplier</Label>
              <Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} placeholder="e.g. MegaFoods Distributors" />
            </div>
            <div>
              <Label>Product</Label>
              <Select value={form.productId} onValueChange={(v) => setForm({ ...form, productId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity</Label>
              <Input type="number" min={1} value={form.qty || ""} onChange={(e) => setForm({ ...form, qty: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={creating}>{creating ? "Creating..." : "Create PO"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(receivingPO)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setReceivingPO(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receive Delivery</DialogTitle>
            {receivingPO && (
              <DialogDescription>
                {receivingPO.productName} from {receivingPO.supplier}
              </DialogDescription>
            )}
          </DialogHeader>
          {receivingPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#f2f2f7] p-3 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Ordered</p>
                  <p>{receivingPO.qty}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Received</p>
                  <p>{receivingPO.receivedQty}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p>{receivingRemainingQty}</p>
                </div>
              </div>
              <div>
                <Label>Delivered quantity</Label>
                <Input
                  type="number"
                  min={1}
                  max={receivingRemainingQty}
                  value={receiptQty || ""}
                  onChange={(event) => setReceiptQty(parseInt(event.target.value) || 0)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceivingPO(null)}>Cancel</Button>
            <Button onClick={receive} disabled={!receivingPO || receivingId === receivingPO.id}>
              {receivingId === receivingPO?.id ? "Receiving..." : "Receive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
