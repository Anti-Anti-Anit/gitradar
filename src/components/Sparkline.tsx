import { useId } from 'react'

export function Sparkline({
  data,
  height = 48,
  color = 'var(--brand)',
  showLabels = false,
}: {
  data?: number[]
  height?: number
  color?: string
  showLabels?: boolean
}) {
  const gradientId = useId().replace(/:/g, '')

  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-[11px] text-[var(--faint)]"
        style={{ height }}
      >
        暂无走势
      </div>
    )
  }

  const width = 300
  const pad = 3
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - pad - ((value - min) / span) * (height - pad * 2)
    return [x, y] as const
  })

  const line = points
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(' ')
  const area = `${line} L${width} ${height} L0 ${height} Z`
  const [lastX, lastY] = points[points.length - 1]

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`星标走势：${min} → ${max}`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <circle cx={lastX} cy={lastY} r={2.6} fill={color} stroke="var(--bg)" strokeWidth={1.4} />
      </svg>
      {showLabels ? (
        <div className="mt-1 flex justify-between text-[10.5px] text-[var(--faint)]">
          <span>{min.toLocaleString('en-US')}</span>
          <span>{max.toLocaleString('en-US')}</span>
        </div>
      ) : null}
    </div>
  )
}
