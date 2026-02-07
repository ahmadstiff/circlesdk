# Circle Wallet + Wagmi Integration

## Setup Complete! ✅

Integrasi Circle programmable wallet dengan wagmi sudah dikonfigurasi. Berikut cara penggunaannya:

## 🔑 Key Concepts

**Circle Wallet** menggunakan programmable wallets (MPC) dimana:
- Private key dikelola oleh Circle securely
- Signing menggunakan PIN authentication via Circle SDK UI
- Tidak bisa langsung di-inject ke wagmi sebagai wallet connector

**Solusi:**
- ✅ **Read operations**: Gunakan wagmi normal dengan Circle wallet address
- ✅ **Write operations**: Gunakan Circle SDK dengan custom hooks

## 📦 Files Created

1. **`src/contexts/circle-wallet-context.tsx`**
   - Context provider untuk Circle wallet state
   - Menyediakan address, walletId, dan executeTransaction method

2. **`src/hooks/use-circle-wagmi.ts`**
   - `useCircleWagmiRead()` - Get Circle address untuk wagmi read
   - `useCircleContractWrite()` - Write contract via Circle SDK
   - `useCircleSendTransaction()` - Send native tokens via Circle SDK

3. **`src/app/api/endpoints/route.ts`** (updated)
   - Added `createTransaction` action
   - Added `sendTransaction` action

4. **`src/components/providers.tsx`** (updated)
   - Wrapped dengan `CircleWalletProvider`

## 🎯 Usage Examples

### Read Contract (Wagmi)

```typescript
import { useCircleWagmiRead } from "@/hooks/use-circle-wagmi";
import { useReadContract } from "wagmi";

function MyComponent() {
  const { address, isConnected } = useCircleWagmiRead();

  const { data: balance } = useReadContract({
    address: "0x...", // contract address
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: !!address },
  });

  return <div>Balance: {balance?.toString()}</div>;
}
```

### Write Contract (Circle SDK)

```typescript
import { useCircleContractWrite } from "@/hooks/use-circle-wagmi";
import { encodeFunctionData, parseEther } from "viem";

function MyComponent() {
  const { writeContract, isConnected } = useCircleContractWrite();

  const handleTransfer = async () => {
    const data = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [recipient, parseEther("1")],
    });

    await writeContract({
      contractAddress: "0x...",
      data,
    });
  };

  return (
    <button onClick={handleTransfer} disabled={!isConnected}>
      Transfer
    </button>
  );
}
```

### Send Native Token

```typescript
import { useCircleSendTransaction } from "@/hooks/use-circle-wagmi";
import { parseEther } from "viem";

function MyComponent() {
  const { sendTransaction } = useCircleSendTransaction();

  const handleSend = async () => {
    await sendTransaction({
      to: "0x...",
      amount: parseEther("0.1"),
    });
  };

  return <button onClick={handleSend}>Send ETH</button>;
}
```

## 🔄 Flow Diagram

```
READ OPERATIONS:
User → wagmi hooks → RPC node → Return data
       ↑
       └── Circle wallet address (from context)

WRITE OPERATIONS:
User → Circle hook → API endpoint → Circle API → Create challenge
                                                  ↓
SDK ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← Challenge ID
 ↓
Show PIN UI → User enters PIN → Sign transaction → Broadcast
```

## ⚙️ Configuration

Ensure these environment variables are set in `.env.local`:

```env
NEXT_PUBLIC_CIRCLE_APP_ID=your_app_id
CIRCLE_API_KEY=your_api_key
NEXT_PUBLIC_CIRCLE_BASE_URL=https://api.circle.com
```

## 🎨 Benefits

1. **Security**: Private keys never exposed, managed by Circle
2. **User Experience**: PIN-based authentication, no browser wallet needed
3. **Compatibility**: Works with any wagmi read hooks
4. **Type Safety**: Full TypeScript support with viem types
5. **Session Persistence**: Wallet remains connected across page refreshes

## 🚀 Next Steps

1. Check `src/app/example-usage.tsx` for complete examples
2. Read operations work exactly like normal wagmi usage
3. Write operations use Circle SDK hooks with PIN authentication
4. Test with your smart contracts on ARC Testnet

## 💡 Tips

- Always use `isConnected` check before operations
- Circle SDK will show PIN UI automatically for write operations
- Read operations are cached by wagmi's query system
- Transaction status can be tracked via Circle API if needed

## 🐛 Troubleshooting

**Issue**: Wagmi reads show null address
- **Fix**: Ensure wallet is connected via ConnectButton first

**Issue**: Write transaction fails
- **Fix**: Check console for API errors, verify contract address and ABI

**Issue**: PIN UI not showing
- **Fix**: Ensure Circle SDK initialized (check sdkReady state)
