import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShareDialog } from "./ShareDialog";
import { renderWithDocument } from "@/test/render-with-document";

const mockLogin = vi.fn();
const mockAuth = {
  user: null as {
    id: string;
    email: string;
    name: string;
    avatarUrl: string;
  } | null,
  isAuthenticated: false,
  isLoading: false,
  login: mockLogin,
  logout: vi.fn(),
};

vi.mock("@/hooks/data/use-auth", () => ({
  useAuth: () => mockAuth,
}));

const mockApiPost = vi.fn();
vi.mock("@/lib/api-client", () => ({
  apiPost: (...args: unknown[]) => mockApiPost(...args),
}));

const mockShareManagement = {
  links: [] as any[],
  members: [] as any[],
  isLoading: false,
  refetch: vi.fn(),
  revokeLink: vi.fn(),
  changeMemberRole: vi.fn(),
  removeMember: vi.fn(),
};

vi.mock("@/hooks/data/use-share-management", () => ({
  useShareManagement: () => mockShareManagement,
}));

function renderShareDialog(overrides = {}) {
  return renderWithDocument(
    <ShareDialog open={true} onOpenChange={vi.fn()} documentId="test-document-123" />,
    overrides,
  );
}

describe("ShareDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockApiPost.mockReset();
    mockShareManagement.links = [];
    mockShareManagement.members = [];
    mockShareManagement.isLoading = false;
    mockShareManagement.refetch = vi.fn();
    mockShareManagement.revokeLink = vi.fn();
    mockShareManagement.changeMemberRole = vi.fn();
    mockShareManagement.removeMember = vi.fn();
    mockAuth.isAuthenticated = true;
    mockAuth.user = {
      id: "1",
      email: "test@test.com",
      name: "Test User",
      avatarUrl: "",
    };
    mockAuth.login = mockLogin;
  });

  describe("when opened and authenticated", () => {
    it("then shows sharing options", () => {
      renderShareDialog();
      expect(screen.getByText("Share document")).toBeInTheDocument();
      expect(screen.getByTestId("shareReadonlyButton")).toBeInTheDocument();
      expect(screen.getByTestId("shareEditButton")).toBeInTheDocument();
    });

    it("then shows the expiry dropdown", () => {
      renderShareDialog();
      expect(screen.getByTestId("expirySelect")).toBeInTheDocument();
      expect(screen.getByText("Link expiry")).toBeInTheDocument();
    });
  });

  describe("when open is false", () => {
    it("then does not render the dialog", () => {
      renderWithDocument(
        <ShareDialog open={false} onOpenChange={vi.fn()} documentId="test-document-123" />,
      );
      expect(screen.queryByText("Share document")).not.toBeInTheDocument();
    });
  });

  describe("when read-only sharing is selected", () => {
    it("then creates a read-only share link and copies it to clipboard", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      mockApiPost.mockResolvedValue({
        code: "ABC123",
        url: "/s/ABC123",
      });

      renderShareDialog();
      fireEvent.click(screen.getByTestId("shareReadonlyButton"));

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("/api/share", {
          documentId: "test-document-123",
          access: "readonly",
        });
      });

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/s/ABC123"));
      });
    });

    it("then passes expiresAt when expiry is set", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      mockApiPost.mockResolvedValue({
        code: "ABC123",
        url: "/s/ABC123",
      });

      renderShareDialog();

      // Set expiry to 7 days
      fireEvent.change(screen.getByTestId("expirySelect"), {
        target: { value: "7" },
      });

      fireEvent.click(screen.getByTestId("shareReadonlyButton"));

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith(
          "/api/share",
          expect.objectContaining({
            documentId: "test-document-123",
            access: "readonly",
            expiresAt: expect.any(String),
          }),
        );
      });
    });
  });

  describe("when edit sharing is selected", () => {
    it("then creates an edit share link and copies it to clipboard", async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, { clipboard: { writeText } });

      mockApiPost.mockResolvedValue({
        code: "XYZ789",
        url: "/s/XYZ789",
      });

      renderShareDialog();
      fireEvent.click(screen.getByTestId("shareEditButton"));

      await waitFor(() => {
        expect(mockApiPost).toHaveBeenCalledWith("/api/share", {
          documentId: "test-document-123",
          access: "edit",
        });
      });

      await waitFor(() => {
        expect(writeText).toHaveBeenCalledWith(expect.stringContaining("/s/XYZ789"));
      });
    });
  });

  describe("when user is not authenticated", () => {
    beforeEach(() => {
      mockAuth.isAuthenticated = false;
      mockAuth.user = null;
    });

    it("then shows login prompt instead of share options", () => {
      renderShareDialog();
      expect(screen.getByText("Share document")).toBeInTheDocument();
      expect(
        screen.getByText("Sign in to generate a share link for this document."),
      ).toBeInTheDocument();
      expect(screen.getByTestId("shareLoginPrompt")).toBeInTheDocument();
      expect(screen.queryByTestId("shareReadonlyButton")).not.toBeInTheDocument();
      expect(screen.queryByTestId("shareEditButton")).not.toBeInTheDocument();
    });

    it("then clicking Google login calls login with google", () => {
      renderShareDialog();
      fireEvent.click(screen.getByText("Sign in with Google"));
      expect(mockLogin).toHaveBeenCalledWith("google");
    });

    it("then clicking GitHub login calls login with github", () => {
      renderShareDialog();
      fireEvent.click(screen.getByText("Sign in with GitHub"));
      expect(mockLogin).toHaveBeenCalledWith("github");
    });
  });

  describe("active links section", () => {
    it("shows active links with full URLs when links exist", () => {
      mockShareManagement.links = [
        {
          code: "ABC123",
          access: "edit",
          createdAt: "2026-01-01",
          expiresAt: null,
          createdBy: null,
        },
        {
          code: "DEF456",
          access: "readonly",
          createdAt: "2026-01-02",
          expiresAt: null,
          createdBy: null,
        },
      ];

      renderShareDialog();
      expect(screen.getByTestId("shareLinksList")).toBeInTheDocument();
      expect(screen.getByText("Active links")).toBeInTheDocument();
      // Full URLs are displayed instead of just codes
      const linkUrls = screen.getAllByTestId("shareLinkUrl");
      expect(linkUrls).toHaveLength(2);
      expect(linkUrls[0].textContent).toContain("/s/ABC123");
      expect(linkUrls[1].textContent).toContain("/s/DEF456");
    });

    it("shows expiry info on links", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      mockShareManagement.links = [
        {
          code: "EXP1",
          access: "edit",
          createdAt: "2026-01-01",
          expiresAt: futureDate.toISOString(),
          createdBy: null,
        },
        {
          code: "EXP2",
          access: "readonly",
          createdAt: "2026-01-02",
          expiresAt: null,
          createdBy: null,
        },
      ];

      renderShareDialog();
      const expiryElements = screen.getAllByTestId("shareLinkExpiry");
      expect(expiryElements).toHaveLength(2);
      expect(expiryElements[0].textContent).toContain("Expires in");
      expect(expiryElements[1].textContent).toBe("No expiry");
    });

    it("does not show links section when no links exist", () => {
      mockShareManagement.links = [];
      renderShareDialog();
      expect(screen.queryByTestId("shareLinksList")).not.toBeInTheDocument();
    });

    it("opens confirmation dialog when revoke button is clicked", () => {
      mockShareManagement.links = [
        {
          code: "REVOKE1",
          access: "edit",
          createdAt: "2026-01-01",
          expiresAt: null,
          createdBy: null,
        },
      ];

      renderShareDialog();
      const revokeButtons = screen.getAllByTestId("revokeLinkButton");
      fireEvent.click(revokeButtons[0]);

      // Confirmation dialog should appear
      expect(screen.getByTestId("revokeConfirmDialog")).toBeInTheDocument();
      expect(screen.getByText("Revoke share link")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Are you sure you want to revoke this link? Anyone using it will lose access.",
        ),
      ).toBeInTheDocument();
    });

    it("calls revokeLink after confirming revoke", async () => {
      mockShareManagement.links = [
        {
          code: "REVOKE1",
          access: "edit",
          createdAt: "2026-01-01",
          expiresAt: null,
          createdBy: null,
        },
      ];
      mockShareManagement.revokeLink.mockResolvedValue(undefined);

      renderShareDialog();
      const revokeButtons = screen.getAllByTestId("revokeLinkButton");
      fireEvent.click(revokeButtons[0]);

      // Click confirm button in the dialog
      const confirmButton = screen.getByTestId("revokeConfirmButton");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockShareManagement.revokeLink).toHaveBeenCalledWith("REVOKE1");
      });
    });

    it("does not call revokeLink when revoke is cancelled", () => {
      mockShareManagement.links = [
        {
          code: "REVOKE1",
          access: "edit",
          createdAt: "2026-01-01",
          expiresAt: null,
          createdBy: null,
        },
      ];

      renderShareDialog();
      const revokeButtons = screen.getAllByTestId("revokeLinkButton");
      fireEvent.click(revokeButtons[0]);

      // Click cancel button in the dialog
      const cancelButton = screen.getByTestId("revokeCancelButton");
      fireEvent.click(cancelButton);

      expect(mockShareManagement.revokeLink).not.toHaveBeenCalled();
    });
  });

  describe("members section", () => {
    it("shows members when members exist", () => {
      mockShareManagement.members = [
        {
          userId: "1",
          role: "owner",
          name: "Test User",
          email: "test@test.com",
          avatarUrl: "",
        },
        {
          userId: "2",
          role: "editor",
          name: "Other User",
          email: "other@test.com",
          avatarUrl: "",
        },
      ];

      renderShareDialog();
      expect(screen.getByTestId("shareMembersList")).toBeInTheDocument();
      expect(screen.getByText("Members")).toBeInTheDocument();
      expect(screen.getByText("Test User")).toBeInTheDocument();
      expect(screen.getByText("Other User")).toBeInTheDocument();
    });

    it("does not show members section when no members exist", () => {
      mockShareManagement.members = [];
      renderShareDialog();
      expect(screen.queryByTestId("shareMembersList")).not.toBeInTheDocument();
    });

    it("shows (you) for current user", () => {
      mockShareManagement.members = [
        {
          userId: "1",
          role: "owner",
          name: "Test User",
          email: "test@test.com",
          avatarUrl: "",
        },
      ];

      renderShareDialog();
      expect(screen.getByText("(you)")).toBeInTheDocument();
    });

    it("shows role dropdowns and remove buttons for non-owners when user is owner", () => {
      mockShareManagement.members = [
        {
          userId: "1",
          role: "owner",
          name: "Test User",
          email: "test@test.com",
          avatarUrl: "",
        },
        {
          userId: "2",
          role: "editor",
          name: "Editor User",
          email: "editor@test.com",
          avatarUrl: "",
        },
      ];

      renderShareDialog();
      // Should have select dropdowns: 1 for expiry + 1 for the editor role
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(2);
      // Should have a remove button
      expect(screen.getByTestId("removeMemberButton")).toBeInTheDocument();
    });

    it("shows read-only role badges for non-owners when user is not owner", () => {
      // Set user as editor (not owner)
      mockShareManagement.members = [
        {
          userId: "99",
          role: "owner",
          name: "Owner User",
          email: "owner@test.com",
          avatarUrl: "",
        },
        {
          userId: "1",
          role: "editor",
          name: "Test User",
          email: "test@test.com",
          avatarUrl: "",
        },
        {
          userId: "2",
          role: "viewer",
          name: "Viewer User",
          email: "viewer@test.com",
          avatarUrl: "",
        },
      ];

      renderShareDialog();
      // Only the expiry select should appear (1 combobox), no role dropdowns
      const selects = screen.queryAllByRole("combobox");
      expect(selects).toHaveLength(1); // just the expiry select
      expect(screen.queryByTestId("removeMemberButton")).not.toBeInTheDocument();
    });

    it("calls removeMember when remove button is clicked", async () => {
      mockShareManagement.members = [
        {
          userId: "1",
          role: "owner",
          name: "Test User",
          email: "test@test.com",
          avatarUrl: "",
        },
        {
          userId: "2",
          role: "editor",
          name: "Editor User",
          email: "editor@test.com",
          avatarUrl: "",
        },
      ];
      mockShareManagement.removeMember.mockResolvedValue(undefined);

      renderShareDialog();
      fireEvent.click(screen.getByTestId("removeMemberButton"));

      await waitFor(() => {
        expect(mockShareManagement.removeMember).toHaveBeenCalledWith("2");
      });
    });
  });
});
