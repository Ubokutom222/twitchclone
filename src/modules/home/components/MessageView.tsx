"use client";
import { type Conversation, type User } from "@/modules/home/types";
import { Button } from "@/components/ui/button";
import {
  PaperclipIcon,
  Send,
  MicIcon,
  FileVideo,
  FileImage,
  File,
  ArrowLeft,
} from "lucide-react";
import { InputGroupTextarea } from "@/components/ui/input-group";
import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/trpc/client";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import pusherClient from "@/lib/pusher-client";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { UploadButton } from "@/uploadthing/components";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { useIsMobile } from "@/hooks/use-mobile";

interface Props {
  user: Conversation | User | null;
  mobileProps?: {
    setDirection: (n: number) => void;
    setViewState: (state: "CHATVIEW" | "MESSAGEVIEW") => void;
  };
}

type RouterOutput = inferRouterOutputs<AppRouter>;
type MessagesPage = RouterOutput["home"]["getMessages"];
type Message = MessagesPage["messages"][number];
type RealtimeMessage = Omit<Message, "createdAt"> & { createdAt: string };

interface UploadProgressDialogProps {
  progress: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancelUpload: () => void;
}

function UploadProgressDialog({
  progress,
  open,
  onOpenChange,
  cancelUpload,
}: UploadProgressDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>File Uploading</AlertDialogTitle>
          <Progress value={progress} />
          <div className="w-full justify-center flex text-base">
            {progress}%
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hide</AlertDialogCancel>
          <AlertDialogAction onClick={cancelUpload}>
            Cancel Upload
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function MessageView({ user, mobileProps }: Props) {
  const isMobile = useIsMobile();
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
  const hasEnteredText = useCallback(() => {
    if (content.length > 0) return true;
    else return false;
  }, [content]);
  async function onSubmit() {
    if (hasEnteredText()) {
      if (user !== null) {
        if ("members" in user) {
          const otherUser = user.members?.filter(
            (user) => user.id !== session?.user?.id,
          );
          const recipientId = otherUser?.[0]?.id;
          if (!recipientId) {
            toast.error("Unable to determine recipient");
            return;
          }
          await messageMutation.mutateAsync({
            content,
            recipientId,
          });
        } else {
          if (!user.id) {
            toast.error("Invalid user");
            return;
          }
          await messageMutation.mutateAsync({
            content,
            recipientId: user.id,
          });
        }
      }
    }
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    trpc.home.getMessages.useInfiniteQuery(
      {
        conversationId: user?.id ?? "",
        limit: 9,
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
  const utils = trpc.useUtils();

  useEffect(() => {
    if (!user || !("isGroup" in user)) return;
    const channelName = `private-conversation-${user.id}`;
    const channel = pusherClient.subscribe(channelName);
    const handler = (payload: RealtimeMessage) => {
      const message: Message = {
        ...payload,
        createdAt: new Date(payload.createdAt) as unknown as Date,
      };
      // Optimistically add new message to TRPC cache
      utils.home.getMessages.setInfiniteData(
        { conversationId: user.id, limit: 9 },
        (oldData) => {
          if (!oldData) return oldData;
          if (oldData.pages[0]?.messages?.some((m) => m.id === message.id)) {
            return oldData;
          }
          return {
            ...oldData,
            pages: [
              {
                ...oldData.pages[0],
                messages: [message, ...oldData.pages[0].messages],
              },
              ...oldData.pages.slice(1),
            ],
          };
        },
      );
    };
    channel.bind("new-message", handler);

    return () => {
      channel.unbind("new-message", handler);
      pusherClient.unsubscribe(channelName);
    };
  }, [user, utils]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [user, data]);

  function getUser() {
    if (user !== null) {
      if ("members" in user) {
        return { conversationId: user.id, recipientId: undefined };
      } else {
        return { recipientId: user.id, conversationId: undefined };
      }
    } else return { recipientId: undefined, conversationId: undefined };
  }

  function cancelUpload() {}

  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState<boolean>(false);
  return (
    <div className="flex-1 flex flex-col min-h-0 w-full h-full">
      {isMobile && mobileProps && (
        <div
          id="header"
          className="flex flex-row border-b border-b-foreground px-6 justify-between items-center"
        >
          <div className="flex flex-row items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                mobileProps.setDirection(-1);
                mobileProps.setViewState("CHATVIEW");
              }}
            >
              <ArrowLeft />
            </Button>
            <h1>{user && "phoneNumber" in user && JSON.stringify(user)}</h1>
          </div>
        </div>
      )}
      <div
        className="flex-1 overflow-y-auto max-h-[calc(100vh-4rem-4rem-68px)] min-h-0 p-4 space-y-2"
        ref={scrollRef}
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop === 0;
          if (top && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
      >
        {allMessages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[75%] w-fit px-3 py-2 rounded-lg ${
              msg.senderId === session?.user?.id
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-muted"
            }`}
          >
            {msg.messageType === "text" && msg.content}
            {msg.messageType === "image" && msg.mediaUrl && (
              <Image
                src={msg.mediaUrl}
                alt={`Image for ${msg.id}`}
                width={200} // Set a fixed width
                height={200} // Set a fixed height
                className="rounded-md object-cover" // Add styling for better appearance
              />
            )}
            {msg.messageType === "video" && msg.mediaUrl && (
              <video src={msg.mediaUrl} controls />
            )}
          </div>
        ))}

        {isFetchingNextPage && (
          <p className="text-center text-sm text-muted-foreground">Loading…</p>
        )}
      </div>
      <UploadProgressDialog
        progress={uploadProgress}
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        cancelUpload={cancelUpload}
      />
      <div className="flex flex-row border-t border-t-foreground items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon">
              <PaperclipIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="size-fit grid grid-cols-3 gap-2">
            <UploadButton
              endpoint={"imageUploader"}
              appearance={{
                button:
                  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 px-4 py-2 has-[>svg]:px-3",
                allowedContent: "text-primary",
              }}
              content={{
                button: <FileImage className="text-primary-foreground" />,
                allowedContent: "Images",
              }}
              input={getUser()}
              onClientUploadComplete={() => {
                toast.success("Uploaded Sucessfully");
                setUploadDialogOpen(false);
              }}
              onUploadError={() => {
                toast.error("Upload Failed");
                setUploadDialogOpen(false);
              }}
            />
            <UploadButton
              endpoint={"videoUploader"}
              appearance={{
                button:
                  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 px-4 py-2 has-[>svg]:px-3",
                allowedContent: "text-primary",
              }}
              content={{
                button: <FileVideo className="text-primary-foreground" />,
                allowedContent: "Videos",
              }}
              input={getUser()}
              onClientUploadComplete={() => {
                toast.success("Uploaded Sucessfully");
                setUploadDialogOpen(false);
              }}
              onUploadError={() => {
                toast.error("Upload Failed");
                setUploadDialogOpen(false);
              }}
              onUploadProgress={(progress) => {
                setUploadDialogOpen(true);
                setUploadProgress(progress);
              }}
            />
            <UploadButton
              endpoint={"documentUploader"}
              appearance={{
                button:
                  "bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 px-4 py-2 has-[>svg]:px-3",
                allowedContent: "text-primary",
              }}
              content={{
                button: <File className="text-primary-foreground" />,
                allowedContent: "PDF",
              }}
              input={getUser()}
              onClientUploadComplete={() => {
                toast.success("Uploaded Sucessfully");
                setUploadDialogOpen(false);
              }}
              onUploadError={() => {
                toast.error("Upload Failed");
                setUploadDialogOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <InputGroupTextarea
          className="flex-1 border rounded-md m-2 h-16 dark:bg-input/30 border-input w-full min-w-0 bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <Button onClick={onSubmit}>
          {hasEnteredText() ? <Send /> : <MicIcon />}
        </Button>
      </div>
    </div>
  );
}
