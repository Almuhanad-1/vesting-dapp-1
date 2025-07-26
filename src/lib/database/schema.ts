// lib/database/schema.ts
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Deployed tokens table
export const deployedTokens = pgTable("deployed_tokens", {
  id: serial("id").primaryKey(),
  address: varchar("address", { length: 42 }).unique().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  totalSupply: varchar("total_supply", { length: 78 }).notNull(),
  ownerAddress: varchar("owner_address", { length: 42 }).notNull(),
  factoryTxHash: varchar("factory_tx_hash", { length: 66 }).notNull(),
  deployedAt: timestamp("deployed_at").defaultNow().notNull(),
});

// Vesting schedules table
export const vestingSchedules = pgTable("vesting_schedules", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id")
    .references(() => deployedTokens.id)
    .notNull(),
  contractAddress: varchar("contract_address", { length: 42 }).notNull(),
  beneficiaryAddress: varchar("beneficiary_address", { length: 42 }).notNull(),
  totalAmount: varchar("total_amount", { length: 78 }).notNull(),
  cliffDuration: integer("cliff_duration").notNull(), // seconds
  vestingDuration: integer("vesting_duration").notNull(), // seconds
  startTime: timestamp("start_time").notNull(),
  releasedAmount: varchar("released_amount", { length: 78 })
    .default("0")
    .notNull(),
  revoked: boolean("revoked").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Beneficiary claims table
export const vestingClaims = pgTable("vesting_claims", {
  id: serial("id").primaryKey(),
  vestingScheduleId: integer("vesting_schedule_id")
    .references(() => vestingSchedules.id)
    .notNull(),
  amountClaimed: varchar("amount_claimed", { length: 78 }).notNull(),
  txHash: varchar("tx_hash", { length: 66 }).notNull(),
  claimedAt: timestamp("claimed_at").defaultNow().notNull(),
});

// Relations
export const deployedTokensRelations = relations(
  deployedTokens,
  ({ many }) => ({
    vestingSchedules: many(vestingSchedules),
  })
);

export const vestingSchedulesRelations = relations(
  vestingSchedules,
  ({ one, many }) => ({
    token: one(deployedTokens, {
      fields: [vestingSchedules.tokenId],
      references: [deployedTokens.id],
    }),
    claims: many(vestingClaims),
  })
);

export const vestingClaimsRelations = relations(vestingClaims, ({ one }) => ({
  vestingSchedule: one(vestingSchedules, {
    fields: [vestingClaims.vestingScheduleId],
    references: [vestingSchedules.id],
  }),
}));

// Types
export type DeployedToken = typeof deployedTokens.$inferSelect;
export type NewDeployedToken = typeof deployedTokens.$inferInsert;

export type VestingSchedule = typeof vestingSchedules.$inferSelect;
export type NewVestingSchedule = typeof vestingSchedules.$inferInsert;

export type VestingClaim = typeof vestingClaims.$inferSelect;
export type NewVestingClaim = typeof vestingClaims.$inferInsert;
