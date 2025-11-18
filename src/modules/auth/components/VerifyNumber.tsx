"use client";
import { AnimatePresence, motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import "react-phone-number-input/style.css";
import PhoneInput from "react-phone-number-input";
import { trpc } from "@/trpc/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

export function VerifyNumber() {
  const [formState, setFormState] = useState<"NUMBER" | "OTP">("NUMBER");
  const [direction, setDirection] = useState<number>(1); // 1 -> forward (slide from right), -1 -> back (slide from left)
  const [value, setValue] = useState<any>("");
  const generateMutation = trpc.auth.generateOTP.useMutation({});

  // Variants use the `custom` prop (direction) to determine enter / exit x offsets
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

  const [OTP, setOTP] = useState<number | undefined>(undefined);
  async function generateOTP() {
    // TODO: Work on backend to generate OTP
    if (value || value !== "") {
      const { otp } = await generateMutation.mutateAsync({
        number: value,
      });
      setDirection(-1);
      setFormState("OTP");
      setOTP(otp);
    } else {
      toast.info("Please enter your number");
    }
  }

  const [resendButtonActive, setResendButtonActive] = useState<boolean>(false);

  useEffect(() => {
    if (OTP !== undefined) {
      setTimeout(() => {
        setResendButtonActive(true);
      }, 30000);
    }
  }, [OTP]);

  const [inputOTPValue, setInputOTPValue] = useState<string>("");
  const router = useRouter();
  async function verifyOTP() {
    if (inputOTPValue === OTP?.toString()) {
      toast.success("Verified. You will be redirected for registration");
      router.push("/register");
    } else {
      toast.error("Invalid OTP, Please Try Again");
    }
  }

  return (
    <div className="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm">
      {/* container to keep the animated panels stacked and prevent layout jump */}
      <div className="relative overflow-hidden px-0">
        <AnimatePresence mode="wait">
          {formState === "NUMBER" && (
            <motion.div
              key={formState}
              className="px-6 space-y-4"
              data-slot="card-content"
              custom={direction}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={slideVariants}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Label>Enter your Phone number</Label>
              <PhoneInput
                placeholder="1234 567 8910"
                value={value}
                onChange={setValue}
                className="flex flex-row space-x-2"
              />
              <Button onClick={generateOTP}>
                {!generateMutation.isPending ? (
                  "Next"
                ) : (
                  <Loader2Icon className="animate-spin" />
                )}
              </Button>
            </motion.div>
          )}
          {formState === "OTP" && (
            <motion.div
              className="px-6 space-y-4"
              data-slot="card-content"
              key={formState}
              custom={direction}
              initial="initial"
              animate="animate"
              exit="exit"
              variants={slideVariants}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <Label>You have been sent an OTP, Please enter below</Label>
              <InputOTP
                maxLength={6}
                value={inputOTPValue}
                onChange={(value) => setInputOTPValue(value)}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              <div className="flex gap-2 flex-col">
                <p className="text-sm">
                  Didn&apos;t recieve the OTP, Click below to resend
                </p>
                <Button
                  variant="secondary"
                  onClick={generateOTP}
                  disabled={!resendButtonActive}
                >
                  {!generateMutation.isPending ? (
                    "Resend"
                  ) : (
                    <Loader2Icon className="animate-spin" />
                  )}
                </Button>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setDirection(1);
                    setFormState("NUMBER");
                  }}
                >
                  Previous
                </Button>
                <Button onClick={verifyOTP}>Confirm</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
