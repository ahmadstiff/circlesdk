"use client";

import { useState } from "react";
import { useTransferFrom } from "@/hooks/use-transfer-from";
import { abi } from "./abi";
import { useConnection } from "wagmi";
import {
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function TransferFromPage() {
  const { address, isConnected } = useConnection();
  const {
    status,
    mutation,
    txHash,
    error,
    reset,
    isLoading,
    isSuccess,
    isError,
  } = useTransferFrom();

  // Form state
  const [tokenAddress, setTokenAddress] = useState(
    "0x6b175474e89094c44da98b954eedeac495271d0f",
  );
  const [fromAddress, setFromAddress] = useState(
    "0xd2135CfB216b74109775236E36d4b433F1DF507B",
  );
  const [toAddress, setToAddress] = useState(
    "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e",
  );
  const [amount, setAmount] = useState("123");

  const handleTransfer = () => {
    mutation.mutate({
      tokenAddress: tokenAddress as `0x${string}`,
      from: fromAddress as `0x${string}`,
      to: toAddress as `0x${string}`,
      amount: BigInt(amount),
      abi: abi,
    });
  };

  const getExplorerUrl = (hash: string) => {
    return `https://testnet.arcscan.app/tx/${hash}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              TransferFrom Test
            </h1>
            <p className="text-gray-600">
              Test Circle wallet integration dengan complete flow
            </p>
          </div>

          {/* Connection Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
              />
              <span className="text-sm font-medium text-gray-700">
                {isConnected
                  ? `Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`
                  : "Not connected"}
              </span>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token Address
              </label>
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0x..."
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Address
              </label>
              <input
                type="text"
                value={fromAddress}
                onChange={(e) => setFromAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0x..."
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Address
              </label>
              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0x..."
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleTransfer}
            disabled={!isConnected || isLoading}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Transfer"
            )}
          </button>

          {/* Status Display */}
          <div className="mt-8">
            {/* Loading State */}
            {isLoading && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Processing Transaction
                    </h3>
                    <p className="text-sm text-blue-700">
                      Please sign the transaction with your PIN...
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Status: <span className="font-mono">{status}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {isSuccess && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-green-900 mb-1">
                      Transaction Successful!
                    </h3>
                    <p className="text-sm text-green-700 mb-3">
                      Your transfer has been confirmed on the blockchain
                    </p>
                    {txHash && (
                      <a
                        href={getExplorerUrl(txHash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-800 font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View on Explorer
                      </a>
                    )}
                    {txHash && (
                      <p className="text-xs text-green-600 mt-2 font-mono break-all">
                        TX: {txHash}
                      </p>
                    )}
                    <button
                      onClick={reset}
                      className="mt-3 text-sm text-green-700 hover:text-green-800 font-medium"
                    >
                      Make another transfer
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error State */}
            {isError && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">
                      Transaction Failed
                    </h3>
                    <p className="text-sm text-red-700 mb-2">
                      {error || "An error occurred"}
                    </p>
                    <button
                      onClick={reset}
                      className="text-sm text-red-700 hover:text-red-800 font-medium"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Idle Info */}
            {status === "idle" && !isSuccess && !isError && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Ready to Transfer
                    </h3>
                    <p className="text-sm text-gray-600">
                      Fill in the form above and click Transfer to start
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-700 mb-2">
              Debug Info:
            </h4>
            <pre className="text-xs text-gray-600 overflow-x-auto">
              {JSON.stringify(
                {
                  status,
                  isConnected,
                  isLoading,
                  isSuccess,
                  isError,
                  txHash: txHash ? `${txHash.slice(0, 10)}...` : null,
                  error: error ? error.substring(0, 50) : null,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
