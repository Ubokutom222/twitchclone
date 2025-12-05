import { SessionProvider } from "next-auth/react";

interface Props {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: Props) {
  return (
    <div className="w-screen h-screen">
      <SessionProvider>{children}</SessionProvider>
    </div>
  );
}
