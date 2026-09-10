import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Activity } from "@/pages/Activity";
import { Home } from "@/pages/Home";
import { MyFiles } from "@/pages/MyFiles";
import { Search } from "@/pages/Search";
import { Sharing } from "@/pages/Sharing";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  ),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

const filesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/files",
  component: MyFiles,
});

const sharingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sharing",
  component: Sharing,
});

const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/activity",
  component: Activity,
});

type SearchParams = { q?: string };

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: Search,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  filesRoute,
  sharingRoute,
  activityRoute,
  searchRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
