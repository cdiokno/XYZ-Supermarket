import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { peso, Product, Sale } from "./store-data";
import { TrendingUp, Package, AlertTriangle, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function Dashboard({ products, sales }: { products: Product[]; sales: Sale[] }) {
  const today = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.date).toDateString() === today);
  const todayRevenue = todaySales.reduce((a, s) => a + s.total, 0);
  const lowStock = products.filter((p) => p.stock <= p.reorderLevel);
  const totalStock = products.reduce((a, p) => a + p.stock, 0);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    const total = sales.filter((s) => new Date(s.date).toDateString() === key).reduce((a, s) => a + s.total, 0);
    return { day: d.toLocaleDateString("en-US", { weekday: "short" }), total };
  });

  const stats = [
    { label: "Today's Sales", value: peso(todayRevenue), icon: TrendingUp, color: "text-[#007AFF]" },
    { label: "Transactions Today", value: todaySales.length, icon: ShoppingCart, color: "text-[#007AFF]" },
    { label: "Total Stock Units", value: totalStock, icon: Package, color: "text-[#007AFF]" },
    { label: "Low Stock Alerts", value: lowStock.length, icon: AlertTriangle, color: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2>Dashboard</h2>
        <p className="text-muted-foreground">Real-time view of sales and inventory.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="rounded-3xl border-black/5 shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-muted-foreground">{s.label}</p>
                <p className="mt-2">{s.value}</p>
              </div>
              <s.icon className={`size-8 ${s.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Sales — Last 7 Days</CardTitle></CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(v: number) => peso(v)} />
                <Bar dataKey="total" fill="#007AFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Low Stock Alerts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {lowStock.length === 0 && <p className="text-muted-foreground">All stocks healthy.</p>}
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <p>{p.name}</p>
                  <p className="text-muted-foreground">{p.sku}</p>
                </div>
                <Badge variant="destructive">{p.stock} left</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}