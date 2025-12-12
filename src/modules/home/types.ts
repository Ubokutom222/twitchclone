import { InferSelectModel } from "drizzle-orm";
import { user, messages } from "@/db/schema";
export type User = InferSelectModel<typeof user>;
export type Users = User[];

export interface Conversation {
  members: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    createdAt: Date;
    updatedAt: Date;
    emailVerified: Date;
  }[];
  id: string;
  isGroup: boolean;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type Conversations = Conversation[];
