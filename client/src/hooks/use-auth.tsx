import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface RegisterData {
  username: string;
  password: string;
  email: string;
  name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch current user data
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/user'],
    queryFn: async ({ queryKey }) => {
      try {
        const res = await fetch(queryKey[0] as string, {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null;
        }
        
        if (!res.ok) {
          throw new Error(res.statusText);
        }
        
        const text = await res.text();
        
        // Check if response is empty
        if (!text) {
          return null;
        }
        
        try {
          return JSON.parse(text);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError, 'Raw response:', text);
          return null;
        }
      } catch (error) {
        console.error('Auth fetch error:', error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      try {
        const res = await apiRequest('POST', '/api/login', credentials);
        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Login failed');
          } catch (jsonError) {
            throw new Error('Login failed - server error');
          }
        }
        
        const text = await res.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        
        try {
          return JSON.parse(text);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError, 'Raw response:', text);
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${data.name}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      try {
        const res = await apiRequest('POST', '/api/register', userData);
        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Registration failed');
          } catch (jsonError) {
            throw new Error('Registration failed - server error');
          }
        }
        
        const text = await res.text();
        if (!text) {
          throw new Error('Empty response from server');
        }
        
        try {
          return JSON.parse(text);
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError, 'Raw response:', text);
          throw new Error('Invalid response format from server');
        }
      } catch (error) {
        console.error('Registration error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/user'], data);
      toast({
        title: "Account created",
        description: "Your account has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest('POST', '/api/logout', {});
        if (!res.ok) {
          try {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Logout failed');
          } catch (jsonError) {
            throw new Error('Logout failed - server error');
          }
        }
        // Successfully logged out
        return true;
      } catch (error) {
        console.error('Logout error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/user'], null);
      queryClient.invalidateQueries();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const login = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const register = async (userData: RegisterData) => {
    await registerMutation.mutateAsync(userData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}


