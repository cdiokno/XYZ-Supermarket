import { LayoutDashboard, ScanBarcode, Package, Truck, FileBarChart, History, Settings } from "lucide-react";
import { AppLogo } from "@/shared/brand";

export type View = "dashboard" | "pos" | "inventory" | "purchase-orders" | "reports" | "history" | "settings";

export type NavItem = { key: View; path: string; label: string; icon: typeof LayoutDashboard };

const baseNavItems: NavItem[] = [
  { key: "dashboard", path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "pos", path: "/pos", label: "Point of Sale", icon: ScanBarcode },
  { key: "inventory", path: "/inventory", label: "Inventory", icon: Package },
  { key: "purchase-orders", path: "/purchase-orders", label: "Purchase Orders", icon: Truck },
  { key: "history", path: "/history", label: "History", icon: History },
  { key: "reports", path: "/reports", label: "Reports", icon: FileBarChart },
];

const settingsNavItem: NavItem = { key: "settings", path: "/settings", label: "Settings", icon: Settings };

export function getNavItems(includeSettings: boolean): NavItem[] {
  return includeSettings ? [...baseNavItems, settingsNavItem] : baseNavItems;
}

export function Sidebar({
  currentPath,
  onNavigate,
  navItems,
}: {
  currentPath: string;
  onNavigate: (path: string) => void;
  navItems: NavItem[];
}) {
  const expanded = true;
  const width = 280;
  const easing = "cubic-bezier(0.32, 0.72, 0, 1)";

  return (
    <div
      className="hidden md:block shrink-0 sticky top-0 h-screen p-3"
      style={{ width }}
    >
      <aside
        className="h-full rounded-[28px] bg-white/70 backdrop-blur-2xl border border-black/5 flex flex-col overflow-hidden"
      >
        <div className={`flex items-center pt-5 pb-4 ${expanded ? "px-5 gap-3" : "px-0 justify-center"}`}>
          <div className="size-11 shrink-0 grid place-items-center">
            <AppLogo />
          </div>
          <div
            className="overflow-hidden"
            style={{
              opacity: expanded ? 1 : 0,
              width: expanded ? "auto" : 0,
              transition: `opacity 320ms ${easing} ${expanded ? "120ms" : "0ms"}, width 420ms ${easing}`,
            }}
          >
            <p className="whitespace-nowrap tracking-tight" style={{ fontWeight: 590 }}>XYZ Supermarket</p>
          </div>
        </div>

        <nav className={`mt-2 space-y-2 flex-1 ${expanded ? "px-3" : "px-0"}`}>
          {navItems.map((n) => {
            const active = currentPath === n.path || currentPath.startsWith(`${n.path}/`);
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => onNavigate(n.path)}
                className={`flex items-center rounded-full ${
                  expanded ? "w-full gap-3 px-5 h-11 justify-start" : "size-11 mx-auto justify-center"
                } ${active ? "bg-[#08f] text-white" : "text-[#1a1a1a] hover:bg-black/5"}`}
                style={{ transition: `background-color 220ms ${easing}, color 220ms ${easing}, padding 420ms ${easing}` }}
              >
                <n.icon className="size-5 shrink-0" strokeWidth={active ? 2.4 : 2} />
                <span
                  className="whitespace-nowrap overflow-hidden"
                  style={{
                    opacity: expanded ? 1 : 0,
                    width: expanded ? "auto" : 0,
                    fontSize: 15,
                    fontWeight: 510,
                    transition: `opacity 320ms ${easing} ${expanded ? "120ms" : "0ms"}, width 420ms ${easing}`,
                  }}
                >
                  {n.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="pb-4" />
      </aside>
    </div>
  );
}
