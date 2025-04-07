import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "@shared/schema";
import ArticleList from "@/components/articles/article-list";

export default function TopicsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch tags
  const { data: tags, isLoading: isLoadingTags, error: tagsError } = useQuery<Tag[]>({
    queryKey: ["/api/tags"],
  });

  // Set page title
  useEffect(() => {
    document.title = `Topics | Logus`;
  }, []);

  const handleTagSelect = (tagId: number) => {
    setSelectedTag(tagId);
    setActiveTab("tag");
  };

  if (tagsError) {
    toast({
      title: "Error loading topics",
      description: "Could not load topics. Please try again later.",
      variant: "destructive",
    });
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Explore Topics</h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Topics</TabsTrigger>
            <TabsTrigger value="tag" disabled={!selectedTag}>
              {selectedTag && tags?.find(t => t.id === selectedTag)?.name || "Selected Topic"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
              {isLoadingTags ? (
                // Loading skeletons for tags
                Array(9).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-lg" />
                ))
              ) : tags && tags.length > 0 ? (
                tags.map(tag => (
                  <Card 
                    key={tag.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleTagSelect(tag.id)}
                  >
                    <CardContent className="p-6">
                      <div 
                        className="mb-3 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: tag.color || '#3b82f6' }}
                      >
                        <span className="text-white text-sm font-bold">
                          {tag.name.charAt(0)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold mb-1">{tag.name}</h3>
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/explore?tag=${tag.id}`);
                        }}
                      >
                        View articles
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-10">
                  <p className="text-gray-500">No topics available at the moment.</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tag">
            {selectedTag && (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold">
                    Articles in {tags?.find(t => t.id === selectedTag)?.name}
                  </h2>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab("all")}
                  >
                    Back to all topics
                  </Button>
                </div>
                
                <ArticleList 
                  queryKey={[`/api/tags/${selectedTag}/articles`, selectedTag]}
                  emptyMessage="No articles found for this topic."
                  showLoadMore
                />
              </>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Suggested Topics */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Explore more</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/explore">
              <Button variant="outline" size="sm">
                Discover writers
              </Button>
            </Link>
            <Link href="/bookmarks">
              <Button variant="outline" size="sm">
                Saved articles
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}