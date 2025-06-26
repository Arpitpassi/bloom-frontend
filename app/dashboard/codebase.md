<codebase>
<project_structure>
.
├── TimeLeftDial.tsx
├── apiService.ts
├── constants.ts
├── page.tsx
├── types.ts
├── usePoolManager.ts
└── utils.ts

0 directories, 7 files
</project_structure>

<file src="TimeLeftDial.tsx">
"use client"

import { useState, useEffect } from "react"

interface TimeLeftDialProps {
  startTime: string
  endTime: string
  size?: number
}

export function TimeLeftDial({ startTime, endTime, size = 120 }: TimeLeftDialProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number
    hours: number
    minutes: number
    seconds: number
    percentage: number
    isActive: boolean
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    percentage: 0,
    isActive: false,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const start = new Date(startTime).getTime()
      const end = new Date(endTime).getTime()

      if (now < start) {
        // Pool hasn't started yet
        const timeToStart = start - now
        const days = Math.floor(timeToStart / (1000 * 60 * 60 * 24))
        const hours = Math.floor((timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeToStart % (1000 * 60)) / 1000)

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          percentage: 0,
          isActive: false,
        })
      } else if (now >= start && now <= end) {
        // Pool is active
        const totalDuration = end - start
        const elapsed = now - start
        const remaining = end - now

        const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000)

        const percentage = Math.max(0, Math.min(100, ((totalDuration - remaining) / totalDuration) * 100))

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          percentage,
          isActive: true,
        })
      } else {
        // Pool has ended
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          percentage: 100,
          isActive: false,
        })
      }
    }

    calculateTimeLeft()
    const interval = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(interval)
  }, [startTime, endTime])

  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (timeLeft.percentage / 100) * circumference

  const getStatusColor = () => {
    if (!timeLeft.isActive) {
      return timeLeft.percentage === 100 ? "text-red-500" : "text-gray-500"
    }
    if (timeLeft.percentage > 75) return "text-red-500"
    if (timeLeft.percentage > 50) return "text-yellow-500"
    return "text-green-500"
  }

  const getStrokeColor = () => {
    if (!timeLeft.isActive) {
      return timeLeft.percentage === 100 ? "#ef4444" : "#6b7280"
    }
    if (timeLeft.percentage > 75) return "#ef4444"
    if (timeLeft.percentage > 50) return "#eab308"
    return "#22c55e"
  }

  const getStatusText = () => {
    if (!timeLeft.isActive && timeLeft.percentage === 0) return "Not Started"
    if (!timeLeft.isActive && timeLeft.percentage === 100) return "Ended"
    return "Active"
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth="8" fill="transparent" />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className={`text-2xl font-bold ${getStatusColor()}`}>
            {timeLeft.days > 0
              ? `${timeLeft.days}d`
              : timeLeft.hours > 0
                ? `${timeLeft.hours}h`
                : timeLeft.minutes > 0
                  ? `${timeLeft.minutes}m`
                  : `${timeLeft.seconds}s`}
          </div>
          <div className="text-xs text-gray-500 font-medium">{getStatusText()}</div>
        </div>
      </div>

      {/* Detailed time breakdown */}
      <div className="text-center">
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="text-center">
            <div className="font-bold text-gray-900">{timeLeft.days}</div>
            <div className="text-gray-500">Days</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{timeLeft.hours}</div>
            <div className="text-gray-500">Hours</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{timeLeft.minutes}</div>
            <div className="text-gray-500">Min</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{timeLeft.seconds}</div>
            <div className="text-gray-500">Sec</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">{Math.round(timeLeft.percentage)}% Complete</div>
      </div>
    </div>
  )
}

</file>

<file src="apiService.ts">
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
</file>

<file src="constants.ts">
export const DEPLOY_API_KEY = 'deploy-api-key-123'
export const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"
</file>

<file src="page.tsx">
"use client"

import { useState, useEffect } from "react"
import { X, Users, ClipboardPenIcon } from "lucide-react"
import { ToastContainer, useToast } from "@/components/toast"
import { formatDateTime } from "./utils"
import { TimeLeftDial } from "./TimeLeftDial"
import type { Pool, Strategy } from "./types"
import { usePoolManager } from "./usePoolManager"

