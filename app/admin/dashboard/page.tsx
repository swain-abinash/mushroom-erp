import { requireStaff } from "@/lib/auth/dal";
import { ROLE_DEFINITIONS, type RoleName } from "@/lib/auth/permissions";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [user, { error }] = await Promise.all([requireStaff(), searchParams]);
  const roleNames = user.roles.map(
    (role) => ROLE_DEFINITIONS[role as RoleName]?.displayName ?? role,
  );

  return (
    <div className="flex flex-col gap-4 font-body">
      {error === "restricted" ? (
        <p role="alert" className="rounded-lg bg-alert-coral/10 px-3 py-2 text-sm text-alert-coral">
          That area is restricted to founder admins.
        </p>
      ) : null}
      <h1 className="font-display text-2xl font-bold">Executive Command Center</h1>
      <p className="text-spore-ivory/70">
        Signed in as <span className="font-semibold text-spore-ivory">{user.name}</span> ·{" "}
        {roleNames.join(", ")}
      </p>
      <p className="text-spore-ivory/70">
        Metrics, order pipeline, and farm telemetry land here in later sprints.
      </p>
    </div>
  );
}
