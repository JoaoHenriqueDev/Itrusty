import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors, Spacing, Typography, Radii, Shadows } from '../../constants/theme'

type Faq = { pergunta: string; resposta: string }
type Categoria = { titulo: string; icone: keyof typeof Ionicons.glyphMap; itens: Faq[] }

const CATEGORIAS: Categoria[] = [
  {
    titulo: 'Conta e Perfil',
    icone: 'person-circle-outline',
    itens: [
      {
        pergunta: 'Como altero os dados da minha oficina?',
        resposta: 'VÃ¡ em Perfil â†’ Dados da oficina. VocÃª pode editar o nome, foto, endereÃ§o e horÃ¡rios de funcionamento.',
      },
      {
        pergunta: 'Como adiciono ou altero a foto da minha oficina?',
        resposta: 'Na tela de Dados da oficina, toque no banner de foto no topo da pÃ¡gina para selecionar uma imagem da sua galeria.',
      },
      {
        pergunta: 'Como altero minha senha?',
        resposta: 'Atualmente a autenticaÃ§Ã£o Ã© gerenciada pelo provedor de login (Google/Apple). Para alterar a senha, acesse as configuraÃ§Ãµes da sua conta Google ou Apple ID.',
      },
    ],
  },
  {
    titulo: 'ServiÃ§os',
    icone: 'construct-outline',
    itens: [
      {
        pergunta: 'Como adiciono um novo serviÃ§o?',
        resposta: 'VÃ¡ em Perfil â†’ Gerenciar serviÃ§os â†’ botÃ£o "+" no canto superior. Preencha o nome, preÃ§o e tempo estimado do serviÃ§o.',
      },
      {
        pergunta: 'Posso desativar um serviÃ§o temporariamente?',
        resposta: 'Sim. Na lista de serviÃ§os, utilize o toggle ao lado de cada serviÃ§o para ativÃ¡-lo ou desativÃ¡-lo sem precisar excluÃ­-lo.',
      },
      {
        pergunta: 'Como excluo um serviÃ§o?',
        resposta: 'Toque no serviÃ§o para abrir os detalhes, role atÃ© o final e selecione "Excluir serviÃ§o". A aÃ§Ã£o Ã© permanente e nÃ£o pode ser desfeita.',
      },
    ],
  },
  {
    titulo: 'Agenda e Agendamentos',
    icone: 'calendar-outline',
    itens: [
      {
        pergunta: 'Como confirmo um agendamento?',
        resposta: 'Na aba Agenda, toque no agendamento e selecione "Confirmar". O motorista serÃ¡ notificado automaticamente.',
      },
      {
        pergunta: 'Como cancelo um agendamento?',
        resposta: 'Abra o agendamento na aba Agenda e selecione "Cancelar". Informe o motivo para que o cliente seja notificado corretamente.',
      },
      {
        pergunta: 'Posso definir horÃ¡rios diferentes para cada dia?',
        resposta: 'Sim. Em Perfil â†’ HorÃ¡rios de funcionamento, vocÃª pode configurar horÃ¡rios de abertura e fechamento separadamente para dias Ãºteis, sÃ¡bado e domingo.',
      },
    ],
  },
  {
    titulo: 'Suporte TÃ©cnico',
    icone: 'settings-outline',
    itens: [
      {
        pergunta: 'O aplicativo nÃ£o estÃ¡ carregando. O que fazer?',
        resposta: 'Verifique sua conexÃ£o com a internet. Se o problema persistir, feche e abra o aplicativo novamente. Caso continue, entre em contato com nosso suporte.',
      },
      {
        pergunta: 'Meus dados nÃ£o foram salvos. O que aconteceu?',
        resposta: 'Certifique-se de que vocÃª tem conexÃ£o com a internet ao salvar alteraÃ§Ãµes. Se o problema persistir, entre em contato com o suporte informando o que tentou fazer.',
      },
    ],
  },
]

