"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Swords, LayoutDashboard, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Lobby", icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-4 w-[calc(100%-2rem)] max-w-7xl mx-auto left-0 right-0 z-50 glass-strong rounded-full shadow-2xl px-2">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Swords className="w-7 h-7 text-primary" />
          <span className="text-lg font-bold gradient-text hidden sm:block">CSDuel</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-300",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="hidden sm:block">{item.label}</span>
            </Link>
          ))}
        </div>

        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-9 h-9 ring-2 ring-primary/20",
            },
          }}
        />
      </div>
    </nav>
  );
}
