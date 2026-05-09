import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useAuth } from '../../contexts/AuthContext'
import { Colors } from '../../constants/colors'

export default function HomeOficina() {
  const { user, signOut } = useAuth()

  return (
    <View style={s.container}>
      <View style={s.header}>
        <View>
          <Text style={s.ola}>Olá, {user?.name?.split(' ')[0]}</Text>
          <Text style={s.sub}>Painel da oficina</Text>
        </View>
        <TouchableOpacity onPress={signOut}>
          <Text style={s.sair}>Sair</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.titulo}>Em breve</Text>
      <Text style={s.desc}>O painel completo da oficina está sendo desenvolvido.</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 56, paddingHorizontal: 24 },
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  ola:       { fontSize: 18, fontWeight: '700', color: Colors.primary },
  sub:       { fontSize: 13, color: Colors.textLight },
  sair:      { fontSize: 14, color: Colors.accent },
  titulo:    { fontSize: 28, fontWeight: '800', color: Colors.primary, marginBottom: 8 },
  desc:      { fontSize: 15, color: Colors.textLight },
})
