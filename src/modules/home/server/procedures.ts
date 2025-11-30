import { baseProcedure, createTRPCRouter } from "@/trpc/init";

const homeRouter = createTRPCRouter({
  hello: baseProcedure.query(async () => {
    return { hello: 123 };
  }),
});

export default homeRouter;
