import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./common/redis/redis.module";
import { CacheModule } from "./common/cache/cache.module";
import { FirebaseModule } from "./common/firebase/firebase.module";
import { QueueModule } from "./common/queue/queue.module";
import { RequestIdMiddleware } from "./common/middleware/request-id.middleware";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProductsModule } from "./modules/products/products.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { BrandsModule } from "./modules/brands/brands.module";
import { CartModule } from "./modules/cart/cart.module";
import { WishlistModule } from "./modules/wishlist/wishlist.module";
import { AddressesModule } from "./modules/addresses/addresses.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { CouponsModule } from "./modules/coupons/coupons.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { SearchModule } from "./modules/search/search.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SellersModule } from "./modules/sellers/sellers.module";
import { AdminModule } from "./modules/admin/admin.module";
import { UploadsModule } from "./modules/uploads/uploads.module";
import { RecommendationsModule } from "./modules/recommendations/recommendations.module";
import { EventsModule } from "./modules/events/events.module";
import { AiModule } from "./modules/ai/ai.module";
import { AlertsModule } from "./modules/alerts/alerts.module";
import { LoyaltyModule } from "./modules/loyalty/loyalty.module";
import { MembershipModule } from "./modules/membership/membership.module";
import { I18nModule } from "./modules/i18n/i18n.module";
import { DeliveryModule } from "./modules/delivery/delivery.module";
import { SupportModule } from "./modules/support/support.module";
import { CommissionsModule } from "./modules/commissions/commissions.module";
import { BannersModule } from "./modules/banners/banners.module";
import { SentryModule } from "./common/sentry/sentry.module";
import { OpenSearchModule } from "./common/opensearch/opensearch.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { FraudModule } from "./modules/fraud/fraud.module";
import { FeatureFlagsModule } from "./modules/feature-flags/feature-flags.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";
import { TrackingGateway } from "./gateway/tracking.gateway";
import { HealthController } from "./health.controller";
import { RootController } from "./root.controller";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    CacheModule,
    FirebaseModule,
    QueueModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    CartModule,
    WishlistModule,
    AddressesModule,
    OrdersModule,
    PaymentsModule,
    CouponsModule,
    ReviewsModule,
    SearchModule,
    NotificationsModule,
    SellersModule,
    AdminModule,
    UploadsModule,
    RecommendationsModule,
    EventsModule,
    AiModule,
    AlertsModule,
    LoyaltyModule,
    MembershipModule,
    I18nModule,
    DeliveryModule,
    SupportModule,
    CommissionsModule,
    BannersModule,
    SentryModule,
    OpenSearchModule,
    AnalyticsModule,
    FraudModule,
    FeatureFlagsModule,
    ReferralsModule,
  ],
  controllers: [HealthController, RootController],
  providers: [
    TrackingGateway,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes("*");
  }
}
