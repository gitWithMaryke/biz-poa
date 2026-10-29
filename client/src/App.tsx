import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Header } from './components/Header.js';
import { Navigation } from './components/Navigation.js';
import { Toast } from './components/Toast.js';
import { CartDrawer } from './components/CartDrawer.js';
import { CheckoutModal } from './components/CheckoutModal.js';
import { ReceiptModal } from './components/ReceiptModal.js';
import { BarcodeScannerModal } from './components/BarcodeScannerModal.js';
import { ProductFormModal } from './components/ProductFormModal.js';
import { FeaturePhoneSimulator } from './components/FeaturePhoneSimulator.js';

import { SellTill } from './pages/SellTill.js';
import { InventoryStock } from './pages/InventoryStock.js';
import { SalesReports } from './pages/SalesReports.js';
import { SettingsSetup } from './pages/SettingsSetup.js';

import { localDB } from './db/db.js';
import { Product, CartItem, Sale, OutboxItem, ShopSettings, TabType } from './types/index.js';
import { defaultSettings } from './db/seedData.js';
import { playBeep, playCashChime } from './services/audioService.js';
import { performSync, getPendingSyncCount } from './services/syncService.js';
import { api } from './services/api.js';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('sell');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);

  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSync, setPendingSync] = useState<number>(0);

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isPhoneSimulatorOpen, setIsPhoneSimulatorOpen] = useState(false);

  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVisible, setToastVisible] = useState<boolean>(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2800);
  }, []);

  // Reload data from Live Backend API with IndexedDB local caching
  const reloadData = useCallback(async () => {
    try {
      // 1. Fetch live products from backend
      const [liveProducts, liveArchived, liveSales, liveSettings, liveOutbox] = await Promise.all([
        api.getProducts().catch(() => null),
        api.getArchivedProducts().catch(() => null),
        api.getSales(100).catch(() => null),
        api.getSettings().catch(() => null),
        api.getOutbox().catch(() => null),
      ]);

      if (liveProducts && liveSales) {
        // Connected to backend server
        const allProds = [...liveProducts, ...(liveArchived || [])];
        setProducts(allProds);
        setSales(liveSales.sort((a, b) => b.timestamp - a.timestamp));
        if (liveSettings) setSettings(liveSettings);
        if (liveOutbox) setOutbox(liveOutbox.sort((a, b) => b.timestamp - a.timestamp));

        // Mirror to local IndexedDB for offline resilience
        await localDB.products.clear();
        await localDB.products.bulkPut(allProds);
        await localDB.sales.clear();
        await localDB.sales.bulkPut(liveSales);
        if (liveSettings) await localDB.settings.put({ id: 'main', ...liveSettings });
      } else {
        throw new Error('Using offline cache');
      }
    } catch (e) {
      // Offline fallback: load from IndexedDB
      await localDB.seedInitialDataIfNeeded();
      const loadedProducts = await localDB.products.toArray();
      const loadedSales = await localDB.sales.toArray();
      const loadedOutbox = await localDB.outbox.toArray();
      const loadedSettings = await localDB.settings.get('main');

      setProducts(loadedProducts);
      setSales(loadedSales.sort((a, b) => b.timestamp - a.timestamp));
      setOutbox(loadedOutbox.sort((a, b) => b.timestamp - a.timestamp));
      if (loadedSettings) setSettings(loadedSettings);
    }

    const count = await getPendingSyncCount();
    setPendingSync(count);
  }, []);

  useEffect(() => {
    reloadData();
    // Live background polling every 5 seconds to keep registers in sync
    const interval = setInterval(reloadData, 5000);
    return () => clearInterval(interval);
  }, [reloadData]);

  // Handle Online / Offline network events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('Network connected! Syncing offline sales...');
      triggerSync(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('Offline mode active. Sales will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  const triggerSync = async (onlineState: boolean) => {
    const res = await performSync(onlineState);
    if (res.success && (res.syncedSales > 0 || res.syncedMessages > 0)) {
      showToast(`Synced ${res.syncedSales} sales & ${res.syncedMessages} SMS`);
    }
    await reloadData();
  };

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (nextState) {
      showToast('Switched to Online mode. Syncing with server...');
      triggerSync(true);
    } else {
      showToast('Switched to Offline mode. Sales work 100% offline.');
    }
  };

  // Hardware Barcode Scanner Listener (USB / Bluetooth HID buffer)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime > 100) {
        buffer = '';
      }
      lastKeyTime = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 4) {
          e.preventDefault();
          handleHardwareScan(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  const handleHardwareScan = (barcode: string) => {
    const matched = products.find(p => p.barcode === barcode);
    if (matched) {
      if (matched.qty <= 0) {
        playBeep(false);
        showToast(`${matched.name} is out of stock!`);
      } else {
        playBeep(true);
        handleAddToCart(matched);
        showToast(`Scanned: ${matched.name}`);
      }
    } else {
      playBeep(false);
      showToast(`Unknown Barcode: ${barcode}`);
    }
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.qty) {
          showToast(`Only ${product.qty} in stock!`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
    });
    playBeep(true);
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const product = products.find((p) => p.id === productId);
      return prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.qty + delta;
            if (product && newQty > product.qty) {
              showToast(`Only ${product.qty} units available.`);
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const handleClearCart = () => {
    setCart([]);
    setIsCartOpen(false);
  };

  // Complete Sale with Live Server Recording
  const handleCompleteSale = async (data: {
    method: 'cash' | 'mpesa' | 'card';
    tendered: number;
    change: number;
    phone: string;
    sendReceiptSMS: boolean;
  }) => {
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const now = Date.now();
    const newSeq = sales.length + 43;

    const salePayload = {
      lines: [...cart],
      total,
      method: data.method,
      tendered: data.tendered,
      change: data.change,
      phone: data.phone,
      sendReceiptSMS: data.sendReceiptSMS,
    };

    let recordedSale: Sale;

    try {
      if (isOnline) {
        // Direct live recording on server API
        recordedSale = await api.createSale(salePayload);
      } else {
        throw new Error('Offline');
      }
    } catch (e) {
      // Offline fallback
      recordedSale = {
        id: `sale_${now}`,
        receiptNo: newSeq,
        timestamp: now,
        lines: [...cart],
        total,
        method: data.method,
        tendered: data.tendered,
        change: data.change,
        phone: data.phone,
        smsId: null,
        synced: false,
      };
      await localDB.sales.add(recordedSale);
    }

    playCashChime();
    setCart([]);
    setIsCheckoutOpen(false);
    setIsCartOpen(false);
    setActiveReceiptSale(recordedSale);
    setIsReceiptOpen(true);

    showToast(`Sale #${recordedSale.receiptNo} completed successfully!`);
    await reloadData();
  };

  // Stock operations with Live Server Sync
  const handleAdjustStock = async (id: string, delta: number) => {
    try {
      if (isOnline) {
        const updated = await api.adjustStock(id, delta);
        showToast(`Stock updated: ${updated.name} (${updated.qty} left)`);
      } else {
        throw new Error('Offline');
      }
    } catch (e) {
      const prod = await localDB.products.get(id);
      if (!prod) return;
      const newQty = Math.max(0, prod.qty + delta);
      await localDB.products.update(id, { qty: newQty, isArchived: newQty === 0 });
      showToast(`Updated ${prod.name} (${newQty} in stock) [offline]`);
    }
    await reloadData();
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      if (isOnline) {
        await api.deleteProduct(id);
      } else {
        await localDB.products.delete(id);
      }
      showToast('Product removed from catalog.');
    } catch (e) {
      showToast('Error deleting product');
    }
    await reloadData();
  };

  const handleRestoreProduct = async (id: string, qty: number) => {
    try {
      if (isOnline) {
        await api.restoreProduct(id, qty);
      } else {
        await localDB.products.update(id, { qty, isArchived: false });
      }
      showToast('Product restored to active stock!');
    } catch (e) {
      showToast('Error restoring product');
    }
    await reloadData();
  };

  const handleSaveProduct = async (productData: any) => {
    try {
      if (isOnline) {
        await api.saveProduct(productData);
      } else {
        const now = Date.now();
        if (productData.id) {
          await localDB.products.update(productData.id, { ...productData, isArchived: false, updatedAt: now });
        } else {
          await localDB.products.add({ id: `prod_${now}`, ...productData, isArchived: false, createdAt: now });
        }
      }
      showToast(productData.id ? 'Product updated.' : 'New product added to stock.');
    } catch (e) {
      showToast('Error saving product');
    }
    setIsProductFormOpen(false);
    setProductToEdit(null);
    await reloadData();
  };

  const handleScanResult = (barcode: string, scanMode: 'sell' | 'receive', receiveQty: number) => {
    const matched = products.find((p) => p.barcode === barcode);
    if (scanMode === 'sell') {
      if (matched && matched.qty > 0) {
        handleAddToCart(matched);
      }
    } else {
      // Receive stock
      if (matched) {
        handleAdjustStock(matched.id, receiveQty);
      } else {
        // Unknown barcode, open add modal with prefilled barcode
        setProductToEdit({
          id: '',
          name: '',
          category: 'General',
          price: 0,
          qty: receiveQty,
          barcode,
          isArchived: false,
        });
        setIsScannerOpen(false);
        setIsProductFormOpen(true);
      }
    }
  };

  const handleUpdateSettings = async (newSettings: Partial<ShopSettings>) => {
    try {
      if (isOnline) {
        const updated = await api.updateSettings(newSettings);
        setSettings(updated);
      } else {
        const updated = { ...settings, ...newSettings };
        await localDB.settings.put({ id: 'main', ...updated });
        setSettings(updated);
      }
      showToast('Settings saved successfully!');
    } catch (e) {
      showToast('Error saving settings');
    }
    await reloadData();
  };

  // Computations
  const activeProducts = useMemo(() => products.filter((p) => !p.isArchived), [products]);
  const archivedProducts = useMemo(() => products.filter((p) => p.isArchived), [products]);
  const lowStockCount = useMemo(() => activeProducts.filter((p) => p.qty <= (p.minStockAlert || 5)).length, [activeProducts]);

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const todaySales = useMemo(() => sales.filter((s) => s.timestamp >= todayMidnight.getTime()), [sales]);
  const todayIncome = useMemo(() => todaySales.reduce((sum, s) => sum + s.total, 0), [todaySales]);

  return (
    <div className="min-h-screen bg-[#DFE5E1] text-[#14201B] flex flex-col items-center">
      {/* Shell Frame */}
      <div className="w-full max-w-md min-h-screen bg-[#EEF1EE] flex flex-col relative shadow-2xl overflow-x-hidden">
        {/* App Header */}
        <Header
          shopName={settings.shop}
          tillNumber={settings.till}
          isOnline={isOnline}
          pendingSyncCount={pendingSync}
          onToggleOnline={handleToggleOnline}
          onSyncNow={() => triggerSync(isOnline)}
        />

        {/* Main View Area */}
        <main className="flex-1 p-3.5 overflow-y-auto">
          {currentTab === 'sell' && (
            <SellTill
              products={products}
              cart={cart}
              todayIncome={todayIncome}
              todaySalesCount={todaySales.length}
              onAddToCart={handleAddToCart}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onGoToSales={() => setCurrentTab('sales')}
            />
          )}

          {currentTab === 'stock' && (
            <InventoryStock
              products={products}
              archivedProducts={archivedProducts}
              onAdjustStock={handleAdjustStock}
              onDeleteProduct={handleDeleteProduct}
              onRestoreProduct={handleRestoreProduct}
              onOpenAddModal={() => {
                setProductToEdit(null);
                setIsProductFormOpen(true);
              }}
              onOpenScanner={() => setIsScannerOpen(true)}
            />
          )}

          {currentTab === 'sales' && (
            <SalesReports
              sales={sales}
              ownerPhone={settings.owner}
              onOpenReceipt={(sale) => {
                setActiveReceiptSale(sale);
                setIsReceiptOpen(true);
              }}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'setup' && (
            <SettingsSetup
              settings={settings}
              outbox={outbox}
              isOnline={isOnline}
              onUpdateSettings={handleUpdateSettings}
              onOpenPhoneSimulator={() => setIsPhoneSimulatorOpen(true)}
              onShowToast={showToast}
            />
          )}
        </main>

        {/* Bottom Tab Navigation */}
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          lowStockCount={lowStockCount}
        />

        {/* Cart Drawer */}
        <CartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          items={cart}
          onUpdateQty={handleUpdateCartQty}
          onClearCart={handleClearCart}
          onProceedToCheckout={() => {
            setIsCartOpen(false);
            setIsCheckoutOpen(true);
          }}
        />

        {/* Checkout Modal with Interactive Safaricom M-Pesa STK Push */}
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          total={cart.reduce((sum, item) => sum + item.price * item.qty, 0)}
          tillNumber={settings.till}
          shopName={settings.shop}
          isOnline={isOnline}
          onCompleteSale={handleCompleteSale}
        />

        {/* Digital Thermal Receipt Modal */}
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          sale={activeReceiptSale}
          shopName={settings.shop}
        />

        {/* Barcode Scanner Modal */}
        <BarcodeScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          products={products}
          onScanResult={handleScanResult}
        />

        {/* Add/Edit Product Modal */}
        <ProductFormModal
          isOpen={isProductFormOpen}
          onClose={() => setIsProductFormOpen(false)}
          productToEdit={productToEdit}
          onSave={handleSaveProduct}
        />

        {/* Basic Feature Phone / USSD Simulator Modal */}
        <FeaturePhoneSimulator
          isOpen={isPhoneSimulatorOpen}
          onClose={() => setIsPhoneSimulatorOpen(false)}
          shopName={settings.shop}
          ownerPhone={settings.owner}
          todayIncome={todayIncome}
          todaySalesCount={todaySales.length}
        />

        {/* Action Toast Notifications */}
        <Toast message={toastMessage} visible={toastVisible} />
      </div>
    </div>
  );
};
