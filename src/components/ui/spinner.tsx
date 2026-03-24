interface SpinnerProps {
  readonly size?: 'sm' | 'md' | 'lg';
  readonly className?: string;
}

const SIZE_MAP = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' } as const;

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin text-indigo-400 ${SIZE_MAP[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}

export function TableSkeleton({ rows = 10 }: { readonly rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Header skeleton */}
      <div className="h-10 bg-zinc-800 rounded-lg" />
      {/* Row skeletons */}
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 h-14 px-4">
          <div className="h-4 w-4 bg-zinc-800 rounded" />
          <div className="h-4 bg-zinc-800 rounded flex-1 max-w-[200px]" />
          <div className="h-4 bg-zinc-800 rounded w-16 hidden md:block" />
          <div className="h-4 bg-zinc-800 rounded w-16 hidden md:block" />
          <div className="h-4 bg-zinc-800 rounded w-24" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="h-3 bg-zinc-800 rounded w-24 mb-3" />
      <div className="h-8 bg-zinc-800 rounded w-16 mb-2" />
      <div className="h-2 bg-zinc-800 rounded w-32" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-zinc-800 rounded w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
