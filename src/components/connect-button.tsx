/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";
import {
  Wallet,
  LogOut,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn, shortenAddress, formatBalance } from "@/lib/utils";

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;
const ACCOUNT_TYPE = "SCA";
const PRIMARY_WALLET_BLOCKCHAIN = "ARC-TESTNET";

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

const BLOCKCHAIN_INFO: Record<
  string,
  { name: string; icon: string; color: string }
> = {
  "ARC-TESTNET": {
    name: "ARC Testnet",
    icon: "🔮",
    color: "from-blue-600 to-blue-500",
  },
  "ETH-SEPOLIA": {
    name: "Ethereum Sepolia",
    icon: "⟠",
    color: "from-blue-600 to-blue-500",
  },
  "MATIC-AMOY": {
    name: "Polygon Amoy",
    icon: "⬡",
    color: "from-purple-600 to-indigo-600",
  },
  "AVAX-FUJI": {
    name: "Avalanche Fuji",
    icon: "🔺",
    color: "from-red-500 to-orange-600",
  },
  "SOL-DEVNET": {
    name: "Solana Devnet",
    icon: "◎",
    color: "from-green-500 to-teal-600",
  },
};

export function ConnectButton() {
  const sdkRef = useRef<W3SSdk | null>(null);

  const [sdkReady, setSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mode, setMode] = useState<"create" | "login">("create");
  const [mounted, setMounted] = useState(false);

  // Hydrate from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    setMounted(true);
    
    // Load session from localStorage
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
        
        // If we have all session data, mark as connected
        if (savedUserId && savedUserToken && savedEncryptionKey && parsedWallets.length > 0) {
          setConnectionState("connected");
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, []);

  // Initialize SDK on mount
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
        console.error("Failed to initialize Web SDK:", err);
        if (!cancelled) {
          setError("Failed to initialize SDK");
        }
      }
    };

    void initSdk();

    return () => {
      cancelled = true;
    };
  }, []);

  // Get / cache deviceId
  useEffect(() => {
    const fetchDeviceId = async () => {
      if (!sdkRef.current) return;

      try {
        const cached =
          typeof window !== "undefined"
            ? window.localStorage.getItem("deviceId")
            : null;

        if (cached) {
          setDeviceId(cached);
          return;
        }

        const id = await sdkRef.current.getDeviceId();
        setDeviceId(id);

        if (typeof window !== "undefined") {
          window.localStorage.setItem("deviceId", id);
        }
      } catch (error) {
        console.error("Failed to get deviceId:", error);
      }
    };

    if (sdkReady) {
      void fetchDeviceId();
    }
  }, [sdkReady]);

  // Restore session on mount if it exists
  useEffect(() => {
    const restoreSession = async () => {
      if (!sdkReady || !sdkRef.current || !loginResult) return;
      
      // Only restore once on mount
      const hasSession = userId && loginResult.userToken && wallets.length > 0;
      
      if (hasSession && connectionState === "connected") {
        console.log("Restoring session for user:", userId);
        
        // Set SDK authentication
        sdkRef.current.setAuthentication({
          userToken: loginResult.userToken,
          encryptionKey: loginResult.encryptionKey,
        });
        
        // Load fresh balance
        if (wallets[0]?.id) {
          void loadUsdcBalance(loginResult.userToken, wallets[0].id);
        }
      }
    };

    void restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sdkReady]); // Only run when SDK becomes ready

  // Load USDC balance
  const loadUsdcBalance = useCallback(async (userToken: string, walletId: string) => {
    if (!walletId) return null;

    try {
      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getTokenBalance",
          userToken,
          walletId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to load USDC balance:", data);
        return null;
      }

      const balances = (data.tokenBalances as any[]) || [];

      const usdcEntry =
        balances.find((t) => {
          const symbol = t.token?.symbol || "";
          const name = t.token?.name || "";
          return symbol.startsWith("USDC") || name.includes("USDC");
        }) ?? null;

      const amount = usdcEntry?.amount ?? "0";
      setUsdcBalance(amount);
      return amount;
    } catch (err) {
      console.error("Failed to load USDC balance:", err);
      return null;
    }
  }, []);

  // Save session
  const saveSession = useCallback(
    (walletData: WalletData[], userToken: string, encryptionKey: string, currentUserId: string) => {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("circleUserId", currentUserId);
        window.localStorage.setItem("circleUserToken", userToken);
        window.localStorage.setItem("circleEncryptionKey", encryptionKey);
        window.localStorage.setItem("circleWallets", JSON.stringify(walletData));
        console.log("Session saved for user:", currentUserId);
      }
    },
    []
  );

  // Clear session
  const clearSession = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("circleUserId");
      window.localStorage.removeItem("circleUserToken");
      window.localStorage.removeItem("circleEncryptionKey");
      window.localStorage.removeItem("circleWallets");
    }
  };

  // Load wallets for current user
  const loadWallets = useCallback(
    async (userToken: string, encryptionKey: string, currentUserId: string) => {
      try {
        const response = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "listWallets",
            userToken,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("List wallets failed:", data);
          return [];
        }

        const walletList = (data.wallets as WalletData[]) || [];
        setWallets(walletList);

        if (walletList.length > 0) {
          await loadUsdcBalance(userToken, walletList[0].id);
          saveSession(walletList, userToken, encryptionKey, currentUserId);
        }

        return walletList;
      } catch (err) {
        console.error("Failed to load wallet details:", err);
        return [];
      }
    },
    [saveSession, loadUsdcBalance]
  );

  // Handle full connection flow
  const handleConnect = async () => {
    if (!userId || userId.length < 5) {
      setError("User ID must be at least 5 characters");
      return;
    }
    
    if (!appId) {
      setError("Circle App ID is not configured. Please check your environment variables.");
      return;
    }

    setError(null);

    try {
      // Step 1: Create User (only if mode is "create")
      if (mode === "create") {
        setConnectionState("creating-user");
        
        console.log("Creating user with ID:", userId);

        const createResponse = await fetch("/api/endpoints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "createUser", userId }),
        });

        const createData = await createResponse.json();

        if (!createResponse.ok && createData.code !== 155106) {
          console.error("Create user failed:", createData);
          setError(createData.error || createData.message || "Failed to create user");
          setConnectionState("disconnected");
          return;
        }
      }

      // Step 2: Get User Token
      setConnectionState("getting-token");
      
      console.log("Getting user token for:", userId);

      const tokenResponse = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getUserToken", userId }),
      });

      const tokenData = await tokenResponse.json();

      if (!tokenResponse.ok) {
        console.error("Get user token failed:", tokenData);
        let errorMsg = "Failed to get user token";
        
        if (tokenResponse.status === 400) {
          errorMsg = mode === "login" 
            ? "User not found. Please use 'Create Wallet' if this is your first time."
            : "Invalid user ID or API parameters";
        } else {
          errorMsg = tokenData.error || tokenData.message || errorMsg;
        }
        
        setError(errorMsg);
        setConnectionState("disconnected");
        return;
      }

      const newLoginResult = {
        userToken: tokenData.userToken,
        encryptionKey: tokenData.encryptionKey,
      };
      setLoginResult(newLoginResult);

      // Step 3: Initialize User
      setConnectionState("initializing");
      
      console.log("Initializing user with accountType:", ACCOUNT_TYPE, "blockchains:", [PRIMARY_WALLET_BLOCKCHAIN]);

      const initResponse = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initializeUser",
          userToken: newLoginResult.userToken,
          accountType: ACCOUNT_TYPE,
          blockchains: [PRIMARY_WALLET_BLOCKCHAIN],
        }),
      });

      const initData = await initResponse.json();

      // User already initialized - load existing wallets
      if (!initResponse.ok) {
        if (initData.code === 155106) {
          console.log("User already initialized, loading existing wallets");
          const existingWallets = await loadWallets(
            newLoginResult.userToken,
            newLoginResult.encryptionKey,
            userId
          );
          if (existingWallets.length > 0) {
            setConnectionState("connected");
            setIsDialogOpen(false);
            return;
          }
        }

        console.error("Initialize user failed:", initData);
        setError(initData.error || initData.message || "Failed to initialize user");
        setConnectionState("disconnected");
        return;
      }

      // Step 4: Execute Challenge (Create Wallet)
      setChallengeId(initData.challengeId);
      setConnectionState("creating-wallet");

      const sdk = sdkRef.current;
      if (!sdk) {
        setError("SDK not ready");
        setConnectionState("disconnected");
        return;
      }

      sdk.setAuthentication({
        userToken: newLoginResult.userToken,
        encryptionKey: newLoginResult.encryptionKey,
      });

      // Close our dialog to let Circle SDK UI show properly
      setIsDialogOpen(false);

      sdk.execute(initData.challengeId, async (sdkError, result) => {
        if (sdkError) {
          console.error("Execute challenge failed:", sdkError);
          setError((sdkError as any)?.message ?? "Failed to create wallet");
          setConnectionState("disconnected");
          setIsDialogOpen(true); // Reopen dialog to show error
          return;
        }

        console.log("Challenge executed successfully:", result);
        setChallengeId(null);

        // Give Circle time to index the wallet
        setTimeout(async () => {
          const newWallets = await loadWallets(
            newLoginResult.userToken,
            newLoginResult.encryptionKey,
            userId
          );
          if (newWallets.length > 0) {
            setConnectionState("connected");
          } else {
            setConnectionState("disconnected");
            setError("Wallet creation pending. Please try again.");
            setIsDialogOpen(true); // Reopen to show error
          }
        }, 2500);
      });
    } catch (err: any) {
      console.error("Connection error:", err);
      setError(err?.message || "Connection failed");
      setConnectionState("disconnected");
    }
  };

  const handleDisconnect = () => {
    clearSession();
    setUserId("");
    setLoginResult(null);
    setChallengeId(null);
    setWallets([]);
    setUsdcBalance(null);
    setConnectionState("disconnected");
    setError(null);
  };

  const handleRefresh = async () => {
    if (!loginResult?.userToken || !wallets[0]?.id) return;

    setIsRefreshing(true);
    await loadUsdcBalance(loginResult.userToken, wallets[0].id);
    setIsRefreshing(false);
  };

  const copyAddress = () => {
    if (wallets[0]?.address) {
      navigator.clipboard.writeText(wallets[0].address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getConnectionStateText = () => {
    switch (connectionState) {
      case "creating-user":
        return "Creating user...";
      case "getting-token":
        return "Getting token...";
      case "initializing":
        return "Initializing...";
      case "creating-wallet":
        return "Creating wallet...";
      case "connecting":
        return "Connecting...";
      default:
        return "Connect Wallet";
    }
  };

  const isConnecting =
    connectionState !== "disconnected" && connectionState !== "connected";

  const primaryWallet = wallets[0];
  const blockchain = primaryWallet?.blockchain || PRIMARY_WALLET_BLOCKCHAIN;
  const chainInfo = BLOCKCHAIN_INFO[blockchain] || {
    name: blockchain,
    icon: "🔗",
    color: "from-gray-500 to-gray-600",
  };

  // Show loading state during SSR hydration
  if (!mounted) {
    return (
      <Button size="lg" className="gap-2" disabled>
        <Wallet className="h-5 w-5" />
        Connect Wallet
      </Button>
    );
  }

  // Connected State - Show Dropdown
  if (connectionState === "connected" && primaryWallet) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="gap-3 pr-2 pl-3 h-12"
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-gray-900">
                  {formatBalance(usdcBalance || "0")} USDC
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-600">
                    {shortenAddress(primaryWallet.address)}
                  </span>
                </div>
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-sm">
                  {userId.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel className="font-normal">
            <div className="flex items-center gap-3 py-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {userId.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">{userId}</span>
                <span className="text-xs text-gray-600">
                  {shortenAddress(primaryWallet.address)}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Balance Section */}
          <div className="px-3 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 uppercase tracking-wider">
                Balance
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn(
                    "h-3 w-3 text-gray-600",
                    isRefreshing && "animate-spin"
                  )}
                />
              </Button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-900">
                {formatBalance(usdcBalance || "0")}
              </span>
              <span className="text-sm font-medium text-gray-600">USDC</span>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Chain Section */}
          <div className="px-3 py-3">
            <span className="text-xs text-gray-600 uppercase tracking-wider">
              Network
            </span>
            <div className="flex items-center gap-2 mt-2">
              <div
                className={cn(
                  "flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br",
                  chainInfo.color
                )}
              >
                <span className="text-sm">{chainInfo.icon}</span>
              </div>
              <span className="font-medium text-gray-900">{chainInfo.name}</span>
              <Badge variant="success" className="ml-auto text-xs">
                Active
              </Badge>
            </div>
          </div>

          <DropdownMenuSeparator />

          {/* Wallet Address */}
          <DropdownMenuItem
            className="gap-2 cursor-pointer"
            onClick={copyAddress}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{copied ? "Copied!" : "Copy Address"}</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
            <a
              href={`https://explorer.circle.com/address/${primaryWallet.address}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View on Explorer</span>
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="gap-2 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10"
            onClick={handleDisconnect}
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Disconnected State - Show Connect Button with Dialog
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2" disabled={!sdkReady}>
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500">
              <Wallet className="h-5 w-5 text-white" />
            </div>
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new wallet by entering a unique user ID."
              : "Login to your existing wallet using your user ID."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => {
                setMode("create");
                setError(null);
              }}
              disabled={isConnecting}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
                mode === "create"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Create Wallet
            </button>
            <button
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              disabled={isConnecting}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all",
                mode === "login"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Login
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              User ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder={
                  mode === "create"
                    ? "Choose a unique username"
                    : "Enter your existing username"
                }
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setError(null);
                }}
                className="pl-10"
                disabled={isConnecting}
              />
            </div>
            <p className="text-xs text-gray-500">
              {mode === "create"
                ? "Minimum 5 characters - this will be your unique identifier"
                : "Use the same ID you created your wallet with"}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Network
            </label>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border-2 border-gray-200">
              <div
                className={cn(
                  "flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br",
                  chainInfo.color
                )}
              >
                <span className="text-lg">{chainInfo.icon}</span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{chainInfo.name}</p>
                <p className="text-xs text-gray-500">Smart Contract Account</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleConnect}
            disabled={!userId || userId.length < 5 || isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {getConnectionStateText()}
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                {mode === "create" ? "Create Wallet" : "Login"}
              </>
            )}
          </Button>

          {isConnecting && (
            <div className="space-y-2">
              {mode === "create" && (
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "h-2 w-2 rounded-full",
                      connectionState === "creating-user" ||
                        connectionState === "getting-token" ||
                        connectionState === "initializing" ||
                        connectionState === "creating-wallet"
                        ? "bg-emerald-500"
                        : "bg-slate-600"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      connectionState === "creating-user"
                        ? "text-gray-900 font-medium"
                        : "text-gray-500"
                    )}
                  >
                    Creating user
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    connectionState === "getting-token" ||
                      connectionState === "initializing" ||
                      connectionState === "creating-wallet"
                      ? "bg-emerald-500"
                      : "bg-slate-600"
                  )}
                />
                <span
                  className={cn(
                    "text-xs",
                    connectionState === "getting-token"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500"
                  )}
                >
                  Getting authentication
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    connectionState === "initializing" ||
                      connectionState === "creating-wallet"
                      ? "bg-emerald-500"
                      : "bg-slate-600"
                  )}
                />
                <span
                  className={cn(
                    "text-xs",
                    connectionState === "initializing"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500"
                  )}
                >
                  Initializing account
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    connectionState === "creating-wallet"
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-slate-600"
                  )}
                />
                <span
                  className={cn(
                    "text-xs",
                    connectionState === "creating-wallet"
                      ? "text-gray-900 font-medium"
                      : "text-gray-500"
                  )}
                >
                  {mode === "create" ? "Creating wallet" : "Accessing wallet"}
                </span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
