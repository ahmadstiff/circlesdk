// app/api/endpoints/route.ts
import { NextResponse } from "next/server";

const CIRCLE_BASE_URL =
  process.env.NEXT_PUBLIC_CIRCLE_BASE_URL ?? "https://api.circle.com";
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY as string;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body ?? {};

    if (!action) {
      return NextResponse.json({ error: "Missing action" }, { status: 400 });
    }

    switch (action) {
      case "createUser": {
        const { userId } = params;

        if (!userId) {
          return NextResponse.json(
            { error: "Missing required field: userId" },
            { status: 400 },
          );
        }

        const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CIRCLE_API_KEY}`,
          },
          body: JSON.stringify({
            userId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { id, createDate, pinStatus, status, ... }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "getUserToken": {
        const { userId } = params;

        if (!userId) {
          return NextResponse.json(
            { error: "Missing required field: userId" },
            { status: 400 },
          );
        }

        const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/users/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CIRCLE_API_KEY}`,
          },
          body: JSON.stringify({
            userId,
          }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { userToken, encryptionKey }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "initializeUser": {
        const { userToken, accountType, blockchains } = params;
        if (!userToken) {
          return NextResponse.json(
            { error: "Missing userToken" },
            { status: 400 },
          );
        }

        // Build request body
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const requestBody: any = {
          idempotencyKey: crypto.randomUUID(),
        };

        // Add optional parameters with defaults
        if (accountType) requestBody.accountType = accountType;
        // If blockchains not provided, Circle will use ARC-TESTNET as default
        // You can specify multiple: ["ETH-SEPOLIA", "MATIC-AMOY", "AVAX-FUJI", "SOL-DEVNET"]
        if (blockchains) requestBody.blockchains = blockchains;

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/user/initialize`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
            body: JSON.stringify(requestBody),
          },
        );

        const data = await response.json();

        if (!response.ok) {
          // Pass through Circle error payload (e.g. code 155106: user already initialized)
          return NextResponse.json(data, { status: response.status });
        }

        // Returns: { challengeId }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "listWallets": {
        const { userToken } = params;
        if (!userToken) {
          return NextResponse.json(
            { error: "Missing userToken" },
            { status: 400 },
          );
        }

        const response = await fetch(`${CIRCLE_BASE_URL}/v1/w3s/wallets`, {
          method: "GET",
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            Authorization: `Bearer ${CIRCLE_API_KEY}`,
            "X-User-Token": userToken,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // { wallets: [...] }
        return NextResponse.json(data.data, { status: 200 });
      }

      case "getTokenBalance": {
        const { userToken, walletId } = params;
        if (!userToken || !walletId) {
          return NextResponse.json(
            { error: "Missing userToken or walletId" },
            { status: 400 },
          );
        }

        const response = await fetch(
          `${CIRCLE_BASE_URL}/v1/w3s/wallets/${walletId}/balances`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${CIRCLE_API_KEY}`,
              "X-User-Token": userToken,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          return NextResponse.json(data, { status: response.status });
        }

        // { tokenBalances: [...] }
        return NextResponse.json(data.data, { status: 200 });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error in /api/endpoints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}