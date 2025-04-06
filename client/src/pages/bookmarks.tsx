import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import ArticleList from "@/components/articles/article-list";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { BookmarkIcon } from "lucide-react";
import { ArticleWithAuthor } from "@shared/schema";

export default function BookmarksPage() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Fetch bookmarks
  const { data: bookmarkedArticles, isLoading, error } = useQuery<ArticleWithAuthor[]>({
    queryKey: ['/api/bookmarks'],
    enabled: isAuthenticated,
  });

  // Set page title
  useEffect(() => {
    document.title = "Your Bookmarks | Logus";
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isAuthLoading) {
      setLocation("/");
    }
  }, [isAuthenticated, isAuthLoading, setLocation]);

  if (!isAuthenticated) {
    return (
      <AuthProvider>
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="mb-6">Please log in to view your bookmarks.</p>
            <Button onClick={() => setLocation("/")}>Return to Home</Button>
          </div>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="lg:w-2/3">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 flex items-center">
                <BookmarkIcon className="mr-2 h-7 w-7" />
                Your Bookmarks
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Articles you've saved for later
              </p>
            </div>

            {isLoading ? (
              <p className="text-center py-10">Loading your bookmarks...</p>
            ) : error ? (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <h3 className="font-medium text-red-800 dark:text-red-300">Error loading bookmarks</h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error instanceof Error ? error.message : "Something went wrong. Please try again."}
                </p>
              </div>
            ) : bookmarkedArticles && bookmarkedArticles.length > 0 ? (
              <div className="space-y-8">
                {bookmarkedArticles.map((article) => (
                  <article key={article.id} className="article-card bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg flex flex-col md:flex-row">
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
                        <a href={`/profile/${article.author.id}`} className="flex-shrink-0">
                          <div className="w-6 h-6 rounded-full overflow-hidden mr-2">
                            {article.author.avatar ? (
                              <img 
                                src={article.author.avatar} 
                                alt={article.author.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 text-xs">
                                {article.author.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                        </a>
                        <a href={`/profile/${article.author.id}`} className="text-sm text-gray-600 dark:text-gray-400">
                          {article.author.name}
                        </a>
                        <span className="mx-2 text-gray-400">·</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{article.readingTime} min read</span>
                      </div>
                      <a href={`/article/${article.id}`}>
                        <h3 className="text-xl font-bold mb-2 hover:text-primary-600 transition-colors">
                          {article.title}
                        </h3>
                      </a>
                      <p className="text-gray-600 dark:text-gray-300 mb-4 font-serif">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {article.tags?.slice(0, 3).map((tag) => (
                            <a 
                              key={tag.id} 
                              href={`/explore?tag=${tag.id}`}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
                            >
                              {tag.name}
                            </a>
                          ))}
                        </div>
                        <div className="flex text-gray-500 dark:text-gray-400">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="p-1 hover:text-primary-500"
                            onClick={() => {
                              // We could add a remove bookmark button here
                            }}
                          >
                            <BookmarkIcon className="h-5 w-5 fill-current" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
                <BookmarkIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h2 className="text-xl font-bold mb-2">No bookmarks yet</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Start saving interesting articles to read later
                </p>
                <Button onClick={() => setLocation("/explore")}>
                  Explore Articles
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className="lg:w-1/3">
            <Sidebar />
          </div>
        </div>
      </div>
    </AuthProvider>
  );
}
