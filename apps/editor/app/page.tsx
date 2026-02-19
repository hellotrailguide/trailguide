import Link from 'next/link'
import { ArrowRight, Github, Zap, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="Trailguide" className="h-8 w-8" />
            <span className="font-semibold text-lg">Trailguide Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/demo"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Live Demo
            </Link>
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Build Product Tours
            <span className="text-primary"> 10x Faster</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Visual editor for creating product tours. No code required.
            Sync to GitHub, track analytics, and ship in minutes.
          </p>
          <div className="flex items-center justify-center gap-4 mb-16">
            <Link
              href="/dashboard/edit/new"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Start Building
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-border px-6 py-3 rounded-lg font-medium hover:bg-accent transition-colors"
            >
              <Github className="h-4 w-4" />
              Sign in with GitHub
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-xl p-6 text-left">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Visual Editor</h3>
              <p className="text-sm text-muted-foreground">
                Drag-and-drop interface. Point and click to select targets.
                Live preview as you build.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-left">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Github className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">GitHub Sync</h3>
              <p className="text-sm text-muted-foreground">
                Push trails directly to your repo. Create PRs for review.
                Version control built-in.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-6 text-left">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Track completion rates. See where users drop off.
                Optimize your onboarding.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>Trailguide Pro Editor</p>
          <div className="flex items-center gap-4">
            <a href="https://gettrailguide.com#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <Link href="https://github.com/trailguide" className="hover:text-foreground transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
