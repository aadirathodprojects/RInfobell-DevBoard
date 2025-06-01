import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertCommentSchema, insertTipSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Serve uploaded files
  app.use("/uploads", express.static(uploadsDir));

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Posts routes
  app.get("/api/posts", async (req, res) => {
    try {
      const { category, resolved, search } = req.query;
      const filters: any = {};
      
      if (category && typeof category === "string") {
        filters.category = category;
      }
      if (resolved !== undefined) {
        filters.resolved = resolved === "true";
      }
      if (search && typeof search === "string") {
        filters.search = search;
      }

      const posts = await storage.getPosts(filters);
      res.json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", isAuthenticated, upload.single("image"), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({
        ...req.body,
        createdBy: userId,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      });

      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(400).json({ message: "Failed to create post" });
    }
  });

  app.patch("/api/posts/:id/resolve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updatedPost = await storage.togglePostResolved(req.params.id, userId);
      
      if (!updatedPost) {
        return res.status(403).json({ message: "Only the post creator can toggle resolution" });
      }
      
      res.json(updatedPost);
    } catch (error) {
      console.error("Error toggling post resolution:", error);
      res.status(500).json({ message: "Failed to toggle post resolution" });
    }
  });

  // Comments routes
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId: req.params.id,
        userId,
      });

      const comment = await storage.createComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(400).json({ message: "Failed to create comment" });
    }
  });

  // Comment votes routes
  app.post("/api/comments/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { voteType } = req.body;
      
      if (!["up", "helpful"].includes(voteType)) {
        return res.status(400).json({ message: "Invalid vote type" });
      }

      await storage.voteComment({
        commentId: req.params.id,
        userId,
        voteType,
      });

      res.status(200).json({ message: "Vote recorded" });
    } catch (error) {
      console.error("Error voting on comment:", error);
      res.status(500).json({ message: "Failed to vote on comment" });
    }
  });

  app.delete("/api/comments/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.removeCommentVote(req.params.id, userId);
      res.status(200).json({ message: "Vote removed" });
    } catch (error) {
      console.error("Error removing vote:", error);
      res.status(500).json({ message: "Failed to remove vote" });
    }
  });

  // Tips routes
  app.get("/api/tips", async (req, res) => {
    try {
      const tips = await storage.getTips();
      res.json(tips);
    } catch (error) {
      console.error("Error fetching tips:", error);
      res.status(500).json({ message: "Failed to fetch tips" });
    }
  });

  app.post("/api/tips", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const tipData = insertTipSchema.parse({
        ...req.body,
        postedBy: userId,
      });

      const tip = await storage.createTip(tipData);
      res.status(201).json(tip);
    } catch (error) {
      console.error("Error creating tip:", error);
      res.status(400).json({ message: "Failed to create tip" });
    }
  });

  app.post("/api/tips/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.likeTip(req.params.id, userId);
      res.status(200).json({ message: "Tip liked" });
    } catch (error) {
      console.error("Error liking tip:", error);
      res.status(500).json({ message: "Failed to like tip" });
    }
  });

  app.delete("/api/tips/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.unlikeTip(req.params.id, userId);
      res.status(200).json({ message: "Tip unliked" });
    } catch (error) {
      console.error("Error unliking tip:", error);
      res.status(500).json({ message: "Failed to unlike tip" });
    }
  });

  // Stats route
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
