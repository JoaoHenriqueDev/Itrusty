import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, Switch, ActivityIndicator, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../../contexts/AuthContext'
import { api } from '../../../services/api'
import { Colors, Spacing, Typography, Radii } from '../../../constants/theme'
import { useAppAlert } from '../../../components/ui/AppAlert'
import { AppHeader } from '../../../components/ui/AppHeader'
import { useOficina } from '../../../hooks/useOficina'

type Servico = {
  id:             string
  nome:           string
  descricao:      string | null
  duracaoMinutos: number
  preco:          number
  ativo:          boolean
}

export default function EditarServico() {
  const { id }    = useLocalSearchParams<{ id: string }>()
  const router    = useRouter()
  const { user }  = useAuth()
  const insets    = useSafeAreaInsets()
  const { oficina } = useOficina()
  const { confirm } = useAppAlert()
  const novo      = id === 'novo'

  const [nome,      setNome]      = useState('')
  const [descricao, setDescricao] = useState('')
  const [duracao,   setDuracao]   = useState('')
  const [preco,     setPreco]     = useState('')
  const [ativo,     setAtivo]     = useState(true)
  const [loading,   setLoading]   = useState(!novo)
  const [salvando,  setSalvando]  = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro,      setErro]      = useState('')

  useEffect(() => {
    if (novo) return
    api.get<{ servicos: Servico[] }>('/oficina/servicos')
      .then(res => {
        const sv = res.servicos.find(s => s.id === id)
        if (!sv) { router.navigate('/(oficina)/servicos' as any); return }
        setNome(sv.nome)
        setDescricao(sv.descricao ?? '')
        setDuracao(String(sv.duracaoMinutos))
        setPreco(sv.preco.toFixed(2).replace('.', ','))
        setAtivo(sv.ativo)
      })
      .catch(() => router.navigate('/(oficina)/servicos' as any))
      .finally(() => setLoading(false))
  }, [id])

  async function salvar() {
    setErro('')
    if (!nome.trim()) { setErro('Preencha o nome do serviço'); return }
    if (!duracao)     { setErro('Preencha a duração em minutos'); return }
    if (!preco)       { setErro('Preencha o valor'); return }

    const precoNum   = parseFloat(preco.replace(',', '.'))
    const duracaoNum = parseInt(duracao, 10)
    if (isNaN(precoNum))   { setErro('Valor inválido'); return }
    if (isNaN(duracaoNum) || duracaoNum < 5) { setErro('Duração mínima é 5 minutos'); return }

    setSalvando(true)
    try {
      if (novo) {
        await api.post('/oficina/servicos', {
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          duracaoMinutos: duracaoNum,
          preco: precoNum,
        })
      } else {
        await api.patch(`/oficina/servicos/${id}`, {
          nome: nome.trim(),
          descricao: descricao.trim() || undefined,
          duracaoMinutos: duracaoNum,
          preco: precoNum,
          ativo,
        })
      }
      router.navigate('/(oficina)/servicos' as any)
    } catch (err: any) {
      setErro(err.message ?? 'Não foi possível salvar o serviço')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir() {
    setExcluindo(true)
    try {
      await api.delete(`/oficina/servicos/${id}`)
      router.navigate('/(oficina)/servicos' as any)
    } catch (err: any) {
      setErro(err.message ?? 'Não foi possível excluir o serviço')
    } finally {
      setExcluindo(false)
    }
  }

  function confirmarExclusao() {
    // Alert.alert não funciona no web — usa window.confirm
    if (Platform.OS === 'web') {
      if (window.confirm('Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.')) {
        excluir()
      }
      return
    }
    confirm(
      'Excluir serviço',
      'Tem certeza? Esta ação não pode ser desfeita.',
      excluir,
      { confirmText: 'Excluir', destructive: true },
    )
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
        titulo={`Olá, ${oficina?.nome ?? user?.name?.split(' ')[0] ?? ''}`}
        subtitulo={oficina?.cidade ?? undefined}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.tituloRow}>
          <TouchableOpacity style={s.voltarBtn} onPress={() => router.navigate('/(oficina)/servicos' as any)}>
            <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={s.titulo}>{novo ? 'Novo serviço.' : 'Editar serviço.'}</Text>
        </View>

        <TextInput
          style={s.input}
          placeholder="Nome do serviço"
          placeholderTextColor={Colors.textMuted}
          value={nome}
          onChangeText={setNome}
          autoCapitalize="words"
          returnKeyType="next"
        />

        <TextInput
          style={[s.input, s.textarea]}
          placeholder="Descrição (opcional)"
          placeholderTextColor={Colors.textMuted}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={s.row}>
          <View style={{ flex: 1 }}>
            <Text style={s.inputLabel}>Duração (minutos)</Text>
            <TextInput
              style={s.input}
              placeholder="ex: 120"
              placeholderTextColor={Colors.textMuted}
              value={duracao}
              onChangeText={setDuracao}
              keyboardType="number-pad"
              returnKeyType="next"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.inputLabel}>Valor (R$)</Text>
            <TextInput
              style={s.input}
              placeholder="ex: 280,00"
              placeholderTextColor={Colors.textMuted}
              value={preco}
              onChangeText={setPreco}
              keyboardType="decimal-pad"
              returnKeyType="done"
            />
          </View>
        </View>

        <View style={s.toggleCard}>
          <View style={{ flex: 1 }}>
            <Text style={s.toggleLabel}>Disponível na loja</Text>
            <Text style={s.toggleSub}>Aparece para motoristas que buscam</Text>
          </View>
          <Switch
            value={ativo}
            onValueChange={setAtivo}
            trackColor={{ false: Colors.border, true: Colors.accent }}
            thumbColor={Colors.surface}
            ios_backgroundColor={Colors.border}
          />
        </View>

        {!!erro && (
          <View style={s.erroContainer}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={s.erro}>{erro}</Text>
          </View>
        )}
      </ScrollView>

      <View style={s.rodape}>
        {!novo && (
          <TouchableOpacity
            style={s.excluirBtn}
            onPress={confirmarExclusao}
            disabled={excluindo}
          >
            {excluindo
              ? <ActivityIndicator size="small" color={Colors.error} />
              : <Text style={s.excluirTexto}>Excluir</Text>}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[s.salvarBtn, !novo && s.salvarBtnFlex, (salvando || !nome.trim()) && s.salvarBtnDisabled]}
          onPress={salvar}
          disabled={salvando || !nome.trim()}
          activeOpacity={0.8}
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
  container:       { flex: 1, backgroundColor: Colors.background },
  scroll:          { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  tituloRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.xl },
  voltarBtn:       { width: 40, height: 40, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  titulo:          { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary },
  inputLabel:      { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary, marginBottom: Spacing.xs },
  input:           { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.md, padding: Spacing.base, marginBottom: Spacing.md, fontSize: Typography.size.md, color: Colors.text },
  textarea:        { height: 110, paddingTop: Spacing.base },
  row:             { flexDirection: 'row', gap: Spacing.sm },
  toggleCard:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radii.md, padding: Spacing.base, borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.xs },
  toggleLabel:     { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.primary },
  toggleSub:       { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
  erroContainer:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.errorLight, padding: Spacing.sm, borderRadius: Radii.sm, marginTop: Spacing.md },
  erro:            { fontSize: Typography.size.sm, color: Colors.error, flex: 1 },
  rodape:          { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background },
  excluirBtn:      { flex: 1, borderWidth: 1, borderColor: Colors.error, borderRadius: Radii.full, paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  excluirTexto:    { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.error },
  salvarBtn:       { flex: 2, flexDirection: 'row', backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.md, justifyContent: 'center', alignItems: 'center', gap: Spacing.sm },
  salvarBtnFlex:   { flex: 2 },
  salvarBtnDisabled:{ opacity: 0.5 },
  salvarTexto:     { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.surface },
})
