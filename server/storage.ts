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

    // Create all tags
    const tags: Tag[] = [];
    tagNames.forEach(tag => {
      tags.push(this.createTag({ name: tag.name, color: tag.color }));
    });

    // Create superadmin user
    const superAdmin = this.createUser({
      username: "superadmin",
      password: "admin123",
      email: "superadmin@example.com",
      name: "Super Administrator",
      role: "superadmin",
      bio: "Platform Administrator with full access rights.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80"
    });
    
    // Create admin user
    const admin = this.createUser({
      username: "admin",
      password: "admin123",
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
      bio: "Content Administrator with moderation rights.",
      avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80"
    });
    
    // Create blogger user
    const blogger = this.createUser({
      username: "blogger",
      password: "blog123",
      email: "blogger@example.com",
      name: "Featured Blogger",
      role: "blogger",
      bio: "Professional writer with expanded platform privileges.",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80"
    });
    
    // Create regular user
    const regularUser = this.createUser({
      username: "user",
      password: "user123",
      email: "user@example.com",
      name: "Regular User",
      role: "user",
      bio: "Standard platform user with basic permissions.",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80"
    });
    
    // Create demo user
    const demoUser = this.createUser({
      username: "demo",
      password: "password",
      email: "demo@example.com",
      name: "Demo User",
      role: "user",
      bio: "This is a demo user for testing purposes.",
      avatar: "https://images.unsplash.com/photo-1542740348-39501cd6e2b4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=150&q=80"
    });
    
    // Create articles
    const article1 = this.createArticle({
      title: "The Future of AI in Everyday Life",
      content: "<h2>Introduction</h2><p>Artificial Intelligence has come a long way in recent years. From simple algorithms to complex neural networks, AI is transforming how we interact with technology.</p><h2>Current Applications</h2><p>Today, AI is already integrated into many aspects of our lives, from voice assistants to recommendation systems. These technologies are making our lives easier and more connected.</p><h2>Future Possibilities</h2><p>The future of AI holds even more promise. Autonomous vehicles, personalized medicine, and smart cities are just a few areas where AI will revolutionize our world.</p><h2>Ethical Considerations</h2><p>As AI becomes more advanced, we must consider the ethical implications. Privacy concerns, job displacement, and algorithm bias are challenges that need addressing.</p><h2>Conclusion</h2><p>AI has the potential to greatly improve our lives, but it requires thoughtful implementation and oversight. By focusing on human-centered AI, we can ensure that technology serves humanity's best interests.</p>",
      excerpt: "Explore how artificial intelligence is reshaping our daily experiences and what the future might hold.",
      authorId: blogger.id,
      published: true,
      readingTime: 8,
      featuredImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    });
    
    const article2 = this.createArticle({
      title: "Healthy Habits for Remote Workers",
      content: "<h2>Introduction</h2><p>Remote work has become increasingly common, offering flexibility but also presenting unique health challenges.</p><h2>Physical Health</h2><p>Maintaining physical health while working from home requires intentional effort. Regular exercise, ergonomic workspaces, and scheduled breaks can help prevent the negative effects of a sedentary lifestyle.</p><h2>Mental Well-being</h2><p>The isolation of remote work can impact mental health. Establishing boundaries between work and personal life, staying connected with colleagues, and practicing mindfulness are essential strategies.</p><h2>Nutrition Tips</h2><p>With constant access to the kitchen, healthy eating can be challenging. Meal planning, keeping nutritious snacks on hand, and maintaining regular meal times can support better nutrition.</p><h2>Conclusion</h2><p>By implementing these healthy habits, remote workers can thrive both professionally and personally. The key is finding sustainable practices that work for your individual circumstances.</p>",
      excerpt: "Discover practical strategies to maintain physical and mental health while working remotely.",
      authorId: admin.id,
      published: true,
      readingTime: 6,
      featuredImage: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    });
    
    const article3 = this.createArticle({
      title: "Essential Travel Tips for Budget Explorers",
      content: "<h2>Introduction</h2><p>Traveling on a budget doesn't mean sacrificing experiences. With careful planning and insider knowledge, you can see the world without breaking the bank.</p><h2>Planning Your Trip</h2><p>The key to budget travel is advance planning. Researching destinations, tracking flight prices, and booking accommodations early can lead to significant savings.</p><h2>Accommodations</h2><p>Beyond traditional hotels, consider hostels, home-sharing platforms, or even house-sitting. These alternatives often provide unique experiences at lower costs.</p><h2>Transportation</h2><p>Public transportation, walking, or cycling are not only economical but also offer authentic ways to experience a destination. For longer distances, look into travel passes or budget airlines.</p><h2>Food and Dining</h2><p>Eating like a local is both culturally enriching and cost-effective. Visit markets, street food vendors, and restaurants away from tourist areas for the best value.</p><h2>Conclusion</h2><p>Budget travel is about prioritizing experiences over luxuries. With these tips, you can create meaningful travel memories without financial strain.</p>",
      excerpt: "Learn how to explore the world on a limited budget without compromising on experiences.",
      authorId: superAdmin.id,
      published: true,
      readingTime: 7,
      featuredImage: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1200&q=80"
    });
    
    // Add tags to articles
    this.addTagToArticle({ articleId: article1.id, tagId: tags[0].id }); // Technology
    this.addTagToArticle({ articleId: article2.id, tagId: tags[6].id }); // Remote Work
    this.addTagToArticle({ articleId: article3.id, tagId: tags[2].id }); // Writing
    
    console.log("Demo data initialized with users:");
    console.log("- SuperAdmin:", superAdmin.username, "(Password: admin123)");
    console.log("- Admin:", admin.username, "(Password: admin123)");
    console.log("- Blogger:", blogger.username, "(Password: blog123)");
    console.log("- Regular User:", regularUser.username, "(Password: user123)");
    console.log("- Demo User:", demoUser.username, "(Password: password)");
    console.log("Sample articles created with IDs:", article1.id, article2.id, article3.id);
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
      
      // Get tags synchronously to avoid Promise issues
      const tagIds = this.articleTagsData
        .filter(at => at.articleId === article.id)
        .map(at => at.tagId);
      
      const tags = tagIds
        .map(id => this.tagsData.get(id))
        .filter(Boolean) as Tag[];
      
      return {
        ...article,
        author: author!,
        tags: tags
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
