import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, ActivityIndicator, Linking, Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { api } from '../../../services/api'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../../constants/theme'
import { StarRating } from '../../../components/ui/StarRating'

type Servico = {
  id: string; nome: string; descricao: string | null
  duracaoMinutos: number; preco: number
}
type Horario = {
  dia: string; aberto: boolean; abertura: string | null; fechamento: string | null
}
type Oficina = {
  id: string; nome: string; fotoUrl: string | null; telefone: string | null
  categorias: string[]; rua: string; numero: string; bairro: string
  cidade: string; estado: string; latitude: number | null; longitude: number | null
  mediaAvaliacao: number | null; totalAvaliacoes: number
  servicos: Servico[]; horarios: Horario[]
}

const LABELS: Record<string, string> = {
  MECANICA: 'Mecânica', ESTETICA: 'Estética', ELETRICA: 'Elétrica',
  MOTOR: 'Motor',       SUSPENSAO: 'Suspensão', PNEUS: 'Pneus',
}
const DIAS: Record<string, string> = {
  SEG: 'Seg', TER: 'Ter', QUA: 'Qua', QUI: 'Qui', SEX: 'Sex', SAB: 'Sáb', DOM: 'Dom',
}

function formatPreco(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
function formatDuracao(min: number) {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h${m}min` : `${h}h`
}

export default function DetalheOficina() {
  const { id }   = useLocalSearchParams<{ id: string }>()
  const router   = useRouter()
  const insets   = useSafeAreaInsets()

  const [oficina,  setOficina]  = useState<Oficina | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [erro,     setErro]     = useState(false)

  useEffect(() => {
    setOficina(null)
    setErro(false)
    setLoading(true)
    api.get<Oficina>(`/motorista/oficinas/${id}`)
      .then(setOficina)
      .catch(() => setErro(true))
      .finally(() => setLoading(false))
  }, [id])

  function abrirMapsExterno() {
    if (!oficina?.latitude || !oficina?.longitude) return
    const url = Platform.select({
      ios:     `maps://app?daddr=${oficina.latitude},${oficina.longitude}`,
      android: `google.navigation:q=${oficina.latitude},${oficina.longitude}`,
    })
    if (url) Linking.openURL(url)
  }

  function ligar() {
    if (oficina?.telefone) Linking.openURL(`tel:${oficina.telefone}`)
  }

  if (loading) {
    return (
      <View style={s.centralize}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    )
  }

  if (erro || !oficina) {
    return (
      <View style={s.centralize}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={s.erroTexto}>Oficina não encontrada</Text>
        <TouchableOpacity onPress={() => router.back()} style={s.voltarBtn}>
          <Text style={s.voltarBtnTexto}>Voltar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const temMapa = oficina.latitude !== null && oficina.longitude !== null

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Botão voltar flutuante */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={20} color={Colors.primary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}>
        {/* Foto */}
        <View style={s.fotoContainer}>
          {oficina.fotoUrl
            ? <Image source={{ uri: oficina.fotoUrl }} style={s.foto} resizeMode="cover" />
            : (
              <View style={[s.foto, s.fotoPlaceholder]}>
                <Ionicons name="storefront-outline" size={48} color={Colors.surface} />
              </View>
            )
          }
        </View>

        <View style={s.content}>
          {/* Nome, rating e categorias */}
          <Text style={s.nome}>{oficina.nome}</Text>
          {oficina.mediaAvaliacao !== null && (
            <View style={s.ratingRow}>
              <StarRating nota={Math.round(oficina.mediaAvaliacao)} tamanho={14} />
              <Text style={s.ratingTexto}>
                {oficina.mediaAvaliacao.toFixed(1)} ({oficina.totalAvaliacoes} {oficina.totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})
              </Text>
            </View>
          )}
          <View style={s.chips}>
            {oficina.categorias.map(c => (
              <View key={c} style={s.chip}>
                <Text style={s.chipTexto}>{LABELS[c] ?? c}</Text>
              </View>
            ))}
          </View>

          {/* Endereço + ações rápidas */}
          <View style={s.card}>
            <View style={s.cardLinha}>
              <Ionicons name="location-outline" size={18} color={Colors.accent} />
              <Text style={s.cardTexto}>
                {oficina.rua}, {oficina.numero} — {oficina.bairro}, {oficina.cidade}/{oficina.estado}
              </Text>
            </View>
            {oficina.telefone && (
              <View style={[s.cardLinha, s.cardLinhaBorda]}>
                <Ionicons name="call-outline" size={18} color={Colors.accent} />
                <Text style={s.cardTexto}>{oficina.telefone}</Text>
              </View>
            )}
          </View>

          {/* Ações rápidas */}
          <View style={s.acoesRow}>
            {oficina.telefone && (
              <TouchableOpacity style={s.acaoBtn} onPress={ligar} activeOpacity={0.75}>
                <Ionicons name="call" size={18} color={Colors.accent} />
                <Text style={s.acaoBtnTexto}>Ligar</Text>
              </TouchableOpacity>
            )}
            {temMapa && (
              <TouchableOpacity style={s.acaoBtn} onPress={abrirMapsExterno} activeOpacity={0.75}>
                <Ionicons name="navigate" size={18} color={Colors.accent} />
                <Text style={s.acaoBtnTexto}>Rota</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Mapa */}
          {temMapa && (
            <View style={s.mapaContainer}>
              <MapView
                key={`map-${oficina.latitude}-${oficina.longitude}`}
                style={s.mapa}
                provider={PROVIDER_DEFAULT}
                region={{
                  latitude:       oficina.latitude!,
                  longitude:      oficina.longitude!,
                  latitudeDelta:  0.008,
                  longitudeDelta: 0.008,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: oficina.latitude!, longitude: oficina.longitude! }}
                  title={oficina.nome}
                  pinColor={Colors.accent}
                />
              </MapView>
            </View>
          )}

          {/* Horários */}
          {oficina.horarios.length > 0 && (
            <>
              <Text style={s.secaoTitulo}>Horário de funcionamento</Text>
              <View style={s.card}>
                {oficina.horarios.map((h, i) => (
                  <View key={h.dia} style={[s.horarioLinha, i > 0 && s.cardLinhaBorda]}>
                    <Text style={[s.horarioDia, !h.aberto && s.fechado]}>{DIAS[h.dia] ?? h.dia}</Text>
                    <Text style={[s.horarioHora, !h.aberto && s.fechado]}>
                      {h.aberto && h.abertura && h.fechamento
                        ? `${h.abertura} – ${h.fechamento}`
                        : 'Fechado'}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Serviços */}
          <Text style={s.secaoTitulo}>Serviços disponíveis</Text>
          {oficina.servicos.length === 0 ? (
            <View style={s.card}>
              <Text style={s.semServico}>Nenhum serviço cadastrado ainda.</Text>
            </View>
          ) : (
            oficina.servicos.map(sv => (
              <View key={sv.id} style={s.servicoCard}>
                <View style={s.servicoInfo}>
                  <Text style={s.servicoNome}>{sv.nome}</Text>
                  {sv.descricao ? <Text style={s.servicoDesc} numberOfLines={2}>{sv.descricao}</Text> : null}
                  <View style={s.servicoMeta}>
                    <Ionicons name="time-outline" size={13} color={Colors.textMuted} />
                    <Text style={s.servicoMetaTexto}>{formatDuracao(sv.duracaoMinutos)}</Text>
                  </View>
                </View>
                <View style={s.servicoDireita}>
                  <Text style={s.servicoPreco}>{formatPreco(sv.preco)}</Text>
                  <TouchableOpacity
                    style={s.agendarBtn}
                    activeOpacity={0.8}
                    onPress={() => router.push({
                      pathname: '/(motorista)/agendar/[id]',
                      params: { id: oficina.id, servicoId: sv.id },
                    })}
                  >
                    <Text style={s.agendarBtnTexto}>Agendar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  centralize:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: Spacing.md, padding: Spacing.xl },
  erroTexto:       { fontSize: Typography.size.md, color: Colors.textSecondary, textAlign: 'center' },
  voltarBtn:       { marginTop: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.accent, borderRadius: Radii.full },
  voltarBtnTexto:  { color: Colors.surface, fontWeight: Typography.weight.semibold },
  backBtn:         { position: 'absolute', top: 56, left: Spacing.lg, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadows.md },
  fotoContainer:   { width: '100%', height: 220 },
  foto:            { width: '100%', height: '100%' },
  fotoPlaceholder: { backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  content:         { padding: Spacing.lg },
  nome:            { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.xs },
  ratingRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  ratingTexto:     { fontSize: Typography.size.sm, color: Colors.textSecondary },
  chips:           { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.base },
  chip:            { backgroundColor: Colors.accentLight, borderRadius: Radii.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  chipTexto:       { fontSize: Typography.size.xs, color: Colors.accentDark, fontWeight: Typography.weight.semibold },
  card:            { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.base, overflow: 'hidden' },
  cardLinha:       { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, padding: Spacing.base },
  cardLinhaBorda:  { borderTopWidth: 1, borderTopColor: Colors.borderLight },
  cardTexto:       { flex: 1, fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 20 },
  acoesRow:        { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  acaoBtn:         { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderWidth: 1.5, borderColor: Colors.accent, borderRadius: Radii.md, paddingVertical: Spacing.sm },
  acaoBtnTexto:    { color: Colors.accent, fontWeight: Typography.weight.semibold, fontSize: Typography.size.sm },
  mapaContainer:   { borderRadius: Radii.lg, overflow: 'hidden', marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  mapa:            { width: '100%', height: 180 },
  secaoTitulo:     { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textSecondary, letterSpacing: 0.5, marginBottom: Spacing.sm, marginTop: Spacing.sm },
  horarioLinha:    { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  horarioDia:      { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.text },
  horarioHora:     { fontSize: Typography.size.sm, color: Colors.textSecondary },
  fechado:         { color: Colors.textMuted },
  servicoCard:     { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center', ...Shadows.sm },
  servicoInfo:     { flex: 1, marginRight: Spacing.md, gap: 4 },
  servicoNome:     { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary },
  servicoDesc:     { fontSize: Typography.size.sm, color: Colors.textSecondary },
  servicoMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  servicoMetaTexto:{ fontSize: Typography.size.xs, color: Colors.textMuted },
  servicoDireita:  { alignItems: 'flex-end', gap: Spacing.sm },
  servicoPreco:    { fontSize: Typography.size.base, fontWeight: Typography.weight.extrabold, color: Colors.primary },
  agendarBtn:      { backgroundColor: Colors.accent, borderRadius: Radii.full, paddingHorizontal: Spacing.base, paddingVertical: Spacing.xs },
  agendarBtnTexto: { color: Colors.surface, fontWeight: Typography.weight.bold, fontSize: Typography.size.sm },
  semServico:      { padding: Spacing.base, color: Colors.textMuted, fontSize: Typography.size.sm },
})
