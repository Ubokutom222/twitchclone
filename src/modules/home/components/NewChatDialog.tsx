"use client";
import { DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandList,
  CommandItem,
  CommandInput,
} from "@/components/ui/command";
import { trpc } from "@/trpc/client";
import { useActiveChatContext } from "@/modules/home/providers/ActiveChatProvider";
import { useModal } from "@/modules/home/providers/ModalProvider";

export function NewChatDialog() {
  const [users] = trpc.home.getUser.useSuspenseQuery();
  const { setActiveChat: setSelectedChat } = useActiveChatContext();
  const { closeModal } = useModal();
  return (
    <DialogContent>
      <Command>
        <CommandInput />
        <CommandList>
          {users.map((user, index) => (
            <CommandItem
              key={index}
              onSelect={() => {
                setSelectedChat(user);
                closeModal();
              }}
            >
              {user.name}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </DialogContent>
  );
}