export default function Dashboard() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [activeStrategy, setActiveStrategy] = useState<Strategy | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPoolActions, setShowPoolActions] = useState(false)
  const [showAddressesModal, setShowAddressesModal] = useState(false)
  const [revokeAddress, setRevokeAddress] = useState("")
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast()
  const {
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
    handleRefreshBalance,
  } = usePoolManager(walletAddress, isWalletConnected, setShowPoolActions, setShowCreateModal, setShowEditModal)

  // Initialize wallet strategies only on the client side
  const [browserWalletStrategy, setBrowserWalletStrategy] = useState<Strategy | null>(null)
  const [beaconStrategy, setBeaconStrategy] = useState<Strategy | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Dynamically import wallet strategies to ensure client-side execution
      import("@arweave-wallet-kit/browser-wallet-strategy")
        .then(({ default: BrowserWalletStrategy }) => {
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
        })
        .catch((error) => {
          console.error("Failed to load BrowserWalletStrategy:", error)
          showError("Initialization Failed", "Unable to load BrowserWalletStrategy")
        })

      import("@vela-ventures/aosync-strategy")
        .then(({ default: AoSyncStrategy }) => {
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
        })
        .catch((error) => {
          console.error("Failed to load AoSyncStrategy:", error)
          showError("Initialization Failed", "Unable to load AoSyncStrategy")
        })
    }
  }, [])

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
      await strategy.connect(["ACCESS_ADDRESS"])
      const address = await strategy.getActiveAddress()
      setWalletAddress(address)
      setActiveStrategy(strategy)
      setIsWalletConnected(true)
      setShowWalletModal(false)
      showSuccess("Wallet Connected", `Successfully connected with ${type === "beacon" ? "Beacon" : "Wander"} wallet`)
    } catch (error) {
      console.error("Wallet connection error:", error)
      showError(
        "Connection Failed",
        `Error connecting wallet: ${error instanceof Error ? error.message : String(error)}`,
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
      console.error("Wallet disconnection error:", error)
      showError(
        "Disconnection Failed",
        `Error disconnecting wallet: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  const handlePoolSelect = async (pool: Pool) => {
    setSelectedPool({ ...pool, balance: pool.balance ?? null })
    setShowPoolActions(false)
    if (pool.balance === null) {
      const balance = await fetchBalance(pool.id)
      if (balance !== null) {
        setPools((prev) => prev.map((p: { id: string }) => (p.id === pool.id ? { ...p, balance } : p)))
        setSelectedPool((prev) => (prev ? { ...prev, balance } : prev))
      }
    }
  }

  const handlePoolActions = () => {
    setShowPoolActions(true)
  }

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      showSuccess("Address Copied", `Address ${address.slice(0, 10)}... copied to clipboard`)
    } catch (error) {
      console.error("Copy address error:", error)
      showError("Copy Failed", `Failed to copy address: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 font-inter antialiased flex"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Left Sidebar - Pools */}
      <div className="w-80 bg-white rounded-r-xl shadow-sm border-r border-gray-200 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-6 pb-3 border-b border-gray-200">POOLS</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-white text-black border-2 border-black p-3 rounded-xl text-sm font-medium mb-6 hover:bg-black hover:text-white transition-colors"
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
                <div>
                  Balance:{" "}
                  <span className="font-medium text-gray-900">
                    {pool.balance !== null ? pool.balance.toFixed(4) : "Loading..."}
                  </span>
                </div>
                <div>
                  Usage Cap: <span className="font-medium text-gray-900">{pool.usageCap.toFixed(4)}</span>
                </div>
                <div className="text-xs">
                  Duration: {formatDateTime(pool.startTime)} - {formatDateTime(pool.endTime)}
                </div>
                <div>
                  Addresses: <span className="font-medium text-gray-900">{pool.addresses.length}</span>
                </div>
              </div>
              {selectedPool?.id === pool.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePoolActions()
                  }}
                  className="w-full bg-white text-black border-2 border-black p-2 mt-3 rounded-xl text-sm font-medium hover:bg-black hover:text-white transition-colors"
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center mb-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">BLOOM POOL MANAGER</h2>
          {isWalletConnected ? (
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{totalPools}</div>
                <div className="text-sm text-gray-500 font-medium">TOTAL POOLS</div>
              </div>
              <div className="text-center">
                <p className="text-base mb-4 text-gray-600">
                  Connected:{" "}
                  <span className="font-medium">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                  </span>
                </p>
                <button
                  onClick={handleDisconnect}
                  className="bg-red-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
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
                className="bg-white text-black border-2 border-black px-8 py-3 rounded-xl text-sm font-medium hover:bg-black hover:text-white transition-colors"
              >
                CONNECT WALLET
              </button>
            </>
          )}
        </div>

        {isWalletConnected && (
          <div>
            {showPoolActions && selectedPool ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
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
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-xl text-sm font-medium transition-colors"
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
                      className="w-full p-3 border border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                    />
                    <button
                      onClick={() => handleRevokeAccess(revokeAddress)}
                      className="w-full bg-orange-500 text-white p-3 rounded-xl text-sm font-medium hover:bg-orange-600 transition-colors"
                    >
                      REVOKE ACCESS
                    </button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">REFRESH BALANCE</h4>
                    <button
                      onClick={handleRefreshBalance}
                      className="w-full bg-blue-500 text-white p-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      REFRESH BALANCE
                    </button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">DOWNLOAD WALLET</h4>
                    <button
                      onClick={handleDownloadWallet}
                      className="w-full bg-green-500 text-white p-3 rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      DOWNLOAD WALLET
                    </button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">DELETE POOL</h4>
                    <button
                      onClick={handleDeletePool}
                      className="w-full bg-red-500 text-white p-3 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                    >
                      DELETE POOL
                    </button>
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">TOP UP POOL</h4>
                    <button
                      onClick={handleTopUp}
                      className="w-full bg-white text-black border-2 border-black p-3 rounded-xl text-sm font-medium hover:bg-black hover:text-white transition-colors"
                    >
                      TOP UP
                    </button>
                  </div>
                </div>
              </div>
            ) : selectedPool ? (
              // Replace the pool information section in your Dashboard component with this:
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-6 text-gray-900">POOL INFORMATION</h3>

                  {/* Main content area with pool info and time dial */}
                  <div className="flex justify-between items-start mb-6">
                    {/* Left side - Pool details and Whitelisted Addresses */}
                    <div className="flex-1 space-y-4">
                      {/* Pool Name */}
                      <div className="flex justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Name:</span>
                        <span className="font-semibold text-gray-900">{selectedPool.name}</span>
                      </div>

                      {/* Pool Status */}
                      <div className="flex justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">Status:</span>
                        <span
                          className={`font-semibold ${selectedPool.status === "Active" ? "text-green-600" : "text-red-600"}`}
                        >
                          {selectedPool.status}
                        </span>
                      </div>

                      {/* Whitelisted Addresses */}
                      <div className="flex justify-between py-3 border-b border-gray-100">
                        <span className="text-gray-600 font-medium">
                          Whitelisted Addresses ({selectedPool.addresses.length}):
                        </span>
                        <button
                          onClick={() => setShowAddressesModal(true)}
                          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-xl text-sm font-medium transition-colors"
                        >
                          <Users className="w-4 h-4" />
                          View Addresses
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={() => setShowEditModal(true)}
                          className="bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                        >
                          EDIT POOL
                        </button>
                        <button
                          onClick={handleSponsorCredits}
                          className="bg-yellow-500 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-yellow-600 transition-colors"
                        >
                          SPONSOR CREDITS
                        </button>
                      </div>
                    </div>

                    {/* Right side - Time Left Dial */}
                    <div className="ml-8 flex-shrink-0">
                      <div className="text-center">
                        <div className="text-gray-600 font-medium mb-2">Time Left:</div>
                        <TimeLeftDial startTime={selectedPool.startTime} endTime={selectedPool.endTime} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">YOUR FAUCET POOLS</h3>
                <p className="text-gray-600">
                  Your pools will appear in the sidebar once loaded. Click on a pool to view its details.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Wallet Choice Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border-2 border-gray-300 shadow-xl p-8 min-w-80 text-center rounded-xl">
            <h2 className="text-lg font-semibold mb-6 text-gray-900">CHOOSE WALLET</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleWalletConnect("beacon")}
                className="w-full bg-white text-black border-2 border-black p-3 rounded-xl text-sm font-medium hover:bg-black hover:text-white transition-colors"
                disabled={!beaconStrategy}
              >
                CONNECT WITH BEACON
              </button>
              <button
                onClick={() => handleWalletConnect("wander")}
                className="w-full bg-white text-black border-2 border-black p-3 rounded-xl text-sm font-medium hover:bg-black hover:text-white transition-colors"
                disabled={!browserWalletStrategy}
              >
                CONNECT WITH WANDER
              </button>
              <button
                onClick={() => setShowWalletModal(false)}
                className="w-full bg-white text-gray-700 border-2 border-gray-300 p-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
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
          <div className="bg-white border-2 border-gray-300 shadow-xl max-w-xl w-full max-h-[80vh] overflow-y-auto p-8 relative rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Whitelisted Addresses ({selectedPool.addresses.length})
              </h3>
              <button onClick={() => setShowAddressesModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              {selectedPool.addresses.map((address, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 border-2 border-gray-300 p-4 rounded-xl"
                  style={{
                    fontFamily:
                      'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  <span className="text-sm break-all">{address}</span>
                  <button
                    onClick={() => handleCopyAddress(address)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-xl text-sm font-medium transition-colors ml-4 flex-shrink-0"
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
          <div className="bg-white border-2 border-gray-300 shadow-xl max-w-xl w-full max-h-[80vh] overflow-y-auto p-8 relative rounded-xl">
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
                  className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">POOL PASSWORD</label>
                <input
                  name="poolPassword"
                  type="password"
                  className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">CONFIRM PASSWORD</label>
                <input
                  name="confirmPassword"
                  type="password"
                  className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">START TIME</label>
                  <input
                    name="startTime"
                    type="datetime-local"
                    className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">END TIME</label>
                  <input
                    name="endTime"
                    type="datetime-local"
                    className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  MAX CREDITS PER WALLET (USAGE CAP)
                </label>
                <input
                  name="usageCap"
                  type="number"
                  step="0.000000000001"
                  min="0"
                  className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">WHITELISTED ADDRESSES</label>
                <textarea
                  name="addresses"
                  rows={4}
                  placeholder="Enter one Arweave address per line"
                  className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                ></textarea>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-white text-black border-2 border-black p-3 rounded-xl text-sm font-medium hover:bg-black hover:text-white transition-colors"
                >
                  CREATE POOL
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-white text-gray-700 border-2 border-gray-300 p-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
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
          <div className="bg-white border-2 border-gray-300 shadow-xl max-w-xl w-full max-h-[80vh] overflow-y-auto p-8 relative rounded-xl">
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
                  className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
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
                    className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">END TIME</label>
                  <input
                    name="endTime"
                    type="datetime-local"
                    defaultValue={selectedPool.endTime.slice(0, 16)}
                    className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  MAX CREDITS PER WALLET (USAGE CAP)
                </label>
                <input
                  name="usageCap"
                  type="number"
                  step="0.000000000001"
                  min="0"
                  defaultValue={selectedPool.usageCap}
                  className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">WHITELISTED ADDRESSES</label>
                <textarea
                  name="addresses"
                  rows={4}
                  defaultValue={selectedPool.addresses.join("\n")}
                  placeholder="Enter one Arweave address per line"
                  className="w-full p-3 border-2 border-gray-300 bg-white text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent rounded-xl"
                ></textarea>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white p-3 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  SAVE CHANGES
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-white text-gray-700 border-2 border-gray-300 p-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
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

function setPools(arg0: (prev: any) => any) {
  throw new Error("Function not implemented.")
}

</file>

<file src="types.ts">
export interface Pool {
  sponsorInfo: string
  id: string
  name: string
  status: "Active" | "Ended"
  balance: number | null
  usageCap: number
  startTime: string
  endTime: string
  addresses: string[]
  poolId: string
}

export interface Strategy {
  connect: (permissions: string[]) => Promise<void>
  disconnect: () => Promise<void>
  getActiveAddress: () => Promise<string>
}
</file>

<file src="usePoolManager.ts">
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
            sponsorInfo: pool.sponsorInfo ?? "",
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
</file>

<file src="utils.ts">
import { format } from 'date-fns'

export const formatDateTime = (isoDate: string): string => {
  try {
    return format(new Date(isoDate), 'MMM d, yyyy, h:mm a')
  } catch {
    return isoDate
  }
}

export const localToZulu = (localDateTime: string): string => {
  try {
    return new Date(localDateTime).toISOString()
  } catch {
    return localDateTime
  }
}

export const isValidArweaveAddress = (address: string): boolean => {
  return /^[a-zA-Z0-9\-_]{43}$/.test(address)
}
</file>

</codebase>
