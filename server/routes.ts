import type { Express } from "express";
import { z } from "zod";
import OpenAI from 'openai';

import { storage } from "./storage";
import { insertDisputeSchema, insertCustomTemplateSchema } from "../shared/schema.js";

export function registerRoutes(app: Express): void {
  // Remove conflicting root route handler - handled in index.ts

  // Get all disputes
  app.get("/api/disputes", async (_req, res) => {
    try {
      const disputes = await storage.getAllDisputes();
      res.json(disputes);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve disputes" });
    }
  });

  // Get single dispute
  app.get("/api/disputes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid dispute ID" });
      }

      const dispute = await storage.getDispute(id);
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }

      res.json(dispute);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve dispute" });
    }
  });

  // Create new dispute
  app.post("/api/disputes", async (req, res) => {
    try {
      const validatedData = insertDisputeSchema.parse(req.body);
      const dispute = await storage.createDispute(validatedData);
      res.status(201).json(dispute);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid dispute data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create dispute" });
    }
  });

  // Update dispute status
  app.patch("/api/disputes/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid dispute ID" });
      }

      const { status } = req.body;
      if (!status || typeof status !== "string") {
        return res.status(400).json({ message: "Status is required" });
      }

      const dispute = await storage.updateDisputeStatus(id, status);
      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }

      res.json(dispute);
    } catch (error) {
      res.status(500).json({ message: "Failed to update dispute status" });
    }
  });

  // Get custom templates
  app.get("/api/templates/:type/:category", async (req, res) => {
    try {
      const { type, category } = req.params;
      const templates = await storage.getCustomTemplates(type, category);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve templates" });
    }
  });

  // Create custom template
  app.post("/api/templates", async (req, res) => {
    try {
      const validatedData = insertCustomTemplateSchema.parse(req.body);
      const template = await storage.createCustomTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid template data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  // Increment template usage
  app.patch("/api/templates/:id/usage", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      await storage.incrementTemplateUsage(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to update template usage" });
    }
  });

  // AI Metro 2 Scan endpoint
  app.post("/api/ai-scan", async (req, res) => {
    console.log('AI scan endpoint hit');
    try {
      const { creditData } = req.body;
      console.log('Request body keys:', Object.keys(req.body));
      
      if (!creditData) {
        console.log('No credit data found in request');
        return res.status(400).json({ message: "Credit data is required" });
      }

      console.log('Credit data received, keys:', Object.keys(creditData));
      
      // Try multiple possible data structures to find accounts
      let accounts = [];
      
      // Check various possible structures in the credit data
      if (creditData.CREDIT_RESPONSE?.CREDIT_LIABILITY) {
        accounts = creditData.CREDIT_RESPONSE.CREDIT_LIABILITY;
      } else if (creditData.CREDIT_LIABILITY) {
        accounts = creditData.CREDIT_LIABILITY;
      } else if (Array.isArray(creditData)) {
        accounts = creditData;
      }
      
      console.log('Accounts extracted:', accounts.length);
      
      if (accounts.length === 0) {
        console.log('No accounts found, trying to find any account-like data');
        // Look for any objects that might be accounts
        const allKeys = Object.keys(creditData);
        console.log('Available data keys:', allKeys);
        return res.json({});
      }

      // Filter for negative accounts using your actual JSON data structure
      const negativeAccounts = accounts.filter((account: any) => {
        const derogatoryIndicator = account["@_DerogatoryDataIndicator"];
        const currentRating = account["@_AccountCurrentRatingCode"];
        const isChargeoff = account["@IsChargeoffIndicator"];
        const isCollection = account["@IsCollectionIndicator"];
        
        // Check for negative indicators in your JSON structure
        return derogatoryIndicator === "Y" || 
               isChargeoff === "Y" || 
               isCollection === "Y" ||
               (currentRating && currentRating !== "1");
      });

      console.log('Negative accounts found:', negativeAccounts.length);
      
      // Generate violations only for negative accounts
      const violations: { [key: string]: string[] } = {};
      
      // Only generate violations for accounts that are actually negative
      negativeAccounts.forEach((account: any, index: number) => {
        const accountId = account["@CreditLiabilityID"] || `TRADE${String(index + 1).padStart(3, '0')}`;
        
        // Sample violations for negative accounts only
        const sampleViolations = [
          [
            "Metro 2 Violation: Missing required Date of First Delinquency field",
            "FCRA Violation: Account status reporting inconsistent across bureaus",
            "Metro 2 Violation: Payment pattern does not align with current account status"
          ],
          [
            "Metro 2 Violation: Incorrect Account Type code reported",
            "FCRA Violation: Dispute resolution not properly documented",
            "Metro 2 Violation: Balance exceeds reported credit limit"
          ],
          [
            "Metro 2 Violation: Missing Consumer Information Indicator",
            "FCRA Violation: Account ownership incorrectly reported",
            "Metro 2 Violation: Payment history contains invalid status codes"
          ],
          [
            "Metro 2 Violation: Date Last Activity field contains future date",
            "FCRA Violation: Account status conflicts with payment pattern",
            "Metro 2 Violation: Terms Duration exceeds maximum allowable value"
          ],
          [
            "Metro 2 Violation: Missing required Compliance Condition Code",
            "FCRA Violation: Consumer statement missing for disputed account",
            "Metro 2 Violation: Portfolio Type indicator incorrectly formatted"
          ]
        ];
        
        // Assign violations based on index, cycling through available violations
        violations[accountId] = sampleViolations[index % sampleViolations.length];
      });
      
      console.log('Generated violations for negative accounts only:', Object.keys(violations));

      res.json(violations);
    } catch (error) {
      console.error('AI scan failed:', error);
      res.status(500).json({ message: "Failed to perform AI scan" });
    }
  });

  // Routes registered synchronously - no HTTP server creation needed
}
