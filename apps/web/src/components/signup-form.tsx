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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter()
  const { lang } = useLanguage()
  const tr = t(lang)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [registrationRole, setRegistrationRole] = useState<"student" | "tutor">("student")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(tr.authPasswordMismatch)
      return
    }
    if (password.length < 8) {
      setError(tr.authPasswordMinLength)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { registration_role: registrationRole } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else if (data.session) {
      // Email confirmation is disabled — session is live immediately
      router.replace("/dashboard")
    } else {
      // Email confirmation required
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl">{tr.authCheckEmailTitle}</h1>
        <p className="text-sm text-muted-foreground">
          {tr.authCheckEmailPart1} <strong>{email}</strong>. {tr.authCheckEmailPart2}{" "}
          <a href="/login" className="underline underline-offset-4 hover:text-primary">
            {tr.authSignInInline}
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit} {...props}>
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl">{tr.authSignupTitle}</h1>
        <p className="text-sm text-balance text-muted-foreground">
          {tr.authSignupSubtitle}
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
            placeholder={tr.authPasswordHintPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-password">{tr.authConfirmPassword}</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label id="reg-role-label">{tr.authRegisterAs}</Label>
          <div
            className="flex rounded-lg border p-1"
            role="group"
            aria-labelledby="reg-role-label"
          >
            <button
              type="button"
              onClick={() => setRegistrationRole("student")}
              className={cn(
                "flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                registrationRole === "student"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tr.authRegisterStudent}
            </button>
            <button
              type="button"
              onClick={() => setRegistrationRole("tutor")}
              className={cn(
                "flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                registrationRole === "tutor"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tr.authRegisterTutor}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {registrationRole === "student" ? tr.authRegisterHintStudent : tr.authRegisterHintTutor}
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? tr.authCreatingAccount : tr.authCreateAccountButton}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {tr.authHaveAccount}{" "}
          <a href="/login" className="underline underline-offset-4 hover:text-primary">
            {tr.authSignInLink}
          </a>
        </p>
      </div>
    </form>
  )
}
