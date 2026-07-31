import { DEFAULT_PUBLIC_BUSINESS_SLUG } from '@/lib/config/businessSlug';

export const mockOfferings = [
  {
    _id: "off_basic_consultation",
    businessSlug: DEFAULT_PUBLIC_BUSINESS_SLUG,
    verticalType: "generic_service",
    name: "Basic Consultation",
    description: "Neutral consultation used to verify the scheduling flow.",
    category: "consultation",
    active: true,
    publicVisible: true,
    fulfillmentPolicy: {
      suggestedTeamId: "team_consultation",
      estimatedDurationMinutes: 60,
      slotGranularityMinutes: 15,
    },
  },
  {
    _id: "off_followup_review",
    businessSlug: DEFAULT_PUBLIC_BUSINESS_SLUG,
    verticalType: "generic_service",
    name: "Follow-up Review",
    description: "Short follow-up review for a previously opened case.",
    category: "consultation",
    active: true,
    publicVisible: true,
    fulfillmentPolicy: {
      suggestedTeamId: "team_consultation",
      estimatedDurationMinutes: 30,
      slotGranularityMinutes: 15,
    },
  },
  {
    _id: "off_service_orientation",
    businessSlug: DEFAULT_PUBLIC_BUSINESS_SLUG,
    verticalType: "generic_service",
    name: "Service Orientation",
    description: "Guided orientation to choose the right offer before booking.",
    category: "orientation",
    active: true,
    publicVisible: true,
    fulfillmentPolicy: {
      suggestedTeamId: "team_consultation",
      estimatedDurationMinutes: 45,
      slotGranularityMinutes: 15,
    },
  },
];

export const mockCatalogRepository = {
  async getOfferings({ businessSlug, verticalType }) {
    await new Promise((resolve) => setTimeout(resolve, 300));

    return mockOfferings.filter((offering) =>
      offering.businessSlug === businessSlug &&
      offering.verticalType === verticalType &&
      offering.active
    );
  },
};
