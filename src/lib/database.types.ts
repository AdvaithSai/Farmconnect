export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string
          role: 'farmer' | 'retailer'
          phone: string | null
          address: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          name: string
          role: 'farmer' | 'retailer'
          phone?: string | null
          address?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string
          role?: 'farmer' | 'retailer'
          phone?: string | null
          address?: string | null
        }
      }
      delivery_tracking: {
        Row: {
          id: string
          created_at: string
          transaction_id: string
          offer_id: string
          farmer_id: string
          retailer_id: string
          location_latitude: number | null
          location_longitude: number | null
          last_updated: string
          status: string
          delivered_at: string | null
          acknowledged_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          transaction_id: string
          offer_id: string
          farmer_id: string
          retailer_id: string
          location_latitude?: number | null
          location_longitude?: number | null
          last_updated?: string
          status?: string
          delivered_at?: string | null
          acknowledged_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          transaction_id?: string
          offer_id?: string
          farmer_id?: string
          retailer_id?: string
          location_latitude?: number | null
          location_longitude?: number | null
          last_updated?: string
          status?: string
          delivered_at?: string | null
          acknowledged_at?: string | null
        }
      }
      crops: {
        Row: {
          id: string
          created_at: string
          farmer_id: string
          name: string
          description: string
          quantity: number
          unit: string
          price_expectation: number | null
          location: string
          harvest_date: string
          status: 'available' | 'pending' | 'sold'
          image_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          farmer_id: string
          name: string
          description: string
          quantity: number
          unit: string
          price_expectation?: number | null
          location: string
          harvest_date: string
          status?: 'available' | 'pending' | 'sold'
          image_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          farmer_id?: string
          name?: string
          description?: string
          quantity?: number
          unit?: string
          price_expectation?: number | null
          location?: string
          harvest_date?: string
          status?: 'available' | 'pending' | 'sold'
          image_url?: string | null
        }
      }
      offers: {
        Row: {
          id: string
          created_at: string
          crop_id: string
          retailer_id: string
          price: number
          message: string | null
          status: 'pending' | 'accepted' | 'rejected' | 'completed'
        }
        Insert: {
          id?: string
          created_at?: string
          crop_id: string
          retailer_id: string
          price: number
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
        }
        Update: {
          id?: string
          created_at?: string
          crop_id?: string
          retailer_id?: string
          price?: number
          message?: string | null
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
        }
      }
      transactions: {
        Row: {
          id: string
          created_at: string
          offer_id: string
          payment_id: string | null
          amount: number
          status: 'pending' | 'completed' | 'failed'
        }
        Insert: {
          id?: string
          created_at?: string
          offer_id: string
          payment_id?: string | null
          amount: number
          status?: 'pending' | 'completed' | 'failed'
        }
        Update: {
          id?: string
          created_at?: string
          offer_id?: string
          payment_id?: string | null
          amount?: number
          status?: 'pending' | 'completed' | 'failed'
        }
      }
      chats: {
        Row: {
          id: string
          created_at: string
          crop_id: string
          farmer_id: string
          retailer_id: string
          last_message_at: string | null
          status: 'active' | 'archived'
        }
        Insert: {
          id?: string
          created_at?: string
          crop_id: string
          farmer_id: string
          retailer_id: string
          last_message_at?: string | null
          status?: 'active' | 'archived'
        }
        Update: {
          id?: string
          created_at?: string
          crop_id?: string
          farmer_id?: string
          retailer_id?: string
          last_message_at?: string | null
          status?: 'active' | 'archived'
        }
      }
      messages: {
        Row: {
          id: string
          created_at: string
          chat_id: string
          sender_id: string
          content: string
          message_type: 'text' | 'offer' | 'price_negotiation'
          offer_id: string | null
          price: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          chat_id: string
          sender_id: string
          content: string
          message_type?: 'text' | 'offer' | 'price_negotiation'
          offer_id?: string | null
          price?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          chat_id?: string
          sender_id?: string
          content?: string
          message_type?: 'text' | 'offer' | 'price_negotiation'
          offer_id?: string | null
          price?: number | null
        }
      }
    }
  }
}