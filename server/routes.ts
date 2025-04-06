import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  insertUserSchema,
  insertArticleSchema,
  insertCommentSchema,
  insertTagSchema,
  insertBookmarkSchema,
  insertFollowSchema,
  insertArticleTagSchema
} from "@shared/schema";
import { z } from "zod";
import { ZodError } from "zod-validation-error";

// Initialize session store
const MemoryStoreSession = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure session middleware
  app.use(
    session({
      cookie: {
        maxAge: 86400000, // 24 hours
        secure: process.env.NODE_ENV === "production",
      },
      secret: process.env.SESSION_SECRET || "logus-secret",
      resave: false,
      saveUninitialized: false,
      store: new MemoryStoreSession({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // ===== Middleware Functions =====
  
  // Validate request body against a schema
  const validateRequest = (schema: z.ZodType<any, any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        req.body = schema.parse(req.body);
        next();
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Validation failed",
            errors: error.errors,
          });
        }
        next(error);
      }
    };
  };

  // Ensure user is authenticated
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // ===== API Routes =====
  // All routes are prefixed with /api

  // ----- Auth Routes -----
  
  // Register a new user
  app.post(
    "/api/auth/register",
    validateRequest(insertUserSchema),
    async (req, res) => {
      try {
        const { username, password, email, name } = req.body;

        // Check if user already exists
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }

        // Create the user
        const user = await storage.createUser({
          username,
          password, // In a real app, you would hash this password
          email,
          name,
          bio: "",
          avatar: "",
        });

        // Save user id to session
        req.session.userId = user.id;

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      // Find the user
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password (in a real app, you would compare hashed passwords)
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Save user id to session
      req.session.userId = user.id;

      // Return user data (excluding password)
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Return user data (excluding password)
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ----- User Routes -----
  
  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Return user data (excluding password)
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get user's articles
  app.get("/api/users/:id/articles", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const articles = await storage.getArticlesByAuthor(userId);
      return res.status(200).json(articles);
    } catch (error) {
      console.error("Get user articles error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Follow a user
  app.post(
    "/api/users/:id/follow",
    requireAuth,
    validateRequest(insertFollowSchema),
    async (req, res) => {
      try {
        const followingId = parseInt(req.params.id);
        const followerId = req.session.userId!;
        
        // Can't follow yourself
        if (followerId === followingId) {
          return res.status(400).json({ message: "Cannot follow yourself" });
        }
        
        await storage.followUser({
          followerId,
          followingId
        });
        
        return res.status(200).json({ message: "Followed successfully" });
      } catch (error) {
        console.error("Follow user error:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Unfollow a user
  app.delete("/api/users/:id/follow", requireAuth, async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.session.userId!;
      
      const success = await storage.unfollowUser(followerId, followingId);
      
      if (!success) {
        return res.status(404).json({ message: "Follow relationship not found" });
      }
      
      return res.status(200).json({ message: "Unfollowed successfully" });
    } catch (error) {
      console.error("Unfollow user error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Check if following
  app.get("/api/users/:id/following", requireAuth, async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.session.userId!;
      
      const isFollowing = await storage.isFollowing(followerId, followingId);
      
      return res.status(200).json({ following: isFollowing });
    } catch (error) {
      console.error("Check following error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get user's followers
  app.get("/api/users/:id/followers", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const followers = await storage.getFollowers(userId);
      
      // Remove passwords
      const safeFollowers = followers.map(({ password, ...user }) => user);
      
      return res.status(200).json(safeFollowers);
    } catch (error) {
      console.error("Get followers error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get users the user is following
  app.get("/api/users/:id/following", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const following = await storage.getFollowing(userId);
      
      // Remove passwords
      const safeFollowing = following.map(({ password, ...user }) => user);
      
      return res.status(200).json(safeFollowing);
    } catch (error) {
      console.error("Get following error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ----- Article Routes -----
  
  // Get all articles
  app.get("/api/articles", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      
      const articles = await storage.getArticles(limit, offset);
      return res.status(200).json(articles);
    } catch (error) {
      console.error("Get articles error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get trending articles
  app.get("/api/articles/trending", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      
      const articles = await storage.getTrendingArticles(limit);
      return res.status(200).json(articles);
    } catch (error) {
      console.error("Get trending articles error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Search articles
  app.get("/api/articles/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter is required" });
      }
      
      const articles = await storage.searchArticles(query);
      return res.status(200).json(articles);
    } catch (error) {
      console.error("Search articles error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get article by ID
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      return res.status(200).json(article);
    } catch (error) {
      console.error("Get article error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Create article
  app.post(
    "/api/articles",
    requireAuth,
    validateRequest(insertArticleSchema),
    async (req, res) => {
      try {
        const authorId = req.session.userId!;
        
        const article = await storage.createArticle({
          ...req.body,
          authorId
        });
        
        return res.status(201).json(article);
      } catch (error) {
        console.error("Create article error:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Update article
  app.put(
    "/api/articles/:id",
    requireAuth,
    async (req, res) => {
      try {
        const articleId = parseInt(req.params.id);
        const userId = req.session.userId!;
        
        // Get the article
        const article = await storage.getArticleById(articleId);
        
        if (!article) {
          return res.status(404).json({ message: "Article not found" });
        }
        
        // Check if user is the author
        if (article.authorId !== userId) {
          return res.status(403).json({ message: "Not authorized to update this article" });
        }
        
        // Update the article
        const updatedArticle = await storage.updateArticle(articleId, req.body);
        
        return res.status(200).json(updatedArticle);
      } catch (error) {
        console.error("Update article error:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Delete article
  app.delete("/api/articles/:id", requireAuth, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Get the article
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user is the author
      if (article.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this article" });
      }
      
      // Delete the article
      const success = await storage.deleteArticle(articleId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete article" });
      }
      
      return res.status(200).json({ message: "Article deleted successfully" });
    } catch (error) {
      console.error("Delete article error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ----- Tag Routes -----
  
  // Get all tags
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      return res.status(200).json(tags);
    } catch (error) {
      console.error("Get tags error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get articles by tag
  app.get("/api/tags/:id/articles", async (req, res) => {
    try {
      const tagId = parseInt(req.params.id);
      const articles = await storage.getArticlesByTag(tagId);
      return res.status(200).json(articles);
    } catch (error) {
      console.error("Get articles by tag error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Create tag
  app.post(
    "/api/tags",
    requireAuth,
    validateRequest(insertTagSchema),
    async (req, res) => {
      try {
        const { name, color } = req.body;
        
        // Check if tag already exists
        const existingTag = await storage.getTagByName(name);
        if (existingTag) {
          return res.status(400).json({ message: "Tag already exists" });
        }
        
        const tag = await storage.createTag({ name, color });
        return res.status(201).json(tag);
      } catch (error) {
        console.error("Create tag error:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Add tag to article
  app.post(
    "/api/articles/:articleId/tags",
    requireAuth,
    validateRequest(insertArticleTagSchema),
    async (req, res) => {
      try {
        const articleId = parseInt(req.params.articleId);
        const { tagId } = req.body;
        const userId = req.session.userId!;
        
        // Get the article
        const article = await storage.getArticleById(articleId);
        
        if (!article) {
          return res.status(404).json({ message: "Article not found" });
        }
        
        // Check if user is the author
        if (article.authorId !== userId) {
          return res.status(403).json({ message: "Not authorized to add tags to this article" });
        }
        
        // Check if tag exists
        const tag = await storage.getTagById(tagId);
        if (!tag) {
          return res.status(404).json({ message: "Tag not found" });
        }
        
        // Add tag to article
        await storage.addTagToArticle({ articleId, tagId });
        
        return res.status(200).json({ message: "Tag added successfully" });
      } catch (error) {
        console.error("Add tag to article error:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Remove tag from article
  app.delete("/api/articles/:articleId/tags/:tagId", requireAuth, async (req, res) => {
    try {
      const articleId = parseInt(req.params.articleId);
      const tagId = parseInt(req.params.tagId);
      const userId = req.session.userId!;
      
      // Get the article
      const article = await storage.getArticleById(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user is the author
      if (article.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to remove tags from this article" });
      }
      
      // Remove tag from article
      const success = await storage.removeTagFromArticle(articleId, tagId);
      
      if (!success) {
        return res.status(404).json({ message: "Tag not found on article" });
      }
      
      return res.status(200).json({ message: "Tag removed successfully" });
    } catch (error) {
      console.error("Remove tag from article error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ----- Comment Routes -----
  
  // Get comments for an article
  app.get("/api/articles/:articleId/comments", async (req, res) => {
    try {
      const articleId = parseInt(req.params.articleId);
      
      // Check if article exists
      const article = await storage.getArticleById(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const comments = await storage.getArticleComments(articleId);
      return res.status(200).json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Add comment to article
  app.post(
    "/api/articles/:articleId/comments",
    requireAuth,
    validateRequest(insertCommentSchema),
    async (req, res) => {
      try {
        const articleId = parseInt(req.params.articleId);
        const authorId = req.session.userId!;
        const { content, parentId } = req.body;
        
        // Check if article exists
        const article = await storage.getArticleById(articleId);
        if (!article) {
          return res.status(404).json({ message: "Article not found" });
        }
        
        // If parentId is provided, check if parent comment exists
        if (parentId) {
          const parentComment = await storage.commentsData.get(parentId);
          if (!parentComment) {
            return res.status(404).json({ message: "Parent comment not found" });
          }
          
          // Ensure parent comment belongs to the same article
          if (parentComment.articleId !== articleId) {
            return res.status(400).json({ message: "Parent comment does not belong to this article" });
          }
        }
        
        const comment = await storage.createComment({
          content,
          authorId,
          articleId,
          parentId
        });
        
        return res.status(201).json(comment);
      } catch (error) {
        console.error("Add comment error:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Delete comment
  app.delete("/api/comments/:id", requireAuth, async (req, res) => {
    try {
      const commentId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      // Get the comment
      const comment = await storage.commentsData.get(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user is the author of the comment
      if (comment.authorId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this comment" });
      }
      
      // Delete the comment
      const success = await storage.deleteComment(commentId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete comment" });
      }
      
      return res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Delete comment error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ----- Bookmark Routes -----
  
  // Get user's bookmarks
  app.get("/api/bookmarks", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const bookmarks = await storage.getUserBookmarks(userId);
      return res.status(200).json(bookmarks);
    } catch (error) {
      console.error("Get bookmarks error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Add bookmark
  app.post(
    "/api/bookmarks",
    requireAuth,
    validateRequest(insertBookmarkSchema),
    async (req, res) => {
      try {
        const userId = req.session.userId!;
        const { articleId } = req.body;
        
        // Check if article exists
        const article = await storage.getArticleById(articleId);
        if (!article) {
          return res.status(404).json({ message: "Article not found" });
        }
        
        const bookmark = await storage.addBookmark({
          userId,
          articleId
        });
        
        return res.status(201).json(bookmark);
      } catch (error) {
        console.error("Add bookmark error:", error);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // Remove bookmark
  app.delete("/api/bookmarks/:articleId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const articleId = parseInt(req.params.articleId);
      
      const success = await storage.removeBookmark(userId, articleId);
      
      if (!success) {
        return res.status(404).json({ message: "Bookmark not found" });
      }
      
      return res.status(200).json({ message: "Bookmark removed successfully" });
    } catch (error) {
      console.error("Remove bookmark error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Check if article is bookmarked
  app.get("/api/bookmarks/:articleId", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const articleId = parseInt(req.params.articleId);
      
      const isBookmarked = await storage.isBookmarked(userId, articleId);
      
      return res.status(200).json({ bookmarked: isBookmarked });
    } catch (error) {
      console.error("Check bookmark error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
