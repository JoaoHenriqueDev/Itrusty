import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Typography, Radii } from '../../constants/theme'

type Secao = { titulo: string; conteudo: string }

const SECOES: Secao[] = [
  {
    titulo: '1. Aceitação dos Termos',
    conteudo:
      'Ao acessar ou utilizar o aplicativo iTrusty, você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá usar nossos serviços. O uso continuado do aplicativo após alterações constitui aceitação dos novos termos.',
  },
  {
    titulo: '2. Descrição do Serviço',
    conteudo:
      'O iTrusty é uma plataforma que conecta motoristas a oficinas mecânicas cadastradas. A plataforma facilita o agendamento de serviços automotivos, mas não é responsável pela execução dos serviços prestados pelas oficinas. A responsabilidade pela qualidade dos serviços é integralmente das oficinas parceiras.',
  },
  {
    titulo: '3. Cadastro e Conta',
    conteudo:
      'Para utilizar o iTrusty, você deve criar uma conta fornecendo informações verdadeiras, precisas e completas. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta. Notifique-nos imediatamente em caso de uso não autorizado.',
  },
  {
    titulo: '4. Responsabilidades do Usuário',
    conteudo:
      'O usuário se compromete a: (a) fornecer informações verdadeiras no cadastro; (b) utilizar o aplicativo somente para fins legais; (c) não realizar ações que prejudiquem a plataforma ou outros usuários; (d) respeitar os horários e condições estabelecidos pelas oficinas no momento do agendamento; (e) não compartilhar suas credenciais de acesso.',
  },
  {
    titulo: '5. Cancelamentos e Reagendamentos',
    conteudo:
      'Cancelamentos devem ser realizados com antecedência mínima de 2 horas do horário agendado. Cancelamentos fora deste prazo podem estar sujeitos a penalidades conforme a política de cada oficina. O iTrusty reserva-se o direito de suspender contas com histórico excessivo de cancelamentos.',
  },
  {
    titulo: '6. Avaliações e Conteúdo',
    conteudo:
      'Os usuários podem deixar avaliações sobre os serviços prestados. As avaliações devem ser honestas, baseadas em experiências reais, e não conter conteúdo ofensivo, discriminatório ou falso. O iTrusty reserva-se o direito de remover avaliações que violem estas diretrizes.',
  },
  {
    titulo: '7. Propriedade Intelectual',
    conteudo:
      'Todo o conteúdo do aplicativo iTrusty, incluindo mas não se limitando a textos, gráficos, logos, ícones e imagens, é propriedade do iTrusty ou de seus licenciadores e está protegido por leis de propriedade intelectual. É proibida a reprodução sem autorização prévia por escrito.',
  },
  {
    titulo: '8. Limitação de Responsabilidade',
    conteudo:
      'O iTrusty não se responsabiliza por: (a) qualidade ou resultado dos serviços prestados pelas oficinas; (b) danos indiretos, incidentais ou consequenciais; (c) interrupções no serviço por manutenção, força maior ou falhas técnicas; (d) condutas de oficinas ou outros usuários da plataforma.',
  },
  {
    titulo: '9. Privacidade',
    conteudo:
      'O tratamento de seus dados pessoais é regido por nossa Política de Privacidade, que faz parte integrante destes Termos. Ao usar o aplicativo, você consente com a coleta e uso de seus dados conforme descrito na Política de Privacidade.',
  },
  {
    titulo: '10. Alterações nos Termos',
    conteudo:
      'O iTrusty reserva-se o direito de modificar estes termos a qualquer momento. Alterações substanciais serão comunicadas com antecedência mínima de 30 dias. O uso continuado do aplicativo após as alterações constitui aceitação dos novos termos.',
  },
  {
    titulo: '11. Lei Aplicável',
    conteudo:
      'Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer disputas decorrentes destes termos, com renúncia de qualquer outro, por mais privilegiado que seja.',
  },
]

export default function TermosOficina() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={s.voltarBtn} onPress={() => router.navigate('/(oficina)/perfil' as any)}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Termos de Uso</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.atualizacao}>Última atualização: maio de 2025</Text>

        <Text style={s.intro}>
          Leia atentamente estes Termos de Uso antes de utilizar o aplicativo iTrusty. Estes termos
          constituem um acordo legal entre você e a iTrusty Tecnologia Ltda.
        </Text>

        {SECOES.map((secao) => (
          <View key={secao.titulo} style={s.secao}>
            <Text style={s.secaoTitulo}>{secao.titulo}</Text>
            <Text style={s.secaoTexto}>{secao.conteudo}</Text>
          </View>
        ))}

        <View style={s.contatoCard}>
          <Ionicons name="mail-outline" size={18} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={s.contatoTitulo}>Dúvidas sobre os termos?</Text>
            <Text style={s.contatoTexto}>contato@itrusty.com.br</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.background },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.background },
  voltarBtn:      { width: 40, height: 40, borderRadius: Radii.sm, justifyContent: 'center', alignItems: 'center' },
  headerTitulo:   { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.text },
  scroll:         { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },

  atualizacao:    { fontSize: Typography.size.xs, color: Colors.textMuted, marginBottom: Spacing.base, fontStyle: 'italic' },
  intro:          { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl, backgroundColor: Colors.accentLight, borderRadius: Radii.md, padding: Spacing.base, borderLeftWidth: 3, borderLeftColor: Colors.accent },

  secao:          { marginBottom: Spacing.xl },
  secaoTitulo:    { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.text, marginBottom: Spacing.sm },
  secaoTexto:     { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 22 },

  contatoCard:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base, marginTop: Spacing.base },
  contatoTitulo:  { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.text },
  contatoTexto:   { fontSize: Typography.size.sm, color: Colors.accent, marginTop: 2 },
})
