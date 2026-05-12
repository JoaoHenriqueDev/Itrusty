import { createContext, useCallback, useContext, useState } from 'react'
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { ReactNode } from 'react'
import { Colors, Radii, Shadows, Spacing, Typography } from '../../constants/theme'

type Estilo = 'default' | 'cancel' | 'destructive'

type Botao = {
  texto: string
  estilo?: Estilo
  onPress?: () => void
}

type Config = {
  titulo: string
  mensagem: string
  botoes: Botao[]
}

type AppAlertContextType = {
  alert: (titulo: string, mensagem: string, onOk?: () => void) => void
  confirm: (
    titulo: string,
    mensagem: string,
    onConfirm: () => void,
    opcoes?: { confirmText?: string; cancelText?: string; destructive?: boolean }
  ) => void
}

const Ctx = createContext<AppAlertContextType | null>(null)

export function AppAlertProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null)

  const fechar = useCallback(() => setConfig(null), [])

  const alert = useCallback((titulo: string, mensagem: string, onOk?: () => void) => {
    setConfig({ titulo, mensagem, botoes: [{ texto: 'Ok', estilo: 'default', onPress: onOk }] })
  }, [])

  const confirm = useCallback((
    titulo: string,
    mensagem: string,
    onConfirm: () => void,
    opcoes?: { confirmText?: string; cancelText?: string; destructive?: boolean }
  ) => {
    setConfig({
      titulo,
      mensagem,
      botoes: [
        { texto: opcoes?.cancelText ?? 'Cancelar', estilo: 'cancel' },
        {
          texto: opcoes?.confirmText ?? 'Confirmar',
          estilo: opcoes?.destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ],
    })
  }, [])

  return (
    <Ctx.Provider value={{ alert, confirm }}>
      {children}
      <Modal
        visible={config !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={fechar}
      >
        <View style={s.backdrop}>
          <View style={s.card}>
            <Text style={s.titulo}>{config?.titulo}</Text>
            <Text style={s.mensagem}>{config?.mensagem}</Text>

            <View style={[s.botoes, config?.botoes.length === 1 && s.botoesUnico]}>
              {config?.botoes.map((b, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    s.botao,
                    config.botoes.length > 1 && s.botaoFlex,
                    b.estilo === 'cancel'      && s.botaoCancel,
                    b.estilo === 'default'     && s.botaoDefault,
                    b.estilo === 'destructive' && s.botaoDestructive,
                  ]}
                  onPress={() => { fechar(); b.onPress?.() }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    s.botaoTexto,
                    b.estilo === 'cancel'      && s.botaoTextoCancel,
                    b.estilo === 'destructive' && s.botaoTextoWhite,
                    b.estilo === 'default'     && s.botaoTextoWhite,
                  ]}>
                    {b.texto}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </Ctx.Provider>
  )
}

export function useAppAlert() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppAlert deve ser usado dentro de AppAlertProvider')
  return ctx
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  titulo: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.extrabold,
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  mensagem: {
    fontSize: Typography.size.md,
    color: Colors.textSecondary,
    lineHeight: Typography.size.md * 1.6,
    marginBottom: Spacing.xl,
  },
  botoes:      { flexDirection: 'row', gap: Spacing.sm },
  botoesUnico: { flexDirection: 'column' },
  botao:       { paddingVertical: Spacing.md, borderRadius: Radii.full, alignItems: 'center', justifyContent: 'center' },
  botaoFlex:   { flex: 1 },
  botaoDefault:     { backgroundColor: Colors.accent },
  botaoDestructive: { backgroundColor: Colors.error },
  botaoCancel:      { borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  botaoTexto:       { fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
  botaoTextoWhite:  { color: Colors.surface },
  botaoTextoCancel: { color: Colors.text },
})
