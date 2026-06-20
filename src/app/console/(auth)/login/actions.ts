"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      totp: String(formData.get("totp") ?? ""),
      redirectTo: "/console",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email, password, or authentication code." };
    }
    // signIn throws a redirect on success — re-throw so Next can handle it.
    throw error;
  }
}
