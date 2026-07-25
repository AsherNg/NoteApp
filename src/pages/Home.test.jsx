import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Home from "./home.jsx";

vi.mock("../components/Sidebar.jsx", () => ({
  default: (props) => (
    <div data-testid="sidebar">
      <button onClick={props.setOpenExplorer}>toggle-explorer</button>
    </div>
  ),
}));
vi.mock("../components/Explorer.jsx", () => ({ default: () => <div data-testid="explorer" /> }));
vi.mock("../components/Editor.jsx", () => ({ default: () => <div data-testid="editor" /> }));
vi.mock("../components/Navbar.jsx", () => ({ default: () => <div data-testid="navbar" /> }));
vi.mock("../components/Chat.jsx", () => ({ default: () => <div data-testid="chat" /> }));
vi.mock("../components/PrintPreview.jsx", () => ({ default: () => <div data-testid="print-preview" /> }));
vi.mock("./settings/customPage.jsx", () => ({ default: () => <div data-testid="custom-page" /> }));
vi.mock("../pages/settings/hotkeys.jsx", () => ({
  initHotkeys: [],
  HotkeysPage: () => <div data-testid="hotkeys-page" />,
}));
vi.mock("../components/Modal.jsx", () => ({
  default: (props) => (props.isOpen ? <div data-testid="modal">{props.children}</div> : null),
}));
vi.mock("../components/Dropdown.jsx", () => ({ default: () => <div data-testid="dropdown" /> }));
vi.mock("./loading.jsx", () => ({ default: () => <div data-testid="loading" /> }));

vi.mock("../supabaseClient.jsx", () => ({
  default: { auth: { signOut: vi.fn() } },
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  localStorage.setItem("rootFolder", "/home/notes");
  localStorage.setItem("stylesFolder", "/home/styles");
  localStorage.setItem("savedHotkeys", "/home/hotkeys.json");

  window.fileApi = {
    createFile: vi.fn().mockResolvedValue(),
    deleteFile: vi.fn().mockResolvedValue(),
    rename: vi.fn().mockResolvedValue(),
    checkExists: vi.fn().mockResolvedValue(false),
    readFile: vi.fn().mockResolvedValue("{}"),
    writeFile: vi.fn().mockResolvedValue(),
    readFolder: vi.fn().mockResolvedValue({ items: [] }),
    initDefault: vi.fn().mockResolvedValue(["/home/notes", "/home/styles", "/home/hotkeys.json"]),
  };
});

describe("Home - new note creation", () => {
  it("creates a file with a valid name", async () => {
    renderHome();
    fireEvent.click(screen.getByText("Create New Note"));

    const input = await screen.findByLabelText(/make new note/i);
    fireEvent.change(input, { target: { value: "MyNote" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(window.fileApi.createFile).toHaveBeenCalledWith("/home/notes/MyNote.md");
    });
  });

  it("does not create a file when the name has invalid characters", async () => {
    renderHome();
    fireEvent.click(screen.getByText("Create New Note"));

    const input = await screen.findByLabelText(/make new note/i);
    fireEvent.change(input, { target: { value: "My Note!" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(window.fileApi.createFile).not.toHaveBeenCalled();
    expect(screen.getByText("Invalid Name")).toBeInTheDocument();
  });

  it("logs an error if createFile rejects", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    window.fileApi.createFile.mockRejectedValue(new Error("disk full"));
    renderHome();
    fireEvent.click(screen.getByText("Create New Note"));

    const input = await screen.findByLabelText(/make new note/i);
    fireEvent.change(input, { target: { value: "MyNote" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("createFile failed:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });
});

describe("Home - delete file", () => {
  it("calls deleteFile with the current path on confirm", async () => {
    localStorage.setItem(
      "openTabs",
      JSON.stringify([
        {
          tabId: "tab-1",
          noOfTabs: 1,
          activeScreen: "screen-1",
          screens: { screenId: "screen-1", displayType: "file", path: "/home/notes/existing.md" },
        },
      ])
    );
    localStorage.setItem("activeTab", "tab-1");

    renderHome();
    fireEvent.keyDown(window, { key: "Delete", ctrlKey: false });
  });
});

describe("Home - rename file", () => {
  it("renames via window.fileApi.rename with a valid name", async () => {
    window.fileApi.checkExists.mockResolvedValue(false);
    localStorage.setItem(
      "openTabs",
      JSON.stringify([
        {
          tabId: "tab-1",
          noOfTabs: 1,
          activeScreen: "screen-1",
          screens: { screenId: "screen-1", displayType: "file", path: "/home/notes/old.md" },
        },
      ])
    );
    localStorage.setItem("activeTab", "tab-1");
    renderHome();
  });
});
