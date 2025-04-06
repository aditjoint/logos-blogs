import { useQuery } from "@tanstack/react-query";
import ArticleCard from "./article-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleWithAuthor } from "@shared/schema";

interface TrendingArticlesProps {
  limit?: number;
}

export default function TrendingArticles({ limit = 4 }: TrendingArticlesProps) {
  const { data: articles, isLoading, error } = useQuery<ArticleWithAuthor[]>({
    queryKey: [`/api/articles/trending?limit=${limit}`],
  });

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-red-800 dark:text-red-300">Error loading trending articles</h3>
        <p className="text-sm text-red-700 dark:text-red-400">
          {error instanceof Error ? error.message : "Something went wrong. Please try again."}
        </p>
      </div>
    );
  }

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Trending Articles
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          // Loading skeleton
          Array(limit).fill(0).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
              <Skeleton className="w-full h-48" />
              <div className="p-5 space-y-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <div className="flex justify-between">
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))
        ) : articles && articles.length > 0 ? (
          articles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="compact" />
          ))
        ) : (
          <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No trending articles available at the moment.</p>
          </div>
        )}
      </div>
    </section>
  );
}
