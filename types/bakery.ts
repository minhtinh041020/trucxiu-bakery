export interface Category {
  id: string;
  name: string;
  sort_order?: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  costPrice?: number; // Giá vốn nguyên liệu làm bánh
  category: string;
  desc: string;
  img: string;
  inStock: boolean;
}

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
  costPrice?: number; // Giá vốn tại thời điểm bán
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

// KHO NGUYÊN VẬT LIỆU
export interface Ingredient {
  id: string;
  name: string;
  unit: string; // kg, g, hộp, lít, quả, cái...
  unitPrice: number; // Đơn giá nhập
  stockQty: number; // Tồn kho hiện tại
  minStockQty: number; // Ngưỡng cảnh báo cần nhập thêm
  supplier?: string; // Nhà cung cấp
  updated_at?: string;
}

// CHI PHÍ VẬN HÀNH (SỔ QUỸ CHI TIÊU)
export type ExpenseCategory =
  | 'ingredient' // Nhập nguyên liệu
  | 'packaging' // Hộp bánh, nơ, túi đựng
  | 'utilities' // Điện lò nướng, nước, gas
  | 'rent' // Thuê mặt bằng
  | 'salary' // Lương thợ bánh & nhân viên
  | 'marketing' // Quảng cáo, chụp ảnh mẫu
  | 'other'; // Chi phí khác

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string;
  created_at?: string;
}

// BÁO CÁO TÀI CHÍNH KẾ TOÁN (P&L STATEMENT)
export interface FinancialReport {
  totalRevenue: number; // Doanh thu thuần
  totalCOGS: number; // Tổng giá vốn bánh (nguyên vật liệu)
  grossProfit: number; // Lợi nhuận gộp (Doanh thu - Giá vốn)
  grossMargin: number; // Biên lợi nhuận gộp (%)
  totalExpenses: number; // Chi phí vận hành (Opex)
  netProfit: number; // Lợi nhuận ròng (Lãi thực nhận)
  netMargin: number; // Biên lợi nhuận ròng (%)
  inventoryValue: number; // Tổng giá trị kho nguyên liệu
}
