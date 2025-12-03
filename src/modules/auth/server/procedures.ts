import { baseProcedure, createTRPCRouter } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import db from "@/db";
import { user } from "@/db/schema";
import { nanoid } from "nanoid";
import { signIn } from "@/auth";
import bcrypt from "bcryptjs";
import { encrypt } from "@/modules/auth/encryptHook";
import { eq, or } from "drizzle-orm";

const authRouter = createTRPCRouter({
  generateOTP: baseProcedure
    .input(
      z.object({
        number: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        const otp = await bcrypt.hash(OTP, 6);
        console.log(otp, input.number);
        // TODO: Remove this line after development
        console.log(OTP);
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
        if (process.env.NODE_ENV === "development") console.log(input);
        if (!date || !email || !phoneNumber || !username) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing Body Data",
          });
        }

        const existingUser = await db
          .select()
          .from(user)
          .where(or(eq(user.email, email), eq(user.phoneNumber, phoneNumber)));

        if (existingUser.length > 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "User already exist",
          });
        }

        const newUser = await db
          .insert(user)
          .values({
            id: nanoid(),
            DOB: date,
            phoneNumber,
            name: username,
            email,
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: new Date(),
          })
          .returning();

        await signIn("credentials", {
          phoneNumber,
          name: username,
          email,
          emailVerified: newUser[0].emailVerified,
          redirectTo: "/"
        });
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server Error",
        });
      }
    }),
  encrypt: baseProcedure
    .input(z.object({ number: z.string() }))
    .mutation(async ({ input }) => {
      try {
        const { number } = input;

        if (!number) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing Body Data",
          });
        }
        return { number: encrypt(input) };
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
