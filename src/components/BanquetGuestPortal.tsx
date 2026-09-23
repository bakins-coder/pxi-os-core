import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { CateringEvent, BanquetGuestOrderItem, BanquetGuestOrder } from '../types';
import { 
  QrCode, Utensils, CheckCircle2, Clock, AlertCircle, ShoppingBag, 
  Send, ChevronRight, Sparkles, ChefHat, Info, ArrowLeft, RefreshCw 
} from 'lucide-react';

interface BanquetGuestPortalProps {
  eventId?: string;
  tableNo?: string;
  seatNo?: string;
  onClose?: () => void;
}

export const BanquetGuestPortal: React.FC<BanquetGuestPortalProps> = ({
  eventId: propEventId,
  tableNo: propTableNo,
  seatNo: propSeatNo,
  onClose
}) => {
  const { cateringEvents, addBanquetGuestOrder } = useDataStore();

  // Robust parameter extraction for both search and HashRouter URLs
  const getUrlParam = (key: string): string | null => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get(key)) return searchParams.get(key);

    const hash = window.location.hash;
    if (hash.includes('?')) {
      const hashParams = new URLSearchParams(hash.substring(hash.indexOf('?')));
      if (hashParams.get(key)) return hashParams.get(key);
    }
    return null;
  };

  const targetEventId = propEventId || getUrlParam('banquetEventId') || getUrlParam('eventId') || '';
  const initialTableNo = propTableNo || getUrlParam('table') || getUrlParam('t') || '1';
  const initialSeatNo = propSeatNo || getUrlParam('seat') || getUrlParam('s') || 'A';

  const [tableNo, setTableNo] = useState<string>(initialTableNo);
  const [seatNo, setSeatNo] = useState<string>(initialSeatNo);
  const [guestName, setGuestName] = useState<string>('');

  // Cart state: Map item.id -> { item: DealItem/Line, qty, notes }
  const [cart, setCart] = useState<Record<string, { itemId: string; name: string; category?: string; qty: number; notes: string }>>({});
  const [placedOrder, setPlacedOrder] = useState<BanquetGuestOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'status'>('menu');

  // Find target event (with smart fallback to active banquet event)
  const event: CateringEvent | undefined = cateringEvents.find(e => e.id === targetEventId) || cateringEvents.find(e => e.orderType === 'Banquet' || e.banquetDetails);

  // Sync placed order status if available
  useEffect(() => {
    if (placedOrder && event?.banquetGuestOrders) {
      const updated = event.banquetGuestOrders.find(o => o.id === placedOrder.id);
      if (updated) {
        setPlacedOrder(updated);
      }
    }
  }, [event?.banquetGuestOrders, placedOrder?.id]);

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <AlertCircle size={48} className="mx-auto text-amber-400 mb-4 animate-bounce" />
          <h2 className="text-2xl font-black tracking-tight text-white mb-2">Banquet Event Not Found</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Please verify your QR code scan. The banquet session may have expired or is not currently active.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all text-sm"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  // Contracted Banquet Menu Items (Paid for by Host)
  const paidMenuItems = event.items && event.items.length > 0 ? event.items : [
    { itemId: 'menu-1', name: 'Signature Jollof Rice & Fried Plantain', category: 'Main Courses', quantity: 1, unitPriceCents: 0 },
    { itemId: 'menu-2', name: 'Slow-Cooked Peppered Beef', category: 'Main Courses', quantity: 1, unitPriceCents: 0 },
    { itemId: 'menu-3', name: 'Grilled Herb Chicken', category: 'Main Courses', quantity: 1, unitPriceCents: 0 },
    { itemId: 'menu-4', name: 'Xquisite Tropical Chapman Cocktail', category: 'Beverages', quantity: 1, unitPriceCents: 0 },
    { itemId: 'menu-5', name: 'Sparkling Mineral Water', category: 'Beverages', quantity: 1, unitPriceCents: 0 }
  ];

  // Group menu by category
  const categories = Array.from(new Set(paidMenuItems.map((i: any) => i.category || 'Special Banquet Selection')));

  const handleUpdateQty = (itemId: string, name: string, category: string | undefined, delta: number) => {
    setCart(prev => {
      const current = prev[itemId] || { itemId, name, category, qty: 0, notes: '' };
      const newQty = Math.max(0, current.qty + delta);
      if (newQty === 0) {
        const next = { ...prev };
        delete next[itemId];
        return next;
      }
      return { ...prev, [itemId]: { ...current, qty: newQty } };
    });
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    setCart(prev => {
      if (!prev[itemId]) return prev;
      return { ...prev, [itemId]: { ...prev[itemId], notes } };
    });
  };

  const totalCartCount = Object.values(cart).reduce((sum, item) => sum + item.qty, 0);

  const handleSubmitOrder = () => {
    if (totalCartCount === 0) return;
    setIsSubmitting(true);

    const orderItems: BanquetGuestOrderItem[] = Object.values(cart).map(item => ({
      itemId: item.itemId,
      name: item.name,
      quantity: item.qty,
      notes: item.notes,
      category: item.category
    }));

    setTimeout(() => {
      const newOrder = addBanquetGuestOrder({
        eventId: event.id,
        tableNo,
        seatNo,
        guestName: guestName.trim() || `Guest (Table ${tableNo}, Seat ${seatNo})`,
        items: orderItems
      });

      setPlacedOrder(newOrder);
      setCart({});
      setIsSubmitting(false);
      setActiveTab('status');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#00ff9d]/30">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-4 md:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && (
              <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all">
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <ChefHat size={22} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00ff9d] bg-[#00ff9d]/10 px-2 py-0.5 rounded-full border border-[#00ff9d]/20">
                  Banquet Menu
                </span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  Host Complimentary
                </span>
              </div>
              <h1 className="text-base md:text-lg font-black tracking-tight text-white leading-tight mt-0.5">
                {event.customerName}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800/90 border border-slate-700/60 rounded-2xl px-3 py-1.5 text-right">
              <div className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400">Your Seat</div>
              <div className="text-xs font-black text-amber-300">
                Table {tableNo} • Seat {seatNo}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 pb-28">
        {/* Seat / Table Banner Selector */}
        <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-emerald-950/40 border border-amber-500/20 rounded-3xl p-5 mb-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-amber-300/80 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" /> Welcome to the Celebration
              </p>
              <h2 className="text-xl md:text-2xl font-black text-white mt-1">
                Scan & Order from Your Seat
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Select your preferred meals & beverages contracted for this event.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Table #</label>
                <input
                  type="text"
                  value={tableNo}
                  onChange={e => setTableNo(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-center text-xs font-black text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex-1 sm:flex-initial">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Seat ID</label>
                <input
                  type="text"
                  value={seatNo}
                  onChange={e => setSeatNo(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-center text-xs font-black text-amber-400 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-2xl p-1 mb-6">
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Utensils size={14} /> Event Menu Selection
          </button>
          <button
            onClick={() => setActiveTab('status')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 relative ${
              activeTab === 'status'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={14} /> Live Order Tracker
            {placedOrder && (
              <span className="w-2 h-2 rounded-full bg-[#00ff9d] animate-ping absolute top-2 right-4" />
            )}
          </button>
        </div>

        {/* TAB 1: MENU SELECTION */}
        {activeTab === 'menu' && (
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryItems = paidMenuItems.filter((i: any) => (i.category || 'Special Banquet Selection') === category);

              return (
                <div key={category} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                    <div className="w-2 h-2 rounded-full bg-amber-400" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-300">
                      {category}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full ml-auto">
                      Host Selected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryItems.map((item: any) => {
                      const itemId = item.itemId || item.id || item.name;
                      const cartItem = cart[itemId];
                      const qty = cartItem?.qty || 0;

                      return (
                        <div
                          key={itemId}
                          className={`bg-slate-900/80 border rounded-3xl p-4 transition-all ${
                            qty > 0 ? 'border-amber-500/60 bg-slate-900' : 'border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h4 className="text-sm font-bold text-white leading-snug">{item.name}</h4>
                              <p className="text-[11px] text-slate-400 mt-1">
                                Included in Banquet Service • Complimentary
                              </p>
                            </div>

                            {/* Quantity Counter */}
                            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-2xl p-1 shrink-0">
                              <button
                                onClick={() => handleUpdateQty(itemId, item.name, item.category, -1)}
                                className="w-7 h-7 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-black text-slate-300 transition-all text-xs"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-black text-amber-400">{qty}</span>
                              <button
                                onClick={() => handleUpdateQty(itemId, item.name, item.category, 1)}
                                className="w-7 h-7 rounded-xl bg-amber-500 hover:bg-amber-400 flex items-center justify-center font-black text-slate-950 transition-all text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Notes field if selected */}
                          {qty > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-800/60">
                              <input
                                type="text"
                                placeholder="Add notes (e.g., No pepper, Extra ice, Well done)..."
                                value={cartItem?.notes || ''}
                                onChange={e => handleUpdateNotes(itemId, e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/60"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: LIVE ORDER TRACKER */}
        {activeTab === 'status' && (
          <div>
            {!placedOrder ? (
              <div className="text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
                <ShoppingBag size={44} className="mx-auto text-slate-600 mb-3" />
                <h3 className="text-lg font-bold text-slate-300">No Active Banquet Order Yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Select your dishes & drinks from the Banquet Menu tab to place an order from your seat.
                </p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="mt-4 px-5 py-2.5 bg-amber-500 text-slate-950 font-bold rounded-2xl text-xs hover:bg-amber-400 transition-all"
                >
                  Browse Banquet Menu
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                      Banquet Order #{placedOrder.id.slice(-6).toUpperCase()}
                    </span>
                    <h3 className="text-lg font-black text-white mt-2">
                      Table {placedOrder.tableNo} • Seat {placedOrder.seatNo}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      const found = event?.banquetGuestOrders?.find(o => o.id === placedOrder.id);
                      if (found) setPlacedOrder(found);
                    }}
                    className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all"
                    title="Refresh Order Status"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {/* Progress Steps */}
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { key: 'Received', label: 'Received', icon: Clock },
                      { key: 'Preparing', label: 'Preparing', icon: ChefHat },
                      { key: 'En Route', label: 'En Route', icon: Send },
                      { key: 'Delivered', label: 'Served', icon: CheckCircle2 }
                    ].map((step, idx) => {
                      const statuses = ['Received', 'Preparing', 'En Route', 'Delivered'];
                      const currentIdx = statuses.indexOf(placedOrder.status);
                      const isDone = currentIdx >= idx;
                      const isCurrent = currentIdx === idx;
                      const StepIcon = step.icon;

                      return (
                        <div key={step.key} className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-2 transition-all ${
                              isCurrent
                                ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 animate-pulse'
                                : isDone
                                ? 'bg-[#00ff9d] text-slate-950'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            <StepIcon size={18} />
                          </div>
                          <span className={`text-[10px] font-extrabold uppercase ${isDone ? 'text-white' : 'text-slate-500'}`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary Details */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Ordered Items</h4>
                  {placedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-start justify-between text-xs py-1 border-b border-slate-900 last:border-none">
                      <div>
                        <span className="font-bold text-white">{item.quantity}x {item.name}</span>
                        {item.notes && <p className="text-[10px] text-amber-300 italic mt-0.5">"{item.notes}"</p>}
                      </div>
                      <span className="text-slate-400 font-bold">Banquet</span>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-2">
                  <button
                    onClick={() => setPlacedOrder(null)}
                    className="text-xs font-bold text-slate-400 hover:text-amber-400 underline transition-all"
                  >
                    Place Another Order for Table {tableNo}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Bar for Cart Submit (Only on Menu tab) */}
      {activeTab === 'menu' && totalCartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-amber-500/30 p-4 shadow-2xl">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Table {tableNo} • Seat {seatNo}</span>
              <h4 className="text-sm font-black text-white">{totalCartCount} Banquet Items Selected</h4>
            </div>

            <button
              onClick={handleSubmitOrder}
              disabled={isSubmitting}
              className="py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Sending to Kitchen...</>
              ) : (
                <>
                  Confirm & Dispatch Order <Send size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
