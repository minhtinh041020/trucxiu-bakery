export interface Category {
  id: string;
  name: string;
  sort_order?: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  desc: string;
  img: string;
  inStock: boolean;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  img?: string;
}

export interface CustomerInfo {
  name: string;
  phone: string;
}

export type OrderType = 'regular' | 'bulk';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipping'
  | 'completed'
  | 'contacted'
  | 'cancelled';

export interface Order {
  id: string;
  type: OrderType;
  customer: CustomerInfo;
  items: OrderItem[];
  total: number;
  note: string;
  status: OrderStatus;
  time: string;
  created_at?: string;
}

export interface StoreSettings {
  name: string;
  slogan: string;
  avatar: string;
  hero: string;
  phone: string;
  hours: string;
  address: string;
  zalo: string;
  fb: string;
  ig: string;
  tiktok: string;
}
