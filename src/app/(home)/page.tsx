import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ChatView } from "@/modules/home/components/ChatView";
import { trpc } from "@/trpc/server";

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    redirect("/verify");
  }
  void (await trpc.home.getChats.prefetch());
  void (await trpc.home.getUser.prefetch());
  return <ChatView />;
}
