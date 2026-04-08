import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { useAuthStore } from '../store/useAuthStore';
import { InventoryItem, Invoice, CateringEvent, DealItem, BanquetDetails, Contact } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';
import { INDUSTRY_PROFILES, IndustryType } from '../config/industryProfiles';
import {
    ShoppingBag, X, RefreshCw, ArrowRight, Trash2, Plus, Minus,
    Users, Palette, AlertCircle, ShoppingCart, CheckCircle2, Check, Edit3, Layers
} from 'lucide-react';
import { NAIRA_SYMBOL } from '../utils/finance';
import { MenuCard } from './MenuCard';
import { CakeDesigner } from './CakeDesigner';

export const OrderBrochure = ({ onComplete, onFinalize, initialEvent, orderType: propOrderType, vertical }: { onComplete: () => void, onFinalize: (inv: Invoice) => void, initialEvent?: CateringEvent, orderType?: string, vertical?: IndustryType }) => {
    const orderType = propOrderType || initialEvent?.orderType || 'Custom';
    const isCuisine = orderType === 'Cuisine';
    const [menuItems, setMenuItems] = useState<InventoryItem[]>([]);
    const [selected, setSelected] = useState<Record<string, number>>(() => {
        if (initialEvent) {
            const initial: Record<string, number> = {};
            initialEvent.items?.forEach(it => {
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
    const [customerName, setCustomerName] = useState(initialEvent?.customerName || '');
    const [contactPerson, setContactPerson] = useState(
        initialEvent?.cuisineDetails?.packaging ||
        initialEvent?.banquetDetails?.contactPerson ||
        ''
    );
    const [contactEmail, setContactEmail] = useState(
        initialEvent?.banquetDetails?.contactEmail ||
        user?.email ||
        ''
    );
    const [contactPhone, setContactPhone] = useState(initialEvent?.banquetDetails?.contactPhone || '');

    const [eventType, setEventType] = useState(initialEvent?.banquetDetails?.eventType || 'Wedding');
    const [themeColor, setThemeColor] = useState(initialEvent?.banquetDetails?.themeColor || '#4f46e5');
    const [eventDate, setEventDate] = useState(initialEvent?.eventDate || '');
    const [guestCount, setGuestCount] = useState(initialEvent?.guestCount || 100);
    const [eventLocation, setEventLocation] = useState(
        initialEvent?.cuisineDetails?.deliveryLocation ||
        initialEvent?.banquetDetails?.location ||
        ''
    );
    const [eventPlannerName, setEventPlannerName] = useState(initialEvent?.banquetDetails?.eventPlanner?.split(' (')[0] || '');
    const [eventPlannerPhone, setEventPlannerPhone] = useState(initialEvent?.banquetDetails?.eventPlanner?.split(' (')[1]?.replace(')', '') || '');
    const [notes, setNotes] = useState(initialEvent?.cuisineDetails?.notes || initialEvent?.banquetDetails?.notes || '');
    const [isDesignerOpen, setIsDesignerOpen] = useState(false);
    const [designUrl, setDesignUrl] = useState<string | null>(initialEvent?.banquetDetails?.notes?.includes('Design Attachment:') ? initialEvent.banquetDetails.notes.split('Design Attachment: ')[1].replace(']', '') : null);

    // UI State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBasketOpen, setIsBasketOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'menu'>('details');

    const { settings } = useSettingsStore();
    const activeVertical = vertical || (settings.type as IndustryType);
    const industryProfile = useMemo(() => INDUSTRY_PROFILES[activeVertical] || INDUSTRY_PROFILES.General, [activeVertical]);
    const { nomenclature, features } = industryProfile;

    const standardCategories = nomenclature.fulfillment.categories;
    const mandatoryLockCategories: string[] = [];
    const [activeCategory, setActiveCategory] = useState("All");

    // Store Hooks
    const inventory = useDataStore(state => state.inventory);
    const contacts = useDataStore(state => state.contacts);
    const addContact = useDataStore(state => state.addContact);
    const calculateItemCosting = useDataStore(state => state.calculateItemCosting);
    const createCateringOrder = useDataStore(state => state.createCateringOrder);
    const updateCateringOrder = useDataStore(state => state.updateCateringOrder);

    // [DRAFT LOGIC]
    useEffect(() => {
        const draftKey = `order_draft_${settings.id || 'general'}`;
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (window.confirm("We found an unfinished order draft. Would you like to restore it?")) {
                    setCustomerName(draft.customerName || '');
                    setContactPerson(draft.contactPerson || '');
                    setContactEmail(draft.contactEmail || '');
                    setContactPhone(draft.contactPhone || '');
                    setEventType(draft.eventType || 'Wedding');
                    setThemeColor(draft.themeColor || '#4f46e5');
                    setEventDate(draft.eventDate || '');
                    setGuestCount(draft.guestCount || 100);
                    setEventLocation(draft.eventLocation || '');
                    setEventPlannerName(draft.eventPlannerName || '');
                    setEventPlannerPhone(draft.eventPlannerPhone || '');
                    setNotes(draft.notes || '');
                    setSelected(draft.selected || {});
                    setCustomItems(draft.customItems || {});
                } else {
                    localStorage.removeItem('cake_custom_draft');
                }
            } catch (e) {
                console.error("Failed to parse draft", e);
            }
        }
    }, []);

    // [AUTO-SAVE DRAFT]
    useEffect(() => {
        const timer = setTimeout(() => {
            const hasData = customerName || contactPerson || Object.keys(selected).length > 0 || Object.keys(customItems).length > 0;
            if (hasData) {
                const draftData = {
                    customerName, contactPerson, contactEmail, contactPhone,
                    eventType, themeColor, eventDate, guestCount,
                    eventLocation, eventPlannerName, eventPlannerPhone, notes,
                    selected, customItems,
                    timestamp: Date.now()
                };
                localStorage.setItem(`order_draft_${settings.id || 'general'}`, JSON.stringify(draftData));
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [
        customerName, contactPerson, contactEmail, contactPhone,
        eventType, themeColor, eventDate, guestCount,
        eventLocation, eventPlannerName, eventPlannerPhone, notes,
        selected, customItems
    ]);

    useEffect(() => {
        const products = inventory.filter(i => i.type === 'product' || i.type === 'raw_material');
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

        Object.values(customItems).forEach(item => {
            totals["General Selections"] = (totals["General Selections"] || 0) + Number(item.quantity);
        });

        return totals;
    }, [selected, menuItems, customItems]);

    const hasSelection = useMemo(() => {
        return Object.values(selected).some(qty => Number(qty) > 0) || Object.values(customItems).some(it => it.quantity > 0);
    }, [selected, customItems]);

    const isPortionLocked = useMemo(() => {
        const totalPortions = Object.values(categoryTotals).reduce((sum, count) => sum + count, 0);
        return totalPortions >= guestCount;
    }, [categoryTotals, guestCount]);

    const projections = useMemo(() => {
        const costings = (Object.entries(selected) as [string, number][])
            .filter(([_, qty]) => (Number(qty) || 0) > 0)
            .map(([id, qty]) => calculateItemCosting(id, qty))
            .filter(Boolean) as any[];

        const isExcludedFromTax = (desc: string) => {
            if (!desc) return false;
            const ldesc = desc.toLowerCase();
            return ldesc.includes('transport') || ldesc.includes('logistic') || ldesc.includes('delivery') || ldesc.includes('menu card') || ldesc.includes('truck') || ldesc.includes('rental');
        };

        const customRevenue = Object.values(customItems).reduce((sum, it) => sum + (it.priceCents * it.quantity), 0);
        const totalSubtotal = costings.reduce((sum, c) => sum + (c.revenueCents || 0), 0) + customRevenue;

        const taxableSubtotal = costings.reduce((sum, c) => {
            if (isExcludedFromTax(c.name)) return sum;
            return sum + (c.revenueCents || 0);
        }, 0) + Object.values(customItems).reduce((sum, it) => {
            if (isExcludedFromTax(it.name)) return sum;
            return sum + (it.priceCents * it.quantity);
        }, 0);

        const scRate = isCuisine ? 0 : features.taxConfig.serviceChargeRate;
        const vatRate = isCuisine ? 0 : features.taxConfig.vatRate;

        const sc = Math.round(taxableSubtotal * scRate);
        const vat = Math.round((taxableSubtotal + sc) * vatRate);
        const totalWithTaxes = totalSubtotal + sc + vat;

        return { totalRevenue: totalWithTaxes, margin: 60 };
    }, [selected, calculateItemCosting, customItems, isCuisine, features.taxConfig]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, InventoryItem[]> = {};
        const catMap = nomenclature.fulfillment.categoryMap;

        menuItems.forEach(item => {
            let catName = item.category || "General Selections";
            if (catMap[catName]) {
                catName = catMap[catName];
            } else {
                const found = standardCategories.find(sc => sc.toLowerCase() === catName?.toLowerCase());
                if (found) catName = found;
            }
            const finalCat = standardCategories.includes(catName) ? catName : "General Selections";
            if (!groups[finalCat]) groups[finalCat] = [];
            groups[finalCat].push(item);
        });
        return groups;
    }, [menuItems, standardCategories]);

    const categoryOrder = [...standardCategories, "General Selections"];

    const handleHostChange = (name: string) => {
        setCustomerName(name);
        const existingContact = contacts.find(c => c.name?.toLowerCase() === name.toLowerCase());
        if (existingContact) {
            setContactEmail(existingContact.email);
            setContactPhone(existingContact.phone);
            setContactPerson(existingContact.contactPerson || '');
        } else {
            // Clear fields if no direct match found to prevent data leakage from previous selections
            setContactEmail('');
            setContactPhone('');
            setContactPerson('');
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
                    const item = menuItems.find(i => i.id === id) || inventory.find(i => i.id === id);
                    if (!item) return { inventoryItemId: id, name: "Unknown Item", quantity: qty, priceCents: 0, costCents: 0 };
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
            notes: designUrl ? `${notes}\n[Design Attachment: ${designUrl}]` : notes
        };

        try {
            // Resolve Target Contact ID (Check email match first)
            let targetContactId = (initialEvent && initialEvent.contactId) ? initialEvent.contactId : user?.id;
            let contactMatch = contacts.find(c => c.email?.toLowerCase() === contactEmail?.toLowerCase());

            if (!contactMatch) {
                const newContactId = crypto.randomUUID();
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

            if (initialEvent && initialEvent.id) {
                const { invoice } = await updateCateringOrder(initialEvent.id, {
                    customerName,
                    contactId: targetContactId,
                    eventDate,
                    guestCount,
                    items: dealItems,
                    banquetDetails
                });
                setIsSubmitting(false);
                localStorage.removeItem(`order_draft_${settings.id || 'general'}`);
                if (invoice) onFinalize(invoice); else onComplete();
            } else {
                const { invoice } = await createCateringOrder({
                    customerName,
                    contactId: targetContactId as string,
                    eventDate,
                    guestCount,
                    items: dealItems,
                    orderType,
                    banquetDetails
                });
                setIsSubmitting(false);
                localStorage.removeItem(`order_draft_${settings.id || 'general'}`);
                onFinalize(invoice);
            }
        } catch (err: any) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-start md:items-center justify-center p-0 md:p-8 bg-slate-950/40 backdrop-blur-xl animate-in fade-in duration-500 overflow-y-auto">
            <div onClick={(e) => e.stopPropagation()} className="bg-white md:rounded-[3rem] shadow-2xl w-full max-w-7xl h-[100dvh] md:h-[95vh] md:min-h-0 overflow-hidden flex flex-col md:border border-slate-200">
                {/* HEADER */}
                <div className="p-2 md:p-8 border-b border-slate-50 flex flex-col gap-2 md:gap-4 bg-slate-50/50">
                    <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2 md:gap-4 shrink-0">
                            <div className="w-8 h-8 md:w-12 md:h-12 bg-slate-900 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg"><ShoppingBag size={16} className="md:w-5 md:h-5" /></div>
                            <div><h2 className="text-sm md:text-2xl font-black text-slate-900 uppercase tracking-tighter">{nomenclature.fulfillment.orderTitle}</h2><p className="text-[7px] md:text-[9px] text-slate-500 font-black uppercase mt-0.5">{nomenclature.fulfillment.nodeSubtitle}</p></div>
                        </div>
                        <button onClick={onComplete} className="p-1.5 md:p-3 bg-white border border-slate-100 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm shrink-0"><X size={16} className="md:w-5 md:h-5" /></button>
                    </div>

                    <div className="flex md:hidden bg-slate-200 p-1 rounded-xl">
                        <button onClick={() => setActiveTab('details')} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'details' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>1. Client & Spec</button>
                        <button onClick={() => setActiveTab('menu')} className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'menu' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}>2. The Menu</button>
                    </div>

                    <div className={`flex-1 flex flex-wrap justify-center items-center gap-1.5 md:gap-4 py-0.5 md:py-2 overflow-x-auto max-w-full no-scrollbar px-1 ${activeTab === 'menu' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="flex bg-slate-100 p-0.5 md:p-1.5 rounded-lg md:rounded-2xl border-2 border-slate-200 gap-1 md:gap-1 shadow-sm w-max shrink-0">
                            {["All", ...categoryOrder].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-3 py-2 md:px-4 md:py-2 rounded-md md:rounded-xl text-[8px] md:text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap relative ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'}`}
                                >
                                    {cat}
                                    {(Number(categoryTotals[cat]) || 0) > 0 && (
                                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-[#00ff9d] text-slate-950 rounded-full text-[7px] md:text-[8px] flex items-center justify-center font-black border-2 border-white">{categoryTotals[cat]}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowCustomModal(true)} className="px-3 py-2 bg-emerald-500 text-white rounded-md text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-md flex items-center gap-1 shrink-0"><Plus size={10} /> Custom</button>
                        {features.showVisualizer && (
                            <button onClick={() => setIsDesignerOpen(true)} className="px-3 py-2 bg-indigo-500 text-white rounded-md text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-md flex items-center gap-1 shrink-0">
                                <Layers size={10} /> 3D Designer
                                {designUrl && <Check size={10} className="ml-1 text-emerald-300" />}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                    <div className={`w-full md:w-[400px] lg:w-[440px] md:border-r-2 border-slate-100 p-6 md:p-10 space-y-8 bg-slate-50/80 overflow-y-auto overflow-x-hidden scrollbar-thin ${activeTab === 'details' ? 'flex flex-col' : 'hidden md:flex md:flex-col'}`}>
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2"><Users size={16} className="text-indigo-600" /><h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{isCuisine ? 'Customer Identity' : 'Customer Details'}</h3></div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{nomenclature.fulfillment.clientLabel} *</label>
                                <input list="contacts-list-b" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-base md:text-xl text-slate-950 outline-none focus:border-indigo-500 shadow-sm" placeholder={nomenclature.fulfillment.clientLabel} value={customerName} onChange={e => handleHostChange(e.target.value)} />
                                <datalist id="contacts-list-b">{contacts.map(c => <option key={c.id} value={c.name} />)}</datalist>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{isCuisine ? 'Packaging Info' : 'Packaging / Notes'}</label>
                                    <input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none shadow-sm" placeholder={isCuisine ? "e.g. Bulk Boxes" : "Specific packaging needs"} value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
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
                            <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-2"><Palette size={16} className="text-indigo-600" /><h3 className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">{isCuisine ? 'Logistics & Timing' : 'Atmosphere & Coordination'}</h3></div>
                             {features.showCustomFields && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Category</label>
                                        <select className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-base md:text-xs text-slate-950 uppercase shadow-sm cursor-pointer" value={eventType} onChange={e => setEventType(e.target.value)}>
                                            {nomenclature.fulfillment.categories.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Theme Colour</label>
                                        <div className="flex items-center gap-3 p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                                            <input type="color" className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent" value={themeColor} onChange={e => setThemeColor(e.target.value)} />
                                            <span className="font-mono text-xs font-black uppercase text-slate-950">{themeColor}</span>
                                        </div>
                                    </div>
                                </div>
                             )}

                            {!isCuisine && (
                                <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center text-[#00ff9d] overflow-hidden">
                                            {designUrl ? <img src={designUrl} className="w-full h-full object-cover" alt="S" /> : <Edit3 size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-white font-black uppercase text-[9px] tracking-tight">Project Sketch</p>
                                            <p className="text-slate-500 text-[7px] font-bold uppercase tracking-widest">{designUrl ? 'Design Attached' : 'No Design Yet'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsDesignerOpen(true)} className="px-4 py-2 bg-white/10 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">Sketch</button>
                                </div>
                            )}

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{nomenclature.fulfillment.dateLabel} *</label>
                                    <input type="date" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-base md:text-xs text-slate-950 shadow-sm" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{nomenclature.fulfillment.unitsLabel} *</label>
                                    <input type="number" className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-base md:text-xs text-slate-950 shadow-sm" value={guestCount} onChange={e => setGuestCount(parseInt(e.target.value) || 0)} />
                                </div>
                            </div>
                            {!isCuisine && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Lead Co-ordinator</label><input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none shadow-sm" placeholder="Co-ordinator Name" value={eventPlannerName} onChange={e => setEventPlannerName(e.target.value)} /></div>
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Co-ordinator Phone</label><input className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none shadow-sm" type="tel" placeholder="Phone Number" value={eventPlannerPhone} onChange={e => setEventPlannerPhone(e.target.value)} /></div>
                                </div>
                            )}
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">{nomenclature.fulfillment.locationLabel} *</label>
                                <textarea className="w-full p-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-base md:text-xs text-slate-950 outline-none resize-none shadow-sm" rows={2} value={eventLocation} onChange={e => setEventLocation(e.target.value)} />
                            </div>
                        </section>
                    </div>

                    <div className={`flex-1 flex flex-col bg-white overflow-hidden relative ${activeTab === 'menu' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="flex-1 overflow-y-auto p-4 md:p-14 scrollbar-thin">
                            <div className="space-y-4 md:space-y-24 pb-64">
                                {categoryOrder.filter(c => activeCategory === "All" || c === activeCategory).map(category => {
                                    const items = groupedItems[category];
                                    if (!items || items.length === 0) return null;
                                    const catTotal = categoryTotals[category] || 0;
                                    return (
                                        <div key={category}>
                                            <div className="flex items-center gap-6 mb-8 sticky top-0 bg-white/95 backdrop-blur z-10 py-2">
                                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.5em]">{category}</h3>
                                                <div className="flex-1"></div>
                                                <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${catTotal === guestCount ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>Units: {catTotal} / {guestCount}</div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {items.map(item => <MenuCard key={item.id} item={item} qty={selected[item.id] || 0} guestCount={guestCount} updateQty={updateQty} />)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {isBasketOpen && (
                            <div className="absolute inset-x-0 bottom-0 z-50 bg-slate-950 text-white p-6 md:p-10 border-t-2 border-[#00ff9d]/20 rounded-t-[2rem] max-h-[70%] overflow-y-auto">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center gap-4"><div className="w-10 h-10 bg-[#00ff9d] rounded-xl flex items-center justify-center text-slate-950"><ShoppingCart size={20} /></div><h3 className="text-xl font-black uppercase tracking-tighter">Your Selection</h3></div>
                                    <button onClick={() => setIsBasketOpen(false)} className="p-3 bg-white/10 hover:bg-rose-500 rounded-xl transition-all"><X size={20} /></button>
                                </div>
                                <div className="space-y-10">
                                    {categoryOrder.map(cat => {
                                        const catItems = (Object.entries(selected) as [string, number][]).filter(([id, qty]) => {
                                            const item = menuItems.find(i => i.id === id);
                                            return (Number(qty) || 0) > 0 && (item?.category === cat || (!standardCategories.includes(item?.category || '') && cat === "General Selections"));
                                        });
                                        if (catItems.length === 0 && (cat !== "General Selections" || Object.keys(customItems).length === 0)) return null;
                                        return (
                                            <div key={cat} className="space-y-4">
                                                <div className="flex justify-between items-center border-b border-white/10 pb-2"><span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">{cat}</span></div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {catItems.map(([id, qty]) => {
                                                        const item = menuItems.find(i => i.id === id);
                                                        if (!item) return null;
                                                        return (
                                                            <div key={id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 gap-4">
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-xs font-black uppercase whitespace-normal break-words leading-tight">{item.name}</p>
                                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{qty} Units</p>
                                                                </div>
                                                                <button onClick={() => updateQty(id, 0)} className="text-rose-400 hover:text-rose-300 shrink-0"><Trash2 size={14} /></button>
                                                            </div>
                                                        );
                                                    })}
                                                    {cat === "General Selections" && Object.entries(customItems).map(([id, it]) => (
                                                        <div key={id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-emerald-500/30 gap-4">
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs font-black uppercase whitespace-normal break-words leading-tight">{it.name} <span className="text-[8px] bg-emerald-500 text-white px-1 rounded ml-1">Custom</span></p>
                                                                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{it.quantity} Units</p>
                                                            </div>
                                                            <button onClick={() => removeCustomItem(id)} className="text-rose-400 hover:text-rose-300 shrink-0"><Trash2 size={14} /></button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white shadow-xl">
                    <div className="flex items-center gap-8">
                        <button onClick={() => setIsBasketOpen(!isBasketOpen)} className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center text-[#00ff9d] shadow-lg"><ShoppingCart size={16} /></div>
                            <div className="text-left"><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0">Basket</p><p className="text-sm font-black text-slate-950 uppercase">{Object.values(selected).filter(q => Number(q) > 0).length + Object.keys(customItems).length} Items</p></div>
                        </button>
                        <div className="h-6 w-px bg-slate-100"></div>
                        <div className="text-right"><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-0">Total</p><span className="text-2xl font-black text-slate-950">{NAIRA_SYMBOL}{(projections.totalRevenue / 100).toLocaleString()}</span></div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onComplete} className="px-6 py-3 font-black uppercase text-xs text-slate-400 hover:text-rose-500 transition-all">Cancel</button>
                        <button onClick={handlePlaceOrder} disabled={!hasSelection || isSubmitting || !customerName} className="px-10 py-4 bg-slate-950 text-white rounded-xl font-black uppercase text-xs shadow-lg transition-all flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-30">
                            {isSubmitting ? <RefreshCw className="animate-spin" size={14} /> : <ArrowRight size={14} />}
                            Finalize Order
                        </button>
                    </div>
                </div>

                {showCustomModal && (
                    <div className="fixed inset-0 z-[100] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in">
                            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Add Custom Product</h3><button onClick={() => setShowCustomModal(false)} className="p-2 bg-slate-50 hover:bg-rose-500 hover:text-white text-slate-400 rounded-full transition-all"><X size={20} /></button></div>
                            <div className="space-y-4">
                                <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Product Name</label><input className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={newCustomName} onChange={e => setNewCustomName(e.target.value)} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Price ({NAIRA_SYMBOL})</label><input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={newCustomPriceCents / 100} onChange={e => setNewCustomPriceCents(parseFloat(e.target.value) * 100)} /></div>
                                    <div><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Qty</label><input type="number" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={newCustomQty} onChange={e => setNewCustomQty(parseInt(e.target.value))} /></div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setShowCustomModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">Cancel</button>
                                    <button onClick={addCustomItem} disabled={!newCustomName || newCustomQty <= 0} className="flex-[2] py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Add to Order</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <CakeDesigner isOpen={isDesignerOpen} onClose={() => setIsDesignerOpen(false)} onSave={(url) => setDesignUrl(url)} />
            </div>
        </div>
    );
};
