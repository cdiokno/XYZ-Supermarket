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
        Relationships: [];
      };
      inventory_history: {
        Row: {
          action:
            | "product_created"
            | "product_updated"
            | "product_deleted"
            | "po_received"
            | "po_receipt_undone"
            | "po_deleted";
          changes: Json;
          created_at: string;
          date: string;
          id: string;
          product_id: string;
          product_name: string;
          quantity_delta: number | null;
          reference_id: string;
          reference_type: "product" | "purchase_order";
          sku: string;
          source: "manual" | "purchase_order";
          stock_after: number;
          stock_before: number;
        };
        Insert: {
          action:
            | "product_created"
            | "product_updated"
            | "product_deleted"
            | "po_received"
            | "po_receipt_undone"
            | "po_deleted";
          changes?: Json;
          created_at?: string;
          date?: string;
          id?: string;
          product_id: string;
          product_name: string;
          quantity_delta?: number | null;
          reference_id: string;
          reference_type: "product" | "purchase_order";
          sku: string;
          source: "manual" | "purchase_order";
          stock_after: number;
          stock_before: number;
        };
        Update: {
          action?:
            | "product_created"
            | "product_updated"
            | "product_deleted"
            | "po_received"
            | "po_receipt_undone"
            | "po_deleted";
          changes?: Json;
          created_at?: string;
          date?: string;
          id?: string;
          product_id?: string;
          product_name?: string;
          quantity_delta?: number | null;
          reference_id?: string;
          reference_type?: "product" | "purchase_order";
          sku?: string;
          source?: "manual" | "purchase_order";
          stock_after?: number;
          stock_before?: number;
        };
        Relationships: [];
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
        Relationships: [];
      };
      purchase_orders: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          product_id: string;
          product_name: string;
          qty: number;
          received_qty: number;
          status: "Pending" | "Partially Received" | "Received";
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
          received_qty?: number;
          status?: "Pending" | "Partially Received" | "Received";
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
          received_qty?: number;
          status?: "Pending" | "Partially Received" | "Received";
          supplier?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "purchase_orders_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      receipt_returns: {
        Row: {
          additional_due: number;
          cashier: string;
          created_at: string;
          date: string;
          id: string;
          refund_amount: number;
          replacement_items: Json;
          replacement_value: number;
          returned_items: Json;
          returned_value: number;
          sale_id: string;
          store_credit_amount: number;
          type: "cash_refund" | "replacement" | "store_credit";
        };
        Insert: {
          additional_due?: number;
          cashier: string;
          created_at?: string;
          date?: string;
          id?: string;
          refund_amount?: number;
          replacement_items?: Json;
          replacement_value?: number;
          returned_items?: Json;
          returned_value?: number;
          sale_id: string;
          store_credit_amount?: number;
          type: "cash_refund" | "replacement" | "store_credit";
        };
        Update: {
          additional_due?: number;
          cashier?: string;
          created_at?: string;
          date?: string;
          id?: string;
          refund_amount?: number;
          replacement_items?: Json;
          replacement_value?: number;
          returned_items?: Json;
          returned_value?: number;
          sale_id?: string;
          store_credit_amount?: number;
          type?: "cash_refund" | "replacement" | "store_credit";
        };
        Relationships: [
          {
            foreignKeyName: "receipt_returns_cashier_fkey";
            columns: ["cashier"];
            isOneToOne: false;
            referencedRelation: "cashiers";
            referencedColumns: ["name"];
          },
          {
            foreignKeyName: "receipt_returns_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey";
            columns: ["sale_id"];
            isOneToOne: false;
            referencedRelation: "sales";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "sales_cashier_fkey";
            columns: ["cashier"];
            isOneToOne: false;
            referencedRelation: "cashiers";
            referencedColumns: ["name"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_app_account: {
        Args: {
          p_admin_username: string;
          p_name: string;
          p_password: string;
          p_role: string;
          p_username: string;
        };
        Returns: {
          username: string;
          name: string;
          role: string;
          profile_image: string;
        }[];
      };
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
      process_receipt_return: {
        Args: {
          p_cashier: string;
          p_date?: string;
          p_replacement_items?: Json;
          p_return_id: string;
          p_returned_items: Json;
          p_sale_id: string;
          p_type: "cash_refund" | "replacement" | "store_credit";
        };
        Returns: Database["public"]["Tables"]["receipt_returns"]["Row"];
      };
      delete_app_account: {
        Args: {
          p_admin_username: string;
          p_target_username: string;
        };
        Returns: {
          username: string;
          name: string;
          role: string;
          profile_image: string;
        }[];
      };
      list_app_accounts: {
        Args: Record<PropertyKey, never>;
        Returns: {
          username: string;
          name: string;
          role: string;
          profile_image: string;
        }[];
      };
      login_app_account: {
        Args: {
          p_password: string;
          p_username: string;
        };
        Returns: {
          username: string;
          name: string;
          role: string;
          profile_image: string;
        }[];
      };
      receive_purchase_order: {
        Args: {
          p_po_id: string;
          p_received_qty?: number | null;
        };
        Returns: Database["public"]["Tables"]["purchase_orders"]["Row"];
      };
      undo_receive_purchase_order: {
        Args: {
          p_po_id: string;
          p_received_qty?: number | null;
        };
        Returns: Database["public"]["Tables"]["purchase_orders"]["Row"];
      };
      upsert_product_with_history: {
        Args: {
          p_category: string;
          p_image?: string | null;
          p_name: string;
          p_price: number;
          p_product_id: string;
          p_reorder_level: number;
          p_sku: string;
          p_stock: number;
        };
        Returns: Database["public"]["Tables"]["products"]["Row"];
      };
      update_app_account: {
        Args: {
          p_current_password?: string | null;
          p_current_username: string;
          p_name: string;
          p_new_password?: string | null;
          p_profile_image?: string | null;
          p_username: string;
        };
        Returns: {
          username: string;
          name: string;
          role: string;
          profile_image: string;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
