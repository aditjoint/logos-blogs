import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Article from "@/pages/article";
import Editor from "@/pages/editor";
import Profile from "@/pages/profile";
import Explore from "@/pages/explore";
import Bookmarks from "@/pages/bookmarks";
import Topics from "@/pages/topics";
import AuthPage from "@/pages/auth-page";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/article/:id" component={Article} />
          <ProtectedRoute path="/editor" component={Editor} />
          <ProtectedRoute path="/editor/:id" component={Editor} />
          <Route path="/profile/:id" component={Profile} />
          <Route path="/explore" component={Explore} />
          <ProtectedRoute path="/bookmarks" component={Bookmarks} />
          <Route path="/topics" component={Topics} />
          <Route path="/auth" component={AuthPage} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
