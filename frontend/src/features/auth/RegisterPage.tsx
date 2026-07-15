import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookOpen, ArrowRight, ShieldCheck, LockKeyhole,
  BadgeCheck, Eye, EyeOff, Loader2, CheckCircle2, Circle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { register } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/cn'

const STEPS = ['Identity', 'Account', 'Password']

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters',    ok: password.length >= 8 },
    { label: 'Contains a number',         ok: /\d/.test(password) },
    { label: 'Contains a letter',         ok: /[a-zA-Z]/.test(password) },
  ]
  const strength = checks.filter((c) => c.ok).length
  const bars = ['bg-destructive', 'bg-yellow-400', 'bg-emerald-500']
  const label = ['Weak', 'Fair', 'Strong']

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-all duration-300',
              i < strength ? bars[strength - 1] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          {checks.map((c) => (
            <div key={c.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {c.ok
                ? <CheckCircle2 size={11} className="text-emerald-500" />
                : <Circle size={11} className="text-muted-foreground/40" />}
              {c.label}
            </div>
          ))}
        </div>
        {strength > 0 && (
          <span className={cn(
            'text-xs font-bold',
            strength === 1 ? 'text-destructive' : strength === 2 ? 'text-yellow-500' : 'text-emerald-600',
          )}>
            {label[strength - 1]}
          </span>
        )}
      </div>
    </div>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { toast } = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ fullName: '', indexNumber: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function nextStep(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (step < 2) { setStep((s) => s + 1); return }
    handleSubmit()
  }

  async function handleSubmit() {
    setError('')
    setLoading(true)
    try {
      const result = await register(form)
      setAuth(result.user, result.accessToken)
      toast({ title: 'Account created! Welcome to UniMarket.', variant: 'success' })
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  const stepContent = [
    /* Step 0 — Identity */
    <>
      <div className="space-y-1.5">
        <Label htmlFor="fullName" className="font-semibold text-sm">Full name</Label>
        <Input
          id="fullName" placeholder="Ama Mensah"
          value={form.fullName} onChange={set('fullName')}
          required autoFocus className="h-11"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="indexNumber" className="font-semibold text-sm">Student index number</Label>
        <Input
          id="indexNumber" placeholder="UG/2023/001234"
          value={form.indexNumber} onChange={set('indexNumber')}
          required className="h-11"
        />
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <BadgeCheck size={11} className="text-primary" />
          Format: UG/YYYY/NNNNNN — as it appears on your student ID.
        </p>
      </div>
    </>,

    /* Step 1 — Account */
    <>
      <div className="space-y-1.5">
        <Label htmlFor="email" className="font-semibold text-sm">Institutional email</Label>
        <Input
          id="email" type="email" placeholder="you@university.edu"
          value={form.email} onChange={set('email')}
          required autoFocus className="h-11"
        />
        <p className="text-xs text-muted-foreground">Use your official university email address.</p>
      </div>
    </>,

    /* Step 2 — Password */
    <>
      <div className="space-y-1.5">
        <Label htmlFor="password" className="font-semibold text-sm">Create a password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="At least 8 characters"
            value={form.password} onChange={set('password')}
            required minLength={8} autoFocus className="h-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <PasswordStrength password={form.password} />
      </div>
    </>,
  ]

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* ── Left panel ── */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-primary overflow-hidden">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/5" />

        <Link to="/" className="relative flex items-center gap-2.5 font-serif font-bold text-2xl text-white">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          UniMarket
        </Link>

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-widest">
            <BadgeCheck size={12} /> Verified campus exchange
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Join your trusted campus marketplace.
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10">
            Every account is verified against the student registry — only real, enrolled students can buy and sell.
          </p>
          <div className="space-y-4">
            {[
              { icon: <BadgeCheck size={16} />, text: 'Index number verification' },
              { icon: <ShieldCheck size={16} />, text: 'Institutional email confirmation' },
              { icon: <LockKeyhole size={16} />, text: 'Secure, private messaging' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-white/70 text-sm">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                {f.text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-white/30 text-xs">© {new Date().getFullYear()} UniMarket</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 bg-background">
        <div className="max-w-sm w-full mx-auto animate-fade-up">
          <Link to="/" className="flex md:hidden items-center gap-2 font-serif font-bold text-xl text-primary mb-10">
            <BookOpen size={22} /> UniMarket
          </Link>

          <p className="section-label mb-2">Create account</p>
          <h2 className="font-serif text-3xl font-bold text-primary mb-1">Verify your identity</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Already a member?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign in</Link>
          </p>

          {/* Step progress */}
          <div className="flex items-center gap-0 mb-8">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                    i < step
                      ? 'bg-emerald-500 text-white'
                      : i === step
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'bg-muted text-muted-foreground',
                  )}>
                    {i < step ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className={cn(
                    'text-[10px] font-semibold whitespace-nowrap',
                    i === step ? 'text-primary' : 'text-muted-foreground',
                  )}>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn(
                    'flex-1 h-0.5 mb-4 mx-1 transition-all duration-300',
                    i < step ? 'bg-emerald-400' : 'bg-border',
                  )} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={nextStep} className="space-y-5">
            {stepContent[step]}

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                <p className="text-sm text-destructive leading-snug">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              {step > 0 && (
                <Button
                  type="button" variant="outline" size="lg"
                  className="flex-1 h-11"
                  onClick={() => setStep((s) => s - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                type="submit" size="lg"
                className="flex-1 h-11 gap-2 text-base"
                disabled={loading || (step === 2 && form.password.length < 8)}
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" /> Creating…</>
                  : step < 2
                    ? <>Continue <ArrowRight size={16} /></>
                    : <>Create account <ArrowRight size={16} /></>}
              </Button>
            </div>
          </form>

          {step === 2 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              By joining you agree to our{' '}
              <a href="#" className="underline hover:text-primary">Terms</a> and{' '}
              <a href="#" className="underline hover:text-primary">Privacy policy</a>.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
