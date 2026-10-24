import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { CartProviderClient } from "@/components/cart/cart-provider-client";

export const instant = false;

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProviderClient>
      <div className="flex min-h-screen flex-col bg-spore-ivory dark:bg-charcoal-dark">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </CartProviderClient>
  );
}
