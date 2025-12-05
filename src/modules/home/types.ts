import { InferSelectModel } from "drizzle-orm";
import { user } from "@/db/schema";
export type User = InferSelectModel<typeof user>;
export type Users = User[];
