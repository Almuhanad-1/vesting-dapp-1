// components/forms/vesting-config-form.tsx
"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { parseUnits, isAddress } from "viem";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Clock,
  Users,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Timer,
  AlertTriangle,
  Info,
} from "lucide-react";

import { useFactoryStore } from "@/lib/stores/factory-store";

const vestingConfigSchema = z.object({
  schedules: z
    .array(
      z.object({
        beneficiary: z.custom<`0x${string}`>(isAddress, {
          message: "Invalid Ethereum address",
        }),
        amount: z
          .string()
          .min(1, "Amount is required")
          .regex(/^\d+(\.\d+)?$/, "Must be a valid number"),
        vestingType: z.enum(["cliff", "linear", "cliff-linear"]),
        cliffMonths: z.number().min(0).max(120),
        vestingMonths: z.number().min(1).max(120),
        revocable: z.boolean().optional(),
      })
    )
    .min(1, "At least one vesting schedule is required"),
});

type VestingConfigFormData = z.infer<typeof vestingConfigSchema>;

interface VestingConfigFormProps {
  onNext: () => void;
  onBack: () => void;
}

export function VestingConfigForm({ onNext, onBack }: VestingConfigFormProps) {
  const { deploymentDraft, updateVestingConfigs } = useFactoryStore();
  const [activeTab, setActiveTab] = useState("manual");

  const form = useForm<VestingConfigFormData>({
    resolver: zodResolver(vestingConfigSchema),
    defaultValues: {
      schedules:
        deploymentDraft.vestingConfigs.length > 0
          ? deploymentDraft.vestingConfigs.map((config) => ({
              beneficiary: config.beneficiary,
              amount: config.amount,
              vestingType: getVestingType(config.cliff, config.duration),
              cliffMonths: Math.floor(
                Number(config.cliff) / (30 * 24 * 60 * 60)
              ),
              vestingMonths: Math.floor(
                Number(config.duration) / (30 * 24 * 60 * 60)
              ),
              revocable: config.revocable,
            }))
          : [
              {
                beneficiary: "" as `0x${string}`,
                amount: "",
                vestingType: "cliff-linear" as const,
                cliffMonths: 6,
                vestingMonths: 18,
                revocable: false,
              },
            ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedules",
  });

  function getVestingType(
    cliff: bigint,
    duration: bigint
  ): "cliff" | "linear" | "cliff-linear" {
    if (cliff > 0 && duration > cliff) return "cliff-linear";
    if (cliff > 0) return "cliff";
    return "linear";
  }

  const getTotalTokensAllocated = () => {
    return form.watch("schedules").reduce((total, schedule) => {
      const amount = parseFloat(schedule.amount || "0");
      return total + (isNaN(amount) ? 0 : amount);
    }, 0);
  };

  const getTotalSupply = () => {
    const totalSupply = deploymentDraft.tokenConfig.totalSupply;
    if (!totalSupply) return 0;
    return parseFloat(totalSupply) / Math.pow(10, 18); // Convert from wei
  };

  const getAllocationPercentage = () => {
    const total = getTotalTokensAllocated();
    const supply = getTotalSupply();
    return supply > 0 ? (total / supply) * 100 : 0;
  };

  const convertToSeconds = (months: number) => {
    return BigInt(months * 30 * 24 * 60 * 60); // Approximate months to seconds
  };

  const onSubmit = (data: VestingConfigFormData) => {
    const vestingConfigs = data.schedules.map((schedule) => {
      const cliffSeconds = convertToSeconds(schedule.cliffMonths);
      const totalDurationSeconds = convertToSeconds(schedule.vestingMonths);

      return {
        beneficiary: schedule.beneficiary as `0x${string}`,
        amount: parseUnits(schedule.amount, 18).toString(),
        cliff: cliffSeconds,
        duration: totalDurationSeconds,
        revocable: schedule.revocable ?? false,
      };
    });

    updateVestingConfigs(vestingConfigs);
    onNext();
  };

  const vestingTypeOptions = [
    {
      value: "cliff",
      label: "Cliff Only",
      description: "All tokens released at once after cliff period",
    },
    {
      value: "linear",
      label: "Linear Vesting",
      description: "Tokens released gradually over time",
    },
    {
      value: "cliff-linear",
      label: "Cliff + Linear",
      description: "Cliff period followed by linear vesting",
    },
  ];

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Clock className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <CardTitle>Vesting Configuration</CardTitle>
            <CardDescription>
              Set up vesting schedules for your token recipients
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Allocation Summary */}
                <Alert
                  className={
                    getAllocationPercentage() > 100 ? "border-destructive" : ""
                  }
                >
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        Total allocated:{" "}
                        {getTotalTokensAllocated().toLocaleString()} tokens (
                        {getAllocationPercentage().toFixed(2)}% of supply)
                      </span>
                      {getAllocationPercentage() > 100 && (
                        <Badge variant="destructive">Over-allocated!</Badge>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>

                {/* Vesting Schedules */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Vesting Schedules</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        append({
                          beneficiary: "" as `0x${string}`,
                          amount: "",
                          vestingType: "cliff-linear",
                          cliffMonths: 6,
                          vestingMonths: 18,
                          revocable: false,
                        })
                      }
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Schedule
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Schedule {index + 1}</h4>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Beneficiary Address */}
                        <FormField
                          control={form.control}
                          name={`schedules.${index}.beneficiary`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Beneficiary Address</FormLabel>
                              <FormControl>
                                <Input placeholder="0x..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Token Amount */}
                        <FormField
                          control={form.control}
                          name={`schedules.${index}.amount`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Token Amount</FormLabel>
                              <FormControl>
                                <Input placeholder="1000000" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Vesting Type */}
                        <FormField
                          control={form.control}
                          name={`schedules.${index}.vestingType`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vesting Type</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select vesting type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {vestingTypeOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      <div>
                                        <div className="font-medium">
                                          {option.label}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {option.description}
                                        </div>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Revocable Switch */}
                        <FormField
                          control={form.control}
                          name={`schedules.${index}.revocable`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Revocable</FormLabel>
                                <FormDescription className="text-xs">
                                  Allow revoking this vesting schedule
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* Cliff Period */}
                        {(form.watch(`schedules.${index}.vestingType`) ===
                          "cliff" ||
                          form.watch(`schedules.${index}.vestingType`) ===
                            "cliff-linear") && (
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.cliffMonths`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cliff Period (months)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="120"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormDescription>
                                  No tokens released during cliff period
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {/* Vesting Duration */}
                        {(form.watch(`schedules.${index}.vestingType`) ===
                          "linear" ||
                          form.watch(`schedules.${index}.vestingType`) ===
                            "cliff-linear") && (
                          <FormField
                            control={form.control}
                            name={`schedules.${index}.vestingMonths`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  {form.watch(
                                    `schedules.${index}.vestingType`
                                  ) === "cliff-linear"
                                    ? "Total Vesting Period (months)"
                                    : "Linear Vesting Period (months)"}
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="120"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value) || 1
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormDescription>
                                  {form.watch(
                                    `schedules.${index}.vestingType`
                                  ) === "cliff-linear"
                                    ? "Total time including cliff period"
                                    : "Tokens released gradually over this period"}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      {/* Schedule Preview */}
                      <Separator className="my-4" />
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>
                              Cliff:{" "}
                              {form.watch(`schedules.${index}.cliffMonths`) ||
                                0}{" "}
                              months
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Timer className="h-3 w-3" />
                            <span>
                              Duration:{" "}
                              {form.watch(`schedules.${index}.vestingMonths`) ||
                                0}{" "}
                              months
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Validation Alerts */}
                {getAllocationPercentage() > 100 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      You have allocated more tokens than the total supply.
                      Please reduce the amounts or increase the token supply.
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Vesting schedules are immutable once deployed. Double-check
                    all addresses and amounts.
                  </AlertDescription>
                </Alert>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Token Config
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !form.formState.isValid || getAllocationPercentage() > 100
                    }
                  >
                    Continue to Review
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="csv" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                CSV upload functionality will be implemented in Phase 5. For
                now, please use manual entry.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
