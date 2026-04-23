import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
  (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "new-project-id" });
});

afterEach(() => {
  cleanup();
});

describe("useAuth", () => {
  describe("initial state", () => {
    test("isLoading starts as false", () => {
      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);
    });

    test("exposes signIn, signUp, and isLoading", () => {
      const { result } = renderHook(() => useAuth());
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.isLoading).toBe("boolean");
    });
  });

  describe("signIn", () => {
    test("calls signInAction with the provided email and password", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(signInAction).toHaveBeenCalledWith("user@example.com", "password123");
    });

    test("returns the result from signInAction on success", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAuth());

      let returnValue: Awaited<ReturnType<typeof result.current.signIn>>;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "password123");
      });

      expect(returnValue!).toEqual({ success: true });
    });

    test("returns the result from signInAction on failure", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });
      const { result } = renderHook(() => useAuth());

      let returnValue: Awaited<ReturnType<typeof result.current.signIn>>;
      await act(async () => {
        returnValue = await result.current.signIn("user@example.com", "wrong");
      });

      expect(returnValue!).toEqual({ success: false, error: "Invalid credentials" });
    });

    test("sets isLoading to true while pending and false after completion", async () => {
      let resolveSignIn!: (value: { success: boolean }) => void;
      (signInAction as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => { resolveSignIn = resolve; })
      );

      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);

      let pending!: Promise<unknown>;
      act(() => {
        pending = result.current.signIn("user@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignIn({ success: false });
        await pending;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading to false even when signInAction throws", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Network error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signIn("user@example.com", "password123");
        } catch {
          // expected
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("does not navigate when sign-in fails", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "wrong");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("triggers post-sign-in navigation on success", async () => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "project-1" }]);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });
  });

  describe("signUp", () => {
    test("calls signUpAction with the provided email and password", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: false });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(signUpAction).toHaveBeenCalledWith("new@example.com", "password123");
    });

    test("returns the result from signUpAction on success", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      const { result } = renderHook(() => useAuth());

      let returnValue: Awaited<ReturnType<typeof result.current.signUp>>;
      await act(async () => {
        returnValue = await result.current.signUp("new@example.com", "password123");
      });

      expect(returnValue!).toEqual({ success: true });
    });

    test("returns the result from signUpAction on failure", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });
      const { result } = renderHook(() => useAuth());

      let returnValue: Awaited<ReturnType<typeof result.current.signUp>>;
      await act(async () => {
        returnValue = await result.current.signUp("existing@example.com", "password123");
      });

      expect(returnValue!).toEqual({ success: false, error: "Email already registered" });
    });

    test("sets isLoading to true while pending and false after completion", async () => {
      let resolveSignUp!: (value: { success: boolean }) => void;
      (signUpAction as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => { resolveSignUp = resolve; })
      );

      const { result } = renderHook(() => useAuth());
      expect(result.current.isLoading).toBe(false);

      let pending!: Promise<unknown>;
      act(() => {
        pending = result.current.signUp("new@example.com", "password123");
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveSignUp({ success: false });
        await pending;
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("resets isLoading to false even when signUpAction throws", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Server error"));
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        try {
          await result.current.signUp("new@example.com", "password123");
        } catch {
          // expected
        }
      });

      expect(result.current.isLoading).toBe(false);
    });

    test("does not navigate when sign-up fails", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("existing@example.com", "password123");
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    test("triggers post-sign-in navigation on success", async () => {
      (signUpAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
      (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "project-1" }]);
      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("new@example.com", "password123");
      });

      expect(mockPush).toHaveBeenCalledWith("/project-1");
    });
  });

  describe("post sign-in navigation", () => {
    beforeEach(() => {
      (signInAction as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });
    });

    describe("when anonymous work exists with messages", () => {
      const anonWork = {
        messages: [{ role: "user", content: "Build me a button" }],
        fileSystemData: { "/App.jsx": { type: "file", content: "<App />" } },
      };

      beforeEach(() => {
        (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(anonWork);
        (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "anon-project-id" });
      });

      test("creates a project from the anonymous work data", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: anonWork.messages,
          data: anonWork.fileSystemData,
        });
      });

      test("clears anonymous work after creating the project", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(clearAnonWork).toHaveBeenCalled();
      });

      test("navigates to the newly created project", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
      });

      test("does not fetch existing projects", async () => {
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(getProjects).not.toHaveBeenCalled();
      });
    });

    describe("when anonymous work exists but has no messages", () => {
      beforeEach(() => {
        (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue({
          messages: [],
          fileSystemData: {},
        });
      });

      test("falls through to existing project lookup", async () => {
        (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "existing-project" }]);
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(getProjects).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/existing-project");
      });

      test("does not create a project from the empty anon work", async () => {
        (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "existing-project" }]);
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(createProject).not.toHaveBeenCalled();
      });
    });

    describe("when no anonymous work exists", () => {
      beforeEach(() => {
        (getAnonWorkData as ReturnType<typeof vi.fn>).mockReturnValue(null);
      });

      test("navigates to the most recent project when projects exist", async () => {
        (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([
          { id: "recent-project" },
          { id: "older-project" },
        ]);
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/recent-project");
      });

      test("does not create a new project when projects already exist", async () => {
        (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "recent-project" }]);
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(createProject).not.toHaveBeenCalled();
      });

      test("creates a new project when no projects exist", async () => {
        (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "brand-new-project" });
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/^New Design #\d+$/),
          messages: [],
          data: {},
        });
      });

      test("navigates to the newly created project when no projects exist", async () => {
        (getProjects as ReturnType<typeof vi.fn>).mockResolvedValue([]);
        (createProject as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "brand-new-project" });
        const { result } = renderHook(() => useAuth());

        await act(async () => {
          await result.current.signIn("user@example.com", "password123");
        });

        expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
      });
    });
  });
});
