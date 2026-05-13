import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Typography, Radii } from '../../constants/theme'

type Secao = { titulo: string; icone: keyof typeof Ionicons.glyphMap; conteudo: string }

const SECOES: Secao[] = [
  {
    titulo: 'Dados que coletamos',
    icone: 'document-text-outline',
    conteudo:
      'Coletamos informações fornecidas por você ao criar a conta (nome, e-mail), dados de uso do aplicativo (agendamentos, serviços cadastrados), informações do dispositivo (modelo, sistema operacional, identificador) e dados de localização aproximada para exibir oficinas próximas.',
  },
  {
    titulo: 'Como usamos seus dados',
    icone: 'settings-outline',
    conteudo:
      'Seus dados são usados para: (a) operar e melhorar a plataforma; (b) enviar notificações sobre agendamentos; (c) personalizar sua experiência; (d) gerar relatórios agregados e anônimos; (e) cumprir obrigações legais. Não vendemos seus dados pessoais a terceiros.',
  },
  {
    titulo: 'Compartilhamento de dados',
    icone: 'share-outline',
    conteudo:
      'Compartilhamos dados apenas com: (a) oficinas, quando você realiza um agendamento (nome e contato); (b) parceiros de infraestrutura (Supabase, servidores em nuvem) sob acordos de confidencialidade; (c) autoridades competentes quando exigido por lei.',
  },
  {
    titulo: 'Segurança dos dados',
    icone: 'shield-outline',
    conteudo:
      'Adotamos medidas técnicas e organizacionais para proteger seus dados: criptografia em trânsito (TLS 1.3), armazenamento seguro, controle de acesso baseado em funções, e monitoramento contínuo. Nenhum sistema é 100% seguro; em caso de incidente, você será notificado conforme exigido pela LGPD.',
  },
  {
    titulo: 'Seus direitos (LGPD)',
    icone: 'person-outline',
    conteudo:
      'Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a: confirmar a existência de tratamento; acessar seus dados; corrigir dados incompletos ou inexatos; solicitar anonimização ou exclusão; portabilidade dos dados; revogar consentimento a qualquer momento.',
  },
  {
    titulo: 'Retenção de dados',
    icone: 'time-outline',
    conteudo:
      'Mantemos seus dados enquanto sua conta estiver ativa ou pelo período necessário para cumprir obrigações legais. Após a exclusão da conta, os dados são removidos em até 30 dias, exceto quando a retenção é exigida por lei (ex.: registros fiscais por 5 anos).',
  },
  {
    titulo: 'Cookies e rastreamento',
    icone: 'eye-outline',
    conteudo:
      'O aplicativo pode usar identificadores de dispositivo e tecnologias similares para fins analíticos e de melhoria da experiência. Esses dados são processados de forma agregada e não identificam você individualmente. Você pode limitar o rastreamento nas configurações do seu dispositivo.',
  },
  {
    titulo: 'Alterações nesta política',
    icone: 'refresh-outline',
    conteudo:
      'Podemos atualizar esta Política periodicamente. Alterações significativas serão comunicadas por notificação no aplicativo com pelo menos 15 dias de antecedência. A data da última atualização é sempre exibida no topo desta página.',
  },
  {
    titulo: 'Contato e DPO',
    icone: 'mail-outline',
    conteudo:
      'Para exercer seus direitos ou tirar dúvidas sobre privacidade, entre em contato com nosso Encarregado de Dados (DPO) pelo e-mail: privacidade@itrusty.com.br. Responderemos em até 15 dias úteis.',
  },
]

export default function PrivacidadeOficina() {
  const insets = useSafeAreaInsets()
  const router = useRouter()

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={s.voltarBtn} onPress={() => router.navigate('/(oficina)/perfil' as any)}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Política de Privacidade</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.atualizacao}>Última atualização: maio de 2025</Text>

        <View style={s.lgpdBadge}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
          <Text style={s.lgpdTexto}>Em conformidade com a LGPD (Lei nº 13.709/2018)</Text>
        </View>

        <Text style={s.intro}>
          Sua privacidade é fundamental para nós. Esta política explica quais dados coletamos, como
          os utilizamos e quais são seus direitos.
        </Text>

        {SECOES.map((secao, idx) => (
          <View key={secao.titulo} style={s.secao}>
            <View style={s.secaoHeader}>
              <View style={s.secaoNumero}>
                <Text style={s.secaoNumeroTexto}>{idx + 1}</Text>
              </View>
              <View style={s.secaoIcone}>
                <Ionicons name={secao.icone} size={16} color={Colors.accent} />
              </View>
              <Text style={s.secaoTitulo}>{secao.titulo}</Text>
            </View>
            <Text style={s.secaoTexto}>{secao.conteudo}</Text>
          </View>
        ))}

        <View style={s.contatoCard}>
          <Ionicons name="mail-outline" size={20} color={Colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={s.contatoTitulo}>Contato DPO</Text>
            <Text style={s.contatoTexto}>privacidade@itrusty.com.br</Text>
            <Text style={s.contatoSub}>Resposta em até 15 dias úteis</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: Colors.background },
  header:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.background },
  voltarBtn:       { width: 40, height: 40, borderRadius: Radii.sm, justifyContent: 'center', alignItems: 'center' },
  headerTitulo:    { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.text },
  scroll:          { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },

  atualizacao:     { fontSize: Typography.size.xs, color: Colors.textMuted, marginBottom: Spacing.sm, fontStyle: 'italic' },
  lgpdBadge:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, backgroundColor: Colors.successLight, borderRadius: Radii.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, alignSelf: 'flex-start', marginBottom: Spacing.base },
  lgpdTexto:       { fontSize: Typography.size.xs, color: Colors.success, fontWeight: Typography.weight.semibold },
  intro:           { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },

  secao:           { marginBottom: Spacing.xl, backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.base },
  secaoHeader:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  secaoNumero:     { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  secaoNumeroTexto:{ fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.surface },
  secaoIcone:      { width: 28, height: 28, borderRadius: Radii.xs, backgroundColor: Colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  secaoTitulo:     { flex: 1, fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.text },
  secaoTexto:      { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 22 },

  contatoCard:     { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.base, backgroundColor: Colors.accentLight, borderRadius: Radii.lg, padding: Spacing.base, marginTop: Spacing.base, borderWidth: 1, borderColor: `${Colors.accent}30` },
  contatoTitulo:   { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.text },
  contatoTexto:    { fontSize: Typography.size.sm, color: Colors.accent, fontWeight: Typography.weight.semibold, marginTop: 2 },
  contatoSub:      { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
})
