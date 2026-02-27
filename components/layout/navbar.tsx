"use client"

import Link from "next/link"
import Image from "next/image"
import { User, LogOut } from "lucide-react"
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
  const { user, isLoggedIn, login, logout } = useAuth()
  const { t, locale, setLocale } = useI18n()

  return (
    <header className="glass-nav fixed top-0 left-0 right-0 z-50">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Left: Logo */}
        <Link
          href="/tools/product-insight"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <Image
            src="/images/logo.jpg"
            alt="GuruBox.ai"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <span className="font-semibold text-base tracking-tight text-foreground">
            GuruBox
            <span className="bg-gradient-to-r from-[oklch(0.78_0.14_70)] to-[oklch(0.58_0.16_250)] bg-clip-text text-transparent">.ai</span>
          </span>
        </Link>

        {/* Right: Account */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 rounded-full py-1 px-1.5 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="size-7">
                    <AvatarImage src={user?.avatar} alt={user?.name ?? "User"} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {user?.name?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-foreground sm:inline">
                    {user?.name?.split(" ")[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
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
                <DropdownMenuItem
                  onClick={logout}
                  className="flex items-center gap-2 text-destructive"
                >
                  <LogOut className="size-4" />
                  {t("nav_logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={login}
              className="btn-glow"
            >
              {t("nav_login")}
            </Button>
          )}
        </div>
      </nav>
    </header>
  )
}
