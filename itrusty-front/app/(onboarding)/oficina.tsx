import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Colors } from '../../constants/colors'
import { formatCep, formatCnpj, formatCelular } from '../../utils/formatters'

const CATEGORIAS = ['MECANICA', 'ESTETICA', 'ELETRICA', 'MOTOR', 'SUSPENSAO', 'PNEUS'] as const
type Categoria = typeof CATEGORIAS[number]

const LABELS: Record<Categoria, string> = {
  MECANICA: 'Mecânica', ESTETICA: 'Estética', ELETRICA: 'Elétrica',
  MOTOR: 'Motor', SUSPENSAO: 'Suspensão', PNEUS: 'Pneus'
}

const MAX_CATEGORIAS = 3

export default function OnboardingOficina() {
  const [nome, setNome]         = useState('')
  const [cnpj, setCnpj]         = useState('')
  const [telefone, setTelefone] = useState('')
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [cep, setCep]           = useState('')
  const [rua, setRua]           = useState('')
  const [numero, setNumero]     = useState('')
  const [bairro, setBairro]     = useState('')
  const [cidade, setCidade]     = useState('')
  const [estado, setEstado]     = useState('')
  const [loading, setLoading]   = useState(false)
  const [erro, setErro]         = useState('')

  const { user, updateUser } = useAuth()
  const router = useRouter()

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
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      const data = await res.json()
      if (!data.erro) {
        setRua(data.logradouro)
        setBairro(data.bairro)
        setCidade(data.localidade)
        setEstado(data.uf)
      }
    } catch {}
  }

  async function handleConcluir() {
    if (!nome || categorias.length === 0 || !cep || !rua || !numero || !bairro || !cidade || !estado) {
      setErro('Preencha todos os campos obrigatórios')
      return
    }
    setErro('')
    setLoading(true)
    try {
      await api.post('/oficina/onboarding', {
        nome,
        cnpj:     cnpj     ? cnpj.replace(/\D/g, '')     : undefined,
        telefone: telefone ? telefone.replace(/\D/g, '') : undefined,
        categorias,
        cep: cep.replace(/\D/g, ''), rua, numero, bairro, cidade, estado,
      })
      updateUser({ ...user!, role: 'OFICINA' })
    } catch (err: any) {
      setErro(err.message ?? 'Não foi possível salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={s.voltar}>
          <Text style={s.voltarTexto}>←</Text>
        </TouchableOpacity>

        <Text style={s.titulo}>Conta da{'\n'}sua oficina.</Text>
        <Text style={s.subtitulo}>Esses dados aparecem pros motoristas e ajudam você a ganhar o selo verificado.</Text>

        <Text style={s.secao}>Sobre o negócio</Text>
        <TextInput style={s.input} placeholder="NOME" placeholderTextColor={Colors.gray} value={nome} onChangeText={setNome} />
        <TextInput
          style={s.input}
          placeholder="CNPJ (opcional)"
          placeholderTextColor={Colors.gray}
          value={cnpj}
          onChangeText={t => setCnpj(formatCnpj(t))}
          keyboardType="number-pad"
        />
        <TextInput
          style={s.input}
          placeholder="TELEFONE (opcional)"
          placeholderTextColor={Colors.gray}
          value={telefone}
          onChangeText={t => setTelefone(formatCelular(t))}
          keyboardType="phone-pad"
        />

        <Text style={s.secao}>
          Categoria{' '}
          <Text style={s.secaoHint}>(máx. {MAX_CATEGORIAS})</Text>
        </Text>
        <View style={s.categorias}>
          {CATEGORIAS.map(c => {
            const selecionado = categorias.includes(c)
            const bloqueado   = !selecionado && categorias.length >= MAX_CATEGORIAS
            return (
              <TouchableOpacity
                key={c}
                style={[s.chip, selecionado && s.chipSelecionado, bloqueado && s.chipBloqueado]}
                onPress={() => toggleCategoria(c)}
                disabled={bloqueado}
              >
                <Text style={[s.chipTexto, selecionado && s.chipTextoSelecionado, bloqueado && s.chipTextoBloqueado]}>
                  {LABELS[c]}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={s.secao}>📍 Endereço</Text>
        <View style={s.row}>
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="CEP"
            placeholderTextColor={Colors.gray}
            value={cep}
            onChangeText={t => setCep(formatCep(t))}
            keyboardType="number-pad"
            onBlur={buscarCep}
          />
          <TouchableOpacity style={s.buscarBtn} onPress={buscarCep}>
            <Text style={s.buscarTexto}>Buscar</Text>
          </TouchableOpacity>
        </View>
        <View style={s.row}>
          <TextInput style={[s.input, { flex: 2 }]} placeholder="RUA" placeholderTextColor={Colors.gray} value={rua} onChangeText={setRua} />
          <TextInput style={[s.input, { flex: 1 }]} placeholder="NÚMERO" placeholderTextColor={Colors.gray} value={numero} onChangeText={setNumero} />
        </View>
        <TextInput style={s.input} placeholder="BAIRRO - CIDADE" placeholderTextColor={Colors.gray} value={bairro ? `${bairro} - ${cidade}` : ''} editable={false} />

        {erro ? <Text style={s.erro}>{erro}</Text> : null}

        <TouchableOpacity style={[s.botao, loading && s.botaoDisabled]} onPress={handleConcluir} disabled={loading}>
          <Text style={s.botaoTexto}>{loading ? 'Salvando...' : 'Concluir →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:              { flex: 1, backgroundColor: Colors.background },
  scroll:                 { padding: 24, paddingTop: 48 },
  voltar:                 { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  voltarTexto:            { fontSize: 18, color: Colors.text },
  titulo:                 { fontSize: 32, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  subtitulo:              { fontSize: 14, color: Colors.textLight, marginBottom: 24 },
  secao:                  { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 12, marginTop: 8 },
  secaoHint:              { fontSize: 12, fontWeight: '400', color: Colors.gray },
  input:                  { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 10, fontSize: 13, color: Colors.text },
  row:                    { flexDirection: 'row', gap: 8 },
  buscarBtn:              { justifyContent: 'center', paddingHorizontal: 16, marginBottom: 10 },
  buscarTexto:            { color: Colors.accent, fontWeight: '600' },
  categorias:             { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip:                   { borderWidth: 1, borderColor: Colors.border, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  chipSelecionado:        { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipBloqueado:          { opacity: 0.35 },
  chipTexto:              { fontSize: 13, color: Colors.text },
  chipTextoSelecionado:   { color: Colors.white },
  chipTextoBloqueado:     { color: Colors.gray },
  erro:                   { fontSize: 12, color: Colors.error, marginBottom: 12 },
  botao:                  { backgroundColor: Colors.accent, borderRadius: 50, padding: 18, alignItems: 'center', marginTop: 16 },
  botaoDisabled:          { opacity: 0.6 },
  botaoTexto:             { color: Colors.white, fontWeight: '700', fontSize: 16 },
})
