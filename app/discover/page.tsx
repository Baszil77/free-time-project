import dynamic from "next/dynamic";

const DiscoverMap = dynamic(
  () => import("@/components/DiscoverMap").then((mod) => mod.DiscoverMap),
  { ssr: false }
);

export default function DiscoverPage() {
  return (
    <main className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">What’s near me</h1>
        <p className="text-sm text-slate-600">
          Discover public places captured nearby.
        </p>
      </header>
      <DiscoverMap />
    </main>
  );
}
