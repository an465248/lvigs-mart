import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BrandsService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  }
}