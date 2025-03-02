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

  // Initialize sheet with ID 1 if it doesn't exist
  app.post("/api/sheets/init", async (req, res) => {
    // Check if sheet 1 exists
    const existingSheet = await storage.getSheet(1);
    
    if (!existingSheet) {
      // Create default sheet with ID 1
      const initialSheet = {
        name: "New Sheet",
        data: {
          cells: {},
          rowCount: 100,
          colCount: 26
        }
      };
      
      const sheet = await storage.createSheet(initialSheet);
      res.json(sheet);
    } else {
      res.json(existingSheet);
    }
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
