import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatDate, truncateText } from "@/lib/utils";

// Create a minimal type that only requires the properties we absolutely need
interface ArticleProps {
  id: number;
  title: string;
  excerpt?: string;
  featuredImage?: string;
  readingTime?: number;
  createdAt?: string | Date;
  tags?: Array<{id: number; name: string}>;
  author?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

interface ArticleCardProps {
  article: ArticleProps;
  variant?: "compact" | "full";
}

export default function ArticleCard({ article, variant = "compact" }: ArticleCardProps) {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Check if article is bookmarked only if authenticated and article has an id
  useEffect(() => {
    if (!article?.id || !isAuthenticated) return;
    
    fetch(`/api/bookmarks/${article.id}`, { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.bookmarked === 'boolean') {
          setIsBookmarked(data.bookmarked);
        }
      })
      .catch(() => {}); // Silently fail
  }, [isAuthenticated, article?.id]);
  
  // Toggle bookmark mutation
  const toggleBookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!article?.id) return false;
      
      if (isBookmarked) {
        await apiRequest("DELETE", `/api/bookmarks/${article.id}`);
      } else {
        await apiRequest("POST", "/api/bookmarks", { articleId: article.id });
      }
      return !isBookmarked;
    },
    onSuccess: (newBookmarkState) => {
      setIsBookmarked(newBookmarkState);
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      if (article?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/bookmarks/${article.id}`] });
      }
      
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
  
  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
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

  // Author profile section
  const renderAuthorSection = () => {
    if (!article.author) {
      return <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 mr-2" />;
    }
    
    return (
      <>
        <Link href={`/profile/${article.author.id}`}>
          <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
            {article.author.avatar ? (
              <img 
                src={article.author.avatar} 
                alt={article.author.name || 'Author'} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs">
                {article.author.name ? article.author.name.charAt(0) : 'A'}
              </div>
            )}
          </div>
        </Link>
        <Link href={`/profile/${article.author.id}`} className="text-sm text-gray-600 dark:text-gray-400">
          {article.author.name || 'Anonymous'}
        </Link>
        <span className="mx-2 text-gray-400">·</span>
      </>
    );
  };

  // Tags section
  const renderTags = (maxTags: number) => {
    if (!article.tags || article.tags.length === 0) {
      return null;
    }
    
    return (
      <div className="flex space-x-2">
        {article.tags.slice(0, maxTags).map((tag) => (
          <Link 
            key={tag.id} 
            href={`/explore?tag=${tag.id}`}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
          >
            {tag.name}
          </Link>
        ))}
      </div>
    );
  };

  if (variant === "compact") {
    return (
      <Card className="article-card bg-white dark:bg-gray-800 overflow-hidden shadow-md hover:shadow-lg">
        {article.featuredImage && (
          <div className="w-full h-48 overflow-hidden">
            <img 
              src={article.featuredImage} 
              alt={article.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <CardContent className="p-5">
          <div className="flex items-center mb-3">
            {renderAuthorSection()}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {article.readingTime || 0} min read
            </span>
          </div>
          <Link href={`/article/${article.id}`}>
            <h3 className="text-xl font-bold mb-2 line-clamp-2 hover:text-primary-600 transition-colors">
              {article.title}
            </h3>
          </Link>
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 font-serif">
            {article.excerpt || ''}
          </p>
          <div className="flex items-center justify-between">
            {renderTags(2)}
            <div className="flex text-gray-500 dark:text-gray-400">
              <Button
                variant="ghost"
                size="icon"
                className="p-1 hover:text-primary-500"
                onClick={handleBookmarkToggle}
              >
                <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Full variant (horizontal layout)
  return (
    <article className="article-card bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg flex flex-col md:flex-row">
      {article.featuredImage && (
        <div className="md:w-1/3">
          <img 
            src={article.featuredImage} 
            alt={article.title} 
            className="w-full h-48 md:h-full object-cover"
          />
        </div>
      )}
      <div className={`p-5 ${article.featuredImage ? 'md:w-2/3' : 'w-full'}`}>
        <div className="flex items-center mb-3">
          {renderAuthorSection()}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {article.readingTime || 0} min read
          </span>
          {article.createdAt && (
            <>
              <span className="mx-2 text-gray-400">·</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(article.createdAt)}
              </span>
            </>
          )}
        </div>
        <Link href={`/article/${article.id}`}>
          <h3 className="text-xl font-bold mb-2 hover:text-primary-600 transition-colors">
            {article.title}
          </h3>
        </Link>
        <p className="text-gray-600 dark:text-gray-300 mb-4 font-serif">
          {article.excerpt ? truncateText(article.excerpt, 200) : ''}
        </p>
        <div className="flex items-center justify-between">
          {renderTags(3)}
          <div className="flex text-gray-500 dark:text-gray-400">
            <Button
              variant="ghost"
              size="icon"
              className="p-1 hover:text-primary-500"
              onClick={handleBookmarkToggle}
            >
              <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}