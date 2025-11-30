/**
	This page will recieve two props from the url: `verified: boolean` and `number: string`
	
	TODO: Find a way to encrypt or secure these information in the url
	
	If the these information are not provided an error should be thrown and this the SignUpForm should not be rendered
*/
import { SignUpForm } from "@/modules/auth/components/SignUpForm";
import { loadVerifyParams } from "@/modules/auth/components/verifyParams";
import type { SearchParams } from "nuqs/server";
import crypto from "crypto";
import { decrypt } from "@/modules/auth/encryptHook";

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function Register({ searchParams }: PageProps) {
  const { number } = await loadVerifyParams(searchParams);
  return <SignUpForm number={decrypt(number)} />;
}
