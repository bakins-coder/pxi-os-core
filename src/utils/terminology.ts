import { INDUSTRY_PROFILES, IndustryType } from '../config/industryProfiles';

export const getIndustryTerminology = (industry: string): Record<string, string> => {
  // Map internal industry strings to IndustryType
  let type: IndustryType = 'General';
  if (['Catering', 'Hospitality'].includes(industry)) type = 'Catering';
  else if (['Bakery', 'Cake', 'Confectionery'].includes(industry)) type = 'Bakery';
  else if (['Retail', 'Store', 'E-commerce'].includes(industry)) type = 'Retail';
  else if (['Aviation', 'Flight Ops'].includes(industry)) type = 'Aviation';
  else if (['Foundation', 'Sports Foundation', 'Non-Profit'].includes(industry)) type = 'Sports Foundation';

  const profile = INDUSTRY_PROFILES[type];
  
  // Flatten profile nomenclature for backward compatibility with getTerm
  return {
    calendar: profile.nomenclature.fulfillment.dateLabel || 'Schedule',
    event_pipeline: profile.nomenclature.fulfillment.fulfillmentTerm 
      ? `${profile.nomenclature.fulfillment.fulfillmentTerm.toUpperCase()} PIPELINE` 
      : (profile.nomenclature.inventory.pipelineLabel || 'PIPELINE'),
    upcoming_events: profile.nomenclature.fulfillment.orderTitle || 'Upcoming Events',
    procurement: profile.nomenclature.inventory.ingredientsLabel || 'Procurement',
    project_timeline: 'TIMELINE',
    order_title_singular: profile.nomenclature.fulfillment.fulfillmentTerm ? (profile.nomenclature.fulfillment.fulfillmentTerm.charAt(0).toUpperCase() + profile.nomenclature.fulfillment.fulfillmentTerm.slice(1)) : 'Order',
    order_title_plural: profile.nomenclature.fulfillment.fulfillmentTerm ? (profile.nomenclature.fulfillment.fulfillmentTerm.charAt(0).toUpperCase() + profile.nomenclature.fulfillment.fulfillmentTerm.slice(1) + 's') : 'Orders',
    type,
    ...profile.nomenclature.inventory,
    ...profile.nomenclature.fulfillment
  } as unknown as Record<string, string>;
};

export const getTerm = (industry: string | undefined, key: string, fallback: string): string => {
  if (!industry) return fallback;
  const terms = getIndustryTerminology(industry);
  return terms[key] || fallback;
};

