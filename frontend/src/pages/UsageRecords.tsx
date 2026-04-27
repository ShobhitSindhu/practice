import { useState } from "react";
import { RefreshCw } from "lucide-react";

import { useApi } from "../hooks/useApi";
import type { UsageRecord, Employee } from "../types/api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function UsageRecords() {
  const { data: records, loading, error, refetch } = useApi<UsageRecord[]>("/api/usage?limit=200");
  const { data: employees } = useApi<Employee[]>("/api/employees");
  const [filterEmp, setFilterEmp] = useState("");
  const [filterLang, setFilterLang] = useState("");

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="error-msg">Error: {error}</div>;

  const empMap = new Map(employees?.map((e) => [e.id, e.name]) ?? []);

  const filtered = (records ?? []).filter((r) => {
    if (filterEmp && r.employee_id !== Number(filterEmp)) return false;
    if (filterLang && r.language !== filterLang) return false;
    return true;
  });

  const languages = [...new Set((records ?? []).map((r) => r.language))].sort();

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Usage Records</h1>
        <button className="btn" onClick={refetch}>
          <RefreshCw size={18} /> Refresh
        </button>
      </div>

      <div className="filters">
        <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
          <option value="">All Employees</option>
          {employees?.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>
        <select value={filterLang} onChange={(e) => setFilterLang(e.target.value)}>
          <option value="">All Languages</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <span className="filter-count">{filtered.length} records</span>
      </div>

      <div className="chart-card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Language</th>
                <th>Editor</th>
                <th>Suggestions Shown</th>
                <th>Accepted</th>
                <th>Acceptance Rate</th>
                <th>Lines Accepted</th>
                <th>Active Min</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td>{r.usage_date}</td>
                  <td className="font-medium">{empMap.get(r.employee_id) ?? `#${r.employee_id}`}</td>
                  <td>
                    <span className="badge badge-blue">{r.language}</span>
                  </td>
                  <td>{r.editor}</td>
                  <td>{r.suggestions_shown}</td>
                  <td>{r.suggestions_accepted}</td>
                  <td>
                    <span
                      className={`badge ${
                        r.acceptance_rate >= 60
                          ? "badge-green"
                          : r.acceptance_rate >= 40
                          ? "badge-yellow"
                          : "badge-red"
                      }`}
                    >
                      {r.acceptance_rate.toFixed(1)}%
                    </span>
                  </td>
                  <td>{r.lines_accepted}</td>
                  <td>{r.active_time_minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
