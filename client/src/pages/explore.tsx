import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import ArticleList from "@/components/articles/article-list";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { Tag, User } from "@shared/schema";

export default function Explore() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [searchInputValue, setSearchInputValue] = useState("");
  const [activeTab, setActiveTab] = useState("articles");

  // Parse URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.get("q");
    const tagId = searchParams.get("tag");
    const filter = searchParams.get("filter");
    
    if (query) {
      setSearchQuery(query);
      setSearchInputValue(query);
    }
    
    if (tagId) {
      setSelectedTag(parseInt(tagId));
    }
    
    if (filter === "writers") {
      setActiveTab("writers");
    }
  }, [location]);

  // Fetch tags
  const { data: tags } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });

  // Set page title
  useEffect(() => {
    document.title = searchQuery 
      ? `Search: ${searchQuery} | Logos Blogs` 
      : selectedTag && tags?.find(t => t.id === selectedTag)
        ? `${tags.find(t => t.id === selectedTag)?.name} Articles | Logos Blogs`
        : "Explore | Logos Blogs";
  }, [searchQuery, selectedTag, tags]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputValue.trim()) {
      setSearchQuery(searchInputValue.trim());
      setSelectedTag(null);
      setLocation(`/explore?q=${encodeURIComponent(searchInputValue.trim())}`);
    }
  };

  const handleTagSelect = (tagId: number) => {
    setSelectedTag(tagId);
    setSearchQuery("");
    setSearchInputValue("");
    setLocation(`/explore?tag=${tagId}`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSearchInputValue("");
    setSelectedTag(null);
    setLocation("/explore");
  };

  const selectedTagName = selectedTag && tags 
    ? tags.find(tag => tag.id === selectedTag)?.name 
    : null;

  return (
    <AuthProvider>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Explore</h1>
          
          <div className="mb-8">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="pl-10 pr-4 py-6 text-lg"
                  value={searchInputValue}
                  onChange={(e) => setSearchInputValue(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  Search
                </Button>
              </div>
            </form>

            {/* Active filters */}
            {(searchQuery || selectedTag) && (
              <div className="flex items-center mb-6">
                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="mr-2 flex items-center gap-1">
                    <span>Search: {searchQuery}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={clearFilters}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {selectedTagName && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <span>Tag: {selectedTagName}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={clearFilters}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}

            {/* Popular tags */}
            {!searchQuery && !selectedTag && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">Popular Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {tags?.map((tag) => (
                    <Button
                      key={tag.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleTagSelect(tag.id)}
                      className="rounded-full"
                    >
                      {tag.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="articles">Articles</TabsTrigger>
              <TabsTrigger value="writers">Writers</TabsTrigger>
            </TabsList>

            <TabsContent value="articles">
              {searchQuery ? (
                <ArticleList
                  queryKey={[`/api/articles/search?q=${searchQuery}`]}
                  emptyMessage={`No articles found matching "${searchQuery}"`}
                />
              ) : selectedTag ? (
                <ArticleList
                  queryKey={[`/api/tags/${selectedTag}/articles`]}
                  emptyMessage={`No articles found with tag "${selectedTagName}"`}
                />
              ) : (
                <ArticleList
                  queryKey="/api/articles"
                  emptyMessage="No articles found"
                />
              )}
            </TabsContent>

            <TabsContent value="writers">
              <WritersList />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthProvider>
  );
}

function WritersList() {
  const { data: writers, isLoading } = useQuery<Partial<User>[]>({
    queryKey: ['/api/users/featured'],
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {isLoading ? (
        Array(6).fill(0).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700"></div>
              <div className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="mt-3 h-12 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))
      ) : writers && writers.length > 0 ? (
        writers.map((writer) => (
          <div key={writer.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                {writer.avatar ? (
                  <img 
                    src={writer.avatar} 
                    alt={writer.name} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-medium text-primary-800 dark:text-primary-200">
                    {writer.name?.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-medium">{writer.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{writer.username}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
              {writer.bio || "No bio available"}
            </p>
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >
                <a href={`/profile/${writer.id}`}>View Profile</a>
              </Button>
            </div>
          </div>
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No writers found</p>
        </div>
      )}
    </div>
  );
}
