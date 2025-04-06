import { 
  users, type User, type InsertUser,
  articles, type Article, type InsertArticle, type ArticleWithAuthor,
  tags, type Tag, type InsertTag,
  articleTags, type ArticleTag, type InsertArticleTag,
  comments, type Comment, type InsertComment, type CommentWithAuthor,
  bookmarks, type Bookmark, type InsertBookmark,
  follows, type Follow, type InsertFollow
} from "@shared/schema";

// Storage interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Article operations
  getArticles(limit?: number, offset?: number): Promise<ArticleWithAuthor[]>;
  getArticleById(id: number): Promise<ArticleWithAuthor | undefined>;
  getArticlesByAuthor(authorId: number): Promise<ArticleWithAuthor[]>;
  getArticlesByTag(tagId: number): Promise<ArticleWithAuthor[]>;
  getTrendingArticles(limit?: number): Promise<ArticleWithAuthor[]>;
  createArticle(article: InsertArticle): Promise<Article>;
  updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  searchArticles(query: string): Promise<ArticleWithAuthor[]>;

  // Tag operations
  getAllTags(): Promise<Tag[]>;
  getTagById(id: number): Promise<Tag | undefined>;
  getTagByName(name: string): Promise<Tag | undefined>;
  createTag(tag: InsertTag): Promise<Tag>;
  getArticleTags(articleId: number): Promise<Tag[]>;
  addTagToArticle(articleTag: InsertArticleTag): Promise<ArticleTag>;
  removeTagFromArticle(articleId: number, tagId: number): Promise<boolean>;

  // Comment operations
  getArticleComments(articleId: number): Promise<CommentWithAuthor[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: number): Promise<boolean>;

  // Bookmark operations
  getUserBookmarks(userId: number): Promise<ArticleWithAuthor[]>;
  addBookmark(bookmark: InsertBookmark): Promise<Bookmark>;
  removeBookmark(userId: number, articleId: number): Promise<boolean>;
  isBookmarked(userId: number, articleId: number): Promise<boolean>;

  // Follow operations
  followUser(follow: InsertFollow): Promise<Follow>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private articlesData: Map<number, Article>;
  private tagsData: Map<number, Tag>;
  private articleTagsData: ArticleTag[];
  private commentsData: Map<number, Comment>;
  private bookmarksData: Bookmark[];
  private followsData: Follow[];
  
  private userId: number;
  private articleId: number;
  private tagId: number;
  private commentId: number;
  private bookmarkId: number;

  constructor() {
    this.usersData = new Map();
    this.articlesData = new Map();
    this.tagsData = new Map();
    this.articleTagsData = [];
    this.commentsData = new Map();
    this.bookmarksData = [];
    this.followsData = [];
    
    this.userId = 1;
    this.articleId = 1;
    this.tagId = 1;
    this.commentId = 1;
    this.bookmarkId = 1;

    // Initialize with some tags
    this.initializeData();
  }

  private initializeData() {
    // Create default tags
    const tagNames = [
      { name: "Technology", color: "#3b82f6" },
      { name: "Productivity", color: "#6366f1" },
      { name: "Writing", color: "#8b5cf6" },
      { name: "Psychology", color: "#ec4899" },
      { name: "Leadership", color: "#10b981" },
      { name: "Design", color: "#f59e0b" },
      { name: "Remote Work", color: "#6b7280" },
      { name: "Self-Improvement", color: "#ef4444" }
    ];

    tagNames.forEach(tag => {
      this.createTag({ name: tag.name, color: tag.color });
    });
  }

  // USER OPERATIONS
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const newUser: User = { ...user, id, createdAt: now };
    this.usersData.set(id, newUser);
    return newUser;
  }

  // ARTICLE OPERATIONS
  async getArticles(limit = 10, offset = 0): Promise<ArticleWithAuthor[]> {
    const articles = Array.from(this.articlesData.values())
      .filter(article => article.published)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit);

    return this.attachArticleRelations(articles);
  }

  async getArticleById(id: number): Promise<ArticleWithAuthor | undefined> {
    const article = this.articlesData.get(id);
    if (!article) return undefined;
    
    return this.attachArticleRelations([article])[0];
  }

  async getArticlesByAuthor(authorId: number): Promise<ArticleWithAuthor[]> {
    const articles = Array.from(this.articlesData.values())
      .filter(article => article.authorId === authorId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return this.attachArticleRelations(articles);
  }

  async getArticlesByTag(tagId: number): Promise<ArticleWithAuthor[]> {
    const articleIds = this.articleTagsData
      .filter(at => at.tagId === tagId)
      .map(at => at.articleId);

    const articles = Array.from(this.articlesData.values())
      .filter(article => articleIds.includes(article.id) && article.published)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return this.attachArticleRelations(articles);
  }

  async getTrendingArticles(limit = 4): Promise<ArticleWithAuthor[]> {
    // For now, just return the most recent articles
    // In a real app, this would consider metrics like views, comments, and bookmarks
    return this.getArticles(limit);
  }

  async createArticle(article: InsertArticle): Promise<Article> {
    const id = this.articleId++;
    const now = new Date();
    const newArticle: Article = { 
      ...article, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.articlesData.set(id, newArticle);
    return newArticle;
  }

  async updateArticle(id: number, article: Partial<InsertArticle>): Promise<Article | undefined> {
    const existingArticle = this.articlesData.get(id);
    if (!existingArticle) return undefined;
    
    const updatedArticle: Article = { 
      ...existingArticle, 
      ...article, 
      updatedAt: new Date() 
    };
    this.articlesData.set(id, updatedArticle);
    return updatedArticle;
  }

  async deleteArticle(id: number): Promise<boolean> {
    return this.articlesData.delete(id);
  }

  async searchArticles(query: string): Promise<ArticleWithAuthor[]> {
    const lowercaseQuery = query.toLowerCase();
    const articles = Array.from(this.articlesData.values())
      .filter(article => 
        article.published && (
          article.title.toLowerCase().includes(lowercaseQuery) || 
          article.content.toLowerCase().includes(lowercaseQuery) ||
          article.excerpt.toLowerCase().includes(lowercaseQuery)
        )
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return this.attachArticleRelations(articles);
  }

  // TAG OPERATIONS
  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tagsData.values());
  }

  async getTagById(id: number): Promise<Tag | undefined> {
    return this.tagsData.get(id);
  }

  async getTagByName(name: string): Promise<Tag | undefined> {
    return Array.from(this.tagsData.values()).find(
      tag => tag.name.toLowerCase() === name.toLowerCase()
    );
  }

  async createTag(tag: InsertTag): Promise<Tag> {
    const id = this.tagId++;
    const newTag: Tag = { ...tag, id };
    this.tagsData.set(id, newTag);
    return newTag;
  }

  async getArticleTags(articleId: number): Promise<Tag[]> {
    const tagIds = this.articleTagsData
      .filter(at => at.articleId === articleId)
      .map(at => at.tagId);

    return tagIds.map(id => this.tagsData.get(id)).filter(Boolean) as Tag[];
  }

  async addTagToArticle(articleTag: InsertArticleTag): Promise<ArticleTag> {
    // Check if already exists
    const exists = this.articleTagsData.some(
      at => at.articleId === articleTag.articleId && at.tagId === articleTag.tagId
    );
    
    if (!exists) {
      this.articleTagsData.push(articleTag);
    }
    
    return articleTag;
  }

  async removeTagFromArticle(articleId: number, tagId: number): Promise<boolean> {
    const initialLength = this.articleTagsData.length;
    this.articleTagsData = this.articleTagsData.filter(
      at => !(at.articleId === articleId && at.tagId === tagId)
    );
    return initialLength !== this.articleTagsData.length;
  }

  // COMMENT OPERATIONS
  async getArticleComments(articleId: number): Promise<CommentWithAuthor[]> {
    const comments = Array.from(this.commentsData.values())
      .filter(comment => comment.articleId === articleId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return this.buildCommentTree(comments);
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentId++;
    const newComment: Comment = { 
      ...comment, 
      id, 
      createdAt: new Date() 
    };
    this.commentsData.set(id, newComment);
    return newComment;
  }

  async deleteComment(id: number): Promise<boolean> {
    return this.commentsData.delete(id);
  }

  // BOOKMARK OPERATIONS
  async getUserBookmarks(userId: number): Promise<ArticleWithAuthor[]> {
    const articleIds = this.bookmarksData
      .filter(bookmark => bookmark.userId === userId)
      .map(bookmark => bookmark.articleId);

    const articles = Array.from(this.articlesData.values())
      .filter(article => articleIds.includes(article.id))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return this.attachArticleRelations(articles);
  }

  async addBookmark(bookmark: InsertBookmark): Promise<Bookmark> {
    // Check if it already exists
    const exists = this.bookmarksData.some(
      b => b.userId === bookmark.userId && b.articleId === bookmark.articleId
    );
    
    if (!exists) {
      const id = this.bookmarkId++;
      const newBookmark: Bookmark = { 
        ...bookmark, 
        id, 
        createdAt: new Date() 
      };
      this.bookmarksData.push(newBookmark);
      return newBookmark;
    }
    
    return this.bookmarksData.find(
      b => b.userId === bookmark.userId && b.articleId === bookmark.articleId
    )!;
  }

  async removeBookmark(userId: number, articleId: number): Promise<boolean> {
    const initialLength = this.bookmarksData.length;
    this.bookmarksData = this.bookmarksData.filter(
      b => !(b.userId === userId && b.articleId === articleId)
    );
    return initialLength !== this.bookmarksData.length;
  }

  async isBookmarked(userId: number, articleId: number): Promise<boolean> {
    return this.bookmarksData.some(
      b => b.userId === userId && b.articleId === articleId
    );
  }

  // FOLLOW OPERATIONS
  async followUser(follow: InsertFollow): Promise<Follow> {
    // Check if already following
    const exists = this.followsData.some(
      f => f.followerId === follow.followerId && f.followingId === follow.followingId
    );
    
    if (!exists) {
      const newFollow: Follow = { 
        ...follow, 
        createdAt: new Date() 
      };
      this.followsData.push(newFollow);
      return newFollow;
    }
    
    return this.followsData.find(
      f => f.followerId === follow.followerId && f.followingId === follow.followingId
    )!;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const initialLength = this.followsData.length;
    this.followsData = this.followsData.filter(
      f => !(f.followerId === followerId && f.followingId === followingId)
    );
    return initialLength !== this.followsData.length;
  }

  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = this.followsData
      .filter(follow => follow.followingId === userId)
      .map(follow => follow.followerId);

    return followerIds
      .map(id => this.usersData.get(id))
      .filter(Boolean) as User[];
  }

  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = this.followsData
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);

    return followingIds
      .map(id => this.usersData.get(id))
      .filter(Boolean) as User[];
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.followsData.some(
      f => f.followerId === followerId && f.followingId === followingId
    );
  }

  // HELPER METHODS
  private attachArticleRelations(articles: Article[]): ArticleWithAuthor[] {
    return articles.map(article => {
      const author = this.usersData.get(article.authorId);
      const tags = this.getArticleTags(article.id);
      
      return {
        ...article,
        author: author!,
        tags: []
      };
    });
  }

  private buildCommentTree(comments: Comment[]): CommentWithAuthor[] {
    // First, get all top-level comments (no parentId)
    const topLevelComments = comments.filter(comment => !comment.parentId);
    
    // Next, get all replies organized by parent comment ID
    const repliesByParentId = comments
      .filter(comment => comment.parentId)
      .reduce((acc, comment) => {
        if (!acc[comment.parentId!]) {
          acc[comment.parentId!] = [];
        }
        acc[comment.parentId!].push(comment);
        return acc;
      }, {} as Record<number, Comment[]>);
    
    // Now build the comment tree recursively
    const buildTree = (commentList: Comment[]): CommentWithAuthor[] => {
      return commentList.map(comment => {
        const author = this.usersData.get(comment.authorId)!;
        const replies = repliesByParentId[comment.id] 
          ? buildTree(repliesByParentId[comment.id]) 
          : undefined;
        
        return {
          ...comment,
          author,
          replies
        };
      });
    };
    
    return buildTree(topLevelComments);
  }
}

export const storage = new MemStorage();
