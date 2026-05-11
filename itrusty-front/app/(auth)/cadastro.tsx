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
import { formatCelular } from '../../utils/formatters'

WebBrowser.maybeCompleteAuthSession()

type AuthResponse = {
  accessToken:  string
  refreshToken: string
  user: { id: string; name: string; role: 'MOTORISTA' | 'OFICINA' | null }
}

type Erros = { nome?: string; email?: string; senha?: string; termos?: string; api?: string }

export default function Cadastro() {
  const [nome,         setNome]         = useState('')
  const [email,        setEmail]        = useState('')
  const [celular,      setCelular]      = useState('')
  const [senha,        setSenha]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [loadingGoogle,setLoadingGoogle]= useState(false)
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [termos,       setTermos]       = useState(false)
  const [erros,        setErros]        = useState<Erros>({})
  const { signIn } = useAuth()
  const router     = useRouter()
  const insets     = useSafeAreaInsets()

  function limparErro(campo: keyof Erros) {
    setErros(e => ({ ...e, [campo]: undefined }))
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
        if (result.type === 'success') {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const res = await api.post<AuthResponse>('/auth/social', { supabaseToken: session.access_token })
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

  async function handleCadastro() {
    const novosErros: Erros = {}
    if (!nome)   novosErros.nome   = 'Preencha o nome'
    if (!email)  novosErros.email  = 'Preencha o e-mail'
    if (!senha)  novosErros.senha  = 'Preencha a senha'
    if (!termos) novosErros.termos = 'Aceite os termos para continuar'
    if (Object.keys(novosErros).length) { setErros(novosErros); return }

    setLoading(true)
    setErros({})
    try {
      const res = await api.post<AuthResponse>('/auth/cadastro', {
        name:     nome,
        email,
        phone:    celular ? celular.replace(/\D/g, '') : undefined,
        password: senha,
      })
      await signIn(res.accessToken, res.user, res.refreshToken)
    } catch (err: any) {
      setErros({ api: err.message ?? 'Não foi possível criar conta' })
    } finally {
      setLoading(false)
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

        <Text style={s.titulo}>Bora começar{'\n'}juntos.</Text>
        <Text style={s.subtitulo}>Cria sua conta em 30 segundos e ache uma oficina de confiança.</Text>

        <Input
          placeholder="Nome completo"
          value={nome}
          onChangeText={t => { setNome(t); limparErro('nome') }}
          autoCapitalize="words"
          error={erros.nome}
          returnKeyType="next"
        />

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
          placeholder="Celular (opcional)"
          value={celular}
          onChangeText={t => setCelular(formatCelular(t))}
          keyboardType="phone-pad"
          returnKeyType="next"
        />

        <Input
          placeholder="Senha"
          value={senha}
          onChangeText={t => { setSenha(t); limparErro('senha') }}
          secureTextEntry={!senhaVisivel}
          error={erros.senha}
          returnKeyType="done"
          onSubmitEditing={handleCadastro}
          suffix={
            <Ionicons
              name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.textMuted}
            />
          }
          onSuffixPress={() => setSenhaVisivel(v => !v)}
        />

        {/* Termos */}
        <TouchableOpacity
          style={s.termosRow}
          onPress={() => { setTermos(v => !v); limparErro('termos') }}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termos }}
        >
          <View style={[s.checkbox, termos && s.checkboxAtivo]}>
            {termos && <Ionicons name="checkmark" size={13} color={Colors.surface} />}
          </View>
          <Text style={s.termosTexto}>
            Li e aceito os{' '}
            <Text style={s.termosLink}>termos de uso</Text>
            {' '}e a{' '}
            <Text style={s.termosLink}>política de privacidade</Text>
            {' '}da iTrusty.
          </Text>
        </TouchableOpacity>
        {erros.termos ? <Text style={s.erroInline}>{erros.termos}</Text> : null}

        {erros.api ? (
          <Text style={s.erroApi}>{erros.api}</Text>
        ) : null}

        <TouchableOpacity
          style={[s.botao, loading && s.botaoDisabled]}
          onPress={handleCadastro}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.surface} />
            : <Text style={s.botaoTexto}>Criar conta</Text>}
        </TouchableOpacity>

        <View style={s.divisor}>
          <View style={s.linha} />
          <Text style={s.divisorTexto}>ou cadastre com</Text>
          <View style={s.linha} />
        </View>

        <View style={s.socialRow}>
          <SocialButton provider="google" onPress={handleGoogle} loading={loadingGoogle} />
          <SocialButton provider="apple" onPress={() => {}} />
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/login')} hitSlop={8}>
          <Text style={s.linkTexto}>
            Já tem conta?{'  '}
            <Text style={s.linkDestaque}>Entrar</Text>
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
  termosRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.sm },
  checkbox:     { width: 22, height: 22, borderRadius: Radii.xs, borderWidth: 1.5, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  checkboxAtivo:{ backgroundColor: Colors.accent, borderColor: Colors.accent },
  termosTexto:  { flex: 1, fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: Typography.size.sm * 1.6 },
  termosLink:   { color: Colors.accent, fontWeight: Typography.weight.semibold },
  erroInline:   { fontSize: Typography.size.xs, color: Colors.error, marginBottom: Spacing.sm, marginLeft: 30 },
  erroApi:      { fontSize: Typography.size.sm, color: Colors.error, textAlign: 'center', marginBottom: Spacing.base, backgroundColor: Colors.errorLight, padding: Spacing.sm, borderRadius: Radii.sm },
  botao:        { backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.base + 2, alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.sm },
  botaoDisabled:{ opacity: 0.6 },
  botaoTexto:   { color: Colors.surface, fontWeight: Typography.weight.bold, fontSize: Typography.size.base, letterSpacing: 0.3 },
  divisor:      { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.base },
  linha:        { flex: 1, height: 1, backgroundColor: Colors.border },
  divisorTexto: { fontSize: Typography.size.xs, color: Colors.textMuted, marginHorizontal: Spacing.sm },
  socialRow:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  linkTexto:    { textAlign: 'center', fontSize: Typography.size.md, color: Colors.textSecondary },
  linkDestaque: { color: Colors.accent, fontWeight: Typography.weight.semibold },
})
