"use client";
import { useContext, createContext, useState, ReactNode } from "react";
import { type Conversation, type User } from "@/modules/home/types";

interface ActiveChatContextProp {
  activeChat: Conversation | User | null;
  setActiveChat: (user: Conversation | User | null) => void;
  viewState: "CHATVIEW" | "MESSAGEVIEW";
  setViewState: (viewState: "CHATVIEW" | "MESSAGEVIEW") => void;
}

const ActiveChatContext = createContext<ActiveChatContextProp | undefined>(
  undefined,
);

export function ActiveChatContextProivder({
  children,
}: {
  children: ReactNode;
}) {
  const [activeChat, setActiveChat] = useState<Conversation | User | null>(
    null,
  );
  const [viewState, setViewState] = useState<"CHATVIEW" | "MESSAGEVIEW">(
    "CHATVIEW",
  );

  return (
    <ActiveChatContext.Provider
      value={{ activeChat, setActiveChat, viewState, setViewState }}
    >
      {children}
    </ActiveChatContext.Provider>
  );
}

export function useActiveChatContext() {
  const context = useContext(ActiveChatContext);
  if (!context) {
    throw new Error("useActiveChatContext must be used within a Provider");
  }
  return context;
}
