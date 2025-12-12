import { SessionProvider } from "next-auth/react";
import { ModalProvider } from "@/modules/home/providers/ModalProvider";
import { ActiveChatContextProivder } from "@/modules/home/providers/ActiveChatProvider";

interface Props {
  children: React.ReactNode;
}

export default function HomeLayout({ children }: Props) {
  return (
    <div className="w-screen h-screen">
      <SessionProvider>
        <ActiveChatContextProivder>
          <ModalProvider>{children}</ModalProvider>
        </ActiveChatContextProivder>
      </SessionProvider>
    </div>
  );
}
