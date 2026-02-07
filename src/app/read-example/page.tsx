"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";

// Simple ERC20 ABI for read operations
const ERC20_ABI = [
  {
    inputs: [],
    name: "name",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function ReadContractExample() {
  // DAI token on Arbitrum Sepolia
  const tokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
  const userAddress = "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e";

  // Read token name
  const { data: name, isLoading: nameLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "name",
  });

  // Read token symbol
  const { data: symbol, isLoading: symbolLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "symbol",
  });

  // Read decimals
  const { data: decimals, isLoading: decimalsLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  // Read balance
  const { data: balance, isLoading: balanceLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [userAddress],
  });

  // Read total supply
  const { data: totalSupply, isLoading: supplyLoading } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "totalSupply",
  });

  const isLoading = nameLoading || symbolLoading || decimalsLoading || balanceLoading || supplyLoading;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Read Contract Example
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Demo: Reading ERC20 token data using Wagmi (No Circle SDK needed)
          </p>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading contract data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Token Info */}
              <div className="border-b pb-4">
                <h2 className="text-lg font-semibold mb-3">Token Information</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{name as string || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Symbol:</span>
                    <span className="font-medium">{symbol as string || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Decimals:</span>
                    <span className="font-medium">{decimals?.toString() || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Balance Info */}
              <div className="border-b pb-4">
                <h2 className="text-lg font-semibold mb-3">Balance</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Address:</span>
                    <span className="font-mono text-xs">
                      {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-medium">
                      {balance && decimals
                        ? formatUnits(balance as bigint, decimals as number)
                        : "0"}{" "}
                      {symbol as string}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Raw Balance:</span>
                    <span className="font-mono text-xs">
                      {balance?.toString() || "0"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Supply Info */}
              <div>
                <h2 className="text-lg font-semibold mb-3">Supply</h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Supply:</span>
                    <span className="font-medium">
                      {totalSupply && decimals
                        ? formatUnits(totalSupply as bigint, decimals as number)
                        : "0"}{" "}
                      {symbol as string}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Raw Supply:</span>
                    <span className="font-mono text-xs">
                      {totalSupply?.toString() || "0"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              ℹ️ No Circle SDK Required
            </h3>
            <p className="text-sm text-blue-800">
              Read operations use Wagmi&apos;s <code className="bg-blue-100 px-1 rounded">useReadContract</code> directly.
              No PIN, no signature, no Circle SDK needed!
            </p>
          </div>

          {/* Code Example */}
          <div className="mt-6 bg-gray-900 text-white rounded-lg p-4">
            <h3 className="font-semibold mb-2">Code Example:</h3>
            <pre className="text-xs overflow-x-auto">
{`import { useReadContract } from "wagmi";

const { data: balance } = useReadContract({
  address: "${tokenAddress}",
  abi: ERC20_ABI,
  functionName: "balanceOf",
  args: ["${userAddress}"],
});

// That's it! No Circle SDK needed.`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
