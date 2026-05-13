import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'

const VERSAO = '1.0.0'
const ANO    = new Date().getFullYear()

type Link = { icone: keyof typeof Ionicons.glyphMap; label: string; url: string }

const LINKS: Link[] = [
  { icone: 'globe-outline',    label: 'Site oficial',   url: 'https://itrusty.com.br' },
  { icone: 'logo-instagram',   label: 'Instagram',      url: 'https://instagram.com/itrusty' },
  { icone: 'mail-outline',     label: 'contato@itrusty.com.br', url: 'mailto:contato@itrusty.com.br' },
]

export default function SobreOficina() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={s.voltarBtn} onPress={() => router.navigate('/(oficina)/perfil' as any)}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Sobre o iTrusty</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Branding */}
        <View style={s.brandCard}>
          <View style={s.logoContainer}>
            <Ionicons name="shield-checkmark" size={40} color={Colors.surface} />
          </View>
          <Text style={s.appNome}>iTrusty</Text>
          <View style={s.versaoBadge}>
            <Text style={s.versaoTexto}>Versão {VERSAO}</Text>
          </View>
        </View>

        {/* Missão */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="flag-outline" size={18} color={Colors.accent} />
            <Text style={s.cardTitulo}>Nossa missão</Text>
          </View>
          <Text style={s.cardTexto}>
            O iTrusty conecta motoristas a oficinas mecânicas de confiança, tornando o processo de
            agendamento de serviços automotivos mais simples, transparente e seguro para todos.
          </Text>
        </View>

        {/* O que fazemos */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="sparkles-outline" size={18} color={Colors.accent} />
            <Text style={s.cardTitulo}>O que fazemos</Text>
          </View>
          {[
            { icone: 'calendar-outline' as const,         texto: 'Agendamento online simplificado' },
            { icone: 'shield-checkmark-outline' as const, texto: 'Oficinas verificadas e avaliadas' },
            { icone: 'notifications-outline' as const,    texto: 'Notificações em tempo real' },
            { icone: 'star-outline' as const,             texto: 'Sistema de avaliações transparente' },
          ].map(({ icone, texto }) => (
            <View key={texto} style={s.feature}>
              <View style={s.featureIcone}>
                <Ionicons name={icone} size={16} color={Colors.accent} />
              </View>
              <Text style={s.featureTexto}>{texto}</Text>
            </View>
          ))}
        </View>

        {/* Links */}
        <Text style={s.secaoLabel}>CONTATO E REDES</Text>
        <View style={s.menuCard}>
          {LINKS.map(({ icone, label, url }, idx) => (
            <View key={url}>
              {idx > 0 && <View style={s.divider} />}
              <TouchableOpacity
                style={s.menuItem}
                onPress={() => Linking.openURL(url)}
                activeOpacity={0.65}
              >
                <View style={s.menuIconBox}>
                  <Ionicons name={icone} size={18} color={Colors.textSecondary} />
                </View>
                <Text style={s.menuLabel}>{label}</Text>
                <Ionicons name="open-outline" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Avaliação */}
        <TouchableOpacity style={s.avaliarBtn} activeOpacity={0.8}>
          <Ionicons name="star" size={18} color={Colors.surface} />
          <Text style={s.avaliarTexto}>Avaliar o app</Text>
        </TouchableOpacity>

        {/* Rodapé */}
        <View style={s.rodape}>
          <Text style={s.rodapeTexto}>Feito com ♥ no Brasil</Text>
          <Text style={s.rodapeTexto}>© {ANO} iTrusty. Todos os direitos reservados.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.background },
  voltarBtn:      { width: 40, height: 40, borderRadius: Radii.sm, justifyContent: 'center', alignItems: 'center' },
  headerTitulo:   { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.text },
  scroll:         { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },

  brandCard:      { alignItems: 'center', paddingVertical: Spacing.xl, marginBottom: Spacing.xl },
  logoContainer:  { width: 80, height: 80, borderRadius: Radii.xl, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.base, ...Shadows.md },
  appNome:        { fontSize: Typography.size['3xl'], fontWeight: Typography.weight.extrabold, color: Colors.text, marginBottom: Spacing.sm },
  versaoBadge:    { backgroundColor: Colors.surfaceMuted, borderRadius: Radii.full, paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs },
  versaoTexto:    { fontSize: Typography.size.sm, color: Colors.textMuted, fontWeight: Typography.weight.medium },

  card:           { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.base },
  cardTitulo:     { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.text },
  cardTexto:      { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 22 },

  feature:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  featureIcone:   { width: 32, height: 32, borderRadius: Radii.sm, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  featureTexto:   { fontSize: Typography.size.sm, color: Colors.text, fontWeight: Typography.weight.medium },

  secaoLabel:     { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  menuCard:       { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.base, ...Shadows.sm },
  divider:        { height: 1, backgroundColor: Colors.borderLight },
  menuItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.base, gap: Spacing.md },
  menuIconBox:    { width: 36, height: 36, borderRadius: Radii.sm, backgroundColor: Colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' },
  menuLabel:      { flex: 1, fontSize: Typography.size.md, color: Colors.text },

  avaliarBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, borderRadius: Radii.full, paddingVertical: Spacing.md, marginBottom: Spacing.xl, ...Shadows.sm },
  avaliarTexto:   { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.surface },

  rodape:         { alignItems: 'center', gap: Spacing.xs, paddingTop: Spacing.md },
  rodapeTexto:    { fontSize: Typography.size.xs, color: Colors.textMuted },
})
