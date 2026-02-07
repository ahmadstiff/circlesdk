# Read Contract dengan Circle SDK

## TL;DR: Bisa Langsung Pakai Wagmi! ✅

**Read contract TIDAK perlu flow Circle SDK** karena:
- ✅ Tidak perlu signature/PIN
- ✅ Tidak perlu user authentication  
- ✅ Langsung query blockchain via RPC

---

## Cara 1: Wagmi Hook (Recommended)

```typescript
import { useReadContract } from "wagmi";
import { abi } from "./abi";

function MyComponent() {
  const { data, isLoading, error } = useReadContract({
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    abi,
    functionName: "balanceOf",
    args: ["0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"],
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <div>Balance: {data?.toString()}</div>;
}
```

### Features:
- ✅ Auto-refetch on block change
- ✅ Built-in caching
- ✅ TypeScript support
- ✅ No Circle SDK needed

---

## Cara 2: Viem Client (Lower Level)

```typescript
import { usePublicClient } from "wagmi";

function MyComponent() {
  const publicClient = usePublicClient();
  const [balance, setBalance] = useState<bigint>();

  useEffect(() => {
    async function fetchBalance() {
      const result = await publicClient.readContract({
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
        abi,
        functionName: "balanceOf",
        args: ["0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"],
      });
      setBalance(result);
    }
    fetchBalance();
  }, [publicClient]);

  return <div>Balance: {balance?.toString()}</div>;
}
```

---

## Cara 3: React Query (Custom Hook)

Untuk reusable logic:

```typescript
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { Address, Abi } from "viem";

interface UseReadContractParams {
  address: Address;
  abi: Abi;
  functionName: string;
  args?: unknown[];
  enabled?: boolean;
}

export function useCustomReadContract({
  address,
  abi,
  functionName,
  args = [],
  enabled = true,
}: UseReadContractParams) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["contract", address, functionName, args],
    queryFn: async () => {
      const result = await publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      });
      return result;
    },
    enabled,
    staleTime: 30000, // Cache for 30 seconds
  });
}
```

Usage:
```typescript
const { data: balance } = useCustomReadContract({
  address: "0x6b175474e89094c44da98b954eedeac495271d0f",
  abi,
  functionName: "balanceOf",
  args: ["0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"],
});
```

---

## Comparison: Read vs Write

| Feature | Read Contract | Write Contract |
|---------|--------------|----------------|
| Circle SDK | ❌ Not needed | ✅ Required |
| User PIN | ❌ No | ✅ Yes |
| Gas Fee | ❌ Free | ✅ Paid |
| Signature | ❌ No | ✅ Yes |
| Method | Wagmi directly | Circle + Wagmi |

---

## Example: Complete ERC20 Read Operations

```typescript
"use client";

import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { abi } from "./erc20-abi";

export default function TokenInfo() {
  const tokenAddress = "0x6b175474e89094c44da98b954eedeac495271d0f";
  const userAddress = "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e";

  // Read token name
  const { data: name } = useReadContract({
    address: tokenAddress,
    abi,
    functionName: "name",
  });

  // Read token symbol
  const { data: symbol } = useReadContract({
    address: tokenAddress,
    abi,
    functionName: "symbol",
  });

  // Read decimals
  const { data: decimals } = useReadContract({
    address: tokenAddress,
    abi,
    functionName: "decimals",
  });

  // Read balance
  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi,
    functionName: "balanceOf",
    args: [userAddress],
  });

  // Read total supply
  const { data: totalSupply } = useReadContract({
    address: tokenAddress,
    abi,
    functionName: "totalSupply",
  });

  // Read allowance
  const { data: allowance } = useReadContract({
    address: tokenAddress,
    abi,
    functionName: "allowance",
    args: [userAddress, "0xSPENDER_ADDRESS"],
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Token Information</h2>
      
      <div className="space-y-2">
        <div>Name: {name as string}</div>
        <div>Symbol: {symbol as string}</div>
        <div>Decimals: {decimals?.toString()}</div>
        <div>
          Balance: {balance ? formatUnits(balance as bigint, decimals as number) : "0"}
        </div>
        <div>
          Total Supply: {totalSupply ? formatUnits(totalSupply as bigint, decimals as number) : "0"}
        </div>
        <div>
          Allowance: {allowance ? formatUnits(allowance as bigint, decimals as number) : "0"}
        </div>
      </div>
    </div>
  );
}
```

---

## Multi-Call Pattern (Efficient)

Untuk read multiple values sekaligus:

```typescript
import { useReadContracts } from "wagmi";

function TokenDashboard() {
  const { data, isLoading } = useReadContracts({
    contracts: [
      {
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
        abi,
        functionName: "name",
      },
      {
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
        abi,
        functionName: "symbol",
      },
      {
        address: "0x6b175474e89094c44da98b954eedeac495271d0f",
        abi,
        functionName: "balanceOf",
        args: ["0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"],
      },
    ],
  });

  if (isLoading) return <div>Loading...</div>;

  const [name, symbol, balance] = data || [];

  return (
    <div>
      <h2>{name?.result as string} ({symbol?.result as string})</h2>
      <p>Balance: {balance?.result?.toString()}</p>
    </div>
  );
}
```

### Benefits:
- ✅ Single RPC call (more efficient)
- ✅ Atomic data fetching
- ✅ Better performance

---

## Watch for Changes

Auto-update when blockchain state changes:

```typescript
import { useReadContract } from "wagmi";

function LiveBalance() {
  const { data: balance } = useReadContract({
    address: "0x6b175474e89094c44da98b954eedeac495271d0f",
    abi,
    functionName: "balanceOf",
    args: ["0xA0Cf798816D4b9b9866b5330EEa46a18382f251e"],
    query: {
      refetchInterval: 5000, // Refetch every 5 seconds
    },
  });

  return <div>Live Balance: {balance?.toString()}</div>;
}
```

---

## Summary

**Untuk Read Contract:**
- ✅ Pakai `useReadContract` dari wagmi langsung
- ✅ TIDAK perlu Circle SDK
- ✅ TIDAK perlu PIN/signature
- ✅ Gratis (no gas fee)

**Untuk Write Contract:**
- ✅ Harus pakai `useCircleWriteContract` (Circle SDK)
- ✅ Perlu PIN confirmation
- ✅ Bayar gas fee

**Template Project sudah siap** dengan:
- ✅ Circle write contract hooks
- ✅ Wagmi configuration
- ✅ React Query setup
- ✅ TypeScript support
- ✅ Reusable patterns
