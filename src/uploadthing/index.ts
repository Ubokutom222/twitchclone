import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/auth";
import { z } from "zod";
import db from "@/db";
import { conversations, conversationMembers, messages } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import pusherInstance from "@/lib/pusher";
const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({
    image: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 20,
    },
  })
    .input(
      z.object({
        conversationId: z.string().optional(),
        recipientId: z.string().optional(),
      }),
    )
    // Set permissions and file types for this FileRoute
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
      const session = await auth();

      // If you throw, the user will not be able to upload
      if (!session) throw new UploadThingError("Unauthorized");
      const senderId = session?.user?.id as string;

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return {
        senderId,
        conversationId: input.conversationId,
        recipientId: input.recipientId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        let conversationId = metadata.conversationId;

        if (!conversationId) {
          if (!metadata.recipientId) {
            throw new UploadThingError({
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
                sql`bool_and(${conversationMembers.userId} in (${metadata.senderId}, ${metadata.recipientId}))`,
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
              {
                conversationId: newConversation[0].id,
                userId: metadata.senderId,
              },
              {
                conversationId: newConversation[0].id,
                userId: metadata.recipientId,
              },
            ]);

            conversationId = newConversation[0].id;
          }
        }

        const [newMessage] = await db
          .insert(messages)
          .values({
            id: nanoid(),
            conversationId,
            senderId: metadata.senderId,
            createdAt: new Date(),
            messageType: "image",
            mediaUrl: file.ufsUrl,
          })
          .returning();

        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));
        console.log("file url", file.ufsUrl);

        try {
          await pusherInstance.trigger(
            `private-conversation-${conversationId}`,
            "new-message",
            {
              id: newMessage.id,
              content: newMessage.content,
              senderId: newMessage.senderId,
              createdAt: newMessage.createdAt,
              messageType: newMessage.messageType,
              mediaUrl: newMessage.mediaUrl,
            },
          );
        } catch (err) {
          // Don't fail the mutation; message is already stored.
          console.warn("Pusher Trigger faild", err);
        }

        // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        return { metaData: metadata, fileUrl: file.ufsUrl };
      } catch (error) {
        console.log(error);
        throw new UploadThingError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected Error Occured",
        });
      }
    }),
  videoUploader: f({
    video: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "64MB",
      maxFileCount: 4,
    },
  })
    .input(
      z.object({
        conversationId: z.string().optional(),
        recipientId: z.string().optional(),
      }),
    )
    // Set permissions and file types for this FileRoute
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
      const session = await auth();

      // If you throw, the user will not be able to upload
      if (!session) throw new UploadThingError("Unauthorized");
      const senderId = session?.user?.id as string;

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return {
        senderId,
        conversationId: input.conversationId,
        recipientId: input.recipientId,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        let conversationId = metadata.conversationId;

        if (!conversationId) {
          if (!metadata.recipientId) {
            throw new UploadThingError({
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
                sql`bool_and(${conversationMembers.userId} in (${metadata.senderId}, ${metadata.recipientId}))`,
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
              {
                conversationId: newConversation[0].id,
                userId: metadata.senderId,
              },
              {
                conversationId: newConversation[0].id,
                userId: metadata.recipientId,
              },
            ]);

            conversationId = newConversation[0].id;
          }
        }

        const [newMessage] = await db
          .insert(messages)
          .values({
            id: nanoid(),
            conversationId,
            senderId: metadata.senderId,
            createdAt: new Date(),
            messageType: "video",
            mediaUrl: file.ufsUrl,
          })
          .returning();

        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));
        console.log("file url", file.ufsUrl);

        try {
          await pusherInstance.trigger(
            `private-conversation-${conversationId}`,
            "new-message",
            {
              id: newMessage.id,
              content: newMessage.content,
              senderId: newMessage.senderId,
              createdAt: newMessage.createdAt,
              messageType: newMessage.messageType,
              mediaUrl: newMessage.mediaUrl,
            },
          );
        } catch (err) {
          // Don't fail the mutation; message is already stored.
          console.warn("Pusher Trigger faild", err);
        }

        // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        return { metaData: metadata, fileUrl: file.ufsUrl };
      } catch (error) {
        console.log(error);
        throw new UploadThingError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected Error Occured",
        });
      }
    }),
  documentUploader: f({
    pdf: {
      /**
       * For full list of options and defaults, see the File Route API reference
       * @see https://docs.uploadthing.com/file-routes#route-config
       */
      maxFileSize: "4MB",
      maxFileCount: 4,
    },
  })
    .input(
      z.object({
        conversationId: z.string().optional(),
        recipientId: z.string().optional(),
      }),
    )
    // Set permissions and file types for this FileRoute
    .middleware(async ({ input }) => {
      // This code runs on your server before upload
      const session = await auth();

      // If you throw, the user will not be able to upload
      if (!session) throw new UploadThingError("Unauthorized");
      const senderId = session?.user?.id as string;

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return {
        senderId,
        conversationId: input.conversationId!,
        recipientId: input.recipientId!,
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        let conversationId = metadata.conversationId;

        if (!conversationId) {
          if (!metadata.recipientId) {
            throw new UploadThingError({
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
                sql`bool_and(${conversationMembers.userId} in (${metadata.senderId}, ${metadata.recipientId}))`,
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
              {
                conversationId: newConversation[0].id,
                userId: metadata.senderId,
              },
              {
                conversationId: newConversation[0].id,
                userId: metadata.recipientId,
              },
            ]);

            conversationId = newConversation[0].id;
          }
        }

        const [newMessage] = await db
          .insert(messages)
          .values({
            id: nanoid(),
            conversationId,
            senderId: metadata.senderId,
            createdAt: new Date(),
            messageType: "pdf",
            mediaUrl: file.ufsUrl,
          })
          .returning();

        await db
          .update(conversations)
          .set({ updatedAt: new Date() })
          .where(eq(conversations.id, conversationId));
        console.log("file url", file.ufsUrl);

        try {
          await pusherInstance.trigger(
            `private-conversation-${conversationId}`,
            "new-message",
            {
              id: newMessage.id,
              content: newMessage.content,
              senderId: newMessage.senderId,
              createdAt: newMessage.createdAt,
              messageType: newMessage.messageType,
              mediaUrl: newMessage.mediaUrl,
            },
          );
        } catch (err) {
          // Don't fail the mutation; message is already stored.
          console.warn("Pusher Trigger faild", err);
        }

        // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
        return { metaData: metadata, fileUrl: file.ufsUrl };
      } catch (error) {
        console.log(error);
        throw new UploadThingError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unexpected Error Occured",
        });
      }
    }),
  profileImageUploader: f({
    image: {
      minFileCount: 1,
      maxFileCount: 1,
      maxFileSize: "4MB",
    },
  }).onUploadComplete(({ file }) => {
    return { fileUrl: file.ufsUrl };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
