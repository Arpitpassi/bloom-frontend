"use client"

import React, { useState, useEffect } from "react"
import { X, Users, ClipboardPenIcon } from "lucide-react"
import { ToastContainer, useToast } from "@/components/toast"
import { localToZulu, isValidArweaveAddress, formatDateTime } from './utils'
import { TimeLeftDial } from './TimeLeftDial'
import { Pool, Strategy } from './types'
import { usePoolManager } from './usePoolManager'

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
  const { pools, selectedPool, setSelectedPool, totalPools, setTotalPools, activePools, setActivePools, 
          fetchBalance, loadPools, handleCreatePool, handleEditPool, handleDeletePool, 
          handleRevokeAccess, handleDownloadWallet, handleTopUp, handleSponsorCredits, handleRefreshBalance } = usePoolManager(walletAddress, isWalletConnected, setShowPoolActions, setShowCreateModal, setShowEditModal)

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
      console.error('Wallet connection error:', error)
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
      console.error('Wallet disconnection error:', error)
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
          prev.map((p: { id: string }) => (p.id === pool.id ? { ...p, balance } : p))
        )
        setSelectedPool(prev => (prev ? { ...prev, balance } : prev))
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
                <div className="text-xs">Duration: {formatDateTime(pool.startTime)} - {formatDateTime(pool.endTime)}</div>
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
                className="akarta bg-gray-900 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
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
                      onClick={() => handleRevokeAccess(revokeAddress)}
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
                      <span className="text-gray-600 font-medium">Time Left:</span>
                      <TimeLeftDial startTime={selectedPool.startTime} endTime={selectedPool.endTime} />
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Whitelisted Addresses ({selectedPool.addresses.length})</h3>
              <button
                onClick={() => setShowAddressesModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
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

function setPools(arg0: (prev: any) => any) {
  throw new Error("Function not implemented.")
}
