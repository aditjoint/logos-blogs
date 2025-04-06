import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { CommentWithAuthor } from "@shared/schema";

interface CommentSectionProps {
  articleId: number;
}

export default function CommentSection({ articleId }: CommentSectionProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);

  // Fetch comments
  const { data: comments, isLoading, error } = useQuery<CommentWithAuthor[]>({
    queryKey: [`/api/articles/${articleId}/comments`],
  });

  // Submit comment mutation
  const submitCommentMutation = useMutation({
    mutationFn: async ({ content, parentId }: { content: string; parentId?: number }) => {
      const res = await apiRequest(
        "POST",
        `/api/articles/${articleId}/comments`,
        { content, parentId }
      );
      return res.json();
    },
    onSuccess: () => {
      setContent("");
      setReplyTo(null);
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${articleId}/comments`] });
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      const res = await apiRequest("DELETE", `/api/comments/${commentId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/articles/${articleId}/comments`] });
      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = () => {
    if (!content.trim()) {
      toast({
        title: "Empty comment",
        description: "Please write something before submitting",
        variant: "destructive",
      });
      return;
    }

    submitCommentMutation.mutate({
      content: content.trim(),
      parentId: replyTo || undefined,
    });
  };

  const handleDeleteComment = (commentId: number) => {
    deleteCommentMutation.mutate(commentId);
  };

  const handleReply = (commentId: number) => {
    setReplyTo(commentId);
    // Focus the textarea
    const textarea = document.getElementById("comment-textarea");
    if (textarea) {
      textarea.focus();
    }
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
        <div>
          <h3 className="font-medium text-red-800 dark:text-red-300">Error loading comments</h3>
          <p className="text-sm text-red-700 dark:text-red-400">
            {error instanceof Error ? error.message : "Something went wrong. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h3 className="text-2xl font-bold mb-6 flex items-center">
        <MessageSquare className="mr-2 h-6 w-6 text-primary-500" />
        Comments
      </h3>

      {/* Comment form */}
      {isAuthenticated ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-8">
          <div className="flex space-x-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback>
                {user?.name?.charAt(0) || user?.username?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {replyTo && (
                <div className="mb-2 text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded-md flex justify-between items-center">
                  <span>
                    Replying to a comment
                  </span>
                  <Button variant="ghost" size="sm" onClick={cancelReply}>
                    Cancel
                  </Button>
                </div>
              )}
              <Textarea
                id="comment-textarea"
                placeholder="Write a comment..."
                className="mb-3 resize-none"
                rows={3}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleSubmitComment}
                  disabled={submitCommentMutation.isPending || !content.trim()}
                >
                  {submitCommentMutation.isPending ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Please <Button variant="link" className="p-0 h-auto" onClick={() => document.querySelector<HTMLButtonElement>('[data-login-trigger="true"]')?.click()}>login</Button> to leave a comment.
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-6">
        {isLoading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="flex space-x-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              onReply={handleReply}
              onDelete={handleDeleteComment}
            />
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  currentUserId?: number;
  onReply: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  depth?: number;
}

function CommentItem({ comment, currentUserId, onReply, onDelete, depth = 0 }: CommentItemProps) {
  const isAuthor = currentUserId === comment.authorId;
  const maxDepth = 3; // Maximum depth for nested replies

  return (
    <div className={`${depth > 0 ? 'ml-12 mt-4' : ''}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex space-x-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
            <AvatarFallback>
              {comment.author.name?.charAt(0) || comment.author.username?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <span className="font-medium">{comment.author.name}</span>
              <span className="mx-2 text-gray-400">·</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-gray-700 dark:text-gray-300 mb-3">{comment.content}</p>
            <div className="flex space-x-4 text-sm">
              {depth < maxDepth && (
                <Button variant="ghost" size="sm" onClick={() => onReply(comment.id)}>
                  Reply
                </Button>
              )}
              {isAuthor && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => onDelete(comment.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4 mt-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onReply={onReply}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
