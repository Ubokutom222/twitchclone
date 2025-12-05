import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { not, eq } from "drizzle-orm";
import { user } from "@/db/schema";
import db from "@/db";

const homeRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.gottenSession?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized, Please sign in",
        });
      }
      const otherUsers = await db
        .select()
        .from(user)
        .where(not(eq(user.email, ctx.gottenSession?.user?.email as string)));
      return otherUsers;
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected Error Occured",
      });
    }
  }),
});

export default homeRouter;
