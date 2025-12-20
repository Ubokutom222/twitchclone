"use client";
import { useForm } from "react-hook-form";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormField,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { trpc } from "@/trpc/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UploadDropzone } from "@/uploadthing/components";
import { FormEvent, useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface Props {
  number: string;
}

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setTrue: (value: boolean) => void;
}

function ConfirmationAlertDialog({
  open,
  onOpenChange,
  setTrue,
}: AlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to register without a profile Image
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Upload Image</AlertDialogCancel>
          <AlertDialogAction onClick={() => setTrue(true)}>
            Register
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SignUpForm({ number }: Props) {
  const formSchema = z.object({
    username: z
      .string()
      .min(3, "Username must be at least three characters")
      .max(128, "Username must not exceed 128 characters"),
    email: z.email(),
    date: z.string().nonoptional(),
    profileImage: z.string().nullish(),
  });
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      date: "",
      profileImage: "",
    },
  });
  const router = useRouter();
  const registerMutation = trpc.auth.register.useMutation({
    onError(err) {
      toast.error(err.message);
    },
    onSuccess() {
      toast.success("Registered Sucessfully");
      router.push("/");
    },
  });

  const [alertDialogOpen, setAlertDialogOpen] = useState<boolean>(false);
  const [confirmed, setConfirmed] = useState<boolean>(false);
  async function onSubmit(data: z.infer<typeof formSchema>) {
    const { date, email, username, profileImage } = data;
    await registerMutation.mutateAsync({
      username,
      email,
      phoneNumber: number,
      date,
      profileImage,
    });
  }

  const values = form.getValues();

  return (
    <div
      data-slot="card"
      className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
    >
      <ConfirmationAlertDialog
        open={alertDialogOpen}
        onOpenChange={setAlertDialogOpen}
        setTrue={setConfirmed}
      />
      <div data-slot="card-content" className="px-6">
        <div
          className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
          data-slot="card-header"
        >
          <div className="leading-none font-semibold" data-slot="card-title">
            Registration
          </div>
        </div>
        <form
          onSubmit={
            confirmed || values.profileImage
              ? form.handleSubmit(onSubmit)
              : (e) => {
                  e.preventDefault();
                  setAlertDialogOpen(true);
                }
          }
          className="flex flex-col space-y-2"
        >
          <Form {...form}>
            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} className="lg:w-[calc(100vw/3)]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="username"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input {...field} className="lg:w-[calc(100vw/3)]" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="date"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Of Birth</FormLabel>
                  <Input
                    type="date"
                    {...field}
                    className="lg:w-[calc(100vw/3)]"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="profileImage"
              control={form.control}
              render={() => (
                <FormItem>
                  <FormLabel>Upload Profile Image</FormLabel>
                  <UploadDropzone
                    endpoint="profileImageUploader"
                    onClientUploadComplete={([file]) => {
                      form.setValue("profileImage", file.ufsUrl);
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Register</Button>
          </Form>
        </form>
      </div>
    </div>
  );
}