export default function AjudaOficina() {
  const insets  = useSafeAreaInsets()
  const router  = useRouter()
  const [busca, setBusca]           = useState('')
  const [abertos, setAbertos]       = useState<Set<string>>(new Set())

  function toggleItem(key: string) {
    setAbertos(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const categoriasFiltradas = busca.trim()
    ? CATEGORIAS.map(cat => ({
        ...cat,
        itens: cat.itens.filter(
          it =>
            it.pergunta.toLowerCase().includes(busca.toLowerCase()) ||
            it.resposta.toLowerCase().includes(busca.toLowerCase())
        ),
      })).filter(cat => cat.itens.length > 0)
    : CATEGORIAS

  return (
    <View style={[s.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity style={s.voltarBtn} onPress={() => router.navigate('/(oficina)/perfil' as any)}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitulo}>Central de Ajuda</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Busca */}
        <View style={s.buscaContainer}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={s.buscaInput}
            placeholder="Buscar dÃºvidas..."
            placeholderTextColor={Colors.textMuted}
            value={busca}
            onChangeText={setBusca}
          />
          {busca.length > 0 && (
            <TouchableOpacity onPress={() => setBusca('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* FAQs */}
        {categoriasFiltradas.map(cat => (
          <View key={cat.titulo} style={s.categoriaBloco}>
            <View style={s.categoriaHeader}>
              <Ionicons name={cat.icone} size={18} color={Colors.accent} />
              <Text style={s.categoriaTitulo}>{cat.titulo}</Text>
            </View>

            <View style={s.card}>
              {cat.itens.map((item, idx) => {
                const key = `${cat.titulo}-${idx}`
                const aberto = abertos.has(key)
                return (
                  <View key={key}>
                    {idx > 0 && <View style={s.divider} />}
                    <TouchableOpacity
                      style={s.faqLinha}
                      onPress={() => toggleItem(key)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.pergunta} numberOfLines={aberto ? undefined : 2}>
                        {item.pergunta}
                      </Text>
                      <Ionicons
                        name={aberto ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={Colors.textMuted}
                        style={{ flexShrink: 0 }}
                      />
                    </TouchableOpacity>
                    {aberto && (
                      <View style={s.respostaContainer}>
                        <Text style={s.resposta}>{item.resposta}</Text>
                      </View>
                    )}
                  </View>
                )
              })}
            </View>
          </View>
        ))}

        {categoriasFiltradas.length === 0 && (
          <View style={s.semResultados}>
            <Ionicons name="search-outline" size={40} color={Colors.border} />
            <Text style={s.semResultadosTexto}>Nenhum resultado encontrado</Text>
            <Text style={s.semResultadosSub}>Tente outras palavras ou entre em contato com o suporte</Text>
          </View>
        )}

        {/* Suporte */}
        <View style={s.suporteCard}>
          <View style={s.suporteIcone}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.suporteTitulo}>NÃ£o encontrou o que procurava?</Text>
            <Text style={s.suporteSub}>Nossa equipe estÃ¡ disponÃ­vel de segunda a sexta, das 8h Ã s 18h</Text>
          </View>
        </View>

        <TouchableOpacity style={s.contatoBtn} activeOpacity={0.8}>
          <Ionicons name="mail-outline" size={18} color={Colors.surface} />
          <Text style={s.contatoBtnTexto}>Falar com o suporte</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container:           { flex: 1, backgroundColor: Colors.background },
  header:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, backgroundColor: Colors.background },
  voltarBtn:           { width: 40, height: 40, borderRadius: Radii.sm, justifyContent: 'center', alignItems: 'center' },
  headerTitulo:        { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.text },
  scroll:              { paddingHorizontal: Spacing.lg, paddingBottom: Spacing['3xl'] },

  buscaContainer:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radii.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm + 2, marginBottom: Spacing.xl, ...Shadows.sm },
  buscaInput:          { flex: 1, fontSize: Typography.size.md, color: Colors.text },

  categoriaBloco:      { marginBottom: Spacing.xl },
  categoriaHeader:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  categoriaTitulo:     { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textSecondary },

  card:                { backgroundColor: Colors.surface, borderRadius: Radii.lg, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm },
  divider:             { height: 1, backgroundColor: Colors.borderLight },
  faqLinha:            { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingHorizontal: Spacing.base, paddingVertical: Spacing.base },
  pergunta:            { flex: 1, fontSize: Typography.size.md, fontWeight: Typography.weight.medium, color: Colors.text, lineHeight: 22 },
  respostaContainer:   { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base },
  resposta:            { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 21 },

  semResultados:       { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  semResultadosTexto:  { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.text },
  semResultadosSub:    { fontSize: Typography.size.sm, color: Colors.textMuted, textAlign: 'center' },

  suporteCard:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.base, backgroundColor: Colors.accentLight, borderRadius: Radii.lg, padding: Spacing.base, marginBottom: Spacing.md },
  suporteIcone:        { width: 44, height: 44, borderRadius: Radii.md, backgroundColor: 'rgba(249,115,22,0.12)', justifyContent: 'center', alignItems: 'center' },
  suporteTitulo:       { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.text, marginBottom: 2 },
  suporteSub:          { fontSize: Typography.size.xs, color: Colors.textSecondary, lineHeight: 18 },
  contatoBtn:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.accent, borderRadius: Radii.full, paddingVertical: Spacing.md, ...Shadows.sm },
  contatoBtnTexto:     { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.surface },
})
