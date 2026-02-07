# Circle Wallet Integration - Flow Comparison

## ✅ Sekarang Flow Sama dengan Wagmi!

### Original Wagmi Pattern:
```typescript
const mutation = useMutation({
  mutationFn: async ({ poolAddress, amount, decimals }) => {
    // 1. Sign transaction
    const hash = await writeContract(config, {
      address: poolAddress,
      abi: lendingPoolAbi,
      functionName: 'supply',
      args: [address, amountBigInt],
    });
    
    // 2. Wait for confirmation
    const receipt = await waitForTransactionReceipt({ hash });
    
    return receipt;
  }
});
```

### Circle Pattern (Identik!):
```typescript
const mutation = useMutation({
  mutationFn: async ({ poolAddress, amount, decimals }) => {
    // 1. Sign transaction dengan Circle PIN
    const { challengeId, userToken } = await writeContract({
      address: poolAddress,
      abi: lendingPoolAbi,
      functionName: 'supply',
      args: [address, amountBigInt],
    });
    
    // 2. Wait for confirmation (polling Circle API)
    const receipt = await waitForCircleTransaction(challengeId, userToken);
    
    return receipt;
  }
});
```

## 🎯 Yang Sama:

| Feature | Wagmi | Circle |
|---------|-------|--------|
| **Write Contract** | ✅ `writeContract()` | ✅ `writeContract()` |
| **Wait Confirmation** | ✅ `waitForTransactionReceipt()` | ✅ `waitForCircleTransaction()` |
| **Get TxHash** | ✅ Return hash | ✅ From polling result |
| **Error Handling** | ✅ User rejection | ✅ User rejection |
| **Loading States** | ✅ loading → success | ✅ loading → success |
| **Toast Notifications** | ✅ Same pattern | ✅ Same pattern |
| **Explorer Link** | ✅ From txHash | ✅ From txHash |

## 🔄 Perbedaan Internal (Hidden dari User):

### 1. **Signing Method**:
- **Wagmi**: Browser wallet popup (MetaMask, etc)
- **Circle**: PIN input via Circle SDK

### 2. **Transaction Submission**:
- **Wagmi**: Direct to blockchain RPC
- **Circle**: Via Circle API → blockchain

### 3. **Confirmation Polling**:
- **Wagmi**: RPC polling untuk receipt
- **Circle**: Circle API polling untuk status

## 📝 Usage Example:

```typescript
"use client";

import { useSupplyLiquidity } from "@/hooks/use-supply-circle";

function SupplyButton() {
  const { status, mutation, txHash, error, reset } = useSupplyLiquidity();

  const handleSupply = () => {
    mutation.mutate({
      poolAddress: "0x...",
      amount: "100",
      decimals: 6,
    });
  };

  return (
    <div>
      <button 
        onClick={handleSupply}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Processing..." : "Supply"}
      </button>
      
      {status === "success" && txHash && (
        <a href={`https://explorer.com/tx/${txHash}`}>
          View Transaction
        </a>
      )}
      
      {status === "error" && <p>Error: {error}</p>}
    </div>
  );
}
```

## ✨ Benefits:

1. **Same API Surface** - Tidak perlu refactor existing code structure
2. **Same Error Handling** - User rejection, timeout, dll sama
3. **Same Loading States** - idle → loading → success/error
4. **Same Transaction Flow** - Sign → Confirm → Success
5. **TxHash Available** - Bisa link ke explorer seperti biasa

## 🚀 Migration Steps:

### Minimal Changes Needed:

1. **Import**: 
   ```diff
   - import { useSupply } from "@/hooks/use-supply";
   + import { useSupply } from "@/hooks/use-supply-circle";
   ```

2. **Hook remains same**:
   ```typescript
   const { status, mutation, txHash, error, reset } = useSupplyLiquidity();
   ```

3. **Usage remains same**:
   ```typescript
   mutation.mutate({ poolAddress, amount, decimals });
   ```

4. **Everything else unchanged!** ✅

## 📊 Transaction Status States:

```typescript
// Both wagmi and Circle support same states:
type TxStatus = "idle" | "loading" | "success" | "error";

// Circle API states (internal):
'INITIATED' → 'PENDING_RISK_SCREENING' → 'QUEUED' → 'SENT' → 'CONFIRMED' → 'COMPLETE'
                                                                              ↓
                                                                          'success'
```

## 🎉 Result:

**Flow 100% identik dengan wagmi!** User tidak akan notice perbedaan dalam experience, kecuali:
- Circle gunakan PIN instead of wallet popup
- Circle mungkin sedikit lebih cepat (managed infrastructure)
