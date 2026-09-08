import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class OpenSearchService implements OnModuleInit {
  private readonly logger = new Logger(OpenSearchService.name);
  private client: any = null;
  private enabled = false;

  constructor(private config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get("OPENSEARCH_URL");
    if (!url) {
      this.logger.log("OpenSearch URL not configured — using Prisma search fallback");
      return;
    }

    try {
      let ClientClass: any;
      try {
        const mod = await import("@opensearch-project/opensearch");
        ClientClass = mod.Client;
      } catch {
        ClientClass = null;
      }

      if (!ClientClass) {
        this.logger.warn(
          "@opensearch-project/opensearch not installed — run: npm install @opensearch-project/opensearch",
        );
        return;
      }

      this.client = new ClientClass({ node: url });
      this.enabled = true;
      this.logger.log("OpenSearch connected successfully");

      // Create index if it doesn't exist
      await this.createIndex();
    } catch (err: any) {
      this.logger.warn(`OpenSearch connection failed: ${err.message}`);
    }
  }

  get isEnabled(): boolean {
    return this.enabled;
  }

  async healthCheck(): Promise<{ status: string; url?: string }> {
    if (!this.enabled || !this.client) {
      return { status: "disabled" };
    }
    try {
      await this.client.cluster.health();
      return { status: "ok", url: this.config.get("OPENSEARCH_URL") };
    } catch (err: any) {
      return { status: "error" };
    }
  }

  async indexProduct(product: any): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      await this.client.index({
        index: "products",
        id: product.id,
        body: {
          title: product.title,
          description: product.description,
          brand: product.brand?.name || "",
          category: product.category?.name || "",
          price: product.price,
          mrp: product.mrp,
          rating: product.rating,
          tags: product.tags || [],
          isActive: product.isActive,
          isApproved: product.isApproved,
          createdAt: product.createdAt,
        },
      });
    } catch (err: any) {
      this.logger.warn(`OpenSearch index failed for product ${product.id}: ${err.message}`);
    }
  }

  async removeProduct(productId: string): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      await this.client.delete({ index: "products", id: productId });
    } catch (err: any) {
      this.logger.warn(`OpenSearch delete failed for product ${productId}: ${err.message}`);
    }
  }

  async search(query: string, options?: { limit?: number; offset?: number }): Promise<any[]> {
    if (!this.enabled || !this.client) return [];
    try {
      const result = await this.client.search({
        index: "products",
        body: {
          query: {
            multi_match: {
              query,
              fields: ["title^3", "brand^2", "category", "description", "tags"],
              fuzziness: "AUTO",
            },
          },
          from: options?.offset || 0,
          size: options?.limit || 20,
        },
      });
      return result.body.hits.hits.map((hit: any) => ({
        ...hit._source,
        id: hit._id,
        score: hit._score,
      }));
    } catch (err: any) {
      this.logger.warn(`OpenSearch search failed: ${err.message}`);
      return [];
    }
  }

  async bulkIndex(products: any[]): Promise<{ indexed: number; failed: number }> {
    if (!this.enabled || !this.client) return { indexed: 0, failed: 0 };

    let indexed = 0;
    let failed = 0;

    try {
      const body = products.flatMap((product) => [
        { index: { _index: "products", _id: product.id } },
        {
          title: product.title,
          description: product.description,
          brand: product.brand?.name || "",
          category: product.category?.name || "",
          price: product.price,
          mrp: product.mrp,
          rating: product.rating,
          tags: product.tags || [],
          isActive: product.isActive,
          isApproved: product.isApproved,
          createdAt: product.createdAt,
        },
      ]);

      const result = await this.client.bulk({ body });
      indexed = result.body.items.filter((item: any) => !item.index.error).length;
      failed = result.body.items.filter((item: any) => item.index.error).length;

      this.logger.log(`Bulk index: ${indexed} indexed, ${failed} failed`);
    } catch (err: any) {
      this.logger.warn(`Bulk index failed: ${err.message}`);
      failed = products.length;
    }

    return { indexed, failed };
  }

  async createIndex(): Promise<void> {
    if (!this.enabled || !this.client) return;
    try {
      const exists = await this.client.indices.exists({ index: "products" });
      if (!exists.body) {
        await this.client.indices.create({
          index: "products",
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
            },
            mappings: {
              properties: {
                title: { type: "text", analyzer: "standard" },
                description: { type: "text" },
                brand: { type: "keyword" },
                category: { type: "keyword" },
                price: { type: "float" },
                mrp: { type: "float" },
                rating: { type: "float" },
                tags: { type: "keyword" },
                isActive: { type: "boolean" },
                isApproved: { type: "boolean" },
                createdAt: { type: "date" },
              },
            },
          },
        });
        this.logger.log("OpenSearch products index created");
      }
    } catch (err: any) {
      this.logger.warn(`OpenSearch index creation failed: ${err.message}`);
    }
  }
}
