import { useMemo, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Sale, peso } from "./store-data";
import { Search, Receipt } from "lucide-react";

export function History({ sales }: { sales: Sale[] }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Sale | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...sales].sort((a, b) => +new Date(b.date) - +new Date(a.date));
    if (!q) return sorted;
    return sorted.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.cashier.toLowerCase().includes(q) ||
        s.items.some((i) => i.name.toLowerCase().includes(q))
    );
  }, [sales, query]);

  const totalRevenue = filtered.reduce((sum, s) => sum + s.total, 0);
  const totalItems = filtered.reduce((sum, s) => sum + s.items.reduce((n, i) => n + i.qty, 0), 0);

  return (
    <div className="space-y-4">
      <div>
        <h2>Transaction History</h2>
        <p className="text-muted-foreground">Complete record of every checkout from the POS.</p>
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
            <p className="text-muted-foreground">Items sold</p>
            <p style={{ fontSize: 24, fontWeight: 600 }}>{totalItems}</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-black/5 shadow-sm">
          <CardContent className="p-4">
            <p className="text-muted-foreground">Revenue</p>
            <p style={{ fontSize: 24, fontWeight: 600 }}>{peso(totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by receipt, cashier, or product"
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
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const qty = s.items.reduce((n, i) => n + i.qty, 0);
                return (
                  <TableRow
                    key={s.id}
                    className="cursor-pointer"
                    onClick={() => setSelected(s)}
                  >
                    <TableCell className="text-muted-foreground">#{s.id.toUpperCase()}</TableCell>
                    <TableCell>{new Date(s.date).toLocaleString()}</TableCell>
                    <TableCell>{s.cashier}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {s.items.map((i) => i.name).join(", ")}
                    </TableCell>
                    <TableCell className="text-right">{qty}</TableCell>
                    <TableCell className="text-right">{peso(s.total)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="rounded-full">
                        <Receipt className="size-3 mr-1" />View
                      </Badge>
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

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Receipt #{selected?.id.toUpperCase()}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex justify-between text-muted-foreground">
                <span>{new Date(selected.date).toLocaleString()}</span>
                <span>Cashier: {selected.cashier}</span>
              </div>
              <div className="rounded-2xl border border-black/5 divide-y divide-black/5">
                {selected.items.map((i) => (
                  <div key={i.productId} className="flex justify-between px-4 py-3">
                    <div>
                      <p>{i.name}</p>
                      <p className="text-muted-foreground">{peso(i.price)} × {i.qty}</p>
                    </div>
                    <p>{peso(i.price * i.qty)}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <span style={{ fontWeight: 590 }}>Total</span>
                <span style={{ fontWeight: 590 }}>{peso(selected.total)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
