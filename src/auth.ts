import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import db from "@/db";
import { user, session, account, verification } from "@/db/schema";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { type User } from "@auth/core/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account,
    sessionsTable: session,
    verificationTokensTable: verification,
  }),
  providers: [
    CredentialsProvider({
      credentials: {
        phoneNumber: { label: "phoneNumber" },
        name: { label: "name" },
        email: { label: "email" },
        emailVerified: { label: "emailVerified" },
      },
      async authorize(credentials) {
        const [existingUser] = await db
          .select()
          .from(user)
          .where(eq(user.email, credentials.email as string));

        if (!existingUser) return null;

        return existingUser as User;
      },
    }),
  ],
  secret: process.env.AUTH_SECRET!,
  session: { strategy: "jwt" },
});
