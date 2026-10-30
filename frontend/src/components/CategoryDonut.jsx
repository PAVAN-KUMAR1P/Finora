import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { assignCategoryColors, MORE_LABEL } from '../lib/categoryColors.js'
import { moneyCompact as money } from '../lib/format.js'

function Tip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="card" style={{ padding: '0.5rem 0.75rem', boxShadow: 'var(--shadow-md)' }}>
      <div className="small" style={{ fontWeight: 700 }}>{d.name}</div>
      <div className="small muted">{money(d.value)}</div>
    </div>
  )
}

export default function CategoryDonut({ byCategory, total }) {
  // Fold anything past the 8 validated categorical slots into a neutral "More" bucket
  // instead of inventing a 9th hue (dataviz skill, categorical non-negotiable).
  const colors = assignCategoryColors(byCategory.map((c) => c.category))
  const ranked = byCategory.slice(0, 8)
  const overflow = byCategory.slice(8)
  const slices = [
    ...ranked.map((c) => ({ name: c.category, value: Number(c.total), color: colors.get(c.category).color })),
  ]
  if (overflow.length) {
    slices.push({
      name: MORE_LABEL,
      value: overflow.reduce((s, c) => s + Number(c.total), 0),
      color: '#b4b2a8',
    })
  }

  const sum = slices.reduce((a, x) => a + x.value, 0)

  return (
    <div className="donut-wrap">
      <div style={{ width: 168, height: 168, position: 'relative', flexShrink: 0 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius={56}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              stroke="var(--surface)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((s) => <Cell key={s.name} fill={s.color} />)}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center' }}>
          <div>
            <div className="donut-center-label" style={{ color: 'var(--ink-400)' }}>Total</div>
            <div className="donut-center-value" style={{ color: 'var(--ink-900)', fontSize: '1.05rem' }}>{money(total)}</div>
          </div>
        </div>
      </div>
      <div className="legend-list">
        {slices.map((s) => (
          <div key={s.name} className="legend-row">
            <span className="label">
              <span className="legend-swatch" style={{ background: s.color }} />
              <span className="name">{s.name}</span>
            </span>
            <span className="amount tabular">
              {money(s.value)}{' '}
              <span className="pct">· {sum ? Math.round((s.value / sum) * 100) : 0}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
