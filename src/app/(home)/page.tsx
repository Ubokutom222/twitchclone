import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (!session) {
    // redirect("/verify")
  }
  return <div>{JSON.stringify(session, null, 2)}</div>;
}
