"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, SecondaryButton } from "@/components/ui";

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [status, setStatus] = useState<"idle" | "locating" | "ready">("idle");

  useEffect(() => {
    const stored = sessionStorage.getItem("context_location");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { lat: number; lng: number };
      if (parsed?.lat && parsed?.lng) {
        setLocation(parsed);
        setStatus("ready");
      }
      sessionStorage.removeItem("context_location");
    } catch (error) {
      console.warn("location_parse_error", error);
    }
  }, []);

  const handleUseLocation = () => {
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setLocation(coords);
        setStatus("ready");
        console.log("location_captured", coords);
      },
      (err) => {
        console.warn("location_error", err);
        setStatus("ready");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleExplain = async () => {
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const payload = {
        dataUrl: reader.result,
        name: file.name,
        type: file.type,
        location
      };
      sessionStorage.setItem("context_upload", JSON.stringify(payload));
      console.log("photo_ready_for_explain", { fileName: file.name });
      router.push("/explain");
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="flex flex-1 flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
          Context
        </p>
        <h1 className="text-3xl font-semibold text-ink">
          Capture a place. Get the story.
        </h1>
        <p className="text-sm text-slate-600">
          Camera-first context for wherever you are. Save the places you care
          about.
        </p>
      </header>

      <Card className="space-y-4">
        <label className="text-sm font-medium text-slate-700">
          Photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="mt-2 w-full"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleExplain} disabled={!file}>
            Explain this
          </Button>
          <SecondaryButton onClick={() => router.push("/discover")}>
            What’s near me?
          </SecondaryButton>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={handleUseLocation}
            className="font-medium text-accent"
          >
            {status === "locating" ? "Locating..." : "Add location for accuracy"}
          </button>
          {location && (
            <span>
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          )}
        </div>
      </Card>

      <section className="grid gap-3 text-sm text-slate-600">
        <p>
          Once you explain a place, we’ll auto-save it to your personal archive
          (after sign-in).
        </p>
        <p>
          Want to browse? Head to the discovery map for nearby public places.
        </p>
        <div className="flex gap-3">
          <SecondaryButton onClick={() => router.push("/places")}
          >
            Your Places
          </SecondaryButton>
          <SecondaryButton onClick={() => router.push("/discover")}
          >
            Discovery
          </SecondaryButton>
        </div>
      </section>
    </main>
  );
}
