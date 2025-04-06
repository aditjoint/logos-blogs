import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import ArticleList from "@/components/articles/article-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Calendar, Edit, User as UserIcon, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { User } from "@shared/schema";

export default function ProfilePage() {
  const [, params] = useRoute("/profile/:id");
  const profileId = params?.id ? parseInt(params.id) : 0;
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState("articles");
  
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isOwnProfile = user?.id === profileId;

  // Fetch profile data
  const { data: profile, isLoading, error } = useQuery<Partial<User>>({
    queryKey: [`/api/users/${profileId}`],
  });

  // Check if following user
  useQuery({
    queryKey: [`/api/users/${profileId}/following`],
    enabled: isAuthenticated && !isOwnProfile,
    onSuccess: (data) => {
      if (data && data.following) {
        setIsFollowing(data.following);
      }
    },
  });

  // Toggle follow mutation
  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest("DELETE", `/api/users/${profileId}/follow`);
      } else {
        await apiRequest("POST", `/api/users/${profileId}/follow`, {
          followerId: user?.id,
          followingId: profileId
        });
      }
      return !isFollowing;
    },
    onSuccess: (newFollowState) => {
      setIsFollowing(newFollowState);
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profileId}/following`] });
      
      toast({
        title: newFollowState ? "Following" : "Unfollowed",
        description: newFollowState 
          ? `You are now following ${profile?.name}` 
          : `You have unfollowed ${profile?.name}`,
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

  const handleFollowToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication required",
        description: "Please login to follow users",
        variant: "destructive",
      });
      return;
    }
    
    toggleFollowMutation.mutate();
  };

  // Set page title
  useEffect(() => {
    if (profile) {
      document.title = `${profile.name} | Logus`;
    } else {
      document.title = "Profile | Logus";
    }
  }, [profile]);

  if (error) {
    return (
      <AuthProvider>
        <div className="container mx-auto px-4 py-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-300">Error loading profile</h3>
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
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            </div>
          ) : profile ? (
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar} alt={profile.name} />
                  <AvatarFallback className="text-2xl">
                    {profile.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-2">
                    <h1 className="text-3xl font-bold">{profile.name}</h1>
                    {!isOwnProfile ? (
                      <Button 
                        onClick={handleFollowToggle}
                        variant={isFollowing ? "default" : "outline"}
                        disabled={toggleFollowMutation.isPending}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                    ) : (
                      <Button variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Profile
                      </Button>
                    )}
                  </div>
                  
                  <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center sm:justify-start">
                    <UserIcon className="h-4 w-4 mr-1" />
                    <span>@{profile.username}</span>
                    <span className="mx-2">•</span>
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Joined {formatDate(profile.createdAt!)}</span>
                  </p>
                  
                  {profile.bio && (
                    <p className="mt-4 text-gray-700 dark:text-gray-300">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold mb-4">User not found</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The profile you're looking for doesn't exist or has been removed.
              </p>
              <Link href="/">
                <Button>Return to Home</Button>
              </Link>
            </div>
          )}

          {profile && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
              <TabsList className="w-full justify-start mb-6 bg-transparent border-b dark:border-gray-700 rounded-none p-0">
                <TabsTrigger 
                  value="articles" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-transparent px-6 py-3"
                >
                  Articles
                </TabsTrigger>
                <TabsTrigger 
                  value="followers" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-transparent px-6 py-3"
                >
                  Followers
                </TabsTrigger>
                <TabsTrigger 
                  value="following" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-transparent px-6 py-3"
                >
                  Following
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="articles" className="p-0 border-none">
                <ArticleList
                  queryKey={[`/api/users/${profileId}/articles`]}
                  emptyMessage={
                    isOwnProfile 
                      ? "You haven't published any articles yet. Start writing your first article!" 
                      : `${profile.name} hasn't published any articles yet.`
                  }
                />
              </TabsContent>
              
              <TabsContent value="followers" className="p-0 border-none">
                <FollowersList profileId={profileId} type="followers" />
              </TabsContent>
              
              <TabsContent value="following" className="p-0 border-none">
                <FollowersList profileId={profileId} type="following" />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </AuthProvider>
  );
}

interface FollowersListProps {
  profileId: number;
  type: 'followers' | 'following';
}

function FollowersList({ profileId, type }: FollowersListProps) {
  const { data: users, isLoading, error } = useQuery<Partial<User>[]>({
    queryKey: [`/api/users/${profileId}/${type}`],
  });

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h3 className="font-medium text-red-800 dark:text-red-300">Error loading {type}</h3>
        <p className="text-sm text-red-700 dark:text-red-400">
          {error instanceof Error ? error.message : "Something went wrong. Please try again."}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">No {type} found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <Link key={user.id} href={`/profile/${user.id}`}>
          <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
