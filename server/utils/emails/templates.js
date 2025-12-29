export const EMAIL_TEMPLATES = {
  TICKET_CREATED_ADMIN: (ticket, user) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color: #007BFF;">CADer Support Ticket</h2>
  <p>Dear IT Team,</p>
  <p>We need your assistance with the following issue:</p>
  <p><strong>Topic:</strong> ${ticket.feedbackType}</p>
  <p><strong>Description:</strong> ${ticket.description}</p>
  <p><strong>Raised by:</strong> ${user.name} (${user.email})</p>
  <p>Kindly look into this matter at the earliest.</p>
</div>
`,

  TICKET_CREATED_USER: (ticket) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color: #28A745;">CADer Ticket Confirmation</h2>
  <p>Dear ${ticket.createdBy.name},</p>
  <p>Your support ticket has been successfully created. We will resolve it as soon as possible.</p>
  <p><strong>Ticket No:</strong> ${ticket.ticketNo}</p>
  <p><strong>Description:</strong> ${ticket.description}</p>
  <p>Thank you for reaching out to us!</p>
  <p>Best Regards,</p>
  <p>CADer Support Team</p>
</div>
`,

  TICKET_RESOLVED_USER: (ticket) => `
<div style="font-family: Arial, sans-serif; color: #333;">
  <h2 style="color: #17A2B8;">CADer Ticket Resolved</h2>
  <p>Dear ${ticket.createdBy.name},</p>
  <p>Your support ticket has been resolved.</p>
  <p><strong>Ticket No:</strong> ${ticket.ticketNo}</p>
  <p><strong>Message:</strong> ${
    ticket?.followups[ticket?.followups?.length - 1]?.message
  }</p>
  <p>We hope the solution meets your expectations. If you have further issues, feel free to reopen the ticket.</p>
  <p>Best Regards,</p>
  <p>CADer Support Team</p>
</div>
`,
};
