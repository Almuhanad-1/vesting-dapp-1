// lib/hooks/use-factory-contract.ts
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { FACTORY_CONTRACT } from "@/lib/contracts/factory-contract";
import { useWalletStore } from "@/lib/stores/wallet-store";

// Types based on the ABI
export interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: bigint;
  owner: `0x${string}`;
}

export interface VestingConfig {
  beneficiary: `0x${string}`;
  amount: bigint;
  cliff: bigint;
  duration: bigint;
  revocable: boolean;
}

export interface BatchDeployment {
  creator: `0x${string}`;
  tokenCount: bigint;
  totalVestingSchedules: bigint;
  completed: boolean;
  tokens: `0x${string}`[];
  vestingContracts: `0x${string}`[][];
  createdAt: bigint;
}

// Hook for writing to contract
export function useFactoryWrite() {
  const { setTransaction } = useWalletStore();

  const {
    writeContract,
    isPending,
    error,
    data: hash,
  } = useWriteContract({
    mutation: {
      onMutate: () => {
        setTransaction({ status: "pending" });
      },
      onSuccess: (hash) => {
        setTransaction({ status: "pending", hash });
      },
      onError: (error) => {
        setTransaction({ status: "error", error: error.message });
      },
    },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Update transaction status when confirmed
  if (isSuccess && hash) {
    setTransaction({ status: "success", hash });
  }

  return {
    writeContract,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// Specific hook for deploying single token with vesting
export function useDeployTokenWithVesting() {
  const { writeContract, ...rest } = useFactoryWrite();

  const deployToken = (
    tokenConfig: TokenConfig,
    vestingConfigs: VestingConfig[]
  ) => {
    writeContract({
      ...FACTORY_CONTRACT,
      functionName: "deployTokenWithVesting",
      args: [
        { ...tokenConfig },
        vestingConfigs.map((vc) => ({ ...vc })),
      ] as const,
    });
  };

  return {
    deployToken,
    ...rest,
  };
}

// Hook for batch deploying multiple tokens
export function useBatchDeployTokens() {
  const { writeContract, ...rest } = useFactoryWrite();

  const batchDeploy = (
    tokenConfigs: TokenConfig[],
    vestingConfigsArray: VestingConfig[][]
  ) => {
    writeContract({
      ...FACTORY_CONTRACT,
      functionName: "batchDeployTokens",
      args: [
        tokenConfigs.map((tc) => ({ ...tc })),
        vestingConfigsArray.map((vca) => vca.map((vc) => ({ ...vc }))),
      ] as const,
    });
  };

  return {
    batchDeploy,
    ...rest,
  };
}

// Hook for checking if token was deployed by factory
export function useIsDeployedToken(tokenAddress?: `0x${string}`) {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "isDeployedToken",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });
}

// Hook for getting vesting contracts for a token
export function useTokenVestingContracts(tokenAddress?: `0x${string}`) {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "getTokenVestingContracts",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });
}

// Hook for getting batch deployment info
export function useBatchDeployment(batchId?: `0x${string}`) {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "getBatchDeployment",
    args: batchId ? [batchId] : undefined,
    query: {
      enabled: !!batchId,
    },
  });
}

// Hook for getting implementation addresses
export function useImplementations() {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "getImplementations",
  });
}

// Hook for getting batch counter
export function useBatchCounter() {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "batchCounter",
  });
}

// Hook for getting factory owner
export function useFactoryOwner() {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "owner",
  });
}

// Hook for getting token implementation
export function useTokenImplementation() {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "tokenImplementation",
  });
}

// Hook for getting vesting implementation
export function useVestingImplementation() {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "vestingImplementation",
  });
}

// Hook for checking deployed tokens mapping
export function useDeployedTokensMapping(tokenAddress?: `0x${string}`) {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "deployedTokens",
    args: tokenAddress ? [tokenAddress] : undefined,
    query: {
      enabled: !!tokenAddress,
    },
  });
}

// Hook for getting batch deployments info
export function useBatchDeploymentsMapping(batchId?: `0x${string}`) {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "batchDeployments",
    args: batchId ? [batchId] : undefined,
    query: {
      enabled: !!batchId,
    },
  });
}

// Hook for getting specific vesting contract from array
export function useTokenVestingContractsArray(
  tokenAddress?: `0x${string}`,
  index?: bigint
) {
  return useReadContract({
    ...FACTORY_CONTRACT,
    functionName: "tokenVestingContracts",
    args:
      tokenAddress && index !== undefined ? [tokenAddress, index] : undefined,
    query: {
      enabled: !!tokenAddress && index !== undefined,
    },
  });
}

// Utility hook for parsing deployment events
export function useDeploymentEvents() {
  // This could be extended to listen for TokenDeployed and VestingDeployed events
  // For now, we'll rely on transaction receipts and database syncing
  return {
    // Implementation for event listening can be added here
  };
}
