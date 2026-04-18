import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isSubscribed: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    passwordChangedAt?: number | null;
    isSubscribed?: boolean;
    avatar?: string | null;
    nickname?: string | null;
    dbCheckedAt?: number;
  }
}
