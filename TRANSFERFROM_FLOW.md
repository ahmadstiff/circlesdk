# TransferFrom Implementation - Complete Flow Guide

## 📁 Files Created/Modified:

1. **`/src/hooks/use-transfer-from.ts`** - Custom hook dengan mutation pattern
2. **`/src/app/coba/page.tsx`** - UI lengkap dengan semua states
3. **`/src/lib/utils/circle-tx-wait.ts`** - Transaction polling utility
4. **`/src/app/api/endpoints/route.ts`** - Added `getTransactionStatus` endpoint

## 🔄 Complete Flow Explanation:

### 1️⃣ **User Clicks "Transfer" Button**
```typescript
mutation.mutate({
  tokenAddress: "0x6b175474e89094c44da98b954eedeac495271d0f",
  from: "0xd2135CfB216b74109775236E36d4b433F1DF507B",
  to: "0xA0Cf798816D4b9b9866b5330EEa46a18382f251e", 
  amount: BigInt(123),
  abi: abi,
});
```

**Status:** `idle` → `loading`  
**UI:** Button shows "Processing..." with spinner

---

### 2️⃣ **Hook Validates Connection**
```typescript
if (!address || !isConnected) {
  throw new Error("Wallet not connected");
}
```

**Status:** Still `loading`  
**UI:** No change yet

---

### 3️⃣ **Encode Function Call**
Dalam `useCircleWriteContract()`:
```typescript
const data = encodeFunctionData({
  abi,
  functionName: "transferFrom",
  args: [from, to, amount],
}) as Hex;
```

**What happens:** Function call di-encode menjadi hex data  
**Example:** `0x23b872dd000000000000000000000000...`

---

### 4️⃣ **Create Transaction Challenge**
API call ke `/api/endpoints`:
```typescript
POST /api/endpoints
{
  action: "createTransaction",
  userToken: "eyJhbG...",
  walletId: "abc-123",
  contractAddress: "0x6b17...",
  data: "0x23b872dd...",
  value: "0"
}
```

**Circle API:** `POST /v1/w3s/user/transactions/contractExecution`  
**Response:**
```json
{
  "challengeId": "challenge-xyz-789"
}
```

**Status:** Still `loading`  
**UI:** "Please sign the transaction with your PIN..."

---

### 5️⃣ **Execute Challenge (Show PIN UI)**
```typescript
await executeTransaction(challengeId);
```

**What happens:**
- Circle SDK shows PIN input dialog
- User enters 6-digit PIN
- SDK sends signed transaction to Circle

**Status:** Still `loading` (waiting for blockchain)  
**UI:** PIN dialog closes, showing "Processing..."

---

### 6️⃣ **Wait for Transaction Confirmation**
```typescript
const txResult = await waitForCircleTransaction(challengeId, userToken, {
  timeout: 60000,
  interval: 2000,
});
```

**Polling Loop (every 2 seconds):**
```typescript
while (Date.now() - startTime < 60000) {
  const status = await checkTransactionStatus(challengeId);
  
  if (status === 'COMPLETE') break;
  if (status === 'FAILED') throw error;
  
  await sleep(2000); // Wait 2s
}
```

**Circle Transaction States:**
```
INITIATED → PENDING_RISK_SCREENING → QUEUED → SENT → CONFIRMED → COMPLETE
```

**API Polling:**
```typescript
GET /v1/w3s/transactions/{challengeId}

Response:
{
  "id": "tx-abc-123",
  "state": "COMPLETE",
  "txHash": "0xdef456...",
  "blockchain": "ARC-TESTNET"
}
```

**Status:** Still `loading`  
**UI:** "Processing..." (polling happening in background)

---

### 7️⃣ **Transaction Complete**
```typescript
if (txResult.txHash) {
  setTxHash(txResult.txHash);
}
setStatus("success");
```

**Status:** `loading` → `success`  
**UI Changes:**
- ✅ Green success box appears
- 🔗 "View on Explorer" link visible
- 📝 Transaction hash displayed
- 🔄 "Make another transfer" button

---

### 8️⃣ **Error Handling**
If any step fails:
```typescript
catch (e) {
  setStatus("error");
  setError(err.message);
  throw e;
}
```

**Common Errors:**
- `"Wallet not connected"` - User not logged in
- `"User cancelled"` - User closed PIN dialog
- `"Transaction timeout"` - Took more than 60 seconds
- `"Transaction failed"` - Blockchain rejected transaction

**Status:** `loading` → `error`  
**UI:** Red error box with error message

---

## 📊 State Management Details:

### Hook State Variables:
```typescript
const [status, setStatus] = useState<TxStatus>("idle");
// "idle" | "loading" | "success" | "error"

const [txHash, setTxHash] = useState<Hex | null>(null);
// null | "0xdef456..."

const [error, setError] = useState<string | null>(null);
// null | "Error message"
```

