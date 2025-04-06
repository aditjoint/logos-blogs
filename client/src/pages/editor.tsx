import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { TipTapEditor } from "@/components/ui/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Save, Image as ImageIcon, Tags } from "lucide-react";
import { createExcerpt, calculateReadingTime } from "@/lib/utils";
import { ArticleWithAuthor, Tag } from "@shared/schema";

export default function EditorPage() {
  const [, setLocation] = useLocation();
  const [isEditMode] = useRoute("/editor/:id");
  const [, params] = useRoute("/editor/:id");
  const articleId = params?.id ? parseInt(params.id) : null;
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState({ html: "", text: "" });
  const [featuredImage, setFeaturedImage] = useState("");
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch article data if in edit mode
  const { data: article, isLoading: isArticleLoading } = useQuery<ArticleWithAuthor>({
    queryKey: articleId ? [`/api/articles/${articleId}`] : null,
    enabled: !!articleId,
    onSuccess: (data) => {
      setTitle(data.title);
      setContent({ html: data.content, text: "" });
      setFeaturedImage(data.featuredImage || "");
      setSelectedTags(data.tags?.map(tag => tag.id) || []);
    },
  });

  // Fetch tags
  const { data: tags, isLoading: isTagsLoading } = useQuery<Tag[]>({
    queryKey: ['/api/tags'],
  });

  // Create/update article mutation
  const articleMutation = useMutation({
    mutationFn: async (data: { 
      title: string; 
      content: string; 
      excerpt: string;
      featuredImage?: string;
      readingTime: number;
      published: boolean;
    }) => {
      if (articleId) {
        // Update existing article
        const res = await apiRequest("PUT", `/api/articles/${articleId}`, data);
        return res.json();
      } else {
        // Create new article
        const res = await apiRequest("POST", "/api/articles", data);
        return res.json();
      }
    },
    onSuccess: async (data) => {
      // Handle tag associations
      if (selectedTags.length > 0) {
        const currentArticleId = articleId || data.id;
        
        // Add tags to the article
        for (const tagId of selectedTags) {
          try {
            await apiRequest("POST", `/api/articles/${currentArticleId}/tags`, { tagId });
          } catch (error) {
            console.error("Error adding tag:", error);
          }
        }
      }
      
      toast({
        title: articleId ? "Article updated" : "Article created",
        description: "Your article has been saved successfully.",
      });
      
      // Invalidate queries and redirect to article page
      queryClient.invalidateQueries({ queryKey: ['/api/articles'] });
      setLocation(`/article/${articleId || data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save article",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const handleSubmit = (shouldPublish = false) => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your article",
        variant: "destructive",
      });
      return;
    }

    if (!content.html.trim()) {
      toast({
        title: "Content required",
        description: "Please write some content for your article",
        variant: "destructive",
      });
      return;
    }

    const articleData = {
      title: title.trim(),
      content: content.html,
      excerpt: createExcerpt(content.html, 150),
      featuredImage: featuredImage || undefined,
      readingTime: calculateReadingTime(content.text || content.html),
      published: shouldPublish,
    };

    articleMutation.mutate(articleData);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !isArticleLoading) {
      toast({
        title: "Authentication required",
        description: "Please log in to access the editor",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [isAuthenticated, isArticleLoading, setLocation, toast]);

  // Set page title
  useEffect(() => {
    document.title = articleId ? "Edit Article | Logus" : "Write New Article | Logus";
  }, [articleId]);

  // Check if user can edit this article
  useEffect(() => {
    if (article && user && article.authorId !== user.id) {
      toast({
        title: "Access denied",
        description: "You can only edit your own articles",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [article, user, setLocation, toast]);

  if (!isAuthenticated) {
    return (
      <AuthProvider>
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="mb-6">Please log in to access the editor.</p>
            <Button onClick={() => setLocation("/")}>Return to Home</Button>
          </div>
        </div>
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-2xl font-bold">
              {articleId ? "Edit Article" : "Write New Article"}
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSubmit(false)}
                disabled={articleMutation.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Dialog open={isPublishing} onOpenChange={setIsPublishing}>
                <DialogTrigger asChild>
                  <Button size="sm">Publish</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Publish Article</DialogTitle>
                    <DialogDescription>
                      Your article will be visible to all Logus users.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-3">
                    <div className="space-y-2">
                      <Label>Featured Image URL (optional)</Label>
                      <Input
                        value={featuredImage}
                        onChange={(e) => setFeaturedImage(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      {isTagsLoading ? (
                        <Skeleton className="h-10 w-full" />
                      ) : tags && tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Button
                              key={tag.id}
                              variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                if (selectedTags.includes(tag.id)) {
                                  setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                                } else {
                                  setSelectedTags([...selectedTags, tag.id]);
                                }
                              }}
                            >
                              {tag.name}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No tags available</p>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsPublishing(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        handleSubmit(true);
                        setIsPublishing(false);
                      }}
                      disabled={articleMutation.isPending}
                    >
                      {articleMutation.isPending ? "Publishing..." : "Publish Article"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isArticleLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <Label 
                  htmlFor="title"
                  className="text-lg font-semibold mb-2 block"
                >
                  Title
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your article title"
                  className="text-xl"
                />
              </div>

              <TipTapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your article here..."
                className="min-h-[500px]"
              />
            </>
          )}
        </div>
      </div>
    </AuthProvider>
  );
}
