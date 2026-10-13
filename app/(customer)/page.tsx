import Link from "next/link";
import { ProductCard } from "@/components/catalog/product-card";
import { getAvailableKg, getFeaturedProducts, getVarieties } from "@/lib/catalog/queries";
import { getStoreSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";
import {
  BUSINESS_POINTS,
  FARM_POINTS,
  faqs,
  HIGHLIGHTS,
  NUTRITION,
  RECIPES,
  STEPS,
  VARIETIES,
} from "./home-content";

const primaryButton =
  "rounded-full bg-forest-primary px-6 py-3 font-display font-semibold text-spore-ivory hover:bg-forest-hover";
const secondaryButton =
  "rounded-full border border-forest-primary px-6 py-3 font-display font-semibold text-forest-primary hover:bg-forest-primary/5";

function SectionHeading({
  eyebrow,
  title,
  body,
  className,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-10 flex max-w-2xl flex-col gap-3", className)}>
      <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-shiitake-ochre">
        {eyebrow}
      </span>
      <h2 className="font-display text-3xl font-bold sm:text-4xl">{title}</h2>
      {body ? <p className="font-body text-forest-primary/70">{body}</p> : null}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="text-forest-primary">
      <Hero />
      <Highlights />
      <Varieties />
      <TodaysHarvest />
      <HowItWorks />
      <OurFarm />
      <Nutrition />
      <Recipes />
      <ForBusiness />
      <Faq />
      <FinalCallToAction />
    </div>
  );
}

// ------------------------------------------------------------------------------
// Sections
// ------------------------------------------------------------------------------

function Hero() {
  return (
    <section className="relative overflow-hidden bg-forest-primary text-spore-ivory">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 size-[28rem] rounded-full bg-shiitake-ochre/20 blur-3xl"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-[1.2fr_1fr] lg:py-28">
        <div className="flex flex-col items-start gap-6">
          <span className="rounded-full bg-spore-ivory/10 px-3 py-1 font-body text-xs font-semibold uppercase tracking-wide">
            Harvested today morning · 100% chemical-free & local
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-tight sm:text-6xl">
            Fresh Farm Harvest to Your Kitchen in Hours
          </h1>
          <p className="max-w-xl font-body text-lg text-spore-ivory/80">
            Gourmet oyster, milky and paddy straw mushrooms — grown sustainably on pasteurized
            straw, hand-picked at 5:00 AM and delivered the same day.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/products"
              className="rounded-full bg-spore-ivory px-6 py-3 font-display font-semibold text-forest-primary hover:bg-surface-white"
            >
              🛒 Shop Fresh Harvest
            </Link>
            <Link
              href="#business"
              className="rounded-full border border-spore-ivory px-6 py-3 font-display font-semibold hover:bg-forest-hover"
            >
              👨‍🍳 B2B Bulk for Chefs
            </Link>
          </div>
          <HarvestBadge />
        </div>

        <div className="relative rounded-3xl border border-spore-ivory/15 bg-spore-ivory/5 p-6 backdrop-blur">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-spore-ivory/60">
            A day at the farm
          </p>
          <ol className="mt-4 flex flex-col gap-4">
            {[
              ["5:00 AM", "Harvest", "Hand-picked from the fruiting rooms"],
              ["Morning", "Grade & pack", "Sorted, weighed and packed fresh"],
              ["8–11 AM", "Morning delivery", "Morning Harvest Dispatch slot"],
              ["4–7 PM", "Evening delivery", "Second slot for later orders"],
            ].map(([time, title, body]) => (
              <li key={time} className="flex gap-4">
                <span className="w-20 shrink-0 font-data text-sm text-shiitake-ochre">{time}</span>
                <span>
                  <span className="block font-display font-semibold">{title}</span>
                  <span className="font-body text-sm text-spore-ivory/70">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

async function HarvestBadge() {
  const availableKg = await getAvailableKg();
  return (
    <p className="font-data text-sm text-success-mint">
      {availableKg > 0
        ? `🟢 TODAY'S HARVEST: ${availableKg} KG AVAILABLE NOW · MORNING & EVENING DISPATCH`
        : "🟠 TODAY'S HARVEST IS SOLD OUT · NEXT HARVEST AT 5:00 AM"}
    </p>
  );
}

function Highlights() {
  return (
    <section className="border-b border-forest-primary/10 bg-surface-white">
      <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 lg:grid-cols-4">
        {HIGHLIGHTS.map((item) => (
          <div key={item.label} className="flex flex-col gap-1 text-center">
            <dt className="order-2 font-body text-sm text-forest-primary/70">{item.label}</dt>
            <dd className="order-1 font-display text-3xl font-extrabold">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

async function Varieties() {
  const stocked = await getVarieties();
  const byName = new Map(stocked.map((variety) => [variety.name.toLowerCase(), variety]));

  return (
    <section id="varieties" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
      <SectionHeading
        eyebrow="Our mushrooms"
        title="Six varieties, grown with care"
        body="Each variety has its own texture and flavour. Here's what we grow and how chefs love to use them."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {VARIETIES.map((variety) => {
          const live = byName.get(variety.name.toLowerCase());
          return (
            <Link
              key={variety.name}
              href={live ? `/products?variety=${encodeURIComponent(live.name)}` : "/products"}
              className="group flex flex-col overflow-hidden rounded-2xl border border-forest-primary/10 bg-surface-white transition-shadow hover:shadow-md"
            >
              <div className={cn("grid h-28 place-items-center bg-gradient-to-br text-5xl", variety.tone)}>
                <span aria-hidden>🍄</span>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-xl font-bold group-hover:underline">{variety.name}</h3>
                  {live ? (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 font-body text-xs font-semibold",
                        live.inStock
                          ? "bg-success-mint/15 text-success-mint"
                          : "bg-warning-amber/15 text-warning-amber",
                      )}
                    >
                      {live.inStock ? "In stock" : "Sold out"}
                    </span>
                  ) : null}
                </div>
                <p className="font-body text-sm text-forest-primary/70">{variety.description}</p>
                <p className="mt-auto font-body text-xs text-forest-primary/60">
                  <span className="font-semibold text-forest-primary">Best for:</span> {variety.bestFor}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

async function TodaysHarvest() {
  const products = await getFeaturedProducts(8);

  return (
    <section className="bg-surface-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            eyebrow="Shop"
            title="Today's harvest"
            body="Picked this morning and ready for dispatch."
            className="mb-0"
          />
          {products.length ? (
            <Link href="/products" className="font-body text-sm font-semibold underline-offset-4 hover:underline">
              View all products →
            </Link>
          ) : null}
        </div>
        <div className="mt-10">
          {products.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-forest-primary/20 p-12 text-center">
              <span className="text-4xl" aria-hidden>
                🌱
              </span>
              <p className="font-display text-xl font-bold">Our first harvest is on its way</p>
              <p className="max-w-md font-body text-sm text-forest-primary/70">
                Create a free account now and you&apos;ll be ready to order the moment fresh stock goes
                live.
              </p>
              <Link href="/register" className={primaryButton}>
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
      <SectionHeading
        eyebrow="Farm to kitchen"
        title="How it works"
        body="No middlemen, no cold-storage warehouses — just a short trip from our grow rooms to your plate."
      />
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="relative flex flex-col gap-3 rounded-2xl bg-surface-white p-6">
            <span className="absolute right-5 top-4 font-data text-sm text-forest-primary/30">
              0{index + 1}
            </span>
            <span className="text-3xl" aria-hidden>
              {step.icon}
            </span>
            <h3 className="font-display text-lg font-bold">{step.title}</h3>
            <p className="font-body text-sm text-forest-primary/70">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function OurFarm() {
  return (
    <section id="our-farm" className="scroll-mt-20 bg-forest-primary text-spore-ivory">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-shiitake-ochre">
            Our farm
          </span>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Grown clean, the slow and careful way
          </h2>
          <p className="font-body text-spore-ivory/80">
            Our mushrooms grow on pasteurized paddy straw inside climate-controlled rooms. We watch
            temperature and humidity every day, harvest by hand, and track every batch from spawn to
            sale — so what reaches your kitchen is consistently fresh and safe.
          </p>
          <ul className="flex flex-col gap-3">
            {FARM_POINTS.map((point) => (
              <li key={point} className="flex gap-3 font-body">
                <span className="text-success-mint" aria-hidden>
                  ✓
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            ["🌡️", "Controlled climate", "Rooms tuned for each growth stage"],
            ["📅", "Daily harvest", "Fresh cuts every morning at 5:00 AM"],
            ["♻️", "Zero waste", "Spent straw becomes compost for farms"],
            ["🔍", "Batch tracking", "Every pack traceable to its grow room"],
          ].map(([icon, title, body]) => (
            <div key={title} className="flex flex-col gap-2 rounded-2xl bg-spore-ivory/5 p-5">
              <span className="text-2xl" aria-hidden>
                {icon}
              </span>
              <span className="font-display font-semibold">{title}</span>
              <span className="font-body text-sm text-spore-ivory/70">{body}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Nutrition() {
  return (
    <section id="nutrition" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
      <SectionHeading
        eyebrow="Good for you"
        title="Small mushroom, big nutrition"
        body="Mushrooms are a delicious way to add nutrients to everyday meals."
      />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {NUTRITION.map((item) => (
          <div key={item.title} className="flex flex-col gap-2 rounded-2xl border border-forest-primary/10 bg-surface-white p-6">
            <span className="text-3xl" aria-hidden>
              {item.icon}
            </span>
            <h3 className="font-display text-lg font-bold">{item.title}</h3>
            <p className="font-body text-sm text-forest-primary/70">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Recipes() {
  return (
    <section id="recipes" className="scroll-mt-20 bg-surface-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <SectionHeading
          eyebrow="Ways to cook"
          title="Easy ideas for your first pack"
          body="Fresh mushrooms cook fast. Here are three favourites to get you started."
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {RECIPES.map((recipe) => (
            <article key={recipe.title} className="flex flex-col gap-3 rounded-2xl bg-spore-ivory p-6">
              <span className="self-start rounded-full bg-shiitake-ochre/15 px-2.5 py-0.5 font-data text-xs text-shiitake-ochre">
                ⏱ {recipe.time}
              </span>
              <h3 className="font-display text-xl font-bold">{recipe.title}</h3>
              <p className="font-body text-sm text-forest-primary/70">{recipe.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForBusiness() {
  return (
    <section id="business" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
      <div className="grid gap-10 overflow-hidden rounded-3xl bg-shiitake-ochre/10 p-8 sm:p-12 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-5">
          <span className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-shiitake-ochre">
            For restaurants & retailers
          </span>
          <h2 className="font-display text-3xl font-bold sm:text-4xl">Fresh supply for professional kitchens</h2>
          <p className="font-body text-forest-primary/70">
            Hotels, restaurants, cloud kitchens and grocers get dedicated B2B pricing and dependable
            daily supply.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/register" className={primaryButton}>
              Register your business
            </Link>
            <Link href="/products" className={secondaryButton}>
              See wholesale prices
            </Link>
          </div>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {BUSINESS_POINTS.map((point) => (
            <li key={point.title} className="flex flex-col gap-1 rounded-2xl bg-surface-white p-5">
              <span className="font-display font-semibold">{point.title}</span>
              <span className="font-body text-sm text-forest-primary/70">{point.body}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

async function Faq() {
  const { service_area } = await getStoreSettings();
  const items = faqs(service_area);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <section id="faq" className="scroll-mt-20 bg-surface-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 lg:grid-cols-[1fr_1.6fr]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
        <SectionHeading
          eyebrow="Questions"
          title="Frequently asked"
          body="Can't find what you're looking for? Reach us using the contact details below."
        />
        <div className="flex flex-col divide-y divide-forest-primary/10 border-y border-forest-primary/10">
          {items.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold">
                {item.question}
                <span className="text-xl transition-transform group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-3 font-body text-forest-primary/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCallToAction() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="flex flex-col items-center gap-5 rounded-3xl bg-forest-primary px-6 py-14 text-center text-spore-ivory">
        <span className="text-4xl" aria-hidden>
          🍄
        </span>
        <h2 className="max-w-2xl font-display text-3xl font-bold sm:text-4xl">
          Get tomorrow&apos;s harvest before it sells out
        </h2>
        <p className="max-w-xl font-body text-spore-ivory/80">
          Create a free account to save your details, get B2B pricing for your business, and hear
          first when sold-out varieties are back.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-spore-ivory px-6 py-3 font-display font-semibold text-forest-primary hover:bg-surface-white"
          >
            Create free account
          </Link>
          <Link
            href="/products"
            className="rounded-full border border-spore-ivory px-6 py-3 font-display font-semibold hover:bg-forest-hover"
          >
            Browse products
          </Link>
        </div>
      </div>
    </section>
  );
}
