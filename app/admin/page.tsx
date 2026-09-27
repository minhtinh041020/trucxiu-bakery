'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Category,
  Expense,
  ExpenseCategory,
  FinancialReport,
  Ingredient,
  Order,
  OrderStatus,
  Product,
  StoreSettings,
} from '@/types/bakery';
import {
  DataService,
  initialCategories,
  initialExpenses,
  initialIngredients,
  initialOrders,
  initialProducts,
  initialSettings,
} from '@/lib/dataService';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function AdminPage() {
  // Auth state
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');

  // Main navigation tab
  const [currentTab, setCurrentTab] = useState<
    | 'dashboard'
    | 'orders-online'
    | 'orders-event'
    | 'products'
    | 'categories'
    | 'finance'
    | 'inventory'
    | 'settings'
  >('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // App datasets
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [settings, setSettings] = useState<StoreSettings>(initialSettings);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [liveClock, setLiveClock] = useState<string>('');

  // Filter states
  const [onlineFilter, setOnlineFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchOnline, setSearchOnline] = useState<string>('');
  const [searchEvent, setSearchEvent] = useState<string>('');
  const [searchProduct, setSearchProduct] = useState<string>('');
  const [searchIngredient, setSearchIngredient] = useState<string>('');
  const [productCatFilter, setProductCatFilter] = useState<string>('all');

  // Modals
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [newCatId, setNewCatId] = useState<string>('');
  const [newCatName, setNewCatName] = useState<string>('');

  const [isManualOrderOpen, setIsManualOrderOpen] = useState<boolean>(false);
  const [manualCustName, setManualCustName] = useState<string>('');
  const [manualCustPhone, setManualCustPhone] = useState<string>('');
  const [manualNote, setManualNote] = useState<string>('');
  const [manualCart, setManualCart] = useState<Record<number, number>>({});

  // Kế toán: Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState<boolean>(false);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('ingredient');
  const [expDesc, setExpDesc] = useState<string>('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState<string>('');

  // Kho: Ingredient Modal
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState<boolean>(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingName, setIngName] = useState<string>('');
  const [ingUnit, setIngUnit] = useState<string>('kg');
  const [ingUnitPrice, setIngUnitPrice] = useState<string>('');
  const [ingStockQty, setIngStockQty] = useState<string>('');
  const [ingMinStockQty, setIngMinStockQty] = useState<string>('5');
  const [ingSupplier, setIngSupplier] = useState<string>('');

  // Product form inputs
  const [prodFormName, setProdFormName] = useState<string>('');
  const [prodFormPrice, setProdFormPrice] = useState<string>('');
  const [prodFormCostPrice, setProdFormCostPrice] = useState<string>(''); // Giá vốn
  const [prodFormCat, setProdFormCat] = useState<string>('cake');
  const [prodFormImg, setProdFormImg] = useState<string>('');
  const [prodFormDesc, setProdFormDesc] = useState<string>('');
  const [prodFormInStock, setProdFormInStock] = useState<boolean>(true);

  // Settings form inputs
  const [settingForm, setSettingForm] = useState<StoreSettings>(initialSettings);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (text: string) => {
    setToastMsg(text);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('vi-VN').format(val) + 'đ';

  // Check login session
  useEffect(() => {
    setIsMounted(true);
    const auth = sessionStorage.getItem('tx_admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = process.env.NEXT_PUBLIC_ADMIN_PIN || '123456';
    if (pinInput.trim() === correctPin) {
      sessionStorage.setItem('tx_admin_auth', 'true');
      setIsAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Mã PIN không đúng, vui lòng thử lại! (Mặc định: 123456)');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('tx_admin_auth');
    setIsAuthenticated(false);
  };

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
      setLiveClock(`${dateStr} · ${timeStr}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all data & Realtime sync
  const refreshAllData = async () => {
    const [prods, cats, ords, sett, ings, exps] = await Promise.all([
      DataService.getProducts(),
      DataService.getCategories(),
      DataService.getOrders(),
      DataService.getSettings(),
      DataService.getIngredients(),
      DataService.getExpenses(),
    ]);
    setProducts(prods);
    setCategories(cats);
    setOrders(ords);
    setSettings(sett);
    setSettingForm(sett);
    setIngredients(ings);
    setExpenses(exps);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshAllData();
    const unsubscribe = DataService.subscribeRealtime(() => {
      refreshAllData();
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  // Order status colors
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Chờ duyệt' };
      case 'processing':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Đang làm bánh' };
      case 'shipping':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Đang giao' };
      case 'completed':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Hoàn tất' };
      case 'contacted':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Đã liên hệ' };
      case 'cancelled':
        return { bg: 'bg-red-50 text-red-600 border-red-200', label: 'Đã hủy' };
      default:
        return { bg: 'bg-gray-50 text-gray-700 border-gray-200', label: status };
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: OrderStatus) => {
    await DataService.updateOrderStatus(id, newStatus);
    showToast(`Đã chuyển đơn #${id} sang trạng thái "${getStatusBadge(newStatus).label}"`);
    refreshAllData();
  };

  // Product modal handlers
  const openProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProdFormName(prod.name);
      setProdFormPrice(prod.price.toString());
      setProdFormCostPrice((prod.costPrice || Math.round(prod.price * 0.38)).toString());
      setProdFormCat(prod.category);
      setProdFormImg(prod.img);
      setProdFormDesc(prod.desc);
      setProdFormInStock(prod.inStock);
    } else {
      setEditingProduct(null);
      setProdFormName('');
      setProdFormPrice('');
      setProdFormCostPrice('');
      setProdFormCat(categories[0]?.id || 'cake');
      setProdFormImg('https://images.unsplash.com/photo-1559620192-032c4bc4674e?auto=format&fit=crop&w=600&q=80');
      setProdFormDesc('');
      setProdFormInStock(true);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodFormName.trim() || !prodFormPrice.trim()) {
      alert('Vui lòng nhập tên và giá bán sản phẩm.');
      return;
    }

    const price = parseInt(prodFormPrice.replace(/\D/g, ''), 10) || 0;
    const costPrice = parseInt(prodFormCostPrice.replace(/\D/g, ''), 10) || Math.round(price * 0.38);

    const prod: Product = {
      id: editingProduct ? editingProduct.id : Date.now(),
      name: prodFormName.trim(),
      price: price,
      costPrice: costPrice,
      category: prodFormCat,
      img: prodFormImg.trim(),
      desc: prodFormDesc.trim(),
      inStock: prodFormInStock,
    };

    await DataService.addOrUpdateProduct(prod);
    setIsProductModalOpen(false);
    showToast(editingProduct ? `Đã cập nhật ${prod.name}` : `Đã thêm món ${prod.name}`);
    refreshAllData();
  };

  const handleDeleteProduct = async (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa món bánh "${name}"?`)) {
      await DataService.deleteProduct(id);
      showToast(`Đã xóa món ${name}`);
      refreshAllData();
    }
  };

  // Category handlers
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatId.trim() || !newCatName.trim()) {
      alert('Vui lòng nhập mã và tên nhóm.');
      return;
    }
    const cleanId = newCatId.trim().toLowerCase().replace(/\s+/g, '-');
    if (categories.some((c) => c.id === cleanId)) {
      alert('Mã nhóm này đã tồn tại!');
      return;
    }
    const updated = [...categories, { id: cleanId, name: newCatName.trim(), sort_order: categories.length + 1 }];
    await DataService.saveCategories(updated);
    setIsCategoryModalOpen(false);
    setNewCatId('');
    setNewCatName('');
    showToast('Đã thêm nhóm bánh mới!');
    refreshAllData();
  };

  const handleDeleteCategory = async (id: string) => {
    const prodsInCat = products.filter((p) => p.category === id).length;
    if (prodsInCat > 0) {
      alert(`Không thể xóa nhóm này vì đang có ${prodsInCat} món bánh thuộc nhóm!`);
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa nhóm "${id}"?`)) {
      await DataService.deleteCategory(id);
      showToast(`Đã xóa nhóm "${id}"`);
      refreshAllData();
    }
  };

  // Manual In-Store Order
  const changeManualQty = (id: number, delta: number) => {
    setManualCart((prev) => {
      const current = prev[id] || 0;
      const updated = Math.max(0, current + delta);
      if (updated === 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: updated };
    });
  };

  const manualOrderTotal = Object.entries(manualCart).reduce((sum, [idStr, qty]) => {
    const prod = products.find((p) => p.id === parseInt(idStr, 10));
    return sum + (prod ? prod.price * qty : 0);
  }, 0);

  const handleSubmitManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCustName.trim() || !manualCustPhone.trim()) {
      alert('Vui lòng nhập tên và số điện thoại khách hàng.');
      return;
    }
    const items = Object.entries(manualCart)
      .map(([idStr, qty]) => {
        const prod = products.find((p) => p.id === parseInt(idStr, 10));
        return prod && qty > 0
          ? {
              name: prod.name,
              qty,
              price: prod.price,
              costPrice: prod.costPrice,
              img: prod.img,
            }
          : null;
      })
      .filter(Boolean) as { name: string; qty: number; price: number; costPrice?: number; img: string }[];

    if (items.length === 0) {
      alert('Vui lòng chọn ít nhất 1 món bánh.');
      return;
    }

    const newOrder: Order = {
      id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
      type: 'regular',
      customer: { name: manualCustName.trim(), phone: manualCustPhone.trim() },
      items,
      total: manualOrderTotal,
      note: manualNote.trim() || 'Đơn tạo trực tiếp tại quầy',
      status: 'completed', // Đơn tại quầy hoàn tất ngay
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' Hôm nay',
      created_at: new Date().toISOString(),
    };

    await DataService.createOrder(newOrder);
    setIsManualOrderOpen(false);
    setManualCustName('');
    setManualCustPhone('');
    setManualNote('');
    setManualCart({});
    showToast(`Đã tạo đơn hàng ${newOrder.id} thành công!`);
    refreshAllData();
  };

  // Kế toán: Expense Handlers
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || !expAmount.trim()) {
      alert('Vui lòng nhập nội dung chi và số tiền.');
      return;
    }
    const amount = parseInt(expAmount.replace(/\D/g, ''), 10) || 0;
    const newExp: Expense = {
      id: 'EXP-' + Math.floor(100 + Math.random() * 900),
      category: expCategory,
      description: expDesc.trim(),
      amount,
      date: expDate || new Date().toLocaleDateString('vi-VN'),
      created_at: new Date().toISOString(),
    };

    await DataService.addExpense(newExp);
    setIsExpenseModalOpen(false);
    setExpDesc('');
    setExpAmount('');
    setExpDate('');
    showToast(`Đã ghi nhận khoản chi ${formatMoney(amount)}`);
    refreshAllData();
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (confirm(`Bạn có chắc muốn xóa khoản chi "${desc}"?`)) {
      await DataService.deleteExpense(id);
      showToast('Đã xóa khoản chi');
      refreshAllData();
    }
  };

  // Kho: Ingredient Handlers
  const openIngredientModal = (ing?: Ingredient) => {
    if (ing) {
      setEditingIngredient(ing);
      setIngName(ing.name);
      setIngUnit(ing.unit);
      setIngUnitPrice(ing.unitPrice.toString());
      setIngStockQty(ing.stockQty.toString());
      setIngMinStockQty(ing.minStockQty.toString());
      setIngSupplier(ing.supplier || '');
    } else {
      setEditingIngredient(null);
      setIngName('');
      setIngUnit('kg');
      setIngUnitPrice('');
      setIngStockQty('');
      setIngMinStockQty('5');
      setIngSupplier('');
    }
    setIsIngredientModalOpen(true);
  };

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingName.trim() || !ingUnitPrice.trim() || !ingStockQty.trim()) {
      alert('Vui lòng nhập đầy đủ tên, giá nhập và số lượng tồn.');
      return;
    }
    const unitPrice = parseInt(ingUnitPrice.replace(/\D/g, ''), 10) || 0;
    const stockQty = parseFloat(ingStockQty) || 0;
    const minStockQty = parseFloat(ingMinStockQty) || 5;

    const item: Ingredient = {
      id: editingIngredient ? editingIngredient.id : 'ING-' + Math.floor(10 + Math.random() * 90),
      name: ingName.trim(),
      unit: ingUnit.trim(),
      unitPrice,
      stockQty,
      minStockQty,
      supplier: ingSupplier.trim(),
      updated_at: new Date().toISOString(),
    };

    await DataService.addOrUpdateIngredient(item);
    setIsIngredientModalOpen(false);
    showToast(editingIngredient ? `Đã cập nhật ${item.name}` : `Đã thêm nguyên liệu ${item.name}`);
    refreshAllData();
  };

  const handleQuickAdjustStock = async (ing: Ingredient, delta: number) => {
    const newQty = Math.max(0, ing.stockQty + delta);
    await DataService.addOrUpdateIngredient({ ...ing, stockQty: newQty });
    showToast(`${delta > 0 ? 'Nhập thêm' : 'Xuất'} ${Math.abs(delta)} ${ing.unit} ${ing.name}`);
    refreshAllData();
  };

  const handleDeleteIngredient = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa nguyên liệu "${name}"?`)) {
      await DataService.deleteIngredient(id);
      showToast(`Đã xóa nguyên liệu "${name}"`);
      refreshAllData();
    }
  };

  // Settings save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await DataService.saveSettings(settingForm);
    showToast('Đã lưu cấu hình Website thành công!');
    refreshAllData();
  };

  // Backup & Restore
  const exportBackup = () => {
    const data = {
      categories,
      products,
      orders,
      settings,
      ingredients,
      expenses,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trucxin-bakery-accounting-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Đã tải xuống file sao lưu đầy đủ!');
  };

  const importBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.products && parsed.categories) {
          if (parsed.categories) await DataService.saveCategories(parsed.categories);
          if (parsed.products) await DataService.saveProducts(parsed.products);
          if (parsed.settings) await DataService.saveSettings(parsed.settings);
          if (parsed.ingredients) await DataService.saveIngredients(parsed.ingredients);
          if (parsed.expenses) await DataService.saveExpenses(parsed.expenses);
          showToast('Khôi phục dữ liệu thành công!');
          refreshAllData();
        } else {
          alert('File JSON không đúng định dạng dữ liệu Trúc Xíu Bakery!');
        }
      } catch {
        alert('Lỗi khi đọc file sao lưu JSON!');
      }
    };
    reader.readAsText(file);
  };

  const handleResetDefaults = async () => {
    if (confirm('Bạn có muốn khôi phục toàn bộ dữ liệu mẫu (sản phẩm, kho nguyên liệu, thu chi) ban đầu không?')) {
      await DataService.saveCategories(initialCategories);
      await DataService.saveProducts(initialProducts);
      await DataService.saveSettings(initialSettings);
      await DataService.saveIngredients(initialIngredients);
      await DataService.saveExpenses(initialExpenses);
      localStorage.setItem('TX_ORDERS', JSON.stringify(initialOrders));
      showToast('Đã khôi phục dữ liệu mẫu ban đầu!');
      refreshAllData();
    }
  };

  // Tính toán Báo cáo Kế toán Tài chính
  const finReport: FinancialReport = DataService.calculateFinancialReport(
    orders,
    products,
    expenses,
    ingredients
  );

  const onlinePendingCount = orders.filter((o) => o.type === 'regular' && o.status === 'pending').length;
  const eventPendingCount = orders.filter((o) => o.type === 'bulk' && o.status === 'pending').length;
  const lowStockIngredients = ingredients.filter((ing) => ing.stockQty <= ing.minStockQty);

  // Loading barrier during client hydration
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#fbf6f0] flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-[#c77f8e] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not authenticated, render Login Lockscreen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fbf6f0] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-[#eee2da] text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#f4dfe1] text-[#c77f8e] flex items-center justify-center mx-auto text-3xl">
            <i className="ph-fill ph-lock-key"></i>
          </div>
          <div>
            <h1 className="font-serif-title font-bold text-2xl text-[#59453f]">Quản Trị & Kế Toán Tiệm</h1>
            <p className="text-xs text-[#9b8982] mt-1">Trúc Xíu Bakery - Hệ thống Giám sát Doanh thu & Lời/Lỗ</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Nhập mã PIN quản trị (Mặc định: 123456)"
                className="w-full px-4 py-3 rounded-2xl border border-[#eee2da] text-center font-bold text-base focus:outline-none focus:border-[#d993a1] tracking-widest text-[#59453f]"
                autoFocus
              />
              {pinError && <p className="text-red-500 text-xs mt-2 font-medium">{pinError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <i className="ph ph-sign-in text-lg"></i> Mở Bảng Quản Trị
            </button>
          </form>

          <div className="pt-2">
            <Link href="/" className="text-xs font-bold text-[#c77f8e] hover:underline flex items-center justify-center gap-1">
              <i className="ph ph-arrow-left"></i> Quay lại trang mua hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf6f0] text-[#59453f] flex flex-col lg:flex-row">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[9999] bg-[#59453f] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <i className="ph-fill ph-check-circle text-lg text-[#d993a1]"></i>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Sidebar Drawer Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-[#fffdf9] border-r border-[#eee2da] flex flex-col justify-between p-5 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-5 overflow-y-auto hide-scrollbar">
          {/* Header Brand */}
          <div className="flex items-center justify-between pb-4 border-b border-[#eee2da]">
            <div className="flex items-center gap-3">
              <img
                src={settings.avatar || '/avatar.jpg'}
                alt={settings.name}
                className="w-11 h-11 rounded-full object-cover border-2 border-[#d993a1]"
              />
              <div>
                <b className="font-serif-title text-base font-bold text-[#59453f] block leading-tight">
                  {settings.name}
                </b>
                <span className="text-[10px] text-[#9b8982] flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                  Kế toán & Quản trị
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setCurrentTab('dashboard');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-[#f7e6e9] text-[#59453f] border-l-4 border-[#c77f8e]'
                  : 'text-[#9b8982] hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <i className="ph ph-squares-four text-lg"></i> Màn hình chính
              </span>
            </button>

            {/* TAB KẾ TOÁN & TÀI CHÍNH */}
            <button
              onClick={() => {
                setCurrentTab('finance');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                currentTab === 'finance'
                  ? 'bg-[#f7e6e9] text-[#59453f] border-l-4 border-[#c77f8e]'
                  : 'text-[#9b8982] hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <i className="ph-fill ph-chart-line-up text-lg text-[#c77f8e]"></i> Tài chính & Lời / Lỗ
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-md font-bold">
                P&L
              </span>
            </button>

            {/* TAB KHO NGUYÊN VẬT LIỆU */}
            <button
              onClick={() => {
                setCurrentTab('inventory');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                currentTab === 'inventory'
                  ? 'bg-[#f7e6e9] text-[#59453f] border-l-4 border-[#c77f8e]'
                  : 'text-[#9b8982] hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <i className="ph-fill ph-archive-box text-lg text-amber-600"></i> Kho nguyên vật liệu
              </span>
              {lowStockIngredients.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-bold animate-pulse">
                  {lowStockIngredients.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentTab('orders-online');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                currentTab === 'orders-online'
                  ? 'bg-[#f7e6e9] text-[#59453f] border-l-4 border-[#c77f8e]'
                  : 'text-[#9b8982] hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <i className="ph ph-shopping-bag text-lg"></i> Đơn hàng Online
              </span>
              {onlinePendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#d993a1] text-white">
                  {onlinePendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentTab('orders-event');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                currentTab === 'orders-event'
                  ? 'bg-[#f7e6e9] text-[#59453f] border-l-4 border-[#c77f8e]'
                  : 'text-[#9b8982] hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <i className="ph ph-crown text-lg"></i> Đơn tiệc sự kiện
              </span>
              {eventPendingCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500 text-white">
                  {eventPendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setCurrentTab('products');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                currentTab === 'products'
                  ? 'bg-[#f7e6e9] text-[#59453f] border-l-4 border-[#c77f8e]'
                  : 'text-[#9b8982] hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <i className="ph ph-cake text-lg"></i> Thực đơn bánh
              </span>
              <span className="text-[10px] text-gray-400">{products.length}</span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('categories');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                currentTab === 'categories'
                  ? 'bg-[#f7e6e9] text-[#59453f] border-l-4 border-[#c77f8e]'
                  : 'text-[#9b8982] hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <i className="ph ph-folder text-lg"></i> Cấu hình nhóm bánh
              </span>
            </button>

            <button
              onClick={() => {
                setCurrentTab('settings');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                currentTab === 'settings'
                  ? 'bg-[#f7e6e9] text-[#59453f] border-l-4 border-[#c77f8e]'
                  : 'text-[#9b8982] hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <i className="ph ph-gear text-lg"></i> Cấu hình Website
              </span>
            </button>
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-3 pt-3 border-t border-[#eee2da]">
          <button
            onClick={() => setIsManualOrderOpen(true)}
            className="w-full py-2.5 rounded-2xl bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <i className="ph ph-plus-circle text-base"></i> Tạo Đơn Tại Quầy
          </button>

          <div className="flex items-center justify-between px-1">
            <Link
              href="/"
              target="_blank"
              className="text-[11px] font-bold text-[#c77f8e] hover:underline flex items-center gap-1"
            >
              <i className="ph ph-arrow-square-out"></i> Xem Website tiệm
            </Link>
            <button
              onClick={handleLogout}
              className="text-[11px] font-bold text-gray-400 hover:text-red-500"
              title="Đăng xuất"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#fffdf9]/90 backdrop-blur-md border-b border-[#eee2da] px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-white border border-[#eee2da] text-[#59453f]"
            >
              <i className="ph ph-list text-xl"></i>
            </button>
            <div>
              <h2 className="font-serif-title font-bold text-lg sm:text-xl text-[#59453f] capitalize">
                {currentTab === 'dashboard' && 'Màn hình chính'}
                {currentTab === 'finance' && 'Kế toán & Báo cáo Lời / Lỗ'}
                {currentTab === 'inventory' && 'Quản lý Kho Nguyên vật liệu'}
                {currentTab === 'orders-online' && 'Đơn hàng Online'}
                {currentTab === 'orders-event' && 'Đơn tiệc sự kiện'}
                {currentTab === 'products' && 'Thực đơn bánh'}
                {currentTab === 'categories' && 'Cấu hình nhóm bánh'}
                {currentTab === 'settings' && 'Cấu hình Website'}
              </h2>
              <span className="text-[11px] text-[#9b8982] hidden sm:block">{liveClock}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                isSupabaseConfigured()
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isSupabaseConfigured() ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
              {isSupabaseConfigured() ? 'Cloud Realtime DB' : 'Local Storage Mode'}
            </span>

            <Link
              href="/"
              target="_blank"
              className="px-3.5 py-1.5 rounded-full bg-white border border-[#eee2da] hover:border-[#c77f8e] text-xs font-bold text-[#59453f] flex items-center gap-1.5 shadow-2xs"
            >
              <i className="ph ph-globe text-sm text-[#c77f8e]"></i>
              <span className="hidden sm:inline">Xem Web</span>
            </Link>
          </div>
        </header>

        {/* Tab Body */}
        <div className="p-4 sm:p-8 space-y-6 flex-1">
          {/* TAB 1: DASHBOARD (NÂNG CẤP CHỈ SỐ KẾ TOÁN) */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat Cards - Tài chính & Vận hành */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#fffdf9] p-5 rounded-3xl border border-[#eee2da] shadow-xs space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#9b8982]">
                    <span>DOANH THU THUẦN</span>
                    <i className="ph ph-currency-circle-dollar text-xl text-[#c77f8e]"></i>
                  </div>
                  <b className="font-serif-title text-xl sm:text-2xl text-[#59453f] block">
                    {formatMoney(finReport.totalRevenue)}
                  </b>
                  <span className="text-[10px] text-emerald-600 font-bold block">
                    Đã xuất kho giao thành công
                  </span>
                </div>

                <div className="bg-[#fffdf9] p-5 rounded-3xl border border-[#eee2da] shadow-xs space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#9b8982]">
                    <span>LÃI RÒNG THỰC TẾ (NET)</span>
                    <i className="ph-fill ph-chart-line-up text-xl text-emerald-600"></i>
                  </div>
                  <b
                    className={`font-serif-title text-xl sm:text-2xl block ${
                      finReport.netProfit >= 0 ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {formatMoney(finReport.netProfit)}
                  </b>
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    Biên lãi ròng: {finReport.netMargin}%
                  </span>
                </div>

                <div className="bg-[#fffdf9] p-5 rounded-3xl border border-[#eee2da] shadow-xs space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#9b8982]">
                    <span>GIÁ TRỊ KHO NGUYÊN LIỆU</span>
                    <i className="ph ph-package text-xl text-amber-600"></i>
                  </div>
                  <b className="font-serif-title text-xl sm:text-2xl text-[#59453f] block">
                    {formatMoney(finReport.inventoryValue)}
                  </b>
                  <button
                    onClick={() => setCurrentTab('inventory')}
                    className="text-[10px] text-[#c77f8e] font-bold hover:underline"
                  >
                    {lowStockIngredients.length > 0 ? (
                      <span className="text-red-500 font-bold">⚠️ Có {lowStockIngredients.length} món sắp hết!</span>
                    ) : (
                      'Tồn kho an toàn →'
                    )}
                  </button>
                </div>

                <div className="bg-[#fffdf9] p-5 rounded-3xl border border-[#eee2da] shadow-xs space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-bold text-[#9b8982]">
                    <span>ĐƠN CHỜ XỬ LÝ</span>
                    <i className="ph ph-bell-ringing text-xl text-[#d993a1]"></i>
                  </div>
                  <b className="font-serif-title text-xl sm:text-2xl text-[#59453f] block">
                    {onlinePendingCount + eventPendingCount} đơn
                  </b>
                  <span className="text-[10px] text-[#9b8982] block">
                    {onlinePendingCount} online · {eventPendingCount} tiệc
                  </span>
                </div>
              </div>

              {/* Quick Actions Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <button
                  onClick={() => setIsManualOrderOpen(true)}
                  className="bg-[#fffdf9] p-4 rounded-2xl border border-[#eee2da] hover:border-[#c77f8e] flex items-center gap-3 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#f4dfe1] text-[#c77f8e] flex items-center justify-center text-xl shrink-0">
                    <i className="ph ph-plus-circle"></i>
                  </div>
                  <div>
                    <b className="block text-xs font-bold text-[#59453f]">Tạo đơn tại quầy</b>
                    <span className="text-[11px] text-[#9b8982]">Bán trực tiếp tiệm</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsExpenseModalOpen(true);
                  }}
                  className="bg-[#fffdf9] p-4 rounded-2xl border border-[#eee2da] hover:border-[#c77f8e] flex items-center gap-3 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shrink-0">
                    <i className="ph ph-receipt"></i>
                  </div>
                  <div>
                    <b className="block text-xs font-bold text-[#59453f]">Ghi khoản chi mới</b>
                    <span className="text-[11px] text-[#9b8982]">Tiền điện, hộp, sữa...</span>
                  </div>
                </button>

                <button
                  onClick={() => openIngredientModal()}
                  className="bg-[#fffdf9] p-4 rounded-2xl border border-[#eee2da] hover:border-[#c77f8e] flex items-center gap-3 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xl shrink-0">
                    <i className="ph ph-archive-box"></i>
                  </div>
                  <div>
                    <b className="block text-xs font-bold text-[#59453f]">Nhập kho nguyên liệu</b>
                    <span className="text-[11px] text-[#9b8982]">Bột, bơ, kem whipping</span>
                  </div>
                </button>

                <button
                  onClick={() => setCurrentTab('finance')}
                  className="bg-[#fffdf9] p-4 rounded-2xl border border-[#eee2da] hover:border-[#c77f8e] flex items-center gap-3 text-left transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center text-xl shrink-0">
                    <i className="ph ph-chart-donut"></i>
                  </div>
                  <div>
                    <b className="block text-xs font-bold text-[#59453f]">Xem Báo cáo Lời/Lỗ</b>
                    <span className="text-[11px] text-[#9b8982]">Chi tiết biên lợi nhuận</span>
                  </div>
                </button>
              </div>

              {/* Recent Orders List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#59453f] flex items-center gap-2">
                    <i className="ph ph-receipt text-[#c77f8e]"></i> Đơn hàng vừa nhận gần đây
                  </h3>
                  <button
                    onClick={() => setCurrentTab('orders-online')}
                    className="text-xs font-bold text-[#c77f8e] hover:underline flex items-center gap-1"
                  >
                    Xem tất cả <i className="ph ph-arrow-right"></i>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {orders.slice(0, 4).map((o) => {
                    const badge = getStatusBadge(o.status);
                    return (
                      <div
                        key={o.id}
                        className="bg-[#fffdf9] p-4 rounded-2xl border border-[#eee2da] shadow-xs flex justify-between items-center hover:border-[#c77f8e] transition-all"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <b className="font-serif-title font-bold text-sm text-[#59453f]">
                              {o.customer.name}
                            </b>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                o.type === 'regular' ? 'bg-[#f4dfe1] text-[#c77f8e]' : 'bg-[#f6f0fb] text-[#8e6fad]'
                              }`}
                            >
                              {o.type === 'regular' ? 'ONLINE' : 'TIỆC'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#9b8982] line-clamp-1 max-w-[200px] sm:max-w-xs">
                            {o.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                          </p>
                          <span className="text-[10px] text-gray-400 mt-0.5 block">{o.time}</span>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                          <span className="font-bold text-xs sm:text-sm text-[#59453f]">
                            {o.total === 0 ? 'Chờ báo giá' : formatMoney(o.total)}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <button
                            onClick={() => setReceiptOrder(o)}
                            className="text-[11px] font-bold text-[#c77f8e] hover:underline flex items-center gap-1"
                          >
                            <i className="ph ph-receipt"></i> Chi tiết
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB MỚI: KẾ TOÁN & BÁO CÁO LỜI LỖ (P&L STATEMENT) */}
          {currentTab === 'finance' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-3xl border border-[#eee2da] shadow-xs">
                <div>
                  <h3 className="font-serif-title font-bold text-lg text-[#59453f] flex items-center gap-2">
                    <i className="ph-fill ph-calculator text-2xl text-[#c77f8e]"></i> Báo Cáo Kế Toán & Hiệu Quả Kinh Doanh
                  </h3>
                  <p className="text-xs text-[#9b8982] mt-0.5">
                    Hệ thống tự động tính toán Doanh thu, Giá vốn nguyên liệu bánh (COGS), Chi phí vận hành và Lợi nhuận ròng.
                  </p>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="px-5 py-2.5 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
                >
                  <i className="ph ph-plus-circle text-base"></i> Ghi Nhận Khoản Chi Mới
                </button>
              </div>

              {/* BẢNG TỔNG HỢP P&L (PROFIT & LOSS STATEMENT) */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5">
                <div className="bg-white p-4 rounded-3xl border border-[#eee2da] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#9b8982] uppercase block">1. Doanh thu thuần</span>
                  <b className="font-serif-title text-xl text-[#59453f] block">{formatMoney(finReport.totalRevenue)}</b>
                  <span className="text-[10px] text-gray-400">Từ các đơn hàng thành công</span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-[#eee2da] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#9b8982] uppercase block">2. Giá vốn bánh (COGS)</span>
                  <b className="font-serif-title text-xl text-amber-700 block">-{formatMoney(finReport.totalCOGS)}</b>
                  <span className="text-[10px] text-amber-600 font-medium">Bột, bơ, kem, dâu, trứng...</span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-[#eee2da] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#9b8982] uppercase block">3. Lợi nhuận gộp</span>
                  <b className="font-serif-title text-xl text-blue-700 block">{formatMoney(finReport.grossProfit)}</b>
                  <span className="text-[10px] text-blue-600 font-bold">Biên lãi gộp: {finReport.grossMargin}%</span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-[#eee2da] shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-[#9b8982] uppercase block">4. Chi phí vận hành</span>
                  <b className="font-serif-title text-xl text-red-600 block">-{formatMoney(finReport.totalExpenses)}</b>
                  <span className="text-[10px] text-red-500 font-medium">Điện, hộp, mặt bằng, lương</span>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-3xl border border-emerald-200 shadow-xs space-y-1">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase block">5. LÃI RÒNG THỰC NHẬN</span>
                  <b className={`font-serif-title text-xl block ${finReport.netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {formatMoney(finReport.netProfit)}
                  </b>
                  <span className="text-[10px] text-emerald-700 font-bold">Tỉ suất lợi nhuận: {finReport.netMargin}%</span>
                </div>
              </div>

              {/* BẢNG PHÂN TÍCH LỜI LỖ THEO TỪNG MÓN BÁNH */}
              <div className="bg-white rounded-3xl border border-[#eee2da] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#eee2da] bg-[#fbf6f0] flex justify-between items-center">
                  <div>
                    <b className="font-serif-title text-sm text-[#59453f] block">Phân Tích Biên Lợi Nhuận Từng Chiếc Bánh</b>
                    <span className="text-[11px] text-[#9b8982]">Biết chính xác mỗi chiếc bánh bán ra thu về bao nhiêu tiền lời</span>
                  </div>
                  <button
                    onClick={() => setCurrentTab('products')}
                    className="text-xs font-bold text-[#c77f8e] hover:underline"
                  >
                    Chỉnh sửa giá vốn menu →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#faf8f7] text-[#9b8982] font-bold uppercase text-[10px] border-b border-[#eee2da]">
                      <tr>
                        <th className="p-3 pl-4">Mẫu Bánh</th>
                        <th className="p-3">Giá Bán</th>
                        <th className="p-3">Giá Vốn (COGS)</th>
                        <th className="p-3">Tiền Lời / Chiếc</th>
                        <th className="p-3">Biên Lãi Gộp (%)</th>
                        <th className="p-3 pr-4">Đánh Giá Kế Toán</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee2da]">
                      {products.map((p) => {
                        const cost = p.costPrice || Math.round(p.price * 0.38);
                        const profit = p.price - cost;
                        const margin = ((profit / p.price) * 100).toFixed(1);
                        return (
                          <tr key={p.id} className="hover:bg-gray-50/80 transition">
                            <td className="p-3 pl-4 flex items-center gap-2.5">
                              <img src={p.img} alt={p.name} className="w-8 h-8 rounded-lg object-cover border border-[#eee2da]" />
                              <div>
                                <b className="text-[#59453f] block">{p.name}</b>
                                <span className="text-[10px] text-gray-400">{categories.find((c) => c.id === p.category)?.name}</span>
                              </div>
                            </td>
                            <td className="p-3 font-bold text-[#59453f]">{formatMoney(p.price)}</td>
                            <td className="p-3 font-bold text-amber-700">{formatMoney(cost)}</td>
                            <td className="p-3 font-bold text-emerald-700">+{formatMoney(profit)}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {margin}%
                              </span>
                            </td>
                            <td className="p-3 pr-4 text-[11px]">
                              {Number(margin) >= 65 ? (
                                <span className="text-emerald-700 font-bold">⭐️ Siêu lợi nhuận (Đẩy mạnh)</span>
                              ) : Number(margin) >= 55 ? (
                                <span className="text-blue-700 font-bold">✓ Tỉ suất sinh lời tốt</span>
                              ) : (
                                <span className="text-amber-700 font-bold">⚠️ Chi phí cốt bánh hơi cao</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SỔ QUỸ CHI TIÊU VẬN HÀNH (EXPENSES LOG) */}
              <div className="bg-white rounded-3xl border border-[#eee2da] shadow-xs overflow-hidden">
                <div className="p-4 border-b border-[#eee2da] bg-[#fbf6f0] flex justify-between items-center">
                  <div>
                    <b className="font-serif-title text-sm text-[#59453f] block">Sổ Quỹ Chi Tiêu Vận Hành (Gần đây)</b>
                    <span className="text-[11px] text-[#9b8982]">Tổng cộng: {formatMoney(finReport.totalExpenses)} đã chi</span>
                  </div>
                  <button
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="text-xs font-bold text-[#c77f8e] hover:underline flex items-center gap-1"
                  >
                    <i className="ph ph-plus-circle"></i> Thêm khoản chi
                  </button>
                </div>

                <div className="divide-y divide-[#eee2da]">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="p-4 flex items-center justify-between text-xs hover:bg-gray-50/80">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[9px] uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                            {exp.category === 'ingredient' && 'Nguyên liệu'}
                            {exp.category === 'packaging' && 'Hộp & Nơ'}
                            {exp.category === 'utilities' && 'Điện / Nước'}
                            {exp.category === 'salary' && 'Lương nhân sự'}
                            {exp.category === 'marketing' && 'Quảng cáo'}
                            {exp.category === 'rent' && 'Mặt bằng'}
                            {exp.category === 'other' && 'Chi khác'}
                          </span>
                          <b className="text-sm text-[#59453f]">{exp.description}</b>
                        </div>
                        <span className="text-[11px] text-gray-400 block">Ngày ghi sổ: {exp.date}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <b className="text-sm text-red-600 font-serif-title">-{formatMoney(exp.amount)}</b>
                        <button
                          onClick={() => handleDeleteExpense(exp.id, exp.description)}
                          className="text-gray-400 hover:text-red-500 p-1"
                          title="Xóa khoản chi"
                        >
                          <i className="ph ph-trash text-base"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB MỚI: QUẢN LÝ KHO NGUYÊN VẬT LIỆU (INVENTORY) */}
          {currentTab === 'inventory' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-3xl border border-[#eee2da] shadow-xs">
                <div>
                  <h3 className="font-serif-title font-bold text-lg text-[#59453f] flex items-center gap-2">
                    <i className="ph-fill ph-archive-box text-2xl text-amber-600"></i> Quản Lý Kho & Tồn Kho Nguyên Liệu
                  </h3>
                  <p className="text-xs text-[#9b8982] mt-0.5">
                    Tổng giá trị tồn kho hiện tại: <b className="text-[#59453f] font-bold">{formatMoney(finReport.inventoryValue)}</b>.
                    Tự động cảnh báo khi nguyên liệu chạm ngưỡng tối thiểu.
                  </p>
                </div>
                <button
                  onClick={() => openIngredientModal()}
                  className="px-5 py-2.5 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
                >
                  <i className="ph ph-plus-circle text-base"></i> Thêm Nguyên Liệu Mới
                </button>
              </div>

              {/* Cảnh báo nguyên liệu sắp hết */}
              {lowStockIngredients.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-3xl p-4 flex items-center gap-3 text-amber-900">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center text-2xl shrink-0">
                    <i className="ph-fill ph-warning"></i>
                  </div>
                  <div className="flex-1">
                    <b className="text-xs font-bold block">Cảnh báo: Có {lowStockIngredients.length} mặt hàng sắp hết trong kho!</b>
                    <span className="text-[11px] text-amber-800">
                      Gồm: {lowStockIngredients.map((i) => `${i.name} (còn ${i.stockQty} ${i.unit})`).join(', ')}. Hãy nhập thêm để không gián đoạn làm bánh.
                    </span>
                  </div>
                </div>
              )}

              {/* Search & Filter */}
              <div className="flex items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    value={searchIngredient}
                    onChange={(e) => setSearchIngredient(e.target.value)}
                    placeholder="Tìm tên bột, bơ, kem, dâu..."
                    className="w-full bg-white border border-[#eee2da] py-2 pl-9 pr-3 rounded-full text-xs font-bold outline-none focus:border-[#d993a1] text-[#59453f]"
                  />
                </div>
                <span className="text-xs text-[#9b8982] font-medium hidden sm:inline">
                  Tổng {ingredients.length} nguyên vật liệu
                </span>
              </div>

              {/* Bảng Kho Nguyên Liệu */}
              <div className="bg-white rounded-3xl border border-[#eee2da] shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#faf8f7] text-[#9b8982] font-bold uppercase text-[10px] border-b border-[#eee2da]">
                      <tr>
                        <th className="p-3 pl-4">Nguyên Vật Liệu</th>
                        <th className="p-3">Nhà Cung Cấp</th>
                        <th className="p-3">Đơn Vị</th>
                        <th className="p-3">Giá Nhập</th>
                        <th className="p-3">Tồn Kho Hiện Tại</th>
                        <th className="p-3">Tổng Giá Trị Tồn</th>
                        <th className="p-3">Trạng Thái Kho</th>
                        <th className="p-3 pr-4 text-right">Thao Tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#eee2da]">
                      {ingredients
                        .filter((ing) =>
                          searchIngredient.trim() === ''
                            ? true
                            : ing.name.toLowerCase().includes(searchIngredient.toLowerCase())
                        )
                        .map((ing) => {
                          const isLow = ing.stockQty <= ing.minStockQty;
                          return (
                            <tr key={ing.id} className="hover:bg-gray-50/80 transition">
                              <td className="p-3 pl-4 font-bold text-[#59453f]">
                                <span className="block">{ing.name}</span>
                                <span className="text-[10px] text-gray-400">{ing.id}</span>
                              </td>
                              <td className="p-3 text-[#9b8982]">{ing.supplier || 'Chợ đầu mối'}</td>
                              <td className="p-3 font-semibold text-gray-600">{ing.unit}</td>
                              <td className="p-3 font-bold text-[#59453f]">{formatMoney(ing.unitPrice)}</td>
                              <td className="p-3 font-bold">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleQuickAdjustStock(ing, -1)}
                                    className="w-5 h-5 rounded-md bg-gray-100 hover:bg-gray-200 text-xs flex items-center justify-center font-bold"
                                    title="Xuất kho bớt 1"
                                  >
                                    -
                                  </button>
                                  <span className={`text-sm ${isLow ? 'text-red-600' : 'text-[#59453f]'}`}>
                                    {ing.stockQty} {ing.unit}
                                  </span>
                                  <button
                                    onClick={() => handleQuickAdjustStock(ing, 1)}
                                    className="w-5 h-5 rounded-md bg-[#d993a1] text-white hover:bg-[#c77f8e] text-xs flex items-center justify-center font-bold"
                                    title="Nhập thêm 1"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 font-bold text-[#59453f]">
                                {formatMoney(ing.stockQty * ing.unitPrice)}
                              </td>
                              <td className="p-3">
                                {isLow ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 animate-pulse">
                                    ⚠️ Sắp hết (≤ {ing.minStockQty})
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                    ✓ Đầy đủ
                                  </span>
                                )}
                              </td>
                              <td className="p-3 pr-4 text-right space-x-2">
                                <button
                                  onClick={() => openIngredientModal(ing)}
                                  className="text-[#c77f8e] hover:underline font-bold"
                                >
                                  Sửa
                                </button>
                                <button
                                  onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                                  className="text-red-500 hover:underline font-bold"
                                >
                                  Xóa
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ĐƠN HÀNG ONLINE */}
          {currentTab === 'orders-online' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap gap-1 bg-white p-1 rounded-2xl border border-[#eee2da]">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'pending', label: 'Chờ duyệt' },
                    { id: 'processing', label: 'Đang làm bánh' },
                    { id: 'shipping', label: 'Đang giao' },
                    { id: 'completed', label: 'Đã xong' },
                    { id: 'cancelled', label: 'Đã hủy' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setOnlineFilter(tab.id)}
                      className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all ${
                        onlineFilter === tab.id ? 'bg-[#59453f] text-white' : 'text-[#9b8982] hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    value={searchOnline}
                    onChange={(e) => setSearchOnline(e.target.value)}
                    placeholder="Tìm tên, SĐT, mã đơn..."
                    className="w-full bg-white border border-[#eee2da] py-2 pl-9 pr-3 rounded-full text-xs font-bold outline-none focus:border-[#d993a1] text-[#59453f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {orders
                  .filter((o) => {
                    if (o.type !== 'regular') return false;
                    if (onlineFilter !== 'all' && o.status !== onlineFilter) return false;
                    if (searchOnline.trim()) {
                      const q = searchOnline.toLowerCase();
                      return (
                        o.customer.name.toLowerCase().includes(q) ||
                        o.customer.phone.includes(q) ||
                        o.id.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((o) => {
                    const badge = getStatusBadge(o.status);
                    return (
                      <div
                        key={o.id}
                        className="bg-white rounded-3xl p-5 border border-[#eee2da] shadow-xs space-y-4"
                      >
                        <div className="flex justify-between items-start border-b border-[#eee2da] pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs bg-gray-100 px-2 py-0.5 rounded-md text-[#59453f]">
                                {o.id}
                              </span>
                              <b className="font-serif-title font-bold text-base text-[#59453f]">
                                {o.customer.name}
                              </b>
                            </div>
                            <span className="text-xs text-[#9b8982] mt-0.5 block">
                              SĐT: <a href={`tel:${o.customer.phone}`} className="font-bold hover:underline">{o.customer.phone}</a> · {o.time}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Items */}
                        <div className="space-y-2 bg-[#fbf6f0] p-3 rounded-2xl">
                          {o.items.map((i, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 flex-1 pr-2">
                                <img
                                  src={i.img || 'https://images.unsplash.com/photo-1559620192-032c4bc4674e?w=100'}
                                  alt={i.name}
                                  className="w-8 h-8 rounded-lg object-cover"
                                />
                                <span className="font-bold text-[#59453f] line-clamp-1">{i.name}</span>
                              </div>
                              <span className="text-[#9b8982] w-8 text-center font-bold">x{i.qty}</span>
                              <span className="font-bold text-[#59453f] w-20 text-right">{formatMoney(i.price * i.qty)}</span>
                            </div>
                          ))}
                        </div>

                        {o.note && (
                          <div className="text-xs bg-amber-50/70 p-2.5 rounded-xl border border-amber-100 text-amber-900">
                            <b>Ghi chú:</b> {o.note}
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <div>
                            <span className="text-[11px] text-[#9b8982]">Tổng cộng: </span>
                            <b className="font-serif-title font-bold text-sm text-[#59453f]">
                              {formatMoney(o.total)}
                            </b>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setReceiptOrder(o)}
                              className="px-3 py-1.5 rounded-xl border border-[#eee2da] hover:bg-gray-50 text-xs font-bold text-[#59453f] flex items-center gap-1"
                            >
                              <i className="ph ph-printer"></i> In
                            </button>

                            {o.status === 'pending' && (
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'processing')}
                                className="px-3 py-1.5 rounded-xl bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold transition flex items-center gap-1"
                              >
                                <i className="ph ph-cake"></i> Làm bánh
                              </button>
                            )}
                            {o.status === 'processing' && (
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'shipping')}
                                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1"
                              >
                                <i className="ph ph-moped"></i> Giao hàng
                              </button>
                            )}
                            {o.status === 'shipping' && (
                              <button
                                onClick={() => handleUpdateStatus(o.id, 'completed')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1"
                              >
                                <i className="ph ph-check-circle"></i> Đã xong
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 3: ĐƠN HÀNG SỰ KIỆN / TIỆC */}
          {currentTab === 'orders-event' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap gap-1 bg-white p-1 rounded-2xl border border-[#eee2da]">
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'pending', label: 'Chờ báo giá' },
                    { id: 'contacted', label: 'Đã liên hệ' },
                    { id: 'completed', label: 'Đã hoàn tất' },
                    { id: 'cancelled', label: 'Đã hủy' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setEventFilter(tab.id)}
                      className={`py-1.5 px-3 text-xs font-bold rounded-xl transition-all ${
                        eventFilter === tab.id ? 'bg-[#59453f] text-white' : 'text-[#9b8982] hover:bg-gray-50'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                  <input
                    type="text"
                    value={searchEvent}
                    onChange={(e) => setSearchEvent(e.target.value)}
                    placeholder="Tìm khách sự kiện..."
                    className="w-full bg-white border border-[#eee2da] py-2 pl-9 pr-3 rounded-full text-xs font-bold outline-none focus:border-[#d993a1] text-[#59453f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {orders
                  .filter((o) => {
                    if (o.type !== 'bulk') return false;
                    if (eventFilter !== 'all' && o.status !== eventFilter) return false;
                    if (searchEvent.trim()) {
                      const q = searchEvent.toLowerCase();
                      return (
                        o.customer.name.toLowerCase().includes(q) ||
                        o.customer.phone.includes(q) ||
                        o.id.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map((o) => {
                    const badge = getStatusBadge(o.status);
                    return (
                      <div key={o.id} className="bg-white rounded-3xl p-5 border border-[#eee2da] shadow-xs space-y-4">
                        <div className="flex justify-between items-start border-b border-[#eee2da] pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md">
                                {o.id}
                              </span>
                              <b className="font-serif-title font-bold text-base text-[#59453f]">
                                {o.customer.name}
                              </b>
                            </div>
                            <span className="text-xs text-[#9b8982] mt-0.5 block">
                              SĐT: <a href={`tel:${o.customer.phone}`} className="font-bold hover:underline text-[#59453f]">{o.customer.phone}</a> · {o.time}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </div>

                        <div className="bg-[#f6f0fb] p-3.5 rounded-2xl space-y-1">
                          <b className="block text-xs font-bold text-[#8e6fad]">Yêu cầu chi tiết từ khách:</b>
                          <p className="text-xs text-[#59453f] leading-relaxed whitespace-pre-line">{o.note}</p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                          {o.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'contacted')}
                              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <i className="ph ph-phone-call"></i> Đã gọi tư vấn
                            </button>
                          )}
                          {o.status === 'contacted' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'completed')}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <i className="ph ph-check-circle"></i> Chốt tiệc thành công
                            </button>
                          )}
                          {o.status !== 'cancelled' && (
                            <button
                              onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                              className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition"
                            >
                              Hủy
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 4: THỰC ĐƠN BÁNH (CÓ THÊM GIÁ VỐN & TIỀN LỜI) */}
          {currentTab === 'products' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <i className="ph ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type="text"
                      value={searchProduct}
                      onChange={(e) => setSearchProduct(e.target.value)}
                      placeholder="Tìm mẫu bánh..."
                      className="w-full bg-white border border-[#eee2da] py-2 pl-9 pr-3 rounded-full text-xs font-bold outline-none focus:border-[#d993a1] text-[#59453f]"
                    />
                  </div>
                  <select
                    value={productCatFilter}
                    onChange={(e) => setProductCatFilter(e.target.value)}
                    className="bg-white border border-[#eee2da] py-2 px-3 rounded-full text-xs font-bold text-[#59453f] outline-none"
                  >
                    <option value="all">Tất cả nhóm</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => openProductModal()}
                  className="w-full sm:w-auto bg-[#59453f] hover:bg-[#c77f8e] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xs transition flex items-center justify-center gap-2"
                >
                  <i className="ph ph-plus-circle text-base"></i> Thêm bánh mới
                </button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products
                  .filter((p) => {
                    const matchCat = productCatFilter === 'all' || p.category === productCatFilter;
                    const matchQuery =
                      searchProduct.trim() === '' ||
                      p.name.toLowerCase().includes(searchProduct.toLowerCase());
                    return matchCat && matchQuery;
                  })
                  .map((p) => {
                    const cost = p.costPrice || Math.round(p.price * 0.38);
                    const profit = p.price - cost;
                    return (
                      <div
                        key={p.id}
                        className="bg-white rounded-3xl overflow-hidden border border-[#eee2da] shadow-xs flex flex-col justify-between"
                      >
                        <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                          <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                          <span className="absolute top-2.5 left-2.5 bg-white/90 text-[10px] font-bold text-[#59453f] px-2.5 py-1 rounded-full uppercase">
                            {categories.find((c) => c.id === p.category)?.name || p.category}
                          </span>
                          {!p.inStock && (
                            <span className="absolute bottom-2.5 left-2.5 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                              Tạm hết
                            </span>
                          )}
                        </div>

                        <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <b className="font-serif-title font-bold text-sm text-[#59453f] block line-clamp-1">
                              {p.name}
                            </b>
                            <div className="flex items-center justify-between mt-1 text-xs">
                              <span className="font-bold text-[#c77f8e]">Bán: {formatMoney(p.price)}</span>
                              <span className="text-[11px] text-amber-700 font-semibold">Vốn: {formatMoney(cost)}</span>
                            </div>
                            <div className="bg-emerald-50 px-2 py-1 rounded-lg mt-1.5 flex justify-between text-[11px] text-emerald-800 font-bold">
                              <span>Lời gộp:</span>
                              <span>+{formatMoney(profit)} ({((profit / p.price) * 100).toFixed(0)}%)</span>
                            </div>
                            <p className="text-[11px] text-[#9b8982] line-clamp-2 mt-2">{p.desc}</p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <button
                              onClick={() => openProductModal(p)}
                              className="text-xs font-bold text-[#59453f] hover:text-[#c77f8e] flex items-center gap-1"
                            >
                              <i className="ph ph-note-pencil"></i> Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1"
                            >
                              <i className="ph ph-trash"></i> Xóa
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 5: DANH MỤC NHÓM BÁNH */}
          {currentTab === 'categories' && (
            <div className="space-y-5 max-w-3xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-serif-title text-base sm:text-lg font-bold text-[#59453f]">
                    Danh mục nhóm bánh
                  </h3>
                  <p className="text-xs text-[#9b8982]">Nhóm phân loại hiển thị trên thực đơn của tiệm</p>
                </div>
                <button
                  onClick={() => setIsCategoryModalOpen(true)}
                  className="bg-[#59453f] hover:bg-[#c77f8e] text-white px-4 py-2 rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 transition"
                >
                  <i className="ph ph-folder-plus text-base"></i> Tạo nhóm bánh mới
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-[#eee2da] shadow-xs overflow-hidden divide-y divide-[#eee2da]">
                <div className="p-4 bg-[#fbf6f0] flex justify-between text-xs font-bold text-[#9b8982] uppercase">
                  <span>Mã & Tên nhóm bánh</span>
                  <span>Số lượng món</span>
                  <span>Thao tác</span>
                </div>

                {categories.map((cat) => {
                  const count = products.filter((p) => p.category === cat.id).length;
                  return (
                    <div key={cat.id} className="p-4 flex items-center justify-between text-xs">
                      <div>
                        <b className="block text-sm text-[#59453f]">{cat.name}</b>
                        <span className="text-[11px] text-[#9b8982]">Mã: {cat.id}</span>
                      </div>
                      <span className="font-bold text-[#59453f] bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                        {count} món
                      </span>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                      >
                        <i className="ph ph-trash text-base"></i> Xóa
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: CẤU HÌNH WEBSITE & SAO LƯU */}
          {currentTab === 'settings' && (
            <div className="space-y-6 max-w-4xl">
              <form onSubmit={handleSaveSettings} className="bg-white rounded-3xl border border-[#eee2da] p-6 space-y-4 shadow-xs">
                <h3 className="font-serif-title font-bold text-base text-[#59453f] border-b border-[#eee2da] pb-3 flex items-center gap-2">
                  <i className="ph ph-paint-brush text-[#c77f8e] text-lg"></i> Nhận diện thương hiệu & Thông tin tiệm
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Tên tiệm bánh</label>
                    <input
                      type="text"
                      value={settingForm.name}
                      onChange={(e) => setSettingForm({ ...settingForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#eee2da] text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Slogan</label>
                    <input
                      type="text"
                      value={settingForm.slogan}
                      onChange={(e) => setSettingForm({ ...settingForm, slogan: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#eee2da] text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Số điện thoại Hotline</label>
                    <input
                      type="text"
                      value={settingForm.phone}
                      onChange={(e) => setSettingForm({ ...settingForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#eee2da] text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Giờ mở cửa</label>
                    <input
                      type="text"
                      value={settingForm.hours}
                      onChange={(e) => setSettingForm({ ...settingForm, hours: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#eee2da] text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Địa chỉ tiệm bánh</label>
                    <input
                      type="text"
                      value={settingForm.address}
                      onChange={(e) => setSettingForm({ ...settingForm, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#eee2da] text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold shadow-xs transition"
                  >
                    Lưu Thay Đổi Cấu Hình
                  </button>
                </div>
              </form>

              {/* Backup & Restore */}
              <div className="bg-white rounded-3xl border border-[#eee2da] p-6 space-y-4 shadow-xs">
                <h3 className="font-serif-title font-bold text-base text-[#59453f] border-b border-[#eee2da] pb-3 flex items-center gap-2">
                  <i className="ph ph-database text-[#c77f8e] text-lg"></i> Sao lưu & Phục hồi dữ liệu
                </h3>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={exportBackup}
                    className="px-5 py-2.5 rounded-2xl bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition"
                  >
                    <i className="ph ph-download-simple text-base"></i> Tải Toàn Bộ Sao Lưu (JSON)
                  </button>

                  <label className="px-5 py-2.5 rounded-2xl bg-white border border-[#eee2da] hover:border-[#c77f8e] text-[#59453f] text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition">
                    <i className="ph ph-upload-simple text-base text-[#c77f8e]"></i> Khôi Phục Từ File JSON
                    <input type="file" accept=".json" onChange={importBackup} className="hidden" />
                  </label>

                  <button
                    onClick={handleResetDefaults}
                    className="px-5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center gap-2 transition"
                  >
                    <i className="ph ph-arrows-counter-clockwise text-base"></i> Khôi Phục Dữ Liệu Mẫu
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL: THÊM KHOẢN CHI (EXPENSE) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsExpenseModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-serif-title font-bold text-lg text-[#59453f] flex items-center gap-2">
              <i className="ph-fill ph-receipt text-[#c77f8e]"></i> Ghi Nhận Khoản Chi Mới
            </h3>

            <form onSubmit={handleSaveExpense} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Hạng mục chi phí *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f]"
                >
                  <option value="ingredient">Nguyên vật liệu (Bột, bơ, sữa...)</option>
                  <option value="packaging">Bao bì & Hộp bánh (Hộp mica, túi, nơ)</option>
                  <option value="utilities">Điện, Nước, Gas lò nướng</option>
                  <option value="salary">Lương phụ bếp & Thợ bánh</option>
                  <option value="marketing">Quảng cáo TikTok, Facebook</option>
                  <option value="rent">Tiền thuê mặt bằng</option>
                  <option value="other">Chi phí khác</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Nội dung chi tiết *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nhập 5 thùng bơ Anchor, trả tiền điện tháng này..."
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Số tiền (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    placeholder="500000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Ngày chi</label>
                  <input
                    type="text"
                    placeholder="Hôm nay"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-[#59453f]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold shadow-xs"
                >
                  Ghi Sổ Quỹ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: THÊM / SỬA NGUYÊN LIỆU (INGREDIENT) */}
      {isIngredientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsIngredientModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-serif-title font-bold text-lg text-[#59453f] flex items-center gap-2">
              <i className="ph-fill ph-archive-box text-amber-600"></i>
              {editingIngredient ? 'Cập Nhật Nguyên Vật Liệu' : 'Thêm Nguyên Liệu Vào Kho'}
            </h3>

            <form onSubmit={handleSaveIngredient} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Tên nguyên liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bơ lạt Anchor, Whipping Cream Tatua..."
                  value={ingName}
                  onChange={(e) => setIngName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Đơn vị tính *</label>
                  <input
                    type="text"
                    required
                    placeholder="kg, hộp, lít, quả, cái..."
                    value={ingUnit}
                    onChange={(e) => setIngUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Đơn giá nhập (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    placeholder="195000"
                    value={ingUnitPrice}
                    onChange={(e) => setIngUnitPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Số lượng tồn kho *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="10"
                    value={ingStockQty}
                    onChange={(e) => setIngStockQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Ngưỡng báo sắp hết</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="5"
                    value={ingMinStockQty}
                    onChange={(e) => setIngMinStockQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Nhà cung cấp / Đại lý</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cty Thực Phẩm Nhất Hương..."
                  value={ingSupplier}
                  onChange={(e) => setIngSupplier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-[#59453f]"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsIngredientModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold shadow-xs"
                >
                  Lưu Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsProductModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-serif-title font-bold text-lg text-[#59453f]">
              {editingProduct ? 'Cập Nhật Món Bánh' : 'Thêm Mẫu Bánh Mới'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Tên món bánh *</label>
                <input
                  type="text"
                  required
                  value={prodFormName}
                  onChange={(e) => setProdFormName(e.target.value)}
                  placeholder="Ví dụ: Dâu Tây Tươi Shortcake"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Giá bán ra (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={prodFormPrice}
                    onChange={(e) => setProdFormPrice(e.target.value)}
                    placeholder="150000"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-amber-700 uppercase mb-1">Giá vốn nguyên liệu (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    value={prodFormCostPrice}
                    onChange={(e) => setProdFormCostPrice(e.target.value)}
                    placeholder="55000"
                    className="w-full px-3 py-2 rounded-xl border border-amber-200 text-xs font-bold text-amber-800 bg-amber-50/50 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Nhóm bánh *</label>
                <select
                  value={prodFormCat}
                  onChange={(e) => setProdFormCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Link Ảnh Bánh (URL) *</label>
                <input
                  type="url"
                  required
                  value={prodFormImg}
                  onChange={(e) => setProdFormImg(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Mô tả chi tiết</label>
                <textarea
                  rows={2}
                  value={prodFormDesc}
                  onChange={(e) => setProdFormDesc(e.target.value)}
                  placeholder="Thành phần, cốt bánh, hương vị..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-stock"
                  checked={prodFormInStock}
                  onChange={(e) => setProdFormInStock(e.target.checked)}
                  className="rounded text-[#d993a1] focus:ring-0"
                />
                <label htmlFor="chk-stock" className="text-xs font-bold text-[#59453f]">
                  Còn hàng sẵn sàng phục vụ
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold shadow-xs"
                >
                  Lưu Bánh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-serif-title font-bold text-base text-[#59453f]">Tạo Nhóm Bánh Mới</h3>
            <form onSubmit={handleSaveCategory} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Mã nhóm (ID) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: cookies, tea, donut"
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#9b8982] uppercase mb-1">Tên hiển thị *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Bánh Quy Bơ, Donut"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-[#59453f] focus:outline-none focus:border-[#d993a1]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-500"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold shadow-xs"
                >
                  Thêm Nhóm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual In-Store Order Modal */}
      {isManualOrderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setIsManualOrderOpen(false)} />
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl z-10 space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95">
            <h3 className="font-serif-title font-bold text-lg text-[#59453f] flex items-center gap-2">
              <i className="ph ph-receipt text-[#c77f8e]"></i> Tạo Đơn Trực Tiếp Tại Quầy
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Tên khách hàng *"
                  value={manualCustName}
                  onChange={(e) => setManualCustName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-gray-200 font-medium"
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại *"
                  value={manualCustPhone}
                  onChange={(e) => setManualCustPhone(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-gray-200 font-medium"
                />
              </div>
              <input
                type="text"
                placeholder="Ghi chú dặn dò tại quầy"
                value={manualNote}
                onChange={(e) => setManualNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 font-medium"
              />

              <div className="border border-gray-100 rounded-2xl p-2 divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {products.map((p) => {
                  const qty = manualCart[p.id] || 0;
                  return (
                    <div key={p.id} className="py-1.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <img src={p.img} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <b className="block text-[#59453f]">{p.name}</b>
                          <span className="text-[10px] text-[#c77f8e]">{formatMoney(p.price)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => changeManualQty(p.id, -1)}
                          className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 font-bold flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-bold text-xs">{qty}</span>
                        <button
                          type="button"
                          onClick={() => changeManualQty(p.id, 1)}
                          className="w-6 h-6 rounded-full bg-[#d993a1] text-white hover:bg-[#c77f8e] font-bold flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-500">
                Tổng: <b className="text-sm text-[#59453f]">{formatMoney(manualOrderTotal)}</b>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualOrderOpen(false)}
                  className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-500"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSubmitManualOrder}
                  className="px-5 py-2 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold shadow-xs"
                >
                  Xác Nhận Đơn
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs no-print" onClick={() => setReceiptOrder(null)} />
          <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl z-10 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fbf6f0] no-print">
              <span className="font-bold text-xs text-[#59453f]">Hóa đơn thanh toán #{receiptOrder.id}</span>
              <button onClick={() => setReceiptOrder(null)} className="text-gray-400 hover:text-gray-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4" id="printable-receipt-area">
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-gray-300">
                <h2 className="font-serif-title font-bold text-xl text-[#59453f]">{settings.name}</h2>
                <p className="text-xs text-gray-500">{settings.address}</p>
                <p className="text-xs text-gray-500">Hotline: {settings.phone}</p>
                <b className="block text-xs font-bold uppercase tracking-wider pt-2 text-[#59453f]">
                  PHIẾU XÁC NHẬN ĐƠN HÀNG
                </b>
              </div>

              <div className="text-xs space-y-1 text-gray-600">
                <p><b>Mã đơn:</b> {receiptOrder.id}</p>
                <p><b>Thời gian:</b> {receiptOrder.time}</p>
                <p><b>Khách hàng:</b> {receiptOrder.customer.name}</p>
                <p><b>Điện thoại:</b> {receiptOrder.customer.phone}</p>
                {receiptOrder.note && <p><b>Ghi chú:</b> {receiptOrder.note}</p>}
              </div>

              <div className="border-t border-b border-gray-200 py-2 space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                  <span>Món</span>
                  <span>SL</span>
                  <span>Thành tiền</span>
                </div>
                {receiptOrder.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-xs text-[#59453f]">
                    <span className="flex-1 pr-2 line-clamp-1">{it.name}</span>
                    <span className="w-8 text-center">{it.qty}</span>
                    <span className="w-20 text-right font-bold">{formatMoney(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm font-bold text-[#59453f] pt-1">
                <span>TỔNG THANH TOÁN:</span>
                <span className="font-serif-title text-base">{formatMoney(receiptOrder.total)}</span>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-gray-200 text-xs text-gray-400">
                <p>Cảm ơn quý khách đã tin chọn {settings.name}!</p>
                <p className="italic">Chúc bạn có những giây phút ngọt ngào.</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-[#fbf6f0] no-print">
              <button
                onClick={() => setReceiptOrder(null)}
                className="px-4 py-2 rounded-full border border-gray-200 text-xs font-bold text-gray-500"
              >
                Đóng
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-full bg-[#59453f] hover:bg-[#c77f8e] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <i className="ph ph-printer text-base"></i> In Phiếu Này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
