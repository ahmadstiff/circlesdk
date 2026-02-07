"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCircleWallet } from "@/contexts/circle-wallet-context";
import type { Address } from "viem";
import { useCallback } from "react";

export const userAddressQueryKeys = {
  all: ["userAddress"] as const,
  address: (address?: Address) => ["userAddress", address] as const,
};

export function useUserAddress() {
  const { address, isConnected, connectionState, blockchain } =
    useCircleWallet();

  // Keep query for cache invalidation support, even though data is reactive from Circle SDK
  useQuery({
    queryKey: userAddressQueryKeys.address(address ?? undefined),
    queryFn: () => {
      return {
        address: address || null,
        isConnected,
        connectionState,
        blockchain,
      };
    },
    enabled: true,
    staleTime: Infinity, // Data sudah reactive dari Circle SDK, tidak perlu refetch otomatis
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false, // Tidak refetch saat window focus
    refetchOnMount: false, // Tidak refetch saat component mount
    refetchOnReconnect: false, // Tidak refetch saat network reconnect
  });

  return {
    address: address || null,
    isConnected,
    connectionState,
    blockchain,
    isLoading:
      connectionState === "connecting" ||
      connectionState === "creating-wallet" ||
      connectionState === "getting-token" ||
      connectionState === "initializing",
  };
}

export function useUserAddressActions() {
  const queryClient = useQueryClient();

  const invalidateUserAddress = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: userAddressQueryKeys.all,
    });
  }, [queryClient]);

  const refetchUserAddress = useCallback(async () => {
    await queryClient.refetchQueries({
      queryKey: userAddressQueryKeys.all,
    });
  }, [queryClient]);

  const resetUserAddress = useCallback(() => {
    queryClient.resetQueries({
      queryKey: userAddressQueryKeys.all,
    });
  }, [queryClient]);

  return {
    invalidateUserAddress,
    refetchUserAddress,
    resetUserAddress,
    queryClient,
  };
}
