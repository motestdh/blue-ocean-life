import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Tasks from "./pages/Tasks";
import Focus from "./pages/Focus";
import Habits from "./pages/Habits";
import Finance from "./pages/Finance";
import CalendarPage from "./pages/CalendarPage";
import Clients from "./pages/Clients";
import Notes from "./pages/Notes";
import Learning from "./pages/Learning";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import BooksPodcasts from "./pages/BooksPodcasts";
import MoviesSeries from "./pages/MoviesSeries";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:id" element={<ProjectDetail />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/focus" element={<Focus />} />
                    <Route path="/habits" element={<Habits />} />
                    <Route path="/finance" element={<Finance />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/clients" element={<Clients />} />
                    <Route path="/notes" element={<Notes />} />
                    <Route path="/learning" element={<Learning />} />
                    <Route path="/books-podcasts" element={<BooksPodcasts />} />
                    <Route path="/movies-series" element={<MoviesSeries />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Layout>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
