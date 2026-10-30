// Minimal inline stroke-icon set — single consistent style (round caps/joins, 1.8 stroke).
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
const Svg = ({ children, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>{children}</svg>
)

export const GridIcon = (p) => <Svg {...p}><rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" /><rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" /></Svg>
export const ReceiptIcon = (p) => <Svg {...p}><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" /><path d="M9 8h6M9 12h6" /></Svg>
export const PieIcon = (p) => <Svg {...p}><path d="M12 2a10 10 0 1 0 10 10H12V2Z" /><path d="M14 2.5A10 10 0 0 1 21.5 10H14V2.5Z" /></Svg>
export const TrendIcon = (p) => <Svg {...p}><path d="m3 17 6-6 4 4 8-8" /><path d="M17 7h4v4" /></Svg>
export const LandmarkIcon = (p) => <Svg {...p}><path d="M3 10h18M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18M12 2 3 7h18L12 2Z" /></Svg>
export const BarChartIcon = (p) => <Svg {...p}><path d="M4 20V10M12 20V4M20 20v-7" /><path d="M2 20h20" /></Svg>
export const MenuIcon = (p) => <Svg {...p}><path d="M3 6h18M3 12h18M3 18h18" /></Svg>
export const ChevronDownIcon = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
export const LogoutIcon = (p) => <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5M21 12H9" /></Svg>
export const PlusIcon = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
export const InboxIcon = (p) => <Svg {...p} size={24}><path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" /></Svg>
export const WalletIcon = (p) => <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2h2a1 1 0 0 1 1 1v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" /><path d="M16 13h.01" /></Svg>
export const TagIcon = (p) => <Svg {...p}><path d="M12.59 2.59 3 12.17V21h8.83l9.58-9.59a2 2 0 0 0 0-2.82l-6-6a2 2 0 0 0-2.82 0Z" /><path d="M7 7h.01" /></Svg>
export const ArrowUpIcon = (p) => <Svg {...p} size={13}><path d="M12 19V5M5 12l7-7 7 7" /></Svg>
export const ArrowDownIcon = (p) => <Svg {...p} size={13}><path d="M12 5v14M19 12l-7 7-7-7" /></Svg>
export const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>
export const GaugeIcon = (p) => <Svg {...p}><path d="M12 14l4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /></Svg>
export const CalendarIcon = (p) => <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>
export const AlertIcon = (p) => <Svg {...p}><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></Svg>
