import { AuthHeroImage, AuthPageShell } from "@/components/auth-page-shell"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <AuthPageShell>
        <LoginForm />
      </AuthPageShell>
      <AuthHeroImage />
    </div>
  )
}
