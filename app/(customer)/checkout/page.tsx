import { getCurrentUser } from "@/lib/auth/dal";
import { OrderService } from "@/services/order.service";
import { CheckoutForm } from "./checkout-form";

export const instant = false;
export const metadata = {
  title: "Checkout — SporeERP Farm Fresh",
};

export default async function CheckoutPage() {
  const user = await getCurrentUser();
  const savedAddresses = user ? await OrderService.getCustomerAddresses(user.id) : [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 font-body">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-forest-primary sm:text-4xl">
          Farm Direct Checkout
        </h1>
        <p className="mt-1 text-sm text-forest-primary/70">
          Harvested fresh daily at 5:00 AM • Direct from the grow room to your kitchen
        </p>
      </div>

      <CheckoutForm
        user={
          user
            ? { name: user.name, email: user.email, phone: user.phone }
            : { name: "", email: "", phone: "" }
        }
        savedAddresses={savedAddresses}
      />
    </div>
  );
}
