import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii } from '../../constants/theme'

export default function EsqueciSenha() {
  const router  = useRouter()
  const insets  = useSafeAreaInsets()

  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro,    setErro]    = useState('')

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function solicitar() {
    if (!emailValido || loading) return
    setLoading(true)
    setErro('')
    try {
      await api.post('/conta/esqueci-senha', { email: email.trim().toLowerCase() })
      setEnviado(true)
    } catch {
      setErro('Não foi possível processar a solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <View style={s.iconSuccess}>
          <Ionicons name="mail-outline" size={32} color="#fff" />
        </View>
        <Text style={s.titulo}>Email enviado</Text>
        <Text style={s.subtitulo}>
          Se <Text style={s.emailDestaque}>{email}</Text> estiver cadastrado, você receberá as instruções em instantes.
        </Text>
        <Text style={s.dica}>Verifique também sua caixa de spam.</Text>
        <TouchableOpacity style={s.btnPrimary} onPress={() => router.back()}>
          <Text style={s.btnPrimaryTexto}>Voltar ao login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[s.content, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>

        <Ionicons name="lock-open-outline" size={36} color={Colors.accent} style={s.icone} />
        <Text style={s.titulo}>Esqueceu a senha?</Text>
        <Text style={s.subtitulo}>
          Digite o email da sua conta e enviaremos um link para você criar uma nova senha.
        </Text>

        <TextInput
          style={[s.input, erro ? s.inputErro : null]}
          placeholder="seu@email.com"
          placeholderTextColor={Colors.textMuted}
          value={email}
          onChangeText={(t) => { setEmail(t); setErro('') }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={solicitar}
        />

        {erro ? <Text style={s.erroTexto}>{erro}</Text> : null}

        <TouchableOpacity
          style={[s.btnPrimary, (!emailValido || loading) && s.btnDisabled]}
          onPress={solicitar}
          disabled={!emailValido || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnPrimaryTexto}>Enviar link de recuperação</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  content:        { flex: 1, paddingHorizontal: Spacing.lg },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.background },
  backBtn:        { marginBottom: Spacing.xl },
  icone:          { marginBottom: Spacing.base },
  titulo:         { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.sm },
  subtitulo:      { fontSize: Typography.size.base, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
  emailDestaque:  { fontWeight: Typography.weight.bold, color: Colors.primary },
  dica:           { fontSize: Typography.size.sm, color: Colors.textMuted, marginBottom: Spacing.xl },
  input:          { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.base, fontSize: Typography.size.base, color: Colors.primary, marginBottom: Spacing.sm },
  inputErro:      { borderColor: Colors.error ?? '#dc2626' },
  erroTexto:      { fontSize: Typography.size.sm, color: Colors.error ?? '#dc2626', marginBottom: Spacing.base },
  btnPrimary:     { backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.base + 2, alignItems: 'center', marginTop: Spacing.sm },
  btnDisabled:    { backgroundColor: '#fed7aa' },
  btnPrimaryTexto:{ color: '#fff', fontSize: Typography.size.base, fontWeight: Typography.weight.bold },
  iconSuccess:    { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.accent, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
})
