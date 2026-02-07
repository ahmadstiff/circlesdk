"use client";

import { ConnectButton } from "@/components/connect-button";
import { Github, Sparkles, Shield, Zap, Globe } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/80 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text-blue">CircleSDK</span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Features
            </a>
            <a href="#docs" className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
              Documentation
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-8">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">
              Powered by Circle Web3 Services
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="gradient-text-blue">Programmable Wallets</span>
            <br />
            <span className="text-gray-900">Made Simple</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Create and manage secure wallets with just a few clicks. 
            Experience the future of Web3 onboarding with Circle&apos;s 
            gasless, PIN-protected smart contract accounts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <ConnectButton />
            <a
              href="https://developers.circle.com/w3s/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all font-medium"
            >
              View Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Circle Wallets?
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Enterprise-grade security meets seamless user experience. 
              Build the next generation of Web3 applications.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="group p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                PIN Protected
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Secure your wallet with a personal PIN. No seed phrases to 
                remember, no risk of losing access to your assets.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/25">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Gasless Transactions
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Smart Contract Accounts enable gasless transactions. 
                Users don&apos;t need to hold native tokens to interact.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-2xl bg-white border-2 border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/25">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Multi-Chain Support
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Deploy wallets across Ethereum, Polygon, Avalanche, 
                Solana, and more. One account, multiple chains.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 border-y border-gray-200 bg-gradient-to-b from-white to-blue-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text-blue mb-2">
                $10B+
              </div>
              <div className="text-gray-600 text-sm">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text-blue mb-2">
                50M+
              </div>
              <div className="text-gray-600 text-sm">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text-blue mb-2">
                190+
              </div>
              <div className="text-gray-600 text-sm">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold gradient-text-blue mb-2">
                99.9%
              </div>
              <div className="text-gray-600 text-sm">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              Connect your wallet now and experience the seamless onboarding 
              that Circle Programmable Wallets provide.
            </p>
            <ConnectButton />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-700">CircleSDK Demo</span>
          </div>
          <div className="text-sm text-gray-500">
            Built with Circle Web3 Services • {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </main>
  );
}
