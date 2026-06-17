/* === CONSTANTS === */
const SOURCES = [
  "Facebook Ads", "Instagram Ads", "Website Form",
  "Referral", "WhatsApp", "LinkedIn", "Cold Outreach", "Manual Entry"
];

const STATUSES = [
  { key: "New Lead", color: "#3B82F6", bg: "#EFF6FF" },
  { key: "Interested Customer", color: "#F59E0B", bg: "#FFFBEB" },
  { key: "Hot Lead", color: "#EF4444", bg: "#FEF2F2" },
  { key: "Follow Up", color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "Won Deal", color: "#10B981", bg: "#ECFDF5" },
  { key: "Lost Deal", color: "#6B7280", bg: "#F9FAFB" }
];

const LIFECYCLES = [
  { key: "lead", label: "Lead", color: "#3B82F6", bg: "#EFF6FF" },
  { key: "prospect", label: "Prospect", color: "#F59E0B", bg: "#FFFBEB" },
  { key: "active_customer", label: "Active Customer", color: "#10B981", bg: "#ECFDF5" },
  { key: "inactive", label: "Inactive", color: "#6B7280", bg: "#F9FAFB" },
  { key: "churned", label: "Churned", color: "#EF4444", bg: "#FEF2F2" }
];

const LIFECYCLE_MAP = {
  "New Lead": "lead",
  "Interested Customer": "prospect",
  "Hot Lead": "prospect",
  "Follow Up": "active_customer",
  "Won Deal": "active_customer",
  "Lost Deal": "inactive"
};

const STORAGE_KEYS = {
  CUSTOMERS: "saleshub_customers",
  ACTIVITY: "saleshub_activity",
  SETTINGS: "saleshub_settings"
};

