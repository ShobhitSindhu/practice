import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useApi } from "../hooks/useApi";
import type { DashboardOverview } from "../types/api";
import LoadingSpinner from "../components/LoadingSpinner";

const COLORS = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function Analytics() {
  const { data, loading, error } = useApi<DashboardOverview>("/api/dashboard");

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-msg">Error: {error}</div>;
  if (!data) return null;

  const topEmployees = [...data.employee_summaries]
    .sort((a, b) => b.total_suggestions_accepted - a.total_suggestions_accepted)
    .slice(0, 10);

  const radarData = data.department_summary.map((d) => ({
    department: d.department,
    acceptance_rate: d.avg_acceptance_rate,
    employees: d.employee_count * 10,
    suggestions: Math.min(d.total_suggestions_shown / 100, 100),
  }));

  const weeklyData = data.daily_trends.reduce<
    { week: string; suggestions: number; accepted: number; rate: number; count: number }[]
  >((acc, day) => {
    const d = new Date(day.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    const existing = acc.find((w) => w.week === key);
    if (existing) {
      existing.suggestions += day.total_suggestions_shown;
      existing.accepted += day.total_suggestions_accepted;
      existing.count += 1;
      existing.rate = Math.round((existing.accepted / existing.suggestions) * 100);
    } else {
      acc.push({
        week: key,
        suggestions: day.total_suggestions_shown,
        accepted: day.total_suggestions_accepted,
        rate: day.total_suggestions_shown
          ? Math.round((day.total_suggestions_accepted / day.total_suggestions_shown) * 100)
          : 0,
        count: 1,
      });
    }
    return acc;
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Analytics & Deep Dive</h1>

      <div className="charts-row">
        <div className="chart-card wide">
          <h3>Weekly Acceptance Rate Trend</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                name="Acceptance Rate %"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Top 10 Employees by Accepted Suggestions</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topEmployees} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="employee_name" type="category" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="total_suggestions_accepted" name="Accepted" fill="#10b981" radius={[0, 4, 4, 0]}>
                {topEmployees.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Language Acceptance Rates</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.language_breakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="language" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="acceptance_rate" name="Acceptance %" fill="#6366f1" radius={[4, 4, 0, 0]}>
                {data.language_breakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <h3>Department Radar</h3>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="department" tick={{ fontSize: 11 }} />
              <PolarRadiusAxis tick={{ fontSize: 10 }} />
              <Radar
                name="Acceptance Rate"
                dataKey="acceptance_rate"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.3}
              />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Suggestions by Language (Pie)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={data.language_breakdown}
                dataKey="total_accepted"
                nameKey="language"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                label={({ language, percent }) => `${language} ${(percent * 100).toFixed(0)}%`}
              >
                {data.language_breakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
