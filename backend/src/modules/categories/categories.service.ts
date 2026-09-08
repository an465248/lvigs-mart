import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async getAll() {
    return this.prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { order: "asc" },
      include: { children: { where: { isActive: true }, orderBy: { order: "asc" } } },
    });
  }

  async getBySlug(slug: string) {
    return this.prisma.category.findUnique({
      where: { slug, isActive: true },
      include: { children: { where: { isActive: true }, orderBy: { order: "asc" } } },
    });
  }
}