### Mutation State (from @tanstack/react-query):
```typescript
mutation.isPending   // true during transaction
mutation.isSuccess   // true after success
mutation.isError     // true if failed
mutation.data        // Transaction result
mutation.error       // Error object
```

### Combined Helper Booleans:
```typescript
isLoading = status === "loading"
isSuccess = status === "success"
isError = status === "error"
```

---

## 🎨 UI States Visualization:

### **Idle State:**
```
┌─────────────────────────────┐
│ Ready to Transfer           │
│ Fill in form and click...   │
└─────────────────────────────┘
[Transfer Button - Enabled]
```

### **Loading State:**
```
┌─────────────────────────────┐
│ ⟳ Processing Transaction    │
│ Please sign with your PIN   │
│ Status: loading             │
└─────────────────────────────┘
[Processing... Button - Disabled]
```

### **Success State:**
```
┌─────────────────────────────┐
│ ✓ Transaction Successful!   │
│ Confirmed on blockchain     │
│ 🔗 View on Explorer          │
│ TX: 0xdef456...             │
│ [Make another transfer]     │
└─────────────────────────────┘
```

### **Error State:**
```
┌─────────────────────────────┐
│ ✗ Transaction Failed        │
│ Error message here...       │
│ [Try again]                 │
└─────────────────────────────┘
```

---

## 🔍 Debug Information:

### Console Logs to Watch:
```typescript
// In useCircleWriteContract:
console.log("Creating transaction...");
console.log("Challenge ID:", challengeId);
console.log("Executing with PIN...");

// In waitForCircleTransaction:
console.log("Polling status:", status);
console.log("TX Complete! Hash:", txHash);
```

### Network Requests:
1. **POST** `/api/endpoints` - createTransaction
2. **GET** `/api/endpoints` - getTransactionStatus (multiple times)
3. Circle SDK internal requests (hidden)

---

## 🧪 Testing Steps:

### 1. **Connect Wallet:**
- Click "Connect Wallet" button
- Choose "Create Wallet" or "Login"
- Set PIN when prompted
- Verify connection status shows green

### 2. **Fill Form:**
- Token Address (ERC20 contract)
- From Address (must have approval)
- To Address (recipient)
- Amount (in wei/smallest unit)

### 3. **Submit Transaction:**
- Click "Transfer" button
- Watch status change to "loading"
- PIN dialog should appear
- Enter 6-digit PIN
- Wait for confirmation (2-60 seconds)

### 4. **Verify Success:**
- Status changes to "success"
- Green box appears
- Transaction hash visible
- Explorer link works

---

## ⚙️ Configuration Options:

### Polling Settings:
```typescript
waitForCircleTransaction(challengeId, userToken, {
  timeout: 60000,  // Max wait time (ms)
  interval: 2000,  // Check every 2s
});
```

### Adjust for your needs:
- **Fast blockchain:** `interval: 1000` (1s)
- **Slow blockchain:** `timeout: 120000` (2min)
- **Development:** `interval: 500` (0.5s)

---

## 🐛 Common Issues & Solutions:

### Issue 1: "User cancelled"
**Cause:** User closed PIN dialog  
**Solution:** Normal behavior, reset and try again

### Issue 2: "Transaction timeout"
**Cause:** Took longer than 60 seconds  
**Solution:** Increase `timeout` value

### Issue 3: "Wallet not connected"
**Cause:** Lost connection or not logged in  
**Solution:** Reconnect wallet first

### Issue 4: No txHash returned
**Cause:** Transaction still processing  
**Solution:** Check Circle console for status

---

## 📈 Performance Metrics:

**Typical Flow Duration:**
- Encode: ~10ms
- Create Challenge: ~200ms
- PIN Input: ~5s (user time)
- Blockchain Confirmation: ~10-30s
- **Total: ~15-35 seconds**

**API Calls:**
- Create Transaction: 1x
- Poll Status: ~5-15x (depends on blockchain speed)

---

## 🎯 Usage in Your App:

```typescript
import { useTransferFrom } from "@/hooks/use-transfer-from";

function YourComponent() {
  const { status, mutation, txHash, error, isLoading } = useTransferFrom();

  const handleSubmit = () => {
    mutation.mutate({
      tokenAddress: "0x...",
      from: "0x...",
      to: "0x...",
      amount: BigInt(123),
      abi: yourAbi,
    });
  };

  return (
    <div>
      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? "Processing..." : "Transfer"}
      </button>
      
      {isLoading && <p>Waiting for confirmation...</p>}
      {status === "success" && <p>Success! TX: {txHash}</p>}
      {status === "error" && <p>Error: {error}</p>}
    </div>
  );
}
```

---

## 🚀 Next Steps:

1. **Test on localhost** - Navigate to `/coba` page
2. **Connect wallet** - Login or create account
3. **Try transfer** - Fill form and submit
4. **Watch states** - See debug info update
5. **Check explorer** - Click "View on Explorer" link

**Happy testing!** 🎉
