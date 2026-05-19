import { TamaguiProvider, type TamaguiProviderProps, Theme } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../tamagui.config'
import { CurrentToast } from './CurrentToast'
import { ThemeProvider, useAppTheme } from './ThemeContext'

const queryClient = new QueryClient()

export function AppProvider({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>) {
  return (
    <ThemeProvider>
      <TamaguiInner {...rest}>{children}</TamaguiInner>
    </ThemeProvider>
  )
}

function TamaguiInner({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'>) {
  const { resolved } = useAppTheme()

  return (
    <TamaguiProvider config={config} defaultTheme={resolved} {...rest}>
      <Theme name={resolved}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider swipeDirection="horizontal" duration={6000} native={[]}>
            {children}
            <CurrentToast />
            <ToastViewport bottom="$8" left={0} right={0} />
          </ToastProvider>
        </QueryClientProvider>
      </Theme>
    </TamaguiProvider>
  )
}
