// ─── Paleta ──────────────────────────────────────────────────────────────────
// Referência: Uber / 99 / iFood — fundo neutro frio, superfícies brancas,
// hierarquia clara por contraste (não por cor de fundo)
export const Colors = {
  // Brand
  primary:     '#111827',   // quase preto — mais legível e moderno que navy escuro
  accent:      '#F97316',   // laranja vibrante, próximo ao 99 e iFood

  // Derivados do accent
  accentLight: '#FFF7ED',
  accentDark:  '#EA6C0A',

  // Superfícies — padrão Uber/99/iFood
  background:  '#F8F9FA',   // cinza neutro frio, sem tonalidade quente
  surface:     '#FFFFFF',   // branco puro para cards e inputs
  surfaceMuted:'#F1F3F5',   // hover states, seções secundárias

  // Texto — contraste AAA em fundo branco
  text:          '#111827', // preto quase puro
  textSecondary: '#374151', // cinza escuro
  textMuted:     '#9CA3AF', // cinza médio para labels

  // Estados semânticos
  success:     '#16A34A',
  successLight:'#F0FDF4',
  warning:     '#F59E0B',
  error:       '#EF4444',
  errorLight:  '#FFF5F5',

  // UI chrome
  border:      '#E5E7EB',   // bordas padrão
  borderLight: '#F3F4F6',   // separadores sutis
  overlay:     'rgba(17,24,39,0.55)',

  // Aliases para compatibilidade com código antigo
  white:       '#FFFFFF',
  gray:        '#9CA3AF',
  lightGray:   '#E5E7EB',
  textLight:   '#6B7280',
} as const

// ─── Espaçamento (base 4px) ───────────────────────────────────────────────────
export const Spacing = {
  xxs:  2,
  xs:   4,
  sm:   8,
  md:  12,
  base:16,
  lg:  20,
  xl:  24,
  xxl: 32,
  '3xl':40,
  '4xl':48,
  '5xl':64,
} as const

// ─── Tipografia ───────────────────────────────────────────────────────────────
export const Typography = {
  size: {
    xs:  11,
    sm:  13,
    md:  15,
    base:16,
    lg:  18,
    xl:  20,
    '2xl':24,
    '3xl':28,
    '4xl':32,
    '5xl':36,
  },
  weight: {
    regular: '400' as const,
    medium:  '500' as const,
    semibold:'600' as const,
    bold:    '700' as const,
    extrabold:'800' as const,
  },
  leading: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.8,
  },
} as const

// ─── Bordas ───────────────────────────────────────────────────────────────────
export const Radii = {
  xs:   4,
  sm:   8,
  md:  12,
  lg:  16,
  xl:  20,
  full:9999,
} as const

// ─── Sombras ─────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor:   '#111827',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  2,
    elevation:     2,
  },
  md: {
    shadowColor:   '#111827',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  8,
    elevation:     4,
  },
  lg: {
    shadowColor:   '#111827',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius:  16,
    elevation:     8,
  },
} as const
