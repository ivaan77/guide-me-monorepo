import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import NetInfo from '@react-native-community/netinfo'

// Surface ONLY hard offline (no network interface up at all). We deliberately
// do NOT use `isInternetReachable` or active reachability probes — they're
// prone to false positives (a slow api, a captive portal redirect, or a
// laggy probe response will incorrectly flag the user as offline). The
// rule: never show the banner unless the device is definitely offline.

type NetworkContextValue = {
  isOnline: boolean
}

const NetworkContext = createContext<NetworkContextValue>({ isOnline: true })

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    NetInfo.fetch()
      .then((state) => setIsOnline(state.isConnected !== false))
      .catch(() => setIsOnline(true))

    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected !== false)
    })
    return unsubscribe
  }, [])

  const value = useMemo<NetworkContextValue>(() => ({ isOnline }), [isOnline])
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork(): NetworkContextValue {
  return useContext(NetworkContext)
}
