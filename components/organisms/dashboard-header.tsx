"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, Menu, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCompanySettings } from "@/context/CompanySettingsContext";

import { ThemeToggle } from "@/components/chat/ThemeToggle";

interface DashboardHeaderProps {
  onMenuClick?: () => void;
}

export function DashboardHeader({ onMenuClick }: DashboardHeaderProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { contactImageUrl: headerImageUrl } = useCompanySettings();

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/");
    } catch (err) {
      console.error("Error during logout:", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="relative flex h-24 items-center gap-4 px-6 md:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden -ml-2 text-muted-foreground hover:text-foreground"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </Button>

        {/* agentos-logo hidden */}

        {/* Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            {/* <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search dashboard..."
              className="pl-10 bg-muted/50"
            /> */}
          </div>
        </div>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-4">
          <ThemeToggle className="mr-2" />

          {/* Notifications */}
          {/* <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs">3</Badge>
          </Button> */}

          {/* Help */}
          {/* <Button variant="ghost" size="sm">
            <HelpCircle className="h-5 w-5" />
          </Button> */}

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 rounded-full border border-muted-foreground"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={headerImageUrl || undefined}
                    alt={user?.full_name || "User"}
                  />
                  <AvatarFallback>
                    {user?.full_name ? (
                      user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                {user && (
                  <span
                    className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
                    aria-label="Online"
                  >
                    <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1 min-w-0">
                  <p className="text-sm font-medium leading-snug wrap-anywhere">
                    {user?.full_name || "User"}
                  </p>
                  <p className="text-xs leading-snug text-muted-foreground my-2 wrap-anywhere">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/company")}>
                <Building2 className="mr-2 h-4 w-4" />
                <span>Company</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
