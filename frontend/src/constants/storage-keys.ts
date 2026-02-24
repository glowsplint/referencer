/** Centralized localStorage key constants used across the application. */

export const STORAGE_KEYS = {
  /** User display name for collaboration presence. */
  USER_NAME: "referencer-user-name",
  /** Hub page view mode (grid/list). */
  HUB_VIEW_MODE: "hub-view-mode",
  /** Hub page sort configuration. */
  HUB_SORT: "hub-sort",
  /** Prefix for collapsed annotation IDs, suffixed with workspaceId. */
  COLLAPSED_PREFIX: "referencer-collapsed-",
  /** User-defined custom colors. */
  CUSTOM_COLORS: "referencer-custom-colors",
  /** Persisted editor/UI settings. */
  SETTINGS: "referencer-settings",
  /** i18next language selection. */
  LANGUAGE: "referencer-language",
  /** Prefix for tour completion status, suffixed with tourId. */
  TOUR_STATUS: "referencer-tour-",
  /** Prefix for folder collapsed state, suffixed with folderId. */
  FOLDER_COLLAPSED_PREFIX: "referencer-folder-collapsed-",
} as const;
