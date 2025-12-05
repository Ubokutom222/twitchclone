import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import { auth } from "@/auth";
import { TRPCError } from "@trpc/server";
export async function createTRPCContext() {
  return { number: 123 };
}

// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  async function getSession() {
    const session = await auth();
    return session;
  }
  const gottenSession = await getSession();
  if (!gottenSession) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "No Signed In User" });
  }

  return next({
    ctx: {
      ...ctx,
      gottenSession,
    },
  });
});
