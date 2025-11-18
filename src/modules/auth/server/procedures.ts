import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

const authRouter = createTRPCRouter({
  generateOTP: baseProcedure
    .input(
      z.object({
        number: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const otp = Math.floor(100000 + Math.random() * 900000);
        console.log(otp, input.number);
        return { otp };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server Error",
        });
      }
    }),
});

export default authRouter;
