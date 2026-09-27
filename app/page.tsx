'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Category, Order, Product, StoreSettings } from '@/types/bakery';
import { DataService, initialCategories, initialProducts, initialSettings } from '@/lib/dataService';

export default function StorefrontPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priceRange, setPriceRange] = useState<'all' | 'under100' | '100to200' | 'above200'>('all');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');

  // Cart state
  interface CartItem extends Product {
    qty: number;
  }
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Modal product preview
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Forms
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false);

  // Event form
  const [eventName, setEventName] = useState<string>('');
  const [eventPhone, setEventPhone] = useState<string>('');
  const [eventNote, setEventNote] = useState<string>('');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState<boolean>(false);

  // Mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadData = async () => {
    const [prods, cats, sett] = await Promise.all([
      DataService.getProducts(),
      DataService.getCategories(),
      DataService.getSettings(),
    ]);
    setProducts(prods);
    setCategories(cats);
    setSettings(sett);
  };

  useEffect(() => {
    loadData();
    const unsubscribe = DataService.subscribeRealtime(() => {
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val) + 'đ';
  };

  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalCartPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const addToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    showToast(`Đã thêm ${product.name} vào giỏ`);
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleCheckout = async () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Vui lòng điền đầy đủ Tên và Số điện thoại nhận hàng nhé!');
      return;
    }
    if (cart.length === 0) return;

    setIsCheckingOut(true);

    const newOrder: Order = {
      id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
      type: 'regular',
      customer: {
        name: customerName.trim(),
        phone: customerPhone.trim(),
      },
      items: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        price: i.price,
        img: i.img,
      })),
      total: totalCartPrice,
      note: orderNote.trim() || 'Không có ghi chú dặn dò',
      status: 'pending',
      time:
        new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' Hôm nay',
      created_at: new Date().toISOString(),
    };

    await DataService.createOrder(newOrder);

    setIsCheckingOut(false);
    setCart([]);
    setIsCartOpen(false);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNote('');
    showToast(`Cảm ơn ${customerName}! Đơn hàng #${newOrder.id} đã được tạo thành công.`);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim() || !eventPhone.trim() || !eventNote.trim()) {
      alert('Vui lòng nhập đầy đủ Tên, Số điện thoại và Yêu cầu sự kiện nhé!');
      return;
    }

    setIsSubmittingEvent(true);
    const newEventOrder: Order = {
      id: 'TX-EV-' + Math.floor(10 + Math.random() * 90),
      type: 'bulk',
      customer: {
        name: eventName.trim(),
        phone: eventPhone.trim(),
      },
      items: [{ name: 'Yêu cầu đặt bánh sự kiện / số lượng lớn', qty: 1, price: 0 }],
      total: 0,
      note: eventNote.trim(),
      status: 'pending',
      time:
        new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        }) + ' Hôm nay',
      created_at: new Date().toISOString(),
    };

    await DataService.createOrder(newEventOrder);

    setIsSubmittingEvent(false);
    setEventName('');
    setEventPhone('');
    setEventNote('');
    showToast(`Cảm ơn ${newEventOrder.customer.name}! Tiệm sẽ liên hệ sớm nhất.`);
  };

  const filteredProducts = products
    .filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.desc.toLowerCase().includes(searchQuery.toLowerCase());

      let matchPrice = true;
      if (priceRange === 'under100') matchPrice = p.price < 100000;
      else if (priceRange === '100to200') matchPrice = p.price >= 100000 && p.price <= 200000;
      else if (priceRange === 'above200') matchPrice = p.price > 200000;

      const matchStock = inStockOnly ? p.inStock : true;

      return matchCat && matchSearch && matchPrice && matchStock;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'vi');
      return 0;
    });

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    searchQuery.trim() !== '' ||
    priceRange !== 'all' ||
    inStockOnly ||
    sortBy !== 'default';

  const resetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setPriceRange('all');
    setInStockOnly(false);
    setSortBy('default');
  };

  return (
    <div className="min-h-screen bg-[#faf8f7] text-[#5c4d4d] flex flex-col selection:bg-[#e6a8b7] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center gap-3 bg-white px-5 py-3.5 rounded-2xl shadow-xl border-l-4 border-[#e6a8b7] animate-bounce">
          <i className="ph-fill ph-check-circle text-2xl text-[#e6a8b7]"></i>
          <span className="text-xs md:text-sm font-bold text-[#5c4d4d]">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Notice */}
      <div className="bg-[#f7ecee] border-b border-[#eee1e4] py-2 px-4 text-center text-xs font-semibold text-[#8b656f] flex items-center justify-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-[#d495a4] animate-ping"></span>
        <span>Ưu đãi ngọt ngào: Miễn phí giao hàng cho đơn bánh từ 300.000đ khu vực nội thành</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#eee2da] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Store Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <img
              src={settings.avatar || '/avatar.jpg'}
              alt={settings.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#e6a8b7] shadow-sm group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-serif-title font-bold text-xl md:text-2xl text-[#5c4d4d] block tracking-wide">
                {settings.name}
              </span>
              <span className="text-[11px] text-[#9c8e8e] font-medium block">
                {settings.slogan}
              </span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center relative flex-1 max-w-md mx-6">
            <i className="ph ph-magnifying-glass absolute left-4 text-gray-400 text-lg"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mẫu bánh yêu thích..."
              className="w-full pl-11 pr-4 py-2.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#e6a8b7] focus:bg-white transition-all text-[#5c4d4d]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
            <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-[#5c4d4d] mr-2">
              <a href="#menu" className="hover:text-[#e6a8b7] transition-colors">
                Thực đơn
              </a>
              <a href="#story" className="hover:text-[#e6a8b7] transition-colors">
                Về tiệm
              </a>
              <a href="#event" className="hover:text-[#e6a8b7] transition-colors">
                Đặt tiệc sự kiện
              </a>
            </nav>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 rounded-full bg-[#f7ecee] text-[#5c4d4d] hover:bg-[#e6a8b7] hover:text-white transition-colors"
              title="Giỏ hàng"
            >
              <i className="ph ph-shopping-bag text-2xl"></i>
              {totalCartQty > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#e6a8b7] text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {totalCartQty}
                </span>
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#5c4d4d] hover:text-[#e6a8b7]"
            >
              <i className="ph ph-list text-2xl"></i>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm mẫu bánh..."
              className="w-full pl-10 pr-3 py-2 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#e6a8b7] text-[#5c4d4d]"
            />
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3">
            <a
              href="#menu"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-bold text-[#5c4d4d] py-1"
            >
              Thực đơn bánh
            </a>
            <a
              href="#story"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-bold text-[#5c4d4d] py-1"
            >
              Về tiệm bánh
            </a>
            <a
              href="#event"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-sm font-bold text-[#5c4d4d] py-1"
            >
              Đặt tiệc & Sự kiện
            </a>
          </div>
        )}
      </header>

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-8 pb-14 md:py-16 bg-gradient-to-b from-[#faf8f7] via-[#fcf5f6] to-[#faf8f7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f4dfe1] text-[#c77f8e] text-xs font-bold uppercase tracking-wider">
                <i className="ph-fill ph-sparkle"></i> Tiệm bánh thủ công phong cách Hàn Quốc
              </span>
              <h1 className="font-serif-title text-3xl sm:text-4xl lg:text-5xl font-bold text-[#5c4d4d] leading-tight">
                Ngọt ngào từng lớp bánh, <br className="hidden sm:block" />
                <span className="text-[#d495a4] italic font-normal">
                  trọn vẹn từng khoảnh khắc
                </span>
              </h1>
              <p className="text-sm sm:text-base text-[#9c8e8e] font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Tại {settings.name}, mỗi chiếc bánh đều được tạo nên từ nguyên liệu tươi ngon nhất,
                cốt bánh mềm mịn, ít ngọt chuẩn gu hiện đại, mang đến trải nghiệm tinh tế cho mọi dịp
                đặc biệt của bạn.
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#menu"
                  className="px-7 py-3 rounded-full bg-[#5c4d4d] text-white hover:bg-[#e6a8b7] text-xs sm:text-sm font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <i className="ph ph-cake text-lg"></i> Xem Thực Đơn Bánh
                </a>
                <a
                  href="#event"
                  className="px-7 py-3 rounded-full bg-white text-[#5c4d4d] border border-[#eee2da] hover:border-[#e6a8b7] text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-2"
                >
                  <i className="ph ph-crown text-lg text-[#d495a4]"></i> Đặt Tiệc Sự Kiện
                </a>
              </div>
            </div>

            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-white">
                <img
                  src={settings.hero || '/trucwork.png'}
                  alt="Trúc Xíu Bakery"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-2 sm:bottom-4 sm:left-4 bg-white/95 backdrop-blur-sm p-3.5 rounded-2xl shadow-xl border border-pink-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f4dfe1] text-[#c77f8e] flex items-center justify-center text-xl shrink-0">
                  <i className="ph-fill ph-heart"></i>
                </div>
                <div>
                  <b className="block text-xs font-bold text-[#5c4d4d]">100% Tươi Mới Mỗi Ngày</b>
                  <span className="text-[10px] text-[#9c8e8e]">Bánh nướng thủ công trong ngày</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Menu Section */}
      <section id="menu" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-1">
        <div className="text-center space-y-2 mb-8">
          <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#5c4d4d]">
            Thực Đơn Bánh Ngọt
          </h2>
          <p className="text-xs sm:text-sm text-[#9c8e8e]">
            Chọn nhóm sản phẩm hoặc tìm mẫu bánh yêu thích của bạn
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 hide-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#5c4d4d] text-white shadow-sm'
                : 'bg-white text-[#9c8e8e] border border-gray-200 hover:border-[#e6a8b7]'
            }`}
          >
            Tất cả bánh ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#5c4d4d] text-white shadow-sm'
                    : 'bg-white text-[#9c8e8e] border border-gray-200 hover:border-[#e6a8b7]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search & Advanced Filters Bar */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#eee2da] shadow-xs mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <i className="ph ph-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bánh kem bắp, dâu tây, croissant, tiramisu..."
                className="w-full bg-[#fbf6f0] border border-[#eee2da] py-2.5 pl-10 pr-9 rounded-2xl text-xs font-bold outline-none focus:border-[#d993a1] focus:bg-white text-[#5c4d4d] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <i className="ph ph-x-circle text-base"></i>
                </button>
              )}
            </div>

            {/* Price Filter & Sort Dropdowns */}
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              {/* Price Filter */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value as any)}
                  className="w-full bg-[#fbf6f0] border border-[#eee2da] py-2.5 px-3.5 rounded-2xl text-xs font-bold text-[#5c4d4d] outline-none focus:border-[#d993a1] cursor-pointer"
                >
                  <option value="all">Mọi mức giá</option>
                  <option value="under100">Dưới 100.000đ</option>
                  <option value="100to200">100.000đ - 200.000đ</option>
                  <option value="above200">Trên 200.000đ</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-[#fbf6f0] border border-[#eee2da] py-2.5 px-3.5 rounded-2xl text-xs font-bold text-[#5c4d4d] outline-none focus:border-[#d993a1] cursor-pointer"
                >
                  <option value="default">Sắp xếp: Mặc định</option>
                  <option value="price-asc">Giá: Thấp đến cao</option>
                  <option value="price-desc">Giá: Cao đến thấp</option>
                  <option value="name">Tên: A - Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Filter Tags & Reset */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-gray-100 text-xs">
            <div className="flex items-center gap-3">
              {/* In-stock toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-[#5c4d4d]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-[#c77f8e] focus:ring-[#c77f8e] accent-[#c77f8e]"
                />
                <span>Chỉ hiện bánh còn hàng</span>
              </label>

              {/* Price quick tags */}
              <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-gray-200">
                <span className="text-[11px] text-[#9c8e8e]">Khoảng giá:</span>
                {[
                  { id: 'under100', label: '< 100k' },
                  { id: '100to200', label: '100k - 200k' },
                  { id: 'above200', label: '> 200k' },
                ].map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => setPriceRange(priceRange === tag.id ? 'all' : (tag.id as any))}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                      priceRange === tag.id
                        ? 'bg-[#c77f8e] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#9c8e8e]">
              <span>
                Tìm thấy <b className="text-[#5c4d4d]">{filteredProducts.length}</b> món bánh
              </span>
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="text-[#c77f8e] font-bold hover:underline ml-2 flex items-center gap-1 cursor-pointer"
                >
                  <i className="ph ph-arrow-counter-clockwise"></i> Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200 my-8">
            <i className="ph ph-cake text-5xl text-gray-300 mb-2 block"></i>
            <p className="text-sm font-bold text-[#5c4d4d]">Không tìm thấy mẫu bánh nào</p>
            <p className="text-xs text-[#9c8e8e] mt-1">Hãy thử tìm từ khóa khác nhé!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => setSelectedProduct(prod)}
                className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col group"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={prod.img}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {!prod.inStock && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-red-500 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Tạm hết bánh
                      </span>
                    </div>
                  )}
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[10px] font-bold text-[#8b656f] px-2.5 py-1 rounded-full uppercase shadow-xs">
                    {categories.find((c) => c.id === prod.category)?.name || prod.category}
                  </span>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-serif-title font-bold text-base text-[#5c4d4d] line-clamp-1 group-hover:text-[#d495a4] transition-colors">
                      {prod.name}
                    </h3>
                    <p className="text-xs text-[#9c8e8e] line-clamp-2 mt-1 leading-relaxed">
                      {prod.desc}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="font-bold text-sm sm:text-base text-[#5c4d4d]">
                      {formatPrice(prod.price)}
                    </span>
                    <button
                      onClick={(e) => addToCart(prod, e)}
                      disabled={!prod.inStock}
                      className="px-3.5 py-1.5 rounded-full bg-[#f7ecee] hover:bg-[#e6a8b7] text-[#5c4d4d] hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <i className="ph ph-plus-circle text-base"></i> Thêm
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Story / About Section */}
      <section id="story" className="py-14 bg-white border-y border-[#eee2da]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-3xl bg-[#faf8f7] space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f4dfe1] text-[#c77f8e] flex items-center justify-center text-2xl">
                <i className="ph ph-heart"></i>
              </div>
              <h3 className="font-serif-title font-bold text-lg text-[#5c4d4d]">
                Công Thức Ít Ngọt
              </h3>
              <p className="text-xs text-[#9c8e8e] leading-relaxed">
                Được điều chỉnh tỉ lệ đường và chất béo thanh nhẹ, hợp khẩu vị người Việt yêu thích
                sự tinh tế.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#faf8f7] space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f4dfe1] text-[#c77f8e] flex items-center justify-center text-2xl">
                <i className="ph ph-sparkle"></i>
              </div>
              <h3 className="font-serif-title font-bold text-lg text-[#5c4d4d]">
                Trang Trí Theo Yêu Cầu
              </h3>
              <p className="text-xs text-[#9c8e8e] leading-relaxed">
                Từng chiếc bánh sinh nhật được viết chữ, cắm hoa, phối màu tone pastel độc đáo theo
                ý bạn.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#faf8f7] space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f4dfe1] text-[#c77f8e] flex items-center justify-center text-2xl">
                <i className="ph ph-moped"></i>
              </div>
              <h3 className="font-serif-title font-bold text-lg text-[#5c4d4d]">
                Giao Hàng Đúng Giờ
              </h3>
              <p className="text-xs text-[#9c8e8e] leading-relaxed">
                Đóng gói hộp cao cấp, shipper cẩn thận giữ trọn vẹn dáng bánh đến tận tay bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bulk / Event Catering Form Section */}
      <section id="event" className="py-14 max-w-5xl mx-auto px-4 sm:px-6 w-full">
        <div className="bg-[#fffdf9] border border-[#eee2da] rounded-3xl p-6 sm:p-10 shadow-xs">
          <div className="max-w-2xl mx-auto text-center space-y-2 mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-[#f6f0fb] text-[#8e6fad] text-xs font-bold uppercase tracking-wider">
              Dịch vụ tiệc & Doanh nghiệp
            </span>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#59453f]">
              Đặt Bánh Tiệc Trà & Sự Kiện
            </h2>
            <p className="text-xs sm:text-sm text-[#9b8982]">
              Tiệm cung cấp teabreak, bánh hội nghị, sinh nhật công ty số lượng lớn với menu riêng
              và ưu đãi hấp dẫn.
            </p>
          </div>

          <form onSubmit={handleEventSubmit} className="max-w-xl mx-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#59453f] mb-1.5">
                  Tên của bạn / Tên đơn vị *
                </label>
                <input
                  type="text"
                  required
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Ví dụ: Chị Mai (Cty ABC)"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#eee2da] bg-white text-xs font-medium focus:outline-none focus:border-[#d993a1] text-[#59453f]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#59453f] mb-1.5">
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  required
                  value={eventPhone}
                  onChange={(e) => setEventPhone(e.target.value)}
                  placeholder="Ví dụ: 0988 999 000"
                  className="w-full px-4 py-2.5 rounded-2xl border border-[#eee2da] bg-white text-xs font-medium focus:outline-none focus:border-[#d993a1] text-[#59453f]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#59453f] mb-1.5">
                Yêu cầu sự kiện & Ngày tổ chức *
              </label>
              <textarea
                required
                rows={3}
                value={eventNote}
                onChange={(e) => setEventNote(e.target.value)}
                placeholder="Ví dụ: Cần 50 phần teabreak cho hội thảo vào thứ 6 tuần tới, ngân sách khoảng..."
                className="w-full px-4 py-2.5 rounded-2xl border border-[#eee2da] bg-white text-xs font-medium focus:outline-none focus:border-[#d993a1] text-[#59453f]"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={isSubmittingEvent}
              className="w-full py-3.5 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              {isSubmittingEvent ? (
                <>
                  <i className="ph ph-spinner animate-spin text-lg"></i> Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <i className="ph ph-paper-plane-tilt text-lg"></i> Gửi Yêu Cầu Tư Vấn Tiệc
                </>
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#eee2da] pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-gray-100">
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={settings.avatar || '/avatar.jpg'}
                  alt={settings.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#e6a8b7]"
                />
                <h3 className="font-serif-title font-bold text-xl text-[#5c4d4d]">
                  {settings.name}
                </h3>
              </div>
              <p className="text-xs text-[#9c8e8e] max-w-sm">{settings.slogan}</p>
              <p className="text-xs text-[#5c4d4d] flex items-center gap-2 pt-2">
                <i className="ph-fill ph-map-pin text-[#e6a8b7] text-base"></i> {settings.address}
              </p>
              <p className="text-xs text-[#5c4d4d] flex items-center gap-2">
                <i className="ph-fill ph-phone text-[#e6a8b7] text-base"></i> Hotline:{' '}
                <a href={`tel:${settings.phone}`} className="font-bold hover:underline">
                  {settings.phone}
                </a>
              </p>
              <p className="text-xs text-[#5c4d4d] flex items-center gap-2">
                <i className="ph-fill ph-clock text-[#e6a8b7] text-base"></i> Giờ mở cửa:{' '}
                {settings.hours}
              </p>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#5c4d4d] mb-3">
                Liên kết nhanh
              </h4>
              <ul className="space-y-2 text-xs text-[#9c8e8e]">
                <li>
                  <a href="#menu" className="hover:text-[#e6a8b7]">
                    Thực đơn bánh
                  </a>
                </li>
                <li>
                  <a href="#story" className="hover:text-[#e6a8b7]">
                    Về tiệm bánh
                  </a>
                </li>
                <li>
                  <a href="#event" className="hover:text-[#e6a8b7]">
                    Đặt tiệc teabreak
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#5c4d4d] mb-3">
                Kết nối với tiệm
              </h4>
              <div className="flex items-center gap-3">
                {settings.fb && (
                  <a
                    href={settings.fb}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-50 hover:bg-[#e6a8b7] hover:text-white flex items-center justify-center text-[#5c4d4d] transition-colors"
                  >
                    <i className="ph-fill ph-facebook-logo text-lg"></i>
                  </a>
                )}
                {settings.ig && (
                  <a
                    href={settings.ig}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-50 hover:bg-[#e6a8b7] hover:text-white flex items-center justify-center text-[#5c4d4d] transition-colors"
                  >
                    <i className="ph-fill ph-instagram-logo text-lg"></i>
                  </a>
                )}
                {settings.tiktok && (
                  <a
                    href={settings.tiktok}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-50 hover:bg-[#e6a8b7] hover:text-white flex items-center justify-center text-[#5c4d4d] transition-colors"
                  >
                    <i className="ph-fill ph-tiktok-logo text-lg"></i>
                  </a>
                )}
                {settings.zalo && (
                  <a
                    href={settings.zalo}
                    target="_blank"
                    rel="noreferrer"
                    className="w-9 h-9 rounded-full bg-gray-50 hover:bg-[#e6a8b7] hover:text-white flex items-center justify-center text-[#5c4d4d] transition-colors font-bold text-xs"
                  >
                    Zalo
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="pt-6 text-center text-xs text-[#9c8e8e]">
            © {new Date().getFullYear()} {settings.name}. Thiết kế theo phong cách Korean Bakery.
          </div>
        </div>
      </footer>

      {/* Slide-over Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              {/* Header */}
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#faf8f7]">
                <div className="flex items-center gap-2">
                  <i className="ph ph-shopping-bag text-2xl text-[#d495a4]"></i>
                  <h3 className="font-serif-title font-bold text-lg text-[#5c4d4d]">Giỏ Hàng Của Bạn</h3>
                  <span className="text-xs bg-[#f4dfe1] text-[#c77f8e] px-2 py-0.5 rounded-full font-bold">
                    {totalCartQty}
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <i className="ph ph-x text-2xl"></i>
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-16 text-center text-gray-400">
                    <i className="ph ph-shopping-bag text-6xl text-gray-200 mb-3"></i>
                    <p className="font-bold text-sm text-[#5c4d4d]">Giỏ hàng đang trống</p>
                    <p className="text-xs text-gray-400 mt-1">Hãy chọn chiếc bánh thơm ngon bạn thích nhé!</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 items-center bg-gray-50/70 p-3 rounded-2xl border border-gray-100"
                    >
                      <img src={item.img} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-[#5c4d4d] line-clamp-1">{item.name}</h4>
                        <p className="text-xs font-bold text-[#9c8e8e] mt-0.5">{formatPrice(item.price)}</p>
                        <div className="flex items-center gap-3 bg-white px-2.5 py-1 rounded-xl w-fit border border-gray-200 mt-2">
                          <button
                            onClick={() => updateCartQty(item.id, -1)}
                            className="text-gray-400 hover:text-[#5c4d4d] font-bold text-sm"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold w-4 text-center text-[#5c4d4d]">{item.qty}</span>
                          <button
                            onClick={() => updateCartQty(item.id, 1)}
                            className="text-gray-400 hover:text-[#5c4d4d] font-bold text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-xs text-[#5c4d4d]">
                          {formatPrice(item.price * item.qty)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Form & Total */}
              {cart.length > 0 && (
                <div className="p-5 border-t border-gray-100 bg-[#faf8f7] space-y-4">
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      placeholder="Họ và tên của bạn *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-[#e6a8b7]"
                    />
                    <input
                      type="tel"
                      placeholder="Số điện thoại nhận bánh *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-[#e6a8b7]"
                    />
                    <input
                      type="text"
                      placeholder="Ghi chú dặn dò (viết chữ lên bánh, nến...)"
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-200 bg-white font-medium focus:outline-none focus:border-[#e6a8b7]"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold text-[#9c8e8e]">Tổng thanh toán:</span>
                    <span className="font-serif-title font-bold text-lg text-[#5c4d4d]">
                      {formatPrice(totalCartPrice)}
                    </span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-3.5 rounded-full bg-[#5c4d4d] hover:bg-[#e6a8b7] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isCheckingOut ? (
                      <>
                        <i className="ph ph-spinner animate-spin text-lg"></i> Đang xử lý...
                      </>
                    ) : (
                      <>Hoàn tất đặt bánh</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setSelectedProduct(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-gray-600 flex items-center justify-center shadow-sm"
            >
              ✕
            </button>
            <div className="aspect-4/3 w-full bg-gray-100 overflow-hidden">
              <img src={selectedProduct.img} alt={selectedProduct.name} className="w-full h-full object-cover" />
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#c77f8e] uppercase bg-[#f4dfe1] px-2.5 py-1 rounded-full">
                  {categories.find((c) => c.id === selectedProduct.category)?.name || selectedProduct.category}
                </span>
                <span className="font-bold text-lg text-[#5c4d4d]">
                  {formatPrice(selectedProduct.price)}
                </span>
              </div>
              <div>
                <h3 className="font-serif-title font-bold text-xl text-[#5c4d4d]">{selectedProduct.name}</h3>
                <p className="text-xs text-[#9c8e8e] mt-2 leading-relaxed">{selectedProduct.desc}</p>
              </div>
              <div className="pt-4 flex gap-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    addToCart(selectedProduct);
                    setSelectedProduct(null);
                  }}
                  disabled={!selectedProduct.inStock}
                  className="flex-1 py-3 rounded-full bg-[#5c4d4d] hover:bg-[#e6a8b7] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <i className="ph ph-shopping-bag text-lg"></i> Thêm vào giỏ hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
