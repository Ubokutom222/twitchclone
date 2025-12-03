import { createTRPCRouter } from "../init";
import authRouter from "@/modules/auth/server/procedures";
import homeRouter from "@/modules/home/server/procedures";
export const appRouter = createTRPCRouter({
  auth: authRouter,
  home: homeRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
