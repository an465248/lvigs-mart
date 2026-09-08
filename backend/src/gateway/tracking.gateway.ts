import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({ cors: { origin: "*" }, namespace: "/tracking" })
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, Set<string>>();

  constructor(private jwt: JwtService, private config: ConfigService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) { client.disconnect(); return; }
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.config.get("JWT_ACCESS_SECRET") || "dev-access-secret",
      });
      (client as any).userId = payload.sub;
      const sockets = this.userSockets.get(payload.sub) || new Set();
      sockets.add(client.id);
      this.userSockets.set(payload.sub, sockets);
      client.join(`user:${payload.sub}`);
      client.emit("connected", { ok: true });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    }
  }

  @SubscribeMessage("track:order")
  trackOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    const userId = (client as any).userId;
    if (!userId) return { error: "Unauthorized" };
    client.join(`order:${data.orderId}`);
    return { ok: true };
  }

  @SubscribeMessage("untrack:order")
  untrackOrder(@ConnectedSocket() client: Socket, @MessageBody() data: { orderId: string }) {
    client.leave(`order:${data.orderId}`);
    return { ok: true };
  }

  emitOrderUpdate(orderId: string, update: any) {
    this.server.to(`order:${orderId}`).emit("order:update", { orderId, ...update });
  }

  emitUserNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit("notification", notification);
  }
}