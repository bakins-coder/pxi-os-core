
import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { InventoryItem, Invoice, CateringEvent, DealItem, BanquetDetails, Contact } from '../types';
import {
    ShoppingBag, X, RefreshCw, ArrowRight, Trash2, Plus, Minus,
    Users, Palette, AlertCircle, ShoppingCart, CheckCircle2, Check
} from 'lucide-react';
import { MenuCard } from './MenuCard';

export const OrderBrochure = ({ onComplete, onFinalize, initialEvent }: { onComplete: () => void, onFinalize: (inv: Invoice) => void, initialEvent?: CateringEvent }) => {
    const [menuItems, setMenuItems] = useState<InventoryItem[]>([]);
    const [selected, setSelected] = useState<Record<string, number>>(() => {
        if (initialEvent) {
            const initial: Record<string, number> = {};
            initialEvent.items.forEach(it => {
                initial[it.inventoryItemId] = it.quantity;
            });
            return initial;
        }
        return {};
    });

    // Custom Items State
    const [customItems, setCustomItems] = useState<Record<string, { name: string, priceCents: number, quantity: number }>>({});
    const [showCustomModal, setShowCustomModal] = useState(false);
    const [newCustomName, setNewCustomName] = useState('');
    const [newCustomPriceCents, setNewCustomPriceCents] = useState(0);
    const [newCustomQty, setNewCustomQty] = useState(0);

    const { user } = useAuthStore();

    // Form State
    const [customerName, setCustomerName] = useState(initialEvent?.customerName || user?.name || '');
    const [contactPerson, setContactPerson] = useState(initialEvent?.banquetDetails?.contactPerson || '');
    const [contactEmail, setContactEmail] = useState(initialEvent?.banquetDetails?.contactEmail || user?.email || '');
    const [contactPhone, setContactPhone] = useState(initialEvent?.banquetDetails?.contactPhone || '');

    const [eventType, setEventType] = useState(initialEvent?.banquetDetails?.eventType || 'Wedding');
    const [themeColor, setThemeColor] = useState(initialEvent?.banquetDetails?.themeColor || '#4f46e5');
    const [eventDate, setEventDate] = useState(initialEvent?.eventDate || '');
    const [guestCount, setGuestCount] = useState(initialEvent?.guestCount || 100);
    const [eventLocation, setEventLocation] = useState(initialEvent?.banquetDetails?.location || '');
    const [eventPlannerName, setEventPlannerName] = useState(initialEvent?.banquetDetails?.eventPlanner?.split(' (')[0] || '');
    const [eventPlannerPhone, setEventPlannerPhone] = useState(initialEvent?.banquetDetails?.eventPlanner?.split(' (')[1]?.replace(')', '') || '');
    const [notes, setNotes] = useState(initialEvent?.banquetDetails?.notes || '');

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBasketOpen, setIsBasketOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'menu'>('details');

    const standardCategories = ["Hors D'Oeuvres", "Starters", "Salads", "Nigerian Cuisine", "Oriental", "Continental", "Hot Plates", "Desserts"];
    const mandatoryLockCategories = ["Nigerian Cuisine", "Oriental", "Continental", "Hot Plates"];
    const [activeCategory, setActiveCategory] = useState("All");

    // Store Hooks
    const inventory = useDataStore(state => state.inventory);
    const contacts = useDataStore(state => state.contacts);
    const addContact = useDataStore(state => state.addContact); // Need to expose this or ensuring it exists
    const calculateItemCosting = useDataStore(state => state.calculateItemCosting);
    const createCateringOrder = useDataStore(state => state.createCateringOrder);
    const updateCateringOrder = useDataStore(state => state.updateCateringOrder);

    useEffect(() => {
        // REFACTOR: Use new strict type taxonomy
        // Only show 'product' (Menu Items) or 'raw_material' (Ingredients) in the brochure
        // Exclude 'asset' (Hardware), 'rental', 'fixture'
        const products = inventory.filter(i => i.type === 'product' || i.type === 'raw_material');

        // DEBUG: Diagnose Category Mismatch
        const distinctCategories = Array.from(new Set(products.map(p => p.category)));
        console.log('[OrderBrochure] Loaded Items:', products.length);
        console.log('[OrderBrochure] Distinct Categories found:', distinctCategories);

        setMenuItems(products);
    }, [inventory]);


    const updateQty = (id: string, qty: number) => {
        if (id.startsWith('custom-')) {
            setCustomItems(prev => ({
                ...prev,
                [id]: { ...prev[id], quantity: Math.max(0, qty) }
            }));
            return;
        }
        setSelected(prev => ({ ...prev, [id]: Math.max(0, qty) }));
    };

    const addCustomItem = () => {
        if (!newCustomName || newCustomQty <= 0) return;
        const id = `custom-${Date.now()}`;
        setCustomItems(prev => ({
            ...prev,
            [id]: { name: newCustomName, priceCents: newCustomPriceCents, quantity: newCustomQty }
        }));
        setNewCustomName('');
        setNewCustomPriceCents(0);
        setNewCustomQty(0);
        setShowCustomModal(false);
    };

    const removeCustomItem = (id: string) => {
        setCustomItems(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const categoryTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        standardCategories.forEach(cat => totals[cat] = 0);
        totals["General Selections"] = 0;

        Object.entries(selected).forEach(([id, qty]) => {
            const item = menuItems.find(i => i.id === id);
            if (!item) return;
            const cat = standardCategories.includes(item.category) ? item.category : "General Selections";
            totals[cat] = (totals[cat] || 0) + Number(qty);
        });

        // Add custom items to General Selections or a specific category? 
        // Let's put them in General Selections for now
        Object.values(customItems).forEach(item => {
            totals["General Selections"] = (totals["General Selections"] || 0) + Number(item.quantity);
        });

        return totals;
    }, [selected, menuItems, customItems]);

    const hasSelection = useMemo(() => {
        return Object.values(selected).some(qty => Number(qty) > 0) || Object.values(customItems).some(it => it.quantity > 0);
    }, [selected, customItems]);

    const isPortionLocked = useMemo(() => {
        // Relaxed Logic: Check if TOTAL portions from ANY category meet the guest count
        // This allows users to create Dessert-only or Starter-only events.
        const totalPortions = Object.values(categoryTotals).reduce((sum, count) => sum + count, 0);

        return totalPortions >= guestCount;
    }, [categoryTotals, guestCount]);

    const projections = useMemo(() => {
        const costings = (Object.entries(selected) as [string, number][])
            .filter(([_, qty]) => (Number(qty) || 0) > 0)
            .map(([id, qty]) => calculateItemCosting(id, qty))
            .filter(Boolean) as any[];

        const customRevenue = Object.values(customItems).reduce((sum, it) => sum + (it.priceCents * it.quantity), 0);
        const revenue = costings.reduce((sum, c) => sum + (c.revenueCents || 0), 0) + customRevenue;

        return { totalRevenue: revenue, margin: 60 };
    }, [selected, calculateItemCosting, customItems]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, InventoryItem[]> = {};

        // Normalization Map for known DB variations
        const catMap: Record<string, string> = {
            "Hors D'Oeuvre": "Hors D'Oeuvres",
            "Starters": "Starters",
            "Salads": "Salads",
            "Nigerian": "Nigerian Cuisine",
            "Nigerian Cuisine": "Nigerian Cuisine",
            "Oriental": "Oriental",
            "Continental": "Continental",
            "Hot Plates": "Hot Plates",
            "Dessert": "Desserts",
            "Desserts": "Desserts",
            "Main": "Hot Plates",
            "Mains": "Hot Plates",
            "Swallow": "Nigerian Cuisine",
            "Local": "Nigerian Cuisine",
            "Starter": "Starters"
        };

        menuItems.forEach(item => {
            let catName = item.category || "General Selections";

            // Try explicit map
            if (catMap[catName]) {
                catName = catMap[catName];
            } else {
                // Try fuzzy match
                const found = standardCategories.find(sc => sc.toLowerCase() === catName.toLowerCase());
                if (found) catName = found;
            }

            const finalCat = standardCategories.includes(catName) ? catName : "General Selections";

            if (!groups[finalCat]) groups[finalCat] = [];
            groups[finalCat].push(item);
        });
        return groups;
    }, [menuItems]);

    const categoryOrder = [...standardCategories, "General Selections"];

    const handleHostChange = (name: string) => {
        setCustomerName(name);
        // Auto-fill if known contact
        const existingContact = contacts.find(c => c.name.toLowerCase() === name.toLowerCase());
        if (existingContact) {
            setContactEmail(existingContact.email);
            setContactPhone(existingContact.phone);
            setContactPerson(existingContact.contactPerson || '');
        }
    };

    const handlePlaceOrder = async () => {
        const missingFields = [];
        if (!customerName) missingFields.push("Host Name");
        if (!eventDate) missingFields.push("Event Date");
        if (!eventLocation) missingFields.push("Location");
        if (!contactEmail) missingFields.push("Email");
        if (!contactPhone) missingFields.push("Phone");

        if (missingFields.length > 0) {
            alert(`Please complete the following mandatory fields: ${missingFields.join(', ')}`);
            return;
        }

        setIsSubmitting(true);
        const dealItems: DealItem[] = [
            ...(Object.entries(selected) as [string, number][])
                .filter(([_, qty]) => (Number(qty) || 0) > 0)
                .map(([id, qty]) => {
                    const item = menuItems.find(i => i.id === id)!;
                    return { inventoryItemId: id, name: item.name, quantity: qty, priceCents: item.priceCents, costCents: 0 };
                }),
            ...Object.entries(customItems).map(([id, it]) => ({
                inventoryItemId: id,
                name: it.name,
                quantity: it.quantity,
                priceCents: it.priceCents,
                costCents: 0
            }))
        ];

        const banquetDetails: BanquetDetails = {
            location: eventLocation,
            contactPerson,
            contactEmail,
            contactPhone,
            eventType,
            themeColor,
            eventPlanner: eventPlannerName ? `${eventPlannerName} (${eventPlannerPhone})` : '',
            notes
        };

        try {
            if (initialEvent) {
                await updateCateringOrder(initialEvent.id, {
                    customerName,
                    eventDate,
                    guestCount,
                    items: dealItems,
                    banquetDetails
                });
                setIsSubmitting(false);
                onComplete();
            } else {
                // GUEST LOGIC: Ensure Contact Exists
                let targetContactId = user?.id; // If logged in, might use their ID if they are a contact

                // Refined Logic:
                // 1. If user is logged in, check if they match the email. 
                // 2. If guest, search contact by email.
                // 3. If not found, create new contact.

                let contactMatch = contacts.find(c => c.email.toLowerCase() === contactEmail.toLowerCase());

                if (!contactMatch) {
                    // Create new contact
                    const newContactId = `con-${Date.now()}`;
                    const newContact: Partial<Contact> = {
                        id: newContactId,
                        name: customerName,
                        email: contactEmail,
                        phone: contactPhone,
                        type: 'Individual',
                        contactPerson: contactPerson || customerName,
                        sentimentScore: 0.5
                    };
                    addContact(newContact);
                    targetContactId = newContactId;
                } else {
                    targetContactId = contactMatch.id;
                }

                const { invoice } = await createCateringOrder({
                    customerName,
                    contactId: targetContactId,
                    eventDate,
                    guestCount,
                    items: dealItems,
                    banquetDetails
                });
                setIsSubmitting(false);
                onFinalize(invoice);
            }
        } catch (err) {
            console.error(err);
            alert("Failed to process order update.");
            setIsSubmitting(false);
        }
    };

    return (
        <div onClick={(e) => e.stopPropagation()} className="bg-white md:rounded-[3rem] shadow-2xl w-full max-w-7xl h-[100vh] md:h-[95vh] overflow-hidden flex flex-col animate-in zoom-in duration-300 md:border border-slate-200">
            {/* HEADER */}
            <div className="p-4 md:p-8 border-b-2 border-slate-100 flex flex-col gap-4 bg-slate-50/50">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 shrink-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg"><ShoppingBag size={20} /></div>
                        <div><h2 className="text-lg md:text-2xl font-black text-slate-900 uppercase tracking-tighter">Banquet Creation</h2><p className="text-[9px] text-slate-500 font-black uppercase mt-1">New Event Node Hub</p></div>
                    </div>
                    <button onClick={onComplete} className="p-2 md:p-3 bg-white border-2 border-slate-100 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm shrink-0"><X size={20} /></button>
                </div>

                {/* Mobile Tab Switcher */}
                <div className="flex md:hidden bg-slate-200 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'details' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                        1. Event Details
                    </button>
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                    >
                        2. Menu Selection
                    </button>
                </div>

                {/* Category Pills - Only show on Menu Tab or Desktop */}
                <div className={`flex-1 flex flex-wrap justify-center items-center gap-4 py-2 overflow-x-auto max-w-full no-scrollbar px-2 ${activeTab === 'menu' ? 'flex' : 'hidden md:flex'}`}>
                    <div className="flex bg-slate-100 p-1.5 md:p-1.5 rounded-2xl border-2 border-slate-200 gap-2 md:gap-1 shadow-sm w-max shrink-0">
                        {["All", ...categoryOrder].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-3 md:px-4 md:py-2 rounded-xl text-[10px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                            >
                                {cat}
                                {(Number(categoryTotals[cat]) || 0) > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 md:w-4 md:h-4 bg-[#00ff9d] text-slate-950 rounded-full text-[9px] md:text-[8px] flex items-center justify-center font-black border-2 border-white">{categoryTotals[cat]}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    {/* Add Custom Item Button */}
                    <button
                        onClick={() => setShowCustomModal(true)}
                        className="px-6 py-3 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md flex items-center gap-2 shrink-0"
                    >
                        <Plus size={14} /> Custom Item
                    </button>
                </div>
            </div>


            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

                {/* SIDEBAR: Event Details */}
                <div className={`
               w-full md:w-[400px] lg:w-[440px] md:border-r-2 border-slate-100 p-6 md:p-10 space-y-8 bg-slate-50/80 overflow-y-auto scrollbar-thin
               ${activeTab === 'details' ? 'block' : 'hidden md:block'}
            `}>
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
                            <Users size={16} className="text-indigo-600" />
                            <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Client Identity</h3>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Host Entity *</label>
                            <input list="contacts-list-b" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-base md:text-xl text-slate-950 outline-none focus:border-indigo-500 shadow-sm" placeholder="Host Name" value={customerName} onChange={e => handleHostChange(e.target.value)} />
                            <datalist id="contacts-list-b">
                                {contacts.map(c => <option key={c.id} value={c.name} />)}
                            </datalist>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Contact Person</label>
                                <input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none shadow-sm" value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Phone *</label>
                                <input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none shadow-sm" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Email *</label>
                            <input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none shadow-sm" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2">
                            <Palette size={16} className="text-indigo-600" />
                            <h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Atmosphere & Coordination</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Event Type</label>
                                <select className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-base md:text-xs text-slate-950 uppercase shadow-sm cursor-pointer" value={eventType} onChange={e => setEventType(e.target.value)}>
                                    <option>Wedding</option><option>Corporate</option><option>Funeral</option><option>Birthday</option><option>Anniversary</option><option>Cocktail</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Theme Colour</label>
                                <div className="flex items-center gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                                    <input type="color" className="w-12 h-12 md:w-8 md:h-8 rounded-lg cursor-pointer border-none bg-transparent" value={themeColor} onChange={e => setThemeColor(e.target.value)} />
                                    <span className="font-mono text-xs font-black uppercase text-slate-950">{themeColor}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Event Date *</label>
                                <input type="date" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-base md:text-xs text-slate-950 shadow-sm" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Guest Count *</label>
                                <input type="number" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-base md:text-xs text-slate-950 shadow-sm" value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value) || 0)} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Event Planner</label>
                                <input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none shadow-sm" placeholder="Name (Optional)" value={eventPlannerName} onChange={e => setEventPlannerName(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Planner Phone</label>
                                <input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none shadow-sm" type="tel" placeholder="Phone (Optional)" value={eventPlannerPhone} onChange={e => setEventPlannerPhone(e.target.value)} />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Venue Address *</label>
                            <textarea className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none resize-none shadow-sm placeholder:text-slate-400" rows={2} placeholder="Location Detail" value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
                        </div>
                    </section>

                    {/* Mobile Next Button */}
                    <div className="md:hidden pt-4">
                        <button onClick={() => setActiveTab('menu')} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg">Proceed to Menu Selection →</button>
                    </div>
                </div>

                {/* MAIN MENU GRID/CAROUSEL */}
                <div className={`
                flex-1 flex flex-col bg-white relative
                ${activeTab === 'menu' ? 'block' : 'hidden md:flex'}
            `}>
                    <div className="flex-1 overflow-y-auto p-4 md:p-14 scrollbar-thin">
                        <div className="space-y-10 md:space-y-24 pb-60">
                            {categoryOrder.filter(c => activeCategory === "All" || c === activeCategory).map(category => {
                                const items = groupedItems[category];
                                if (!items || items.length === 0) return null;
                                const catTotal = categoryTotals[category] || 0;
                                const isMandatory = mandatoryLockCategories.includes(category);

                                return (
                                    <div key={category} className="animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-6 mb-4 md:mb-8 sticky top-0 bg-white/95 backdrop-blur z-10 py-2">
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.5em]">{category}</h3>
                                            <div className="h-px flex-1 bg-slate-100"></div>
                                            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border ${catTotal === guestCount ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isMandatory ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                                {isMandatory && catTotal !== guestCount && <AlertCircle size={12} />}
                                                Portions: {catTotal} / {guestCount}
                                            </div>
                                        </div>

                                        {/* RESPONSIVE LAYOUT SWITCH: Carousel on Mobile, Grid on Desktop */}
                                        <div className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth gap-1.5 md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-6 pb-8 md:pb-0 px-4 md:px-0 no-scrollbar md:overflow-visible md:snap-none">
                                            {items.map(item => {
                                                const qty = selected[item.id] || 0;
                                                return (
                                                    <MenuCard
                                                        key={item.id}
                                                        item={item}
                                                        qty={qty}
                                                        guestCount={guestCount}
                                                        updateQty={updateQty}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Itemized Basket Overlay - Responsive Width */}
                    {isBasketOpen && (
                        <div className="absolute inset-x-0 bottom-0 z-50 bg-slate-950 text-white p-6 md:p-10 border-t-2 border-[#00ff9d]/20 animate-in slide-in-from-bottom-full duration-500 max-h-[70%] overflow-y-auto rounded-t-[2rem] md:rounded-t-[4rem]">
                            <div className="flex justify-between items-center mb-6 md:mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-[#00ff9d] rounded-xl flex items-center justify-center text-slate-950"><ShoppingCart size={20} /></div>
                                    <h3 className="text-lg md:text-xl font-black uppercase tracking-tighter">Event Basket</h3>
                                </div>
                                <button onClick={() => setIsBasketOpen(false)} className="p-3 bg-white/10 hover:bg-rose-500 rounded-xl transition-all"><X size={20} /></button>
                            </div>
                            <div className="space-y-6 md:space-y-10">
                                {categoryOrder.map(cat => {
                                    const catItems = (Object.entries(selected) as [string, number][]).filter(([id, qty]) => {
                                        const item = menuItems.find(i => i.id === id);
                                        return (Number(qty) || 0) > 0 && (item?.category === cat || (!standardCategories.includes(item?.category || '') && cat === "General Selections"));
                                    });

                                    // Add custom items to General Selections view
                                    const combinedItems = [...catItems];
                                    if (cat === "General Selections") {
                                        Object.entries(customItems).forEach(([id, it]) => {
                                            combinedItems.push([id, it.quantity]);
                                        });
                                    }

                                    if (combinedItems.length === 0) return null;
                                    const catTotal = categoryTotals[cat];
                                    const isMandatory = mandatoryLockCategories.includes(cat);
                                    const isLocked = catTotal === guestCount;

                                    return (
                                        <div key={cat} className="space-y-4">
                                            <div className="flex justify-between items-center border-b border-white/10 pb-2">
                                                <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{cat}</span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-emerald-400' : (isMandatory && catTotal !== guestCount) ? 'text-rose-500' : 'text-slate-500'}`}>
                                                    {isMandatory && !isLocked && 'LOCK REQ: '}{catTotal} / {guestCount}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {combinedItems.map(([id, qty]) => {
                                                    const item = menuItems.find(i => i.id === id);
                                                    const custom = customItems[id];
                                                    if (!item && !custom) return null;
                                                    const name = item ? item.name : custom.name;
                                                    const isCustom = !!custom;

                                                    return (
                                                        <div key={id} className={`flex justify-between items-center p-4 bg-white/5 rounded-2xl border ${isCustom ? 'border-emerald-500/30' : 'border-white/5'}`}>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-black uppercase truncate">{name} {isCustom && <span className="text-[8px] bg-emerald-500 text-white px-1 rounded ml-1">Custom</span>}</p>
                                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{qty} Portions</p>
                                                            </div>
                                                            <button onClick={() => isCustom ? removeCustomItem(id) : updateQty(id, 0)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* FOOTER */}
            {/* FOOTER */}
            <div className="p-4 md:p-4 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] relative z-20 gap-3 md:gap-0 pb-6 md:pb-4 safe-area-pb">
                <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-8">
                    <button onClick={() => setIsBasketOpen(!isBasketOpen)} className="flex items-center gap-3 group bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-xl md:rounded-none flex-1 md:flex-auto">
                        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-slate-900 flex items-center justify-center text-[#00ff9d] shadow-lg group-hover:scale-105 transition-transform shrink-0">
                            <ShoppingCart size={18} className="md:w-4 md:h-4" />
                        </div>
                        <div className="text-left">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Basket</p>
                            <p className="text-xs md:text-sm font-black text-slate-950 uppercase">{Object.values(selected).filter(q => Number(q) > 0).length} Items</p>
                        </div>
                    </button>

                    <div className="h-10 w-px bg-slate-100 mx-2 hidden md:block"></div>

                    <div className="text-right bg-slate-50 md:bg-transparent p-2 md:p-0 rounded-xl md:rounded-none flex-1 md:flex-auto min-w-[100px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Total</p>
                        <span className="text-xl md:text-2xl font-black text-slate-950">₦{(projections.totalRevenue / 100).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <button onClick={onComplete} className="px-6 py-4 md:py-3 font-black uppercase text-[10px] text-slate-500 bg-slate-100 rounded-2xl md:bg-transparent hover:text-rose-500 shrink-0">Abort</button>
                    <button
                        onClick={handlePlaceOrder}
                        disabled={!hasSelection || isSubmitting || !customerName}
                        className={`flex-1 px-8 py-4 md:py-4 rounded-2xl font-black uppercase text-xs md:text-[10px] shadow-lg transition-all flex items-center justify-center gap-2 ${hasSelection && customerName ? 'bg-slate-950 text-white hover:bg-slate-800' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                    >
                        {isSubmitting ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                        {isPortionLocked ? 'Finalize Order' : 'Force Finalize (Unequal Qty)'}
                    </button>
                </div>
            </div>

            {/* Custom Item Modal */}
            {showCustomModal && (
                <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black uppercase tracking-tight">Add Custom Product</h3>
                            <button onClick={() => setShowCustomModal(false)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Product Name</label>
                                <input
                                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-950 outline-none focus:border-indigo-500"
                                    placeholder="e.g. Special Wedding Cake"
                                    value={newCustomName}
                                    onChange={e => setNewCustomName(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Unit Price (₦)</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-950 outline-none focus:border-indigo-500"
                                        placeholder="0"
                                        value={newCustomPriceCents / 100}
                                        onChange={e => setNewCustomPriceCents((parseFloat(e.target.value) || 0) * 100)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Quantity</label>
                                    <input
                                        type="number"
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-950 outline-none focus:border-indigo-500"
                                        placeholder="0"
                                        value={newCustomQty}
                                        onChange={e => setNewCustomQty(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={addCustomItem}
                                disabled={!newCustomName || newCustomQty <= 0}
                                className="w-full py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-xl"
                            >
                                Add to Order Node
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
