import { Link } from 'react-router-dom'
import { BookOpen, Shield, Lock, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border bg-background mt-16">
      <div className="container py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 font-serif font-bold text-primary text-lg mb-3">
            <BookOpen size={20} /> UniMarket
          </Link>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A secure marketplace for students, verified by institutional identity.
            Buy, sell, and trade on campus with confidence.
          </p>
        </div>
        <div>
          <p className="font-semibold text-sm mb-3">Marketplace</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/catalog" className="hover:text-primary transition-colors">Browse listings</Link></li>
            <li><Link to="/listings/new" className="hover:text-primary transition-colors">Sell an item</Link></li>
            <li><Link to="/catalog?sort=popular" className="hover:text-primary transition-colors">Trending</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-sm mb-3">Trust & Safety</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5"><Shield size={13} /> Index number verification</li>
            <li className="flex items-center gap-1.5"><Lock size={13} /> Secure messaging</li>
            <li className="flex items-center gap-1.5"><MapPin size={13} /> Campus meet-up zones</li>
          </ul>
        </div>
      </div>
      <div className="container border-t border-border py-4 text-xs text-muted-foreground flex items-center justify-between flex-wrap gap-2">
        <span>© {new Date().getFullYear()} UniMarket. Campus exchange built on trust.</span>
        <div className="flex gap-4">
          <a href="#" className="hover:text-primary">Privacy</a>
          <a href="#" className="hover:text-primary">Terms</a>
          <a href="#" className="hover:text-primary">Safety</a>
        </div>
      </div>
    </footer>
  )
}
