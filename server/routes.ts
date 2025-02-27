import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertSheetSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/sheets", async (req, res) => {
    const parsed = insertSheetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error });
    }
    
    const sheet = await storage.createSheet(parsed.data);
    res.json(sheet);
  });

  app.get("/api/sheets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const sheet = await storage.getSheet(id);
    if (!sheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }
    res.json(sheet);
  });

  app.put("/api/sheets/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const sheet = await storage.updateSheet(id, req.body);
    if (!sheet) {
      return res.status(404).json({ error: "Sheet not found" });
    }
    res.json(sheet);
  });

  const httpServer = createServer(app);
  return httpServer;
}
