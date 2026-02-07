"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useCircleWriteContract } from "@/hooks/use-circle-wagmi";
import { useConnection } from "wagmi";
import type { Address, Hex, Abi } from "viem";

export type TxStatus = "idle" | "loading" | "success" | "error";

interface TransferFromParams {
  tokenAddress: Address;
  from: Address;
  to: Address;
  amount: bigint;
  abi: Abi;
}

export function useTransferFrom() {
  const { address } = useConnection();
  const { writeContract, isConnected } = useCircleWriteContract();

  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<Hex | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async ({ tokenAddress, from, to, amount, abi }: TransferFromParams) => {
      try {
        if (!address || !isConnected) {
          throw new Error("Wallet not connected");
        }

        setStatus("idle");
        setError(null);
        setTxHash(null);

        setStatus("loading");

        const result = await writeContract({
          address: tokenAddress,
          abi,
          functionName: "transferFrom",
          args: [from, to, amount],
        });

        setStatus("success");
        return result;
      } catch (e) {
        const err = e as Error;
        setStatus("error");
        setError(err.message);
        throw e;
      }
    },
  });

  const reset = () => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
    mutation.reset();
  };

  return { 
    status, 
    mutation, 
    txHash, 
    error, 
    reset,
    isConnected,
    isLoading: status === "loading",
    isSuccess: status === "success",
    isError: status === "error",
  };
}
