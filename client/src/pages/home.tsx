import { useEffect } from "react";
import TrendingArticles from "@/components/articles/trending-articles";
import ArticleList from "@/components/articles/article-list";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  // Set page title
  useEffect(() => {
    document.title = "Logus - Where good ideas find you";
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-6">
              Where good ideas find you
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8">
              Read and share ideas from independent voices, world-class publications, and experts from around the globe. Anyone can publish on Logus.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/editor">
                <Button size="lg" className="w-full sm:w-auto">
                  Start writing
                </Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Explore articles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="lg:w-2/3">
            <TrendingArticles />
            <ArticleList 
              queryKey="/api/articles" 
              title="Latest Articles" 
              emptyMessage="No articles published yet. Be the first to share your ideas!"
            />
          </div>

          {/* Sidebar Column */}
          <div className="lg:w-1/3">
            <Sidebar />
          </div>
        </div>
      </div>
    </>
  );
}
