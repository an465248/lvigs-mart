import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.userAddress.findMany({ where: { userId }, orderBy: { isDefault: "desc" } });
  }

  async add(userId: string, data: any) {
    if (data.isDefault) {
      await this.prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return this.prisma.userAddress.create({ data: { userId, ...data } });
  }

  async update(userId: string, id: string, data: any) {
    if (data.isDefault) {
      await this.prisma.userAddress.updateMany({ where: { userId, NOT: { id } }, data: { isDefault: false } });
    }
    return this.prisma.userAddress.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    return this.prisma.userAddress.delete({ where: { id } });
  }

  async checkPincode(pincode: string) {
    // Simplified - in production check against serviceable pincodes
    return { serviceable: true, deliveryDays: 2, deliveryCharge: 0, codAvailable: true };
  }
}