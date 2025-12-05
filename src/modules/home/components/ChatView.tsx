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
import { type User } from "@/modules/home/types";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MessageView } from "./MessageView";

export function ChatView() {
  const isMobile = useIsMobile();
  // INFO: This ensures the page is fully loaded before the this components renders.
  const [hasMounted, setHasMounted] = useState(false);
  const [open, setOpen] = useState<boolean>(true);
  const [otherUser] = trpc.home.getUser.useSuspenseQuery();
  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  useEffect(() => {
    function handleMounted() {
      setHasMounted(true);
    }
    handleMounted();
  }, []);
  if (!hasMounted || isMobile === undefined) {
    return null;
  }

  // INFO: Check if user is on a mobile device or a bigger screen.
  if (isMobile) {
    return <div></div>;
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
                    {otherUser.map((user, index) => (
                      <div
                        className="w-full h-12 text-md p-2 flex flex-row space-x-2 items-center hover:bg-muted-foreground"
                        key={index}
                        onClick={() => setSelectedChat(user)}
                      >
                        <Avatar>
                          <AvatarImage src={user.image ?? ""} />
                          <AvatarFallback>{`${user.name?.charAt(0)}${user.name?.charAt(1).toUpperCase()}`}</AvatarFallback>
                        </Avatar>
                        <h5>{user.name}</h5>
                      </div>
                    ))}
                  </ScrollArea>
                  <Button className="absolute right-2 bottom-2 z-10">
                    <PlusIcon />
                  </Button>
                </div>
              ) : (
                <div className="p-4 h-full">
                  <h2 className="font-semibold text-lg mb-2"></h2>
                  <ScrollArea className="h-[calc(100vh-4rem-80px)] w-12">
                    {otherUser.map((user, index) => (
                      <Avatar
                        key={index}
                        className="my-2 hover:bg-muted-foreground"
                        onClick={() => setSelectedChat(user)}
                      >
                        <AvatarImage src={user.image ?? ""} />
                        <AvatarFallback>{`${user.name?.charAt(0)}${user.name?.charAt(1).toUpperCase()}`}</AvatarFallback>
                      </Avatar>
                    ))}
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
