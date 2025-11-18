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
// import authClient from "@/lib/auth-client"

export function SignUpForm() {
  const formSchema = z.object({
    username: z
      .string()
      .min(3, "Username must be at least three characters")
      .max(128, "Username must not exceed 128 characters"),
    email: z.email(),
    phoneNumber: z.string().nonoptional(),
    date: z.string().nonoptional(),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      username: "",
      phoneNumber: "",
      date: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
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
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
