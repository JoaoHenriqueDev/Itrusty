import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { supabase } from '../../services/supabase'
import { Colors, Spacing, Typography, Radii } from '../../constants/theme'
import { Input } from '../../components/ui/Input'
import { SocialButton } from '../../components/ui/SocialButton'

WebBrowser.maybeCompleteAuthSession()

type LoginResponse = {
  accessToken:  string
  refreshToken: string
  user: { id: string; name: string; role: 'MOTORISTA' | 'OFICINA' | null }
}

type Erros = { email?: string; senha?: string; api?: string }

export default function Login() {
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [loadingGoogle,setLoadingGoogle]= useState(false)
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [erros,        setErros]        = useState<Erros>({})
  const { signIn } = useAuth()
  const router     = useRouter()
  const insets     = useSafeAreaInsets()

  function limparErro(campo: keyof Erros) {
    setErros(e => ({ ...e, [campo]: undefined }))
  }

  async function handleLogin() {
    const novosErros: Erros = {}
    if (!email) novosErros.email = 'Preencha o e-mail'
    if (!senha) novosErros.senha = 'Preencha a senha'
    if (Object.keys(novosErros).length) { setErros(novosErros); return }

    setLoading(true)
    setErros({})
    try {
      const res = await api.post<LoginResponse>('/auth/login', { email, password: senha })
      await signIn(res.accessToken, res.user, res.refreshToken)
    } catch (err: any) {
      setErros({ api: err.message ?? 'E-mail ou senha incorretos' })
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoadingGoogle(true)
    try {
      if (Platform.OS === 'web') {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URL ?? 'http://localhost:8081' },
        })
      } else {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { skipBrowserRedirect: true, redirectTo: 'itrusty://' },
        })
        if (error || !data.url) return
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'itrusty://')
        if (result.type === 'success' && result.url) {
          const fragment = result.url.split('#')[1] ?? result.url.split('?')[1] ?? ''
          const params   = new URLSearchParams(fragment)
          const at       = params.get('access_token')
          const rt       = params.get('refresh_token')
          if (at && rt) {
            await supabase.auth.setSession({ access_token: at, refresh_token: rt })
          }
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const res = await api.post<LoginResponse>('/auth/social', { supabaseToken: session.access_token })
            await signIn(res.accessToken, res.user, res.refreshToken)
          }
        }
      }
    } catch (err: any) {
      setErros({ api: err.message ?? 'Falha no login com Google' })
    } finally {
      setLoadingGoogle(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />

        <Text style={s.titulo}>Bom te ver{'\n'}de novo.</Text>
        <Text style={s.subtitulo}>Entra e agenda seu próximo serviço em 2 toques.</Text>

        <View style={s.form}>
          <Input
            placeholder="seu@email.com"
            value={email}
            onChangeText={t => { setEmail(t); limparErro('email') }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={erros.email}
            returnKeyType="next"
          />

          <Input
            placeholder="Senha"
            value={senha}
            onChangeText={t => { setSenha(t); limparErro('senha') }}
            secureTextEntry={!senhaVisivel}
            error={erros.senha}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            suffix={
              <Ionicons
                name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textMuted}
              />
            }
            onSuffixPress={() => setSenhaVisivel(v => !v)}
          />
        </View>

        <TouchableOpacity style={s.esqueci} hitSlop={8} onPress={() => router.push('/(auth)/esqueci-senha')}>
          <Text style={s.esqueciTexto}>Esqueci a minha senha</Text>
        </TouchableOpacity>

        {erros.api ? <Text style={s.erroApi}>{erros.api}</Text> : null}

        <TouchableOpacity
          style={[s.botao, loading && s.botaoDisabled]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.surface} />
            : <Text style={s.botaoTexto}>Entrar</Text>}
        </TouchableOpacity>

        <View style={s.divisor}>
          <View style={s.linha} />
          <Text style={s.divisorTexto}>ou continue com</Text>
          <View style={s.linha} />
        </View>

        <View style={s.socialRow}>
          <SocialButton provider="google" onPress={handleGoogle} loading={loadingGoogle} />
          <SocialButton provider="apple" onPress={() => {}} />
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/cadastro')} hitSlop={8}>
          <Text style={s.linkTexto}>
            Novo por aqui?{'  '}
            <Text style={s.linkDestaque}>Criar conta</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scroll:       { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['4xl'] },
  logo:         { width: 72, height: 54, marginBottom: Spacing.xl },
  titulo:       { fontSize: Typography.size['5xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.sm, lineHeight: Typography.size['5xl'] * 1.15 },
  subtitulo:    { fontSize: Typography.size.md, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: Typography.size.md * 1.6 },
  form:         { marginBottom: Spacing.xs },
  esqueci:      { alignSelf: 'flex-end', marginBottom: Spacing.xl },
  esqueciTexto: { fontSize: Typography.size.sm, color: Colors.textMuted },
  erroApi:      { fontSize: Typography.size.sm, color: Colors.error, textAlign: 'center', marginBottom: Spacing.base, backgroundColor: Colors.errorLight, padding: Spacing.sm, borderRadius: Radii.sm },
  botao:        { backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.base + 2, alignItems: 'center', marginBottom: Spacing.xl },
  botaoDisabled:{ opacity: 0.6 },
  botaoTexto:   { color: Colors.surface, fontWeight: Typography.weight.bold, fontSize: Typography.size.base, letterSpacing: 0.3 },
  divisor:      { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base },
  linha:        { flex: 1, height: 1, backgroundColor: Colors.border },
  divisorTexto: { fontSize: Typography.size.xs, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  socialRow:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  linkTexto:    { textAlign: 'center', fontSize: Typography.size.md, color: Colors.textSecondary },
  linkDestaque: { color: Colors.accent, fontWeight: Typography.weight.semibold },
})
