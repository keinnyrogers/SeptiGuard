export const REPORT_TYPES = ["All", "Analytics", "Complaints", "Maintenance", "Operations"];

export const DATE_RANGES = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 3 months" },
  { value: "180", label: "Last 6 months" },
  { value: "365", label: "Last 12 months" },
  { value: "all", label: "All time" },
];

// Placeholder rows shaped like the future reports API response.
export const SAMPLE_REPORTS = [
  {
    id: 1,
    report_name: "Community Fill Level Summary — September 2026",
    type: "Analytics",
    generated_by: "Admin User",
    file_path: "/reports/community-fill-september-2026.pdf",
    date_range_start: "2026-09-01",
    date_range_end: "2026-09-30",
    created_at: "2026-09-26T08:30:00Z",
  },
  {
    id: 2,
    report_name: "Complaint Summary — September 2026",
    type: "Complaints",
    generated_by: "Admin User",
    file_path: "/reports/complaints-september-2026.pdf",
    date_range_start: "2026-09-01",
    date_range_end: "2026-09-30",
    created_at: "2026-09-24T05:10:00Z",
  },
  {
    id: 3,
    report_name: "Monthly Desludging Activity",
    type: "Maintenance",
    generated_by: "HOA Officer",
    file_path: "/reports/desludging-september-2026.pdf",
    date_range_start: "2026-09-01",
    date_range_end: "2026-09-30",
    created_at: "2026-09-20T02:45:00Z",
  },
  {
    id: 4,
    report_name: "Tank Operations Overview",
    type: "Operations",
    generated_by: "Admin User",
    file_path: "/reports/tank-operations-august-2026.pdf",
    date_range_start: "2026-08-01",
    date_range_end: "2026-08-31",
    created_at: "2026-09-02T09:00:00Z",
  },
  {
    id: 5,
    report_name: "Community Fill Level Summary — August 2026",
    type: "Analytics",
    generated_by: "Admin User",
    file_path: "/reports/community-fill-august-2026.pdf",
    date_range_start: "2026-08-01",
    date_range_end: "2026-08-31",
    created_at: "2026-08-31T06:20:00Z",
  },
  {
    id: 6,
    report_name: "Quarterly Complaint Review — Q2 2026",
    type: "Complaints",
    generated_by: "HOA Officer",
    file_path: "/reports/complaints-q2-2026.pdf",
    date_range_start: "2026-04-01",
    date_range_end: "2026-06-30",
    created_at: "2026-07-05T03:15:00Z",
  },
];