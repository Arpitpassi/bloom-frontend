"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ExternalLink, Calculator, FileText, Database, Shield, BarChart3 } from "lucide-react"
import SplitText from "./SplitText"
// Import your logo here - update the path to match your actual logo file
import logo from "./logo.png"

export default function HomePage() {
  const [showSetupGuide, setShowSetupGuide] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)

  const handleGetStarted = () => {
    window.location.href = "/dashboard"
  }

  const handleAnimationComplete = () => {
    console.log("Bloomfaucets.beta animation completed!")
  }

  return (
    <div className="min-h-screen bg-white text-black font-mono relative overflow-hidden">
      {/* Geometric Decorations */}
      <div className="fixed top-0 right-0 w-48 h-48 border-2 border-gray-300 bg-black/5 rounded-bl-full -z-10" />
      <div className="fixed bottom-0 left-0 w-48 h-48 border-2 border-gray-300 bg-black/5 rounded-tr-full -z-10" />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              {/* Logo with imported reference */}
              <Image src={logo || "/placeholder.svg"} alt="Logo" width={180} height={90} className="mr-3" />
            </div>
            <button
              onClick={() => setShowContactModal(true)}
              className="text-black hover:underline font-semibold transition-all duration-200 cursor-pointer"
            >
              Mail Us
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <SplitText
            text="faucets.beta"
            className="text-4xl md:text-6xl font-bold mb-6 inline-block"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, transform: "translateY(40px)" }}
            to={{ opacity: 1, transform: "translateY(0)" }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
            onLetterAnimationComplete={handleAnimationComplete}
          />
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Creating and managing sponsored credit pools for the Arweave ecosystem made easy.
          </p>
          <div className="flex justify-center gap-6 flex-wrap">
            <button
              onClick={handleGetStarted}
              className="bg-white text-black border-2 border-black px-8 py-4 text-lg font-semibold hover:bg-black hover:text-white transition-colors rounded-xl"
            >
              Get Started
            </button>
            <button
              onClick={() => setShowSetupGuide(true)}
              className="bg-white text-black border-2 border-black px-8 py-4 text-lg font-semibold hover:bg-black hover:text-white transition-colors rounded-xl"
            >
              Setup Guide
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Pool Management */}
            <div className="p-6 text-center hover:bg-gray-100 transition-colors rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 border-2 border-blue-300 flex items-center justify-center mb-4 mx-auto rounded-2xl">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Pool Management</h3>
              <p className="text-gray-600">
                Create and manage multiple sponsor pools with custom configurations and access controls.
              </p>
            </div>

            {/* Access Control */}
            <div className="p-6 text-center hover:bg-gray-100 transition-colors rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 border-2 border-green-300 flex items-center justify-center mb-4 mx-auto rounded-2xl">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Access Control</h3>
              <p className="text-gray-600">
                Whitelist specific addresses and manage user access with granular permission controls.
              </p>
            </div>

            {/* Real-time Analytics */}
            <div className="p-6 text-center hover:bg-gray-100 transition-colors rounded-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 border-2 border-purple-300 flex items-center justify-center mb-4 mx-auto rounded-2xl">
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Analytics</h3>
              <p className="text-gray-600">
                Monitor pool usage, track spending, and get detailed insights into your pool activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Resources & Support Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-8">Resources & Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="https://discord.gg/wbhP7ND4"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border-2 border-gray-300 p-6 rounded-2xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-indigo-200 border-2 border-indigo-300 flex items-center justify-center mx-auto mb-4 rounded-2xl">
                <svg className="w-8 h-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
                Join Discord
                <ExternalLink className="w-4 h-4 ml-1" />
              </h3>
              <p className="text-gray-600 text-sm">Get community support and stay updated</p>
            </a>

            <a
              href="https://prices.ardrive.io/"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border-2 border-gray-300 p-6 rounded-2xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 border-2 border-orange-300 flex items-center justify-center mx-auto mb-4 rounded-2xl">
                <Calculator className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
                Price Calculator
                <ExternalLink className="w-4 h-4 ml-1" />
              </h3>
              <p className="text-gray-600 text-sm">Calculate Turbo credit costs</p>
            </a>

            <a
              href="https://github.com/ropats16/nitya-pools-code-ref"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border-2 border-gray-300 p-6 rounded-2xl hover:bg-gray-50 transition-colors group"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 border-2 border-teal-300 flex items-center justify-center mx-auto mb-4 rounded-2xl">
                <FileText className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2 flex items-center justify-center">
                Documentation
                <ExternalLink className="w-4 h-4 ml-1" />
              </h3>
              <p className="text-gray-600 text-sm">Learn how to use sponsored credits</p>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 border-t border-gray-300">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">© 2025 Bloom. All rights reserved. Version 0.0.23</p>
        </div>
      </footer>

      {/* Setup Guide Modal */}
      {showSetupGuide && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-gray-300 max-w-4xl w-full max-h-[80vh] overflow-y-auto p-8 relative">
            <button
              onClick={() => setShowSetupGuide(false)}
              className="absolute top-4 right-4 text-2xl font-bold hover:text-gray-600 p-1 hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h1 className="text-3xl font-bold mb-6">Bloomfaucets Quick Start Guide</h1>
            <p className="mb-6">Follow these steps to get started.</p>

            <h2 className="text-xl font-semibold mt-8 mb-4">1. Accessing the Application</h2>
            <ul className="list-disc pl-6 mb-4">
              <li>Ensure you have an Arweave-compatible wallet (e.g., Wander Wallet or Beacon) ready.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">2. Connecting Your Wallet</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                Click <strong>Connect Wallet</strong> on the homepage.
              </li>
              <li>
                Select either <strong>Wander Wallet</strong> or <strong>Beacon</strong> from the wallet selection
                pop-up.
              </li>
              <li>Follow the prompts in your wallet to establish a connection.</li>
              <li>Upon successful connection, you will be directed to the "Your Deployment Pools" dashboard.</li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">3. Creating a New Pool</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                Click <strong>+ New Pool</strong> on the dashboard.
              </li>
              <li>
                Complete the "Create New Pool" form with the following details:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>
                    <strong>Pool Name</strong>: A unique name for your pool.
                  </li>
                  <li>
                    <strong>Password</strong>: A secure password for pool management.
                  </li>
                  <li>
                    <strong>Start Time</strong> and <strong>End Time</strong>: The active duration of the pool.
                  </li>
                  <li>
                    <strong>Usage Cap</strong>: The maximum credit limit per wallet for the pool.
                  </li>
                  <li>
                    <strong>Whitelisted Addresses</strong>: Wallet Addresses allowed to use the pool.
                  </li>
                  <li>
                    <strong>Sponsor Info</strong>: Additional sponsor details.
                  </li>
                </ul>
              </li>
              <li>
                Click <strong>Create Pool</strong> to save your pool, or <strong>Cancel</strong>/<strong>×</strong> to
                discard changes.
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">4. Managing Your Pools</h2>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>
                Your pools are displayed on the dashboard, showing details such as name, status, balance, usage cap,
                duration, and whitelisted addresses.
              </li>
              <li>
                Click <strong>Pool Actions</strong> on a pool card to:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>View pool information, status, balance, and whitelisted addresses.</li>
                  <li>
                    Use <strong>Sponsor Credits</strong> (requires password) to sponsor all the addresses in the
                    whitelist
                  </li>
                  <li>
                    Enter an address to <strong>Revoke Access</strong> (requires password).
                  </li>
                  <li>
                    Click <strong>Download Wallet</strong> to save the pool's wallet key file.
                  </li>
                  <li>
                    Click <strong>Delete Pool</strong> to permanently remove the pool (requires confirmation and
                    password; ensure key files are downloaded first).
                  </li>
                </ul>
              </li>
              <li>
                For active pools, click <strong>Edit Pool</strong> to:
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Modify pool details in the "Edit Pool" form.</li>
                  <li>
                    Click <strong>Update Pool</strong> to save changes.
                  </li>
                </ul>
              </li>
            </ul>

            <h2 className="text-xl font-semibold mt-8 mb-4">5. Topping Up a Pool Wallet</h2>
            <p className="italic text-gray-600 mb-4">
              Note: This process may be time-consuming due to potential network congestion. Our development team is
              working to streamline this step in future updates.
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>Download the pool's wallet key file.</li>
              <li>Import the key file into your preferred wallet.</li>
              <li>
                Transfer AR tokens equivalent to the desired credit amount to the pool wallet. (Note: Turbo and AR
                prices may vary but are generally comparable.)
              </li>
              <li>
                Connect the pool wallet to{" "}
                <a
                  href="https://turbo-topup.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  turbo-topup.com
                </a>{" "}
                to convert AR tokens into Turbo credits.
              </li>
              <li>Your pool is now recharged with Turbo credits, ready to support sponsorships.</li>
            </ul>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-8 rounded-xl">
              <p className="font-semibold text-red-800">
                Important: Bloomfaucets is currently in beta. Securely store all wallet key files to prevent loss of
                access.
              </p>
            </div>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mt-4 rounded-xl">
              <p className="font-semibold text-red-800">
                For assistance with errors or bugs, please report issues on our{" "}
                <a
                  href="https://discord.gg/wbhP7ND4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-800"
                >
                  support Discord
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-2 border-gray-300 max-w-md w-full p-8 relative rounded-2xl">
            <button
              onClick={() => setShowContactModal(false)}
              className="absolute top-4 right-4 text-2xl font-bold hover:text-gray-600 p-1 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <p className="mb-6">For any inquiries or support mail us at.</p>
            <p>
              <strong>Email:</strong>{" "}
              <a href="mailto:support@bloomfaucets.com" className="text-blue-600 underline hover:text-blue-800">
                nityaprotocol@gmail.com
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
