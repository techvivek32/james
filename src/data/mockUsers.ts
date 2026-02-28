import { FeatureToggles, UserProfile } from "../types";

function createDefaultToggles(): FeatureToggles {
  return {
    dashboard: true,
    userManagement: true,
    roleHierarchy: true,
    businessUnits: true,
    salesOverview: true,
    marketingOverview: true,
    courseManagement: true,
    materialsLibrary: true,
    approvalWorkflows: true,
    aiBots: true,
    webTemplates: true,
    featureToggles: true,
    systemSettings: true,
    teamBusinessPlans: true,
    teamFunnelMetrics: true,
    teamTraining: true,
    aiAssistant: true,
    businessPlan: true,
    trainingCenter: true,
    marketingMaterials: true,
    aiChat: true,
    repWebPage: true,
    businessCards: true,
    assetLibrary: true,
    contentApprovals: true,
    socialMetrics: true
  };
}

export const mockUsers: UserProfile[] = [
  {
    id: "admin-1",
    name: "Alex Morgan",
    email: "alex.morgan@company.com",
    role: "admin",
    strengths: "Strategic vision, leadership, cross-functional execution",
    weaknesses: "Delegation, overcommitting to initiatives",
    headshotUrl: "",
    phone: "555-0100",
    territory: "National",
    publicProfile: {
      showHeadshot: false,
      showEmail: false,
      showPhone: false,
      showStrengths: false,
      showWeaknesses: false,
      showTerritory: false
    },
    webPage: {
      status: "draft"
    },
    featureToggles: createDefaultToggles()
  },
  {
    id: "manager-1",
    name: "Brooke Taylor",
    email: "brooke.taylor@company.com",
    role: "manager",
    strengths: "Coaching, pipeline management, recruiting",
    weaknesses: "Time management, saying no",
    headshotUrl: "",
    phone: "555-0200",
    territory: "West Region",
    publicProfile: {
      showHeadshot: false,
      showEmail: false,
      showPhone: false,
      showStrengths: false,
      showWeaknesses: false,
      showTerritory: false
    },
    webPage: {
      status: "draft"
    },
    featureToggles: createDefaultToggles()
  },
  {
    id: "sales-1",
    name: "Chris Lee",
    email: "chris.lee@company.com",
    role: "sales",
    managerId: "manager-1",
    strengths: "Door knocking, rapport building, objection handling",
    weaknesses: "Follow-up, admin work",
    headshotUrl: "",
    phone: "555-0300",
    territory: "Denver, CO",
    publicProfile: {
      showHeadshot: false,
      showEmail: false,
      showPhone: false,
      showStrengths: false,
      showWeaknesses: false,
      showTerritory: false
    },
    webPage: {
      status: "draft"
    },
    featureToggles: createDefaultToggles()
  },
  {
    id: "marketing-1",
    name: "Dana Smith",
    email: "dana.smith@company.com",
    role: "marketing",
    strengths: "Content strategy, social campaigns, analytics",
    weaknesses: "Saying no to ad-hoc requests",
    headshotUrl: "",
    phone: "555-0400",
    territory: "Corporate",
    publicProfile: {
      showHeadshot: false,
      showEmail: false,
      showPhone: false,
      showStrengths: false,
      showWeaknesses: false,
      showTerritory: false
    },
    webPage: {
      status: "draft"
    },
    featureToggles: createDefaultToggles()
  }
];
