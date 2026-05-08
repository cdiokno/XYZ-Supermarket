export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  reorderLevel: number;
  image?: string;
};

export const productImages: Record<string, string> = {
  p1: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
  p2: "https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=400",
  p3: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400",
  p4: "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?w=400",
  p5: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400",
  p6: "https://images.unsplash.com/photo-1560847468-5eef0fa0d76e?w=400",
  p7: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400",
  p8: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400",
  p9: "https://images.unsplash.com/photo-1559525839-d9acfd02053c?w=400",
  p10: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400",
  p11: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400",
  p12: "https://images.unsplash.com/photo-1612538498488-22d72b9a4d96?w=400",
  p13: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400",
};

export type SaleItem = { productId: string; name: string; price: number; qty: number };
export type Sale = {
  id: string;
  date: string;
  cashier: string;
  items: SaleItem[];
  total: number;
};

export type PurchaseOrder = {
  id: string;
  date: string;
  supplier: string;
  productId: string;
  productName: string;
  qty: number;
  status: "Pending" | "Received";
};

export const initialProducts: Product[] = [
  { id: "p1", sku: "GR-001", name: "Jasmine Rice 5kg", category: "Grocery", price: 320, stock: 24, reorderLevel: 10, image: productImages.p1 },
  { id: "p2", sku: "GR-002", name: "Brown Sugar 1kg", category: "Grocery", price: 75, stock: 8, reorderLevel: 12, image: productImages.p2 },
  { id: "p3", sku: "GR-003", name: "Cooking Oil 1L", category: "Grocery", price: 110, stock: 30, reorderLevel: 15, image: productImages.p3 },
  { id: "p4", sku: "GR-004", name: "Instant Noodles", category: "Grocery", price: 15, stock: 120, reorderLevel: 50, image: productImages.p4 },
  { id: "p5", sku: "GR-005", name: "Canned Sardines", category: "Grocery", price: 28, stock: 45, reorderLevel: 20, image: productImages.p5 },
  { id: "p6", sku: "BV-001", name: "Bottled Water 1.5L", category: "Beverages", price: 25, stock: 60, reorderLevel: 30, image: productImages.p6 },
  { id: "p7", sku: "BV-002", name: "Cola 1.5L", category: "Beverages", price: 65, stock: 5, reorderLevel: 15, image: productImages.p7 },
  { id: "p8", sku: "BV-003", name: "Orange Juice 1L", category: "Beverages", price: 95, stock: 18, reorderLevel: 10, image: productImages.p8 },
  { id: "p9", sku: "BV-004", name: "Coffee 3-in-1", category: "Beverages", price: 12, stock: 200, reorderLevel: 80, image: productImages.p9 },
  { id: "p10", sku: "PC-001", name: "Bath Soap", category: "Personal Care", price: 35, stock: 40, reorderLevel: 20, image: productImages.p10 },
  { id: "p11", sku: "PC-002", name: "Shampoo Sachet", category: "Personal Care", price: 8, stock: 150, reorderLevel: 60, image: productImages.p11 },
  { id: "p12", sku: "PC-003", name: "Toothpaste 150g", category: "Personal Care", price: 95, stock: 3, reorderLevel: 10, image: productImages.p12 },
  { id: "p13", sku: "PC-004", name: "Laundry Detergent", category: "Personal Care", price: 145, stock: 22, reorderLevel: 12, image: productImages.p13 },
];

export const initialCashiers = ["Maria S.", "Juan D.", "Ana R."];

const today = new Date();
const day = (d: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - d);
  return date.toISOString();
};

export const initialSales: Sale[] = [
  { id: "s1", date: day(0), cashier: "Maria S.", items: [{ productId: "p1", name: "Jasmine Rice 5kg", price: 320, qty: 1 }, { productId: "p3", name: "Cooking Oil 1L", price: 110, qty: 2 }], total: 540 },
  { id: "s2", date: day(0), cashier: "Juan D.", items: [{ productId: "p7", name: "Cola 1.5L", price: 65, qty: 3 }], total: 195 },
  { id: "s3", date: day(1), cashier: "Maria S.", items: [{ productId: "p4", name: "Instant Noodles", price: 15, qty: 10 }, { productId: "p11", name: "Shampoo Sachet", price: 8, qty: 5 }], total: 190 },
  { id: "s4", date: day(2), cashier: "Juan D.", items: [{ productId: "p13", name: "Laundry Detergent", price: 145, qty: 2 }], total: 290 },
  { id: "s5", date: day(3), cashier: "Maria S.", items: [{ productId: "p1", name: "Jasmine Rice 5kg", price: 320, qty: 2 }], total: 640 },
  { id: "s6", date: day(4), cashier: "Ana R.", items: [{ productId: "p9", name: "Coffee 3-in-1", price: 12, qty: 20 }], total: 240 },
  { id: "s7", date: day(5), cashier: "Juan D.", items: [{ productId: "p10", name: "Bath Soap", price: 35, qty: 4 }, { productId: "p12", name: "Toothpaste 150g", price: 95, qty: 1 }], total: 235 },
  { id: "s8", date: day(6), cashier: "Maria S.", items: [{ productId: "p6", name: "Bottled Water 1.5L", price: 25, qty: 6 }], total: 150 },
];

export const initialPOs: PurchaseOrder[] = [
  { id: "po1", date: day(2), supplier: "MegaFoods Distributors", productId: "p2", productName: "Brown Sugar 1kg", qty: 50, status: "Pending" },
  { id: "po2", date: day(5), supplier: "AquaSupply Co.", productId: "p6", productName: "Bottled Water 1.5L", qty: 100, status: "Received" },
  { id: "po3", date: day(1), supplier: "BevTrade Inc.", productId: "p7", productName: "Cola 1.5L", qty: 60, status: "Pending" },
];

export const peso = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;