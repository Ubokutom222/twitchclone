/**
	This page will recieve two props from the url: `verified: boolean` and `number: string`
	
	TODO: Find a way to encrypt or secure these information in the url
	
	If the these information are not provided an error should be thrown and this the SignUpForm should not be rendered
*/
import { SignUpForm } from "@/modules/auth/components/SignUpForm";

export default function Register() {
  return <SignUpForm />;
}
