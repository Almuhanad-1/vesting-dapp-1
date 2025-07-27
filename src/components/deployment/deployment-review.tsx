// components/deployment/deployment-review.tsx
"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Rocket,
  CheckCircle2,
  Clock,
  Users,
  Coins,
  Shield,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

import { useFactoryStore } from "@/lib/stores/factory-store";
import { useDeployTokenWithVesting } from "@/lib/hooks/use-factory-contract";

interface DeploymentReviewProps {
  onBack: () => void;
  onSuccess: () => void;
}

export function DeploymentReview({ onBack, onSuccess }: DeploymentReviewProps) {
  const { address } = useAccount();
  const { deploymentDraft, setIsDeploying } = useFactoryStore();
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [deploymentConfirmed, setDeploymentConfirmed] = useState(false);

  const { deployToken, isPending, isConfirming, isSuccess, error } =
    useDeployTokenWithVesting();

  const tokenConfig = deploymentDraft.tokenConfig;
  const vestingConfigs = deploymentDraft.vestingConfigs;

  const getTotalSupply = () => {
    if (!tokenConfig.totalSupply) return "0";
    return formatUnits(BigInt(tokenConfig.totalSupply), 18);
  };

  const getTotalAllocated = () => {
    return vestingConfigs.reduce((total, config) => {
      return total + parseFloat(formatUnits(BigInt(config.amount), 18));
    }, 0);
  };

  const getVestingTypeLabel = (cliff: bigint, duration: bigint) => {
    const cliffMonths = Math.floor(Number(cliff) / (30 * 24 * 60 * 60));
    const durationMonths = Math.floor(Number(duration) / (30 * 24 * 60 * 60));

    if (cliff > 0 && duration > cliff) {
      return `${cliffMonths}m cliff + ${durationMonths - cliffMonths}m linear`;
    } else if (cliff > 0) {
      return `${cliffMonths}m cliff only`;
    } else {
      return `${durationMonths}m linear`;
    }
  };

  const handleDeploy = () => {
    if (!address || !tokenConfig.name || vestingConfigs.length === 0) return;

    const tokenConfigForContract = {
      name: tokenConfig.name,
      symbol: tokenConfig.symbol || "",
      totalSupply: BigInt(tokenConfig.totalSupply || "0"),
      owner: address,
    };

    const vestingConfigsForContract = vestingConfigs.map((config) => ({
      beneficiary: config.beneficiary,
      amount: BigInt(config.amount),
      cliff: config.cliff,
      duration: config.duration,
      revocable: config.revocable,
    }));

    setIsDeploying(true);
    deployToken(tokenConfigForContract, vestingConfigsForContract);
  };

  // Handle success
  if (isSuccess) {
    setIsDeploying(false);
    onSuccess();
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Review & Deploy</CardTitle>
            <CardDescription>
              Review your token configuration and deploy to Sepolia
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Token Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Coins className="mr-2 h-5 w-5" />
            Token Configuration
          </h3>
          <Card className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Name</span>
                <div className="font-medium">{tokenConfig.name}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Symbol</span>
                <div className="font-medium">{tokenConfig.symbol}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">
                  Total Supply
                </span>
                <div className="font-medium">
                  {parseFloat(getTotalSupply()).toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Decimals</span>
                <div className="font-medium">18</div>
              </div>
            </div>
          </Card>
        </div>

        <Separator />

        {/* Vesting Summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Vesting Schedules ({vestingConfigs.length})
          </h3>

          <div className="space-y-3">
            {vestingConfigs.map((config, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">Schedule {index + 1}</Badge>
                      {config.revocable && (
                        <Badge variant="secondary">Revocable</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Beneficiary:
                        </span>
                        <div className="font-mono">
                          {`${config.beneficiary.slice(
                            0,
                            6
                          )}...${config.beneficiary.slice(-4)}`}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Amount:</span>
                        <div className="font-medium">
                          {parseFloat(
                            formatUnits(BigInt(config.amount), 18)
                          ).toLocaleString()}{" "}
                          {tokenConfig.symbol}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Schedule:</span>
                        <div className="font-medium">
                          {getVestingTypeLabel(config.cliff, config.duration)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Allocation Summary */}
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>
                  Total allocated: {getTotalAllocated().toLocaleString()}{" "}
                  {tokenConfig.symbol}
                </span>
                <Badge variant="outline">
                  {(
                    (getTotalAllocated() / parseFloat(getTotalSupply())) *
                    100
                  ).toFixed(2)}
                  % of supply
                </Badge>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <Separator />

        {/* Security & Terms */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Security & Confirmation
          </h3>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This deployment is permanent and
              cannot be undone. All vesting schedules will be immutable once
              created.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) =>
                  setTermsAccepted(checked === true)
                }
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I understand that this deployment is permanent and all
                configurations are correct
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmed"
                checked={deploymentConfirmed}
                onCheckedChange={(checked) =>
                  setDeploymentConfirmed(checked === true)
                }
              />
              <label
                htmlFor="confirmed"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I have verified all beneficiary addresses and token amounts
              </label>
            </div>
          </div>
        </div>

        {/* Gas Estimation */}
        <Alert>
          <ExternalLink className="h-4 w-4" />
          <AlertDescription>
            Estimated gas cost: ~0.01-0.02 ETH (varies by network conditions).
            Make sure you have sufficient ETH for gas fees.
          </AlertDescription>
        </Alert>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Deployment failed:</strong> {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isPending || isConfirming}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vesting
          </Button>

          <Button
            onClick={handleDeploy}
            disabled={
              !termsAccepted ||
              !deploymentConfirmed ||
              isPending ||
              isConfirming
            }
            className="min-w-32"
          >
            {isPending ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deploying...
              </>
            ) : isConfirming ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Confirming...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy Token
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
