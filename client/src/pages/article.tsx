import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TipTapEditor } from "@/components/ui/editor";
import CommentSection from "@/components/articles/comment-section";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookmarkIcon, Calendar, Clock, Edit, Share2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

// Define a minimal article type that only requires what we use
interface SafeArticle {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  readingTime?: number;
  createdAt?: string | Date;
  authorId?: number;
  tags?: Array<{id: number; name: string}>;
  author?: {
    id: number;
    name: string;
    avatar?: string;
    bio?: string;
  };
}

export default function ArticlePage() {
  const [, params] = useRoute("/article/:id");
  const articleId = params?.id ? parseInt(params.id) : 0;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch article data
  const { data: article, isLoading, error } = useQuery<SafeArticle>({
    queryKey: [`/api/articles/${articleId}`],
    enabled: !!articleId,
  });

  // Effect to check bookmark status
  useEffect(() => {
    if (!isAuthenticated || !articleId) return;
    
    fetch(`/api/bookmarks/${articleId}`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.bookmarked === 'boolean') {
          setIsBookmarked(data.bookmarked);
        }
      })
      .catch(() => {}); // Silently fail
  }, [isAuthenticated, articleId]);

  // Effect to check following status
  useEffect(() => {
    if (!isAuthenticated || !article?.authorId) return;
    
    fetch(`/api/users/${article.authorId}/following`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.following === 'boolean') {
          setIsFollowing(data.following);
        }
      })
      .catch(() => {}); // Silently fail
  }, [isAuthenticated, article?.authorId]);

  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${articleId}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { articleId });
      }
      return !isBookmarked;
    },
    onSuccess: (newBookmarkState) => {
      setIsBookmarked(newBookmarkState);
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      queryClient.invalidateQueries({ queryKey: [`/api/bookmarks/${articleId}`] });
      
      toast({
        title: newBookmarkState ? "Article bookmarked" : "Bookmark removed",
        description: newBookmarkState 
          ? "This article has been added to your bookmarks" 
          : "This article has been removed from your bookmarks",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    },
  });

  // Toggle follow mutation
  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (!article?.authorId) return false;
      
      if (isFollowing) {
        await apiRequest("DELETE", `/api/users/${article.authorId}/follow`);
      } else {
        await apiRequest("POST", `/api/users/${article.authorId}/follow`, {
          followerId: user?.id,
          followingId: article.authorId
        });
      }
      return !isFollowing;
    },
    onSuccess: (newFollowState) => {
      setIsFollowing(newFollowState);
      if (article?.authorId) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${article.authorId}/following`] });
      }
      
      toast({
        title: newFollowState ? "Author followed" : "Author unfollowed",
        description: newFollowState 
          ? `You are now following ${article?.author?.name || 'this author'}` 
          : `You have unfollowed ${article?.author?.name || 'this author'}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const handleBookmarkToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to bookmark articles",
        variant: "destructive",
      });
      return;
    }
    
    toggleBookmarkMutation.mutate();
  };

  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to follow authors",
        variant: "destructive",
      });
      return;
    }
    
    if (user?.id === article?.authorId) {
      toast({
        title: "Cannot follow yourself",
        description: "You cannot follow your own profile",
        variant: "destructive",
      });
      return;
    }
    
    toggleFollowMutation.mutate();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.excerpt,
          url: window.location.href,
        });
        toast({
          title: "Shared successfully",
          description: "Article has been shared",
        });
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          toast({
            title: "Share failed",
            description: "Could not share the article",
            variant: "destructive",
          });
        }
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Article link copied to clipboard",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Could not copy the article link",
          variant: "destructive",
        });
      }
    }
  };

  // Set page title
  useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} | Logus`;
    }
  }, [article?.title]);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-300">Error loading article</h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                {error instanceof Error ? error.message : "Something went wrong. Please try again."}
              </p>
              <div className="mt-4">
                <Link href="/">
                  <Button variant="outline">Go back to home</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div>
                <Skeleton className="h-4 w-36 mb-2" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : article ? (
          <>
            {/* Featured Image */}
            {article.featuredImage && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {/* Article Header */}
            <header className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-6">{article.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                {article.author && (
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage src={article.author.avatar || undefined} alt={article.author.name} />
                      <AvatarFallback>
                        {article.author.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      {article.authorId && (
                        <Link href={`/profile/${article.authorId}`} className="font-medium hover:text-primary-600 transition-colors">
                          {article.author.name}
                        </Link>
                      )}
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <Button 
                          variant={isFollowing ? "default" : "outline"} 
                          size="sm" 
                          className="h-7 text-xs"
                          onClick={handleFollowToggle}
                          disabled={toggleFollowMutation.isPending || user?.id === article.authorId}
                        >
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center ml-auto space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  {article.createdAt && (
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(article.createdAt)}</span>
                    </div>
                  )}
                  {article.readingTime && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{article.readingTime} min read</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.tags.map(tag => (
                    <Link 
                      key={tag.id} 
                      href={`/explore?tag=${tag.id}`}
                      className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleBookmarkToggle}
                >
                  <BookmarkIcon className={`h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
                  <span>{isBookmarked ? "Saved" : "Save"}</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </Button>
                
                {isAuthenticated && user?.id === article.authorId && (
                  <Link href={`/editor/${article.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Article</span>
                    </Button>
                  </Link>
                )}
              </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none mb-10">
              <TipTapEditor 
                content={article.content} 
                onChange={() => {}} 
                editable={false}
              />
            </div>

            {/* Author bio */}
            {article.author && (
              <div className="border-t border-b border-gray-200 dark:border-gray-700 py-6 mb-8">
                <div className="flex items-start sm:items-center flex-col sm:flex-row gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={article.author.avatar || undefined} alt={article.author.name} />
                    <AvatarFallback>
                      {article.author.name?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">Written by {article.author.name}</h3>
                    {article.author.bio && (
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        {article.author.bio}
                      </p>
                    )}
                    {user?.id !== article.authorId && (
                      <Button 
                        className="mt-3" 
                        variant={isFollowing ? "default" : "outline"}
                        onClick={handleFollowToggle}
                        disabled={toggleFollowMutation.isPending}
                      >
                        {isFollowing ? "Following" : "Follow Author"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Comments Section */}
            <CommentSection articleId={article.id} />
          </>
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold mb-4">Article not found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The article you're looking for doesn't exist or has been removed.</p>
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}