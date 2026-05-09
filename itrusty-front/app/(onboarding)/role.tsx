import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Colors } from '../../constants/colors'

export default function Role() {
  const [selecionado, setSelecionado] = useState<'MOTORISTA' | 'OFICINA' | null>(null)
  const router = useRouter()

  function continuar() {
    if (!selecionado) return
    if (selecionado === 'MOTORISTA') router.push('/(onboarding)/motorista')
    else router.push('/(onboarding)/oficina')
  }

  return (
    <View style={s.container}>
      <Image source={require('../../assets/logo.png')} style={s.logo} resizeMode="contain" />
      <Text style={s.titulo}>Você é{'\n'}motorista ou{'\n'}<Text style={s.destaque}>oficina</Text>?</Text>

      <TouchableOpacity
        style={[s.card, selecionado === 'MOTORISTA' && s.cardSelecionado]}
        onPress={() => setSelecionado('MOTORISTA')}
      >
        <View style={[s.icone, selecionado === 'MOTORISTA' && s.iconeSelecionado]}>
          <Text style={s.iconeEmoji}>🚗</Text>
        </View>
        <View style={s.cardTexto}>
          <Text style={[s.cardTitulo, selecionado === 'MOTORISTA' && s.cardTituloBranco]}>Sou motorista</Text>
          <Text style={[s.cardSub, selecionado === 'MOTORISTA' && s.cardSubBranco]}>Quero achar uma oficina de confiança e agendar.</Text>
        </View>
        <Text style={[s.seta, selecionado === 'MOTORISTA' && s.setaBranca]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.card, selecionado === 'OFICINA' && s.cardSelecionado]}
        onPress={() => setSelecionado('OFICINA')}
      >
        <View style={[s.icone, selecionado === 'OFICINA' && s.iconeSelecionado]}>
          <Text style={s.iconeEmoji}>🔧</Text>
        </View>
        <View style={s.cardTexto}>
          <Text style={[s.cardTitulo, selecionado === 'OFICINA' && s.cardTituloBranco]}>Tenho uma oficina</Text>
          <Text style={[s.cardSub, selecionado === 'OFICINA' && s.cardSubBranco]}>Quero gerenciar minha agenda e atender mais clientes.</Text>
        </View>
        <Text style={[s.seta, selecionado === 'OFICINA' && s.setaBranca]}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.botao, !selecionado && s.botaoDisabled]}
        onPress={continuar}
        disabled={!selecionado}
      >
        <Text style={s.botaoTexto}>Continuar →</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: Colors.background, padding: 24, paddingTop: 60 },
  logo:             { width: 80, height: 60, marginBottom: 24 },
  titulo:           { fontSize: 36, fontWeight: '800', color: Colors.primary, marginBottom: 32 },
  destaque:         { color: Colors.accent },
  card:             { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardSelecionado:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  icone:            { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.lightGray, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  iconeSelecionado: { backgroundColor: Colors.accent },
  iconeEmoji:       { fontSize: 22 },
  cardTexto:        { flex: 1 },
  cardTitulo:       { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  cardTituloBranco: { color: Colors.white },
  cardSub:          { fontSize: 13, color: Colors.textLight },
  cardSubBranco:    { color: '#CBD5E0' },
  seta:             { fontSize: 24, color: Colors.gray },
  setaBranca:       { color: Colors.white },
  botao:            { backgroundColor: Colors.accent, borderRadius: 50, padding: 18, alignItems: 'center', marginTop: 'auto' },
  botaoDisabled:    { opacity: 0.4 },
  botaoTexto:       { color: Colors.white, fontWeight: '700', fontSize: 16 },
})
