import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, mobile: true, role: true, avatar: true, createdAt: true, locale: true },
    });
  }

  async updateProfile(userId: string, data: { name?: string; email?: string; gender?: string; dob?: string; avatar?: string; locale?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }
}