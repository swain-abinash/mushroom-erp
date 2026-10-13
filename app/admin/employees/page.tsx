import type { Metadata } from "next";
import { hasPermission, requirePermission } from "@/lib/auth/dal";
import { PERMISSIONS } from "@/lib/auth/permissions";
import { formatDate } from "@/lib/utils";
import { listEmployees, listStaffRoles } from "@/services/employee.service";
import { AssignRolesForm, InviteEmployeeForm, ToggleActiveForm } from "./employee-forms";

export const metadata: Metadata = { title: "Employees — SporeERP Admin" };

export default async function EmployeesPage() {
  const user = await requirePermission(PERMISSIONS.USERS_VIEW, "/admin/employees");
  const canManage = hasPermission(user, PERMISSIONS.USERS_MANAGE_ROLES);
  const [employees, roles] = await Promise.all([listEmployees(), listStaffRoles()]);
  const roleLabel = new Map(roles.map((role) => [role.name, role.displayName]));

  return (
    <div className="flex flex-col gap-8 font-body">
      <header>
        <h1 className="font-display text-2xl font-bold">Employees</h1>
        <p className="mt-1 text-sm text-spore-ivory/70">
          Staff accounts and their roles. Role changes apply on the employee&apos;s next page load.
        </p>
      </header>

      {canManage ? (
        <section className="rounded-2xl border border-spore-ivory/10 bg-surface-charcoal p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Invite staff member</h2>
          <InviteEmployeeForm roles={roles} />
        </section>
      ) : null}

      <section className="overflow-x-auto rounded-2xl border border-spore-ivory/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-charcoal text-xs uppercase tracking-wide text-spore-ivory/60">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Position</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Status</th>
              {canManage ? <th className="px-4 py-3">Actions</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-spore-ivory/10">
            {employees.map((employee) => (
              <tr key={employee.id} className={employee.isActive ? undefined : "opacity-60"}>
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold">{employee.name}</div>
                  <div className="text-xs text-spore-ivory/60">{employee.email}</div>
                </td>
                <td className="px-4 py-3 align-top">
                  {employee.employee ? (
                    <>
                      <div>{employee.employee.designation}</div>
                      <div className="text-xs text-spore-ivory/60">
                        {employee.employee.department} · since{" "}
                        {formatDate(employee.employee.joiningDate)}
                      </div>
                    </>
                  ) : (
                    <span className="text-spore-ivory/40">—</span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  {canManage ? (
                    <AssignRolesForm userId={employee.id} roles={roles} selected={employee.roles} />
                  ) : (
                    employee.roles.map((role) => roleLabel.get(role) ?? role).join(", ")
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <span className={employee.isActive ? "text-success-mint" : "text-alert-coral"}>
                    {employee.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                {canManage ? (
                  <td className="px-4 py-3 align-top">
                    {employee.id === user.id ? (
                      <span className="text-xs text-spore-ivory/40">You</span>
                    ) : (
                      <ToggleActiveForm userId={employee.id} isActive={employee.isActive} />
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
