import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia, type Pinia } from "pinia";
import { createAppRouter } from "./router";
import { createMemoryHistory, type Router } from "vue-router";
import { useAuthStore } from "./features/auth/states/authStore";
import { useUsersStore } from "./features/users/states/usersStore";
import { useCashFlowsStore } from "./features/cashflows/states/cashFlowsStore";

export function createMockPinia(initialState: Record<string, any> = {}) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const authStore = useAuthStore(pinia);
  const usersStore = useUsersStore(pinia);
  const cashFlowsStore = useCashFlowsStore(pinia);

  Object.entries(initialState).forEach(([key, val]) => {
    if (key in authStore.$state) (authStore.$state as any)[key] = val;
    if (key in usersStore.$state) (usersStore.$state as any)[key] = val;
    if (key in cashFlowsStore.$state) (cashFlowsStore.$state as any)[key] = val;
  });

  return { pinia, authStore, usersStore, cashFlowsStore };
}

export interface RenderWithProvidersOptions {
  preloadedState?: Record<string, any>;
  pinia?: Pinia | null;
  router?: Router;
  props?: Record<string, any>;
  slots?: Record<string, any>;
  attachTo?: any;
  [key: string]: any;
}

export function renderWithProviders(
  component: any,
  {
    preloadedState = {},
    pinia = null,
    router = createAppRouter(createMemoryHistory()),
    props = {},
    slots = {},
    attachTo = undefined,
    ...mountOptions
  }: RenderWithProvidersOptions = {}
) {
  const { pinia: activePinia, authStore, usersStore, cashFlowsStore } = pinia
    ? {
        pinia,
        authStore: useAuthStore(pinia),
        usersStore: useUsersStore(pinia),
        cashFlowsStore: useCashFlowsStore(pinia),
      }
    : createMockPinia(preloadedState);

  const wrapper = mount(component, {
    props,
    slots,
    attachTo,
    global: {
      plugins: [activePinia, router],
      stubs: mountOptions.global?.stubs,
      mocks: mountOptions.global?.mocks,
    },
    ...mountOptions,
  });

  return {
    wrapper,
    pinia: activePinia,
    authStore,
    usersStore,
    cashFlowsStore,
    router,
    container: wrapper.element,
  };
}
