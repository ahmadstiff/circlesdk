# Circle SDK + Wagmi Template

Template project untuk integrasi Circle Web3 Services (W3S) dengan Wagmi di Next.js. Siap digunakan untuk project lain yang membutuhkan write contract dengan Circle SDK dan read contract dengan Wagmi.

## 🚀 Features

- ✅ **Circle Write Contract**: Write operations dengan Circle PIN confirmation
- ✅ **Wagmi Read Contract**: Read operations langsung dari blockchain  
- ✅ **TypeScript**: Full type safety
- ✅ **React Query**: Data fetching & caching
- ✅ **Reusable Hooks**: Clean, modular code structure
- ✅ **Next.js 14+**: App Router ready

## 📦 Tech Stack

- **Circle SDK**: `@circle-fin/w3s-pw-web-sdk` untuk write operations
- **Wagmi**: Read/write blockchain interactions
- **Viem**: Low-level Ethereum library
- **TanStack Query**: Data fetching & caching
- **Next.js 14**: Modern React framework
- **TypeScript**: Type-safe development

## 🏗️ Project Structure

```
circlesdk/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Home page
│   │   ├── coba/page.tsx         # Write contract demo
│   │   └── read-example/page.tsx # Read contract demo
│   ├── hooks/
│   │   ├── use-circle-wagmi.ts   # Circle write contract hook
│   │   └── use-transfer-from.ts  # TransferFrom example hook
│   ├── lib/
│   │   ├── config.ts             # Wagmi config
│   │   └── circle-connector.ts   # Circle wallet connector
│   ├── components/
│   │   └── providers.tsx         # Wagmi + React Query providers
│   └── app/api/
│       └── endpoints/route.ts    # Circle API proxy
├── READ_CONTRACT_GUIDE.md        # Guide untuk read contract
└── .env.local                    # Environment variables
```

## 🔧 Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd circlesdk
pnpm install
```

### 2. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_ID=your-circle-app-id
CIRCLE_API_KEY=your-circle-api-key
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-walletconnect-id
```

### 3. Run Development Server

```bash
pnpm dev
```

Visit:
- http://localhost:3000 - Home
- http://localhost:3000/coba - Write contract demo
- http://localhost:3000/read-example - Read contract demo

## 📖 Usage

### Write Contract (Circle SDK Required)

```typescript
import { useCircleWriteContract } from "@/hooks/use-circle-wagmi";

function MyComponent() {
  const { writeContract, isConnected } = useCircleWriteContract();

  const handleTransfer = async () => {
    const result = await writeContract({
      address: "0x...",
      abi: [...],
      functionName: "transfer",
      args: ["0xRecipient", 1000000n],
    });
    
    // User will see Circle PIN UI
    // Returns after successful confirmation
    console.log("Success!", result);
  };

  return (
    <button onClick={handleTransfer} disabled={!isConnected}>
      Transfer
    </button>
  );
}
```

### Read Contract (Wagmi Directly)

```typescript
import { useReadContract } from "wagmi";

function MyComponent() {
  const { data: balance } = useReadContract({
    address: "0x...",
    abi: [...],
    functionName: "balanceOf",
    args: ["0xAddress"],
  });

  return <div>Balance: {balance?.toString()}</div>;
}
```

## 🎯 Key Hooks

### `useCircleWriteContract`

Custom hook untuk write operations dengan Circle SDK.

```typescript
const { 
  writeContract,   // Function to call contract
  isConnected,     // Connection status
  address,         // Connected address
  disconnect       // Disconnect function
} = useCircleWriteContract();
```

**Features:**
- ✅ Automatic Circle PIN UI
- ✅ Transaction signing via Circle
- ✅ Type-safe contract calls
- ✅ Error handling

### `useTransferFrom`

Example hook untuk ERC20 transferFrom operation.

```typescript
const { 
  mutation,        // React Query mutation
  status,          // 'idle' | 'loading' | 'success' | 'error'
  txHash,          // Transaction hash
  error,           // Error message
  isLoading,       // Loading state
  isSuccess,       // Success state
  reset            // Reset function
} = useTransferFrom();

// Execute transfer
mutation.mutate({
  tokenAddress: "0x...",
  from: "0x...",
  to: "0x...",
  amount: 1000000n,
  abi: [...],
});
```

## 📝 API Proxy

API routes di `/api/endpoints` untuk:
- ✅ Create Circle user
- ✅ Get user token
- ✅ Get wallet balances
- ✅ Initialize Circle wallet

All Circle API calls proxied melalui Next.js API route untuk keamanan (hide API key).

## 🎨 Customization

### Tambah Custom Hook

```typescript
// src/hooks/use-my-contract.ts
import { useCircleWriteContract } from "@/hooks/use-circle-wagmi";
import { useMutation } from "@tanstack/react-query";

export function useMyContract() {
  const { writeContract } = useCircleWriteContract();
  
  const mutation = useMutation({
    mutationFn: async (params) => {
      return await writeContract({
        address: "0x...",
        abi: [...],
        functionName: "myFunction",
        args: [params.arg1, params.arg2],
      });
    },
  });

  return { mutation };
}
```

### Tambah API Endpoint

```typescript
// src/app/api/endpoints/route.ts

case "myNewAction": {
  const { param1, param2 } = params;
  
  const response = await fetch(
    `${CIRCLE_BASE_URL}/v1/w3s/your-endpoint`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CIRCLE_API_KEY}`,
      },
      body: JSON.stringify({ param1, param2 }),
    }
  );

  const data = await response.json();
  return NextResponse.json(data, { status: 200 });
}
```

## 🔍 Read vs Write

| Feature | Read Contract | Write Contract |
|---------|--------------|----------------|
| Method | `useReadContract` | `useCircleWriteContract` |
| Circle SDK | ❌ Not needed | ✅ Required |
| User PIN | ❌ No | ✅ Yes |
| Gas Fee | ❌ Free | ✅ Paid |
| Signature | ❌ No | ✅ Yes |
| Speed | ⚡ Instant | 🐢 Requires confirmation |

**Key Point:** 
- Read = Direct Wagmi
- Write = Circle SDK → Wagmi

## 📚 Documentation

- [Circle Developer Docs](https://developers.circle.com/w3s/docs)
- [Wagmi Docs](https://wagmi.sh)
- [Viem Docs](https://viem.sh)
- [READ_CONTRACT_GUIDE.md](./READ_CONTRACT_GUIDE.md) - Detailed read contract guide

## 🤝 Migration dari Circle SDK

Jika ada existing Circle SDK code:

```typescript
// Before (Pure Circle SDK)
const sdk = new W3SSdk();
await sdk.execute(challengeId, (error, result) => {
  // ...
});

// After (Template approach)
const { writeContract } = useCircleWriteContract();
const result = await writeContract({
  address: "0x...",
  abi: [...],
  functionName: "transfer",
  args: ["0x...", amount],
});
```

## 🐛 Troubleshooting

### "window is not defined" Error

Circle SDK harus di client-side. Pastikan `"use client"` directive ada di component.

```typescript
"use client";

import { useCircleWriteContract } from "@/hooks/use-circle-wagmi";
```

### Transaction Success tapi txHash null

Normal behavior. Circle SDK tidak selalu return txHash immediately. Transaction sudah berhasil ter-submit ke blockchain.

### Read Contract tidak perlu Circle SDK

Ya, benar! Read operations pakai Wagmi `useReadContract` langsung.

## 📄 License

MIT

## 🙏 Credits

Built with:
- [Circle Web3 Services](https://www.circle.com/en/web3-services)
- [Wagmi](https://wagmi.sh)
- [Next.js](https://nextjs.org)
