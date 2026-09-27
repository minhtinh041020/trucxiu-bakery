-- SCHEMA SETUP FOR TRÚC XÍU BAKERY (SUPABASE / POSTGRESQL)

-- 1. BẢNG CATEGORIES (Nhóm bánh)
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. BẢNG PRODUCTS (Thực đơn bánh)
CREATE TABLE IF NOT EXISTS public.products (
    id BIGINT PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    "desc" TEXT,
    img TEXT NOT NULL,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. BẢNG ORDERS (Đơn hàng Online & Sự kiện)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'regular', -- 'regular' | 'bulk'
    customer JSONB NOT NULL,              -- { name, phone }
    items JSONB NOT NULL,                 -- [ { name, qty, price, img } ]
    total NUMERIC NOT NULL DEFAULT 0,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'shipping' | 'completed' | 'contacted' | 'cancelled'
    time TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. BẢNG STORE_SETTINGS (Cấu hình website)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    settings JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- BẬT ROW LEVEL SECURITY (RLS)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- POLICIES: Cho phép đọc/ghi công khai (hoặc gắn Auth khi cần)
CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public write categories" ON public.categories FOR ALL USING (true);

CREATE POLICY "Public read products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public write products" ON public.products FOR ALL USING (true);

CREATE POLICY "Public read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Public write orders" ON public.orders FOR ALL USING (true);

CREATE POLICY "Public read store_settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public write store_settings" ON public.store_settings FOR ALL USING (true);

-- BẬT REALTIME CHO CÁC BẢNG (Để Admin nhận đơn không cần F5)
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;

-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
INSERT INTO public.categories (id, name, sort_order) VALUES
('cake', 'Bánh Sinh Nhật', 1),
('pastry', 'Bánh Lạnh', 2),
('gift', 'Set Quà Tặng', 3)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, name, price, category, "desc", img, in_stock) VALUES
(1, 'Strawberry Shortcake', 145000, 'cake', 'Cốt bánh vanilla bông xốp, dâu tây Đà Lạt tươi cắt lát xen kẽ cùng lớp kem tươi whipping cream đánh bông mềm mịn. Vị ngọt thanh, ít béo.', 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?auto=format&fit=crop&w=600&q=80', true),
(2, 'Burnt Cheesecake', 165000, 'pastry', 'Cheesecake cháy mặt kiểu Basque. Bên ngoài hơi xém thơm mùi caramel, bên trong nhân phô mai đặc sánh tan chảy. Ăn kèm sốt dâu rừng tự nấu.', 'https://images.unsplash.com/photo-1464306076886-da185f6a9d05?auto=format&fit=crop&w=600&q=80', true),
(3, 'Tiramisu Classic', 150000, 'pastry', 'Bánh ladyfinger ngâm đẫm cà phê espresso nguyên chất, xen kẽ kem mascarpone béo ngậy và bột cacao đậm vị.', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80', true),
(4, 'Set Macaron Paris', 220000, 'gift', 'Hộp 6 bánh macaron thủ công vỏ giòn tan, nhân ganache các vị: matcha, chanh dây, dâu tây, chocolate đen, earl grey, vanilla.', 'https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&w=600&q=80', true)
ON CONFLICT (id) DO NOTHING;
