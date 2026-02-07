"use client";

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import type { Address } from "viem";

type LoginResult = {
  userToken: string;
  encryptionKey: string;
};

type WalletData = {
  id: string;
  address: string;
  blockchain: string;
  [key: string]: unknown;
};

type ConnectionState =
  | "disconnected"
  | "connecting"
  | "creating-user"
  | "getting-token"
  | "initializing"
  | "creating-wallet"
  | "connected";

interface CircleWalletContextType {
  // SDK
  sdk: W3SSdk | null;
  sdkReady: boolean;
  
  // Connection state
  connectionState: ConnectionState;
  isConnected: boolean;
  
  // Wallet data
  address: Address | null;
  walletId: string | null;
  userId: string;
  blockchain: string | null;
  
  // Login result
  loginResult: LoginResult | null;
  
  // Methods
  executeTransaction: (challengeId: string) => Promise<void>;
}

const CircleWalletContext = createContext<CircleWalletContextType | null>(null);

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

export function CircleWalletProvider({ children }: { children: ReactNode }) {
  const sdkRef = useRef<W3SSdk | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [userId, setUserId] = useState<string>("");
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");

  // Hydrate from localStorage after mount
  useEffect(() => {
    const savedUserId = window.localStorage.getItem("circleUserId") || "";
    const savedUserToken = window.localStorage.getItem("circleUserToken");
    const savedEncryptionKey = window.localStorage.getItem("circleEncryptionKey");
    const savedWallets = window.localStorage.getItem("circleWallets");
    
    if (savedUserId) setUserId(savedUserId);
    
    if (savedUserToken && savedEncryptionKey) {
      setLoginResult({
        userToken: savedUserToken,
        encryptionKey: savedEncryptionKey,
      });
    }
    
    if (savedWallets) {
      try {
        const parsedWallets = JSON.parse(savedWallets) as WalletData[];
        setWallets(parsedWallets);
        
        if (savedUserId && savedUserToken && savedEncryptionKey && parsedWallets.length > 0) {
          setConnectionState("connected");
        }
      } catch {
        // Invalid JSON
      }
    }
  }, []);

  // Initialize SDK
  useEffect(() => {
    let cancelled = false;

    const initSdk = async () => {
      try {
        const sdk = new W3SSdk({
          appSettings: { appId },
        });

        sdkRef.current = sdk;

        if (!cancelled) {
          setSdkReady(true);
        }
      } catch (err) {
        console.error("Failed to initialize Circle SDK:", err);
      }
    };

    void initSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  // Restore session when SDK is ready
  useEffect(() => {
    const restoreSession = async () => {
      if (!sdkReady || !sdkRef.current || !loginResult) return;
      
      const hasSession = userId && loginResult.userToken && wallets.length > 0;
      
      if (hasSession && connectionState === "connected") {
        console.log("Restoring Circle wallet session for user:", userId);
        
        sdkRef.current.setAuthentication({
          userToken: loginResult.userToken,
          encryptionKey: loginResult.encryptionKey,
        });
      }
    };

    void restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]);

  const executeTransaction = useCallback(async (challengeId: string) => {
    if (!sdkRef.current || !loginResult) {
      throw new Error("Circle SDK not ready");
    }

    return new Promise<void>((resolve, reject) => {
      sdkRef.current!.execute(challengeId, (error, result) => {
        if (error) {
          console.error("Transaction execution failed:", error);
          reject(error);
        } else {
          console.log("Transaction executed successfully:", result);
          resolve();
        }
      });
    });
  }, [loginResult]);

  const primaryWallet = wallets[0];
  const address = primaryWallet?.address as Address | null;
  const walletId = primaryWallet?.id || null;
  const blockchain = primaryWallet?.blockchain || null;

  const value: CircleWalletContextType = {
    sdk: sdkRef.current,
    sdkReady,
    connectionState,
    isConnected: connectionState === "connected" && !!address,
    address,
    walletId,
    userId,
    blockchain,
    loginResult,
    executeTransaction,
  };

  return (
    <CircleWalletContext.Provider value={value}>
      {children}
    </CircleWalletContext.Provider>
  );
}

export function useCircleWallet() {
  const context = useContext(CircleWalletContext);
  if (!context) {
    throw new Error("useCircleWallet must be used within CircleWalletProvider");
  }
  return context;
}
