import { Category, Order, Product, StoreSettings } from '@/types/bakery';
import { isSupabaseConfigured, supabase } from './supabase';

export const initialCategories: Category[] = [
  { id: 'cake', name: 'Bánh Sinh Nhật', sort_order: 1 },
  { id: 'pastry', name: 'Bánh Lạnh', sort_order: 2 },
  { id: 'gift', name: 'Set Quà Tặng', sort_order: 3 },
];

export const initialProducts: Product[] = [
  {
    id: 1,
    name: 'Strawberry Shortcake',
    price: 145000,
    category: 'cake',
    desc: 'Cốt bánh vanilla bông xốp, dâu tây Đà Lạt tươi cắt lát xen kẽ cùng lớp kem tươi whipping cream đánh bông mềm mịn. Vị ngọt thanh, ít béo.',
    img: 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?auto=format&fit=crop&w=600&q=80',
    inStock: true,
  },
  {
    id: 2,
    name: 'Burnt Cheesecake',
    price: 165000,
    category: 'pastry',
    desc: 'Cheesecake cháy mặt kiểu Basque. Bên ngoài hơi xém thơm mùi caramel, bên trong nhân phô mai đặc sánh tan chảy. Ăn kèm sốt dâu rừng tự nấu.',
    img: 'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=600&q=80',
    inStock: true,
  },
  {
    id: 3,
    name: 'Tiramisu Classic',
    price: 150000,
    category: 'pastry',
    desc: 'Bánh ladyfinger ngâm đẫm cà phê espresso nguyên chất, xen kẽ kem mascarpone béo ngậy và bột cacao đậm vị.',
    img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
    inStock: true,
  },
  {
    id: 4,
    name: 'Set Macaron Paris',
    price: 220000,
    category: 'gift',
    desc: 'Hộp 6 bánh macaron thủ công vỏ giòn tan, nhân ganache các vị: matcha, chanh dây, dâu tây, chocolate đen, earl grey, vanilla.',
    img: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=600&q=80',
    inStock: true,
  },
];

export const initialOrders: Order[] = [
  {
    id: 'TX-9901',
    type: 'regular',
    customer: { name: 'Nguyễn Thảo Vy', phone: '0934888123' },
    items: [
      {
        name: 'Strawberry Shortcake',
        qty: 1,
        price: 145000,
        img: 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?auto=format&fit=crop&w=600&q=80',
      },
    ],
    total: 145000,
    note: 'Ghi chữ Happy Birthday em yêu màu hồng nhé tiệm.',
    status: 'pending',
    time: '10:30 Hôm nay',
    created_at: new Date().toISOString(),
  },
  {
    id: 'TX-9902',
    type: 'regular',
    customer: { name: 'Lê Minh Tuấn', phone: '0905771992' },
    items: [
      {
        name: 'Tiramisu Classic',
        qty: 1,
        price: 150000,
        img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80',
      },
      {
        name: 'Burnt Cheesecake',
        qty: 2,
        price: 165000,
        img: 'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=600&q=80',
      },
    ],
    total: 480000,
    note: 'Shipper gọi trước khi giao 15 phút.',
    status: 'completed',
    time: 'Hôm qua',
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'TX-9903',
    type: 'regular',
    customer: { name: 'Đào Hoàng Nam', phone: '0912334455' },
    items: [
      {
        name: 'Set Macaron Paris',
        qty: 1,
        price: 220000,
        img: 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=600&q=80',
      },
    ],
    total: 220000,
    note: 'Đóng gói quà tặng sinh nhật kỹ nhé.',
    status: 'processing',
    time: '09:15 Hôm nay',
    created_at: new Date().toISOString(),
  },
  {
    id: 'TX-EV-55',
    type: 'bulk',
    customer: { name: 'Chị Mai (Teabreak VP)', phone: '0988999000' },
    items: [
      { name: 'Teabreak 60 phần bánh hỗn hợp nhỏ cho sự kiện', qty: 1, price: 0 },
    ],
    total: 0,
    note: 'Cần báo giá tiệc trà teabreak tiếp khách vào tuần sau, liên hệ gửi mail mẫu bánh.',
    status: 'pending',
    time: '08:00 Hôm nay',
    created_at: new Date().toISOString(),
  },
];

export const initialSettings: StoreSettings = {
  name: 'Trúc Xíu Bakery',
  slogan: 'Mỗi chiếc bánh, một câu chuyện ngọt ngào',
  avatar: '/avatar.jpg',
  hero: '/trucwork.png',
  phone: '0909 999 999',
  hours: '08:00 - 22:00',
  address: '123 Đường Bánh Ngọt, Quận 1, TP.HCM',
  zalo: 'https://zalo.me/yourphone',
  fb: 'https://facebook.com',
  ig: 'https://instagram.com',
  tiktok: 'https://tiktok.com',
};

const notifyLocalChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('bakery-storage-sync'));
  }
};

