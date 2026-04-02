import { 
    ShoppingBag, Utensils, Zap, Package, 
    Truck, ChefHat, UtensilsCrossed, Flame, Box, Grid3X3,
    LucideIcon 
} from 'lucide-react';
import { IndustryType } from '../types';
export type { IndustryType };

export interface IndustryProfile {
    type: IndustryType;
    label: string;
    ui: {
        productsIcon: LucideIcon;
        fulfillmentIcon: LucideIcon;
        standardIcon: LucideIcon;
        customIcon: LucideIcon;
        cardImageHeight: string;
        defaultCategories: string[];
    };
    nomenclature: {
        inventory: {
            pipelineLabel: string;
            pipelineSubtitle: string;
            substanceLabel: {
                singular: string;
                plural: string;
            };
            receiveLabel: string;
            releaseLabel: string;
            stockLabel: string;
            priceLabel: string;
            ingredientsLabel: string;
            productsLabel: string;
            recipeLabel: string | null;
            boqLabel: string;
        };
        fulfillment: {
            orderTitle: string;
            nodeSubtitle: string;
            clientLabel: string;
            contactLabel: string;
            logisticsLabel: string;
            dateLabel: string;
            unitsLabel: string;
            locationLabel: string;
            finalizeLabel: string;
            navLabel: string;
            standardOrdersLabel: string;
            customOrdersLabel: string;
            fulfillmentHub: string;
            productionLabel: string;
            standardOrders: string;
            customOrders: string;
            categories: string[];
            categoryMap: Record<string, string>;
        };
    };
    features: {
        showFulfillment: boolean;
        showVisualizer: boolean;
        showCustomFields: boolean;
        showBOQ: boolean;
        showRequisitions: boolean;
        showProjections: boolean;
        taxConfig: {
            serviceChargeRate: number;
            vatRate: number;
        };
    };
}

