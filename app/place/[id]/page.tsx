import Image from "next/image";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Card, Label } from "@/components/ui";

const PlaceMap = dynamic(
  () => import("@/components/PlaceMap").then((mod) => mod.PlaceMap),
  { ssr: false }
);

export default async function PlaceDetailPage({
  params
}: {
  params: { id: string };
}) {
  const supabase = supabaseServer();
  const { data: place } = await supabase
    .from("places")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!place) {
    notFound();
  }

  let signedUrl: string | null = null;
  if (place.photo_url) {
    const { data } = await supabaseAdmin.storage
      .from("photos")
      .createSignedUrl(place.photo_url, 60 * 60);
    signedUrl = data?.signedUrl ?? null;
  }

  return (
    <main className="space-y-4">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Place detail
        </p>
        <h1 className="text-2xl font-semibold">{place.title}</h1>
        {(place.city || place.country) && (
          <p className="text-sm text-slate-600">
            {[place.city, place.country].filter(Boolean).join(", ")}
          </p>
        )}
      </header>

      <Card className="space-y-4">
        {signedUrl && (
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
            <Image src={signedUrl} alt={place.title} fill className="object-cover" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <Label>{place.confidence}</Label>
          <span className="text-xs text-slate-500">
            {new Date(place.created_at).toLocaleDateString()}
          </span>
        </div>
        <p className="text-sm text-slate-700">{place.summary}</p>
        {place.why_it_matters && (
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Why it matters:</span>{" "}
            {place.why_it_matters}
          </p>
        )}
      </Card>

      {place.lat !== null && place.lng !== null && (
        <Card className="space-y-3">
          <h2 className="text-lg font-semibold">Map</h2>
          <PlaceMap lat={place.lat} lng={place.lng} />
        </Card>
      )}
    </main>
  );
}
