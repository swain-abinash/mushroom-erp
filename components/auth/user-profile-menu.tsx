"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOutAction } from "@/app/actions/auth";

type UserProfileMenuProps = {
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
    isStaff: boolean;
    isFounder: boolean;
  };
};

export function UserProfileMenu({ user }: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Determine primary display role
  const getRoleInfo = () => {
    if (user.isFounder || user.roles.includes("FOUNDER_ADMIN")) {
      return { label: "Founder Admin", icon: "🛡️", isStaff: true };
    }
    if (user.roles.includes("FARM_MANAGER")) {
      return { label: "Farm Manager", icon: "🌾", isStaff: true };
    }
    if (user.roles.includes("PRODUCTION_STAFF")) {
      return { label: "Cultivation Staff", icon: "🍄", isStaff: true };
    }
    if (user.roles.includes("INVENTORY_STAFF")) {
      return { label: "Stock Officer", icon: "📦", isStaff: true };
    }
    if (user.roles.includes("OPERATIONS_STAFF")) {
      return { label: "Dispatch Agent", icon: "🚚", isStaff: true };
    }
    if (user.isStaff) {
      return { label: "Staff", icon: "🛡️", isStaff: true };
    }
    return { label: "Customer", icon: "👤", isStaff: false };
  };

  const roleInfo = getRoleInfo();
  const initial = (user.name ? user.name[0] : "U").toUpperCase();
  const firstName = user.name.split(" ")[0] || "Account";

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      {/* If Staff, prominent standalone Admin Console quick-switch pill */}
      {user.isStaff && (
        <Link
          href="/admin/dashboard"
          className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full bg-forest-primary px-3 text-xs font-bold text-spore-ivory hover:bg-forest-hover shadow-xs transition-all shrink-0"
        >
          <span>🛡️</span>
          <span>Admin Console</span>
        </Link>
      )}

      {/* Unified User Account Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex h-9 items-center gap-2 rounded-full border border-forest-primary/20 dark:border-white/15 bg-surface-white dark:bg-surface-charcoal px-3 text-xs text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/5 dark:hover:bg-white/5 hover:border-forest-primary/40 dark:hover:border-white/30 transition-all shadow-xs cursor-pointer shrink-0"
      >
        {/* User Initial Circle */}
        <span className="flex size-6 items-center justify-center rounded-full bg-forest-primary dark:bg-forest-hover text-[11px] font-bold text-spore-ivory">
          {initial}
        </span>

        {/* User First Name */}
        <span className="font-semibold max-w-[100px] truncate text-forest-primary dark:text-spore-ivory">
          {firstName}
        </span>

        {/* Small Role Chip */}
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            roleInfo.isStaff
              ? "bg-forest-primary text-spore-ivory dark:bg-success-mint dark:text-surface-charcoal"
              : "bg-forest-primary/10 text-forest-primary dark:bg-white/10 dark:text-spore-ivory"
          }`}
        >
          {roleInfo.label}
        </span>

        {/* Subtle Dropdown Chevron */}
        <svg
          className={`size-3 text-forest-primary/50 dark:text-spore-ivory/50 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Sleek Floating Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-forest-primary/15 dark:border-white/10 bg-surface-white dark:bg-[#16211d] p-2 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
          {/* User Info Header */}
          <div className="rounded-xl bg-forest-primary/5 dark:bg-white/5 p-3 mb-1">
            <p className="font-display font-bold text-xs text-forest-primary dark:text-spore-ivory truncate">
              {user.name}
            </p>
            <p className="text-[11px] text-forest-primary/60 dark:text-spore-ivory/60 truncate mt-0.5">
              {user.email}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-surface-white dark:bg-white/10 border border-forest-primary/15 dark:border-white/10 px-2 py-0.5 text-[10px] font-bold text-forest-primary dark:text-spore-ivory">
              <span>{roleInfo.icon}</span>
              <span>{roleInfo.label}</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-0.5 text-xs text-forest-primary dark:text-spore-ivory">
            {user.isStaff && (
              <Link
                href="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 font-semibold text-forest-primary dark:text-spore-ivory hover:bg-forest-primary/10 dark:hover:bg-white/10 transition-colors"
              >
                <span>🛡️</span>
                <span>Admin Console</span>
              </Link>
            )}

            <Link
              href="/account/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-forest-primary/5 dark:hover:bg-white/5 transition-colors"
            >
              <span>📦</span>
              <span>My Orders</span>
            </Link>

            <Link
              href="/account"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-forest-primary/5 dark:hover:bg-white/5 transition-colors"
            >
              <span>👤</span>
              <span>Account & Addresses</span>
            </Link>
          </div>

          <div className="my-1.5 border-t border-forest-primary/10 dark:border-white/10" />

          {/* Sign Out Action */}
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-alert-coral hover:bg-alert-coral/10 transition-colors cursor-pointer"
            >
              <span>🚪</span>
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
