// backend/src/controllers/ticketController.js
const ticketService = require('../services/ticketService');

class TicketController {
  async getAll(req, res) {
    try {
      const result = await ticketService.getAllTickets(req.query);
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getStats(req, res) {
    try {
      const stats = await ticketService.getTicketStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const ticket = await ticketService.getTicketById(req.params.id);
      return res.status(200).json({ success: true, data: ticket });
    } catch (error) {
      return res.status(404).json({ success: false, message: error.message });
    }
  }

  async update(req, res) {
    try {
      const updated = await ticketService.updateTicket(req.params.id, req.body, req.user?.id || 1);
      return res.status(200).json({
        success: true,
        data: updated,
        message: 'Ticket updated successfully',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const result = await ticketService.deleteTicket(req.params.id, req.user?.id || 1);
      return res.status(200).json({ success: true, message: result.message });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new TicketController();

