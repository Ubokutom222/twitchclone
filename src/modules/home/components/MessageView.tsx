"use client";
import { type User } from "@/modules/home/types";
import { Button } from "@/components/ui/button";
import { PaperclipIcon, Send } from "lucide-react";
import { InputGroupTextarea } from "@/components/ui/input-group";

interface Props {
  user: User | null;
}

export function MessageView({ user }: Props) {
  return (
    <div className="flex-1 flex flex-col h-fit w-full">
      <div className="flex-1"></div>
      <div className="flex flex-row border-t border-t-foreground items-center">
        <Button size="icon">
          <PaperclipIcon />
        </Button>
        <InputGroupTextarea className="flex-1 border rounded-md m-2 max-h-[20vh] dark:bg-input/30 border-input w-full min-w-0 bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive" />
        <Button>
          <Send />
        </Button>
      </div>
    </div>
  );
}
