import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ArticleCard from "./article-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleWithAuthor } from "@shared/schema";

interface ArticleListProps {
  queryKey: string | [string, string | number];
  title?: string;
  emptyMessage?: string;
  limit?: number;
  showLoadMore?: boolean;
}

export default function ArticleList({ 
  queryKey, 
  title, 
  emptyMessage = "No articles found",
  limit = 10,
  showLoadMore = true
}: ArticleListProps) {
  const [page, setPage] = useState(1);
  const offset = (page - 1) * limit;
  
  // Handle different query key formats
  const actualQueryKey = Array.isArray(queryKey) 
    ? [...queryKey, { limit, offset }]
    : [queryKey, { limit, offset }];
  
  const { data, isLoading, isFetching } = useQuery<ArticleWithAuthor[]>({
    queryKey: actualQueryKey,
  });

  const articles = data || [];
  const hasMore = articles.length === limit;

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  return (
    <section className="space-y-8">
      {title && (
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {title}
        </h2>
      )}
      
      {isLoading ? (
        // Loading skeleton
        <div className="space-y-8">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
              <div className="md:w-1/3">
                <Skeleton className="h-48 md:h-full w-full" />
              </div>
              <div className="p-5 md:w-2/3 space-y-4">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
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
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <>
          <div className="space-y-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="full" />
            ))}
          </div>
          
          {showLoadMore && hasMore && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={loadMore}
                disabled={isFetching}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isFetching ? "Loading..." : "Load more articles"}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
