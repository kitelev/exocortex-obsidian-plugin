import { App } from "obsidian";
import { FleetingNoteModal, FleetingNoteModalResult } from "../../src/presentation/modals/FleetingNoteModal";

describe("FleetingNoteModal", () => {
  let mockApp: App;
  let onSubmit: jest.Mock<void, [FleetingNoteModalResult]>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockApp = {} as App;
    onSubmit = jest.fn();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.body.innerHTML = "";
  });

  const openModal = (): FleetingNoteModal => {
    const modal = new FleetingNoteModal(mockApp, onSubmit);
    modal.open();
    jest.runAllTimers();
    return modal;
  };

  it("shows validation error when label is empty", () => {
    const modal = openModal();

    const createButton = modal.contentEl.querySelector("button.mod-cta") as HTMLButtonElement;
    createButton.click();

    expect(onSubmit).not.toHaveBeenCalled();

    const input = modal.contentEl.querySelector("input") as HTMLInputElement;
    expect(input.classList.contains("exocortex-modal-input--error")).toBe(true);

    const errorMessage = modal.contentEl.querySelector(
      ".exocortex-modal-error-message",
    ) as HTMLDivElement;
    expect(errorMessage.textContent).toBe("Label is required");
    expect(errorMessage.style.display).not.toBe("none");

    modal.close();
  });

  it("clears error state and submits trimmed label", () => {
    const modal = openModal();

    const input = modal.contentEl.querySelector("input") as HTMLInputElement;
    const createButton = modal.contentEl.querySelector("button.mod-cta") as HTMLButtonElement;

    createButton.click();
    expect(onSubmit).not.toHaveBeenCalled();

    input.value = "  Test label  ";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(input.classList.contains("exocortex-modal-input--error")).toBe(false);
    const errorMessage = modal.contentEl.querySelector(
      ".exocortex-modal-error-message",
    ) as HTMLDivElement;
    expect(errorMessage.style.display).toBe("none");
    expect(errorMessage.textContent).toBe("");

    createButton.click();

    expect(onSubmit).toHaveBeenCalledWith({ label: "Test label" });

    modal.close();
  });

  it("returns null label on cancel", () => {
    const modal = openModal();

    const cancelButton = Array.from(
      modal.contentEl.querySelectorAll("button"),
    ).find((button) => button.textContent === "Cancel") as HTMLButtonElement;

    cancelButton.click();

    expect(onSubmit).toHaveBeenCalledWith({ label: null });
  });

  it("submits when pressing Enter", () => {
    const modal = openModal();

    const input = modal.contentEl.querySelector("input") as HTMLInputElement;
    input.value = "Keyboard submit";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));

    expect(onSubmit).toHaveBeenCalledWith({ label: "Keyboard submit" });
  });
});
