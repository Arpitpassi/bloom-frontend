"use client"

import type React from "react"

import { useState } from "react"
import { X, Users } from "lucide-react"
import { ToastContainer, useToast } from "../../components/toast"

interface Pool {
  id: string
  name: string
  status: "Active" | "Ended"
  balance: number
  usageCap: number
  startTime: string
  endTime: string
  addresses: string[]
  poolId: string
}

export default function Dashboard() {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showPoolActions, setShowPoolActions] = useState(false)
  const [showAddressesModal, setShowAddressesModal] = useState(false)
  const [totalPools, setTotalPools] = useState(2)
  const [activePools, setActivePools] = useState(0)
  const [revokeAddress, setRevokeAddress] = useState("")
  const { toasts, removeToast, showSuccess, showError, showWarning, showInfo } = useToast()

  const [pools, setPools] = useState<Pool[]>([
    {
      id: "1",
      name: "host",
      status: "Ended",
      balance: 0.0312,
      usageCap: 0.0004,
      startTime: "6/3/2025, 12:50:00 AM",
      endTime: "6/14/2025, 3:53:00 AM",
      addresses: ["Ja4jWGlhoyq6JJzKEymioQtBJqEHBhErSUh6zBKr1dU", "afXI6WkgDuP9c9HbTfTCJp2DLXwI3s6nQSmCXae_C0g"],
      poolId: "40caa0ee19089e4efab99a5f619721cf",
    },
    {
      id: "2",
      name: "test",
      status: "Ended",
      balance: 0.0312,
      usageCap: 0.004,
      startTime: "6/10/2025, 3:05:00 PM",
      endTime: "6/14/2025, 3:53:00 AM",
      addresses: ["Ja4jWGlhoyq6JJzKEymioQtBJqEHBhErSUh6zBKr1dU"],
      poolId: "50dbb1ff20190f5fgbc00b6g720832dg",
    },
  ])

  const handleConnectWallet = () => {
    setShowWalletModal(true)
  }

  const handleWalletConnect = (type: "beacon" | "wander") => {
    setIsWalletConnected(true)
    setWalletAddress("Tp9-pvPf...RsDHmmSw")
    setShowWalletModal(false)
    showSuccess("Wallet Connected", `Successfully connected with ${type === "beacon" ? "Beacon" : "Wander"} wallet`)
  }

  const handleDisconnect = () => {
    setIsWalletConnected(false)
    setWalletAddress("")
    setSelectedPool(null)
    setShowPoolActions(false)
    showInfo("Wallet Disconnected", "Your wallet has been disconnected")
  }

  const handlePoolSelect = (pool: Pool) => {
    setSelectedPool(pool)
    setShowPoolActions(false)
  }

  const handlePoolActions = () => {
    setShowPoolActions(true)
  }

  const handleRevokeAccess = () => {
    if (!revokeAddress.trim()) {
      showError("Invalid Address", "Please enter a valid wallet address")
      return
    }

    if (selectedPool && selectedPool.addresses.includes(revokeAddress)) {
      // Remove address from pool
      const updatedPools = pools.map((pool) =>
        pool.id === selectedPool.id
          ? { ...pool, addresses: pool.addresses.filter((addr) => addr !== revokeAddress) }
          : pool,
      )
      setPools(updatedPools)
      setSelectedPool((prev) =>
        prev ? { ...prev, addresses: prev.addresses.filter((addr) => addr !== revokeAddress) } : null,
      )
      setRevokeAddress("")
      showSuccess("Access Revoked", `Successfully revoked access for ${revokeAddress.slice(0, 10)}...`)
    } else {
      showError("Address Not Found", "This address is not in the whitelist")
    }
  }

  const handleDownloadWallet = () => {
    showSuccess("Wallet Downloaded", "Pool wallet key file has been downloaded")
  }

  const handleDeletePool = () => {
    if (selectedPool) {
      setPools((prev) => prev.filter((pool) => pool.id !== selectedPool.id))
      setTotalPools((prev) => prev - 1)
      setSelectedPool(null)
      setShowPoolActions(false)
      showWarning("Pool Deleted", `Pool "${selectedPool.name}" has been permanently deleted`)
    }
  }

  const handleTopUp = () => {
    showInfo("Top Up Initiated", "Redirecting to top-up interface...")
  }

  const handleSponsorCredits = () => {
    showSuccess("Credits Sponsored", "Successfully sponsored credits to all whitelisted addresses")
  }

  const handleCreatePool = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const poolName = formData.get("poolName") as string

    if (!poolName.trim()) {
      showError("Invalid Pool Name", "Please enter a valid pool name")
      return
    }

    // Create new pool logic here
    setShowCreateModal(false)
    setTotalPools((prev) => prev + 1)
    showSuccess("Pool Created", `Pool "${poolName}" has been created successfully`)
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
                <div>
                  Balance: <span className="font-medium text-gray-900">{pool.balance.toFixed(4)}</span>
                </div>
                <div>
                  Usage Cap: <span className="font-medium text-gray-900">{pool.usageCap.toFixed(4)}</span>
                </div>
                <div className="text-xs">
                  Duration: {pool.startTime} - {pool.endTime}
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
        {/* Wallet Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center mb-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">NITYA POOL MANAGER</h2>

          {isWalletConnected ? (
            <div className="flex items-center justify-between">
              {/* Total Pools */}
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{totalPools}</div>
                <div className="text-sm text-gray-500 font-medium">TOTAL POOLS</div>
              </div>

              {/* Wallet Info */}
              <div className="text-center">
                <p className="text-base mb-4 text-gray-600">
                  Connected: <span className="font-medium">{walletAddress}</span>
                </p>
                <button
                  onClick={handleDisconnect}
                  className="bg-red-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  DISCONNECT
                </button>
              </div>

              {/* Active Pools */}
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

        {/* Dashboard Content */}
        {isWalletConnected && (
          <div>
            {showPoolActions && selectedPool ? (
              /* Pool Actions View */
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">POOL ACTIONS - {selectedPool.name}</h3>
                  <button onClick={() => setShowPoolActions(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-700">REVOKE ACCESS</h4>
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
              /* Pool Details */
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
                      <span
                        className={`font-semibold ${
                          selectedPool.status === "Active" ? "text-green-600" : "text-red-600"
                        }`}
                      >
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
                      <span className="font-semibold text-gray-900">{selectedPool.balance.toFixed(2)} Credits</span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-gray-600 font-medium">
                        Whitelisted Addresses ({selectedPool.addresses.length}):
                      </span>
                      <button
                        onClick={() => setShowAddressesModal(true)}
                        className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        View Addresses
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
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
              /* Default View */
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">YOUR DEPLOYMENT POOLS</h3>
                <p className="text-gray-600">
                  Your pools will appear in the sidebar once loaded. Click on pool actions to view its details.
                </p>
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
              >
                CONNECT WITH BEACON
              </button>
              <button
                onClick={() => handleWalletConnect("wander")}
                className="w-full bg-gray-900 text-white p-3 text-sm font-medium hover:bg-gray-800 transition-colors"
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

            <h3 className="text-xl font-semibold mb-6 text-gray-900">
              Whitelisted Addresses ({selectedPool.addresses.length})
            </h3>

            <div className="space-y-3">
              {selectedPool.addresses.map((address, index) => (
                <div key={index} className="bg-gray-50 border-2 border-black p-4 font-mono text-sm break-all">
                  {address}
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
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  MAX CREDITS PER WALLET (USAGE CAP)
                </label>
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
    </div>
  )
}
