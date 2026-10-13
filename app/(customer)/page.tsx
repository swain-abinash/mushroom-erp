import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-4xl flex-col items-start gap-6 px-6 py-24">
      <h1 className="font-display text-4xl font-extrabold text-forest-primary sm:text-5xl">
        Fresh Farm Harvest to Your Kitchen in Hours
      </h1>
      <p className="font-body text-lg text-forest-primary/80">
        Grown sustainably on pasteurized straw. Harvested daily at 5:00 AM.
      </p>
      <div className="flex gap-4">
        <Button>🛒 Shop Fresh Harvest</Button>
        <Button variant="secondary">👨‍🍳 B2B Bulk for Chefs</Button>
      </div>
      <p className="font-data text-sm text-success-mint">
        🟢 TODAY&apos;S HARVEST: 38.5 KG AVAILABLE NOW · NEXT DISPATCH: 11:00 AM
      </p>
    </section>
  );
}
