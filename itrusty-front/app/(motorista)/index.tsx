import { useEffect, useState, useMemo, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Image, RefreshControl, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { useNotificacoes } from '../../hooks/useNotificacoes'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/SkeletonCard'

type Oficina = {
  id:          string
  nome:        string
  bairro:      string | null
  cidade:      string | null
  fotoUrl:     string | null
  categorias:  string[]
  distanciaKm: number | null
  tipo:        'INTERNO' | 'EXTERNO'
  telefone?:   string | null
  latitude?:   number | null
  longitude?:  number | null
}

type Coords = { lat: number; lng: number }
type Filtro = 'todas' | 'verificadas' | 'externas'

const LABELS: Record<string, string> = {
  MECANICA: 'Mecânica', ESTETICA: 'Estética', ELETRICA: 'Elétrica',
  MOTOR: 'Motor',       SUSPENSAO: 'Suspensão', PNEUS: 'Pneus',
}

const CHIPS: { valor: Filtro; label: string }[] = [
  { valor: 'todas',       label: 'Todas' },
  { valor: 'verificadas', label: 'Verificadas' },
  { valor: 'externas',    label: 'Não verificadas' },
]

export default function HomeMotorista() {
  const { user } = useAuth()
  const router   = useRouter()
  const insets   = useSafeAreaInsets()
  const { naoLidas } = useNotificacoes()

  const [oficinas,      setOficinas]      = useState<Oficina[]>([])
  const [loading,       setLoading]       = useState(true)
  const [refresh,       setRefresh]       = useState(false)
  const [busca,         setBusca]         = useState('')
  const [filtro,        setFiltro]        = useState<Filtro>('todas')
  const [coords,        setCoords]        = useState<Coords | null>(null)
  const [bairroAtual,   setBairroAtual]   = useState<string>('')
  const [locPermissao,  setLocPermissao]  = useState<'carregando' | 'ok' | 'negado'>('carregando')

  const carregar = useCallback(async (c?: Coords | null, isRefresh = false) => {
    if (isRefresh) setRefresh(true)
    const loc = c ?? coords
    const params: Record<string, string | number> = {}
    if (loc) { params.lat = loc.lat; params.lng = loc.lng }

    try {
      // Fase 1: só DB (~100ms) — exibe imediatamente
      const res1 = await api.get<{ oficinas: { data: Oficina[] } }>('/motorista/home', { ...params, externos: 'false' })
      setOficinas(res1.oficinas?.data ?? [])
      setLoading(false)
      setRefresh(false)
    } catch {
      setOficinas([])
      setLoading(false)
      setRefresh(false)
      return
    }

    // Fase 2: inclui externos OSM em background (só com localização)
    if (loc) {
      try {
        const res2 = await api.get<{ oficinas: { data: Oficina[] } }>('/motorista/home', params)
        setOficinas(res2.oficinas?.data ?? [])
      } catch {
        // mantém resultado da fase 1
      }
    }
  }, [coords])

  const pedirLocalizacao = useCallback(async () => {
    setLocPermissao('carregando')
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setLocPermissao('negado')
      carregar(null)
      return
    }
    setLocPermissao('ok')
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const c   = { lat: loc.coords.latitude, lng: loc.coords.longitude }
      setCoords(c)

      const [place] = await Location.reverseGeocodeAsync({
        latitude:  c.lat,
        longitude: c.lng,
      })
      if (place) {
        setBairroAtual(place.district ?? place.subregion ?? place.city ?? '')
      }

      carregar(c)
    } catch {
      carregar(null)
    }
  }, [carregar])

  useEffect(() => { pedirLocalizacao() }, [])

  const filtradas = useMemo(() => {
    let lista = oficinas
    if (filtro === 'verificadas') lista = lista.filter(o => o.tipo === 'INTERNO')
    else if (filtro === 'externas') lista = lista.filter(o => o.tipo === 'EXTERNO')
    if (!busca.trim()) return lista
    const q = busca.toLowerCase()
    return lista.filter(o =>
      o.nome.toLowerCase().includes(q) ||
      o.categorias.some(c => LABELS[c]?.toLowerCase().includes(q))
    )
  }, [oficinas, busca, filtro])

  function renderOficina({ item }: { item: Oficina }) {
    const externo = item.tipo === 'EXTERNO'

    function navegar() {
      if (externo) {
        router.push({
          pathname: '/(motorista)/oficina-externa',
          params: {
            nome:     item.nome,
            telefone: item.telefone ?? '',
            lat:      String(item.latitude ?? ''),
            lng:      String(item.longitude ?? ''),
          },
        })
      } else {
        router.push({ pathname: '/(motorista)/oficina/[id]', params: { id: item.id } })
      }
    }

    return (
      <TouchableOpacity
        style={s.card}
        activeOpacity={0.75}
        onPress={navegar}
        accessibilityRole="button"
        accessibilityLabel={`Ver detalhes de ${item.nome}`}
      >
        <View style={[s.foto, externo && s.fotoExterno]}>
          {!externo && item.fotoUrl
            ? <Image source={{ uri: item.fotoUrl }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : <Ionicons name="storefront-outline" size={28} color={externo ? Colors.textMuted : Colors.surface} />}
        </View>
        <View style={s.info}>
          <View style={s.nomeRow}>
            <Text style={s.nome} numberOfLines={1}>{item.nome}</Text>
            {externo ? (
              <View style={s.externoTag}>
                <Text style={s.externoTagTexto}>Não verificado</Text>
              </View>
            ) : (
              <View style={s.seloVerificado}>
                <Ionicons name="checkmark-circle" size={11} color={Colors.accent} />
                <Text style={s.seloTexto}>Verificado iTrusty</Text>
              </View>
            )}
          </View>
          <Text style={s.categorias} numberOfLines={1}>
            {item.categorias.length > 0
              ? item.categorias.map(c => LABELS[c] ?? c).join(' · ')
              : 'Oficina mecânica'}
          </Text>
          <Text style={s.distancia}>
            {item.distanciaKm !== null ? `${item.distanciaKm} km` : item.cidade ?? ''}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    )
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.localizacao} onPress={pedirLocalizacao} activeOpacity={0.7}>
          <Ionicons name="location" size={16} color={Colors.accent} />
          {locPermissao === 'carregando' ? (
            <ActivityIndicator size="small" color={Colors.accent} style={{ marginLeft: 4 }} />
          ) : (
            <Text style={s.locTexto} numberOfLines={1}>
              {locPermissao === 'negado' ? 'Localização desativada' : (bairroAtual || 'Localização atual')}
            </Text>
          )}
          <Ionicons name="chevron-down" size={14} color={Colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.sinoBotao}
          onPress={() => router.push('/(motorista)/notificacoes')}
          accessibilityLabel="Notificações"
        >
          <Ionicons name="notifications-outline" size={20} color={Colors.primary} />
          {naoLidas > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTexto}>{naoLidas > 9 ? '9+' : naoLidas}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text style={s.titulo}>Olá, {user?.name?.split(' ')[0]} 👋{'\n'}O que o seu carro precisa?</Text>

      {/* Busca */}
      <View style={s.buscaContainer}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={s.buscaIcon} />
        <TextInput
          style={s.buscaInput}
          placeholder="Buscar serviço ou oficina..."
          placeholderTextColor={Colors.textMuted}
          value={busca}
          onChangeText={setBusca}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Chips de filtro */}
      <View style={s.chipsRow}>
        {CHIPS.map(chip => (
          <TouchableOpacity
            key={chip.valor}
            style={[s.chip, filtro === chip.valor && s.chipAtivo]}
            onPress={() => setFiltro(chip.valor)}
            activeOpacity={0.7}
          >
            <Text style={[s.chipTexto, filtro === chip.valor && s.chipTextoAtivo]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      {loading ? (
        <View style={s.skeletonWrap}>
          {[0, 1, 2, 3].map(i => <SkeletonRow key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={o => o.id}
          renderItem={renderOficina}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.lista}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              onRefresh={() => carregar(undefined, true)}
              tintColor={Colors.accent}
            />
          }
          ListHeaderComponent={
            <Text style={s.contador}>
              {coords ? 'OFICINAS PRÓXIMAS' : 'OFICINAS'} · {filtradas.length}
            </Text>
          }
          ListEmptyComponent={
            <EmptyState
              icon="storefront-outline"
              titulo="Nenhuma oficina encontrada"
              descricao={busca ? 'Tente outro termo.' : 'Ainda não há oficinas cadastradas na plataforma.'}
              acaoLabel={busca ? 'Limpar busca' : undefined}
              onAcao={busca ? () => setBusca('') : undefined}
            />
          }
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  localizacao:    { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: '80%' },
  locTexto:       { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.primary, flexShrink: 1 },
  sinoBotao:      { width: 40, height: 40, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  badge:          { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: Colors.error, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.surface },
  badgeTexto:     { fontSize: 10, fontWeight: Typography.weight.bold, color: Colors.surface },
  titulo:         { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.lg, paddingHorizontal: Spacing.lg, lineHeight: Typography.size['2xl'] * 1.35 },
  buscaContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radii.full, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, paddingHorizontal: Spacing.base },
  buscaIcon:      { marginRight: Spacing.sm },
  buscaInput:     { flex: 1, fontSize: Typography.size.md, color: Colors.text, paddingVertical: Spacing.md },
  chipsRow:       { flexDirection: 'row', gap: Spacing.xs, paddingHorizontal: Spacing.lg, marginBottom: Spacing.base },
  chip:           { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radii.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface },
  chipAtivo:      { backgroundColor: Colors.accent, borderColor: Colors.accent },
  chipTexto:      { fontSize: Typography.size.sm, color: Colors.textSecondary, fontWeight: Typography.weight.medium },
  chipTextoAtivo: { color: Colors.surface },
  skeletonWrap:   { paddingHorizontal: Spacing.lg },
  lista:          { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  contador:       { fontSize: Typography.size.xs, color: Colors.textMuted, letterSpacing: 1, marginBottom: Spacing.md },
  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radii.lg, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
  foto:           { width: 68, height: 68, backgroundColor: Colors.primary, borderRadius: Radii.md, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md, overflow: 'hidden' },
  fotoExterno:    { backgroundColor: Colors.border },
  info:           { flex: 1, gap: 3 },
  nomeRow:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  nome:           { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.primary, flexShrink: 1 },
  externoTag:     { backgroundColor: Colors.background, borderRadius: Radii.full, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: Colors.border },
  externoTagTexto:{ fontSize: 9, color: Colors.textMuted, fontWeight: Typography.weight.medium },
  seloVerificado: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  seloTexto:      { fontSize: 9, color: Colors.accent, fontWeight: Typography.weight.semibold },
  categorias:     { fontSize: Typography.size.sm, color: Colors.textSecondary },
  distancia:      { fontSize: Typography.size.xs, color: Colors.textMuted },
})
