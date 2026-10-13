import Link from "next/link";
import { getStorefrontCategories } from "@/lib/catalog/queries";
import { getStoreSettings } from "@/lib/settings";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-sm font-bold uppercase tracking-wide text-spore-ivory">
        {title}
      </h2>
      <ul className="flex flex-col gap-2 font-body text-sm text-spore-ivory/70">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-spore-ivory hover:underline">
        {children}
      </Link>
    </li>
  );
}

export async function SiteFooter() {
  const [settings, categories] = await Promise.all([getStoreSettings(), getStorefrontCategories()]);
  const topCategories = categories.filter((category) => !category.parentId);
  const whatsappDigits = settings.contact_whatsapp.replace(/\D/g, "");

  const contact = [
    settings.contact_phone && {
      label: settings.contact_phone,
      href: `tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`,
      icon: "📞",
    },
    whatsappDigits && {
      label: "Chat on WhatsApp",
      href: `https://wa.me/${whatsappDigits}`,
      icon: "💬",
    },
    settings.contact_email && {
      label: settings.contact_email,
      href: `mailto:${settings.contact_email}`,
      icon: "✉️",
    },
  ].filter(Boolean) as Array<{ label: string; href: string; icon: string }>;

  return (
    <footer className="bg-forest-primary text-spore-ivory">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Link href="/" className="font-display text-2xl font-bold">
            🍄 {settings.store_name}
          </Link>
          <p className="max-w-xs font-body text-sm text-spore-ivory/70">
            Fresh, chemical-free mushrooms grown on clean straw, harvested at dawn and delivered the
            same day.
          </p>
          {contact.length || settings.contact_address ? (
            <ul className="flex flex-col gap-2 font-body text-sm text-spore-ivory/80">
              {contact.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="hover:underline">
                    <span aria-hidden>{item.icon}</span> {item.label}
                  </a>
                </li>
              ))}
              {settings.contact_address ? (
                <li className="whitespace-pre-line">
                  <span aria-hidden>📍</span> {settings.contact_address}
                </li>
              ) : null}
            </ul>
          ) : null}
        </div>

        <FooterColumn title="Shop">
          <FooterLink href="/products">All products</FooterLink>
          {topCategories.map((category) => (
            <FooterLink key={category.slug} href={`/products?category=${category.slug}`}>
              {category.name}
            </FooterLink>
          ))}
          <FooterLink href="/products?inStock=1">In stock today</FooterLink>
        </FooterColumn>

        <FooterColumn title="Learn">
          <FooterLink href="/#how-it-works">How it works</FooterLink>
          <FooterLink href="/#our-farm">Our farm</FooterLink>
          <FooterLink href="/#nutrition">Nutrition</FooterLink>
          <FooterLink href="/#recipes">Ways to cook</FooterLink>
          <FooterLink href="/#faq">FAQ</FooterLink>
        </FooterColumn>

        <FooterColumn title="Account">
          <FooterLink href="/register">Create account</FooterLink>
          <FooterLink href="/login">Sign in</FooterLink>
          <FooterLink href="/account">My account</FooterLink>
          <FooterLink href="/#business">For restaurants & retailers</FooterLink>
        </FooterColumn>
      </div>

      <div className="border-t border-spore-ivory/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 font-body text-xs text-spore-ivory/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © <CopyrightYear /> {settings.store_name}. All rights reserved.
          </p>
          <p>Prices in INR (₹) · Harvested fresh daily</p>
        </div>
      </div>
    </footer>
  );
}

async function CopyrightYear() {
  "use cache";
  return new Date().getFullYear();
}
