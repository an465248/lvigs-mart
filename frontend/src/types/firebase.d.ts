declare module "firebase/app" {
  export function initializeApp(config: Record<string, string | undefined>): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export interface FirebaseApp {
    name: string;
    options: Record<string, string | undefined>;
  }
}

declare module "firebase/auth" {
  import { FirebaseApp } from "firebase/app";

  export function getAuth(app?: FirebaseApp): Auth;
  export function signInWithPhoneNumber(
    auth: Auth,
    phoneNumber: string,
    appVerifier: RecaptchaVerifier
  ): Promise<ConfirmationResult>;

  export class RecaptchaVerifier {
    constructor(
      auth: Auth,
      containerOrId: string | HTMLElement,
      parameters?: { size?: string; callback?: () => void }
    );
    clear(): void;
  }

  export interface ConfirmationResult {
    confirm(verificationCode: string): Promise<UserCredential>;
  }

  export interface UserCredential {
    user: User;
  }

  export interface User {
    getIdToken(): Promise<string>;
    uid: string;
  }

  export type Auth = Record<string, unknown>;
}
