import { createRouter, createWebHistory, type Router, type RouterHistory } from "vue-router";
import { routes } from "./routes";

export { routes };

export function createAppRouter(history: RouterHistory = createWebHistory()): Router {
  return createRouter({
    history,
    routes,
  });
}

const router = createAppRouter();

export default router;
