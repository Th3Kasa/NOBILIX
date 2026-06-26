"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";

type LoginState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

async function exchangeForSession(user: { getIdToken: () => Promise<string> }) {
  const idToken = await user.getIdToken();
  const response = await fetch("/api/player/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as {
      error?: string;
    };
    throw new Error(data.error ?? "Session exchange failed");
  }
}

export function PlayerLoginForm() {
  const router = useRouter();
  const [state, setState] = useState<LoginState>({ status: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function setError(message: string) {
    setState({ status: "error", message });
  }

  async function handleGoogleSignIn() {
    setState({ status: "loading" });
    try {
      const auth = getFirebaseClientAuth();
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      await exchangeForSession(credential.user);
      router.replace("/trapman/account");
    } catch (err) {
      setError("We could not sign you in with Google. Please try again.");
      console.error("[PlayerLoginForm Google]", err);
    }
  }

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    try {
      const auth = getFirebaseClientAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await exchangeForSession(credential.user);
      router.replace("/trapman/account");
    } catch (err) {
      setError("We could not sign you in. Please check your email and password.");
      console.error("[PlayerLoginForm Email]", err);
    }
  }

  const isLoading = state.status === "loading";

  return (
    <div className="player-login-form" aria-live="polite">
      {state.status === "error" && (
        <p className="player-login-error" role="alert">
          {state.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="player-login-btn player-login-btn--google"
      >
        {isLoading ? "Signing in…" : "Continue with Google"}
      </button>

      <div className="player-login-divider" aria-hidden="true">
        or
      </div>

      <form onSubmit={handleEmailSignIn} className="player-login-email-form">
        <label htmlFor="player-email">Email</label>
        <input
          id="player-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={isLoading}
        />

        <label htmlFor="player-password">Password</label>
        <div className="player-password-field">
          <input
            id="player-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isLoading}
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((value) => !value)}
            disabled={isLoading}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="player-login-btn player-login-btn--email"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
