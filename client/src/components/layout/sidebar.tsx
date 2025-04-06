import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Tag, User } from "@shared/schema";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch popular tags
  const { data: tags, isLoading: isTagsLoading } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });
  
  // Fetch featured writers
  const { data: featuredWriters, isLoading: isWritersLoading } = useQuery<Partial<User>[]>({
    queryKey: ['/api/users/featured'],
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/explore?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Search Box */}
      <Card>
        <CardContent className="pt-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Input 
                type="text" 
                placeholder="Search articles..." 
                className="pl-10 pr-4 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Popular Topics */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-lg font-bold mb-4">Popular Topics</h3>
          <div className="flex flex-wrap gap-2">
            {isTagsLoading ? (
              // Skeleton loading state
              Array(6).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className="h-8 w-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"
                />
              ))
            ) : (
              tags?.map((tag) => (
                <Link 
                  key={tag.id} 
                  href={`/explore?tag=${tag.id}`}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-gray-700 dark:text-primary-300 dark:hover:bg-gray-600"
                >
                  {tag.name}
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Featured Writers */}
      <Card>
        <CardContent className="pt-4">
          <h3 className="text-lg font-bold mb-4">Featured Writers</h3>
          <div className="space-y-4">
            {isWritersLoading ? (
              // Skeleton loading state
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="ml-3 space-y-1">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                    <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  </div>
                </div>
              ))
            ) : (
              featuredWriters?.map((writer) => (
                <div key={writer.id} className="flex items-center">
                  <Link href={`/profile/${writer.id}`}>
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      {writer.avatar ? (
                        <img 
                          src={writer.avatar} 
                          alt={writer.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200">
                          {writer.name?.charAt(0)}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="ml-3">
                    <Link href={`/profile/${writer.id}`} className="text-sm font-medium">
                      {writer.name}
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {writer.bio ? writer.bio.substring(0, 30) + (writer.bio.length > 30 ? '...' : '') : ''}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
                  >
                    Follow
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="mt-4 text-center">
            <Link 
              href="/explore?filter=writers" 
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              View all writers
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Newsletter Signup */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg shadow-md p-6 text-white">
        <h3 className="text-lg font-bold mb-2">Join Our Newsletter</h3>
        <p className="text-sm mb-4">Get the best articles delivered straight to your inbox, weekly.</p>
        <form>
          <div className="mb-3">
            <Input
              type="email"
              placeholder="Your email address"
              className="w-full px-4 py-2 rounded-md text-gray-900 bg-white focus:ring-primary-300 focus:border-primary-300"
            />
          </div>
          <Button className="w-full bg-white text-primary-600 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-300">
            Subscribe
          </Button>
        </form>
      </div>
    </div>
  );
}
