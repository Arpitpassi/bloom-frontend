"use client"

import React, { useState, useEffect } from "react"
import { X, Users, ClipboardPenIcon } from "lucide-react"
import { ToastContainer, useToast } from "@/components/toast"
import { localToZulu, isValidArweaveAddress } from '@/lib/utils'

// Define interfaces for TypeScript type safety
interface Pool {
  id: string
  name: string
  status: "Active" | "Ended"
  balance: number | null // Allow null until balance is fetched
  usageCap: number
  startTime: string
  endTime: string
  addresses: string[]
  poolId: string
  sponsorInfo: string
}

interface Strategy {
  connect: (permissions: string[]) => Promise<void>
  disconnect: () => Promise<void>
  getActiveAddress: () => Promise<string>
}

// Constants
const DEPLOY_API_KEY = 'deploy-api-key-123' // Verify this matches your server's expected API key
const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000" // Use environment variable or default to localhost:3000

export default function Dashboard() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null)
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPoolActions, setShowPoolActions] = useState(false)
  const [showAddressesModal, setShowAddressesModal] = useState(false)
  const [totalPools, setTotalPools] = useState(0)
  const [activePools, setActivePools] = useState(0)
  const [revokeAddress, setRevokeAddress] = useState("")
  const [pools, setPools] = useState<Pool[]>([])
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast()

  // Initialize wallet strategies only on the client side
  const [browserWalletStrategy, setBrowserWalletStrategy] = useState<Strategy | null>(null)
  const [beaconStrategy, setBeaconStrategy] = useState<Strategy | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Dynamically import wallet strategies to ensure client-side execution
      import('@arweave-wallet-kit/browser-wallet-strategy').then(({ default: BrowserWalletStrategy }) => {
        class BrowserWalletStrategyAdapter implements Strategy {
          private browserWallet: typeof BrowserWalletStrategy.prototype

          constructor() {
            this.browserWallet = new BrowserWalletStrategy()
          }

          async connect(permissions: string[]) {
            return this.browserWallet.connect(permissions as any)
          }

          async disconnect() {
            return this.browserWallet.disconnect()
          }

          async getActiveAddress() {
            return this.browserWallet.getActiveAddress()
          }
        }
        setBrowserWalletStrategy(new BrowserWalletStrategyAdapter())
      }).catch((error) => {
        console.error('Failed to load BrowserWalletStrategy:', error)
        showError('Initialization Failed', 'Unable to load BrowserWalletStrategy')
      })

      import('@vela-ventures/aosync-strategy').then(({ default: AoSyncStrategy }) => {
        class AoSyncStrategyAdapter implements Strategy {
          private aoSync: typeof AoSyncStrategy.prototype

          constructor() {
            this.aoSync = new AoSyncStrategy()
          }

          async connect(permissions: string[]) {
            return this.aoSync.connect(permissions as any)
          }

          async disconnect() {
            return this.aoSync.disconnect()
          }

          async getActiveAddress() {
            return this.aoSync.getActiveAddress()
          }
        }
        setBeaconStrategy(new AoSyncStrategyAdapter())
      }).catch((error) => {
        console.error('Failed to load AoSyncStrategy:', error)
        showError('Initialization Failed', 'Unable to load AoSyncStrategy')
      })
    }
  }, [])

  // Load pools when wallet connects or disconnects
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

  const fetchBalance = async (poolId: string): Promise<number | null> => {
    try {
      const balanceUrl = new URL(`${SERVER_URL}/pool/${encodeURIComponent(poolId)}/balance`)
      balanceUrl.searchParams.append('creatorAddress', walletAddress)
      const response = await fetch(balanceUrl, {
        method: 'GET',
        headers: { 'X-API-Key': DEPLOY_API_KEY },
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(`${result.error || 'Failed to fetch balance'} (${result.code || 'UNKNOWN_ERROR'})`)
      }
      return result.balance.effectiveBalance
    } catch (error) {
      console.error(`Fetch balance error for pool ${poolId}:`, error)
      showError("Balance Fetch Failed", `Error fetching balance for pool ${poolId}: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
  }

  const loadPools = async () => {
    if (!walletAddress) {
      setPools([])
      setTotalPools(0)
      setActivePools(0)
      return
    }
    try {
      const response = await fetch(`${SERVER_URL}/pools?creatorAddress=${encodeURIComponent(walletAddress)}`, {
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`${errorData.error || 'Failed to fetch pools'} (${errorData.code || 'UNKNOWN_ERROR'})`)
      }
      const poolsData = await response.json()
      console.log('Fetched pools:', poolsData) // Log response for debugging
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
            poolId: id,
            sponsorInfo: pool.sponsorInfo || ''
          }
        })
      )
      setPools(poolArray)
      setTotalPools(poolArray.length)
      setActivePools(poolArray.filter(pool => pool.status === "Active").length)
      // Fetch balance for selected pool if it exists
      if (selectedPool) {
        const updatedSelectedPool = poolArray.find(pool => pool.id === selectedPool.id)
        if (updatedSelectedPool) {
          setSelectedPool(updatedSelectedPool)
        }
      }
    } catch (error) {
      console.error('Load pools error:', error) // Detailed error logging
      showError("Load Failed", `Error loading pools: ${error instanceof Error ? error.message : String(error)}`)
      setPools([])
      setTotalPools(0)
      setActivePools(0)
    }
  }

  const handleConnectWallet = () => {
    if (!browserWalletStrategy || !beaconStrategy) {
      showError("Initialization Error", "Wallet strategies are not yet loaded. Please try again.")
      return
    }
    setShowWalletModal(true)
  }

  const handleWalletConnect = async (type: "beacon" | "wander") => {
    try {
      let strategy: Strategy
      if (type === "beacon") {
        if (!beaconStrategy) throw new Error("Beacon strategy not initialized")
        strategy = beaconStrategy
      } else {
        if (!browserWalletStrategy) throw new Error("Browser wallet strategy not initialized")
        strategy = browserWalletStrategy
      }
      await strategy.connect(['ACCESS_ADDRESS'])
      const address = await strategy.getActiveAddress()
      setWalletAddress(address)
      setActiveStrategy(strategy)
      setIsWalletConnected(true)
      setShowWalletModal(false)
      showSuccess("Wallet Connected", `Successfully connected with ${type === "beacon" ? "Beacon" : "Wander"} wallet`)
    } catch (error) {
      console.error('Wallet connection error:', error) // Detailed error logging
      showError(
        "Connection Failed",
        `Error connecting wallet: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  const handleDisconnect = async () => {
    try {
      if (activeStrategy) {
        await activeStrategy.disconnect()
        setActiveStrategy(null)
      }
      setIsWalletConnected(false)
      setWalletAddress("")
      setSelectedPool(null)
      setShowPoolActions(false)
      showInfo("Wallet Disconnected", "Your wallet has been disconnected")
    } catch (error) {
      console.error('Wallet disconnection error:', error) // Detailed error logging
      showError(
        "Disconnection Failed",
        `Error disconnecting wallet: ${error instanceof Error ? error.message : String(error)}`
      )
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

  const handlePoolActions = () => {
    setShowPoolActions(true)
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
    const sponsorInfo = formData.get("sponsorInfo") as string

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
      creatorAddress: walletAddress,
      sponsorInfo
    }

    try {
      const response = await fetch(`${SERVER_URL}/create-pool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify(poolData)
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(`${result.error || 'Failed to create pool'} (${result.code || 'UNKNOWN_ERROR'})`)
      }
      setShowCreateModal(false)
      setTotalPools(prev => prev + 1)
      showSuccess("Pool Created", `Pool "${poolName}" has been created successfully`)
      await loadPools()
      // Select the new pool and fetch its balance
      const newPool = pools.find(pool => pool.name === poolName)
      if (newPool) {
        await handlePoolSelect(newPool)
      }
    } catch (error) {
      console.error('Create pool error:', error) // Detailed error logging
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
    const sponsorInfo = formData.get("sponsorInfo") as string
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
      creatorAddress: walletAddress,
      sponsorInfo
    }

    try {
      console.log('Editing pool with ID:', selectedPool.id, 'Payload:', poolData) // Debug log
      const editUrl = new URL(`${SERVER_URL}/pool/${encodeURIComponent(selectedPool.id)}/edit`)
      editUrl.searchParams.append('password', password)
      editUrl.searchParams.append('creatorAddress', walletAddress)
      const response = await fetch(editUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify(poolData)
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(`${result.error || 'Failed to update pool'} (${result.code || 'UNKNOWN_ERROR'})`)
      }
      setShowEditModal(false)
      showSuccess("Pool Updated", `Pool "${poolName}" has been updated successfully`)
      await loadPools()
      // Refresh balance for the edited pool
      const balance = await fetchBalance(selectedPool.id)
      if (balance !== null) {
        setPools(prev =>
          prev.map(p => (p.id === selectedPool.id ? { ...p, balance } : p))
        )
        setSelectedPool(prev => (prev ? { ...prev, balance } : prev))
      }
    } catch (error) {
      console.error('Edit pool error:', error) // Detailed error logging
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
      const response = await fetch(`${SERVER_URL}/pool/${encodeURIComponent(selectedPool.id)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify({ password, creatorAddress: walletAddress })
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(`${result.error || 'Failed to delete pool'} (${result.code || 'UNKNOWN_ERROR'})`)
      }
      setPools(prev => prev.filter(pool => pool.id !== selectedPool.id))
      setTotalPools(prev => prev - 1)
      setSelectedPool(null)
      setShowPoolActions(false)
      showSuccess("Pool Deleted", `Pool "${selectedPool.name}" has been deleted successfully`)
      loadPools()
    } catch (error) {
      console.error('Delete pool error:', error) // Detailed error logging
      showError("Deletion Failed", `Error deleting pool: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  const handleRevokeAccess = async () => {
    if (!revokeAddress.trim()) return showError("Invalid Address", "Please enter a valid wallet address")
    if (!isValidArweaveAddress(revokeAddress)) return showError("Invalid Address", "Please enter a valid Arweave address")
    if (!selectedPool) return showError("No Pool Selected", "Please select a pool first")
    const password = window.prompt('Enter the pool password to revoke access:')
    if (!password) return showError("Password Required", "Password required to revoke access")

    try {
      const revokeUrl = new URL(`${SERVER_URL}/pool/${encodeURIComponent(selectedPool.id)}/revoke`)
      revokeUrl.searchParams.append('password', password)
      revokeUrl.searchParams.append('creatorAddress', walletAddress)
      const revokeResponse = await fetch(revokeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify({ walletAddress: revokeAddress })
      })
      const revokeResult = await revokeResponse.json()
      if (!revokeResponse.ok) {
        throw new Error(`${revokeResult.error || 'Failed to revoke access'} (${revokeResult.code || 'UNKNOWN_ERROR'})`)
      }
      const updatedPools = pools.map(pool =>
        pool.id === selectedPool.id
          ? { ...pool, addresses: pool.addresses.filter(addr => addr !== revokeAddress) }
          : pool
      )
      setPools(updatedPools)
      setSelectedPool(prev => prev ? { ...prev, addresses: prev.addresses.filter(addr => addr !== revokeAddress) } : null)
      setRevokeAddress("")
      showSuccess("Access Revoked", `Successfully revoked access for ${revokeAddress.slice(0, 10)}...`)
      loadPools()
    } catch (error) {
      console.error('Revoke access error:', error) // Detailed error logging
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
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY }
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(`${result.error || 'Failed to download wallet'} (${result.code || 'UNKNOWN_ERROR'})`)
      }
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
      console.error('Download wallet error:', error) // Detailed error logging
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
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
        body: JSON.stringify({ password, amount })
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(`${result.error || 'Failed to top up pool'} (${result.code || 'UNKNOWN_ERROR'})`)
      }
      showSuccess("Pool Topped Up", `Pool topped up successfully! Transaction ID: ${result.transactionId}`)
      // Refresh balance after top-up
      const balance = await fetchBalance(selectedPool.id)
      if (balance !== null) {
        setPools(prev =>
          prev.map(p => (p.id === selectedPool.id ? { ...p, balance } : p))
        )
        setSelectedPool(prev => (prev ? { ...prev, balance } : prev))
      }
    } catch (error) {
      console.error('Top up pool error:', error) // Detailed error logging
      showError("Top Up Failed", `Error topping up pool: ${error instanceof Error ? error.message : String(error)}`)
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
          const response = await fetch(`${SERVER_URL}/share-credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': DEPLOY_API_KEY },
            body: JSON.stringify({ eventPoolId: selectedPool.id, walletAddress: addr, password })
          })
          const result = await response.json()
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

      // Refresh balance after sponsoring credits
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

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      showSuccess("Address Copied", `Address ${address.slice(0, 10)}... copied to clipboard`)
    } catch (error) {
      console.error('Copy address error:', error)
      showError("Copy Failed", `Failed to copy address: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Left Sidebar - Pools */}
      <div className="w-80 bg-white rounded-r-2xl shadow-sm border-r border-gray-200 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-6 pb-3 border-b border-gray-200">POOLS</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-gray-900 text-white p-3 rounded-lg text-sm font-medium mb-6 hover:bg-gray-800 transition-colors"
        >
          + NEW POOL
        </button>
        <div className="space-y-4">
          {pools.map((pool) => (
            <div
              key={pool.id}
              onClick={() => handlePoolSelect(pool)}
              className={`bg-white border border-gray-200 rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                selectedPool?.id === pool.id ? "ring-2 ring-gray-900 bg-gray-50" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="font-semibold text-base">{pool.name}</div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    pool.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {pool.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Balance: <span className="font-medium text-gray-900">{pool.balance !== null ? pool.balance.toFixed(4) : "Loading..."}</span></div>
                <div>Usage Cap: <span className="font-medium text-gray-900">{pool.usageCap.toFixed(4)}</span></div>
                <div className="text-xs">Duration: {pool.startTime} - {pool.endTime}</div>
                <div>Addresses: <span className="font-medium text-gray-900">{pool.addresses.length}</span></div>
              </div>
              {selectedPool?.id === pool.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePoolActions() }}
                  className="w-full bg-gray-900 text-white p-2 mt-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  Pool Actions
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mb-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">NITYA POOL MANAGER</h2>
          {isWalletConnected ? (
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{totalPools}</div>
                <div className="text-sm text-gray-500 font-medium">TOTAL POOLS</div>
              </div>
              <div className="text-center">
                <p className="text-base mb-4 text-gray-600">
                  Connected: <span className="font-medium">{walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</span>
                </p>
                <button
                  onClick={handleDisconnect}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  DISCONNECT
                </button>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{activePools}</div>
                <div className="text-sm text-gray-500 font-medium">ACTIVE POOLS</div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-base mb-6 text-gray-600">Connect your Arweave wallet to continue</p>
              <button
                onClick={handleConnectWallet}
                className="bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                CONNECT WALLET
              </button>
            </>
          )}
        </div>

        {isWalletConnected && (
          <div>
            {showPoolActions && selectedPool ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">POOL ACTIONS - {selectedPool.name}</h3>
                  <button onClick={() => setShowPoolActions(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-semibold text-gray-700">REVOKE ACCESS</h4>
                      <button
                        onClick={() => setShowAddressesModal(true)}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        View Addresses
                      </button>
                    </div>
                    <input
                      type="text"
                      value={revokeAddress}
                      onChange={(e) => setRevokeAddress(e.target.value)}
                      placeholder="Enter wallet address to revoke"
                      className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    />
                    <button
                      onClick={handleRevokeAccess}
                      className="w-full bg-orange-500 text-white p-3 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      REVOKE ACCESS
                    </button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">REFRESH BALANCE</h4>
                    <button
                      onClick={handleRefreshBalance}
                      className="w-full bg-blue-500 text-white p-3 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      REFRESH BALANCE
                    </button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">DOWNLOAD WALLET</h4>
                    <button
                      onClick={handleDownloadWallet}
                      className="w-full bg-green-500 text-white p-3 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      DOWNLOAD WALLET
                    </button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">DELETE POOL</h4>
                    <button
                      onClick={handleDeletePool}
                      className="w-full bg-red-500 text-white p-3 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      DELETE POOL
                    </button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">TOP UP POOL</h4>
                    <button
                      onClick={handleTopUp}
                      className="w-full bg-gray-900 text-white p-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      TOP UP
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedPool ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">POOL INFORMATION</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Name:</span>
                      <span className="font-semibold text-gray-900">{selectedPool.name}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Status:</span>
                      <span className={`font-semibold ${selectedPool.status === "Active" ? "text-green-600" : "text-red-600"}`}>
                        {selectedPool.status}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Pool ID:</span>
                      <span className="font-mono text-sm text-gray-900">{selectedPool.poolId}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Start Time:</span>
                      <span className="font-semibold text-gray-900">{selectedPool.startTime}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">End Time:</span>
                      <span className="font-semibold text-gray-900">{selectedPool.endTime}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Usage Cap:</span>
                      <span className="font-semibold text-gray-900">{selectedPool.usageCap} Credits</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600 font-medium">Current Balance:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedPool.balance !== null ? `${selectedPool.balance.toFixed(2)} Credits` : "Loading..."}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-gray-600 font-medium">Whitelisted Addresses ({selectedPool.addresses.length}):</span>
                      <button
                        onClick={() => setShowAddressesModal(true)}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        View Addresses
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end mt-6 gap-4">
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="bg-blue-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      EDIT POOL
                    </button>
                    <button
                      onClick={handleSponsorCredits}
                      className="bg-yellow-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors"
                    >
                      SPONSOR CREDITS
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">YOUR DEPLOYMENT POOLS</h3>
                <p className="text-gray-600">Your pools will appear in the sidebar once loaded. Click on pool actions to view its details.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wallet Choice Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-black shadow-xl p-8 min-w-80 text-center">
            <h2 className="text-lg font-semibold mb-6 text-gray-900">CHOOSE WALLET</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleWalletConnect("beacon")}
                className="w-full bg-gray-900 text-white p-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                disabled={!beaconStrategy}
              >
                CONNECT WITH BEACON
              </button>
              <button
                onClick={() => handleWalletConnect("wander")}
                className="w-full bg-gray-900 text-white p-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                disabled={!browserWalletStrategy}
              >
                CONNECT WITH WANDER
              </button>
              <button
                onClick={() => setShowWalletModal(false)}
                className="w-full bg-white text-gray-700 border-2 border-black p-3 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Whitelisted Addresses Modal */}
      {showAddressesModal && selectedPool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowAddressesModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-semibold mb-6 text-gray-900">Whitelisted Addresses ({selectedPool.addresses.length})</h3>
            <div className="space-y-3">
              {selectedPool.addresses.map((address, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 border-2 border-black p-4 font-mono text-sm break-all">
                  <span>{address}</span>
                  <button
                    onClick={() => handleCopyAddress(address)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                  >
                    <ClipboardPenIcon className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Pool Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-semibold mb-6 text-gray-900">CREATE NEW POOL</h3>
            <form onSubmit={handleCreatePool} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">POOL NAME</label>
                <input
                  name="poolName"
                  type="text"
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">POOL PASSWORD</label>
                <input
                  name="poolPassword"
                  type="password"
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">CONFIRM PASSWORD</label>
                <input
                  name="confirmPassword"
                  type="password"
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">START TIME</label>
                  <input
                    name="startTime"
                    type="datetime-local"
                    className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">END TIME</label>
                  <input
                    name="endTime"
                    type="datetime-local"
                    className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">MAX CREDITS PER WALLET (USAGE CAP)</label>
                <input
                  name="usageCap"
                  type="number"
                  step="0.000000000001"
                  min="0"
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">WHITELISTED ADDRESSES</label>
                <textarea
                  name="addresses"
                  rows={4}
                  placeholder="Enter one Arweave address per line"
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">SPONSOR INFORMATION</label>
                <textarea
                  name="sponsorInfo"
                  rows={4}
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                ></textarea>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white p-3 text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  CREATE POOL
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-white text-gray-700 border-2 border-black p-3 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Pool Modal */}
      {showEditModal && selectedPool && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-black shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-semibold mb-6 text-gray-900">EDIT POOL - {selectedPool.name}</h3>
            <form onSubmit={handleEditPool} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">POOL NAME</label>
                <input
                  name="poolName"
                  type="text"
                  defaultValue={selectedPool.name}
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">START TIME</label>
                  <input
                    name="startTime"
                    type="datetime-local"
                    defaultValue={selectedPool.startTime.slice(0, 16)}
                    className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">END TIME</label>
                  <input
                    name="endTime"
                    type="datetime-local"
                    defaultValue={selectedPool.endTime.slice(0, 16)}
                    className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">MAX CREDITS PER WALLET (USAGE CAP)</label>
                <input
                  name="usageCap"
                  type="number"
                  step="0.000000000001"
                  min="0"
                  defaultValue={selectedPool.usageCap}
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">WHITELISTED ADDRESSES</label>
                <textarea
                  name="addresses"
                  rows={4}
                  defaultValue={selectedPool.addresses.join('\n')}
                  placeholder="Enter one Arweave address per line"
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">SPONSOR INFORMATION</label>
                <textarea
                  name="sponsorInfo"
                  rows={4}
                  defaultValue={selectedPool.sponsorInfo || ''}
                  className="w-full p-3 border-2 border-black bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                ></textarea>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white p-3 text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  SAVE CHANGES
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-white text-gray-700 border-2 border-black p-3 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}