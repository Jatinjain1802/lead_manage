const leadModel = require("../models/leadModel");
const { LEAD_STATUSES } = require("../config/constants");
const { normalizePhone } = require("../utils/helpers");
const { emitToAll } = require("../utils/socket");

const getLeads = async (req, res) => {
  try {
    const { status, assignedToId, search } = req.query;
    const requestedLimit = Number(req.query.limit || 100);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 500)
      : 100;

    const filters = { limit };

    if (status) {
      const normalizedStatus = String(status).toLowerCase();
      if (!LEAD_STATUSES.has(normalizedStatus)) {
        return res.status(400).json({ error: "Invalid status filter" });
      }
      filters.status = normalizedStatus;
    }

    if (assignedToId) {
      filters.assignedToId = Number(assignedToId);
    }

    if (search) {
      filters.search = String(search).trim();
    }

    const rows = await leadModel.getAllLeads(filters);
    return res.json(rows);
  } catch (error) {
    console.error("Failed to fetch leads:", error);
    return res.status(500).json({ error: "Failed to fetch leads" });
  }
};

const createLead = async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (!phone) return res.status(400).json({ error: "Valid phone is required" });

    const name = req.body.name ? String(req.body.name).trim() : null;
    const source = req.body.source ? String(req.body.source).trim() : "manual";
    const rawStatus = req.body.status ? String(req.body.status).toLowerCase() : "new";
    const status = LEAD_STATUSES.has(rawStatus) ? rawStatus : "new";
    const message = req.body.message ? String(req.body.message).trim() : null;

    const leadId = await leadModel.upsertLead(
      {
        phone,
        name,
        source,
        status,
        lastMessage: message,
        lastMessageAt: message ? new Date() : null,
      },
      { source: "manual_api", body: req.body }
    );

    const lead = await leadModel.getLeadById(leadId);
    emitToAll("lead_updated", lead); // Notify UI
    return res.status(201).json(lead);
  } catch (error) {
    console.error("Failed to create lead:", error);
    return res.status(500).json({ error: "Failed to create lead" });
  }
};

const activityModel = require("../models/activityModel");

const updateLead = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid lead id" });
    }

    const oldLead = await leadModel.getLeadById(id);
    if (!oldLead) return res.status(404).json({ error: "Lead not found" });

    const updates = [];
    const params = [];
    const body = req.body || {};

    if ("name" in body) {
      updates.push("name = ?");
      params.push(body.name ? String(body.name).trim() : null);
    }

    if ("status" in body) {
      const normalizedStatus = String(body.status || "").toLowerCase();
      if (!LEAD_STATUSES.has(normalizedStatus)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      updates.push("status = ?");
      params.push(normalizedStatus);
      
      if (normalizedStatus !== oldLead.status) {
        await activityModel.logActivity({
          leadId: id,
          actorId: req.user.id,
          type: 'status_change',
          description: `Changed status from ${oldLead.status} to ${normalizedStatus}`,
          oldValue: oldLead.status,
          newValue: normalizedStatus
        });
      }
    }

    if ("assignedToId" in body) {
      updates.push("assigned_to_id = ?");
      params.push(body.assignedToId ? Number(body.assignedToId) : null);
      // Logic for assignment tracking could go here
    }

    if ("notes" in body) {
      updates.push("notes = ?");
      params.push(body.notes ? String(body.notes).trim() : null);
    }

    if ("followUpAt" in body) {
      updates.push("follow_up_at = ?");
      params.push(body.followUpAt ? new Date(body.followUpAt) : null);
    }

    if ("lastCallOutcome" in body) {
      updates.push("last_call_outcome = ?");
      params.push(
        body.lastCallOutcome ? String(body.lastCallOutcome).trim() : null
      );
      
      if (body.lastCallOutcome && body.lastCallOutcome !== oldLead.last_call_outcome) {
        await activityModel.logActivity({
          leadId: id,
          actorId: req.user.id,
          type: 'call_log',
          description: `Logged call outcome: ${body.lastCallOutcome}`,
          newValue: body.lastCallOutcome
        });
      }
    }

    if (body.markCalled === true) {
      updates.push("last_called_at = CURRENT_TIMESTAMP");
    }

    if (!updates.length) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    const result = await leadModel.updateLead(id, updates, params);
    if (!result.affectedRows) {
      return res.status(404).json({ error: "Lead not found" });
    }

    const updatedLead = await leadModel.getLeadById(id);
    emitToAll("lead_updated", updatedLead); // Notify UI
    return res.json(updatedLead);
  } catch (error) {
    console.error("Failed to update lead:", error);
    return res.status(500).json({ error: "Failed to update lead" });
  }
};

const getActivityHistory = async (req, res) => {
  try {
    const leadId = Number(req.params.id);
    const activities = await activityModel.getActivitiesByLead(leadId);
    res.json(activities);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch activities" });
  }
};

const getStatuses = (req, res) => {
  res.json(Array.from(LEAD_STATUSES));
};

module.exports = {
  getLeads,
  createLead,
  updateLead,
  getStatuses,
  getActivityHistory,
};
