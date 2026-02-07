import { 
  createConnector,
} from 'wagmi';
import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';
import type { Address, Chain } from 'viem';

const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID as string;

export interface CircleConnectorOptions {
  chains: readonly Chain[];
}

// Storage keys
const STORAGE_KEYS = {
  userId: 'circleUserId',
  userToken: 'circleUserToken',
  encryptionKey: 'circleEncryptionKey',
  wallets: 'circleWallets',
};

export function circleConnector(options: CircleConnectorOptions) {
  type Provider = W3SSdk;
  type Properties = {
    getAccount(): Promise<Address | undefined>;
    getUserToken(): string | null;
    getEncryptionKey(): string | null;
    getWalletId(): string | null;
  };

  return createConnector<Provider, Properties>((config) => ({
    id: 'circle-wallet',
    name: 'Circle Wallet',
    type: 'circle-wallet',
    
    async setup() {
      // Skip W3SSdk initialization - SSR safe
      // SDK will be created in getProvider() on client side only
    },

    async connect<withCapabilities extends boolean = false>(
      parameters?: {
        chainId?: number;
        isReconnecting?: boolean;
        withCapabilities?: boolean | withCapabilities;
      }
    ) {
      const provider = await this.getProvider();
      
      // Check if already connected (session exists)
      const savedWallets = localStorage.getItem(STORAGE_KEYS.wallets);
      const savedUserToken = localStorage.getItem(STORAGE_KEYS.userToken);
      const savedEncryptionKey = localStorage.getItem(STORAGE_KEYS.encryptionKey);
      
      if (savedWallets && savedUserToken && savedEncryptionKey) {
        const wallets = JSON.parse(savedWallets);
        const primaryWallet = wallets[0];
        
        if (primaryWallet) {
          // Set authentication for existing session
          (provider as any).setAuthentication({
            userToken: savedUserToken,
            encryptionKey: savedEncryptionKey,
          });

          const accounts = [primaryWallet.address as Address] as readonly Address[];

          config.emitter.emit('connect', {
            accounts,
            chainId: parameters?.chainId || options.chains[0].id,
          });

          return {
            accounts,
            chainId: parameters?.chainId || options.chains[0].id,
          } as any;
        }
      }

      // No session - user needs to connect via ConnectButton first
      throw new Error('Please connect your Circle wallet first using the Connect Wallet button');
    },

    async disconnect() {
      // Clear session
      localStorage.removeItem(STORAGE_KEYS.userId);
      localStorage.removeItem(STORAGE_KEYS.userToken);
      localStorage.removeItem(STORAGE_KEYS.encryptionKey);
      localStorage.removeItem(STORAGE_KEYS.wallets);
      
      config.emitter.emit('disconnect');
    },

    async getAccounts() {
      const savedWallets = localStorage.getItem(STORAGE_KEYS.wallets);
      
      if (!savedWallets) {
        return [];
      }

      try {
        const wallets = JSON.parse(savedWallets);
        const primaryWallet = wallets[0];
        
        if (primaryWallet?.address) {
          return [primaryWallet.address as Address];
        }
      } catch {
        return [];
      }

      return [];
    },

    async getChainId() {
      return options.chains[0].id;
    },

    async getProvider() {
      const sdk = new W3SSdk({
        appSettings: { appId },
      });

      // Restore authentication if session exists
      const savedUserToken = localStorage.getItem(STORAGE_KEYS.userToken);
      const savedEncryptionKey = localStorage.getItem(STORAGE_KEYS.encryptionKey);
      
      if (savedUserToken && savedEncryptionKey) {
        sdk.setAuthentication({
          userToken: savedUserToken,
          encryptionKey: savedEncryptionKey,
        });
      }

      return sdk;
    },

    async isAuthorized() {
      const savedWallets = localStorage.getItem(STORAGE_KEYS.wallets);
      const savedUserToken = localStorage.getItem(STORAGE_KEYS.userToken);
      
      return !!(savedWallets && savedUserToken);
    },

    async switchChain() {
      throw new Error('Circle Wallet does not support switching chains at runtime');
    },

    onAccountsChanged(accounts) {
      if (accounts.length === 0) {
        config.emitter.emit('disconnect');
      } else {
        config.emitter.emit('change', {
          accounts: accounts as Address[],
        });
      }
    },

    onChainChanged(chainId) {
      config.emitter.emit('change', {
        chainId: Number(chainId),
      });
    },

    onDisconnect() {
      config.emitter.emit('disconnect');
    },

    // Custom methods for Circle-specific functionality
    async getAccount() {
      const accounts = await this.getAccounts();
      return accounts[0];
    },

    getUserToken() {
      return localStorage.getItem(STORAGE_KEYS.userToken);
    },

    getEncryptionKey() {
      return localStorage.getItem(STORAGE_KEYS.encryptionKey);
    },

    getWalletId() {
      const savedWallets = localStorage.getItem(STORAGE_KEYS.wallets);
      if (!savedWallets) return null;
      
      try {
        const wallets = JSON.parse(savedWallets);
        return wallets[0]?.id || null;
      } catch {
        return null;
      }
    },
  }));
}
