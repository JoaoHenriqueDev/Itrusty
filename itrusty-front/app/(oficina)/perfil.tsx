import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'
import { AppHeader } from '../../components/ui/AppHeader'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { NotificacaoBanner } from '../../components/NotificacaoBanner'

type PerfilData = {
  nome:     string
  fotoUrl:  string | null
  telefone: string | null
  rua:      string | null
  numero:   string | null
  bairro:   string | null
  cidade:   string | null
  estado:   string | null
  horarios: { dia: string; abertura: string; fechamento: string; aberto: boolean }[]
}

// ─── Item de menu reutilizável ───────────────────────────────────────────────
interface MenuItemProps {
  icone:   keyof typeof Ionicons.glyphMap
  label:   string
  onPress: () => void
  cor?:    string
  badge?:  string
}

function MenuItem({ icone, label, onPress, cor, badge }: MenuItemProps) {
  const textColor = cor ?? Colors.text
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.65}>
      <View style={[s.menuIconBox, cor && { backgroundColor: `${cor}15` }]}>
        <Ionicons name={icone} size={20} color={cor ?? Colors.textSecondary} />
      </View>
      <Text style={[s.menuLabel, { color: textColor }]}>{label}</Text>
      {badge ? (
        <View style={s.badge}><Text style={s.badgeTexto}>{badge}</Text></View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      )}
    </TouchableOpacity>
  )
}

function Secao({ titulo }: { titulo: string }) {
  return <Text style={s.secaoTitulo}>{titulo}</Text>
}

function Divider() {
  return <View style={s.divider} />
}

// ─── Tela principal ──────────────────────────────────────────────────────────
export default function PerfilOficina() {
  const { user, signOut } = useAuth()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { notificacoes, naoLidas, marcarLida } = useNotificacoes()
  const [dados, setDados] = useState<PerfilData | null>(null)

  useFocusEffect(useCallback(() => {
    api.get<PerfilData>('/oficina/perfil').then(setDados).catch(() => {})
  }, []))

  const primeiraNotif = notificacoes[0]
  const endereco = dados
    ? [dados.rua, dados.numero, dados.bairro, dados.cidade].filter(Boolean).join(', ')
    : ''

  function navegar(path: string) {
    router.push(path as any)
  }

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        titulo={`Olá, ${user?.name?.split(' ')[0] ?? ''}`}
        subtitulo={dados?.cidade ?? undefined}
        naoLidas={naoLidas}
      />

      {primeiraNotif && (
        <NotificacaoBanner
          titulo={primeiraNotif.titulo}
          corpo={primeiraNotif.corpo}
          onDismiss={() => marcarLida(primeiraNotif.id)}
        />
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* ── Card da oficina ── */}
        <TouchableOpacity
          style={s.profileCard}
          onPress={() => navegar('/(oficina)/conta')}
          activeOpacity={0.8}
        >
          <View style={s.fotoBanner}>
            {dados?.fotoUrl
              ? <Image source={{ uri: dados.fotoUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
              : <Ionicons name="business-outline" size={32} color="rgba(255,255,255,0.3)" />}
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileNome} numberOfLines={1}>{dados?.nome ?? user?.name}</Text>
            {!!endereco && <Text style={s.profileEndereco} numberOfLines={1}>{endereco}</Text>}
            {dados?.telefone && (
              <Text style={s.profileTelefone}>{dados.telefone}</Text>
            )}
          </View>
          <View style={s.editarBtn}>
            <Ionicons name="create-outline" size={17} color={Colors.surface} />
          </View>
        </TouchableOpacity>

        {/* ── Minha conta ── */}
        <Secao titulo="MINHA CONTA" />
        <View style={s.menuCard}>
          <MenuItem
            icone="person-outline"
            label="Editar perfil pessoal"
            onPress={() => navegar('/(oficina)/editar-perfil')}
          />
        </View>

        {/* ── Minha oficina ── */}
        <Secao titulo="MINHA OFICINA" />
        <View style={s.menuCard}>
          <MenuItem
            icone="storefront-outline"
            label="Dados da oficina"
            onPress={() => navegar('/(oficina)/conta')}
          />
          <Divider />
          <MenuItem
            icone="star-outline"
            label="Avaliações"
            onPress={() => navegar('/(oficina)/avaliacoes')}
          />
          <Divider />
          <MenuItem
            icone="time-outline"
            label="Horários de funcionamento"
            onPress={() => navegar('/(oficina)/conta')}
          />
          <Divider />
          <MenuItem
            icone="construct-outline"
            label="Gerenciar serviços"
            onPress={() => navegar('/(oficina)/servicos')}
          />
        </View>

        {/* ── Suporte ── */}
        <Secao titulo="SUPORTE" />
        <View style={s.menuCard}>
          <MenuItem
            icone="help-circle-outline"
            label="Central de ajuda"
            onPress={() => navegar('/(oficina)/ajuda')}
          />
          <Divider />
          <MenuItem
            icone="information-circle-outline"
            label="Sobre o iTrusty"
            onPress={() => navegar('/(oficina)/sobre')}
          />
          <Divider />
          <MenuItem
            icone="document-text-outline"
            label="Termos de uso"
            onPress={() => navegar('/(oficina)/termos')}
          />
          <Divider />
          <MenuItem
            icone="shield-checkmark-outline"
            label="Política de privacidade"
            onPress={() => navegar('/(oficina)/privacidade')}
          />
        </View>

        {/* ── Conta ── */}
        <Secao titulo="CONTA" />
        <View style={s.menuCard}>
          <MenuItem
            icone="log-out-outline"
            label="Sair"
            onPress={signOut}
            cor={Colors.error}
          />
        </View>

        <Text style={s.versao}>iTrusty v1.0.0</Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  scroll:         { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },

  // Profile card
  profileCard:    { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.xl, marginTop: Spacing.sm, ...Shadows.sm },
  fotoBanner:     { height: 100, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  profileInfo:    { padding: Spacing.base, paddingBottom: Spacing.sm },
  profileNome:    { fontSize: Typography.size.lg, fontWeight: Typography.weight.extrabold, color: Colors.text },
  profileEndereco:{ fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 3 },
  profileTelefone:{ fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 2 },
  editarBtn:      { position: 'absolute', top: Spacing.sm, right: Spacing.sm, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },

  // Seções
  secaoTitulo:    { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.xs },

  // Menu
  menuCard:       { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.base },
  menuItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md },
  menuIconBox:    { width: 36, height: 36, borderRadius: Radii.sm, backgroundColor: Colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' },
  menuLabel:      { flex: 1, fontSize: Typography.size.md, color: Colors.text },
  divider:        { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.base + 36 + Spacing.md },

  // Badge
  badge:          { backgroundColor: Colors.accentLight, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  badgeTexto:     { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.accent },

  // Rodapé
  versao:         { textAlign: 'center', fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: Spacing.xl },
})
