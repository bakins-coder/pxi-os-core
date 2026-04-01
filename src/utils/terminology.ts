
export const getIndustryTerminology = (industry: string): Record<string, string> => {
  const common = {
    calendar: 'Operational Schedule',
    event_pipeline: 'EVENT PIPELINE',
    upcoming_events: 'Upcoming Events',
    project_timeline: 'PROJECT TIMELINE'
  };

  const verticals: Record<string, Record<string, string>> = {
    'Dental Clinic': {
      calendar: 'Appointment Schedule',
      event_pipeline: 'CLINIC SCHEDULE',
      upcoming_events: 'Patient Appointments',
      procurement: 'Supply Requests'
    },
    'Dental': {
      calendar: 'Appointment Schedule',
      event_pipeline: 'CLINIC SCHEDULE',
      upcoming_events: 'Patient Appointments',
      procurement: 'Supply Requests'
    },
    'Retail': {
      calendar: 'Promotional Schedule',
      event_pipeline: 'RETAIL OPS',
      upcoming_events: 'Upcoming Sales',
      procurement: 'Restock Requests'
    },
    'Legal Firm': {
      calendar: 'Court & Filing Schedule',
      event_pipeline: 'CASE TIMELINE',
      upcoming_events: 'Legal Deadlines',
      procurement: 'Resource Requests'
    },
    'Legal': {
      calendar: 'Court & Filing Schedule',
      event_pipeline: 'CASE TIMELINE',
      upcoming_events: 'Legal Deadlines',
      procurement: 'Resource Requests'
    },
    'Logistics': {
      calendar: 'Delivery Schedule',
      event_pipeline: 'FLEET STATUS',
      upcoming_events: 'Shipment Tracking'
    },
    'Catering': {
      calendar: 'Event Schedule',
      event_pipeline: 'EVENT PIPELINE',
      upcoming_events: 'Upcoming Catering'
    }
  };

  return { ...common, ...(verticals[industry] || {}) };
};

export const getTerm = (industry: string | undefined, key: string, fallback: string): string => {
  if (!industry) return fallback;
  const terms = getIndustryTerminology(industry);
  return terms[key] || fallback;
};
