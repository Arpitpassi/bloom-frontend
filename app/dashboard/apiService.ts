import { useCallback } from "react"
import { DEPLOY_API_KEY, SERVER_URL } from "./constants"

export function useApiService(walletAddress: string) {
  const apiCall = useCallback(async (url: string, options: RequestInit) => {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY, ...options.headers },
    })
    const result = await response.json()
    if (!response.ok) {
      throw new Error(`${result.error || 'Failed to perform API request'} (${result.code || 'UNKNOWN_ERROR'})`)
    }
    return { response, result } // Return both response and parsed result
  }, [])

  const fetchBalance = useCallback(async (poolId: string): Promise<number | null> => {
    try {
      const balanceUrl = new URL(`${SERVER_URL}/pool/${encodeURIComponent(poolId)}/balance`)
      balanceUrl.searchParams.append('creatorAddress', walletAddress)
      const { result } = await apiCall(balanceUrl.toString(), {
        method: 'GET',
        headers: { 'X-API-Key': DEPLOY_API_KEY },
      })
      return result.balance.effectiveBalance
    } catch (error) {
      console.error(`Fetch balance error for pool ${poolId}:`, error)
      return null
    }
  }, [walletAddress, apiCall])

  return { apiCall, fetchBalance }
}