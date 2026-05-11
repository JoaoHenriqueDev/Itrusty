import { useEffect, useRef, useState } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Switch, ActivityIndicator, Image, Platform, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { supabase } from '../../services/supabase'
import { Colors, Spacing, Typography, Radii } from '../../constants/theme'
import { AppHeader } from '../../components/ui/AppHeader'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { NotificacaoBanner } from '../../components/NotificacaoBanner'
import { invalidarCacheOficina } from '../../hooks/useOficina'
import * as ImagePicker from 'expo-image-picker'

type GrupoDia = {
  label:      string
  dias:       string[]
  aberto:     boolean
  abertura:   string
  fechamento: string
}

const GRUPOS_INICIAIS: GrupoDia[] = [
  { label: 'SEG-SEX', dias: ['SEG','TER','QUA','QUI','SEX'], aberto: true,  abertura: '', fechamento: '' },
  { label: 'SÁBADO',  dias: ['SAB'],                         aberto: false, abertura: '', fechamento: '' },
  { label: 'DOMINGO', dias: ['DOM'],                         aberto: false, abertura: '', fechamento: '' },
]

const BUCKET = 'oficina-fotos'

export default function ContaOficina() {
  const { user }   = useAuth()
  const router     = useRouter()
  const insets     = useSafeAreaInsets()
  const fileInputRef = useRef<any>(null)
  const { notificacoes, naoLidas, marcarLida } = useNotificacoes()

  const [nomeOficina, setNomeOficina] = useState('')
  const [nome,        setNome]        = useState('')
  const [telefone,    setTelefone]    = useState('')
  const [fotoUrl,     setFotoUrl]     = useState<string | null>(null)
  const [cep,         setCep]         = useState('')
  const [rua,         setRua]         = useState('')
  const [numero,      setNumero]      = useState('')
  const [bairro,      setBairro]      = useState('')
  const [cidade,      setCidade]      = useState('')
  const [estado,      setEstado]      = useState('')
  const [grupos,      setGrupos]      = useState<GrupoDia[]>(GRUPOS_INICIAIS)
  const [loading,     setLoading]     = useState(true)
  const [salvando,    setSalvando]    = useState(false)
  const [uploadando,  setUploadando]  = useState(false)
  const [erro,        setErro]        = useState('')

  const primeiraNotif = notificacoes[0]

  useEffect(() => {
    api.get<any>('/oficina/perfil')
      .then(res => {
        setNomeOficina(res.nome ?? '')
        setNome(res.nome ?? '')
        setTelefone(res.telefone ?? '')
        setFotoUrl(res.fotoUrl ?? null)
        setCep(res.cep ?? '')
        setRua(res.rua ?? '')
        setNumero(res.numero ?? '')
        setBairro(res.bairro ?? '')
        setCidade(res.cidade ?? '')
        setEstado(res.estado ?? '')
        if (res.horarios?.length > 0) {
          setGrupos(prev =>
            prev.map(g => {
              const h = res.horarios.find((h: any) => g.dias.includes(h.dia))
              if (!h) return g
              return { ...g, aberto: h.aberto, abertura: h.abertura ?? '', fechamento: h.fechamento ?? '' }
            })
          )
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function setGrupo(idx: number, patch: Partial<GrupoDia>) {
    setGrupos(prev => prev.map((g, i) => i === idx ? { ...g, ...patch } : g))
  }

  async function uploadBase64(base64: string, mimeType: string) {
    setUploadando(true)
    setErro('')
    try {
      const ext  = mimeType.split('/')[1] ?? 'jpg'
      const path = `${user?.id}/${Date.now()}.${ext}`

      const binaryStr = atob(base64)
      const bytes = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i)
      }

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, bytes, { upsert: true, contentType: mimeType })

      if (error) throw new Error(error.message)

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
      await api.patch('/oficina/perfil', { fotoUrl: publicUrl })
      invalidarCacheOficina()
      setFotoUrl(publicUrl)
    } catch (err: any) {
      console.error('[uploadBase64]', err)
      setErro(err.message ?? 'Erro no upload')
    } finally {
      setUploadando(false)
    }
  }

  async function uploadFotoWeb(file: File) {
    setUploadando(true)
    setErro('')
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg'
      const path = `${user?.id}/${Date.now()}.${ext}`

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type })

      if (error) throw new Error(error.message)

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
      await api.patch('/oficina/perfil', { fotoUrl: publicUrl })
      invalidarCacheOficina()
      setFotoUrl(publicUrl)
    } catch (err: any) {
      console.error('[uploadFotoWeb]', err)
      setErro(err.message ?? 'Erro no upload')
    } finally {
      setUploadando(false)
    }
  }

  async function escolherFoto() {
    if (Platform.OS === 'web') {
      fileInputRef.current?.click()
      return
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações do celular.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [16, 9],
      base64: true,
    })
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0]
      setFotoUrl(asset.uri)
      if (asset.base64) {
        await uploadBase64(asset.base64, asset.mimeType ?? 'image/jpeg')
      }
    }
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    try {
      const horarios = grupos.flatMap(g =>
        g.dias.map(dia => ({
          dia,
          aberto:     g.aberto,
          abertura:   g.aberto ? g.abertura : '',
          fechamento: g.aberto ? g.fechamento : '',
        }))
      )
      await api.patch('/oficina/perfil', {
        nome:     nome.trim()     || undefined,
        telefone: telefone.trim() || undefined,
        cep:      cep.replace(/\D/g, '') || undefined,
        rua:      rua.trim()      || undefined,
        numero:   numero.trim()   || undefined,
        bairro:   bairro.trim()   || undefined,
        cidade:   cidade.trim()   || undefined,
        estado:   estado.trim()   || undefined,
        horarios,
      })
      invalidarCacheOficina()
      router.back()
    } catch (err: any) {
      setErro(err.message ?? 'Não foi possível salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) {
    return (
      <View style={[s.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    )
  }

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      <AppHeader
        titulo={`Olá, ${nomeOficina || user?.name?.split(' ')[0] || ''}`}
        naoLidas={naoLidas}
      />

      {primeiraNotif && (
        <NotificacaoBanner
          titulo={primeiraNotif.titulo}
          corpo={primeiraNotif.corpo}
          onDismiss={() => marcarLida(primeiraNotif.id)}
        />
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.titulo}>Conta</Text>

        {/* Foto */}
        <TouchableOpacity
          style={s.fotoBanner}
          onPress={escolherFoto}
          disabled={uploadando}
          accessibilityLabel="Alterar foto"
          accessibilityRole="button"
        >
          {fotoUrl
            ? <Image source={{ uri: fotoUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : null}
          <View style={s.fotoOverlay}>
            {uploadando
              ? <ActivityIndicator color={Colors.surface} />
              : <Ionicons name="pencil-outline" size={26} color="rgba(255,255,255,0.9)" />}
          </View>
        </TouchableOpacity>

        {Platform.OS === 'web' && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e: any) => {
              const file = e.target?.files?.[0]
              if (file) uploadFotoWeb(file)
            }}
          />
        )}

        {/* Nome */}
        <TextInput
          style={s.input}
          placeholder="NOME DA OFICINA"
          placeholderTextColor={Colors.textMuted}
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
        />

        {/* Telefone */}
        <TextInput
          style={s.input}
          placeholder="TELEFONE (ex: 11912345678)"
          placeholderTextColor={Colors.textMuted}
          value={telefone}
          onChangeText={setTelefone}
          keyboardType="phone-pad"
        />

        {/* Endereço */}
        <Text style={s.secaoLabel}>ENDEREÇO</Text>
        <View style={s.enderecoRow}>
          <TextInput
            style={[s.input, { flex: 2 }]}
            placeholder="CEP"
            placeholderTextColor={Colors.textMuted}
            value={cep}
            onChangeText={setCep}
            keyboardType="numeric"
            maxLength={9}
          />
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="Nº"
            placeholderTextColor={Colors.textMuted}
            value={numero}
            onChangeText={setNumero}
          />
        </View>
        <TextInput
          style={s.input}
          placeholder="RUA / AVENIDA"
          placeholderTextColor={Colors.textMuted}
          value={rua}
          onChangeText={setRua}
          autoCapitalize="words"
        />
        <TextInput
          style={s.input}
          placeholder="BAIRRO"
          placeholderTextColor={Colors.textMuted}
          value={bairro}
          onChangeText={setBairro}
          autoCapitalize="words"
        />
        <View style={s.enderecoRow}>
          <TextInput
            style={[s.input, { flex: 2 }]}
            placeholder="CIDADE"
            placeholderTextColor={Colors.textMuted}
            value={cidade}
            onChangeText={setCidade}
            autoCapitalize="words"
          />
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="UF"
            placeholderTextColor={Colors.textMuted}
            value={estado}
            onChangeText={v => setEstado(v.toUpperCase())}
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>

        {/* Horários */}
        {grupos.map((g, idx) => (
          <View key={g.label} style={s.grupoCard}>
            <View style={s.grupoHeader}>
              <Text style={s.grupoLabel}>{g.label}</Text>
              <Switch
                value={g.aberto}
                onValueChange={v => setGrupo(idx, { aberto: v })}
                trackColor={{ false: Colors.border, true: Colors.accent }}
                thumbColor={Colors.surface}
                ios_backgroundColor={Colors.border}
              />
            </View>
            {g.aberto && (
              <View style={s.horarioRow}>
                {(['abertura', 'fechamento'] as const).map(campo => (
                  <View key={campo} style={s.horarioCol}>
                    <Text style={s.horarioLabel}>{campo === 'abertura' ? 'Abertura' : 'Fechamento'}</Text>
                    <View style={s.horarioInput}>
                      <TextInput
                        style={s.horarioTexto}
                        placeholder={campo === 'abertura' ? '7:00' : '17:00'}
                        placeholderTextColor={Colors.textMuted}
                        value={g[campo]}
                        onChangeText={v => setGrupo(idx, { [campo]: v })}
                        keyboardType="numbers-and-punctuation"
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {!!erro && <Text style={s.erro}>{erro}</Text>}
      </ScrollView>

      <View style={[s.rodape, { paddingBottom: Math.max(Spacing.xl, insets.bottom) }]}>
        <TouchableOpacity style={s.voltarBtn} onPress={() => router.back()}>
          <Text style={s.voltarTexto}>Voltar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.salvarBtn, salvando && { opacity: 0.6 }]}
          onPress={salvar}
          disabled={salvando}
        >
          {salvando
            ? <ActivityIndicator size="small" color={Colors.surface} />
            : <>
                <Ionicons name="checkmark" size={18} color={Colors.surface} />
                <Text style={s.salvarTexto}>Salvar alterações</Text>
              </>}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scroll:       { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  titulo:       { fontSize: Typography.size['3xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.base, marginTop: Spacing.sm },
  fotoBanner:   { height: 160, backgroundColor: Colors.primary, borderRadius: Radii.lg, marginBottom: Spacing.base, overflow: 'hidden' },
  fotoOverlay:  { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  input:        { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.base, marginBottom: Spacing.md, fontSize: Typography.size.md, color: Colors.text },
  secaoLabel:   { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.textMuted, letterSpacing: 0.8, marginBottom: Spacing.sm },
  enderecoRow:  { flexDirection: 'row', gap: Spacing.sm },
  grupoCard:    { backgroundColor: Colors.surface, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.sm },
  grupoHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grupoLabel:   { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.primary, letterSpacing: 0.5 },
  horarioRow:   { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.base },
  horarioCol:   { flex: 1 },
  horarioLabel: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginBottom: Spacing.xs },
  horarioInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.background },
  horarioTexto: { fontSize: Typography.size.md, color: Colors.text },
  erro:         { fontSize: Typography.size.sm, color: Colors.error, marginTop: Spacing.sm, textAlign: 'center' },
  rodape:       { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  voltarBtn:    { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.full, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  voltarTexto:  { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.text },
  salvarBtn:    { flex: 2, flexDirection: 'row', backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.md, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  salvarTexto:  { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.surface },
})
