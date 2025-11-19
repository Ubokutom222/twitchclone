import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import db from "@/db";
import { user } from "@/db/schema";
import { nanoid } from "nanoid";

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
  register: baseProcedure
    .input(
      z.object({
        username: z
          .string()
          .min(3, "Username must be at least three characters")
          .max(128, "Username must not exceed 128 characters"),
        email: z.email(),
        phoneNumber: z.string().nonoptional(),
        date: z.string().nonoptional(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { date, email, phoneNumber, username } = input;

        if (!date || !email || !phoneNumber || !username) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing Body Data",
          });
        }

        await db.insert(user).values({
          id: nanoid(),
          DOB: date,
          phoneNumber,
          name: username,
          email,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
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
