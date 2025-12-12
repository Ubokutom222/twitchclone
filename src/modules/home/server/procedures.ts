import { protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { not, eq, desc, and, sql, lt } from "drizzle-orm";
import {
  user,
  conversations,
  conversationMembers,
  messages,
} from "@/db/schema";
import db from "@/db";
import { z } from "zod";
import { nanoid } from "nanoid";

const homeRouter = createTRPCRouter({
  getUser: protectedProcedure.query(async ({ ctx }) => {
    try {
      if (!ctx.session?.user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Unauthorized, Please sign in",
        });
      }
      const otherUsers = await db
        .select()
        .from(user)
        .where(not(eq(user.email, ctx.session?.user?.email as string)));
      return otherUsers;
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected Error Occured",
      });
    }
  }),
  getChats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const convs = await db
        .select({
          id: conversations.id,
          isGroup: conversations.isGroup,
          name: conversations.name,
          createdAt: conversations.createdAt,
          updatedAt: conversations.updatedAt,
        })
        .from(conversations)
        .innerJoin(
          conversationMembers,
          eq(conversations.id, conversationMembers.conversationId),
        )
        .where(eq(conversationMembers.userId, ctx.session?.user?.id as string))
        .orderBy(desc(conversations.updatedAt));

      // Step 2: for each conversation, fetch its members
      const results = await Promise.all(
        convs.map(async (conv) => {
          const members = await db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
              emailVerified: user.emailVerified,
            })
            .from(user)
            .innerJoin(
              conversationMembers,
              eq(user.id, conversationMembers.userId),
            )
            .where(eq(conversationMembers.conversationId, conv.id));

          return {
            ...conv,
            members,
          };
        }),
      );
      return results;
    } catch (error) {
      console.log(error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Unexpected Error Occured",
      });
    }
  }),
  sendMessage: protectedProcedure
    .input(
      z
        .object({
          conversationId: z.string().min(1).optional(),
          recipientId: z.string().min(1).optional(),
          content: z.string().trim().max(4000).optional(),
          mediaUrl: z.string().url().optional(),
          mediaType: z.enum(["image", "video", "file"]).optional(),
        })
        .refine((d) => d.conversationId || d.recipientId, {
          message: "Either conversationId or receipientId must be provided",
          path: ["conversationId"],
        })
        .refine((d) => !!(d.content?.trim() || d.mediaUrl), {
          message: "Content or MediaUrl is required",
          path: ["content"],
        })
        .refine((d) => !d.mediaUrl || !!d.mediaType, {
          message: "mediaType is requried when mediaUrl is provided",
          path: ["mediaType"],
        }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const senderId = ctx.session?.user?.id as string;

        let conversationId = input.conversationId;

        if (!conversationId) {
          if (!input.recipientId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Either conversationid or recipientId must be provided",
            });
          }

          // Check if conversation already exists
          const existing = await db
            .select({ id: conversations.id })
            .from(conversations)
            .innerJoin(
              conversationMembers,
              eq(conversationMembers.conversationId, conversations.id),
            )
            .where(eq(conversations.isGroup, false))
            .groupBy(conversations.id)
            .having(
              and(
                sql`COUNT(*) = 2`, // must have exactly 2 members
                sql`bool_and(${conversationMembers.userId} in (${senderId}, ${input.recipientId}))`,
              ),
            )
            .limit(1);

          if (existing.length > 0) {
            conversationId = existing[0].id;
          } else {
            // Create new conversation
            const newConversation = await db
              .insert(conversations)
              .values({
                id: nanoid(),
                isGroup: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
              .returning();

            await db.insert(conversationMembers).values([
              { conversationId: newConversation[0].id, userId: senderId },
              {
                conversationId: newConversation[0].id,
                userId: input.recipientId,
              },
            ]);

            conversationId = newConversation[0].id;
          }
        }

        // Insert the message
        const [newMessage] = await db
          .insert(messages)
          .values({
            id: nanoid(),
            conversationId,
            senderId,
            content: input.content,
            createdAt: new Date(),
            messageType: input.mediaType ?? "text",
            mediaUrl: input.mediaUrl,
          })
          .returning();

        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected Error Occured",
        });
      }
    }),
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.iso.datetime().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const { conversationId, limit, cursor } = input;

        const rows = await db
          .select()
          .from(messages)
          .where(
            cursor
              ? and(
                  eq(messages.conversationId, conversationId),
                  lt(messages.createdAt, new Date(cursor)),
                )
              : eq(messages.conversationId, conversationId),
          )
          .orderBy(desc(messages.createdAt))
          .limit(limit + 1);

        let nextCursor: string | undefined;
        if (rows.length > limit) {
          const last = rows[rows.length - 1]; // the oldest in this page
          rows.pop();
          nextCursor = last.createdAt.toISOString();
        }

        return {
          messages: rows,
          nextCursor,
        };
      } catch (error) {
        console.log(error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Server Error",
        });
      }
    }),
});

export default homeRouter;
