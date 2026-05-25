import { ClerkProvider } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import { TamaguiProvider, type TamaguiProviderProps, Theme } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '../tamagui.config'
import { AuthCacheBridge } from './AuthCacheBridge'
import { CurrentToast } from './CurrentToast'
import { LanguageProvider } from './LanguageContext'
import { ThemeProvider, useAppTheme } from './ThemeContext'

const queryClient = new QueryClient()

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''

export function AppProvider({ children, ...rest }: Omit<TamaguiProviderProps, 'config'>) {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <LanguageProvider>
        <ThemeProvider>
          <TamaguiInner {...rest}>{children}</TamaguiInner>
        </ThemeProvider>
      </LanguageProvider>
    </ClerkProvider>
  )
}

function TamaguiInner({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config'>) {
  const { resolved } = useAppTheme()

  // Tamagui only re-renders the tree when the active theme on its provider
  // changes. `defaultTheme` is read once on mount; the reactive prop is
  // `<Theme name>` lower in the tree. Setting both keeps SSR/initial paint
  // consistent and ensures runtime swaps propagate everywhere — including
  // to `useTheme()` consumers inside NativeTabs children.
  return (
    <TamaguiProvider config={config} defaultTheme={resolved} {...rest}>
      <Theme name={resolved}>
        <QueryClientProvider client={queryClient}>
          <AuthCacheBridge />
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
