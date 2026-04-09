import { AuthHeroImage, AuthPageShell } from "@/components/auth-page-shell"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <AuthPageShell>
        <SignupForm />
      </AuthPageShell>
      <AuthHeroImage />
    </div>
  )
}
