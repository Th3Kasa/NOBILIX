"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { getFirebaseClientAuth } from "@/lib/firebase/client";
import { PROJECTS } from "@/config/projects";

type LoginState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string };

type ResetState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string };

const { googlePlay, appStore } = PROJECTS.trapman.storeLinks;
const GET_GAME_HREF = googlePlay ?? appStore ?? "/trapman#the-run";
const GET_GAME_IS_EXTERNAL = Boolean(googlePlay ?? appStore);

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
  const [resetState, setResetState] = useState<ResetState>({ status: "idle" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function setError(message: string) {
    setState({ status: "error", message });
  }

  async function handleForgotPassword() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setResetState({
        status: "error",
        message: "Enter your email above first, then tap “Forgot password?” again.",
      });
      return;
    }

    setResetState({ status: "loading" });
    try {
      const auth = getFirebaseClientAuth();
      await sendPasswordResetEmail(auth, trimmedEmail);
      setResetState({ status: "sent", email: trimmedEmail });
    } catch (err) {
      // Never reveal whether an account exists for this email — an
      // "auth/user-not-found" response gets the same success message as a
      // real send. Genuine failures (network, rate limit) still show an error.
      const code = (err as { code?: string } | null)?.code;
      if (code === "auth/user-not-found") {
        setResetState({ status: "sent", email: trimmedEmail });
        return;
      }
      setResetState({
        status: "error",
        message: "We could not send a reset email. Please try again.",
      });
      console.error("[PlayerLoginForm ForgotPassword]", err);
    }
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
  const isResetLoading = resetState.status === "loading";

  return (
    <div className="player-login-form" aria-live="polite">
      {state.status === "error" && (
        <p className="player-login-error" role="alert">
          {state.message}
        </p>
      )}
      {resetState.status === "error" && (
        <p className="player-login-error" role="alert">
          {resetState.message}
        </p>
      )}
      {resetState.status === "sent" && (
        <p className="player-login-success" role="status">
          {`If an account exists for ${resetState.email}, a reset link is on its way.`}
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
          type="button"
          onClick={handleForgotPassword}
          disabled={isLoading || isResetLoading}
          className="player-forgot-password-btn"
        >
          {isResetLoading ? "Sending reset link…" : "Forgot password?"}
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="player-login-btn player-login-btn--email"
        >
          {isLoading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="player-login-signup-hint">
        New to TrapMan?{" "}
        {GET_GAME_IS_EXTERNAL ? (
          <a href={GET_GAME_HREF} target="_blank" rel="noopener noreferrer">
            Get the game
          </a>
        ) : (
          <Link href={GET_GAME_HREF}>Get the game</Link>
        )}
      </p>
    </div>
  );
}
