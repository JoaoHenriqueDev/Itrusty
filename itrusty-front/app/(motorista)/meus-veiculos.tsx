import { useCallback, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { api } from '../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'
import { useAppAlert } from '../../components/ui/AppAlert'

type Veiculo = { id: string; marca: string; modelo: string; ano: number; placa: string }

const ANO_ATUAL = new Date().getFullYear()

export default function MeusVeiculos() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { alert, confirm } = useAppAlert()

  const [veiculos,   setVeiculos]   = useState<Veiculo[]>([])
  const [loading,    setLoading]    = useState(true)
  const [adicionando, setAdicionando] = useState(false)
  const [salvando,   setSalvando]   = useState(false)

  // form
  const [marca,  setMarca]  = useState('')
  const [modelo, setModelo] = useState('')
  const [ano,    setAno]    = useState('')
  const [placa,  setPlaca]  = useState('')

  const carregar = useCallback(async () => {
    try {
      const res = await api.get<{ veiculos: Veiculo[] }>('/motorista/veiculos')
      setVeiculos(res.veiculos ?? [])
    } catch {
      setVeiculos([])
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { carregar() }, [carregar]))

  function limparForm() {
    setMarca(''); setModelo(''); setAno(''); setPlaca('')
    setAdicionando(false)
  }

  async function salvarVeiculo() {
    const anoNum = parseInt(ano)
    if (!marca.trim() || !modelo.trim() || !ano || !placa.trim()) {
      alert('Atenção', 'Preencha todos os campos.'); return
    }
    if (isNaN(anoNum) || anoNum < 1950 || anoNum > ANO_ATUAL + 1) {
      alert('Atenção', `Ano inválido. Use entre 1950 e ${ANO_ATUAL + 1}.`); return
    }
    if (placa.replace(/[^a-zA-Z0-9]/g, '').length < 7) {
      alert('Atenção', 'Placa inválida.'); return
    }

    setSalvando(true)
    try {
      await api.post('/usuario/veiculos', {
        marca:  marca.trim(),
        modelo: modelo.trim(),
        ano:    anoNum,
        placa:  placa.toUpperCase().trim(),
      })
      await carregar()
      limparForm()
    } catch (err: any) {
      alert('Erro', err.message ?? 'Não foi possível adicionar o veículo.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(veiculo: Veiculo) {
    if (veiculos.length <= 1) {
      alert('Atenção', 'Você precisa ter ao menos um veículo cadastrado.'); return
    }
    confirm(
      'Remover veículo',
      `Remover ${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})?`,
      async () => {
        try {
          await api.delete(`/usuario/veiculos/${veiculo.id}`)
          setVeiculos(prev => prev.filter(v => v.id !== veiculo.id))
        } catch (err: any) {
          alert('Erro', err.message ?? 'Não foi possível remover.')
        }
      },
      { confirmText: 'Remover', destructive: true },
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.navigate('/(motorista)/perfil' as any)} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Meus veículos</Text>
        <TouchableOpacity onPress={() => setAdicionando(true)} hitSlop={12}>
          <Ionicons name="add" size={26} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + Spacing.xxl }]}>
        {loading ? (
          <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xxl }} />
        ) : (
          veiculos.map(v => (
            <View key={v.id} style={s.card}>
              <View style={s.cardIcone}>
                <Ionicons name="car" size={24} color={Colors.accent} />
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardNome}>{v.marca} {v.modelo}</Text>
                <Text style={s.cardMeta}>{v.placa} · {v.ano}</Text>
              </View>
              <TouchableOpacity
                onPress={() => excluir(v)}
                hitSlop={10}
                disabled={veiculos.length <= 1}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={veiculos.length <= 1 ? Colors.textMuted : Colors.error}
                />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Formulário de adição */}
        {adicionando && (
          <View style={s.form}>
            <Text style={s.formTitulo}>Novo veículo</Text>

            {[
              { label: 'Marca',  value: marca,  setter: setMarca,  placeholder: 'Ex: Toyota',         caps: 'words' as const,    keyboard: 'default' as const },
              { label: 'Modelo', value: modelo, setter: setModelo, placeholder: 'Ex: Corolla',        caps: 'words' as const,    keyboard: 'default' as const },
              { label: 'Ano',    value: ano,    setter: setAno,    placeholder: `Ex: ${ANO_ATUAL}`,    caps: 'none' as const,     keyboard: 'numeric' as const },
              { label: 'Placa',  value: placa,  setter: (v: string) => setPlaca(v.toUpperCase()), placeholder: 'ABC1234', caps: 'characters' as const, keyboard: 'default' as const },
            ].map(({ label, value, setter, placeholder, caps, keyboard }) => (
              <View key={label} style={s.campo}>
                <Text style={s.campoLabel}>{label}</Text>
                <TextInput
                  style={s.input}
                  value={value}
                  onChangeText={setter}
                  placeholder={placeholder}
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize={caps}
                  keyboardType={keyboard}
                  maxLength={label === 'Placa' ? 8 : label === 'Ano' ? 4 : 50}
                />
              </View>
            ))}

            <View style={s.formBotoes}>
              <TouchableOpacity style={s.cancelarBtn} onPress={limparForm}>
                <Text style={s.cancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.adicionarBtn, salvando && { opacity: 0.6 }]} onPress={salvarVeiculo} disabled={salvando}>
                {salvando
                  ? <ActivityIndicator size="small" color={Colors.surface} />
                  : <Text style={s.adicionarTexto}>Adicionar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!adicionando && (
          <TouchableOpacity style={s.addBtn} onPress={() => setAdicionando(true)} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={20} color={Colors.accent} />
            <Text style={s.addBtnTexto}>Adicionar veículo</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: Colors.background },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.base, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitulo:  { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary, flex: 1, textAlign: 'center' },
  scroll:        { padding: Spacing.lg },
  card:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.sm, gap: Spacing.md, ...Shadows.sm },
  cardIcone:     { width: 44, height: 44, borderRadius: Radii.md, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  cardInfo:      { flex: 1 },
  cardNome:      { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary },
  cardMeta:      { fontSize: Typography.size.sm, color: Colors.textMuted, marginTop: 2 },
  addBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, borderWidth: 1.5, borderColor: Colors.accent, borderRadius: Radii.lg, padding: Spacing.base, marginTop: Spacing.sm, borderStyle: 'dashed' },
  addBtnTexto:   { color: Colors.accent, fontWeight: Typography.weight.semibold, fontSize: Typography.size.md },
  form:          { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginTop: Spacing.sm, gap: Spacing.sm },
  formTitulo:    { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary, marginBottom: Spacing.xs },
  campo:         { gap: Spacing.xs },
  campoLabel:    { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
  input:         { borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.md, fontSize: Typography.size.md, color: Colors.text, backgroundColor: Colors.background },
  formBotoes:    { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  cancelarBtn:   { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.full, paddingVertical: Spacing.md, alignItems: 'center' },
  cancelarTexto: { fontWeight: Typography.weight.semibold, color: Colors.text },
  adicionarBtn:  { flex: 2, backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.md, alignItems: 'center' },
  adicionarTexto:{ fontWeight: Typography.weight.bold, color: Colors.surface, fontSize: Typography.size.md },
})
