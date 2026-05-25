import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Label } from "@/shared/ui/label";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { InventoryHistoryEntry, peso, Product } from "@/domain/store";
import { getStoreErrorMessage } from "@/services/store";
import { Plus, Search, Pencil, ImagePlus, Check, X, Trash2, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_CATEGORIES = ["Grocery", "Beverages", "Personal Care"];

const HISTORY_ACTION_LABELS: Record<InventoryHistoryEntry["action"], string> = {
  product_created: "Product added",
  product_updated: "Product edited",
  product_deleted: "Product deleted",
  po_received: "PO received",
  po_receipt_undone: "Receipt undone",
  po_deleted: "PO deleted",
};

function formatHistoryValue(value: string | number | null, field: string) {
  if (value === null || value === "") return "Blank";
  if (field === "image") return "Photo";
  if (field === "price" && typeof value === "number") return peso(value);
  return String(value);
}

function formatHistoryDetails(entry: InventoryHistoryEntry) {
  if (entry.action === "product_created") return `Created with ${entry.stockAfter} stock`;
  if (entry.action === "product_deleted") return "Removed from active inventory";
  if (entry.action === "po_received") return `Received from #${entry.referenceId.toUpperCase()}`;
  if (entry.action === "po_receipt_undone") return `Undid receipt from #${entry.referenceId.toUpperCase()}`;
  if (entry.action === "po_deleted") return `Deleted #${entry.referenceId.toUpperCase()} and removed received stock`;

  if (entry.changes.length === 0) return "No field changes";

  return entry.changes
    .slice(0, 4)
    .map((change) => `${change.label}: ${formatHistoryValue(change.before, change.field)} -> ${formatHistoryValue(change.after, change.field)}`)
    .join("; ");
}

function formatQuantityDelta(delta: number | null) {
  if (delta === null) return "No stock change";
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

export function Inventory({
  products,
  inventoryHistory,
  hasPendingOrder,
  onSaveProduct,
  onDeleteProduct,
  onUploadImage,
}: {
  products: Product[];
  inventoryHistory: InventoryHistoryEntry[];
  hasPendingOrder: boolean;
  onSaveProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (product: Product) => Promise<void>;
  onUploadImage: (file: File, productId: string) => Promise<string>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setCategories((prev) => {
      const merged = Array.from(new Set([...prev, ...products.map((product) => product.category)]));
      return merged.length === prev.length ? prev : merged;
    });
  }, [products]);

  const filtered = products.filter(
    (p) =>
      (category === "all" || p.category === category) &&
      (p.name.toLowerCase().includes(query.toLowerCase()) || p.sku.toLowerCase().includes(query.toLowerCase()))
  );

  const promptRemovePendingOrder = () => {
    window.alert("Remove all items from the current POS order before editing inventory.");
  };

  const startAdding = () => {
    if (hasPendingOrder) {
      promptRemovePendingOrder();
      return;
    }

    setAdding(true);
  };

  const startEditing = (product: Product) => {
    if (hasPendingOrder) {
      promptRemovePendingOrder();
      return;
    }

    setEditing(product);
  };

  const saveProduct = async (p: Product) => {
    setSaving(true);
    try {
      await onSaveProduct(p);
      toast.success(products.find((x) => x.id === p.id) ? "Product updated" : "Product added");
      setEditing(null);
      setAdding(false);
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = (name: string) => {
    if (!categories.includes(name)) {
      setCategories((prev) => [...prev, name]);
    }
  };

  const deleteProduct = async (product: Product) => {
    const confirmed = window.confirm(`Delete ${product.name} from inventory? Sales and purchase order history will stay intact.`);
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDeleteProduct(product);
      toast.success("Product deleted");
      setEditing(null);
      setAdding(false);
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="tracking-tight">Inventory</h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setHistoryOpen(true)} className="rounded-full bg-white border-black/5">
            <HistoryIcon className="size-4 mr-1" />
            Inventory History
            <Badge variant="secondary" className="ml-1 rounded-full">
              {inventoryHistory.length}
            </Badge>
          </Button>
          <Button onClick={startAdding} className="rounded-full bg-[#007AFF] hover:bg-[#0051D5]"><Plus className="size-4 mr-1" /> Add Product</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search products..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-11 h-11 rounded-full bg-white border-black/5" />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48 h-full !h-11 min-h-11 rounded-full bg-white border-black/5"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-3xl border-black/5 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table className="[&_th]:py-3 [&_td]:py-3 [&_th:first-child]:pl-6 [&_td:first-child]:pl-6 [&_th:last-child]:pr-6 [&_td:last-child]:pr-6">
            <TableHeader>
              <TableRow>
                <TableHead className="w-16"></TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const low = p.stock <= p.reorderLevel;
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="size-12 rounded-xl overflow-hidden bg-[#f2f2f7]">
                        {p.image ? (
                          <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full grid place-items-center text-muted-foreground"><ImagePlus className="size-4" /></div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.sku}</TableCell>
                    <TableCell>{p.category}</TableCell>
                    <TableCell className="text-right">{peso(p.price)}</TableCell>
                    <TableCell className="text-right">{p.stock}</TableCell>
                    <TableCell>
                      {p.stock === 0 ? <Badge className="rounded-full bg-[#ff3b30]">Out</Badge> : low ? <Badge className="rounded-full bg-orange-500">Low</Badge> : <Badge className="rounded-full bg-[#007AFF]">OK</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" className="rounded-full" onClick={() => startEditing(p)}><Pencil className="size-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-6xl overflow-hidden rounded-3xl p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Inventory History</DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <Card className="rounded-none border-0 shadow-none">
              <CardContent className="p-0">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-2">
              <HistoryIcon className="size-5 text-[#007AFF]" />
              <h3 className="tracking-tight">Inventory History</h3>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {inventoryHistory.length} {inventoryHistory.length === 1 ? "entry" : "entries"}
            </Badge>
          </div>

          <div className="hidden md:block">
            <Table className="[&_th]:py-3 [&_td]:py-3 [&_th:first-child]:pl-6 [&_td:first-child]:pl-6 [&_th:last-child]:pr-6 [&_td:last-child]:pr-6">
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(entry.date).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="tracking-tight">{entry.productName}</p>
                        <p className="text-xs text-muted-foreground">{entry.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="rounded-full">
                        {entry.source === "manual" ? "Manual" : "Purchase Order"}
                      </Badge>
                    </TableCell>
                    <TableCell>{HISTORY_ACTION_LABELS[entry.action]}</TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <p className={entry.quantityDelta && entry.quantityDelta < 0 ? "text-[#ff3b30]" : entry.quantityDelta && entry.quantityDelta > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                          {formatQuantityDelta(entry.quantityDelta)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.stockBefore} {"->"} {entry.stockAfter}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md text-muted-foreground">{formatHistoryDetails(entry)}</TableCell>
                  </TableRow>
                ))}
                {inventoryHistory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No inventory changes recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 px-4 pb-4 md:hidden">
            {inventoryHistory.length === 0 && (
              <div className="rounded-2xl bg-[#f2f2f7] px-4 py-8 text-center text-muted-foreground">
                No inventory changes recorded yet.
              </div>
            )}
            {inventoryHistory.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-black/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate tracking-tight">{entry.productName}</p>
                    <p className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleString()}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 rounded-full">
                    {entry.source === "manual" ? "Manual" : "PO"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p>{HISTORY_ACTION_LABELS[entry.action]}</p>
                  <p className={entry.quantityDelta && entry.quantityDelta < 0 ? "text-[#ff3b30]" : entry.quantityDelta && entry.quantityDelta > 0 ? "text-emerald-600" : "text-muted-foreground"}>
                    {formatQuantityDelta(entry.quantityDelta)}
                  </p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {entry.stockBefore} {"->"} {entry.stockAfter}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{formatHistoryDetails(entry)}</p>
              </div>
            ))}
          </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {(editing || adding) && (
        <ProductDialog
          key={editing?.id || "new"}
          open
          onOpenChange={(o) => { if (!o) { setEditing(null); setAdding(false); } }}
          product={editing}
          categories={categories}
          onAddCategory={handleAddCategory}
          onUploadImage={onUploadImage}
          onSave={saveProduct}
          onDelete={deleteProduct}
          saving={saving}
          deleting={deleting}
        />
      )}
    </div>
  );
}

function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  onAddCategory,
  onUploadImage,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product: Product | null;
  categories: string[];
  onAddCategory: (name: string) => void;
  onUploadImage: (file: File, productId: string) => Promise<string>;
  onSave: (p: Product) => Promise<void>;
  onDelete: (p: Product) => Promise<void>;
  saving: boolean;
  deleting: boolean;
}) {
  const [form, setForm] = useState<Product>(
    product || { id: `p-${Date.now()}`, sku: "", name: "", category: categories[0] || "Grocery", price: 0, stock: 0, reorderLevel: 5, image: "" }
  );
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleFile = async (file: File) => {
    setUploadingImage(true);
    try {
      const image = await onUploadImage(file, form.id);
      setForm((current) => ({ ...current, image }));
      toast.success("Product photo uploaded");
    } catch (error) {
      toast.error(getStoreErrorMessage(error));
    } finally {
      setUploadingImage(false);
    }
  };

  const confirmNewCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    onAddCategory(name);
    setForm({ ...form, category: name });
    setNewCatName("");
    setShowNewCat(false);
  };

  const cancelNewCategory = () => {
    setNewCatName("");
    setShowNewCat(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-lg">
        <DialogHeader><DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="size-24 rounded-2xl overflow-hidden bg-[#f2f2f7] shrink-0">
              {form.image ? (
                <ImageWithFallback src={form.image} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-muted-foreground"><ImagePlus className="size-6" /></div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label>Product Photo</Label>
              <div className="flex gap-2">
                <label className="inline-flex items-center px-3 h-9 rounded-full bg-[#007AFF] text-white cursor-pointer hover:bg-[#0051D5] transition">
                  {uploadingImage ? "Uploading" : "Upload"}
                  <input type="file" accept="image/*" className="hidden" disabled={uploadingImage} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
                </label>
                <Input placeholder="or paste URL" value={form.image || ""} onChange={(e) => setForm({ ...form, image: e.target.value })} className="h-9 rounded-full" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>SKU</Label>
              <Input className="mt-1.5 rounded-xl" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <Label>Category</Label>
              {showNewCat ? (
                <div className="mt-1.5 flex gap-1.5">
                  <Input
                    autoFocus
                    placeholder="New category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") confirmNewCategory(); if (e.key === "Escape") cancelNewCategory(); }}
                    className="rounded-xl h-9 flex-1"
                  />
                  <Button size="icon" className="rounded-full h-9 w-9 bg-[#007AFF] hover:bg-[#0051D5] shrink-0" onClick={confirmNewCategory} disabled={!newCatName.trim()}>
                    <Check className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full h-9 w-9 shrink-0" onClick={cancelNewCategory}>
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Select
                  value={form.category}
                  onValueChange={(v) => {
                    if (v === "__add_new__") { setShowNewCat(true); }
                    else { setForm({ ...form, category: v }); }
                  }}
                >
                  <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                    <SelectItem value="__add_new__" className="text-[#007AFF]">
                      <span className="flex items-center gap-1.5"><Plus className="size-3.5" /> Add Category</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="col-span-2">
              <Label>Product Name</Label>
              <Input className="mt-1.5 rounded-xl" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Price (₱)</Label>
              <Input className="mt-1.5 rounded-xl" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>Stock</Label>
              <Input className="mt-1.5 rounded-xl" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} />
            </div>
            <div className="col-span-2">
              <Label>Reorder Level</Label>
              <Input className="mt-1.5 rounded-xl" type="number" value={form.reorderLevel} onChange={(e) => setForm({ ...form, reorderLevel: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          {product && (
            <Button
              variant="outline"
              className="rounded-full border-[#ff3b30]/25 text-[#ff3b30] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] sm:mr-auto"
              onClick={() => onDelete(product)}
              disabled={saving || deleting || uploadingImage}
            >
              <Trash2 className="size-4 mr-1" />
              {deleting ? "Deleting..." : "Delete Product"}
            </Button>
          )}
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="rounded-full bg-[#007AFF] hover:bg-[#0051D5]" onClick={() => onSave(form)} disabled={!form.name || !form.sku || saving || uploadingImage}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
