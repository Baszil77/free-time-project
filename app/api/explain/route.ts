import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import OpenAI from "openai";
import { z } from "zod";
import { mapboxEnv, openaiEnv, supabaseEnv } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabase/admin";

const RESPONSE_SCHEMA = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  why_it_matters: z.string().nullable(),
  confidence: z.enum(["high", "medium", "inferred"])
});

const DAILY_CAP = 5;

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient(
    { cookies },
    {
      supabaseUrl: supabaseEnv.SUPABASE_URL,
      supabaseKey: supabaseEnv.SUPABASE_ANON_KEY
    }
  );

  const {
    data: { session }
  } = await supabase.auth.getSession();

  let anonId = cookieStore.get("context_anon_id")?.value;
  if (!anonId) {
    anonId = crypto.randomUUID();
  }

  const formData = await request.formData();
  const image = formData.get("image");
  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Image is required." }, { status: 400 });
  }

  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  const now = new Date();
  const startOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  ).toISOString();
  const endOfDay = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  ).toISOString();

  const identifierColumn = session?.user ? "user_id" : "anon_id";
  const identifierValue = session?.user ? session.user.id : anonId;

  const { count } = await supabaseAdmin
    .from("ai_requests")
    .select("id", { count: "exact", head: true })
    .eq(identifierColumn, identifierValue)
    .gte("created_at", startOfDay)
    .lt("created_at", endOfDay);

  if ((count ?? 0) >= DAILY_CAP) {
    return NextResponse.json(
      { error: "Daily explanation limit reached." },
      { status: 429 }
    );
  }

  const fileBuffer = Buffer.from(await image.arrayBuffer());
  const hash = await crypto.subtle.digest("SHA-256", fileBuffer);
  const hashHex = Buffer.from(hash).toString("hex");
  const coarseLocation = hasLocation
    ? `${roundCoord(lat)}:${roundCoord(lng)}`
    : "unknown";

  const { data: cached } = await supabaseAdmin
    .from("ai_cache")
    .select("response")
    .eq("hash", hashHex)
    .eq("coarse_location", coarseLocation)
    .maybeSingle();

  let aiResponse: z.infer<typeof RESPONSE_SCHEMA> | null =
    cached?.response ?? null;

  if (!aiResponse) {
    const openai = new OpenAI({ apiKey: openaiEnv.OPENAI_API_KEY });
    const prompt = buildPrompt(hasLocation ? { lat, lng } : null);
    const dataUrl = `data:${image.type};base64,${fileBuffer.toString("base64")}`;

    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: dataUrl }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "context",
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              why_it_matters: { type: ["string", "null"] },
              confidence: {
                type: "string",
                enum: ["high", "medium", "inferred"]
              }
            },
            required: ["title", "summary", "why_it_matters", "confidence"],
            additionalProperties: false
          }
        }
      }
    });

    const outputText = completion.output_text;
    aiResponse = RESPONSE_SCHEMA.parse(JSON.parse(outputText));

    await supabaseAdmin.from("ai_cache").insert({
      hash: hashHex,
      coarse_location: coarseLocation,
      response: aiResponse
    });
  }

  await supabaseAdmin.from("ai_requests").insert({
    user_id: session?.user?.id ?? null,
    anon_id: session?.user ? null : anonId
  });

  let placeId: string | null = null;
  let saveSkippedReason: string | null = null;

  if (session?.user) {
    const extension = image.type.split("/")[1] ?? "jpg";
    const path = `${session.user.id}/${crypto.randomUUID()}.${extension}`;

    const upload = await supabaseAdmin.storage
      .from("photos")
      .upload(path, fileBuffer, { contentType: image.type });

    if (upload.error) {
      console.error("photo_upload_error", upload.error);
      saveSkippedReason = "Photo upload failed.";
    } else {
      const { city, country } = await reverseGeocode(
        hasLocation ? { lat, lng } : null
      );

      const { data, error } = await supabaseAdmin
        .from("places")
        .insert({
          user_id: session.user.id,
          title: aiResponse.title,
          summary: aiResponse.summary,
          why_it_matters: aiResponse.why_it_matters,
          confidence: aiResponse.confidence,
          photo_url: path,
          lat: hasLocation ? lat : null,
          lng: hasLocation ? lng : null,
          city,
          country,
          is_public: false
        })
        .select("id")
        .single();

      if (error) {
        console.error("place_insert_error", error);
        saveSkippedReason = "Save failed.";
      } else {
        placeId = data.id;
      }
    }
  } else {
    saveSkippedReason = "Sign in to save this to your archive.";
  }

  const response = NextResponse.json({
    ...aiResponse,
    savedPlaceId: placeId,
    saveSkippedReason
  });
  response.cookies.set("context_anon_id", anonId, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}

function roundCoord(value: number) {
  return Math.round(value * 100) / 100;
}

function buildPrompt(location: { lat: number; lng: number } | null) {
  return `You are a calm, factual guide. Describe the place in 2-3 sentences. Avoid overclaiming. If unsure, keep it general and set confidence to inferred.\n\n${
    location
      ? `Approximate location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(
          4
        )}.`
      : "No location data provided."
  }`;
}

async function reverseGeocode(location: { lat: number; lng: number } | null) {
  if (!location) return { city: null, country: null };

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${location.lng},${location.lat}.json`
  );
  url.searchParams.set("access_token", mapboxEnv.MAPBOX_TOKEN);
  url.searchParams.set("types", "place,country");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      return { city: null, country: null };
    }
    const data = await response.json();
    const city = data.features?.find((feat: any) => feat.place_type?.includes("place"));
    const country = data.features?.find((feat: any) => feat.place_type?.includes("country"));
    return {
      city: city?.text ?? null,
      country: country?.text ?? null
    };
  } catch (error) {
    console.warn("reverse_geocode_error", error);
    return { city: null, country: null };
  }
}
