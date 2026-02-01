import { supabaseServer } from "@/lib/supabase/server";
import { Card } from "@/components/ui";
import { SignInForm } from "@/components/SignInForm";
import { PlacesList } from "@/components/PlacesList";

export default async function PlacesPage() {
  const supabase = supabaseServer();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    return (
      <main className="space-y-4">
        <h1 className="text-2xl font-semibold">Your Places</h1>
        <Card className="space-y-3">
          <p className="text-sm text-slate-600">
            Sign in to see your saved places.
          </p>
          <SignInForm redirectTo="/places" />
        </Card>
      </main>
    );
  }

  const { data: places } = await supabase
    .from("places")
    .select("id,title,summary,city,country,created_at,photo_url")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Your Places</h1>
        <p className="text-sm text-slate-600">
          A quiet archive of what you’ve captured.
        </p>
      </header>
      <PlacesList places={places ?? []} />
    </main>
  );
}
