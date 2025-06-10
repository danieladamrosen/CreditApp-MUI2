import { disputes, customDisputeTemplates, type Dispute, type InsertDispute, type CustomTemplate, type InsertCustomTemplate } from "../shared/schema.js";

export interface IStorage {
  getDispute(id: number): Promise<Dispute | undefined>;
  getAllDisputes(): Promise<Dispute[]>;
  createDispute(dispute: InsertDispute): Promise<Dispute>;
  updateDisputeStatus(id: number, status: string): Promise<Dispute | undefined>;
  getCustomTemplates(type: string, category: string): Promise<CustomTemplate[]>;
  createCustomTemplate(template: InsertCustomTemplate): Promise<CustomTemplate>;
  incrementTemplateUsage(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private disputes: Map<number, Dispute>;
  private templates: Map<number, CustomTemplate>;
  private currentDisputeId: number;
  private currentTemplateId: number;

  constructor() {
    this.disputes = new Map();
    this.templates = new Map();
    this.currentDisputeId = 1;
    this.currentTemplateId = 1;
  }

  async getDispute(id: number): Promise<Dispute | undefined> {
    return this.disputes.get(id);
  }

  async getAllDisputes(): Promise<Dispute[]> {
    return Array.from(this.disputes.values());
  }

  async createDispute(insertDispute: InsertDispute): Promise<Dispute> {
    const id = this.currentDisputeId++;
    const now = new Date();
    const dispute: Dispute = { 
      ...insertDispute, 
      id, 
      status: "pending",
      createdAt: now,
      updatedAt: now,
      instructions: insertDispute.instructions || null
    };
    this.disputes.set(id, dispute);
    return dispute;
  }

  async updateDisputeStatus(id: number, status: string): Promise<Dispute | undefined> {
    const dispute = this.disputes.get(id);
    if (dispute) {
      const updatedDispute = { ...dispute, status, updatedAt: new Date() };
      this.disputes.set(id, updatedDispute);
      return updatedDispute;
    }
    return undefined;
  }

  async getCustomTemplates(type: string, category: string): Promise<CustomTemplate[]> {
    return Array.from(this.templates.values()).filter(
      template => template.type === type && template.category === category
    );
  }

  async createCustomTemplate(insertTemplate: InsertCustomTemplate): Promise<CustomTemplate> {
    const id = this.currentTemplateId++;
    const now = new Date();
    const template: CustomTemplate = {
      ...insertTemplate,
      id,
      category: insertTemplate.category || "personal_info",
      usageCount: 1,
      createdAt: now
    };
    this.templates.set(id, template);
    return template;
  }

  async incrementTemplateUsage(id: number): Promise<void> {
    const template = this.templates.get(id);
    if (template) {
      template.usageCount++;
      this.templates.set(id, template);
    }
  }
}

export const storage = new MemStorage();
