import { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Label } from "./ui/label";
import { Product, PurchaseOrder } from "./store-data";
import { getStoreErrorMessage } from "../lib/store-api";
import { Plus, Check, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

const UNDO_WINDOW_MS = 3000;

export function PurchaseOrders({
  products,
  pos,
  onCreatePO,
  onDeletePO,
  receivePO,
  undoReceivePO,
}: {
  products: Product[];
  pos: PurchaseOrder[];
  onCreatePO: (po: PurchaseOrder) => Promise<void>;
  onDeletePO: (po: PurchaseOrder) => Promise<void>;
  receivePO: (po: PurchaseOrder) => Promise<void>;
  undoReceivePO: (po: PurchaseOrder) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ supplier: "", productId: products[0]?.id || "", qty: 0 });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [receivingId, setReceivingId] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [undoWindows, setUndoWindows] = useState<Record<string, number>>({});
  const [now, setNow] = useState(Date.now());

  const lowStock = products.filter((p) => p.stock <= p.reorderLevel);

  useEffect(() => {
    const hasActiveUndo = Object.values(undoWindows).some((expiresAt) => expiresAt > Date.now());
    if (!hasActiveUndo) return;

    const intervalId = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      setUndoWindows((current) =>
        Object.fromEntries(Object.entries(current).filter(([, expiresAt]) => expiresAt > currentTime))
      );
    }, 100);

    return () => window.clearInterval(intervalId);
  }, [undoWindows]);

  const create = async () => {
    const product = products.find((p) => p.id === form.productId);
    if (!product || !form.supplier || form.qty <= 0) { toast.error("Fill all fields"); return; }
    const po: PurchaseOrder = {
      id: `po-${Date.now()}`,
      date: new Date().toISOString(),
      supplier: form.supplier,
      productId: product.id,
      productName: product.name,
      qty: form.qty,
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

  const receive = async (po: PurchaseOrder) => {
    setReceivingId(po.id);
    try {
      await receivePO(po);
      const receivedAt = Date.now();
      setNow(receivedAt);
      setUndoWindows((current) => ({ ...current, [po.id]: receivedAt + UNDO_WINDOW_MS }));
      toast.success(`Received ${po.qty} × ${po.productName}`);
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setReceivingId(null);
    }
  };

  const deletePO = async (po: PurchaseOrder) => {
    const inventoryNote = po.status === "Received" ? " The received quantity will be removed from inventory." : "";
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

  const undoReceive = async (po: PurchaseOrder) => {
    setUndoingId(po.id);
    try {
      await undoReceivePO(po);
      setUndoWindows((current) => {
        const next = { ...current };
        delete next[po.id];
        return next;
      });
      toast.success(`Receipt undone for ${po.productName}`);
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setUndoingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2>Purchase Orders</h2>
          <p className="text-muted-foreground">Log POs and record deliveries to update inventory.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="size-4 mr-1" /> New PO</Button>
      </div>

      {lowStock.length > 0 && (
        <Card className="rounded-3xl border-black/5 shadow-sm">
          <CardContent className="p-4">
            <p className="mb-2">Reorder suggestions</p>
            <div className="flex flex-wrap gap-2">
              {lowStock.map((p) => (
                <Badge key={p.id} variant="secondary">{p.name} — {p.stock} left</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-3xl border-black/5 shadow-sm">
        <CardContent className="p-0">
          <Table className="[&_th]:py-3 [&_td]:py-3 [&_th:first-child]:pl-6 [&_td:first-child]:pl-6 [&_th:last-child]:pr-6 [&_td:last-child]:pr-6">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((po) => {
                const undoExpiresAt = undoWindows[po.id] || 0;
                const canUndo = po.status === "Received" && undoExpiresAt > now;
                const remainingSeconds = Math.max(0, (undoExpiresAt - now) / 1000);

                return (
                  <TableRow key={po.id}>
                    <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                    <TableCell>{po.supplier}</TableCell>
                    <TableCell>{po.productName}</TableCell>
                    <TableCell className="text-right">{po.qty}</TableCell>
                    <TableCell>
                      {po.status === "Received" ? <Badge variant="secondary">Received</Badge> : <Badge>Pending</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {po.status === "Pending" && (
                          <Button size="sm" variant="outline" onClick={() => receive(po)} disabled={receivingId === po.id || deletingId === po.id}>
                            <Check className="size-4 mr-1" /> Receive
                          </Button>
                        )}
                        {canUndo && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => undoReceive(po)}
                            disabled={undoingId === po.id || deletingId === po.id}
                            className="gap-1.5"
                          >
                            <RotateCcw className="size-4" />
                            Undo
                            <span className="ml-1 text-[10px] tabular-nums text-muted-foreground">
                              {remainingSeconds.toFixed(1)}s
                            </span>
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete purchase order #${po.id.toUpperCase()}`}
                          title={`Delete purchase order #${po.id.toUpperCase()}`}
                          className="size-8 rounded-full text-[#ff3b30] hover:bg-[#ff3b30]/10"
                          onClick={() => deletePO(po)}
                          disabled={deletingId === po.id || receivingId === po.id || undoingId === po.id}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
              <Input type="number" value={form.qty || ""} onChange={(e) => setForm({ ...form, qty: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={create} disabled={creating}>{creating ? "Creating..." : "Create PO"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
