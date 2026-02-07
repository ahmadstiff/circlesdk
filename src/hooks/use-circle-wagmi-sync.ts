"use client";

import { useEffect } from "react";
import { useConnect, useDisconnect, useConnection } from "wagmi";
import { useCircleWallet } from "@/contexts/circle-wallet-context";
import { useConnectors } from "wagmi";

/**
 * Hook to sync Circle wallet connection with wagmi
 * This automatically connects/disconnects wagmi when Circle wallet state changes
 */
export function useCircleWagmiSync() {
  const {
    isConnected: isCircleConnected,
    address: circleAddress,
    connectionState,
  } = useCircleWallet();
  const connect = useConnect();
  const connectors = useConnectors();
  const disconnect = useDisconnect();
  const { address: wagmiAddress, isConnected: isWagmiConnected } =
    useConnection();

  useEffect(() => {
    const circleConnector = connectors.find((c) => c.id === "circle-wallet");

    if (!circleConnector) {
      console.warn("Circle connector not found in wagmi connectors");
      return;
    }

    const syncConnection = () => {
      if (isCircleConnected && circleAddress) {
        // Circle is connected, check if wagmi needs to sync
        if (!isWagmiConnected || wagmiAddress !== circleAddress) {
          console.log("Syncing wagmi with Circle wallet:", circleAddress);

          try {
            connect.mutate({ connector: circleConnector });
          } catch (error) {
            console.error("Failed to sync wagmi connection:", error);
          }
        }
      } else if (!isCircleConnected && isWagmiConnected) {
        // Circle is disconnected but wagmi is still connected
        console.log("Disconnecting wagmi to sync with Circle wallet state");
        disconnect.mutate();
      }
    };

    // Run sync whenever Circle connection state changes
    syncConnection();
  }, [
    isCircleConnected,
    circleAddress,
    connectionState,
    wagmiAddress,
    isWagmiConnected,
    connect,
    disconnect,
    connectors,
  ]);
}
