import { useRef, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";
import { Button } from "@/shared/ui/button";
import { Product, Sale, peso } from "@/domain/store";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";

export function Reports({ sales, products }: { sales: Sale[]; products: Product[] }) {
  const [range, setRange] = useState<"daily" | "weekly" | "monthly">("daily");
  const [exporting, setExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const now = new Date();
    const days = range === "daily" ? 1 : range === "weekly" ? 7 : 30;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days + 1);
    cutoff.setHours(0, 0, 0, 0);
    return sales.filter((s) => new Date(s.date) >= cutoff);
  }, [sales, range]);

  const revenue = filtered.reduce((a, s) => a + s.total, 0);
  const itemsSold = filtered.reduce((a, s) => a + s.items.reduce((x, i) => x + i.qty, 0), 0);

  const productSales = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const s of filtered)
      for (const i of s.items) {
        const cur = map.get(i.productId) || { name: i.name, qty: 0, revenue: 0 };
        cur.qty += i.qty;
        cur.revenue += i.qty * i.price;
        map.set(i.productId, cur);
      }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const trend = useMemo(() => {
    const days = range === "daily" ? 1 : range === "weekly" ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toDateString();
      const total = sales.filter((s) => new Date(s.date).toDateString() === key).reduce((a, s) => a + s.total, 0);
      return { date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), total };
    });
  }, [sales, range]);

  const inventoryValue = products.reduce((a, p) => a + p.price * p.stock, 0);

  const cardCls = "rounded-3xl border-black/5 shadow-sm";

  const exportToPdf = async () => {
    if (!reportRef.current || exporting) return;
    setExporting(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#f2f2f7",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let remainingHeight = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      remainingHeight -= pdfHeight;

      while (remainingHeight > 0) {
        position = remainingHeight - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        remainingHeight -= pdfHeight;
      }

      const stamp = new Date().toISOString().slice(0, 10);
      pdf.save(`xyz-supermarket-reports-${range}-${stamp}.pdf`);
      toast.success("Report exported to PDF");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to export report to PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8" ref={reportRef}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="tracking-tight">Reports</h2>
        <Button
          type="button"
          onClick={exportToPdf}
          disabled={exporting}
          className="rounded-full bg-[#007AFF] hover:bg-[#0051D5]"
        >
          <Download className="size-4 mr-1" />
          {exporting ? "Exporting..." : "Export PDF"}
        </Button>
      </div>

      <Tabs value={range} onValueChange={(v) => setRange(v as typeof range)} className="space-y-6">
        <TabsList className="rounded-full bg-white border border-black/5 p-1 h-11">
          <TabsTrigger value="daily" className="rounded-full px-5 data-[state=active]:bg-[#007AFF] data-[state=active]:text-white">Daily</TabsTrigger>
          <TabsTrigger value="weekly" className="rounded-full px-5 data-[state=active]:bg-[#007AFF] data-[state=active]:text-white">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-full px-5 data-[state=active]:bg-[#007AFF] data-[state=active]:text-white">Monthly</TabsTrigger>
        </TabsList>

        <TabsContent value={range} className="space-y-6 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Card className={cardCls}><CardContent className="p-6"><p className="text-muted-foreground">Revenue</p><p className="mt-3 tracking-tight">{peso(revenue)}</p></CardContent></Card>
            <Card className={cardCls}><CardContent className="p-6"><p className="text-muted-foreground">Transactions</p><p className="mt-3 tracking-tight">{filtered.length}</p></CardContent></Card>
            <Card className={cardCls}><CardContent className="p-6"><p className="text-muted-foreground">Items Sold</p><p className="mt-3 tracking-tight">{itemsSold}</p></CardContent></Card>
          </div>

          {range !== "daily" && (
            <Card className={cardCls}>
              <CardHeader className="pb-2"><CardTitle className="tracking-tight">Sales Trend</CardTitle></CardHeader>
              <CardContent className="h-72 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" stroke="#8e8e93" />
                    <YAxis stroke="#8e8e93" />
                    <Tooltip formatter={(v: number) => peso(v)} />
                    <Line type="monotone" dataKey="total" stroke="#007AFF" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card className={cardCls}>
            <CardHeader className="pb-2"><CardTitle className="tracking-tight">Top Products</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead className="pl-6">Product</TableHead><TableHead className="text-right">Units</TableHead><TableHead className="text-right pr-6">Revenue</TableHead></TableRow></TableHeader>
                <TableBody>
                  {productSales.length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No sales in this period</TableCell></TableRow>}
                  {productSales.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="pl-6 py-4">{p.name}</TableCell>
                      <TableCell className="text-right py-4">{p.qty}</TableCell>
                      <TableCell className="text-right pr-6 py-4">{peso(p.revenue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className={cardCls}>
        <CardHeader className="pb-2"><CardTitle className="tracking-tight">Inventory Summary</CardTitle></CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div><p className="text-muted-foreground">SKUs</p><p className="mt-2 tracking-tight">{products.length}</p></div>
            <div><p className="text-muted-foreground">Total Units</p><p className="mt-2 tracking-tight">{products.reduce((a, p) => a + p.stock, 0)}</p></div>
            <div><p className="text-muted-foreground">Inventory Value</p><p className="mt-2 tracking-tight">{peso(inventoryValue)}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
