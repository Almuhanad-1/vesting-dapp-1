// components/ui/transaction-status.tsx
"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  ExternalLink,
  Copy,
  ArrowRight,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TransactionStatusProps {
  status: "idle" | "pending" | "success" | "error";
  hash?: string;
  error?: string;
  tokenAddress?: string;
  tokenName?: string;
  tokenSymbol?: string;
  vestingContracts?: string[];
  onReset?: () => void;
  onViewDashboard?: () => void;
}

export function TransactionStatus({
  status,
  hash,
  error,
  tokenAddress,
  tokenName,
  tokenSymbol,
  vestingContracts = [],
  onReset,
  onViewDashboard,
}: TransactionStatusProps) {
  const { toast } = useToast();

  // Trigger confetti on success
  useEffect(() => {
    if (status === "success") {
      const duration = 3000;
      const end = Date.now() + duration;

      const colors = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [status]);

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getEtherscanUrl = (hash: string) => {
    return `https://sepolia.etherscan.io/tx/${hash}`;
  };

  const getAddressUrl = (address: string) => {
    return `https://sepolia.etherscan.io/address/${address}`;
  };

  if (status === "pending") {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <CardTitle>Deploying Your Token</CardTitle>
          <CardDescription>
            Please wait while your token and vesting contracts are being
            deployed...
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hash && (
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Transaction submitted</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(hash, "Transaction hash")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(getEtherscanUrl(hash), "_blank")
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {hash.slice(0, 10)}...{hash.slice(-8)}
                  </code>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-muted-foreground">
            This usually takes 1-2 minutes. Please don't close this window.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <Card className="w-full max-w-2xl border-destructive">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Deployment Failed</CardTitle>
          <CardDescription>
            There was an error deploying your token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error || "Unknown error occurred"}
            </AlertDescription>
          </Alert>

          <div className="text-center text-sm text-muted-foreground">
            Please check your wallet connection and try again. Make sure you
            have sufficient ETH for gas fees.
          </div>

          <div className="flex justify-center space-x-3">
            <Button variant="outline" onClick={onReset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === "success") {
    return (
      <Card className="w-full max-w-2xl border-green-500">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-green-700">
            Deployment Successful! 🎉
          </CardTitle>
          <CardDescription>
            Your token and vesting contracts have been deployed to Sepolia
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Token Information */}
          {tokenAddress && (
            <div className="space-y-4">
              <h3 className="font-medium">Token Details</h3>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Token Name
                  </span>
                  <Badge variant="outline">{tokenName}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Symbol</span>
                  <Badge variant="outline">{tokenSymbol}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Contract Address
                  </span>
                  <div className="flex items-center space-x-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(tokenAddress, "Token address")
                      }
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(getAddressUrl(tokenAddress), "_blank")
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vesting Contracts */}
          {vestingContracts.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">
                Vesting Contracts ({vestingContracts.length})
              </h3>
              <div className="space-y-2">
                {vestingContracts.map((contract, index) => (
                  <div
                    key={contract}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <span className="text-sm">Schedule {index + 1}</span>
                    <div className="flex items-center space-x-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {contract.slice(0, 6)}...{contract.slice(-4)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(
                            contract,
                            `Vesting contract ${index + 1}`
                          )
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(getAddressUrl(contract), "_blank")
                        }
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {hash && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>Transaction confirmed</span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(hash, "Transaction hash")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(getEtherscanUrl(hash), "_blank")
                      }
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Next Steps */}
          <div className="space-y-3">
            <h3 className="font-medium">What's Next?</h3>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• Your token is now live on Sepolia testnet</p>
              <p>• Beneficiaries can now view and claim their vested tokens</p>
              <p>• You can manage vesting schedules from your dashboard</p>
              <p>• Share the token address with your community</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onViewDashboard} className="flex-1">
              <ArrowRight className="mr-2 h-4 w-4" />
              View Dashboard
            </Button>
            <Button variant="outline" onClick={onReset} className="flex-1">
              Deploy Another Token
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
