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
import twilio from "twilio";

const authRouter = createTRPCRouter({
  generateOTP: baseProcedure
    .input(
      z.object({
        number: z.string(),
      }),
    )
    .mutation(async () => {
      try {
        const OTP = Math.floor(100000 + Math.random() * 900000).toString();
        const otp = await bcrypt.hash(OTP, 6);
        console.log(OTP);
        // const accountSid = process.env.TWILIO_ACCOUNT_SID!;
        // const accountToken = process.env.TWILIO_AUTH_TOKEN!;

        // const client = twilio(accountSid, accountToken);
        // await client.messages.create({
        // body: `Your Chat Application Verification Code is ${OTP}`,
        // messagingServiceSid: "MG4c55a38611298d12df0d907132cf69c4",
        // NOTE: The twilio account used for development is a trial account thus only sends to verified numbers
        // to: "+2349169199457",
        // to: input.number,
        // });
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
        profileImage: z.string().nullish(),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { date, email, phoneNumber, username, profileImage } = input;
        if (!date || !email || !phoneNumber || !username) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing Body Data",
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
            image: profileImage,
          })
          .returning();

        await signIn("credentials", {
          phoneNumber,
          name: username,
          email,
          emailVerified: newUser[0].emailVerified,
          redirect: false,
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

        const [existingUser] = await db
          .select()
          .from(user)
          .where(eq(user.phoneNumber, number));

        if (existingUser) {
          await signIn("credentials", {
            phoneNumber: existingUser.phoneNumber,
            name: existingUser.name,
            email: existingUser.email,
            emailVerified: existingUser.emailVerified,
            redirect: false,
          });
          return null;
        } else {
          return { number: encrypt(input) };
        }
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
