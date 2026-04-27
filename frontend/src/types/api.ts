export interface Employee {
  id: number;
  name: string;
  email: string;
  department: string;
  team: string;
  role: string;
  copilot_enabled: boolean;
  created_at: string;
}

export interface EmployeeCreate {
  name: string;
  email: string;
  department: string;
  team: string;
  role: string;
  copilot_enabled: boolean;
}

export interface UsageRecord {
  id: number;
  employee_id: number;
  usage_date: string;
  suggestions_shown: number;
  suggestions_accepted: number;
  lines_suggested: number;
  lines_accepted: number;
  active_time_minutes: number;
  language: string;
  editor: string;
  acceptance_rate: number;
}

export interface DailySummary {
  date: string;
  total_suggestions_shown: number;
  total_suggestions_accepted: number;
  total_lines_suggested: number;
  total_lines_accepted: number;
  avg_acceptance_rate: number;
  total_active_minutes: number;
}

export interface EmployeeSummary {
  employee_id: number;
  employee_name: string;
  department: string;
  team: string;
  total_suggestions_shown: number;
  total_suggestions_accepted: number;
  total_lines_accepted: number;
  total_active_minutes: number;
  avg_acceptance_rate: number;
}

export interface LanguageBreakdown {
  language: string;
  total_suggestions: number;
  total_accepted: number;
  acceptance_rate: number;
}

export interface DepartmentSummary {
  department: string;
  employee_count: number;
  total_suggestions_shown: number;
  total_suggestions_accepted: number;
  avg_acceptance_rate: number;
}

export interface DashboardOverview {
  total_employees: number;
  copilot_enabled_count: number;
  total_suggestions_shown: number;
  total_suggestions_accepted: number;
  overall_acceptance_rate: number;
  total_active_hours: number;
  total_lines_accepted: number;
  daily_trends: DailySummary[];
  employee_summaries: EmployeeSummary[];
  language_breakdown: LanguageBreakdown[];
  department_summary: DepartmentSummary[];
}
