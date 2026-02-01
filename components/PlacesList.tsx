"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";

type Place = {
  id: string;
  title: string;
  summary: string;
  city: string | null;
  country: string | null;
  created_at: string;
  photo_url: string | null;
};

export function PlacesList({ places }: { places: Place[] }) {
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const filtered = places.filter((place) => {
      const haystack = `${place.title} ${place.city ?? ""} ${place.country ?? ""}`
        .toLowerCase()
        .trim();
      return haystack.includes(query.toLowerCase());
    });

    return filtered.reduce<Record<string, Place[]>>((acc, place) => {
      const key = place.city ?? "Unknown";
      acc[key] = acc[key] ? [...acc[key], place] : [place];
      return acc;
    }, {});
  }, [places, query]);

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search by title or city"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
      />

      {Object.entries(grouped).map(([city, items]) => (
        <section key={city} className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {city}
          </h2>
          {items.map((place) => (
            <Link key={place.id} href={`/place/${place.id}`}>
              <Card className="space-y-2 transition hover:border-slate-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{place.title}</h3>
                  <span className="text-xs text-slate-500">
                    {new Date(place.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {place.summary}
                </p>
              </Card>
            </Link>
          ))}
        </section>
      ))}

      {places.length === 0 && (
        <Card>
          <p className="text-sm text-slate-600">No saved places yet.</p>
        </Card>
      )}
    </div>
  );
}
