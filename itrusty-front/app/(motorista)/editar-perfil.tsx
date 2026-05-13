import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import { Colors, Spacing, Typography, Radii } from '../../constants/theme'
import { useAppAlert } from '../../components/ui/AppAlert'

type PerfilData = { id: string; name: string; email: string; phone: string | null; role: string | null }

export default function EditarPerfilMotorista() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()
  const { user, updateUser } = useAuth()
  const { alert } = useAppAlert()

  const [loading,  setLoading]  = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [phone,    setPhone]    = useState('')

  useEffect(() => {
    api.get<PerfilData>('/usuario/perfil')
      .then(res => {
        setName(res.name ?? '')
        setEmail(res.email ?? '')
        setPhone(res.phone ?? '')
      })
      .catch(() => alert('Erro', 'Não foi possível carregar seus dados.'))
      .finally(() => setLoading(false))
  }, [])

  async function salvar() {
    if (!name.trim()) { alert('Atenção', 'O nome não pode estar vazio.'); return }
    setSalvando(true)
    try {
      const res = await api.patch<{ user: PerfilData }>('/usuario/perfil', {
        name:  name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
      })
      updateUser({ id: res.user.id, name: res.user.name, role: user?.role ?? null })
      alert('Salvo!', 'Seus dados foram atualizados.', () => router.navigate('/(motorista)/perfil' as any))
    } catch (err: any) {
      alert('Erro', err.message ?? 'Não foi possível salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return <View style={s.centralize}><ActivityIndicator size="large" color={Colors.accent} /></View>
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.navigate('/(motorista)/perfil' as any)} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={s.headerTitulo}>Editar perfil</Text>
          <View style={{ width: 22 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Text style={s.label}>Nome completo</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Seu nome"
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="words"
          />

          <Text style={s.label}>E-mail</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seu@email.com"
            placeholderTextColor={Colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={s.label}>Celular <Text style={s.opcional}>(opcional)</Text></Text>
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="11912345678"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            maxLength={15}
          />
        </ScrollView>

        <View style={[s.rodape, { paddingBottom: Math.max(insets.bottom, Spacing.base) }]}>
          <TouchableOpacity style={s.voltarBtn} onPress={() => router.navigate('/(motorista)/perfil' as any)}>
            <Text style={s.voltarTexto}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.salvarBtn, salvando && { opacity: 0.6 }]} onPress={salvar} disabled={salvando}>
            {salvando
              ? <ActivityIndicator size="small" color={Colors.surface} />
              : <><Ionicons name="checkmark" size={18} color={Colors.surface} /><Text style={s.salvarTexto}>Salvar</Text></>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  centralize:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitulo:{ fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary, flex: 1, textAlign: 'center' },
  scroll:      { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  label:       { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textSecondary, marginBottom: Spacing.xs, marginTop: Spacing.base },
  opcional:    { fontWeight: Typography.weight.regular, color: Colors.textMuted },
  input:       { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.base, fontSize: Typography.size.md, color: Colors.text },
  rodape:      { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  voltarBtn:   { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.full, paddingVertical: Spacing.md, alignItems: 'center' },
  voltarTexto: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text },
  salvarBtn:   { flex: 2, flexDirection: 'row', backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.md, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  salvarTexto: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.surface },
})
