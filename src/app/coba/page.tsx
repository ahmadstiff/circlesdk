/* eslint-disable @typescript-eslint/no-explicit-any */
// app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { W3SSdk } from "@circle-fin/w3s-pw-web-sdk";

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;
const ACCOUNT_TYPE = "SCA";
const PRIMARY_WALLET_BLOCKCHAIN = "ARC-TESTNET";

type LoginResult = {
  userToken: string;
  encryptionKey: string;
};

type Wallet = {
  id: string;
  address: string;
  blockchain: string;
  [key: string]: unknown;
};

export default function HomePage() {
  const sdkRef = useRef<W3SSdk | null>(null);

  const [sdkReady, setSdkReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string>("");

  const [userId, setUserId] = useState<string>("");

  const [loginResult, setLoginResult] = useState<LoginResult | null>(null);

  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [usdcBalance, setUsdcBalance] = useState<string | null>(null);

  const [status, setStatus] = useState<string>("Ready");
  const [isError, setIsError] = useState<boolean>(false);

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
          setIsError(false);
          setStatus("SDK initialized. Ready to create user.");
        }
      } catch (err) {
        console.log("Failed to initialize Web SDK:", err);
        if (!cancelled) {
          setIsError(true);
          setStatus("Failed to initialize Web SDK");
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
        console.log("Failed to get deviceId:", error);
        setIsError(true);
        setStatus("Failed to get deviceId");
      }
    };

    if (sdkReady) {
      void fetchDeviceId();
    }
  }, [sdkReady]);

  // Load USDC balance
  async function loadUsdcBalance(userToken: string, walletId: string) {
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
        console.log("Failed to load USDC balance:", data);
        setIsError(true);
        setStatus("Failed to load USDC balance");
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
      // Note: loadWallets may overwrite this with a more specific status
      setIsError(false);
      setStatus("Wallet details and USDC balance loaded.");
      return amount;
    } catch (err) {
      console.log("Failed to load USDC balance:", err);
      setIsError(true);
      setStatus("Failed to load USDC balance");
      return null;
    }
  }

  // Load wallets for current user
  const loadWallets = async (
    userToken: string,
    options?: { source?: "afterCreate" | "alreadyInitialized" },
  ) => {
    try {
      setIsError(false);
      setStatus("Loading wallet details...");
      setUsdcBalance(null);

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
        console.log("List wallets failed:", data);
        setIsError(true);
        setStatus("Failed to load wallet details");
        return;
      }

      const wallets = (data.wallets as Wallet[]) || [];
      setWallets(wallets);

      if (wallets.length > 0) {
        await loadUsdcBalance(userToken, wallets[0].id);

        if (options?.source === "afterCreate") {
          setIsError(false);
          setStatus(
            "Wallet created successfully! 🎉 Wallet details and USDC balance loaded.",
          );
        } else if (options?.source === "alreadyInitialized") {
          setIsError(false);
          setStatus(
            "User already initialized. Wallet details and USDC balance loaded.",
          );
        }
      } else {
        setIsError(false);
        setStatus("Wallet creation in progress. Click Initialize user again to refresh.");
      }
    } catch (err) {
      console.log("Failed to load wallet details:", err);
      setIsError(true);
      setStatus("Failed to load wallet details");
    }
  };

  const handleCreateUser = async () => {
    if (!userId) {
      setIsError(true);
      setStatus("Please enter a user ID.");
      return;
    }

    if (userId.length < 5) {
      setIsError(true);
      setStatus("User ID must be at least 5 characters.");
      return;
    }

    // Reset auth + wallet state
    setLoginResult(null);
    setChallengeId(null);
    setWallets([]);
    setUsdcBalance(null);

    try {
      setIsError(false);
      setStatus("Creating user...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createUser",
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Failed to create user:", data);
        setIsError(data.code === 155106);
        setStatus(data.error || data.message || "Failed to create user");
        return;
      }

      setIsError(false);
      setStatus("User created successfully! Click Get User Token to continue.");
    } catch (err) {
      console.log("Error creating user:", err);
      setIsError(true);
      setStatus("Failed to create user");
    }
  };

  const handleGetUserToken = async () => {
    if (!userId) {
      setIsError(true);
      setStatus("Please enter a user ID.");
      return;
    }

    if (userId.length < 5) {
      setIsError(true);
      setStatus("User ID must be at least 5 characters.");
      return;
    }

    try {
      setIsError(false);
      setStatus("Getting user token...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getUserToken",
          userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log("Failed to get user token:", data);
        setIsError(true);
        setStatus(data.error || data.message || "Failed to get user token");
        return;
      }

      // Set loginResult with userToken and encryptionKey from response
      setLoginResult({
        userToken: data.userToken,
        encryptionKey: data.encryptionKey,
      });

      setIsError(false);
      setStatus("User token retrieved successfully! Click Initialize user to continue.");
    } catch (err) {
      console.log("Error getting user token:", err);
      setIsError(true);
      setStatus("Failed to get user token");
    }
  };

  const handleInitializeUser = async () => {
    if (!loginResult?.userToken) {
      setIsError(true);
      setStatus("Missing userToken. Please get user token first.");
      return;
    }

    try {
      setIsError(false);
      setStatus("Initializing user...");

      const response = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initializeUser",
          userToken: loginResult.userToken,
          accountType: ACCOUNT_TYPE,
          blockchains: [PRIMARY_WALLET_BLOCKCHAIN],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 155106) {
          await loadWallets(loginResult.userToken, {
            source: "alreadyInitialized",
          });
          setChallengeId(null);
          return;
        }

        const errorMsg = data.code
          ? `[${data.code}] ${data.error || data.message}`
          : data.error || data.message;
        setIsError(true);
        setStatus("Failed to initialize user: " + errorMsg);
        return;
      }

      setChallengeId(data.challengeId);
      setIsError(false);
      setStatus(`User initialized. Click Create wallet to continue.`);
    } catch (err: any) {
      if (err?.code === 155106 && loginResult?.userToken) {
        await loadWallets(loginResult.userToken, {
          source: "alreadyInitialized",
        });
        setChallengeId(null);
        return;
      }

      const errorMsg = err?.code
        ? `[${err.code}] ${err.message}`
        : err?.message || "Unknown error";
      setIsError(true);
      setStatus("Failed to initialize user: " + errorMsg);
    }
  };

  const handleExecuteChallenge = async () => {
    const sdk = sdkRef.current;
    if (!sdk) {
      setIsError(true);
      setStatus("SDK not ready");
      return;
    }

    if (!challengeId) {
      setIsError(true);
      setStatus("Missing challengeId. Initialize user first.");
      return;
    }

    if (!loginResult?.userToken || !loginResult?.encryptionKey) {
      setIsError(true);
      setStatus("Missing login credentials. Please get user token again.");
      return;
    }

    try {
      sdk.setAuthentication({
        userToken: loginResult.userToken,
        encryptionKey: loginResult.encryptionKey,
      });

      setIsError(false);
      setStatus("Executing challenge...");

      await sdk.execute(challengeId, (error, result) => {
        if (error) {
          console.log("Execute challenge failed:", error);
          setIsError(true);
          setStatus(
            "Failed to execute challenge: " +
              ((error as any)?.message ?? "Unknown error"),
          );
          return;
        }

        console.log("Challenge executed successfully:", result);
        setChallengeId(null);

        // Small delay to give Circle time to index the wallet
        setTimeout(async () => {
          if (loginResult?.userToken) {
            await loadWallets(loginResult.userToken, { source: "afterCreate" });
          }
        }, 2000);
      });
    } catch (err) {
      console.log("Execute challenge error:", err);
      setIsError(true);
      setStatus(
        "Failed to execute challenge: " +
          ((err as any)?.message ?? "Unknown error"),
      );
    }
  };

  const primaryWallet = wallets[0];

  return (
    <main>
      <div style={{ width: "50%", margin: "0 auto" }}>
        <h1>Create a user wallet using PIN</h1>
        <p>Enter the username or email of the user you want to create a wallet for:</p>

        <div style={{ marginBottom: "12px" }}>
          <label>
            User ID:
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              style={{ marginLeft: "8px", width: "70%" }}
              placeholder="Enter user ID (min 5 chars)"
              minLength={5}
            />
          </label>
        </div>

        <div>
          <button
            onClick={handleCreateUser}
            style={{ margin: "6px" }}
            disabled={!userId || userId.length < 5}
          >
            1. Create User
          </button>
          <br />
          <button
            onClick={handleGetUserToken}
            style={{ margin: "6px" }}
            disabled={!userId || userId.length < 5 || !!loginResult}
          >
            2. Get User Token
          </button>
          <br />
          <button
            onClick={handleInitializeUser}
            style={{ margin: "6px" }}
            disabled={!loginResult || !!challengeId || wallets.length > 0}
          >
            3. Initialize user (get challenge)
          </button>
          <br />
          <button
            onClick={handleExecuteChallenge}
            style={{ margin: "6px" }}
            disabled={!challengeId || wallets.length > 0}
          >
            4. Create wallet (execute challenge)
          </button>
        </div>

        <p>
          <strong>Status:</strong>{" "}
          <span style={{ color: isError ? "red" : "black" }}>{status}</span>
        </p>

        {primaryWallet && (
          <div style={{ marginTop: "12px" }}>
            <h2>Wallet details</h2>
            <p>
              <strong>Address:</strong> {primaryWallet.address}
            </p>
            <p>
              <strong>Blockchain:</strong> {primaryWallet.blockchain}
            </p>
            {usdcBalance !== null && (
              <p>
                <strong>USDC balance:</strong> {usdcBalance}
              </p>
            )}
          </div>
        )}

        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
            lineHeight: "1.8",
            marginTop: "16px",
          }}
        >
          {JSON.stringify(
            {
              deviceId,
              userId,
              userToken: loginResult?.userToken,
              encryptionKey: loginResult?.encryptionKey,
              challengeId,
              wallets,
              usdcBalance,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </main>
  );
}