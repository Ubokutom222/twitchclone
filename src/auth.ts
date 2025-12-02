import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import db from "@/db";
import { user, session, account, verification } from "@/db/schema";
import CreadentialsProvider from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: user,
    accountsTable: account,
    sessionsTable: session,
    verificationTokensTable: verification,
  }),
  providers: [
    CreadentialsProvider({
      credentials: {
        phoneNumber: { label: "phoneNumber" },
        name: { label: "name" },
        email: { label: "email" },
        emailVerified: { label: "emailVerified" },
      },
      async authorize(credentials) {
        const [signedInUser] = await db
          .select()
          .from(user)
          .where(eq(user.email, credentials.email as string));

        if (signedInUser) {
          return signedInUser;
        } else return null;
      },
    }),
  ],
  secret: process.env.AUTH_SECRET!,
});
