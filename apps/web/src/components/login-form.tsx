"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase/client"
import { useLanguage } from "@/hooks/use-language"
import { t } from "@/lib/translations"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const { lang } = useLanguage()
  const tr = t(lang)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.replace("/dashboard")
    }
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl">{tr.authLoginTitle}</h1>
        <p className="text-sm text-balance text-muted-foreground">
          {tr.authLoginSubtitle}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{tr.authEmail}</Label>
          <Input
            id="email"
            type="email"
            placeholder={tr.authEmailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{tr.authPassword}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? tr.authSigningIn : tr.authLoginButton}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {tr.authNoAccount}{" "}
          <a href="/signup" className="underline underline-offset-4 hover:text-primary">
            {tr.authSignUpLink}
          </a>
        </p>
      </div>
    </form>
  )
}
