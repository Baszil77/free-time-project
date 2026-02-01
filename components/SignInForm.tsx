"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export function SignInForm({ redirectTo = "/places" }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle"
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("sending");
    const { error } = await supabaseBrowser.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`
      }
    });

    if (error) {
      console.error("auth_signin_error", error);
      setStatus("error");
      return;
    }

    console.log("auth_magic_link_sent", { email });
    setStatus("sent");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="text-sm font-medium text-slate-700">
        Email for magic link
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          placeholder="you@example.com"
          required
        />
      </label>
      <Button type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send magic link"}
      </Button>
      {status === "sent" && (
        <p className="text-sm text-green-600">
          Check your inbox for the sign-in link.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-rose-600">Unable to send link. Try again.</p>
      )}
    </form>
  );
}
