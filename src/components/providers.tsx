"use client";
import { config } from "@/lib/config";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CircleWalletProvider } from "@/contexts/circle-wallet-context";
import { useCircleWagmiSync } from "@/hooks/use-circle-wagmi-sync";

const queryClient = new QueryClient();

function WagmiSync() {
  useCircleWagmiSync();
  return null;
}

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <CircleWalletProvider>
          <WagmiSync />
          {children}
        </CircleWalletProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default Providers;
