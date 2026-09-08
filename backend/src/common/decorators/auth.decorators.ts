import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import { VerifiedFirebaseUser } from "../firebase/firebase.service";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const FirebaseUser = createParamDecorator(
  (data: keyof VerifiedFirebaseUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const firebaseUser: VerifiedFirebaseUser | undefined = request.firebaseUser;

    if (!firebaseUser) return null;
    return data ? firebaseUser[data] : firebaseUser;
  },
);