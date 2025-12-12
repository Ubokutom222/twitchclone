"use client";
import { type Conversation, type User } from "@/modules/home/types";
import { Button } from "@/components/ui/button";
import { PaperclipIcon, Send } from "lucide-react";
import { InputGroupTextarea } from "@/components/ui/input-group";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface Props {
  user: Conversation | User | null;
}

export function MessageView({ user }: Props) {
  const [content, setContent] = useState<string>("");
  const messageMutation = trpc.home.sendMessage.useMutation({
    onSuccess() {
      setContent("");
    },
    onError(error) {
      toast.error(error.message);
    },
  });
  const { data: session } = useSession();
  async function onSubmit() {
    if (user !== null) {
      if ("members" in user) {
        const otherUser = user?.members.filter(
          (user) => user.id !== session?.user?.id,
        );
        await messageMutation.mutateAsync({
          content,
          recipientId: otherUser ? otherUser[0].id : "",
        });
      } else {
        await messageMutation.mutateAsync({
          content,
          recipientId: user?.id,
        });
      }
    }
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.home.getMessages.useInfiniteQuery(
      {
        conversationId: user?.id ?? "",
        limit: 20,
      },
      {
        enabled: !!user && "members" in user,
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      },
    );
  const allMessages = data?.pages.flatMap((p) => p.messages) ?? [];
  allMessages.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  return (
    <div className="flex-1 flex flex-col h-fit w-full">
      <div className="flex-1 overflow-y-scroll p-4 space-y-2">
        {allMessages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[75%] px-3 py-2 rounded-lg ${
              msg.senderId === session?.user?.id
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-muted"
            }`}
          >
            {msg.content}
          </div>
        ))}

        {isFetchingNextPage && (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        )}
      </div>

      <div className="flex flex-row border-t border-t-foreground items-center">
        <Button size="icon">
          <PaperclipIcon />
        </Button>
        <InputGroupTextarea
          className="flex-1 border rounded-md m-2 max-h-[20vh] dark:bg-input/30 border-input w-full min-w-0 bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button onClick={onSubmit}>
          <Send />
        </Button>
      </div>
    </div>
  );
}
