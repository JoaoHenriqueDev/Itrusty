import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Typography } from '../../constants/theme'

type IconName = keyof typeof Ionicons.glyphMap

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index',        title: 'Início',       icon: 'home-outline',     iconActive: 'home'          },
  { name: 'agendamentos', title: 'Agendamentos',  icon: 'calendar-outline', iconActive: 'calendar'      },
  { name: 'perfil',       title: 'Perfil',        icon: 'person-outline',   iconActive: 'person'        },
]

export default function MotoristaLayout() {
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
      <Tabs.Screen name="oficina/[id]"      options={{ href: null }} />
      <Tabs.Screen name="oficina-externa"   options={{ href: null }} />
      <Tabs.Screen name="agendar/[id]"   options={{ href: null }} />
      <Tabs.Screen name="notificacoes"   options={{ href: null }} />
      <Tabs.Screen name="editar-perfil"  options={{ href: null }} />
      <Tabs.Screen name="meus-veiculos"  options={{ href: null }} />
    </Tabs>
  )
}
