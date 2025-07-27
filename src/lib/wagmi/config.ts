// lib/wagmi/config.ts
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia } from "wagmi/chains";

// Contract configuration
export const FACTORY_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as `0x${string}`;

if (!FACTORY_CONTRACT_ADDRESS) {
  throw new Error("NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS is not defined");
}

// Wagmi configuration with RainbowKit
// export const config = getDefaultConfig({
//   appName: "ERC20 Vesting Factory",
//   projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID!,
//   chains: [sepolia],
//   ssr: true, // Enable SSR for Next.js
// });
export const config = getDefaultConfig({
  appName: "vesting tokens",
  projectId: "e93162e11cff686f8588740ac75a5812",
  chains: [sepolia],
  ssr: true,
});

// Chain configuration
export const SUPPORTED_CHAINS = [sepolia];
export const DEFAULT_CHAIN = sepolia;

// Contract addresses
export const CONTRACTS = {
  FACTORY: FACTORY_CONTRACT_ADDRESS,
  CHAIN_ID: sepolia.id,
} as const;

// RPC URLs
export const RPC_URLS = {
  [sepolia.id]: `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
} as const;
