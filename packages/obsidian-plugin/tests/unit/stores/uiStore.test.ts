import { useUIStore, getUIDefaults } from "../../../src/presentation/stores/uiStore";
import type { UISettings } from "../../../src/presentation/stores/types";

const mockStorage: Record<string, string> = {};

const localStorageMock = {
  getItem: jest.fn((key: string) => mockStorage[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: jest.fn(() => {
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
  }),
  length: 0,
  key: jest.fn(),
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("UIStore", () => {
  beforeEach(() => {
    localStorageMock.clear();
    useUIStore.setState({
      showArchived: false,
      showEffortArea: false,
      showEffortVotes: false,
      showFullDateInEffortTimes: false,
      focusMode: false,
    });
  });

  describe("initial state", () => {
    it("should have default values", () => {
      const state = useUIStore.getState();

      expect(state.showArchived).toBe(false);
      expect(state.showEffortArea).toBe(false);
      expect(state.showEffortVotes).toBe(false);
      expect(state.showFullDateInEffortTimes).toBe(false);
      expect(state.focusMode).toBe(false);
    });
  });

  describe("toggleArchived", () => {
    it("should toggle showArchived from false to true", () => {
      expect(useUIStore.getState().showArchived).toBe(false);

      useUIStore.getState().toggleArchived();

      expect(useUIStore.getState().showArchived).toBe(true);
    });

    it("should toggle showArchived from true to false", () => {
      useUIStore.setState({ showArchived: true });
      expect(useUIStore.getState().showArchived).toBe(true);

      useUIStore.getState().toggleArchived();

      expect(useUIStore.getState().showArchived).toBe(false);
    });

    it("should not affect other settings when toggling", () => {
      useUIStore.setState({ showEffortArea: true, showEffortVotes: true });

      useUIStore.getState().toggleArchived();

      expect(useUIStore.getState().showEffortArea).toBe(true);
      expect(useUIStore.getState().showEffortVotes).toBe(true);
    });
  });

  describe("toggleEffortArea", () => {
    it("should toggle showEffortArea from false to true", () => {
      expect(useUIStore.getState().showEffortArea).toBe(false);

      useUIStore.getState().toggleEffortArea();

      expect(useUIStore.getState().showEffortArea).toBe(true);
    });

    it("should toggle showEffortArea from true to false", () => {
      useUIStore.setState({ showEffortArea: true });

      useUIStore.getState().toggleEffortArea();

      expect(useUIStore.getState().showEffortArea).toBe(false);
    });
  });

  describe("toggleEffortVotes", () => {
    it("should toggle showEffortVotes from false to true", () => {
      expect(useUIStore.getState().showEffortVotes).toBe(false);

      useUIStore.getState().toggleEffortVotes();

      expect(useUIStore.getState().showEffortVotes).toBe(true);
    });

    it("should toggle showEffortVotes from true to false", () => {
      useUIStore.setState({ showEffortVotes: true });

      useUIStore.getState().toggleEffortVotes();

      expect(useUIStore.getState().showEffortVotes).toBe(false);
    });
  });

  describe("toggleFullDate", () => {
    it("should toggle showFullDateInEffortTimes from false to true", () => {
      expect(useUIStore.getState().showFullDateInEffortTimes).toBe(false);

      useUIStore.getState().toggleFullDate();

      expect(useUIStore.getState().showFullDateInEffortTimes).toBe(true);
    });

    it("should toggle showFullDateInEffortTimes from true to false", () => {
      useUIStore.setState({ showFullDateInEffortTimes: true });

      useUIStore.getState().toggleFullDate();

      expect(useUIStore.getState().showFullDateInEffortTimes).toBe(false);
    });
  });

  describe("toggleFocusMode", () => {
    it("should toggle focusMode from false to true", () => {
      expect(useUIStore.getState().focusMode).toBe(false);

      useUIStore.getState().toggleFocusMode();

      expect(useUIStore.getState().focusMode).toBe(true);
    });

    it("should toggle focusMode from true to false", () => {
      useUIStore.setState({ focusMode: true });

      useUIStore.getState().toggleFocusMode();

      expect(useUIStore.getState().focusMode).toBe(false);
    });

    it("should not affect other settings when toggling", () => {
      useUIStore.setState({ showEffortArea: true, showEffortVotes: true });

      useUIStore.getState().toggleFocusMode();

      expect(useUIStore.getState().showEffortArea).toBe(true);
      expect(useUIStore.getState().showEffortVotes).toBe(true);
    });
  });

  describe("resetToDefaults", () => {
    it("should reset all settings to defaults", () => {
      useUIStore.setState({
        showArchived: true,
        showEffortArea: true,
        showEffortVotes: true,
        showFullDateInEffortTimes: true,
        focusMode: true,
      });

      useUIStore.getState().resetToDefaults();

      const state = useUIStore.getState();
      expect(state.showArchived).toBe(false);
      expect(state.showEffortArea).toBe(false);
      expect(state.showEffortVotes).toBe(false);
      expect(state.showFullDateInEffortTimes).toBe(false);
      expect(state.focusMode).toBe(false);
    });

    it("should work when already at defaults", () => {
      useUIStore.getState().resetToDefaults();

      const state = useUIStore.getState();
      expect(state.showArchived).toBe(false);
      expect(state.showEffortArea).toBe(false);
      expect(state.showEffortVotes).toBe(false);
      expect(state.showFullDateInEffortTimes).toBe(false);
      expect(state.focusMode).toBe(false);
    });
  });

  describe("multiple toggles", () => {
    it("should handle multiple sequential toggles", () => {
      useUIStore.getState().toggleArchived();
      useUIStore.getState().toggleArchived();
      useUIStore.getState().toggleArchived();

      expect(useUIStore.getState().showArchived).toBe(true);
    });

    it("should handle toggling multiple settings", () => {
      useUIStore.getState().toggleArchived();
      useUIStore.getState().toggleEffortArea();
      useUIStore.getState().toggleEffortVotes();
      useUIStore.getState().toggleFullDate();
      useUIStore.getState().toggleFocusMode();

      const state = useUIStore.getState();
      expect(state.showArchived).toBe(true);
      expect(state.showEffortArea).toBe(true);
      expect(state.showEffortVotes).toBe(true);
      expect(state.showFullDateInEffortTimes).toBe(true);
      expect(state.focusMode).toBe(true);
    });
  });
});

describe("getUIDefaults", () => {
  it("should return default UI settings", () => {
    const defaults = getUIDefaults();

    expect(defaults.showArchived).toBe(false);
    expect(defaults.showEffortArea).toBe(false);
    expect(defaults.showEffortVotes).toBe(false);
    expect(defaults.showFullDateInEffortTimes).toBe(false);
    expect(defaults.focusMode).toBe(false);
  });

  it("should return a new object each time", () => {
    const defaults1 = getUIDefaults();
    const defaults2 = getUIDefaults();

    expect(defaults1).not.toBe(defaults2);
    expect(defaults1).toEqual(defaults2);
  });

  it("should be immutable (modifying returned object does not affect next call)", () => {
    const defaults1 = getUIDefaults();
    defaults1.showArchived = true;

    const defaults2 = getUIDefaults();
    expect(defaults2.showArchived).toBe(false);
  });
});
