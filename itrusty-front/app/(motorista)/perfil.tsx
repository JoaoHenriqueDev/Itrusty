import { useCallback, useState } from 'react'
import { useFocusEffect, useRouter } from 'expo-router'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'

type MotoristaData = {
  veiculos: { id: string; marca: string; modelo: string; ano: number; placa: string }[]
}

interface MenuItemProps {
  icone:   keyof typeof Ionicons.glyphMap
  label:   string
  onPress: () => void
  cor?:    string
  badge?:  number
}

function MenuItem({ icone, label, onPress, cor, badge }: MenuItemProps) {
  return (
    <TouchableOpacity style={s.menuItem} onPress={onPress} activeOpacity={0.65}>
      <View style={[s.menuIconBox, cor && { backgroundColor: `${cor}15` }]}>
        <Ionicons name={icone} size={20} color={cor ?? Colors.textSecondary} />
      </View>
      <Text style={[s.menuLabel, cor && { color: cor }]}>{label}</Text>
      {badge ? (
        <View style={s.badgeWrap}><Text style={s.badgeTexto}>{badge}</Text></View>
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

export default function PerfilMotorista() {
  const { user, signOut } = useAuth()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { naoLidas } = useNotificacoes()
  const [veiculos, setVeiculos] = useState<MotoristaData['veiculos']>([])

  useFocusEffect(useCallback(() => {
    api.get<{ veiculos: MotoristaData['veiculos'] }>('/motorista/veiculos')
      .then(res => setVeiculos(res.veiculos ?? []))
      .catch(() => {})
  }, []))

  const inicial   = user?.name?.charAt(0).toUpperCase() ?? '?'
  const primeiroVeiculo = veiculos[0]

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + Spacing.base }]}
      >
        {/* ── Card do motorista ── */}
        <View style={s.profileCard}>
          <View style={s.avatarWrap}>
            <View style={s.avatar}>
              <Text style={s.avatarLetra}>{inicial}</Text>
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileNome} numberOfLines={1}>{user?.name}</Text>
              <Text style={s.profileTipo}>Motorista</Text>
              {primeiroVeiculo && (
                <Text style={s.profileVeiculo} numberOfLines={1}>
                  {primeiroVeiculo.marca} {primeiroVeiculo.modelo} · {primeiroVeiculo.placa}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* ── Minha conta ── */}
        <Secao titulo="MINHA CONTA" />
        <View style={s.menuCard}>
          <MenuItem
            icone="person-outline"
            label="Editar perfil"
            onPress={() => router.push('/(motorista)/editar-perfil')}
          />
          <Divider />
          <MenuItem
            icone="car-outline"
            label={`Meus veículos${veiculos.length ? ` (${veiculos.length})` : ''}`}
            onPress={() => router.push('/(motorista)/meus-veiculos')}
          />
        </View>

        {/* ── Atividade ── */}
        <Secao titulo="ATIVIDADE" />
        <View style={s.menuCard}>
          <MenuItem
            icone="notifications-outline"
            label="Notificações"
            onPress={() => router.push('/(motorista)/notificacoes')}
            badge={naoLidas || undefined}
          />
          <Divider />
          <MenuItem
            icone="calendar-outline"
            label="Meus agendamentos"
            onPress={() => router.push('/(motorista)/agendamentos')}
          />
        </View>

        {/* ── Suporte ── */}
        <Secao titulo="SUPORTE" />
        <View style={s.menuCard}>
          <MenuItem
            icone="help-circle-outline"
            label="Central de ajuda"
            onPress={() => router.push('/(oficina)/ajuda' as any)}
          />
          <Divider />
          <MenuItem
            icone="information-circle-outline"
            label="Sobre o iTrusty"
            onPress={() => router.push('/(oficina)/sobre' as any)}
          />
          <Divider />
          <MenuItem
            icone="document-text-outline"
            label="Termos de uso"
            onPress={() => router.push('/(oficina)/termos' as any)}
          />
          <Divider />
          <MenuItem
            icone="shield-checkmark-outline"
            label="Política de privacidade"
            onPress={() => router.push('/(oficina)/privacidade' as any)}
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
  profileCard:    { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.xl, ...Shadows.sm },
  avatarWrap:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  avatar:         { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarLetra:    { fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold, color: Colors.surface },
  profileInfo:    { flex: 1, gap: 3 },
  profileNome:    { fontSize: Typography.size.lg, fontWeight: Typography.weight.extrabold, color: Colors.text },
  profileTipo:    { fontSize: Typography.size.sm, color: Colors.textMuted },
  profileVeiculo: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  secaoTitulo:    { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm, marginTop: Spacing.xs },
  menuCard:       { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.base },
  menuItem:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, gap: Spacing.md },
  menuIconBox:    { width: 36, height: 36, borderRadius: Radii.sm, backgroundColor: Colors.surfaceMuted, justifyContent: 'center', alignItems: 'center' },
  menuLabel:      { flex: 1, fontSize: Typography.size.md, color: Colors.text },
  divider:        { height: 1, backgroundColor: Colors.borderLight, marginLeft: Spacing.base + 36 + Spacing.md },
  badgeWrap:      { backgroundColor: Colors.error, borderRadius: Radii.full, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5 },
  badgeTexto:     { fontSize: 11, fontWeight: Typography.weight.bold, color: Colors.surface },
  versao:         { textAlign: 'center', fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: Spacing.xl },
})