export const DataService = {
  // PRODUCTS
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('id', { ascending: true });
        if (!error && data && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price),
            category: item.category,
            desc: item.desc || '',
            img: item.img,
            inStock: item.in_stock ?? true,
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch products error, fallback to local', e);
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('TX_PRODUCTS');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      localStorage.setItem('TX_PRODUCTS', JSON.stringify(initialProducts));
    }
    return initialProducts;
  },

  async saveProducts(products: Product[]): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('TX_PRODUCTS', JSON.stringify(products));
      notifyLocalChange();
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        // Upsert list
        const dbItems = products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          desc: p.desc,
          img: p.img,
          in_stock: p.inStock,
        }));
        await supabase.from('products').upsert(dbItems);
      } catch (e) {
        console.error('Supabase saveProducts error', e);
      }
    }
  },

  async addOrUpdateProduct(product: Product): Promise<void> {
    const list = await this.getProducts();
    const index = list.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (index >= 0) {
      updated = [...list];
      updated[index] = product;
    } else {
      updated = [product, ...list];
    }
    await this.saveProducts(updated);
  },

  async deleteProduct(id: number): Promise<void> {
    const list = await this.getProducts();
    const updated = list.filter((p) => p.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('TX_PRODUCTS', JSON.stringify(updated));
      notifyLocalChange();
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase deleteProduct error', e);
      }
    }
  },

  // CATEGORIES
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase fetch categories error, fallback to local', e);
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('TX_CATEGORIES');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      localStorage.setItem('TX_CATEGORIES', JSON.stringify(initialCategories));
    }
    return initialCategories;
  },

  async saveCategories(categories: Category[]): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('TX_CATEGORIES', JSON.stringify(categories));
      notifyLocalChange();
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('categories').upsert(categories);
      } catch (e) {
        console.error('Supabase saveCategories error', e);
      }
    }
  },

  async deleteCategory(id: string): Promise<void> {
    const list = await this.getCategories();
    const updated = list.filter((c) => c.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('TX_CATEGORIES', JSON.stringify(updated));
      notifyLocalChange();
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (e) {
        console.error('Supabase deleteCategory error', e);
      }
    }
  },

  // ORDERS
  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data && data.length > 0) {
          return data.map((o) => ({
            id: o.id,
            type: o.type,
            customer: o.customer,
            items: o.items,
            total: Number(o.total),
            note: o.note || '',
            status: o.status,
            time: o.time || 'Vừa xong',
            created_at: o.created_at,
          }));
        }
      } catch (e) {
        console.warn('Supabase fetch orders error, fallback to local', e);
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('TX_ORDERS');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
      localStorage.setItem('TX_ORDERS', JSON.stringify(initialOrders));
    }
    return initialOrders;
  },

  async createOrder(order: Order): Promise<void> {
    const list = await this.getOrders();
    const updated = [order, ...list];
    if (typeof window !== 'undefined') {
      localStorage.setItem('TX_ORDERS', JSON.stringify(updated));
      notifyLocalChange();
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('orders').insert({
          id: order.id,
          type: order.type,
          customer: order.customer,
          items: order.items,
          total: order.total,
          note: order.note,
          status: order.status,
          time: order.time,
        });
      } catch (e) {
        console.error('Supabase createOrder error', e);
      }
    }
  },

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const list = await this.getOrders();
    const updated = list.map((o) => (o.id === id ? { ...o, status } : o));
    if (typeof window !== 'undefined') {
      localStorage.setItem('TX_ORDERS', JSON.stringify(updated));
      notifyLocalChange();
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('orders').update({ status }).eq('id', id);
      } catch (e) {
        console.error('Supabase updateOrderStatus error', e);
      }
    }
  },

  // STORE SETTINGS
  async getSettings(): Promise<StoreSettings> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('*')
          .eq('id', 'default')
          .single();
        if (!error && data && data.settings) {
          return { ...initialSettings, ...data.settings };
        }
      } catch (e) {
        console.warn('Supabase fetch settings error, fallback to local', e);
      }
    }

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('TX_SETTINGS');
      if (saved) {
        try {
          return { ...initialSettings, ...JSON.parse(saved) };
        } catch {}
      }
      localStorage.setItem('TX_SETTINGS', JSON.stringify(initialSettings));
    }
    return initialSettings;
  },

  async saveSettings(settings: StoreSettings): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem('TX_SETTINGS', JSON.stringify(settings));
      notifyLocalChange();
    }
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.from('store_settings').upsert({
          id: 'default',
          settings: settings,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Supabase saveSettings error', e);
      }
    }
  },

  // REALTIME SUBSCRIPTION HELPER
  subscribeRealtime(callback: () => void): () => void {
    if (isSupabaseConfigured() && supabase) {
      const client = supabase;
      const channel = client
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          () => {
            callback();
          }
        )
        .subscribe();

      const localListener = () => callback();
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', localListener);
        window.addEventListener('bakery-storage-sync', localListener);
      }

      return () => {
        client.removeChannel(channel);
        if (typeof window !== 'undefined') {
          window.removeEventListener('storage', localListener);
          window.removeEventListener('bakery-storage-sync', localListener);
        }
      };
    }

    const localListener = () => callback();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', localListener);
      window.addEventListener('bakery-storage-sync', localListener);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', localListener);
        window.removeEventListener('bakery-storage-sync', localListener);
      }
    };
  },
};
