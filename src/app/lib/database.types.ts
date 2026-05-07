export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      cashiers: {
        Row: {
          created_at: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          name?: string;
        };
      };
      products: {
        Row: {
          category: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          image: string | null;
          name: string;
          price: number;
          reorder_level: number;
          sku: string;
          stock: number;
          updated_at: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          deleted_at?: string | null;
          id: string;
          image?: string | null;
          name: string;
          price: number;
          reorder_level: number;
          sku: string;
          stock: number;
          updated_at?: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          image?: string | null;
          name?: string;
          price?: number;
          reorder_level?: number;
          sku?: string;
          stock?: number;
          updated_at?: string;
        };
      };
      purchase_orders: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          product_id: string;
          product_name: string;
          qty: number;
          status: "Pending" | "Received";
          supplier: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date?: string;
          id: string;
          product_id: string;
          product_name: string;
          qty: number;
          status?: "Pending" | "Received";
          supplier: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          product_id?: string;
          product_name?: string;
          qty?: number;
          status?: "Pending" | "Received";
          supplier?: string;
          updated_at?: string;
        };
      };
      sale_items: {
        Row: {
          name: string;
          price: number;
          product_id: string;
          qty: number;
          sale_id: string;
        };
        Insert: {
          name: string;
          price: number;
          product_id: string;
          qty: number;
          sale_id: string;
        };
        Update: {
          name?: string;
          price?: number;
          product_id?: string;
          qty?: number;
          sale_id?: string;
        };
      };
      sales: {
        Row: {
          cashier: string;
          created_at: string;
          date: string;
          id: string;
          total: number;
        };
        Insert: {
          cashier: string;
          created_at?: string;
          date?: string;
          id: string;
          total: number;
        };
        Update: {
          cashier?: string;
          created_at?: string;
          date?: string;
          id?: string;
          total?: number;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      checkout_sale: {
        Args: {
          p_cashier: string;
          p_date?: string;
          p_items: Json;
          p_sale_id: string;
        };
        Returns: Database["public"]["Tables"]["sales"]["Row"];
      };
      delete_product: {
        Args: {
          p_product_id: string;
        };
        Returns: Database["public"]["Tables"]["products"]["Row"];
      };
      delete_sale: {
        Args: {
          p_sale_id: string;
        };
        Returns: Database["public"]["Tables"]["sales"]["Row"];
      };
      delete_purchase_order: {
        Args: {
          p_po_id: string;
        };
        Returns: Database["public"]["Tables"]["purchase_orders"]["Row"];
      };
      receive_purchase_order: {
        Args: {
          p_po_id: string;
        };
        Returns: Database["public"]["Tables"]["purchase_orders"]["Row"];
      };
      undo_receive_purchase_order: {
        Args: {
          p_po_id: string;
        };
        Returns: Database["public"]["Tables"]["purchase_orders"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
