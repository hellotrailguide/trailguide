import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
        <p className="text-muted-foreground mb-4">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="text-primary hover:underline"
        >
          Go back home
        </Link>
      </div>
    </div>
  )
}
