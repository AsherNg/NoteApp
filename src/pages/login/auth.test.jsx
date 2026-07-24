import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./login.jsx";
import Register from "./register.jsx";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../supabaseClient.jsx", () => ({
  default: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
      resend: vi.fn(),
    },
  },
}));

import supabase from "../../supabaseClient.jsx";

function renderWithRouter(ui) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

function fillRegisterForm({
  name = "John Doe",
  email = "john@example.com",
  password = "Passw0rd!",
  confirmPass = "Passw0rd!",
} = {}) {
  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: password } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), {
    target: { value: confirmPass },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================
// LOGIN
// ============================================================
describe("Login", () => {
  it("renders email and password fields", () => {
    renderWithRouter(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("calls signInWithPassword with entered credentials", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows error message on invalid credentials", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bad@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login credentials")).toBeInTheDocument();
    });
  });

  it("shows generic error when data.user is falsy and no error", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText("Wrong email or password!")).toBeInTheDocument();
    });
  });

  it("attempts login on successful credentials", async () => {
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "123" } },
      error: null,
    });
    renderWithRouter(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /login/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  it("calls signInWithOAuth with google provider", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null });
    renderWithRouter(<Login />);
    fireEvent.click(screen.getAllByRole("button")[1]);
    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: "http://localhost:5173" },
      });
    });
  });

  it("calls signInWithOAuth with github provider", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null });
    renderWithRouter(<Login />);
    fireEvent.click(screen.getAllByRole("button")[2]);
    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "github",
        options: { redirectTo: "http://localhost:5173" },
      });
    });
  });

  it("alerts on OAuth failure", async () => {
    window.alert = vi.fn();
    supabase.auth.signInWithOAuth.mockResolvedValue({
      error: { message: "OAuth failed" },
    });
    renderWithRouter(<Login />);
    fireEvent.click(screen.getAllByRole("button")[1]);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Authentication failed: OAuth failed"
      );
    });
  });
});

// ============================================================
// REGISTER
// ============================================================
describe("Register - field validation", () => {
  it("rejects invalid email format", async () => {
    renderWithRouter(<Register />);
    fillRegisterForm({ email: "not-an-email" });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByText("Invalid Email")).toBeInTheDocument();
    });
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it("rejects empty name", async () => {
    renderWithRouter(<Register />);
    fillRegisterForm({ name: "   " });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByText("Invalid Name")).toBeInTheDocument();
    });
  });

  it("rejects password missing complexity requirements", async () => {
    renderWithRouter(<Register />);
    fillRegisterForm({ password: "weak", confirmPass: "weak" });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByText("Invalid Password")).toBeInTheDocument();
    });
  });

  it("rejects mismatched password confirmation", async () => {
    renderWithRouter(<Register />);
    fillRegisterForm({ password: "Passw0rd!", confirmPass: "Different1!" });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    await waitFor(() => {
      expect(screen.getByText("Cannot confirm!")).toBeInTheDocument();
    });
  });

  it("does not call signUp when any validation fails", async () => {
    renderWithRouter(<Register />);
    fillRegisterForm({ email: "bad" });
    fireEvent.click(screen.getByRole("button", { name: /register/i }));
    await waitFor(() => {
      expect(supabase.auth.signUp).not.toHaveBeenCalled();
    });
  });
});

describe("Register - password criteria display", () => {
  it("marks all criteria unmet for empty password", () => {
    renderWithRouter(<Register />);
    expect(screen.getByText("✓ Min 8 Characters")).toHaveClass("text-gray-400");
    expect(screen.getByText("✓ Uppercase Letter")).toHaveClass("text-gray-400");
  });

  it("marks criteria met as password is typed", () => {
    renderWithRouter(<Register />);
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "Passw0rd!" },
    });
    expect(screen.getByText("✓ Min 8 Characters")).toHaveClass("text-green-500");
    expect(screen.getByText("✓ Uppercase Letter")).toHaveClass("text-green-500");
    expect(screen.getByText("✓ Lowercase Letter")).toHaveClass("text-green-500");
    expect(screen.getByText("✓ Numeric Digit")).toHaveClass("text-green-500");
    expect(screen.getByText("✓ Special Character")).toHaveClass("text-green-500");
  });
});

describe("Register - submission", () => {
  it("calls signUp with email, password, and name metadata", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { identities: [{ id: "x" }] } },
      error: null,
    });
    renderWithRouter(<Register />);
    fillRegisterForm();
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "Passw0rd!",
        options: { data: { name: "John Doe" } },
      });
    });
  });

  it("navigates to /verify on successful signup", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { identities: [{ id: "x" }] } },
      error: null,
    });
    renderWithRouter(<Register />);
    fillRegisterForm();
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/verify", {
        state: { email: "john@example.com", name: "John Doe" },
      });
    });
  });

  it("shows 'Already registered' error when identities array is empty", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: { user: { identities: [] } },
      error: null,
    });
    renderWithRouter(<Register />);
    fillRegisterForm();
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(screen.getByText("Already registered E-mail")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("resends OTP and navigates to /verify on 'Email not confirmed' error", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "Email not confirmed" },
    });
    supabase.auth.resend.mockResolvedValue({ error: null });
    renderWithRouter(<Register />);
    fillRegisterForm();
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: "signup",
        email: "john@example.com",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/verify", {
        state: { email: "john@example.com", name: "John Doe" },
      });
    });
  });

  it("shows signUp error message for other failures", async () => {
    supabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: "Signup failed for some other reason" },
    });
    renderWithRouter(<Register />);
    fillRegisterForm();
    fireEvent.click(screen.getByRole("button", { name: /register/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Signup failed for some other reason")
      ).toBeInTheDocument();
    });
  });
});

describe("Register - OAuth", () => {
  it("calls signInWithOAuth with google provider", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null });
    renderWithRouter(<Register />);
    fireEvent.click(screen.getAllByRole("button")[1]);
    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: "http://localhost:5173" },
      });
    });
  });

  it("calls signInWithOAuth with github provider", async () => {
    supabase.auth.signInWithOAuth.mockResolvedValue({ error: null });
    renderWithRouter(<Register />);
    fireEvent.click(screen.getAllByRole("button")[2]);
    await waitFor(() => {
      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "github",
        options: { redirectTo: "http://localhost:5173" },
      });
    });
  });

  it("alerts on OAuth failure", async () => {
    window.alert = vi.fn();
    supabase.auth.signInWithOAuth.mockResolvedValue({
      error: { message: "OAuth failed" },
    });
    renderWithRouter(<Register />);
    fireEvent.click(screen.getAllByRole("button")[1]);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        "Authentication failed: OAuth failed"
      );
    });
  });
});
