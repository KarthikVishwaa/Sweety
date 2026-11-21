import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 p-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">The page you are looking for does not exist.</p>
      <Link to="/" className="font-medium text-primary hover:underline">
        Back to home
      </Link>
    </main>
  );
}
