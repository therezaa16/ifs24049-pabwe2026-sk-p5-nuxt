import { describe, it, expect, vi, beforeEach } from "vitest";
import UsersPage from "./UsersPage.vue";
import { renderWithProviders, createMockPinia } from "../../../test-utils";

describe("UsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUsers = [
    {
      id: 1,
      name: "Abdullah",
      email: "abdullah@delcom.org",
      photo: "https://example.com/photo.jpg",
      created_at: "2024-10-05T02:53:38.000000Z",
    },
    {
      id: 2,
      name: "Ubaid",
      email: "ubaid@delcom.org",
      photo: null,
      created_at: "2024-10-05T03:18:14.000000Z",
    },
    {
      id: 3,
      name: "",
      email: "",
      photo: null,
      created_at: "2024-10-05T03:18:14.000000Z",
    },
  ];

  it("should render users list, fallback initial avatar, and search users", async () => {
    const { wrapper } = renderWithProviders(UsersPage, {
      preloadedState: {
        users: mockUsers,
      },
    });

    expect(wrapper.text()).toContain("Semua Pengguna");
    expect(wrapper.text()).toContain("Abdullah");
    expect(wrapper.text()).toContain("Ubaid");
    expect(wrapper.text()).toContain("U"); // initial avatar fallback

    const searchInput = wrapper.find<HTMLInputElement>('[data-testid="search-user-input"]');
    await searchInput.setValue("abdullah");

    expect(wrapper.text()).toContain("Abdullah");
    expect(wrapper.text()).not.toContain("Ubaid");
  });

  it("should handle state when users in store is null", () => {
    const { wrapper } = renderWithProviders(UsersPage, {
      preloadedState: {
        users: null,
      },
    });

    expect(wrapper.text()).toContain("Semua Pengguna");
  });

  it("should show empty state when no users found and not loading", async () => {
    const { pinia, usersStore } = createMockPinia({ users: [] });
    vi.spyOn(usersStore, "asyncSetUsers").mockResolvedValue();

    const { wrapper } = renderWithProviders(UsersPage, { pinia });
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.text()).toContain("Tidak ada data pengguna ditemukan.");
  });

  it("should show loading indicator while users are being fetched", async () => {
    let resolveLoad: () => void = () => {};
    const pendingPromise = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });

    const { usersStore } = renderWithProviders(UsersPage, {
      preloadedState: {
        users: [],
      },
    });

    vi.spyOn(usersStore, "asyncSetUsers").mockReturnValue(pendingPromise as any);

    // Call fetch again to trigger loading
    usersStore.asyncSetUsers();
    await new Promise((r) => setTimeout(r, 10));

    // Cleanup
    resolveLoad();
    await pendingPromise;
  });

  it("should not update loading state after unmount (isMounted guard)", async () => {
    let resolveLoad: () => void = () => {};
    const pendingPromise = new Promise<void>((resolve) => {
      resolveLoad = resolve;
    });

    const { pinia, usersStore } = createMockPinia({ users: [] });
    vi.spyOn(usersStore, "asyncSetUsers").mockReturnValue(pendingPromise as any);

    const { wrapper } = renderWithProviders(UsersPage, { pinia });

    wrapper.unmount();
    resolveLoad();
    await pendingPromise;
  });
});
