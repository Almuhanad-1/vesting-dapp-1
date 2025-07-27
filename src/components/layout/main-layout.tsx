// components/layout/main-layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Menu,
  Rocket,
  LayoutDashboard,
  BarChart3,
  Settings,
  Coins,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navigation: NavItem[] = [
  {
    title: "Deploy",
    href: "/deploy",
    icon: Rocket,
    description: "Create new tokens with vesting",
  },
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Manage your tokens and vesting",
  },
  {
    title: "Portfolio",
    href: "/portfolio",
    icon: Coins,
    description: "Track your vested tokens",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "View deployment analytics",
  },
  {
    title: "Beneficiaries",
    href: "/beneficiaries",
    icon: Users,
    description: "Manage token recipients",
  },
];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center">
          {/* Mobile menu button */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-3 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <MobileNav navigation={navigation} pathname={pathname} />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block">
              Vesting Factory
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === item.href
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <ConnectButton
                chainStatus="icon"
                accountStatus="address"
                showBalance={{
                  smallScreen: false,
                  largeScreen: true,
                }}
              />
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1">
        <div className="container max-w-screen-2xl py-6">{children}</div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/40">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between py-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>© 2024 Vesting Factory</span>
            <Separator orientation="vertical" className="h-4" />
            <span>Built on Ethereum Sepolia</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MobileNav({
  navigation,
  pathname,
}: {
  navigation: NavItem[];
  pathname: string;
}) {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex items-center space-x-2 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Rocket className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold">Vesting Factory</span>
      </div>
      <Separator />
      <div className="space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="mr-2 h-4 w-4" />
              <div className="flex flex-col">
                <span>{item.title}</span>
                <span className="text-xs text-muted-foreground">
                  {item.description}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