/* === SAMPLE DATA === */
const SAMPLE_CUSTOMERS = [
  // New Leads (4)
  {
    id: "cust_101",
    fullName: "Ahmed Hassan",
    phone: "+20 100 123 4567",
    email: "ahmed.hassan@email.com",
    company: "TechCorp Egypt",
    source: "Facebook Ads",
    status: "New Lead",
    lifecycle: "lead",
    notes: [{ id: "note_001", text: "Interested in enterprise plan, requested demo", createdAt: "2024-05-20T09:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-20",
    nextFollowUpDate: "2024-05-25",
    createdAt: "2024-05-18T08:00:00Z"
  },
  {
    id: "cust_102",
    fullName: "Fatma Ali",
    phone: "+20 101 234 5678",
    email: "fatma.ali@email.com",
    company: "Nile Trading",
    source: "Instagram Ads",
    status: "New Lead",
    lifecycle: "lead",
    notes: [{ id: "note_002", text: "Reached out via Instagram DM", createdAt: "2024-05-21T10:30:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-21",
    nextFollowUpDate: "2024-05-28",
    createdAt: "2024-05-19T07:00:00Z"
  },
  {
    id: "cust_103",
    fullName: "Mohamed Salah",
    phone: "+20 102 345 6789",
    email: "mohamed.salah@email.com",
    company: "Cairo Innovations",
    source: "Website Form",
    status: "New Lead",
    lifecycle: "lead",
    notes: [{ id: "note_003", text: "Filled out contact form on website", createdAt: "2024-05-22T11:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-22",
    nextFollowUpDate: "2024-05-29",
    createdAt: "2024-05-20T09:30:00Z"
  },
  {
    id: "cust_104",
    fullName: "Nour Ibrahim",
    phone: "+20 103 456 7890",
    email: "nour.ibrahim@email.com",
    company: "Alex Solutions",
    source: "Cold Outreach",
    status: "New Lead",
    lifecycle: "lead",
    notes: [{ id: "note_004", text: "Cold email campaign response", createdAt: "2024-05-23T08:45:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-23",
    nextFollowUpDate: "2024-05-30",
    createdAt: "2024-05-21T10:00:00Z"
  },
  // Interested Customers (4)
  {
    id: "cust_105",
    fullName: "Omar Khaled",
    phone: "+20 110 567 8901",
    email: "omar.khaled@email.com",
    company: "Delta Group",
    source: "Referral",
    status: "Interested Customer",
    lifecycle: "prospect",
    notes: [{ id: "note_005", text: "Referred by Ahmed Hassan, very interested in premium tier", createdAt: "2024-05-15T14:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-15",
    nextFollowUpDate: "2024-05-22",
    createdAt: "2024-05-10T08:00:00Z"
  },
  {
    id: "cust_106",
    fullName: "Yasmin Mahmoud",
    phone: "+20 111 678 9012",
    email: "yasmin.mahmoud@email.com",
    company: "Sunny Media",
    source: "LinkedIn",
    status: "Interested Customer",
    lifecycle: "prospect",
    notes: [{ id: "note_006", text: "Connected on LinkedIn, sent product brochure", createdAt: "2024-05-16T10:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-16",
    nextFollowUpDate: "2024-05-23",
    createdAt: "2024-05-12T09:00:00Z"
  },
  {
    id: "cust_107",
    fullName: "Khaled Mostafa",
    phone: "+20 112 789 0123",
    email: "khaled.mostafa@email.com",
    company: "Red Sea Imports",
    source: "WhatsApp",
    status: "Interested Customer",
    lifecycle: "prospect",
    notes: [{ id: "note_007", text: "WhatsApp inquiry about pricing, sent quote", createdAt: "2024-05-17T15:30:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-17",
    nextFollowUpDate: "2024-05-24",
    createdAt: "2024-05-14T08:30:00Z"
  },
  {
    id: "cust_108",
    fullName: "Hana Gamal",
    phone: "+20 113 890 1234",
    email: "hana.gamal@email.com",
    company: "Giza Startups",
    source: "Manual Entry",
    status: "Interested Customer",
    lifecycle: "prospect",
    notes: [{ id: "note_008", text: "Met at trade show, interested in bulk pricing", createdAt: "2024-05-18T12:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-18",
    nextFollowUpDate: "2024-05-25",
    createdAt: "2024-05-15T11:00:00Z"
  },
  // Hot Leads (3)
  {
    id: "cust_109",
    fullName: "Tarek Nasser",
    phone: "+20 120 901 2345",
    email: "tarek.nasser@email.com",
    company: "Pharaoh Tech",
    source: "Facebook Ads",
    status: "Hot Lead",
    lifecycle: "prospect",
    notes: [{ id: "note_009", text: "Ready to sign, just needs approval from CTO", createdAt: "2024-05-14T09:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-14",
    nextFollowUpDate: "2024-05-20",
    createdAt: "2024-05-05T08:00:00Z"
  },
  {
    id: "cust_110",
    fullName: "Sara Adel",
    phone: "+20 121 012 3456",
    email: "sara.adel@email.com",
    company: "Nile Digital",
    source: "Instagram Ads",
    status: "Hot Lead",
    lifecycle: "prospect",
    notes: [{ id: "note_010", text: "Sent proposal last week, awaiting final decision", createdAt: "2024-05-15T11:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-15",
    nextFollowUpDate: "2024-05-21",
    createdAt: "2024-05-06T09:00:00Z"
  },
  {
    id: "cust_111",
    fullName: "Amr Farouk",
    phone: "+20 122 123 4567",
    email: "amr.farouk@email.com",
    company: "Sinai Enterprises",
    source: "Referral",
    status: "Hot Lead",
    lifecycle: "prospect",
    notes: [{ id: "note_011", text: "Budget approved, negotiating contract terms", createdAt: "2024-05-16T14:30:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-16",
    nextFollowUpDate: "2024-05-22",
    createdAt: "2024-05-07T10:00:00Z"
  },
  // Follow Up (3)
  {
    id: "cust_112",
    fullName: "Mona Said",
    phone: "+20 123 234 5678",
    email: "mona.said@email.com",
    company: "Aswan Crafts",
    source: "WhatsApp",
    status: "Follow Up",
    lifecycle: "active_customer",
    notes: [{ id: "note_012", text: "Had demo scheduled for May 20, rescheduled to May 27", createdAt: "2024-05-18T10:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-18",
    nextFollowUpDate: "2024-05-27",
    createdAt: "2024-05-08T08:00:00Z"
  },
  {
    id: "cust_113",
    fullName: "Hossam Eddin",
    phone: "+20 124 345 6789",
    email: "hossam.eddin@email.com",
    company: "Luxor Logistics",
    source: "LinkedIn",
    status: "Follow Up",
    lifecycle: "active_customer",
    notes: [{ id: "note_013", text: "Requested case study before final decision", createdAt: "2024-05-19T13:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-19",
    nextFollowUpDate: "2024-05-26",
    createdAt: "2024-05-09T07:30:00Z"
  },
  {
    id: "cust_114",
    fullName: "Dina Rashed",
    phone: "+20 125 456 7890",
    email: "dina.rashed@email.com",
    company: "Mansoura Foods",
    source: "Website Form",
    status: "Follow Up",
    lifecycle: "active_customer",
    notes: [{ id: "note_014", text: "Comparing with competitors, needs more time", createdAt: "2024-05-20T16:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: null,
    lastContactDate: "2024-05-20",
    nextFollowUpDate: "2024-05-28",
    createdAt: "2024-05-10T09:00:00Z"
  },
  // Won Deal (3)
  {
    id: "cust_115",
    fullName: "Youssef Karim",
    phone: "+20 126 567 8901",
    email: "youssef.karim@email.com",
    company: "Zamalek Finance",
    source: "Referral",
    status: "Won Deal",
    lifecycle: "active_customer",
    notes: [{ id: "note_015", text: "Deal closed! Signed annual contract", createdAt: "2024-05-12T10:00:00Z" }],
    dealValue: 15000,
    productPurchased: "Enterprise Annual Plan",
    lostReason: null,
    lastContactDate: "2024-05-12",
    nextFollowUpDate: null,
    createdAt: "2024-05-01T08:00:00Z"
  },
  {
    id: "cust_116",
    fullName: "Layla Mansour",
    phone: "+20 127 678 9012",
    email: "layla.mansour@email.com",
    company: "Helwan Steel",
    source: "Cold Outreach",
    status: "Won Deal",
    lifecycle: "active_customer",
    notes: [{ id: "note_016", text: "Converted after 3 follow-up calls", createdAt: "2024-05-13T14:00:00Z" }],
    dealValue: 8500,
    productPurchased: "Professional Plan",
    lostReason: null,
    lastContactDate: "2024-05-13",
    nextFollowUpDate: null,
    createdAt: "2024-05-02T09:00:00Z"
  },
  {
    id: "cust_117",
    fullName: "Rami Ashraf",
    phone: "+20 128 789 0123",
    email: "rami.ashraf@email.com",
    company: "Tanta Electronics",
    source: "Facebook Ads",
    status: "Won Deal",
    lifecycle: "active_customer",
    notes: [{ id: "note_017", text: "Upgraded from trial to paid plan", createdAt: "2024-05-14T11:00:00Z" }],
    dealValue: 4200,
    productPurchased: "Starter Plan",
    lostReason: null,
    lastContactDate: "2024-05-14",
    nextFollowUpDate: null,
    createdAt: "2024-05-03T07:30:00Z"
  },
  // Lost Deal (3)
  {
    id: "cust_118",
    fullName: "Nadia Youssef",
    phone: "+20 129 890 1234",
    email: "nadia.youssef@email.com",
    company: "Port Said Shipping",
    source: "Instagram Ads",
    status: "Lost Deal",
    lifecycle: "inactive",
    notes: [{ id: "note_018", text: "Went with competitor due to lower price", createdAt: "2024-05-15T09:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: "Price too high compared to competitor",
    lastContactDate: "2024-05-15",
    nextFollowUpDate: null,
    createdAt: "2024-05-04T08:00:00Z"
  },
  {
    id: "cust_119",
    fullName: "Walid Hamdy",
    phone: "+20 130 901 2345",
    email: "walid.hamdy@email.com",
    company: "Ismailia Textiles",
    source: "WhatsApp",
    status: "Lost Deal",
    lifecycle: "inactive",
    notes: [{ id: "note_019", text: "Budget cuts, decision postponed indefinitely", createdAt: "2024-05-16T10:30:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: "Budget cuts — project postponed",
    lastContactDate: "2024-05-16",
    nextFollowUpDate: null,
    createdAt: "2024-05-05T09:00:00Z"
  },
  {
    id: "cust_120",
    fullName: "Heba Mostafa",
    phone: "+20 131 012 3456",
    email: "heba.mostafa@email.com",
    company: "Damietta Furniture",
    source: "LinkedIn",
    status: "Lost Deal",
    lifecycle: "inactive",
    notes: [{ id: "note_020", text: "Not ready to switch from current provider", createdAt: "2024-05-17T15:00:00Z" }],
    dealValue: null,
    productPurchased: null,
    lostReason: "Satisfied with current provider",
    lastContactDate: "2024-05-17",
    nextFollowUpDate: null,
    createdAt: "2024-05-06T10:00:00Z"
  }
];

const SAMPLE_ACTIVITY = [
  {
    id: "act_001",
    type: "new_customer",
    customerName: "Nour Ibrahim",
    description: "added as new lead",
    timestamp: "2024-06-03T14:30:00Z"
  },
  {
    id: "act_002",
    type: "status_change",
    customerName: "Tarek Nasser",
    description: "moved from Interested Customer to Hot Lead",
    timestamp: "2024-06-03T13:15:00Z"
  },
  {
    id: "act_003",
    type: "note_added",
    customerName: "Omar Khaled",
    description: "added a note about premium tier interest",
    timestamp: "2024-06-03T12:00:00Z"
  },
  {
    id: "act_004",
    type: "follow_up",
    customerName: "Mona Said",
    description: "follow-up scheduled for May 27",
    timestamp: "2024-06-03T10:45:00Z"
  },
  {
    id: "act_005",
    type: "new_customer",
    customerName: "Mohamed Salah",
    description: "added as new lead",
    timestamp: "2024-06-02T16:00:00Z"
  },
  {
    id: "act_006",
    type: "status_change",
    customerName: "Sara Adel",
    description: "moved from Follow Up to Hot Lead",
    timestamp: "2024-06-02T15:00:00Z"
  },
  {
    id: "act_007",
    type: "note_added",
    customerName: "Fatma Ali",
    description: "added a note about Instagram DM inquiry",
    timestamp: "2024-06-02T13:30:00Z"
  },
  {
    id: "act_008",
    type: "status_change",
    customerName: "Amr Farouk",
    description: "moved from Interested Customer to Hot Lead",
    timestamp: "2024-06-02T11:00:00Z"
  },
  {
    id: "act_009",
    type: "new_customer",
    customerName: "Ahmed Hassan",
    description: "added as new lead",
    timestamp: "2024-06-01T17:00:00Z"
  },
  {
    id: "act_010",
    type: "follow_up",
    customerName: "Hossam Eddin",
    description: "follow-up reminder set",
    timestamp: "2024-06-01T14:30:00Z"
  },
  {
    id: "act_011",
    type: "note_added",
    customerName: "Youssef Karim",
    description: "added closing notes for annual contract",
    timestamp: "2024-06-01T12:00:00Z"
  },
  {
    id: "act_012",
    type: "status_change",
    customerName: "Layla Mansour",
    description: "moved from Hot Lead to Won Deal",
    timestamp: "2024-06-01T10:00:00Z"
  },
  {
    id: "act_013",
    type: "new_customer",
    customerName: "Khaled Mostafa",
    description: "added as new lead",
    timestamp: "2024-05-31T16:00:00Z"
  },
  {
    id: "act_014",
    type: "status_change",
    customerName: "Nadia Youssef",
    description: "moved from Hot Lead to Lost Deal",
    timestamp: "2024-05-31T14:00:00Z"
  },
  {
    id: "act_015",
    type: "note_added",
    customerName: "Dina Rashed",
    description: "added a note about competitor comparison",
    timestamp: "2024-05-31T11:30:00Z"
  }
];

/* === DATA INIT === */
// If localStorage has no customers, write SAMPLE_CUSTOMERS to it
// If localStorage has no activity, write SAMPLE_ACTIVITY to it
