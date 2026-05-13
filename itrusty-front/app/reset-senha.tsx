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
  ScrollView,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../services/api'
import { useAppAlert } from '../components/ui/AppAlert'

const ORANGE = '#f97316'
const DARK = '#0f172a'
const BORDER = '#e2e8f0'
const BG = '#f8fafc'
const ERROR = '#dc2626'

export default function ResetSenha() {
  const { token } = useLocalSearchParams<{ token?: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { alert } = useAppAlert()
  const [loading, setLoading]           = useState(false)
  const [sucesso, setSucesso]           = useState(false)

  const senhaValida = password.length >= 8
  const confirmOk   = password === confirmPassword
  const podeEnviar  = token && senhaValida && confirmOk && !loading

  async function confirmar() {
    if (!podeEnviar) return
    setLoading(true)
    try {
      await api.post('/conta/redefinir-senha', { token, password })
      setSucesso(true)
    } catch (err: any) {
      alert(
        'Erro',
        err.message === 'Link inválido ou expirado. Solicite um novo.'
          ? 'Este link expirou ou já foi utilizado. Solicite um novo no aplicativo.'
          : 'Não foi possível redefinir a senha. Tente novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <Ionicons name="alert-circle-outline" size={48} color={ERROR} />
        <Text style={s.erroTitulo}>Link inválido</Text>
        <Text style={s.erroTexto}>Este link não é válido. Solicite um novo pelo aplicativo.</Text>
        <TouchableOpacity style={s.btnVoltar} onPress={() => router.replace('/(auth)/login')}>
          <Text style={s.btnVoltarTexto}>Ir para o login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (sucesso) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <View style={s.successIcon}>
          <Ionicons name="checkmark" size={40} color="#fff" />
        </View>
        <Text style={s.successTitulo}>Senha redefinida!</Text>
        <Text style={s.successTexto}>
          Sua senha foi alterada com sucesso. Todas as sessões foram encerradas por segurança.
        </Text>
        <TouchableOpacity style={s.btnPrimary} onPress={() => router.replace('/(auth)/login')}>
          <Text style={s.btnPrimaryTexto}>Fazer login</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Ionicons name="lock-closed-outline" size={40} color={ORANGE} style={s.icone} />
        <Text style={s.titulo}>Nova senha</Text>
        <Text style={s.subtitulo}>Digite e confirme sua nova senha. Mínimo de 8 caracteres.</Text>

        <View style={s.inputWrapper}>
          <TextInput
            style={s.input}
            placeholder="Nova senha"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            returnKeyType="next"
          />
          <TouchableOpacity style={s.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {password.length > 0 && !senhaValida && (
          <Text style={s.hint}>A senha deve ter pelo menos 8 caracteres</Text>
        )}

        <View style={s.inputWrapper}>
          <TextInput
            style={s.input}
            placeholder="Confirmar nova senha"
            placeholderTextColor="#94a3b8"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={setConfirm}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={confirmar}
          />
        </View>

        {confirmPassword.length > 0 && !confirmOk && (
          <Text style={s.hint}>As senhas não coincidem</Text>
        )}

        <TouchableOpacity
          style={[s.btnPrimary, !podeEnviar && s.btnDisabled]}
          onPress={confirmar}
          disabled={!podeEnviar}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnPrimaryTexto}>Redefinir senha</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={s.linkVoltar}>
          <Text style={s.linkVoltarTexto}>Voltar para o login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  scroll:         { flexGrow: 1, padding: 28, backgroundColor: BG },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: BG },
  icone:          { marginBottom: 16, alignSelf: 'center' },
  titulo:         { fontSize: 26, fontWeight: '800', color: DARK, textAlign: 'center', marginBottom: 8 },
  subtitulo:      { fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 28, lineHeight: 22 },
  inputWrapper:   { backgroundColor: '#fff', borderWidth: 1.5, borderColor: BORDER, borderRadius: 10, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  input:          { flex: 1, padding: 16, fontSize: 15, color: DARK },
  eyeBtn:         { padding: 14 },
  hint:           { fontSize: 12, color: ERROR, marginBottom: 8, marginTop: -6 },
  btnPrimary:     { backgroundColor: ORANGE, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 },
  btnDisabled:    { backgroundColor: '#fed7aa' },
  btnPrimaryTexto:{ color: '#fff', fontSize: 16, fontWeight: '700' },
  linkVoltar:     { marginTop: 20, alignItems: 'center' },
  linkVoltarTexto:{ fontSize: 14, color: '#64748b' },
  erroTitulo:     { fontSize: 20, fontWeight: '700', color: DARK, marginTop: 16, marginBottom: 8 },
  erroTexto:      { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  btnVoltar:      { backgroundColor: ORANGE, borderRadius: 10, paddingHorizontal: 32, paddingVertical: 14 },
  btnVoltarTexto: { color: '#fff', fontWeight: '700', fontSize: 15 },
  successIcon:    { width: 72, height: 72, borderRadius: 36, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successTitulo:  { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 12 },
  successTexto:   { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 20, marginBottom: 28, paddingHorizontal: 8 },
})
