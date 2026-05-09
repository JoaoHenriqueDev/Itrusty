import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image
} from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { supabase } from '../../services/supabase'
import { Colors } from '../../constants/colors'

WebBrowser.maybeCompleteAuthSession()

type LoginResponse = {
  token: string
  user: { id: string; name: string; role: 'MOTORISTA' | 'OFICINA' | null }
}

type Erros = { email?: string; senha?: string; api?: string }

export default function Login() {
  const [email, setEmail]           = useState('')
  const [senha, setSenha]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [erros, setErros]           = useState<Erros>({})
  const { signIn } = useAuth()
  const router = useRouter()

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
      await signIn(res.token, res.user)
    } catch (err: any) {
      setErros({ api: err.message ?? 'E-mail ou senha incorretos' })
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    try {
      if (Platform.OS === 'web') {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URL ?? 'http://localhost:8081' }
        })
      } else {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { skipBrowserRedirect: true, redirectTo: 'itrusty://' }
        })
        if (error || !data.url) return
        const result = await WebBrowser.openAuthSessionAsync(data.url, 'itrusty://')
        if (result.type === 'success') {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const res = await api.post<LoginResponse>('/auth/social', {
              supabaseToken: session.access_token
            })
            await signIn(res.token, res.user)
          }
        }
      }
    } catch (err: any) {
      setErros({ api: err.message ?? 'Falha no login com Google' })
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
        <Text style={s.titulo}>Bom te ver{'\n'}de novo.</Text>
        <Text style={s.subtitulo}>Entra e agenda seu próximo serviço em 2 toques.</Text>

        <TextInput
          style={[s.input, erros.email && s.inputErro]}
          placeholder="E-MAIL"
          placeholderTextColor={Colors.gray}
          value={email}
          onChangeText={t => { setEmail(t); limparErro('email') }}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {erros.email && <Text style={s.erro}>{erros.email}</Text>}

        <View style={s.senhaContainer}>
          <TextInput
            style={[s.input, s.senhaInput, erros.senha && s.inputErro]}
            placeholder="SENHA"
            placeholderTextColor={Colors.gray}
            value={senha}
            onChangeText={t => { setSenha(t); limparErro('senha') }}
            secureTextEntry={!senhaVisivel}
          />
          <TouchableOpacity style={s.olhoBtn} onPress={() => setSenhaVisivel(v => !v)}>
            <Ionicons name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.gray} />
          </TouchableOpacity>
        </View>
        {erros.senha && <Text style={s.erro}>{erros.senha}</Text>}

        {erros.api && <Text style={[s.erro, s.erroApi]}>{erros.api}</Text>}

        <TouchableOpacity style={s.esqueci}>
          <Text style={s.esqueciTexto}>Esqueci a minha senha</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[s.botao, loading && s.botaoDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={s.botaoTexto}>{loading ? 'Entrando...' : 'ENTRAR →'}</Text>
        </TouchableOpacity>

        <View style={s.divisor}>
          <View style={s.linha} />
          <Text style={s.divisorTexto}>OU CONTINUE COM</Text>
          <View style={s.linha} />
        </View>

        <View style={s.socialRow}>
          <TouchableOpacity style={s.botaoSocialLight} onPress={handleGoogle}>
            <Text style={s.botaoSocialTextoEscuro}>GOOGLE 🔵</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.botaoSocialDark}>
            <Text style={s.botaoSocialTextoBranco}>Apple 🍎</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/cadastro')}>
          <Text style={s.linkTexto}>
            Novo por aqui? <Text style={s.linkDestaque}>Criar conta</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:              { flex: 1, backgroundColor: Colors.background },
  logo:                   { width: 80, height: 60, marginBottom: 24 },
  scroll:                 { padding: 24, paddingTop: 60 },
  titulo:                 { fontSize: 36, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  subtitulo:              { fontSize: 14, color: Colors.textLight, marginBottom: 32 },
  input:                  { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, marginBottom: 4, fontSize: 14, color: Colors.text },
  inputErro:              { borderColor: Colors.error },
  erro:                   { fontSize: 12, color: Colors.error, marginBottom: 10, marginLeft: 4 },
  erroApi:                { marginBottom: 16, marginLeft: 0, textAlign: 'center' },
  senhaContainer:         { position: 'relative' },
  senhaInput:             { paddingRight: 48 },
  olhoBtn:                { position: 'absolute', right: 14, top: 0, bottom: 4, justifyContent: 'center' },
  esqueci:                { alignSelf: 'flex-end', marginBottom: 24, marginTop: 4 },
  esqueciTexto:           { fontSize: 13, color: Colors.textLight },
  botao:                  { backgroundColor: Colors.accent, borderRadius: 50, padding: 18, alignItems: 'center', marginBottom: 24 },
  botaoDisabled:          { opacity: 0.6 },
  botaoTexto:             { color: Colors.white, fontWeight: '700', fontSize: 16 },
  divisor:                { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  linha:                  { flex: 1, height: 1, backgroundColor: Colors.border },
  divisorTexto:           { fontSize: 11, color: Colors.gray, marginHorizontal: 8 },
  socialRow:              { flexDirection: 'row', gap: 12, marginBottom: 32 },
  botaoSocialLight:       { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: Colors.white },
  botaoSocialDark:        { flex: 1, backgroundColor: Colors.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  botaoSocialTextoEscuro: { color: Colors.text, fontWeight: '600' },
  botaoSocialTextoBranco: { color: Colors.white, fontWeight: '600' },
  linkTexto:              { textAlign: 'center', color: Colors.textLight },
  linkDestaque:           { color: Colors.accent, fontWeight: '600' },
})
