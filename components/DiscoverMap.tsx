"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { supabaseBrowser } from "@/lib/supabase/client";
import { clientEnv } from "@/lib/env";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, SecondaryButton } from "@/components/ui";

mapboxgl.accessToken = clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN;

type PublicPlace = {
  id: string;
  title: string;
  summary: string;
  lat: number;
  lng: number;
  city: string | null;
  created_at: string;
};

export function DiscoverMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const router = useRouter();
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [places, setPlaces] = useState<PublicPlace[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    mapInstanceRef.current = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [0, 0],
      zoom: 2
    });
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
        setLocation(coords);
        console.log("discover_location", coords);
      },
      (err) => {
        console.warn("discover_location_error", err);
        setStatus("error");
      }
    );
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !location) return;

    map.flyTo({ center: [location.lng, location.lat], zoom: 12 });
  }, [location]);

  useEffect(() => {
    const fetchPlaces = async () => {
      if (!location) return;
      setStatus("loading");
      const delta = 0.3;
      const { data, error } = await supabaseBrowser
        .from("places")
        .select("id,title,summary,lat,lng,city,created_at")
        .eq("is_public", true)
        .gte("lat", location.lat - delta)
        .lte("lat", location.lat + delta)
        .gte("lng", location.lng - delta)
        .lte("lng", location.lng + delta)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("discover_fetch_error", error);
        setStatus("error");
        return;
      }

      setPlaces(data ?? []);
      setStatus("idle");
    };

    fetchPlaces();
  }, [location]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.on("load", () => {
      map.resize();
    });
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = places.map((place) =>
      new mapboxgl.Marker({ color: "#2563eb" })
        .setLngLat([place.lng, place.lat])
        .setPopup(new mapboxgl.Popup({ offset: 16 }).setText(place.title))
        .addTo(map)
    );
  }, [places]);

  const summary = useMemo(() => {
    if (!location) return "Fetching your location...";
    if (status === "loading") return "Loading nearby places...";
    if (status === "error") return "Unable to load places.";
    return `${places.length} public places near you.`;
  }, [location, places.length, status]);

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Discovery</h2>
        <p className="text-sm text-slate-600">{summary}</p>
        {location && (
          <SecondaryButton
            onClick={() => {
              sessionStorage.setItem(
                "context_location",
                JSON.stringify(location)
              );
              console.log("discover_explain_here", { location });
              router.push("/");
            }}
          >
            Explain something here
          </SecondaryButton>
        )}
      </Card>
      <div className="h-64 overflow-hidden rounded-2xl border border-slate-200">
        <div ref={mapRef} className="h-full w-full" />
      </div>
      <div className="space-y-3">
        {places.map((place) => (
          <Link key={place.id} href={`/place/${place.id}`}>
            <Card className="space-y-1 transition hover:border-slate-300">
              <h3 className="text-base font-semibold">{place.title}</h3>
              <p className="text-sm text-slate-600">
                {place.summary}
              </p>
            </Card>
          </Link>
        ))}
        {places.length === 0 && status === "idle" && (
          <Card>
            <p className="text-sm text-slate-600">
              No public places nearby yet.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
