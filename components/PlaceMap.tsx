"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { clientEnv } from "@/lib/env";

mapboxgl.accessToken = clientEnv.NEXT_PUBLIC_MAPBOX_TOKEN;

export function PlaceMap({ lat, lng }: { lat: number; lng: number }) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 13
    });

    new mapboxgl.Marker({ color: "#2563eb" }).setLngLat([lng, lat]).addTo(map);

    return () => {
      map.remove();
    };
  }, [lat, lng]);

  return <div ref={mapRef} className="h-56 w-full" />;
}
