import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'

export default function OficinaExterna() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { nome, telefone, lat, lng } = useLocalSearchParams<{
    nome:     string
    telefone: string
    lat:      string
    lng:      string
  }>()

  const latitude  = lat  ? parseFloat(lat)  : null
  const longitude = lng  ? parseFloat(lng)  : null
  const temMapa   = latitude !== null && longitude !== null
  const temTelefone = telefone && telefone !== 'null' && telefone !== ''

  function ligar() {
    if (temTelefone) Linking.openURL(`tel:${telefone}`)
  }

  function abrirRota() {
    if (!temMapa) return
    const url = Platform.select({
      ios:     `maps://app?daddr=${latitude},${longitude}`,
      android: `google.navigation:q=${latitude},${longitude}`,
    })
    if (url) Linking.openURL(url)
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
        <Ionicons name="arrow-back" size={20} color={Colors.primary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}>
        {/* Foto placeholder */}
        <View style={s.fotoBanner}>
          <Ionicons name="storefront-outline" size={52} color="rgba(255,255,255,0.25)" />
        </View>

        <View style={s.content}>
          {/* Badge não verificado */}
          <View style={s.badge}>
            <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} />
            <Text style={s.badgeTexto}>Encontrada na região · não cadastrada</Text>
          </View>

          <Text style={s.nome}>{nome}</Text>

          {/* Ações */}
          <View style={s.acoesRow}>
            {temTelefone && (
              <TouchableOpacity style={s.acaoBtn} onPress={ligar} activeOpacity={0.75}>
                <Ionicons name="call" size={18} color={Colors.accent} />
                <Text style={s.acaoBtnTexto}>Ligar</Text>
              </TouchableOpacity>
            )}
            {temMapa && (
              <TouchableOpacity style={s.acaoBtn} onPress={abrirRota} activeOpacity={0.75}>
                <Ionicons name="navigate" size={18} color={Colors.accent} />
                <Text style={s.acaoBtnTexto}>Rota</Text>
              </TouchableOpacity>
            )}
          </View>

          {temTelefone && (
            <View style={s.card}>
              <Ionicons name="call-outline" size={16} color={Colors.accent} />
              <Text style={s.cardTexto}>{telefone}</Text>
            </View>
          )}

          {/* Mapa */}
          {temMapa && (
            <View style={s.mapaContainer}>
              <MapView
                style={s.mapa}
                provider={PROVIDER_DEFAULT}
                region={{ latitude: latitude!, longitude: longitude!, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
              >
                <Marker coordinate={{ latitude: latitude!, longitude: longitude! }} title={nome} pinColor={Colors.primary} />
              </MapView>
            </View>
          )}

          {/* CTA */}
          <View style={s.ctaCard}>
            <Ionicons name="storefront-outline" size={22} color={Colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={s.ctaTitulo}>Você é o dono desta oficina?</Text>
              <Text style={s.ctaTexto}>Cadastre-se no iTrusty para receber agendamentos, gerenciar sua agenda e aparecer em destaque para os motoristas.</Text>
            </View>
          </View>

          {/* Atribuição OSM */}
          <Text style={s.atribuicao}>Dados: © OpenStreetMap contributors</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  backBtn:      { position: 'absolute', top: 56, left: Spacing.lg, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center', ...Shadows.md },
  fotoBanner:   { width: '100%', height: 180, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  content:      { padding: Spacing.lg },
  badge:        { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: Colors.surfaceMuted ?? Colors.background, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm },
  badgeTexto:   { fontSize: Typography.size.xs, color: Colors.textMuted },
  nome:         { fontSize: Typography.size['2xl'], fontWeight: Typography.weight.extrabold, color: Colors.primary, marginBottom: Spacing.base },
  acoesRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.base },
  acaoBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, borderWidth: 1.5, borderColor: Colors.accent, borderRadius: Radii.md, paddingVertical: Spacing.sm },
  acaoBtnTexto: { color: Colors.accent, fontWeight: Typography.weight.semibold, fontSize: Typography.size.sm },
  card:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginBottom: Spacing.base },
  cardTexto:    { fontSize: Typography.size.sm, color: Colors.textSecondary },
  mapaContainer:{ borderRadius: Radii.lg, overflow: 'hidden', marginBottom: Spacing.base, borderWidth: 1, borderColor: Colors.border },
  mapa:         { width: '100%', height: 180 },
  ctaCard:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, backgroundColor: Colors.accentLight, borderRadius: Radii.lg, padding: Spacing.base, borderWidth: 1, borderColor: Colors.accent + '30', marginBottom: Spacing.lg },
  ctaTitulo:    { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.primary, marginBottom: 4 },
  ctaTexto:     { fontSize: Typography.size.xs, color: Colors.textSecondary, lineHeight: Typography.size.xs * 1.7 },
  atribuicao:   { fontSize: Typography.size.xs, color: Colors.textMuted, textAlign: 'center' },
})
