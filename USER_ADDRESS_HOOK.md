# User Address Hook Documentation

Hook untuk membaca user address langsung dari Circle SDK dengan React Query untuk caching dan invalidation.

## File Location
- Hook: `src/hooks/use-user-address.ts`

## Features

✅ Membaca address langsung dari Circle SDK (bukan dari wagmi)  
✅ Built-in caching dengan React Query  
✅ Query keys untuk easy invalidation  
✅ Helper functions untuk refetch dan reset  
✅ TypeScript support  
✅ Reactive data - auto update saat connection berubah  

## Basic Usage

### 1. Membaca User Address

```typescript
import { useUserAddress } from "@/hooks/use-user-address";

function MyComponent() {
  const { address, isConnected, isLoading } = useUserAddress();

  if (isLoading) return <div>Loading...</div>;
  if (!isConnected) return <div>Please connect wallet</div>;

  return <div>Your address: {address}</div>;
}
```

### 2. Invalidate Query (Setelah Transaksi)

```typescript
import { useUserAddress, useUserAddressActions } from "@/hooks/use-user-address";

function TransactionComponent() {
  const { address } = useUserAddress();
  const { invalidateUserAddress } = useUserAddressActions();

  const handleTransaction = async () => {
    // ... execute transaction
    
    // Invalidate cache untuk refresh data
    await invalidateUserAddress();
  };

  return <button onClick={handleTransaction}>Send Transaction</button>;
}
```

### 3. Mengakses Blockchain Information

```typescript
import { useUserAddress } from "@/hooks/use-user-address";

function MyComponent() {
  const { address, blockchain, connectionState } = useUserAddress();

  return (
    <div>
      <div>Address: {address}</div>
      <div>Blockchain: {blockchain}</div>
      <div>State: {connectionState}</div>
    </div>
  );
}
```

### 4. Using Query Keys Directly

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { userAddressQueryKeys } from "@/hooks/use-user-address";

function AnotherComponent() {
  const queryClient = useQueryClient();

  const refreshAddress = () => {
    // Invalidate all user address queries
    queryClient.invalidateQueries({ 
      queryKey: userAddressQueryKeys.all 
    });
  };

  const refreshSpecificAddress = (address: Address) => {
    // Invalidate specific address query
    queryClient.invalidateQueries({ 
      queryKey: userAddressQueryKeys.address(address) 
    });
  };

  return <button onClick={refreshAddress}>Refresh</button>;
}
```

## API Reference

### `useUserAddress()`

Hook utama untuk membaca user address.

**Returns:**
```typescript
{
  address: Address | null;       // User wallet address dari Circle SDK
  isConnected: boolean;           // Connection status
  connectionState: string;        // Detailed connection state (connecting, connected, etc)
  blockchain: string | null;      // Blockchain name (e.g., "ARC-TESTNET")
  isLoading: boolean;             // Loading status (connecting/creating wallet)
}
```
```

### `useUserAddressActions()`

Hook untuk mendapatkan action functions.

**Returns:**
```typescript
{
  invalidateUserAddress: () => Promise<void>;  // Invalidate cache
  refetchUserAddress: () => Promise<void>;     // Refetch data
  resetUserAddress: () => void;                // Reset cache
  queryClient: QueryClient;                     // Query client instance
}
```

### `userAddressQueryKeys`

Query keys untuk digunakan dengan `queryClient`.

```typescript
{
  all: ["userAddress"];                    // Semua user address queries
  address: (address?) => ["userAddress", address];  // Specific address query
}
```

## Common Use Cases

### 1. Refresh After Wallet Change

```typescript
const { address } = useUserAddress();
const { invalidateUserAddress } = useUserAddressActions();

useEffect(() => {
  // Invalidate when address changes
  invalidateUserAddress();
}, [address]);
```

### 2. Conditional Rendering

```typescript
const { address, isConnected, isLoading } = useUserAddress();

if (isLoading) return <Spinner />;
if (!isConnected) return <ConnectButton />;
if (!address) return <div>No address found</div>;

return <UserDashboard address={address} />;
```

### 3. Integration with Mutations

```typescript
import { useMutation } from "@tanstack/react-query";
import { useUserAddressActions } from "@/hooks/use-user-address";

function TransferComponent() {
  const { invalidateUserAddress } = useUserAddressActions();

  const mutation = useMutation({
    mutationFn: async (params) => {
      // Execute transfer
      return await transfer(params);
    },
    onSuccess: async () => {
      // Refresh address after successful transfer
      await invalidateUserAddress();
    },
  });

  return <button onClick={() => mutation.mutate(...)}>Transfer</button>;
}
```

## Configuration

Hook menggunakan konfigurasi React Query berikut:

- `staleTime: 1000ms` - Data dianggap fresh selama 1 detik
- `gcTime: 5 minutes` - Cache disimpan selama 5 menit

Anda bisa mengubah konfigurasi ini di file `use-user-address.ts` sesuai kebutuhan.

## Testing Example

```typescript
// Test component yang menggunakan hook
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

test("renders user address", () => {
  render(
    <QueryClientProvider client={queryClient}>
      <MyComponent />
    </QueryClientProvider>
  );
  
  // Test assertions
});
```

## Notes

- Hook ini menggunakan `useCircleWallet` langsung dari Circle SDK context (bukan dari wagmi)
- Memerlukan `QueryClientProvider` dari `@tanstack/react-query`
- Otomatis update ketika Circle wallet connection berubah
- Cache invalidation berguna setelah transaksi atau perubahan state wallet
- **Tidak ada `refetch` function** - gunakan `invalidateUserAddress()` untuk refresh data
- Auto-invalidation sudah ditambahkan di ConnectButton saat login/register/disconnect
- Data reactive langsung dari Circle SDK - lebih simple dan direct tanpa perlu sync wagmi
