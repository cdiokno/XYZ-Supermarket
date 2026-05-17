import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { ImageWithFallback } from "@/shared/components/ImageWithFallback";
import { peso, Product, PurchaseOrder, Sale } from "@/domain/store";
import { AlertTriangle, Banknote, Boxes, ReceiptText, ShoppingCart, TrendingUp, Truck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type ProductPerformance = {
  productId: string;
  name: string;
  sku: string;
  category: string;
  image?: string;
  qty: number;
  revenue: number;
};

export function Dashboard({
  products,
  sales,
  purchaseOrders,
  userName,
}: {
  products: Product[];
  sales: Sale[];
  purchaseOrders: PurchaseOrder[];
  userName: string;
}) {
  const today = new Date().toDateString();
  const productById = new Map(products.map((product) => [product.id, product]));
  const todaySales = sales.filter((sale) => new Date(sale.date).toDateString() === today);
  const todayRevenue = todaySales.reduce((total, sale) => total + sale.total, 0);
  const todayUnits = todaySales.reduce((total, sale) => total + sale.items.reduce((sum, item) => sum + item.qty, 0), 0);
  const lowStock = products.filter((product) => product.stock <= product.reorderLevel).sort((a, b) => a.stock - b.stock);
  const totalStock = products.reduce((total, product) => total + product.stock, 0);
  const inventoryValue = products.reduce((total, product) => total + product.stock * product.price, 0);
  const averageBasket = todaySales.length ? todayRevenue / todaySales.length : 0;
  const openPurchaseOrders = purchaseOrders.filter((po) => po.status !== "Received");
  const incomingUnits = openPurchaseOrders.reduce((total, po) => total + Math.max(0, po.qty - po.receivedQty), 0);

  const last7 = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toDateString();
    const total = sales.filter((sale) => new Date(sale.date).toDateString() === key).reduce((sum, sale) => sum + sale.total, 0);
    return { day: date.toLocaleDateString("en-US", { weekday: "short" }), total };
  });

  const performanceByProduct = new Map<string, ProductPerformance>();
  const categoryRevenue = new Map<string, number>();

  for (const sale of sales) {
    for (const item of sale.items) {
      const product = productById.get(item.productId);
      const category = product?.category || "Uncategorized";
      const current = performanceByProduct.get(item.productId) || {
        productId: item.productId,
        name: item.name,
        sku: product?.sku || item.productId,
        category,
        image: product?.image,
        qty: 0,
        revenue: 0,
      };

      current.qty += item.qty;
      current.revenue += item.qty * item.price;
      performanceByProduct.set(item.productId, current);
      categoryRevenue.set(category, (categoryRevenue.get(category) || 0) + item.qty * item.price);
    }
  }

  const topProducts = Array.from(performanceByProduct.values())
    .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
    .slice(0, 5);
  const topProductQty = Math.max(1, ...topProducts.map((product) => product.qty));

  const categoryRows = Array.from(categoryRevenue.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  const topCategoryRevenue = Math.max(1, ...categoryRows.map((row) => row.revenue));
  const categoryColors = ["bg-[#007AFF]", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-slate-500"];

  const recentSales = [...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  const stats = [
    { label: "Today's Sales", value: peso(todayRevenue), icon: TrendingUp, color: "text-[#007AFF]" },
    { label: "Transactions", value: todaySales.length.toLocaleString("en-PH"), icon: ShoppingCart, color: "text-emerald-600" },
    { label: "Units Sold", value: todayUnits.toLocaleString("en-PH"), icon: ReceiptText, color: "text-amber-600" },
    { label: "Avg Basket", value: peso(averageBasket), icon: Banknote, color: "text-rose-600" },
    { label: "Inventory Value", value: peso(inventoryValue), icon: Boxes, color: "text-slate-700" },
    { label: "Incoming Units", value: incomingUnits.toLocaleString("en-PH"), icon: Truck, color: "text-[#007AFF]" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2>Dashboard</h2>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="text-muted-foreground">Welcome, {userName}</p>
          <Badge variant={lowStock.length ? "destructive" : "secondary"} className="shrink-0">
            {lowStock.length} low stock alerts
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="rounded-2xl border-black/5 shadow-sm">
            <CardContent className="flex min-h-28 items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="mt-2 truncate text-lg">{stat.value}</p>
              </div>
              <stat.icon className={`size-7 shrink-0 ${stat.color}`} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="rounded-2xl border-black/5 shadow-sm xl:col-span-2">
          <CardHeader><CardTitle>Sales - Last 7 Days</CardTitle></CardHeader>
          <CardContent className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value: number) => `P${value}`} />
                <Tooltip formatter={(value: number) => peso(value)} cursor={{ fill: "rgba(0, 122, 255, 0.08)" }} />
                <Bar dataKey="total" fill="#007AFF" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-black/5 shadow-sm">
          <CardHeader><CardTitle>Top Selling Products</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {topProducts.length === 0 && <p className="text-muted-foreground">No sales yet.</p>}
            {topProducts.map((product, index) => (
              <div key={product.productId} className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="grid size-7 shrink-0 place-items-center rounded-full bg-[#f2f2f7] text-sm">{index + 1}</div>
                  <div className="size-11 shrink-0 overflow-hidden rounded-lg bg-[#f2f2f7]">
                    <ImageWithFallback src={product.image || ""} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{product.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{product.qty} sold - {peso(product.revenue)}</p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f2f2f7]">
                  <div className="h-full rounded-full bg-[#007AFF]" style={{ width: `${(product.qty / topProductQty) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="rounded-2xl border-black/5 shadow-sm">
          <CardHeader><CardTitle>Category Sales</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {categoryRows.length === 0 && <p className="text-muted-foreground">No category sales yet.</p>}
            {categoryRows.map((row, index) => (
              <div key={row.category} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate">{row.category}</p>
                  <p className="shrink-0 text-sm text-muted-foreground">{peso(row.revenue)}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#f2f2f7]">
                  <div
                    className={`h-full rounded-full ${categoryColors[index % categoryColors.length]}`}
                    style={{ width: `${(row.revenue / topCategoryRevenue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-black/5 shadow-sm">
          <CardHeader><CardTitle>Pending Replenishment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {openPurchaseOrders.length === 0 && <p className="text-muted-foreground">No open purchase orders.</p>}
            {openPurchaseOrders.slice(0, 5).map((po) => {
              const remaining = Math.max(0, po.qty - po.receivedQty);
              return (
                <div key={po.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate">{po.productName}</p>
                    <p className="truncate text-sm text-muted-foreground">{po.supplier}</p>
                  </div>
                  <Badge variant="outline">{remaining} left</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-black/5 shadow-sm">
          <CardHeader><CardTitle>Inventory Watch</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p>Total stock units</p>
                <p className="text-sm text-muted-foreground">{products.length} active products</p>
              </div>
              <Badge variant="secondary">{totalStock.toLocaleString("en-PH")}</Badge>
            </div>
            {lowStock.length === 0 && <p className="text-muted-foreground">All stocks healthy.</p>}
            {lowStock.slice(0, 4).map((product) => (
              <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                <div className="min-w-0">
                  <p className="truncate">{product.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{product.sku}</p>
                </div>
                <Badge variant="destructive">
                  <AlertTriangle className="size-3" />
                  {product.stock} left
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recentSales.length === 0 && <p className="text-muted-foreground">No transactions yet.</p>}
          {recentSales.map((sale) => (
            <div key={sale.id} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div className="min-w-0">
                <p className="truncate">{sale.items.map((item) => item.name).join(", ")}</p>
                <p className="truncate text-sm text-muted-foreground">{sale.cashier} - {new Date(sale.date).toLocaleString()}</p>
              </div>
              <Badge variant="secondary">{sale.items.reduce((total, item) => total + item.qty, 0)} items</Badge>
              <p className="text-right">{peso(sale.total)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
