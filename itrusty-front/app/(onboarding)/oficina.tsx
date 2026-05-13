import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii } from '../../constants/theme'
import { Input } from '../../components/ui/Input'
import { formatCep, formatCnpj, formatCelular } from '../../utils/formatters'

const CATEGORIAS = ['MECANICA', 'ESTETICA', 'ELETRICA', 'MOTOR', 'SUSPENSAO', 'PNEUS'] as const
type Categoria = typeof CATEGORIAS[number]

const LABELS: Record<Categoria, string> = {
  MECANICA: 'Mecânica', ESTETICA: 'Estética', ELETRICA: 'Elétrica',
  MOTOR: 'Motor',       SUSPENSAO: 'Suspensão', PNEUS: 'Pneus',
}

const MAX_CATEGORIAS = 3

export default function OnboardingOficina() {
  const [nome,      setNome]      = useState('')
  const [cnpj,      setCnpj]      = useState('')
  const [telefone,  setTelefone]  = useState('')
  const [categorias,setCategorias]= useState<Categoria[]>([])
  const [cep,       setCep]       = useState('')
  const [rua,       setRua]       = useState('')
  const [numero,    setNumero]    = useState('')
  const [bairro,    setBairro]    = useState('')
  const [cidade,    setCidade]    = useState('')
  const [estado,    setEstado]    = useState('')
  const [loading,   setLoading]   = useState(false)
  const [buscando,  setBuscando]  = useState(false)
  const [erro,      setErro]      = useState('')

  const { user, signIn } = useAuth()
  const router  = useRouter()
  const insets  = useSafeAreaInsets()

  function toggleCategoria(c: Categoria) {
    setCategorias(prev => {
      if (prev.includes(c)) return prev.filter(x => x !== c)
      if (prev.length >= MAX_CATEGORIAS) return prev
      return [...prev, c]
    })
  }

  async function buscarCep() {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return
    setBuscando(true)
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setRua(data.logradouro)
        setBairro(data.bairro)
        setCidade(data.localidade)
        setEstado(data.uf)
      }
    } catch {} finally { setBuscando(false) }
  }

  async function handleConcluir() {
    if (!nome || categorias.length === 0 || !cep || !rua || !numero || !bairro || !cidade || !estado) {
      setErro('Preencha todos os campos obrigatórios e selecione ao menos uma categoria')
      return
    }
    setErro('')
    setLoading(true)
    try {
      const res = await api.post<{ accessToken: string; refreshToken: string }>('/oficina/onboarding', {
        nome,
        cnpj:     cnpj     ? cnpj.replace(/\D/g, '')     : undefined,
        telefone: telefone ? telefone.replace(/\D/g, '') : undefined,
        categorias,
        cep: cep.replace(/\D/g, ''), rua, numero, bairro, cidade, estado,
      })
      await signIn(res.accessToken, { ...user!, role: 'OFICINA' }, res.refreshToken)
    } catch (err: any) {
      setErro(err.message ?? 'Não foi possível salvar')
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
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + Spacing.base }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={s.voltarBtn}
          onPress={() => router.back()}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>

        <Text style={s.titulo}>Conta da{'\n'}sua oficina.</Text>
        <Text style={s.subtitulo}>Esses dados aparecem pros motoristas e ajudam você a ganhar o selo verificado.</Text>

        {/* Sobre o negócio */}
        <View style={s.secaoHeader}>
          <Ionicons name="business-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.secaoTitulo}>Sobre o negócio</Text>
        </View>

        <Input
          placeholder="Nome da oficina"
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
          returnKeyType="next"
        />
        <Input
          placeholder="CNPJ (opcional)"
          value={cnpj}
          onChangeText={t => setCnpj(formatCnpj(t))}
          keyboardType="number-pad"
          returnKeyType="next"
        />
        <Input
          placeholder="Telefone (opcional)"
          value={telefone}
          onChangeText={t => setTelefone(formatCelular(t))}
          keyboardType="phone-pad"
          returnKeyType="next"
        />

        {/* Categorias */}
        <View style={s.secaoHeader}>
          <Ionicons name="construct-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.secaoTitulo}>
            Categorias{'  '}
            <Text style={s.secaoHint}>selecione até {MAX_CATEGORIAS}</Text>
          </Text>
        </View>

        <View style={s.chips}>
          {CATEGORIAS.map(c => {
            const sel      = categorias.includes(c)
            const bloqueado = !sel && categorias.length >= MAX_CATEGORIAS
            return (
              <TouchableOpacity
                key={c}
                style={[s.chip, sel && s.chipSel, bloqueado && s.chipBloqueado]}
                onPress={() => toggleCategoria(c)}
                disabled={bloqueado}
                activeOpacity={0.7}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: sel, disabled: bloqueado }}
              >
                {sel && <Ionicons name="checkmark" size={12} color={Colors.surface} style={{ marginRight: 4 }} />}
                <Text style={[s.chipTexto, sel && s.chipTextoSel]}>
                  {LABELS[c]}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Endereço */}
        <View style={s.secaoHeader}>
          <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
          <Text style={s.secaoTitulo}>Endereço</Text>
        </View>

        <View style={s.cepRow}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="CEP"
              value={cep}
              onChangeText={t => setCep(formatCep(t))}
              keyboardType="number-pad"
              onBlur={buscarCep}
              returnKeyType="next"
            />
          </View>
          <TouchableOpacity style={s.buscarBtn} onPress={buscarCep} disabled={buscando}>
            {buscando
              ? <ActivityIndicator size="small" color={Colors.accent} />
              : <Text style={s.buscarTexto}>Buscar</Text>}
          </TouchableOpacity>
        </View>

        <View style={s.row}>
          <View style={{ flex: 2 }}>
            <Input placeholder="Rua" value={rua} onChangeText={setRua} returnKeyType="next" />
          </View>
          <View style={{ flex: 1 }}>
            <Input placeholder="Número" value={numero} onChangeText={setNumero} keyboardType="number-pad" returnKeyType="next" />
          </View>
        </View>

        <Input
          placeholder="Bairro - Cidade"
          value={bairro && cidade ? `${bairro} - ${cidade}` : ''}
          editable={false}
        />

        {!!erro && (
          <View style={s.erroContainer}>
            <Ionicons name="alert-circle-outline" size={15} color={Colors.error} />
            <Text style={s.erro}>{erro}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.botao, loading && s.botaoDisabled]}
          onPress={handleConcluir}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.surface} />
            : <>
                <Text style={s.botaoTexto}>Concluir</Text>
                <Ionicons name="arrow-forward" size={18} color={Colors.surface} />
              </>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  scroll:        { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['4xl'] },
  voltarBtn:     { width: 40, height: 40, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl },
  titulo:        { fontSize: Typography.size['4xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.xs, lineHeight: Typography.size['4xl'] * 1.15 },
  subtitulo:     { fontSize: Typography.size.md, color: Colors.textSecondary, marginBottom: Spacing.xl, lineHeight: Typography.size.md * 1.6 },
  secaoHeader:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.md, marginTop: Spacing.sm },
  secaoTitulo:   { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textSecondary },
  secaoHint:     { fontSize: Typography.size.xs, fontWeight: Typography.weight.regular, color: Colors.textMuted },
  chips:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.base },
  chip:          { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radii.full, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  chipSel:       { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipBloqueado: { opacity: 0.35 },
  chipTexto:     { fontSize: Typography.size.sm, color: Colors.text, fontWeight: Typography.weight.medium },
  chipTextoSel:  { color: Colors.surface },
  cepRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  buscarBtn:     { height: 52, justifyContent: 'center', paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  buscarTexto:   { color: Colors.accent, fontWeight: Typography.weight.semibold, fontSize: Typography.size.md },
  row:           { flexDirection: 'row', gap: Spacing.sm },
  erroContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.errorLight, padding: Spacing.sm, borderRadius: Radii.sm, marginBottom: Spacing.md },
  erro:          { fontSize: Typography.size.sm, color: Colors.error, flex: 1 },
  botao:         { flexDirection: 'row', backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.base + 2, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.base },
  botaoDisabled: { opacity: 0.6 },
  botaoTexto:    { color: Colors.surface, fontWeight: Typography.weight.bold, fontSize: Typography.size.base },
})
