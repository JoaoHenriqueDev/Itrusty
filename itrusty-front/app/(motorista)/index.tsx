import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, TextInput
} from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'
import { Colors } from '../../constants/colors'

type Oficina = {
  id: string
  nome: string
  bairro: string | null
  cidade: string | null
  fotoUrl: string | null
  categorias: string[]
  distanciaKm: number | null
}

const LABELS: Record<string, string> = {
  MECANICA: 'Mecânica', ESTETICA: 'Estética', ELETRICA: 'Elétrica',
  MOTOR: 'Motor', SUSPENSAO: 'Suspensão', PNEUS: 'Pneus'
}

export default function HomeMotorista() {
  const { user, signOut } = useAuth()
  const [oficinas, setOficinas] = useState<Oficina[]>([])
  const [loading, setLoading]   = useState(true)
  const [busca, setBusca]       = useState('')

  useEffect(() => {
    carregarOficinas()
  }, [])

  async function carregarOficinas() {
    try {
      const res = await api.get<{ oficinas: Oficina[] }>('/motorista/home')
      setOficinas(res.oficinas)
    } catch {
      // silencioso — lista fica vazia
    } finally {
      setLoading(false)
    }
  }

  const filtradas = oficinas.filter(o =>
    o.nome.toLowerCase().includes(busca.toLowerCase()) ||
    o.categorias.some(c => LABELS[c]?.toLowerCase().includes(busca.toLowerCase()))
  )

  function renderOficina({ item }: { item: Oficina }) {
    return (
      <TouchableOpacity style={s.card}>
        <View style={s.foto}>
          <Text style={s.fotoTexto}>foto</Text>
        </View>
        <View style={s.info}>
          <Text style={s.nome}>{item.nome}</Text>
          <Text style={s.categoriaTexto}>
            {item.categorias.map(c => LABELS[c] ?? c).join(' • ')}
          </Text>
          <Text style={s.distancia}>
            {item.distanciaKm !== null ? `${item.distanciaKm} KM` : item.cidade ?? ''}
            {item.distanciaKm !== null && item.cidade ? ` • ${item.cidade}` : ''}
          </Text>
        </View>
        <Text style={s.seta}>›</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.ola}>Olá, {user?.name?.split(' ')[0]}</Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text style={s.sair}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.titulo}>O que o seu{'\n'}carro precisa hoje?</Text>

      <TextInput
        style={s.busca}
        placeholder="Buscar serviço, oficina"
        placeholderTextColor={Colors.gray}
        value={busca}
        onChangeText={setBusca}
      />

      {loading ? (
        <ActivityIndicator size="large" color={Colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <>
          <Text style={s.contador}>OFICINAS PRÓXIMAS · {filtradas.length}</Text>
          <FlatList
            data={filtradas}
            keyExtractor={o => o.id}
            renderItem={renderOficina}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={s.vazio}>Nenhuma oficina encontrada</Text>
            }
          />
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background, paddingTop: 56, paddingHorizontal: 20 },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  ola:            { fontSize: 16, color: Colors.textLight },
  sair:           { fontSize: 14, color: Colors.accent },
  titulo:         { fontSize: 28, fontWeight: '800', color: Colors.primary, marginBottom: 20 },
  busca:          { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 14, fontSize: 14, color: Colors.text, marginBottom: 20 },
  contador:       { fontSize: 11, color: Colors.gray, letterSpacing: 1, marginBottom: 12 },
  card:           { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  foto:           { width: 72, height: 72, backgroundColor: Colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  fotoTexto:      { color: Colors.white, fontSize: 12 },
  info:           { flex: 1 },
  nome:           { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  categoriaTexto: { fontSize: 12, color: Colors.textLight, marginBottom: 4 },
  distancia:      { fontSize: 12, color: Colors.gray },
  seta:           { fontSize: 24, color: Colors.gray },
  vazio:          { textAlign: 'center', color: Colors.gray, marginTop: 40 },
})
