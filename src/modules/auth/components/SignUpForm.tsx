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

/**
  NOTE: This page will accept two props from the url `verified: boolean` and `number: string`
  
  ```
  TODO: Find a way to encrypt the date or secure it.
  ```

  These props will provide if the phone number is verified and the verified phone number.

  If these props are undefined or the phone number isn't verified, An error is thrown.

*/
export function SignUpForm() {
  const formSchema = z.object({
    username: z
      .string()
      .min(3, "Username must be at least three characters")
      .max(128, "Username must not exceed 128 characters"),
    email: z.email(),
    // TODO: Handle checks for valid phone number
    phoneNumber: z.string().nonoptional(),
    date: z.string().nonoptional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      // NOTE: Current placeholder for the phone number as the url data hasn't been built yet.
      // NOTE: This will be corrected in the future.
      phoneNumber: "+2348123213835",
      date: "",
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onError(err) {
      toast.error(err.message);
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    const { date, email, phoneNumber, username } = data;
    await registerMutation.mutateAsync({
      username,
      email,
      phoneNumber,
      date,
    });
  }
  return (
    <div
      data-slot="card"
      className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
    >
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
          onSubmit={form.handleSubmit(onSubmit)}
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
            <Button type="submit">Register</Button>
          </Form>
        </form>
      </div>
    </div>
  );
}
