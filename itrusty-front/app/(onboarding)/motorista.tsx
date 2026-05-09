import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Colors } from '../../constants/colors'
import { formatCep, formatPlaca } from '../../utils/formatters'

export default function OnboardingMotorista() {
  const [cep, setCep]       = useState('')
  const [rua, setRua]       = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [marca, setMarca]   = useState('')
  const [modelo, setModelo] = useState('')
  const [ano, setAno]       = useState('')
  const [placa, setPlaca]   = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro]     = useState('')

  const { user, updateUser } = useAuth()
  const router = useRouter()

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
    if (!cep || !rua || !numero || !bairro || !cidade || !estado || !marca || !modelo || !ano || !placa) {
      setErro('Preencha todos os campos')
      return
    }
    setErro('')
    setLoading(true)
    try {
      await api.post('/motorista/onboarding', {
        cep: cep.replace(/\D/g, ''), rua, numero, bairro, cidade, estado,
        veiculo: { marca, modelo, ano: Number(ano), placa: placa.replace('-', '') },
      })
      updateUser({ ...user!, role: 'MOTORISTA' })
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

        <Text style={s.titulo}>Conta de{'\n'}motorista</Text>
        <Text style={s.subtitulo}>Usamos pra achar oficinas perto e adaptar serviços a você.</Text>

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

        <Text style={s.secao}>🚗 Seu veículo</Text>
        <View style={s.row}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="MARCA" placeholderTextColor={Colors.gray} value={marca} onChangeText={setMarca} />
          <TextInput style={[s.input, { flex: 1 }]} placeholder="MODELO" placeholderTextColor={Colors.gray} value={modelo} onChangeText={setModelo} />
        </View>
        <View style={s.row}>
          <TextInput style={[s.input, { flex: 1 }]} placeholder="ANO" placeholderTextColor={Colors.gray} value={ano} onChangeText={setAno} keyboardType="number-pad" />
          <TextInput
            style={[s.input, { flex: 1 }]}
            placeholder="PLACA"
            placeholderTextColor={Colors.gray}
            value={placa}
            onChangeText={t => setPlaca(formatPlaca(t))}
            autoCapitalize="characters"
          />
        </View>

        {erro ? <Text style={s.erro}>{erro}</Text> : null}

        <TouchableOpacity style={[s.botao, loading && s.botaoDisabled]} onPress={handleConcluir} disabled={loading}>
          <Text style={s.botaoTexto}>{loading ? 'Salvando...' : 'Concluir →'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  scroll:       { padding: 24, paddingTop: 48 },
  voltar:       { width: 40, height: 40, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  voltarTexto:  { fontSize: 18, color: Colors.text },
  titulo:       { fontSize: 32, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  subtitulo:    { fontSize: 14, color: Colors.textLight, marginBottom: 24 },
  secao:        { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 12, marginTop: 8 },
  row:          { flexDirection: 'row', gap: 8 },
  input:        { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, marginBottom: 10, fontSize: 13, color: Colors.text },
  buscarBtn:    { justifyContent: 'center', paddingHorizontal: 16, marginBottom: 10 },
  buscarTexto:  { color: Colors.accent, fontWeight: '600' },
  erro:         { fontSize: 12, color: Colors.error, marginBottom: 12, marginTop: -4 },
  botao:        { backgroundColor: Colors.accent, borderRadius: 50, padding: 18, alignItems: 'center', marginTop: 16 },
  botaoDisabled:{ opacity: 0.6 },
  botaoTexto:   { color: Colors.white, fontWeight: '700', fontSize: 16 },
})
