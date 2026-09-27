# 🍰 TRÚC XÍU BAKERY - HƯỚNG DẪN CÀI ĐẶT & DEPLOY LÊN WEB

Dự án đã được chuyển đổi hoàn toàn từ 2 file HTML tĩnh (`bakery.html` & `admin.html`) sang **Next.js 16 + React 19 + TypeScript + Tailwind CSS** và sẵn sàng kết nối **Supabase Cloud Database (Realtime)**.

---

## 🌟 1. Trải nghiệm ngay trên máy tính (Local)

Máy chủ dev hiện đang chạy sẵn tại:
* 🌐 **Trang mua hàng của Khách:** [http://localhost:3000](http://localhost:3000)
* 🔐 **Trang Quản trị của Chủ tiệm:** [http://localhost:3000/admin](http://localhost:3000/admin)
  * **Mã PIN đăng nhập mặc định:** `123456`

*(Nếu cần khởi động lại dev server sau này, chỉ cần mở terminal chạy: `npm run dev`)*

---

## ☁️ 2. Kết nối Database Cloud Supabase (Để đồng bộ giữa Khách & Admin trên mọi thiết bị)

Hiện tại hệ thống đang chạy ở chế độ **Local Storage fallback** (dùng thử nghiệm độc lập trên từng máy).  
Để khi khách đặt hàng trên điện thoại mà máy tính Admin nhận được thông báo "ting ting" ngay lập tức, hãy làm 3 bước đơn giản sau:

### Bước 2.1: Tạo tài khoản & Dự án Supabase (Miễn phí 100%)
1. Truy cập [https://supabase.com](https://supabase.com) và bấm **Start your project** (đăng nhập bằng GitHub hoặc Email).
2. Tạo New Project: Đặt tên ví dụ `trucxin-bakery`, chọn khu vực `Singapore` (gần Việt Nam nhất, tốc độ nhanh nhất).

### Bước 2.2: Tạo bảng dữ liệu (Copy & Paste 1 lần)
1. Ở thanh menu bên trái Supabase, chọn **SQL Editor**.
2. Mở file [supabase/schema.sql](file:///d:/CTY%20CASUMINA/CTY/BFO-FE/Bakery-template/supabase/schema.sql) trong thư mục dự án này, copy toàn bộ nội dung.
3. Dán vào ô SQL Editor của Supabase và bấm **Run**.  
   *(Lệnh này sẽ tự động tạo bảng `categories`, `products`, `orders`, `store_settings`, bật Realtime và nạp sẵn 4 mẫu bánh mẫu)*.

### Bước 2.3: Lấy API Key và dán vào dự án
1. Trên Supabase, vào **Project Settings** (biểu tượng bánh răng) $\rightarrow$ **API**.
2. Copy 2 thông tin:
   * **Project URL**
   * **anon public key**
3. Mở file [.env.local](file:///d:/CTY%20CASUMINA/CTY/BFO-FE/Bakery-template/.env.local) trong dự án và dán vào:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
   NEXT_PUBLIC_ADMIN_PIN=123456
   ```
4. Lưu file. Hệ thống sẽ tự động chuyển sang chế độ **Cloud Realtime DB**!

---

## 🚀 3. Hướng dẫn Deploy lên Web miễn phí (Vercel)

Vercel là nền tảng máy chủ chính thức của Next.js, miễn phí trọn đời cho dự án cá nhân:

### Cách 1: Deploy qua GitHub (Khuyên dùng - tự động cập nhật khi sửa code)
1. Đẩy mã nguồn thư mục này lên một repository trên GitHub của bạn.
2. Vào [https://vercel.com](https://vercel.com), bấm **Add New** $\rightarrow$ **Project**.
3. Chọn repo `Bakery-template` vừa tạo.
4. Ở mục **Environment Variables**, thêm 3 biến:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `NEXT_PUBLIC_ADMIN_PIN`
5. Bấm **Deploy**. Sau khoảng 1 phút, bạn sẽ nhận được link web chính thức dạng `https://ten-tiem-banh.vercel.app` có HTTPS đầy đủ!

### Cách 2: Deploy trực tiếp bằng Vercel CLI (Không cần GitHub)
Chạy lệnh sau trong terminal:
```bash
npx vercel
```
Làm theo hướng dẫn trên màn hình (đăng nhập và chọn Yes để deploy).

---

## 📁 4. Cấu trúc mã nguồn sau khi chuyển đổi

* [app/page.tsx](file:///d:/CTY%20CASUMINA/CTY/BFO-FE/Bakery-template/app/page.tsx): Toàn bộ trang Storefront (Menu bánh, giỏ hàng, đặt hàng online, đặt tiệc sự kiện).
* [app/admin/page.tsx](file:///d:/CTY%20CASUMINA/CTY/BFO-FE/Bakery-template/app/admin/page.tsx): Toàn bộ trang Admin (Bảo vệ bằng mã PIN, thống kê doanh thu, quản lý đơn hàng theo quy trình: Chờ duyệt $\rightarrow$ Làm bánh $\rightarrow$ Giao hàng $\rightarrow$ Hoàn tất, CRUD menu bánh, nhóm bánh, cấu hình tiệm, in hóa đơn).
* [lib/dataService.ts](file:///d:/CTY%20CASUMINA/CTY/BFO-FE/Bakery-template/lib/dataService.ts): Tầng xử lý dữ liệu thông minh (chuyển đổi mượt mà giữa Cloud Database và Local Storage).
* [lib/supabase.ts](file:///d:/CTY%20CASUMINA/CTY/BFO-FE/Bakery-template/lib/supabase.ts): Kết nối Supabase SDK.
* [supabase/schema.sql](file:///d:/CTY%20CASUMINA/CTY/BFO-FE/Bakery-template/supabase/schema.sql): Script tạo Database trên Supabase.
