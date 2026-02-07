/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCircleWallet } from "@/contexts/circle-wallet-context";
import { useCallback } from "react";
import type { Address, Hex, Abi } from "viem";
import { encodeFunctionData } from "viem";

interface WriteContractParams<
  TAbi extends Abi | readonly unknown[] = Abi,
  TFunctionName extends string = string,
> {
  address: Address;
  abi: TAbi;
  functionName: TFunctionName;
  args?: readonly unknown[];
  value?: bigint;
}

/**
 * Custom hook for writing contracts using Circle SDK
 * Works like wagmi's useWriteContract but uses Circle for signing
 * 
 * @example
 * const { writeContract, isLoading } = useCircleWriteContract();
 * 
 * await writeContract({
 *   address: '0x...',
 *   abi: contractAbi,
 *   functionName: 'transfer',
 *   args: [recipient, amount],
 * });
 */
export function useCircleWriteContract() {
  const { isConnected, walletId, loginResult, executeTransaction } = useCircleWallet();

  const writeContract = useCallback(
    async <TAbi extends Abi | readonly unknown[], TFunctionName extends string>({
      address: contractAddress,
      abi,
      functionName,
      args,
      value = BigInt(0),
    }: WriteContractParams<TAbi, TFunctionName>) => {
      if (!isConnected || !walletId || !loginResult) {
        throw new Error("Circle wallet not connected");
      }

      // Encode the function call
      const data = encodeFunctionData({
        abi,
        functionName,
        args,
      } as any) as Hex;

      // Step 1: Create transaction challenge via API
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createTransaction",
          userToken: loginResult.userToken,
          walletId,
          contractAddress,
          data,
          value: value.toString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create transaction");
      }

      const { challengeId } = result;

      // Step 2: Execute challenge using Circle SDK (will show PIN UI)
      await executeTransaction(challengeId);

      return { 
        challengeId, 
        userToken: loginResult.userToken 
      };
    },
    [isConnected, walletId, loginResult, executeTransaction]
  );

  return {
    writeContract,
    isConnected,
  };
}

/**
 * Hook untuk send native token (ETH, MATIC, etc) menggunakan Circle SDK
 * 
 * @example
 * const { sendTransaction } = useCircleSendTransaction();
 * 
 * await sendTransaction({
 *   to: '0x...',
 *   amount: parseEther('0.1'),
 * });
 */
export function useCircleSendTransaction() {
  const { isConnected, walletId, loginResult, executeTransaction } = useCircleWallet();

  const sendTransaction = useCallback(
    async ({ to, amount }: { to: Address; amount: bigint }) => {
      if (!isConnected || !walletId || !loginResult) {
        throw new Error("Circle wallet not connected");
      }

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendTransaction",
          userToken: loginResult.userToken,
          walletId,
          to,
          amount: amount.toString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create transaction");
      }

      const { challengeId } = result;
      await executeTransaction(challengeId);

      return { 
        challengeId, 
        userToken: loginResult.userToken 
      };
    },
    [isConnected, walletId, loginResult, executeTransaction]
  );

  return {
    sendTransaction,
    isConnected,
  };
}
