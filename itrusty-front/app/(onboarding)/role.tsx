import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'

type Role = 'MOTORISTA' | 'OFICINA'

const OPCOES: { role: Role; titulo: string; descricao: string; icone: keyof typeof Ionicons.glyphMap }[] = [
  {
    role:      'MOTORISTA',
    titulo:    'Sou motorista',
    descricao: 'Quero achar uma oficina de confiança e agendar.',
    icone:     'car-outline',
  },
  {
    role:      'OFICINA',
    titulo:    'Tenho uma oficina',
    descricao: 'Quero gerenciar minha agenda e atender mais clientes.',
    icone:     'construct-outline',
  },
]

export default function Role() {
  const [selecionado, setSelecionado] = useState<Role | null>(null)
  const router  = useRouter()
  const insets  = useSafeAreaInsets()

  function continuar() {
    if (!selecionado) return
    router.push(selecionado === 'MOTORISTA' ? '/(onboarding)/motorista' : '/(onboarding)/oficina')
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg }]}>
      <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />

      <Text style={s.titulo}>
        Você é{'\n'}motorista ou{'\n'}
        <Text style={s.destaque}>oficina</Text>?
      </Text>
      <Text style={s.subtitulo}>Personalizamos o app pra você.</Text>

      <View style={s.opcoes}>
        {OPCOES.map(({ role, titulo, descricao, icone }) => {
          const sel = selecionado === role
          return (
            <TouchableOpacity
              key={role}
              style={[s.card, sel && s.cardSel]}
              onPress={() => setSelecionado(role)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: sel }}
              accessibilityLabel={titulo}
            >
              <View style={[s.icone, sel && s.iconeSel]}>
                <Ionicons name={icone} size={24} color={sel ? Colors.surface : Colors.primary} />
              </View>
              <View style={s.cardTexto}>
                <Text style={[s.cardTitulo, sel && s.cardTituloSel]}>{titulo}</Text>
                <Text style={[s.cardSub, sel && s.cardSubSel]}>{descricao}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={sel ? 'rgba(255,255,255,0.6)' : Colors.textMuted}
              />
            </TouchableOpacity>
          )
        })}
      </View>

      <TouchableOpacity
        style={[s.botao, !selecionado && s.botaoDisabled]}
        onPress={continuar}
        disabled={!selecionado}
        activeOpacity={0.8}
      >
        <Text style={s.botaoTexto}>Continuar</Text>
        <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background, paddingHorizontal: Spacing.lg },
  logo:         { width: 64, height: 48, marginBottom: Spacing.xl },
  titulo:       { fontSize: Typography.size['5xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.xs, lineHeight: Typography.size['5xl'] * 1.15 },
  destaque:     { color: Colors.accent },
  subtitulo:    { fontSize: Typography.size.md, color: Colors.textSecondary, marginBottom: Spacing.xl },
  opcoes:       { gap: Spacing.md, marginBottom: 'auto' as any },
  card:         { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.lg, padding: Spacing.base, gap: Spacing.md, ...Shadows.sm },
  cardSel:      { backgroundColor: Colors.primary, borderColor: Colors.primary, ...Shadows.md },
  icone:        { width: 52, height: 52, borderRadius: Radii.md, backgroundColor: Colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' },
  iconeSel:     { backgroundColor: Colors.accent },
  cardTexto:    { flex: 1 },
  cardTitulo:   { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary, marginBottom: Spacing.xs },
  cardTituloSel:{ color: Colors.surface },
  cardSub:      { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: Typography.size.sm * 1.5 },
  cardSubSel:   { color: 'rgba(255,255,255,0.65)' },
  botao:        { flexDirection: 'row', backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.base + 2, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.xl, ...Shadows.sm },
  botaoDisabled:{ opacity: 0.4 },
  botaoTexto:   { color: Colors.surface, fontWeight: Typography.weight.bold, fontSize: Typography.size.base },
})
