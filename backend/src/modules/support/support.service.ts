import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(userId: string, dto: {
    orderId?: string;
    subject: string;
    category: string;
    description: string;
    priority?: string;
    images?: string[];
  }) {
    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId,
          orderId: dto.orderId,
          subject: dto.subject,
          category: dto.category,
          priority: (dto.priority as any) || "MEDIUM",
        },
      });

      await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: userId,
          senderRole: "CUSTOMER",
          message: dto.description,
          attachments: dto.images || [],
        },
      });

      return ticket;
    });
  }

  async getTickets(userId: string, page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where: any = { userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: { messages: { orderBy: { createdAt: "asc" }, take: 1 } },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getTicket(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");
    return ticket;
  }

  async addMessage(userId: string, ticketId: string, message: string, attachments?: string[]) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });
    if (!ticket) throw new NotFoundException("Ticket not found");

    return this.prisma.$transaction(async (tx) => {
      const msg = await tx.supportMessage.create({
        data: {
          ticketId,
          senderId: userId,
          senderRole: "CUSTOMER",
          message,
          attachments: attachments || [],
        },
      });

      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { status: "OPEN" },
      });

      return msg;
    });
  }

  // Admin/Support staff methods
  async getAllTickets(page = 1, limit = 20, status?: string, assignedTo?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo;

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        skip, take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, mobile: true, email: true } },
          messages: { orderBy: { createdAt: "asc" }, take: 1 },
        },
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async assignTicket(ticketId: string, adminId: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedTo: adminId, status: "IN_PROGRESS" },
    });
  }

  async updateTicketStatus(ticketId: string, status: string) {
    return this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: status as any },
    });
  }

  async adminReply(ticketId: string, adminId: string, message: string, attachments?: string[]) {
    return this.prisma.supportMessage.create({
      data: {
        ticketId,
        senderId: adminId,
        senderRole: "ADMIN",
        message,
        attachments: attachments || [],
      },
    });
  }

  async getTicketStats() {
    const [open, inProgress, waitingForCustomer, resolved, closed] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: "OPEN" } }),
      this.prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
      this.prisma.supportTicket.count({ where: { status: "WAITING_FOR_CUSTOMER" } }),
      this.prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
      this.prisma.supportTicket.count({ where: { status: "CLOSED" } }),
    ]);

    return { open, inProgress, waitingForCustomer, resolved, closed, total: open + inProgress + waitingForCustomer + resolved + closed };
  }
}
