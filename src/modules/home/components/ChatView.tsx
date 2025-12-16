"use client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SearchIcon,
  SidebarIcon,
  PlusIcon,
  Phone,
  VideoIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { trpc } from "@/trpc/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageView } from "./MessageView";
import { useSession } from "next-auth/react";
import { useModal } from "@/modules/home/providers/ModalProvider";
import { useActiveChatContext } from "@/modules/home/providers/ActiveChatProvider";
import { AnimatePresence, motion } from "framer-motion";

export function ChatView() {
  const isMobile = useIsMobile();
  // INFO: This ensures the page is fully loaded before the this components renders.
  const [hasMounted, setHasMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(true);
  const [conversations] = trpc.home.getChats.useSuspenseQuery();
  const {
    activeChat: selectedChat,
    setActiveChat: setSelectedChat,
    viewState,
    setViewState,
  } = useActiveChatContext();
  const { data: session } = useSession();
  const { openModal } = useModal();
  useEffect(() => {
    function handleMounted() {
      setHasMounted(true);
    }
    handleMounted();
  }, []);
  const [direction, setDirection] = useState<number>(1); // 1 -> forward (slide from right), -1 -> back (slide from left)

  const slideVariants = {
    initial: (dir: number) => ({
      x: dir * 200,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir * -200,
      opacity: 0,
    }),
  };
  if (!hasMounted || isMobile === undefined) {
    return null;
  }
  // INFO: Check if user is on a mobile device or a bigger screen.
  if (isMobile) {
    return (
      <div className="grid grid-rows-[4rem_1fr] w-full h-full">
        <div
          id="header"
          className="flex flex-row border-b boder-b-foreground px-6 justify-between items-center h-full"
        >
          <h1 className="text-3xl font-semibold">Chat Application</h1>
          <Button onClick={() => signOut()}>Log Out</Button>
        </div>
        <div>
          <div className="relative overflow-hidden px-0 h-full">
            <AnimatePresence mode="wait">
              {viewState === "CHATVIEW" && (
                <motion.div
                  key={viewState}
                  className="px-6 space-y-4 h-full"
                  data-slot="card-content"
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={slideVariants}
                  transition={{
                    type: "keyframes",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="p-4 h-full relative">
                    <h2 className="font-semibold text-lg mb-2">Contacts</h2>
                    <ScrollArea className="w-[calc(100vw-5rem)] h-[calc(100vh-4rem-80px)]">
                      {conversations?.map((user, index) => {
                        const otherUser = user.members?.filter(
                          (user) => user.id !== session?.user?.id,
                        )?.[0];
                        if (!otherUser) return null;
                        return (
                          <div
                            className="w-full h-12 text-md p-2 flex flex-row space-x-2 items-center hover:bg-muted-foreground hover:cursor-pointer"
                            key={index}
                            onClick={() => {
                              setSelectedChat(user);
                              if (isMobile) {
                                setViewState("MESSAGEVIEW");
                              }
                            }}
                          >
                            <Avatar>
                              <AvatarImage src={otherUser.image ?? ""} />
                              <AvatarFallback>
                                {otherUser.name
                                  ? `${otherUser.name.charAt(0).toUpperCase()}${otherUser.name.charAt(1).toUpperCase()}`
                                  : "??"}
                              </AvatarFallback>
                            </Avatar>
                            <h5>{otherUser.name}</h5>
                          </div>
                        );
                      })}
                    </ScrollArea>
                    <Button
                      className="absolute right-2 bottom-2 z-10"
                      onClick={() => openModal("addChat")}
                    >
                      <PlusIcon />
                    </Button>
                  </div>
                </motion.div>
              )}
              {viewState === "MESSAGEVIEW" && (
                <motion.div
                  className="px-6 space-y-4 h-full"
                  key={viewState}
                  custom={direction}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={slideVariants}
                  transition={{
                    type: "keyframes",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <MessageView
                    user={selectedChat}
                    mobileProps={{ setDirection, setViewState }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="grid grid-rows-[4rem_1fr] w-full h-full">
        <div
          id="header"
          className="flex flex-row border-b border-b-foreground px-6 py-2 justify-between items-center"
        >
          <h1 className="text-3xl font-semibold">Chat Application</h1>
          <div className="flex flex-row">
            <Input placeholder="Search" className="rounded-r-none" />
            <Button variant="secondary" className="rounded-l-none">
              <SearchIcon />
            </Button>
          </div>
          <Button onClick={() => signOut()}>Log Out</Button>
        </div>
        <div className="flex flex-row">
          <div className="flex flex-row w-full h-full overflow-hidden">
            {/* SIDEBAR */}
            <div
              className={`
              transition-all duration-300 bg-background border-r 
              ${open ? "w-64" : "w-16"} 
            `}
            >
              {open ? (
                <div className="p-4 h-full relative">
                  <h2 className="font-semibold text-lg mb-2">Contacts</h2>
                  <ScrollArea className="w-56 h-[calc(100vh-4rem-80px)]">
                    {conversations?.map((user, index) => {
                      const otherUser = user.members?.filter(
                        (user) => user.id !== session?.user?.id,
                      )?.[0];
                      if (!otherUser) return null;
                      return (
                        <div
                          className="w-full h-12 text-md p-2 flex flex-row space-x-2 items-center hover:bg-muted-foreground hover:cursor-pointer"
                          key={index}
                          onClick={() => setSelectedChat(user)}
                        >
                          <Avatar>
                            <AvatarImage src={otherUser.image ?? ""} />
                            <AvatarFallback>
                              {otherUser.name
                                ? `${otherUser.name.charAt(0).toUpperCase()}${otherUser.name.charAt(1).toUpperCase()}`
                                : "??"}
                            </AvatarFallback>
                          </Avatar>
                          <h5>{otherUser.name}</h5>
                        </div>
                      );
                    })}
                  </ScrollArea>
                  <Button
                    className="absolute right-2 bottom-2 z-10"
                    onClick={() => openModal("addChat")}
                  >
                    <PlusIcon />
                  </Button>
                </div>
              ) : (
                <div className="p-4 h-full">
                  <h2 className="font-semibold text-lg mb-2"></h2>
                  <ScrollArea className="h-[calc(100vh-4rem-80px)] w-12">
                    {conversations?.map((user, index) => {
                      const otherUser = user.members?.filter(
                        (user) => user.id !== session?.user?.id,
                      )?.[0];
                      if (!otherUser) return null;
                      return (
                        <Avatar
                          key={index}
                          className="my-2 hover:bg-muted-foreground hover:cursor-pointer p-1"
                          onClick={() => setSelectedChat(user)}
                        >
                          <AvatarImage src={otherUser.image ?? ""} />
                          <AvatarFallback>
                            {otherUser.name
                              ? `${otherUser.name.charAt(0).toUpperCase()}${otherUser.name.charAt(1).toUpperCase()}`
                              : "??"}
                          </AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </ScrollArea>
                </div>
              )}
            </div>

            {/* PAGE CONTENT */}
            <div className="flex-1 flex flex-col">
              <div className="flex flex-row w-full h-12 items-center border border-b-foreground">
                <Button variant="ghost" onClick={() => setOpen(!open)}>
                  <SidebarIcon />
                </Button>
                <div className="flex-1 h-full flex items-center font-bold text-base">
                  {selectedChat?.name}
                </div>
                <div className="h-full w-fit space-x-3 flex items-center">
                  <Button variant="ghost" size="icon">
                    <Phone />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <VideoIcon />
                  </Button>
                </div>
              </div>
              <MessageView user={selectedChat} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
