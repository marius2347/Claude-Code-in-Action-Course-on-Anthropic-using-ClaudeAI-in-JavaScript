import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { getToolLabel, ToolCallBadge } from "../ToolCallBadge";

afterEach(() => {
  cleanup();
});

// ─── getToolLabel ────────────────────────────────────────────────────────────

test("getToolLabel: str_replace_editor create shows filename", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/src/App.jsx" })).toBe("Creating App.jsx");
});

test("getToolLabel: str_replace_editor create with no path falls back", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe("Creating file");
});

test("getToolLabel: str_replace_editor str_replace shows filename", () => {
  expect(getToolLabel("str_replace_editor", { command: "str_replace", path: "/src/components/Card.tsx" })).toBe("Editing Card.tsx");
});

test("getToolLabel: str_replace_editor insert shows filename", () => {
  expect(getToolLabel("str_replace_editor", { command: "insert", path: "/src/utils.ts" })).toBe("Editing utils.ts");
});

test("getToolLabel: str_replace_editor view shows filename", () => {
  expect(getToolLabel("str_replace_editor", { command: "view", path: "/src/index.ts" })).toBe("Reading index.ts");
});

test("getToolLabel: str_replace_editor undo_edit shows filename", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit", path: "/src/App.jsx" })).toBe("Undoing edit on App.jsx");
});

test("getToolLabel: str_replace_editor undo_edit with no path falls back", () => {
  expect(getToolLabel("str_replace_editor", { command: "undo_edit" })).toBe("Undoing edit");
});

test("getToolLabel: str_replace_editor with empty args falls back to tool name", () => {
  expect(getToolLabel("str_replace_editor", {})).toBe("str_replace_editor");
});

test("getToolLabel: file_manager rename shows both filenames", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/src/Foo.jsx", new_path: "/src/Bar.jsx" })).toBe("Renaming Foo.jsx → Bar.jsx");
});

test("getToolLabel: file_manager rename with missing new_path falls back", () => {
  expect(getToolLabel("file_manager", { command: "rename", path: "/src/Foo.jsx" })).toBe("Renaming file");
});

test("getToolLabel: file_manager delete shows filename", () => {
  expect(getToolLabel("file_manager", { command: "delete", path: "/src/Old.jsx" })).toBe("Deleting Old.jsx");
});

test("getToolLabel: file_manager delete with no path falls back", () => {
  expect(getToolLabel("file_manager", { command: "delete" })).toBe("Deleting file");
});

test("getToolLabel: unknown tool name returns tool name as-is", () => {
  expect(getToolLabel("some_other_tool", { command: "do_thing" })).toBe("some_other_tool");
});

test("getToolLabel: extracts basename from nested path", () => {
  expect(getToolLabel("str_replace_editor", { command: "create", path: "/very/deep/nested/Component.tsx" })).toBe("Creating Component.tsx");
});

// ─── ToolCallBadge rendering ─────────────────────────────────────────────────

test("ToolCallBadge in-progress shows spinner and friendly label", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/App.jsx" }}
      state="call"
    />
  );

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge partial-call shows spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "str_replace", path: "/src/Card.tsx" }}
      state="partial-call"
    />
  );

  expect(screen.getByText("Editing Card.tsx")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeDefined();
});

test("ToolCallBadge completed shows green dot and label", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/App.jsx" }}
      state="result"
      result="Success"
    />
  );

  expect(screen.getByText("Creating App.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
  expect(container.querySelector(".animate-spin")).toBeNull();
});

test("ToolCallBadge result with undefined result still shows spinner", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{ command: "create", path: "/src/App.jsx" }}
      state="result"
      result={undefined}
    />
  );

  expect(container.querySelector(".animate-spin")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("ToolCallBadge file_manager delete shows friendly label when done", () => {
  const { container } = render(
    <ToolCallBadge
      toolName="file_manager"
      args={{ command: "delete", path: "/src/OldComponent.jsx" }}
      state="result"
      result={{ success: true }}
    />
  );

  expect(screen.getByText("Deleting OldComponent.jsx")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("ToolCallBadge falls back to tool name when args are empty", () => {
  render(
    <ToolCallBadge
      toolName="str_replace_editor"
      args={{}}
      state="result"
      result="done"
    />
  );

  expect(screen.getByText("str_replace_editor")).toBeDefined();
});
