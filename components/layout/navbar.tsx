"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { User, LogOut, Menu, X } from "lucide-react"
import { useAuth } from "@/components/auth/auth-provider"
import { useI18n } from "@/components/i18n/i18n-provider"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SUPPORTED_LANGUAGES } from "@/lib/constants"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const { user, isLoggedIn, login, logout } = useAuth()
  const { t, locale, setLocale } = useI18n()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navLinks = [
    { href: "/tools/product-insight", label: t("nav_tools") },
  ]

  return (
    <header className="glass-nav fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/tools/product-insight"
          className="flex items-center gap-2 text-foreground font-semibold text-lg tracking-tight"
        >
          <span className="text-primary font-bold">Guru</span>
          <span className="text-foreground/80">Box</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                pathname === link.href || pathname.startsWith(link.href)
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}

          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-8">
                    <AvatarImage src={user?.avatar} alt={user?.name ?? "User"} />
                    <AvatarFallback>{user?.name?.charAt(0) ?? "U"}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    {t("account_language")}: {SUPPORTED_LANGUAGES.find((l) => l.code === locale)?.label}
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <DropdownMenuItem
                        key={lang.code}
                        onClick={() => setLocale(lang.code)}
                        className={cn(locale === lang.code && "bg-accent")}
                      >
                        {lang.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="flex items-center gap-2">
                    <User className="size-4" />
                    {t("nav_account")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive-foreground">
                  <LogOut className="size-4" />
                  {t("nav_logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={login}
              className="border-border text-foreground"
            >
              {t("nav_login")}
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="glass-nav border-t border-border md:hidden">
          <div className="flex flex-col gap-2 px-4 py-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  pathname === link.href || pathname.startsWith(link.href)
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  href="/account"
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
                  onClick={() => setMobileOpen(false)}
                >
                  {t("nav_account")}
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false) }}
                  className="rounded-md px-3 py-2 text-left text-sm font-medium text-destructive-foreground hover:bg-accent"
                >
                  {t("nav_logout")}
                </button>
              </>
            ) : (
              <button
                onClick={() => { login(); setMobileOpen(false) }}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
              >
                {t("nav_login")}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
