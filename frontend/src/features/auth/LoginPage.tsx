import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, ArrowRight, ShieldCheck, LockKeyhole, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { login } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/components/ui/toast'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { toast } = useToast()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login({ identifier, password })
      setAuth(result.user, result.accessToken)
      toast({ title: `Welcome back, ${result.user.fullName.split(' ')[0]}!`, variant: 'success' })
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* ── Left panel ── */}
      <div className="relative hidden md:flex flex-col justify-between p-12 bg-primary overflow-hidden">
        {/* Dot pattern decoration */}
        <div className="absolute inset-0 bg-dots opacity-20" />
        {/* Bottom-right circle decoration */}
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
            <ShieldCheck size={12} /> Verified campus exchange
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl font-bold text-white leading-tight mb-5">
            Welcome back to your campus marketplace.
          </h1>
          <p className="text-white/60 text-base leading-relaxed mb-10">
            Sign in with your student index number or institutional email to access listings, messages, and saved items.
          </p>
          <div className="space-y-4">
            {[
              { icon: <ShieldCheck size={16} />, text: 'Every account verified by student registry' },
              { icon: <LockKeyhole size={16} />, text: 'End-to-end encrypted messaging' },
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
          {/* Mobile brand */}
          <Link to="/" className="flex md:hidden items-center gap-2 font-serif font-bold text-xl text-primary mb-10">
            <BookOpen size={22} /> UniMarket
          </Link>

          <p className="section-label mb-2">Student sign in</p>
          <h2 className="font-serif text-3xl font-bold text-primary mb-1">Sign in securely</h2>
          <p className="text-muted-foreground text-sm mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Join free
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="identifier" className="font-semibold text-sm">
                Student ID or email
              </Label>
              <Input
                id="identifier"
                placeholder="UG/2023/001234 or you@university.edu"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoFocus
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="font-semibold text-sm">Password</Label>
                <a href="#" className="text-xs text-primary hover:underline font-medium">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl bg-destructive/8 border border-destructive/20 px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                <p className="text-sm text-destructive leading-snug">{error}</p>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full gap-2 h-11 text-base" disabled={loading}>
              {loading
                ? <><Loader2 size={17} className="animate-spin" /> Signing in…</>
                : <>Sign in <ArrowRight size={17} /></>}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">Secure sign in</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Trust note */}
          <div className="flex items-center gap-2.5 bg-primary/5 rounded-xl px-4 py-3 border border-primary/10">
            <ShieldCheck size={15} className="text-primary shrink-0" />
            <p className="text-xs text-muted-foreground leading-snug">
              Your credentials are encrypted. UniMarket never shares your student data.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
