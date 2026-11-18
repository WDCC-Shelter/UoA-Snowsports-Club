"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import queryClient from "@/services/QueryClient"

const MapLayout = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

export default MapLayout
