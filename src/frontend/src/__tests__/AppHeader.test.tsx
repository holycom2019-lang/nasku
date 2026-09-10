import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppHeader } from "@/components/AppHeader";

const { navigateMock, useLocationMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  useLocationMock: vi.fn(() => ({ pathname: "/" })),
}));

vi.mock("@tanstack/react-router", () => ({
  useLocation: useLocationMock,
  useNavigate: () => navigateMock,
}));

describe("AppHeader navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useLocationMock.mockReturnValue({ pathname: "/" });
  });

  it("shows the breadcrumb for the current route", () => {
    useLocationMock.mockReturnValue({ pathname: "/files" });
    render(<AppHeader />);
    expect(screen.getByText("File Saya")).toBeInTheDocument();
  });

  it("navigates to the search page with the typed query", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.type(
      screen.getByPlaceholderText(/cari file atau folder/i),
      "laporan",
    );
    await user.click(screen.getByRole("button", { name: /cari/i }));

    expect(navigateMock).toHaveBeenCalledWith({
      to: "/search",
      search: { q: "laporan" },
    });
  });

  it("does not navigate when the search term is blank", async () => {
    const user = userEvent.setup();
    render(<AppHeader />);

    await user.click(screen.getByRole("button", { name: /cari/i }));

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
