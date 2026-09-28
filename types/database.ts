/*
 * Supabase database types, written by hand to mirror supabase/migrations/20260927000000_initial_schema.sql
 * in the shape `supabase gen types typescript` produces. Passing `Database` to the Supabase clients
 * makes column names, filters and embedded selects type-checked. Once the Supabase CLI is linked,
 * regenerate this file instead of editing it: npx supabase gen types typescript --linked
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          role: Database["public"]["Enums"]["user_role"];
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          email?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Relationships: [];
      };
      agents: {
        Row: {
          id: string;
          user_id: string | null;
          full_name: string;
          title: string | null;
          email: string | null;
          phone: string | null;
          profile_image: string | null;
          bio: string | null;
          agency_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          full_name: string;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          profile_image?: string | null;
          bio?: string | null;
          agency_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          full_name?: string;
          title?: string | null;
          email?: string | null;
          phone?: string | null;
          profile_image?: string | null;
          bio?: string | null;
          agency_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          id: string;
          agent_id: string;
          title: string;
          description: string | null;
          property_type: Database["public"]["Enums"]["property_type"];
          listing_type: Database["public"]["Enums"]["listing_type"];
          price: number;
          city: string;
          area_location: string;
          address: string | null;
          bedrooms: number;
          bathrooms: number;
          area: number;
          area_unit: Database["public"]["Enums"]["area_unit"];
          year_built: number | null;
          parking_spaces: number;
          status: Database["public"]["Enums"]["property_status"];
          has_parking: boolean;
          has_garden: boolean;
          has_swimming_pool: boolean;
          has_security: boolean;
          has_gym: boolean;
          is_furnished: boolean;
          has_air_conditioning: boolean;
          has_backup_power: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          agent_id: string;
          title: string;
          description?: string | null;
          property_type: Database["public"]["Enums"]["property_type"];
          listing_type: Database["public"]["Enums"]["listing_type"];
          price: number;
          city: string;
          area_location: string;
          address?: string | null;
          bedrooms?: number;
          bathrooms?: number;
          area: number;
          area_unit: Database["public"]["Enums"]["area_unit"];
          year_built?: number | null;
          parking_spaces?: number;
          status?: Database["public"]["Enums"]["property_status"];
          has_parking?: boolean;
          has_garden?: boolean;
          has_swimming_pool?: boolean;
          has_security?: boolean;
          has_gym?: boolean;
          is_furnished?: boolean;
          has_air_conditioning?: boolean;
          has_backup_power?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          agent_id?: string;
          title?: string;
          description?: string | null;
          property_type?: Database["public"]["Enums"]["property_type"];
          listing_type?: Database["public"]["Enums"]["listing_type"];
          price?: number;
          city?: string;
          area_location?: string;
          address?: string | null;
          bedrooms?: number;
          bathrooms?: number;
          area?: number;
          area_unit?: Database["public"]["Enums"]["area_unit"];
          year_built?: number | null;
          parking_spaces?: number;
          status?: Database["public"]["Enums"]["property_status"];
          has_parking?: boolean;
          has_garden?: boolean;
          has_swimming_pool?: boolean;
          has_security?: boolean;
          has_gym?: boolean;
          is_furnished?: boolean;
          has_air_conditioning?: boolean;
          has_backup_power?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      property_images: {
        Row: {
          id: string;
          property_id: string;
          image_url: string;
          storage_path: string | null;
          alt_text: string;
          label: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          image_url: string;
          storage_path?: string | null;
          alt_text?: string;
          label?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          property_id?: string;
          image_url?: string;
          storage_path?: string | null;
          alt_text?: string;
          label?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "property_images_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          property_id: string;
          agent_id: string;
          booking_date: string;
          booking_time: string;
          name: string;
          email: string;
          phone: string;
          message: string | null;
          status: Database["public"]["Enums"]["booking_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          property_id: string;
          // Filled from the property by the bookings_set_defaults trigger; clients cannot set it.
          agent_id?: string;
          booking_date: string;
          booking_time: string;
          name: string;
          email: string;
          phone: string;
          message?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          property_id?: string;
          agent_id?: string;
          booking_date?: string;
          booking_time?: string;
          name?: string;
          email?: string;
          phone?: string;
          message?: string | null;
          status?: Database["public"]["Enums"]["booking_status"];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_requests: {
        Row: {
          id: string;
          user_id: string | null;
          property_id: string | null;
          agent_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          message: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          property_id?: string | null;
          agent_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          message: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          property_id?: string | null;
          agent_id?: string | null;
          name?: string;
          email?: string;
          phone?: string | null;
          message?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "contact_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_requests_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "contact_requests_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "agents";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: "user" | "agent";
      property_type: "House" | "Apartment" | "Villa" | "Commercial";
      listing_type: "For Sale" | "For Rent";
      property_status: "available" | "pending" | "sold" | "rented";
      area_unit: "Marla" | "Kanal" | "sq ft";
      booking_status: "pending" | "confirmed" | "cancelled" | "completed";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

/** Row type of a table, e.g. `TableRow<"properties">`. */
export type TableRow<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
