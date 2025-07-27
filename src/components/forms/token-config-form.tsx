// components/forms/token-config-form.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAccount } from "wagmi";
import { parseUnits } from "viem";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Info,
  ArrowRight,
  Coins,
  Calculator,
  CheckCircle2,
} from "lucide-react";

import { useFactoryStore } from "@/lib/stores/factory-store";

const tokenConfigSchema = z.object({
  name: z.string().min(1, "Token name is required").max(50, "Name too long"),
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol too long")
    .regex(/^[A-Z0-9]+$/, "Symbol must be uppercase letters and numbers only"),
  totalSupply: z
    .string()
    .min(1, "Total supply is required")
    .regex(/^\d+(\.\d+)?$/, "Must be a valid number"),
  decimals: z.number().min(0).max(18),
});

type TokenConfigFormData = z.infer<typeof tokenConfigSchema>;

interface TokenConfigFormProps {
  onNext: () => void;
}

export function TokenConfigForm({ onNext }: TokenConfigFormProps) {
  const { address } = useAccount();
  const { deploymentDraft, updateTokenConfig } = useFactoryStore();
  const [supplyType, setSupplyType] = useState<
    "millions" | "billions" | "custom"
  >("millions");

  const form = useForm<TokenConfigFormData>({
    resolver: zodResolver(tokenConfigSchema),
    defaultValues: {
      name: deploymentDraft.tokenConfig.name || "",
      symbol: deploymentDraft.tokenConfig.symbol || "",
      totalSupply: deploymentDraft.tokenConfig.totalSupply || "",
      decimals: 18,
    },
  });

  const watchedValues = form.watch();

  const getSupplyInTokens = () => {
    const supply = parseFloat(watchedValues.totalSupply || "0");
    if (isNaN(supply)) return "0";

    switch (supplyType) {
      case "millions":
        return (supply * 1_000_000).toLocaleString();
      case "billions":
        return (supply * 1_000_000_000).toLocaleString();
      default:
        return supply.toLocaleString();
    }
  };

  const getSupplyInWei = () => {
    const supply = parseFloat(watchedValues.totalSupply || "0");
    if (isNaN(supply)) return BigInt(0);

    let actualSupply: number;
    switch (supplyType) {
      case "millions":
        actualSupply = supply * 1_000_000;
        break;
      case "billions":
        actualSupply = supply * 1_000_000_000;
        break;
      default:
        actualSupply = supply;
    }

    return parseUnits(actualSupply.toString(), watchedValues.decimals);
  };

  const onSubmit = (data: TokenConfigFormData) => {
    const supplyInWei = getSupplyInWei();

    updateTokenConfig({
      name: data.name,
      symbol: data.symbol,
      totalSupply: supplyInWei.toString(),
      owner: address!,
    });

    onNext();
  };

  const supplyTypeOptions = [
    { value: "millions", label: "Millions", multiplier: "×1M" },
    { value: "billions", label: "Billions", multiplier: "×1B" },
    { value: "custom", label: "Custom", multiplier: "×1" },
  ];

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Coins className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Token Configuration</CardTitle>
            <CardDescription>
              Configure your ERC-20 token parameters
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Token Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Project Token" {...field} />
                  </FormControl>
                  <FormDescription>
                    The full name of your token (e.g., "Ethereum", "Chainlink")
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Token Symbol */}
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Token Symbol</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="MPT"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    The symbol for your token (e.g., "ETH", "LINK"). 2-10
                    characters, uppercase only.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supply Type Selector */}
            <div className="space-y-3">
              <FormLabel>Supply Scale</FormLabel>
              <div className="flex space-x-2">
                {supplyTypeOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={
                      supplyType === option.value ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSupplyType(option.value as any)}
                  >
                    {option.label}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {option.multiplier}
                    </Badge>
                  </Button>
                ))}
              </div>
            </div>

            {/* Total Supply */}
            <FormField
              control={form.control}
              name="totalSupply"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Total Supply
                    {supplyType === "millions" && " (in millions)"}
                    {supplyType === "billions" && " (in billions)"}
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder={
                          supplyType === "custom" ? "1000000" : "100"
                        }
                        {...field}
                      />
                      <div className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                        {supplyType === "millions" && "M"}
                        {supplyType === "billions" && "B"}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    {supplyType === "millions" &&
                      "Enter the supply in millions (e.g., 100 = 100M tokens)"}
                    {supplyType === "billions" &&
                      "Enter the supply in billions (e.g., 1 = 1B tokens)"}
                    {supplyType === "custom" &&
                      "Enter the exact number of tokens"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Supply Preview */}
            {watchedValues.totalSupply && (
              <Alert>
                <Calculator className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Total tokens to be minted:</span>
                    <Badge variant="outline" className="font-mono">
                      {getSupplyInTokens()} {watchedValues.symbol || "tokens"}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Token Preview */}
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-medium">Token Preview</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <span className="ml-2 font-medium">
                    {watchedValues.name || "Token Name"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Symbol:</span>
                  <span className="ml-2 font-medium">
                    {watchedValues.symbol || "SYMBOL"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Supply:</span>
                  <span className="ml-2 font-medium">
                    {getSupplyInTokens()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Decimals:</span>
                  <span className="ml-2 font-medium">18</span>
                </div>
              </div>
            </div>

            {/* Info Alert */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Your token will be deployed with OpenZeppelin's standard ERC-20
                implementation for maximum compatibility and security.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={!form.formState.isValid}
            >
              Continue to Vesting Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
