import Ticket from "../models/tickets.js";
import { EMAIL_TEMPLATES } from "../utils/emails/templates.js";
import { send_support_mail } from "../utils/mailer.js";

export const createTicket = async (req, res, next) => {
  try {
    let ticket = await Ticket.create({
      ...req.body,
      createdBy: req.user.userId,
      followups: [
        {
          message: "Ticket created",
          user: req.user.userId,
          status: "OPEN",
        },
      ],
    });

    ticket = await ticket.populate("createdBy", "name email");

    await send_support_mail(
      process.env.SUPPORT_EMAILS,
      `New Ticket: ${ticket.feedbackType}`,
      EMAIL_TEMPLATES.TICKET_CREATED_ADMIN(ticket, req.user)
    );

    await send_support_mail(
      ticket.createdBy.email,
      `Ticket Confirmation: ${ticket.ticketNo}`,
      EMAIL_TEMPLATES.TICKET_CREATED_USER(ticket)
    );

    res.status(201).json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};

export const getAllTickets = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "Super Admin") {
      filter.createdBy = req.user.userId;
    }

    const tickets = await Ticket.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("followups.user", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, tickets });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getTicketById = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "Super Admin") {
      filter.createdBy = req.user.userId;
    }

    filter._id = req.params.id;

    const ticket = await Ticket.findOne(filter)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("followups.user", "name email")
      .lean();

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Optional: sort followups chronologically
    ticket.followups = ticket.followups.sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { status, message, postponedUntil } = req.body;

    const ticket = await Ticket.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });

    ticket.status = status;

    const followup = {
      status,
      message,
      user: req.user.userId,
    };

    if (status === "POSTPONED") {
      followup.postponedUntil = postponedUntil;
    }

    if (status === "RESOLVED") {
      followup.resolvedAt = new Date();
    }

    ticket.followups.push(followup);

    await ticket.save();

    if (status === "RESOLVED") {
      await send_support_mail(
        ticket.createdBy.email,
        `Ticket Resolved: ${ticket.ticketNo}`,
        EMAIL_TEMPLATES.TICKET_RESOLVED_USER(ticket)
      );
    }

    res.json({ success: true, ticket });
  } catch (err) {
    next(err);
  }
};
