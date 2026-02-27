"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export function UserInfo() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-6">
      <Avatar className="size-14">
        <AvatarImage src={user.avatar} alt={user.name} />
        <AvatarFallback className="text-lg">{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-0.5">
        <p className="text-lg font-semibold text-foreground">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
    </div>
  )
}
