"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConnection } from "wagmi";
import type { Address } from "viem";
import { useCallback } from "react";

export const userAddressQueryKeys = {
  all: ["userAddress"] as const,
  address: (address?: Address) => ["userAddress", address] as const,
};

export function useUserAddress() {
  const { address, isConnected, isConnecting, status, chain, chainId } =
    useConnection();

  const query = useQuery({
    queryKey: userAddressQueryKeys.address(address),
    queryFn: () => {
      return {
        address: address || null,
        isConnected,
        chain,
        chainId,
        status,
      };
    },
    enabled: true,
    staleTime: Infinity, // Data sudah reactive dari wagmi, tidak perlu refetch otomatis
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false, // Tidak refetch saat window focus
    refetchOnMount: false, // Tidak refetch saat component mount
    refetchOnReconnect: false, // Tidak refetch saat network reconnect
  });

  return {
    address: address || null,
    isConnected,
    isConnecting,
    isLoading: query.isLoading || isConnecting,
    status,
    chain,
    chainId,
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