export const INDUSTRY_PROFILES: Record<IndustryType, IndustryProfile> = {
    Retail: {
        type: 'Retail',
        label: 'Retail',
        ui: {
            productsIcon: ShoppingBag,
            fulfillmentIcon: Truck,
            standardIcon: Package,
            customIcon: ShoppingBag,
            cardImageHeight: 'h-72',
            defaultCategories: ['Clothing', 'Accessories', 'Footwear', 'Beauty', 'Home']
        },
        nomenclature: {
            inventory: {
                pipelineLabel: 'Product Stock Pipeline',
                pipelineSubtitle: 'Real-time inventory orchestration and batch tracking',
                substanceLabel: { singular: 'Product', plural: 'Products' },
                receiveLabel: 'Stock In',
                releaseLabel: 'Stock Out',
                stockLabel: 'In-Store',
                priceLabel: 'MSRP',
                ingredientsLabel: 'Bulk Stock',
                productsLabel: 'Product Catalog',
                recipeLabel: null,
                boqLabel: 'Inventory Analysis'
            },
            fulfillment: {
                orderTitle: 'Bulk Sales Order',
                nodeSubtitle: 'Store fulfillment & Procurement',
                clientLabel: 'Business Client',
                contactLabel: 'Procurement Specialist',
                logisticsLabel: 'Logistics & Dispatch',
                dateLabel: 'Expected Delivery',
                unitsLabel: 'Total Units',
                locationLabel: 'Shipping Address',
                finalizeLabel: 'Finalize Transaction',
                navLabel: 'Stock & Dispatch',
                standardOrdersLabel: 'Restock Pipeline',
                customOrdersLabel: 'Client Orders',
                fulfillmentHub: 'Fulfillment Node',
                productionLabel: 'Fulfillment',
                standardOrders: 'Catalog Order',
                customOrders: 'Special Request',
                categories: ['Apparel', 'Accessories', 'Footwear', 'Limited Edition', 'General Stock'],
                categoryMap: {}
            }
        },
        features: {
            showFulfillment: true,
            showVisualizer: false,
            showCustomFields: false,
            showBOQ: false,
            showRequisitions: true,
            showProjections: true,
            taxConfig: {
                serviceChargeRate: 0,
                vatRate: 0.075
            }
        }
    },
    Catering: {
        type: 'Catering',
        label: 'Catering',
        ui: {
            productsIcon: Utensils,
            fulfillmentIcon: ChefHat,
            standardIcon: UtensilsCrossed,
            customIcon: ShoppingBag,
            cardImageHeight: 'h-96',
            defaultCategories: ["Hors D'Oeuvres", "Starters", "Salads", "Nigerian Cuisine", "Oriental", "Continental", "Hot Plates", "Desserts"]
        },
        nomenclature: {
            inventory: {
                pipelineLabel: 'Food Ingredient Pipeline',
                pipelineSubtitle: 'Culinary supply chain and portion monitoring',
                substanceLabel: { singular: 'Ingredient', plural: 'Ingredients' },
                receiveLabel: 'Receive Stock',
                releaseLabel: 'Kitchen Release',
                stockLabel: 'On-Hand',
                priceLabel: 'Unit Cost',
                ingredientsLabel: 'Raw Materials',
                productsLabel: 'Offerings',
                recipeLabel: 'Neural Recipes',
                boqLabel: 'Analyze Bill of Quantities'
            },
            fulfillment: {
                orderTitle: 'Custom Order',
                nodeSubtitle: 'Bespoke Culinary Request',
                clientLabel: 'Host Name',
                contactLabel: 'Event Details',
                logisticsLabel: 'Coordination & Setup',
                dateLabel: 'Event Date',
                unitsLabel: 'Guest Count',
                locationLabel: 'Venue Address',
                finalizeLabel: 'Close Order',
                navLabel: 'Catering Ops',
                standardOrdersLabel: 'Cuisine Orders',
                customOrdersLabel: 'Banquet Orders',
                fulfillmentHub: 'Fulfillment Hub',
                productionLabel: 'Production',
                standardOrders: 'Standard Orders',
                customOrders: 'Custom Orders',
                categories: ["Hors D'Oeuvres", "Starters", "Salads", "Nigerian Cuisine", "Oriental", "Continental", "Hot Plates", "Desserts"],
                categoryMap: {
                    "Wedding": "Hors D'Oeuvres",
                    "Birthday": "Nigerian Cuisine",
                    "Anniversary": "Continental",
                    "Corporate": "Oriental"
                }
            }
        },
        features: {
            showFulfillment: true,
            showVisualizer: true,
            showCustomFields: true,
            showBOQ: true,
            showRequisitions: true,
            showProjections: true,
            taxConfig: {
                serviceChargeRate: 0.15,
                vatRate: 0.075
            }
        }
    },
    Bakery: {
        type: 'Bakery',
        label: 'Bakery',
        ui: {
            productsIcon: Utensils,
            fulfillmentIcon: Flame,
            standardIcon: Utensils,
            customIcon: ShoppingBag,
            cardImageHeight: 'h-96',
            defaultCategories: ["Wedding Cakes", "Birthday Cakes", "Anniversary Cakes", "Cupcakes", "Cookies & Brownies", "Pastries", "Custom Designs"]
        },
        nomenclature: {
            inventory: {
                pipelineLabel: 'Bakery Supply Pipeline',
                pipelineSubtitle: 'Flour, sugar and decoration management',
                substanceLabel: { singular: 'Ingredient', plural: 'Ingredients' },
                receiveLabel: 'Receive Stock',
                releaseLabel: 'Kitchen Release',
                stockLabel: 'On-Hand',
                priceLabel: 'Unit Cost',
                ingredientsLabel: 'Baking Materials',
                productsLabel: 'Creations',
                recipeLabel: 'Neural Recipes',
                boqLabel: 'Analyze Bill of Quantities'
            },
            fulfillment: {
                orderTitle: 'Cake Order',
                nodeSubtitle: 'Bespoke Baking Request',
                clientLabel: 'Customer Name',
                contactLabel: 'Celebration Type',
                logisticsLabel: 'Pickup / Delivery',
                dateLabel: 'Collection Date',
                unitsLabel: 'Portions',
                locationLabel: 'Delivery Address',
                finalizeLabel: 'Complete Order',
                navLabel: 'Bakery Ops',
                standardOrdersLabel: 'Standard Orders',
                customOrdersLabel: 'Custom Orders',
                fulfillmentHub: 'Bakery Hub',
                productionLabel: 'Baking',
                standardOrders: 'Standard Products',
                customOrders: 'Custom Designs',
                categories: ['Wedding Cakes', 'Cakes', 'Pastries', 'Bread', 'Cookies'],
                categoryMap: {
                    "Wedding": "Wedding Cakes",
                    "Birthday": "Birthday Cakes",
                    "Anniversary": "Anniversary Cakes",
                    "Cupcake": "Cupcakes",
                    "Cookies": "Cookies & Brownies",
                    "Brownies": "Cookies & Brownies",
                    "Pastry": "Pastries",
                    "Custom": "Custom Designs"
                }
            }
        },
        features: {
            showFulfillment: true,
            showVisualizer: true,
            showCustomFields: true,
            showBOQ: true,
            showRequisitions: true,
            showProjections: true,
            taxConfig: {
                serviceChargeRate: 0.10,
                vatRate: 0.075
            }
        }
    },
    Aviation: {
        type: 'Aviation',
        label: 'Aviation',
        ui: {
            productsIcon: Zap,
            fulfillmentIcon: Box,
            standardIcon: Zap,
            customIcon: ShoppingBag,
            cardImageHeight: 'h-96',
            defaultCategories: ['Engine', 'Avionics', 'Airframe', 'Interior', 'Fasteners']
        },
        nomenclature: {
            inventory: {
                pipelineLabel: 'Parts Inventory Pipeline',
                pipelineSubtitle: 'Critical component tracking and safety compliance',
                substanceLabel: { singular: 'Part', plural: 'Parts' },
                receiveLabel: 'Log Inward',
                releaseLabel: 'Maintenance Issue',
                stockLabel: 'In-Hangar',
                priceLabel: 'Value',
                ingredientsLabel: 'Line Items',
                productsLabel: 'Component List',
                recipeLabel: 'Assembly Guide',
                boqLabel: 'BOM Analysis'
            },
            fulfillment: {
                orderTitle: 'Mission Supply Request',
                nodeSubtitle: 'FLIGHT OPS / MAINT',
                clientLabel: 'Captain / Head of Ops',
                contactLabel: 'Tail Number / Mission',
                logisticsLabel: 'Dispatch Logistics',
                dateLabel: 'Mission Date',
                unitsLabel: 'Component Qty',
                locationLabel: 'Hangar / Remote Asset',
                finalizeLabel: 'Approve Request',
                navLabel: 'Mission Supplies',
                standardOrdersLabel: 'Standard Orders',
                customOrdersLabel: 'Custom Requests',
                fulfillmentHub: 'Operations Hub',
                productionLabel: 'Logistics',
                standardOrders: 'Mission Pack',
                customOrders: 'Unscheduled Need',
                categories: ['Engine Parts', 'Avionics', 'Consumables', 'Hydraulics', 'Safety Gear'],
                categoryMap: {}
            }
        },
        features: {
            showFulfillment: true,
            showVisualizer: false,
            showCustomFields: false,
            showBOQ: true,
            showRequisitions: true,
            showProjections: true,
            taxConfig: {
                serviceChargeRate: 0,
                vatRate: 0
            }
        }
    },
    General: {
        type: 'General',
        label: 'General',
        ui: {
            productsIcon: Package,
            fulfillmentIcon: Grid3X3,
            standardIcon: Package,
            customIcon: ShoppingBag,
            cardImageHeight: 'h-96',
            defaultCategories: ['General', 'Office', 'Maintenance']
        },
        nomenclature: {
            inventory: {
                pipelineLabel: 'Resource Pipeline',
                pipelineSubtitle: 'General asset and stock management',
                substanceLabel: { singular: 'Item', plural: 'Items' },
                receiveLabel: 'Restock',
                releaseLabel: 'Dispatch',
                stockLabel: 'Storage',
                priceLabel: 'Rate',
                ingredientsLabel: 'Materials',
                productsLabel: 'Stock Items',
                recipeLabel: 'Manifest',
                boqLabel: 'Stock Analysis'
            },
            fulfillment: {
                orderTitle: 'Service Request',
                nodeSubtitle: 'General Operations Node',
                clientLabel: 'Internal Client',
                contactLabel: 'Request Info',
                logisticsLabel: 'Execution Details',
                dateLabel: 'Required Date',
                unitsLabel: 'Qty',
                locationLabel: 'Target Location',
                finalizeLabel: 'Complete Sale',
                navLabel: 'Fulfillment',
                standardOrdersLabel: 'Standard Orders',
                customOrdersLabel: 'Custom Requests',
                fulfillmentHub: 'Fulfillment Center',
                productionLabel: 'Processing',
                standardOrders: 'Standard Flow',
                customOrders: 'Custom Flow',
                categories: ['Standard'],
                categoryMap: {}
            }
        },
        features: {
            showFulfillment: true,
            showVisualizer: false,
            showCustomFields: false,
            showBOQ: false,
            showRequisitions: true,
            showProjections: true,
            taxConfig: {
                serviceChargeRate: 0,
                vatRate: 0.075
            }
        }
    }
};

export const getIndustryConfig = (type: string): IndustryProfile => {
    return INDUSTRY_PROFILES[type as IndustryType] || INDUSTRY_PROFILES.Retail;
};

