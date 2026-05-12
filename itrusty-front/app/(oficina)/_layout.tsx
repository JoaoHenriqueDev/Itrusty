import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Typography } from '../../constants/theme'

type IconName = keyof typeof Ionicons.glyphMap

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index',   title: 'Início',   icon: 'home-outline',     iconActive: 'home'          },
  { name: 'agenda',  title: 'Agenda',   icon: 'calendar-outline', iconActive: 'calendar'      },
  { name: 'servicos',title: 'Serviços', icon: 'list-outline',     iconActive: 'list'          },
  { name: 'perfil',  title: 'Perfil',   icon: 'person-outline',   iconActive: 'person'        },
]

export default function OficinaLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor:   Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor:  Colors.border,
          borderTopWidth:  1,
          paddingBottom:   8,
          paddingTop:      8,
          height:          64,
        },
        tabBarLabelStyle: {
          fontSize:   Typography.size.xs,
          fontWeight: Typography.weight.medium,
        },
      }}
    >
      {TABS.map(({ name, title, icon, iconActive }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? iconActive : icon} size={24} color={color} />
            ),
          }}
        />
      ))}

      {/* Telas de detalhe — sem tab */}
      <Tabs.Screen name="faturamento"       options={{ href: null }} />
      <Tabs.Screen name="avaliacoes"        options={{ href: null }} />
      <Tabs.Screen name="agendamento/[id]" options={{ href: null }} />
      <Tabs.Screen name="servico/[id]"     options={{ href: null }} />
      <Tabs.Screen name="conta"            options={{ href: null }} />
      <Tabs.Screen name="editar-perfil"    options={{ href: null }} />
      <Tabs.Screen name="notificacoes"     options={{ href: null }} />
      <Tabs.Screen name="ajuda"            options={{ href: null }} />
      <Tabs.Screen name="sobre"            options={{ href: null }} />
      <Tabs.Screen name="termos"           options={{ href: null }} />
      <Tabs.Screen name="privacidade"      options={{ href: null }} />
    </Tabs>
  )
}
