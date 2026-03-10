'use client'

interface SkeletonCardProps {
  height?: number
  borderRadius?: number
}

export function SkeletonCard({ height = 80, borderRadius = 12 }: SkeletonCardProps) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderRadius,
        height,
      }}
      className="skeleton-pulse"
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ width = '100%', height = 14 }: { width?: string | number; height?: number }) {
  return (
    <div
      style={{
        background: 'var(--border)',
        borderRadius: 4,
        height,
        width,
        display: 'inline-block',
      }}
      className="skeleton-pulse"
      aria-hidden="true"
    />
  )
}

export function DashboardSkeleton() {
  return (
    <div className="animate-fade-in" aria-label="Cargando dashboard..." aria-busy="true">
      {/* Saludo skeleton */}
      <div style={{ marginBottom: 24 }}>
        <SkeletonText width={220} height={28} />
        <div style={{ marginTop: 6 }}>
          <SkeletonText width={140} height={14} />
        </div>
      </div>

      {/* Tip skeleton */}
      <div style={{ marginBottom: 22 }}>
        <SkeletonCard height={52} />
      </div>

      {/* Stats 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 22 }}>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} height={72} />)}
      </div>

      {/* Progreso */}
      <div style={{ marginBottom: 22 }}>
        <SkeletonCard height={80} />
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 22 }}>
        {[1, 2, 3, 4].map(i => <SkeletonCard key={i} height={88} />)}
      </div>
    </div>
  )
}
