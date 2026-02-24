import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUSES = [
  "new",
  "contacted",
  "qualified",
  "callback",
  "not_interested",
  "converted",
];

function toDateTimeLocal(value) {
  if (!value) return "";
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function App() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [newLead, setNewLead] = useState({
    phone: "",
    name: "",
    message: "",
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    return params.toString();
  }, [statusFilter, search]);

  const syncDrafts = (rows) => {
    const nextDrafts = {};
    for (const lead of rows) {
      nextDrafts[lead.id] = {
        name: lead.name || "",
        status: lead.status || "new",
        assignedTo: lead.assignedTo || "",
        notes: lead.notes || "",
        followUpAt: toDateTimeLocal(lead.followUpAt),
        lastCallOutcome: lead.lastCallOutcome || "",
      };
    }
    setDrafts(nextDrafts);
  };

  const loadLeads = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_BASE}/api/leads${queryString ? `?${queryString}` : ""}`
      );
      if (!response.ok) throw new Error("Unable to fetch leads");

      const data = await response.json();
      setLeads(data);
      syncDrafts(data);
    } catch (loadError) {
      setError(loadError.message || "Unable to load leads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [queryString]);

  const updateDraft = (id, field, value) => {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  };

  const saveLead = async (id, markCalled = false) => {
    const draft = drafts[id];
    if (!draft) return;

    setSavingId(id);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name || null,
          status: draft.status,
          assignedTo: draft.assignedTo || null,
          notes: draft.notes || null,
          followUpAt: draft.followUpAt || null,
          lastCallOutcome: draft.lastCallOutcome || null,
          markCalled,
        }),
      });

      if (!response.ok) throw new Error("Unable to save lead");
      await loadLeads();
    } catch (saveError) {
      setError(saveError.message || "Unable to save lead");
    } finally {
      setSavingId(null);
    }
  };

  const createManualLead = async (event) => {
    event.preventDefault();
    if (!newLead.phone.trim()) {
      setError("Phone is required");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: newLead.phone,
          name: newLead.name || null,
          message: newLead.message || null,
          source: "manual_form",
          status: "new",
        }),
      });

      if (!response.ok) throw new Error("Unable to create lead");

      setNewLead({ phone: "", name: "", message: "" });
      await loadLeads();
    } catch (createError) {
      setError(createError.message || "Unable to create lead");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Lead Management</h1>
          <p>WhatsApp ad leads for sales follow-up</p>
        </div>
        <button type="button" className="button" onClick={loadLeads}>
          Refresh
        </button>
      </header>

      <section className="filters card">
        <label>
          Status
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">All</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="search-input">
          Search
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Phone, name, or notes"
          />
        </label>

        <button
          type="button"
          className="button"
          onClick={() => setSearch(searchInput.trim())}
        >
          Apply
        </button>
      </section>

      <section className="card">
        <h2>Create test lead</h2>
        <form className="create-form" onSubmit={createManualLead}>
          <input
            value={newLead.phone}
            onChange={(event) =>
              setNewLead((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="Phone (required)"
            required
          />
          <input
            value={newLead.name}
            onChange={(event) =>
              setNewLead((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Name"
          />
          <input
            value={newLead.message}
            onChange={(event) =>
              setNewLead((current) => ({
                ...current,
                message: event.target.value,
              }))
            }
            placeholder='First message, e.g. "Hi"'
          />
          <button type="submit" className="button" disabled={creating}>
            {creating ? "Creating..." : "Add Lead"}
          </button>
        </form>
      </section>

      {error ? <p className="error">{error}</p> : null}

      <section className="card table-card">
        <h2>Leads</h2>
        {loading ? (
          <p>Loading leads...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Phone</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Assigned To</th>
                  <th>Notes</th>
                  <th>Follow Up</th>
                  <th>Call Outcome</th>
                  <th>Last Message</th>
                  <th>Called At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const draft = drafts[lead.id] || {};
                  const disabled = savingId === lead.id;
                  return (
                    <tr key={lead.id}>
                      <td>{lead.phone}</td>
                      <td>
                        <input
                          value={draft.name || ""}
                          onChange={(event) =>
                            updateDraft(lead.id, "name", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <select
                          value={draft.status || "new"}
                          onChange={(event) =>
                            updateDraft(lead.id, "status", event.target.value)
                          }
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          value={draft.assignedTo || ""}
                          onChange={(event) =>
                            updateDraft(lead.id, "assignedTo", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={draft.notes || ""}
                          onChange={(event) =>
                            updateDraft(lead.id, "notes", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="datetime-local"
                          value={draft.followUpAt || ""}
                          onChange={(event) =>
                            updateDraft(lead.id, "followUpAt", event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          value={draft.lastCallOutcome || ""}
                          onChange={(event) =>
                            updateDraft(
                              lead.id,
                              "lastCallOutcome",
                              event.target.value
                            )
                          }
                        />
                      </td>
                      <td title={lead.lastMessage || ""}>{lead.lastMessage || "-"}</td>
                      <td>{formatDate(lead.lastCalledAt)}</td>
                      <td className="actions">
                        <button
                          type="button"
                          className="button small"
                          onClick={() => saveLead(lead.id, false)}
                          disabled={disabled}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="button small secondary"
                          onClick={() => saveLead(lead.id, true)}
                          disabled={disabled}
                        >
                          Save + Called
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
