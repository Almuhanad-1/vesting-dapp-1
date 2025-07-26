// lib/stores/wallet-store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface TransactionState {
  hash?: string;
  status: "idle" | "pending" | "success" | "error";
  error?: string;
}

interface WalletState {
  // Connection state
  isConnected: boolean;
  address?: string;
  chainId?: number;

  // Transaction state
  currentTransaction: TransactionState;

  // Actions
  setConnectionState: (
    connected: boolean,
    address?: string,
    chainId?: number
  ) => void;
  setTransaction: (transaction: TransactionState) => void;
  clearTransaction: () => void;
}

export const useWalletStore = create<WalletState>()(
  devtools(
    (set) => ({
      // Initial state
      isConnected: false,
      address: undefined,
      chainId: undefined,
      currentTransaction: {
        status: "idle",
      },

      // Actions
      setConnectionState: (connected, address, chainId) =>
        set(
          {
            isConnected: connected,
            address,
            chainId,
          },
          false,
          "setConnectionState"
        ),

      setTransaction: (transaction) =>
        set(
          {
            currentTransaction: transaction,
          },
          false,
          "setTransaction"
        ),

      clearTransaction: () =>
        set(
          {
            currentTransaction: {
              status: "idle",
            },
          },
          false,
          "clearTransaction"
        ),
    }),
    {
      name: "wallet-store",
    }
  )
);
