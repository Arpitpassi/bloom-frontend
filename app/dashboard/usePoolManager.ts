import { useState, useEffect } from "react"
import { Pool } from "./types"
import { useToast } from "@/components/toast"
import { localToZulu, isValidArweaveAddress } from './utils'
import { useApiService } from './apiService'
import { DEPLOY_API_KEY, SERVER_URL } from "./constants"

export function usePoolManager(walletAddress: string, isWalletConnected: boolean, setShowPoolActions: (value: boolean) => void, setShowCreateModal: (value: boolean) => void, setShowEditModal: (value: boolean) => void) {
  const [pools, setPools] = useState<Pool[]>([])
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [totalPools, setTotalPools] = useState(0)
  const [activePools, setActivePools] = useState(0)
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  const { apiCall, fetchBalance } = useApiService(walletAddress)

  useEffect(() => {
    if (isWalletConnected) {
      loadPools()
    } else {
      setPools([])
      setTotalPools(0)
      setActivePools(0)
      setSelectedPool(null)
      setShowPoolActions(false)
    }
  }, [isWalletConnected])

  const loadPools = async () => {
    if (!walletAddress) {
      setPools([])
      setTotalPools(0)
      setActivePools(0)
      return
    }
    try {
      const { result: poolsData } = await apiCall(`${SERVER_URL}/pools?creatorAddress=${encodeURIComponent(walletAddress)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
      })
      console.log('Fetched pools:', poolsData)
      const poolArray: Pool[] = await Promise.all(
        Object.entries(poolsData).map(async ([id, pool]: [string, any]) => {
          const balance = await fetchBalance(id)
          return {
            id,
            name: pool.name,
            status: new Date() < new Date(pool.endTime) ? "Active" : "Ended",
            balance,
            usageCap: pool.usageCap,
            startTime: pool.startTime,
            endTime: pool.endTime,
            addresses: pool.whitelist,
            poolId: id
          }
        })
      )
      setPools(poolArray)
      setTotalPools(poolArray.length)
      setActivePools(poolArray.filter(pool => pool.status === "Active").length)
      if (selectedPool) {
        const updatedSelectedPool = poolArray.find(pool => pool.id === selectedPool.id)
        if (updatedSelectedPool) {
          setSelectedPool(updatedSelectedPool)
        }
      }
    } catch (error) {
      console.error('Load pools error:', error)
      showError("Load Failed", `Error loading pools: ${error instanceof Error ? error.message : String(error)}`)
      setPools([])
      setTotalPools(0)
      setActivePools(0)
    }
  }

  const handleCreatePool = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const poolName = formData.get("poolName") as string
    const poolPassword = formData.get("poolPassword") as string
    const confirmPassword = formData.get("confirmPassword") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const usageCap = parseFloat(formData.get("usageCap") as string)
    const addresses = (formData.get("addresses") as string).split('\n').map(a => a.trim()).filter(a => a)

    if (!poolName.trim()) return showError("Invalid Pool Name", "Please enter a valid pool name")
    if (!poolPassword) return showError("Password Required", "Please enter a pool password")
    if (poolPassword !== confirmPassword) return showError("Passwords Mismatch", "Passwords do not match")
    const invalidAddresses = addresses.filter(a => !isValidArweaveAddress(a))
    if (invalidAddresses.length > 0) return showError("Invalid Addresses", `Please fix invalid addresses: ${invalidAddresses.join(', ')}`)
    const startDateTime = new Date(startTime)
    const endDateTime = new Date(endTime)
    if (startDateTime >= endDateTime) return showError("Invalid Dates", "Start time must be before end time")

    const poolData = {
      name: poolName,
      password: poolPassword,
      startTime: localToZulu(startTime),
      endTime: localToZulu(endTime),
      usageCap,
      whitelist: addresses,
      creatorAddress: walletAddress
    }

    try {
      const { result } = await apiCall(`${SERVER_URL}/create-pool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify(poolData)
      })
      setShowCreateModal(false)
      setTotalPools(prev => prev + 1)
      showSuccess("Pool Created", `Pool "${poolName}" has been created successfully`)
      await loadPools()
      const newPool = pools.find(pool => pool.name === poolName)
      if (newPool) {
        await handlePoolSelect(newPool)
      }
    } catch (error) {
      console.error('Create pool error:', error)
      showError(
        "Creation Failed",
        `Error creating pool: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const handleEditPool = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPool) return showError("No Pool Selected", "Please select a pool to edit")
    const formData = new FormData(e.target as HTMLFormElement)
    const poolName = formData.get("poolName") as string
    const startTime = formData.get("startTime") as string
    const endTime = formData.get("endTime") as string
    const usageCap = parseFloat(formData.get("usageCap") as string)
    const addresses = (formData.get("addresses") as string).split('\n').map(a => a.trim()).filter(a => a)
    const password = window.prompt('Enter the pool password to confirm changes:')
    if (!password) return showError("Password Required", "Password required to edit pool")

    if (!poolName.trim()) return showError("Invalid Pool Name", "Please enter a valid pool name")
    const invalidAddresses = addresses.filter(a => !isValidArweaveAddress(a))
    if (invalidAddresses.length > 0) return showError("Invalid Addresses", `Please fix invalid addresses: ${invalidAddresses.join(', ')}`)
    const startDateTime = new Date(startTime)
    const endDateTime = new Date(endTime)
    if (startDateTime >= endDateTime) return showError("Invalid Dates", "Start time must be before end time")

    const poolData = {
      name: poolName,
      startTime: localToZulu(startTime),
      endTime: localToZulu(endTime),
      usageCap,
      whitelist: addresses,
      creatorAddress: walletAddress
    }

    try {
      console.log('Editing pool with ID:', selectedPool.id, 'Payload:', poolData)
      const editUrl = new URL(`${SERVER_URL}/pool/${encodeURIComponent(selectedPool.id)}/edit`)
      editUrl.searchParams.append('password', password)
      editUrl.searchParams.append('creatorAddress', walletAddress)
      const { result } = await apiCall(editUrl.toString(), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify(poolData)
      })
      setShowEditModal(false)
      showSuccess("Pool Updated", `Pool "${poolName}" has been updated successfully`)
      await loadPools()
      const balance = await fetchBalance(selectedPool.id)
      if (balance !== null) {
        setPools(prev =>
          prev.map(p => (p.id === selectedPool.id ? { ...p, balance } : p))
        )
        setSelectedPool(prev => (prev ? { ...prev, balance } : prev))
      }
    } catch (error) {
      console.error('Edit pool error:', error)
      showError(
        "Update Failed",
        `Error updating pool: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const handleDeletePool = async () => {
    if (!selectedPool) return showError("No Pool Selected", "Please select a pool to delete")
    const confirmDelete = window.confirm('Are you sure you want to delete this pool? This action cannot be undone.')
    if (!confirmDelete) return
    const password = window.prompt('Enter the pool password to confirm deletion:')
    if (!password) return showError("Password Required", "Password is required to delete the pool")

    try {
      const { result } = await apiCall(`${SERVER_URL}/pool/${encodeURIComponent(selectedPool.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify({ password, creatorAddress: walletAddress })
      })
      setPools(prev => prev.filter(pool => pool.id !== selectedPool.id))
      setTotalPools(prev => prev - 1)
      setSelectedPool(null)
      setShowPoolActions(false)
      showSuccess("Pool Deleted", `Pool "${selectedPool.name}" has been deleted successfully`)
      loadPools()
    } catch (error) {
      console.error('Delete pool error:', error)
      showError("Deletion Failed", `Error deleting pool: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleRevokeAccess = async (revokeAddress: string) => {
    if (!revokeAddress.trim()) return showError("Invalid Address", "Please enter a valid wallet address")
    if (!isValidArweaveAddress(revokeAddress)) return showError("Invalid Address", "Please enter a valid Arweave address")
    if (!selectedPool) return showError("No Pool Selected", "Please select a pool first")
    const password = window.prompt('Enter the pool password to revoke access:')
    if (!password) return showError("Password Required", "Password required to revoke access")

    try {
      const revokeUrl = new URL(`${SERVER_URL}/pool/${encodeURIComponent(selectedPool.id)}/revoke`)
      revokeUrl.searchParams.append('password', password)
      revokeUrl.searchParams.append('creatorAddress', walletAddress)
      const { result: revokeResult } = await apiCall(revokeUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify({ walletAddress: revokeAddress })
      })
      const updatedPools = pools.map(pool =>
        pool.id === selectedPool.id
          ? { ...pool, addresses: pool.addresses.filter(addr => addr !== revokeAddress) }
          : pool
      )
      setPools(updatedPools)
      setSelectedPool(prev => prev ? { ...prev, addresses: prev.addresses.filter(addr => addr !== revokeAddress) } : null)
      showSuccess("Access Revoked", `Successfully revoked access for ${revokeAddress.slice(0, 10)}...`)
      loadPools()
    } catch (error) {
      console.error('Revoke access error:', error)
      showError("Revoke Failed", `Error revoking access: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleDownloadWallet = async () => {
    if (!selectedPool) return showError("No Pool Selected", "Please select a pool first")
    const password = window.prompt('Enter the pool password to download wallet:')
    if (!password) return showError("Password Required", "Password required to download wallet")

    try {
      const url = new URL(`${SERVER_URL}/pool/${encodeURIComponent(selectedPool.id)}/wallet`)
      url.searchParams.append('password', password)
      url.searchParams.append('creatorAddress', walletAddress)
      const { result } = await apiCall(url.toString(), {
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY }
      })
      const walletBlob = new Blob([JSON.stringify(result.wallet, null, 2)], { type: 'application/json' })
      const urlObj = window.URL.createObjectURL(walletBlob)
      const a = document.createElement('a')
      a.href = urlObj
      a.download = `pool-${selectedPool.id}-wallet.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(urlObj)
      showSuccess("Wallet Downloaded", "Pool wallet key file has been downloaded")
    } catch (error) {
      console.error('Download wallet error:', error)
      showError("Download Failed", `Error downloading wallet: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleTopUp = async () => {
    if (!selectedPool) return showError("No Pool Selected", "Please select a pool first")
    const password = window.prompt('Enter the pool password to top up:')
    if (!password) return showError("Password Required", "Password required to top up pool")
    const amount = window.prompt('Enter AR amount to top up:')
    if (!amount || parseFloat(amount) <= 0) return showError("Invalid Amount", "Amount must be greater than 0")

    try {
      const url = new URL(`${SERVER_URL}/pool/${encodeURIComponent(selectedPool.id)}/topup`)
      url.searchParams.append('creatorAddress', walletAddress)
      const { result } = await apiCall(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify({ password, amount })
      })
      showSuccess("Pool Topped Up", `Pool topped up successfully! Transaction ID: ${result.transactionId}`)
      const balance = await fetchBalance(selectedPool.id)
      if (balance !== null) {
        setPools(prev =>
          prev.map(p => (p.id === selectedPool.id ? { ...p, balance } : p))
        )
        setSelectedPool(prev => (prev ? { ...prev, balance } : prev))
      }
    } catch (error) {
      console.error('Top up pool error:', error)
      showError("Top Up Failed", `Error topping up pool: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleSponsorCredits = async () => {
    if (!selectedPool) return showError("No Pool Selected", "Please select a pool first")
    const password = window.prompt('Enter the pool password to sponsor credits:')
    if (!password) return showError("Password Required", "Password required to sponsor credits")
    if (selectedPool.addresses.length === 0) return showError("No Addresses", "No whitelisted addresses to sponsor credits for")

    try {
      let successfulShares = 0
      const errors: string[] = []
      for (const addr of selectedPool.addresses) {
        try {
          const { result, response } = await apiCall(`${SERVER_URL}/share-credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
            body: JSON.stringify({ eventPoolId: selectedPool.id, walletAddress: addr, password })
          })
          if (response.ok) {
            successfulShares++
          } else {
            const errorMsg = `Failed to sponsor credits for ${addr.slice(0, 10)}...: ${result.error || 'Unknown error'} (${result.code || 'UNKNOWN_ERROR'})`
            console.error(errorMsg)
            errors.push(errorMsg)
          }
        } catch (error) {
          const errorMsg = `Failed to sponsor credits for ${addr.slice(0, 10)}...: ${error instanceof Error ? error.message : String(error)}`
          console.error(errorMsg)
          errors.push(errorMsg)
        }
      }

      if (successfulShares > 0) {
        const message = `Successfully sponsored credits to ${successfulShares} of ${selectedPool.addresses.length} addresses`
        if (errors.length > 0) {
          showWarning("Partial Success", `${message}. Errors: ${errors.join('; ')}`)
        } else {
          showSuccess("Credits Sponsored", message)
        }
      } else {
        showError("Sponsor Failed", errors.length > 0 ? `No credits sponsored. Errors: ${errors.join('; ')}` : "No credits sponsored.")
      }

      const balance = await fetchBalance(selectedPool.id)
      if (balance !== null) {
        setPools(prev =>
          prev.map(p => (p.id === selectedPool.id ? { ...p, balance } : p))
        )
        setSelectedPool(prev => (prev ? { ...prev, balance } : prev))
      }
    } catch (error) {
      console.error('Sponsor credits error:', error)
      showError(
        "Sponsor Failed",
        `Error sponsoring credits: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const handleRefreshBalance = async () => {
    if (!selectedPool) return showError("No Pool Selected", "Please select a pool first")
    const balance = await fetchBalance(selectedPool.id)
    if (balance !== null) {
      setPools(prev =>
        prev.map(p => (p.id === selectedPool.id ? { ...p, balance } : p))
      )
      setSelectedPool(prev => (prev ? { ...prev, balance } : prev))
      showSuccess("Balance Refreshed", `Balance for pool "${selectedPool.name}" has been updated`)
    }
  }

  const handlePoolSelect = async (pool: Pool) => {
    setSelectedPool({ ...pool, balance: pool.balance ?? null })
    setShowPoolActions(false)
    if (pool.balance === null) {
      const balance = await fetchBalance(pool.id)
      if (balance !== null) {
        setPools(prev =>
          prev.map(p => (p.id === pool.id ? { ...p, balance } : p))
        )
        setSelectedPool(prev => (prev ? { ...prev, balance } : prev))
      }
    }
  }

  return {
    pools,
    selectedPool,
    setSelectedPool,
    totalPools,
    setTotalPools,
    activePools,
    setActivePools,
    fetchBalance,
    loadPools,
    handleCreatePool,
    handleEditPool,
    handleDeletePool,
    handleRevokeAccess,
    handleDownloadWallet,
    handleTopUp,
    handleSponsorCredits,
    handleRefreshBalance
  }
}