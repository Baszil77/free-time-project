"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Card, Label, SecondaryButton } from "@/components/ui";
import { SignInForm } from "@/components/SignInForm";

const EXPLAIN_LIMIT_ANON = 2;

type ExplainResult = {
  title: string;
  summary: string;
  why_it_matters: string | null;
  confidence: "high" | "medium" | "inferred";
  savedPlaceId?: string | null;
  saveSkippedReason?: string | null;
};

type StoredUpload = {
  dataUrl: string;
  name: string;
  type: string;
  location?: { lat: number; lng: number } | null;
};

export default function ExplainPage() {
  const router = useRouter();
  const [upload, setUpload] = useState<StoredUpload | null>(null);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const canExplainAgain = useMemo(() => {
    const count = Number(localStorage.getItem("context_explain_count") ?? "0");
    return count < EXPLAIN_LIMIT_ANON;
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("context_upload");
    if (!stored) {
      return;
    }
    setUpload(JSON.parse(stored));
  }, []);

  useEffect(() => {
    const runExplain = async () => {
      if (!upload || status !== "idle") return;
      setStatus("loading");
      const formData = new FormData();
      formData.append("image", dataUrlToBlob(upload.dataUrl), upload.name);
      if (upload.location) {
        formData.append("lat", String(upload.location.lat));
        formData.append("lng", String(upload.location.lng));
      }
      try {
        const response = await fetch("/api/explain", {
          method: "POST",
          body: formData
        });
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Request failed");
        }
        const payload = (await response.json()) as ExplainResult;
        setResult(payload);
        incrementExplainCount();
        console.log("explain_success", payload);
      } catch (error) {
        console.error("explain_error", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Something went wrong"
        );
        setStatus("error");
      }
    };

    runExplain();
  }, [upload, status]);

  const handleNewExplain = () => {
    sessionStorage.removeItem("context_upload");
    router.push("/");
  };

  if (!upload) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">No photo yet</h1>
        <p className="text-sm text-slate-600">
          Head back home to capture a place first.
        </p>
        <Button onClick={() => router.push("/")}>Go to camera</Button>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Explain
        </p>
        <h1 className="text-2xl font-semibold">Context card</h1>
      </header>

      <Card className="space-y-4">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl">
          <Image
            src={upload.dataUrl}
            alt="Captured place"
            fill
            className="object-cover"
          />
        </div>

        {status === "loading" && (
          <p className="text-sm text-slate-600">Analyzing your photo...</p>
        )}

        {status === "error" && (
          <div className="space-y-2 text-sm text-rose-600">
            <p>We couldn’t generate context yet.</p>
            <p>{errorMessage}</p>
            <Button onClick={handleNewExplain}>Try again</Button>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{result.title}</h2>
              <Label>{result.confidence}</Label>
            </div>
            <p className="text-sm text-slate-700">{result.summary}</p>
            {result.why_it_matters && (
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Why it matters:</span>{" "}
                {result.why_it_matters}
              </p>
            )}
            {result.savedPlaceId ? (
              <SecondaryButton
                onClick={() => router.push(`/place/${result.savedPlaceId}`)}
              >
                View in archive
              </SecondaryButton>
            ) : (
              <p className="text-xs text-slate-500">
                {result.saveSkippedReason ??
                  "Sign in to save this to your archive."}
              </p>
            )}
          </div>
        )}
      </Card>

      {!result?.savedPlaceId && !canExplainAgain && (
        <Card className="space-y-3">
          <h3 className="text-lg font-semibold">Save your places</h3>
          <p className="text-sm text-slate-600">
            You’re at the free explanation limit. Sign in to keep saving new
            places.
          </p>
          <SignInForm redirectTo="/places" />
        </Card>
      )}

      <div className="flex gap-3">
        <Button onClick={handleNewExplain}>Explain another</Button>
        <SecondaryButton onClick={() => router.push("/discover")}
        >
          What’s near me?
        </SecondaryButton>
      </div>
    </main>
  );
}

function dataUrlToBlob(dataUrl: string) {
  const [header, base64] = dataUrl.split(",");
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    array[i] = binary.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

function incrementExplainCount() {
  const current = Number(localStorage.getItem("context_explain_count") ?? "0");
  localStorage.setItem("context_explain_count", String(current + 1));
}
