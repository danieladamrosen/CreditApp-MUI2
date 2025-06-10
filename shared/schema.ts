import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Database Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const disputes = pgTable("disputes", {
  id: serial("id").primaryKey(),
  accountId: text("account_id").notNull(),
  creditorName: text("creditor_name").notNull(),
  disputeReason: text("dispute_reason").notNull(),
  instructions: text("instructions"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customDisputeTemplates = pgTable("custom_dispute_templates", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'reason' or 'instruction'
  text: text("text").notNull(),
  category: text("category").notNull().default("personal_info"), // 'personal_info', 'accounts', 'inquiries'
  usageCount: integer("usage_count").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Validation Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDisputeSchema = createInsertSchema(disputes).pick({
  accountId: true,
  creditorName: true,
  disputeReason: true,
  instructions: true,
});

export const insertCustomTemplateSchema = createInsertSchema(customDisputeTemplates).pick({
  type: true,
  text: true,
  category: true,
});

// Type Definitions
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertDispute = z.infer<typeof insertDisputeSchema>;
export type Dispute = typeof disputes.$inferSelect;
export type InsertCustomTemplate = z.infer<typeof insertCustomTemplateSchema>;
export type CustomTemplate = typeof customDisputeTemplates.$inferSelect;

// Credit Report Types
export const CreditReportSchema = z.object({
  CREDIT_RESPONSE: z.object({
    "@MISMOVersionID": z.string(),
    "@CreditResponseID": z.string(),
    "@CreditReportIdentifier": z.string(),
    "@CreditReportFirstIssuedDate": z.string(),
    "@CreditReportMergeTypeIndicator": z.string(),
    "@CreditRatingCodeType": z.string(),
    CREDIT_REPOSITORY_INCLUDED: z.object({
      "@_EquifaxIndicator": z.string(),
      "@_ExperianIndicator": z.string(),
      "@_TransUnionIndicator": z.string(),
    }),
    CREDIT_FROZEN_STATUS: z.object({
      "@_EquifaxIndicator": z.string(),
      "@_ExperianIndicator": z.string(),
      "@_TransUnionIndicator": z.string(),
    }),
    BORROWER: z.object({
      "@BorrowerID": z.string(),
      "@_BirthDate": z.string(),
      "@_FirstName": z.string(),
      "@_LastName": z.string(),
      "@_SSN": z.string(),
      "@_UnparsedName": z.string(),
      "@_PrintPositionType": z.string(),
      "_RESIDENCE": z.array(z.object({
        "@_StreetAddress": z.string(),
        "@_City": z.string(),
        "@_State": z.string(),
        "@_PostalCode": z.string(),
        "@BorrowerResidencyType": z.string(),
      })),
    }),
    CREDIT_LIABILITY: z.array(z.object({
      "@CreditLiabilityID": z.string(),
      "@BorrowerID": z.string(),
      "@CreditFileID": z.string(),
      "@CreditTradeReferenceID": z.string(),
      "@_AccountBalanceDate": z.string(),
      "@_AccountIdentifier": z.string(),
      "@_AccountOpenedDate": z.string(),
      "@_AccountOwnershipType": z.string(),
      "@_AccountReportedDate": z.string(),
      "@_AccountStatusDate": z.string(),
      "@_AccountStatusType": z.string(),
      "@_AccountType": z.string(),
      "@_ConsumerDisputeIndicator": z.string(),
      "@_DerogatoryDataIndicator": z.string(),
      "@_HighBalanceAmount": z.string(),
      "@_LastActivityDate": z.string(),
      "@_MonthlyPaymentAmount": z.string(),
      "@_MonthsReviewedCount": z.string(),
      "@_TermsMonthsCount": z.string(),
      "@_TermsDescription": z.string(),
      "@_TermsSourceType": z.string(),
      "@_UnpaidBalanceAmount": z.string(),
      "@CreditBusinessType": z.string(),
      "@CreditLoanType": z.string(),
      "@CreditLoanTypeCode": z.string(),
      "@_OriginalBalanceAmount": z.string(),
      "@IsMortgageIndicator": z.string(),
      "@IsClosedIndicator": z.string(),
      "@IsCollectionIndicator": z.string(),
      "@IsChargeoffIndicator": z.string(),
      "@RawAccountType": z.string(),
      "@RawIndustryText": z.string(),
      "@RawIndustryCode": z.string(),
      "_CREDITOR": z.object({
        "@_Name": z.string(),
        "@_StreetAddress": z.string(),
        "@_City": z.string(),
        "@_State": z.string(),
        "@_PostalCode": z.string(),
        "@_Phone": z.string(),
        "CONTACT_DETAIL": z.object({
          "CONTACT_POINT": z.object({
            "@_Type": z.string(),
            "@_Value": z.string(),
          }),
        }),
      }),
      "_CURRENT_RATING": z.object({
        "@_Code": z.string(),
        "@_Type": z.string(),
      }),
      "_LATE_COUNT": z.object({
        "@_30Days": z.string(),
        "@_60Days": z.string(),
        "@_90Days": z.string(),
      }),
      "_PAYMENT_PATTERN": z.object({
        "@_Data": z.string(),
        "@_StartDate": z.string(),
      }),
      "CREDIT_COMMENT": z.object({
        "@_SourceType": z.string(),
        "@_Type": z.string(),
        "@_Code": z.string(),
        "_Text": z.string(),
      }),
      "CREDIT_REPOSITORY": z.object({
        "@_SourceType": z.string(),
      }),
    })),
  }),
});

export type CreditReport = z.infer<typeof CreditReportSchema>;
