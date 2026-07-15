import { useNavigate } from 'react-router-dom'
import { BookOpen, ArrowLeft, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <BookOpen size={36} className="text-primary" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">404</p>
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-primary mb-4">
          Page not found
        </h1>
        <p className="text-muted-foreground text-base max-w-sm mx-auto mb-8">
          That page doesn't exist or has been moved. Head back and keep exploring.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate(-1)} variant="outline" className="gap-2">
            <ArrowLeft size={16} /> Go back
          </Button>
          <Button onClick={() => navigate('/catalog')} className="gap-2">
            <Search size={16} /> Browse catalog
          </Button>
        </div>
      </div>
    </div>
  )
}
