export interface ExocortexSettings {
  showPropertiesSection: boolean;
  layoutVisible: boolean;
  showArchivedAssets: boolean;
  activeFocusArea: string | null;
  showEffortArea: boolean;
  showEffortVotes: boolean;
}

export const DEFAULT_SETTINGS: ExocortexSettings = {
  showPropertiesSection: true,
  layoutVisible: true,
  showArchivedAssets: false,
  activeFocusArea: null,
  showEffortArea: false,
  showEffortVotes: false,
};
