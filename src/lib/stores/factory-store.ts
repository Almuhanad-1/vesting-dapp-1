// lib/stores/factory-store.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { DeployedToken, VestingSchedule } from "@/lib/database";

interface TokenConfig {
  name: string;
  symbol: string;
  totalSupply: string;
  owner: string;
}

interface VestingConfig {
  beneficiary: `0x${string}`;
  amount: string;
  cliff: bigint; // seconds
  duration: bigint; // seconds
  revocable: boolean;
}

interface DeploymentDraft {
  tokenConfig: Partial<TokenConfig>;
  vestingConfigs: VestingConfig[];
  step: number;
}

interface FactoryState {
  // Deployed tokens
  deployedTokens: DeployedToken[];
  userTokens: DeployedToken[];

  // Current deployment
  deploymentDraft: DeploymentDraft;
  isDeploying: boolean;

  // Vesting data
  userVestingSchedules: VestingSchedule[];

  // Actions
  setDeployedTokens: (tokens: DeployedToken[]) => void;
  setUserTokens: (tokens: DeployedToken[]) => void;
  setUserVestingSchedules: (schedules: VestingSchedule[]) => void;

  // Deployment actions
  updateTokenConfig: (config: Partial<TokenConfig>) => void;
  updateVestingConfigs: (configs: VestingConfig[]) => void;
  addVestingConfig: (config: VestingConfig) => void;
  removeVestingConfig: (index: number) => void;
  setDeploymentStep: (step: number) => void;
  setIsDeploying: (deploying: boolean) => void;
  resetDeploymentDraft: () => void;
}

const initialDeploymentDraft: DeploymentDraft = {
  tokenConfig: {},
  vestingConfigs: [],
  step: 0,
};

export const useFactoryStore = create<FactoryState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        deployedTokens: [],
        userTokens: [],
        userVestingSchedules: [],
        deploymentDraft: initialDeploymentDraft,
        isDeploying: false,

        // Actions
        setDeployedTokens: (tokens) =>
          set({ deployedTokens: tokens }, false, "setDeployedTokens"),

        setUserTokens: (tokens) =>
          set({ userTokens: tokens }, false, "setUserTokens"),

        setUserVestingSchedules: (schedules) =>
          set(
            { userVestingSchedules: schedules },
            false,
            "setUserVestingSchedules"
          ),

        // Deployment actions
        updateTokenConfig: (config) =>
          set(
            (state) => ({
              deploymentDraft: {
                ...state.deploymentDraft,
                tokenConfig: {
                  ...state.deploymentDraft.tokenConfig,
                  ...config,
                },
              },
            }),
            false,
            "updateTokenConfig"
          ),

        updateVestingConfigs: (configs) =>
          set(
            (state) => ({
              deploymentDraft: {
                ...state.deploymentDraft,
                vestingConfigs: configs,
              },
            }),
            false,
            "updateVestingConfigs"
          ),

        addVestingConfig: (config) =>
          set(
            (state) => ({
              deploymentDraft: {
                ...state.deploymentDraft,
                vestingConfigs: [
                  ...state.deploymentDraft.vestingConfigs,
                  config,
                ],
              },
            }),
            false,
            "addVestingConfig"
          ),

        removeVestingConfig: (index) =>
          set(
            (state) => ({
              deploymentDraft: {
                ...state.deploymentDraft,
                vestingConfigs: state.deploymentDraft.vestingConfigs.filter(
                  (_, i) => i !== index
                ),
              },
            }),
            false,
            "removeVestingConfig"
          ),

        setDeploymentStep: (step) =>
          set(
            (state) => ({
              deploymentDraft: {
                ...state.deploymentDraft,
                step,
              },
            }),
            false,
            "setDeploymentStep"
          ),

        setIsDeploying: (deploying) =>
          set({ isDeploying: deploying }, false, "setIsDeploying"),

        resetDeploymentDraft: () =>
          set(
            { deploymentDraft: initialDeploymentDraft },
            false,
            "resetDeploymentDraft"
          ),
      }),
      {
        name: "factory-store",
        partialize: (state) => ({
          deploymentDraft: state.deploymentDraft,
        }),
      }
    ),
    {
      name: "factory-store",
    }
  )
);
