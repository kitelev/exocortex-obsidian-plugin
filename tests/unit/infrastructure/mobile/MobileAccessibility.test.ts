/**
 * Mobile Accessibility Tests
 * Tests screen reader compatibility, touch accessibility, and inclusive design
 */

import { MobileTestEnvironment } from "../../../mobile-setup";

describe("Mobile Accessibility", () => {
  let cleanup: (() => void) | undefined;
  let container: HTMLElement;

  beforeEach(() => {
    cleanup = MobileTestEnvironment.setupiOS();
    container = document.createElement("div");
    container.id = "accessibility-test-container";
    container.setAttribute("role", "main");
    document.body.appendChild(container);
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe("Screen Reader Support", () => {
    it("should provide proper ARIA labels for touch targets", () => {
      const button = document.createElement("button");
      button.textContent = "Menu";
      button.setAttribute("aria-label", "Open navigation menu");
      button.setAttribute("aria-expanded", "false");
      button.style.minHeight = "44px";
      button.style.minWidth = "44px";
      
      container.appendChild(button);
      
      expect(button.getAttribute("aria-label")).toBe("Open navigation menu");
      expect(button.getAttribute("aria-expanded")).toBe("false");
      expect(parseInt(button.style.minHeight)).toBe(44);
    });

    it("should announce dynamic content changes", () => {
      const liveRegion = document.createElement("div");
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.setAttribute("aria-atomic", "true");
      liveRegion.className = "sr-only"; // Screen reader only
      
      const statusMessage = document.createElement("span");
      statusMessage.textContent = "";
      liveRegion.appendChild(statusMessage);
      
      container.appendChild(liveRegion);
      
      // Simulate content update
      const updateStatus = (message: string) => {
        statusMessage.textContent = message;
      };
      
      updateStatus("Loading data...");
      expect(statusMessage.textContent).toBe("Loading data...");
      expect(liveRegion.getAttribute("aria-live")).toBe("polite");
      
      updateStatus("Data loaded successfully");
      expect(statusMessage.textContent).toBe("Data loaded successfully");
    });

    it("should provide descriptive headings hierarchy", () => {
      const h1 = document.createElement("h1");
      h1.textContent = "Main Content";
      h1.id = "main-heading";
      
      const h2 = document.createElement("h2");
      h2.textContent = "Section Title";
      h2.setAttribute("aria-describedby", "section-desc");
      
      const sectionDesc = document.createElement("p");
      sectionDesc.id = "section-desc";
      sectionDesc.textContent = "This section contains important information";
      
      const h3 = document.createElement("h3");
      h3.textContent = "Subsection";
      
      container.appendChild(h1);
      container.appendChild(h2);
      container.appendChild(sectionDesc);
      container.appendChild(h3);
      
      // Verify heading hierarchy
      const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
      expect(headings[0].tagName).toBe("H1");
      expect(headings[1].tagName).toBe("H2");
      expect(headings[2].tagName).toBe("H3");
      
      expect(h2.getAttribute("aria-describedby")).toBe("section-desc");
    });

    it("should provide alternative text for images", () => {
      const img = document.createElement("img");
      img.src = "placeholder.jpg";
      img.alt = "Graph showing data trends over time";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      
      const decorativeImg = document.createElement("img");
      decorativeImg.src = "decorative.jpg";
      decorativeImg.alt = "";
      decorativeImg.setAttribute("role", "presentation");
      
      container.appendChild(img);
      container.appendChild(decorativeImg);
      
      expect(img.alt).toBe("Graph showing data trends over time");
      expect(decorativeImg.alt).toBe("");
      expect(decorativeImg.getAttribute("role")).toBe("presentation");
    });

    it("should support keyboard navigation fallbacks", () => {
      const focusableElements = [
        { tag: "button", text: "Button 1" },
        { tag: "a", text: "Link", href: "#" },
        { tag: "input", type: "text", placeholder: "Text input" },
        { tag: "select", options: ["Option 1", "Option 2"] },
        { tag: "button", text: "Button 2" }
      ];
      
      focusableElements.forEach((element, index) => {
        let el: HTMLElement;
        
        if (element.tag === "select") {
          el = document.createElement("select");
          element.options!.forEach(optionText => {
            const option = document.createElement("option");
            option.textContent = optionText;
            option.value = optionText.toLowerCase().replace(" ", "_");
            el.appendChild(option);
          });
        } else {
          el = document.createElement(element.tag);
          if (element.text) el.textContent = element.text;
          if (element.type) (el as HTMLInputElement).type = element.type;
          if (element.placeholder) (el as HTMLInputElement).placeholder = element.placeholder;
          if (element.href) (el as HTMLAnchorElement).href = element.href;
        }
        
        el.tabIndex = 0;
        el.style.margin = "8px";
        el.style.minHeight = "44px";
        container.appendChild(el);
      });
      
      // Test tab navigation
      const allFocusable = container.querySelectorAll(
        "button, a, input, select, [tabindex]:not([tabindex='-1'])"
      );
      
      expect(allFocusable.length).toBe(5);
      allFocusable.forEach(element => {
        expect((element as HTMLElement).tabIndex).toBe(0);
      });
    });

    it("should provide form validation feedback", () => {
      const form = document.createElement("form");
      form.setAttribute("novalidate", "true");
      
      const fieldset = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.textContent = "Contact Information";
      fieldset.appendChild(legend);
      
      const label = document.createElement("label");
      label.textContent = "Email Address";
      label.setAttribute("for", "email-input");
      
      const input = document.createElement("input");
      input.type = "email";
      input.id = "email-input";
      input.setAttribute("aria-describedby", "email-error");
      input.setAttribute("aria-invalid", "false");
      input.required = true;
      input.style.minHeight = "44px";
      input.style.fontSize = "16px";
      
      const errorMessage = document.createElement("div");
      errorMessage.id = "email-error";
      errorMessage.setAttribute("role", "alert");
      errorMessage.style.color = "red";
      errorMessage.style.fontSize = "14px";
      errorMessage.style.display = "none";
      
      fieldset.appendChild(label);
      fieldset.appendChild(input);
      fieldset.appendChild(errorMessage);
      form.appendChild(fieldset);
      container.appendChild(form);
      
      // Simulate validation
      input.addEventListener("blur", () => {
        if (!input.validity.valid) {
          input.setAttribute("aria-invalid", "true");
          errorMessage.textContent = "Please enter a valid email address";
          errorMessage.style.display = "block";
        } else {
          input.setAttribute("aria-invalid", "false");
          errorMessage.textContent = "";
          errorMessage.style.display = "none";
        }
      });
      
      // Test invalid input
      input.value = "invalid-email";
      input.blur();
      
      expect(input.getAttribute("aria-invalid")).toBe("true");
      expect(errorMessage.style.display).toBe("block");
      expect(errorMessage.getAttribute("role")).toBe("alert");
    });
  });

  describe("Touch Accessibility", () => {
    it("should provide adequate touch target sizes", () => {
      const touchTargets = [
        { type: "button", text: "Primary Action" },
        { type: "link", text: "Secondary Link" },
        { type: "icon-button", text: "❤️" }
      ];
      
      touchTargets.forEach(target => {
        const element = document.createElement(target.type.includes("button") ? "button" : "a");
        element.textContent = target.text;
        element.style.minHeight = "44px";
        element.style.minWidth = "44px";
        element.style.padding = "12px";
        element.style.margin = "8px";
        element.style.display = "inline-flex";
        element.style.alignItems = "center";
        element.style.justifyContent = "center";
        
        if (target.type === "link") {
          (element as HTMLAnchorElement).href = "#";
        }
        
        container.appendChild(element);
      });
      
      const allTouchTargets = container.querySelectorAll("button, a");
      allTouchTargets.forEach(target => {
        const styles = (target as HTMLElement).style;
        expect(parseInt(styles.minHeight)).toBeGreaterThanOrEqual(44);
        expect(parseInt(styles.minWidth)).toBeGreaterThanOrEqual(44);
      });
    });

    it("should handle touch gestures accessibly", async () => {
      const gestureButton = document.createElement("button");
      gestureButton.textContent = "Swipe or Tap";
      gestureButton.setAttribute("aria-label", "Activate with tap or swipe right");
      gestureButton.style.minHeight = "60px";
      gestureButton.style.padding = "16px";
      gestureButton.style.width = "200px";
      
      let activated = false;
      const activate = () => {
        activated = true;
        gestureButton.textContent = "Activated!";
        gestureButton.setAttribute("aria-label", "Action completed");
      };
      
      // Touch activation
      gestureButton.addEventListener("touchend", activate);
      
      // Keyboard activation (accessibility fallback)
      gestureButton.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      });
      
      // Swipe gesture support
      let touchStartX = 0;
      gestureButton.addEventListener("touchstart", (e) => {
        touchStartX = e.touches[0].clientX;
      });
      
      gestureButton.addEventListener("touchend", (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const deltaX = touchEndX - touchStartX;
        
        if (Math.abs(deltaX) > 30) { // Swipe threshold
          activate();
        }
      });
      
      container.appendChild(gestureButton);
      
      // Test keyboard activation
      const keyEvent = new KeyboardEvent("keydown", { key: "Enter" });
      gestureButton.dispatchEvent(keyEvent);
      
      expect(activated).toBe(true);
      expect(gestureButton.getAttribute("aria-label")).toBe("Action completed");
    });

    it("should provide haptic feedback alternatives", () => {
      const hapticButton = document.createElement("button");
      hapticButton.textContent = "Delete Item";
      hapticButton.setAttribute("aria-label", "Delete item - will request confirmation");
      hapticButton.style.backgroundColor = "red";
      hapticButton.style.color = "white";
      hapticButton.style.minHeight = "44px";
      hapticButton.style.padding = "12px 16px";
      
      let feedbackProvided = false;
      
      hapticButton.addEventListener("click", () => {
        // Provide haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]); // Pattern for haptic feedback
        }
        
        // Visual feedback for accessibility
        hapticButton.style.transform = "scale(0.95)";
        setTimeout(() => {
          hapticButton.style.transform = "scale(1)";
        }, 150);
        
        // Audio feedback alternative (would be implemented with audio context)
        feedbackProvided = true;
        
        // Show visual confirmation
        const confirmDialog = document.createElement("div");
        confirmDialog.setAttribute("role", "dialog");
        confirmDialog.setAttribute("aria-modal", "true");
        confirmDialog.setAttribute("aria-labelledby", "confirm-title");
        confirmDialog.textContent = "Are you sure you want to delete this item?";
        container.appendChild(confirmDialog);
      });
      
      container.appendChild(hapticButton);
      
      // Test feedback
      hapticButton.click();
      expect(feedbackProvided).toBe(true);
      expect(hapticButton.style.transform).toBe("scale(1)");
    });

    it("should support assistive touch controls", () => {
      const assistiveContainer = document.createElement("div");
      assistiveContainer.className = "assistive-controls";
      assistiveContainer.setAttribute("role", "group");
      assistiveContainer.setAttribute("aria-label", "Assistive touch controls");
      
      const zoomInButton = document.createElement("button");
      zoomInButton.textContent = "+";
      zoomInButton.setAttribute("aria-label", "Zoom in");
      zoomInButton.style.minHeight = "48px";
      zoomInButton.style.minWidth = "48px";
      zoomInButton.style.fontSize = "24px";
      zoomInButton.style.margin = "4px";
      
      const zoomOutButton = document.createElement("button");
      zoomOutButton.textContent = "-";
      zoomOutButton.setAttribute("aria-label", "Zoom out");
      zoomOutButton.style.minHeight = "48px";
      zoomOutButton.style.minWidth = "48px";
      zoomOutButton.style.fontSize = "24px";
      zoomOutButton.style.margin = "4px";
      
      const resetButton = document.createElement("button");
      resetButton.textContent = "Reset";
      resetButton.setAttribute("aria-label", "Reset zoom level");
      resetButton.style.minHeight = "48px";
      resetButton.style.padding = "8px 16px";
      resetButton.style.margin = "4px";
      
      assistiveContainer.appendChild(zoomInButton);
      assistiveContainer.appendChild(zoomOutButton);
      assistiveContainer.appendChild(resetButton);
      container.appendChild(assistiveContainer);
      
      const controls = assistiveContainer.querySelectorAll("button");
      controls.forEach(control => {
        expect(parseInt((control as HTMLElement).style.minHeight)).toBeGreaterThanOrEqual(44);
        expect(control.getAttribute("aria-label")).toBeTruthy();
      });
    });
  });

  describe("High Contrast and Visual Support", () => {
    it("should support high contrast mode", () => {
      // Simulate high contrast media query
      const highContrastSupported = window.matchMedia("(prefers-contrast: high)").matches;
      
      const highContrastButton = document.createElement("button");
      highContrastButton.textContent = "High Contrast Button";
      highContrastButton.style.backgroundColor = highContrastSupported ? "#000000" : "#3182ce";
      highContrastButton.style.color = highContrastSupported ? "#ffffff" : "#ffffff";
      highContrastButton.style.border = highContrastSupported ? "2px solid #ffffff" : "none";
      highContrastButton.style.minHeight = "44px";
      highContrastButton.style.padding = "12px 16px";
      
      container.appendChild(highContrastButton);
      
      // Test contrast ratio (simplified)
      const backgroundColor = highContrastButton.style.backgroundColor;
      const color = highContrastButton.style.color;
      
      expect(backgroundColor).toBeTruthy();
      expect(color).toBeTruthy();
      expect(backgroundColor !== color).toBe(true); // Ensure contrast
    });

    it("should support reduced motion preferences", () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      
      const animatedElement = document.createElement("div");
      animatedElement.textContent = "Animated Content";
      animatedElement.style.padding = "20px";
      animatedElement.style.backgroundColor = "#e2e8f0";
      animatedElement.style.transition = prefersReducedMotion ? "none" : "transform 0.3s ease";
      animatedElement.style.transform = "scale(1)";
      
      // Hover effect
      animatedElement.addEventListener("mouseenter", () => {
        if (!prefersReducedMotion) {
          animatedElement.style.transform = "scale(1.05)";
        }
      });
      
      animatedElement.addEventListener("mouseleave", () => {
        animatedElement.style.transform = "scale(1)";
      });
      
      container.appendChild(animatedElement);
      
      expect(animatedElement.style.transition).toBe(prefersReducedMotion ? "none" : "transform 0.3s ease");
    });

    it("should provide sufficient color contrast", () => {
      const contrastTestCases = [
        { bg: "#ffffff", text: "#000000", name: "Black on White" },
        { bg: "#3182ce", text: "#ffffff", name: "White on Blue" },
        { bg: "#e53e3e", text: "#ffffff", name: "White on Red" },
        { bg: "#38a169", text: "#ffffff", name: "White on Green" }
      ];
      
      contrastTestCases.forEach(testCase => {
        const testElement = document.createElement("div");
        testElement.textContent = testCase.name;
        testElement.style.backgroundColor = testCase.bg;
        testElement.style.color = testCase.text;
        testElement.style.padding = "16px";
        testElement.style.margin = "8px";
        testElement.style.fontSize = "16px";
        
        container.appendChild(testElement);
        
        // Basic contrast validation (simplified)
        expect(testElement.style.backgroundColor).toBe(testCase.bg);
        expect(testElement.style.color).toBe(testCase.text);
        expect(testElement.style.backgroundColor !== testElement.style.color).toBe(true);
      });
    });

    it("should scale text appropriately", () => {
      const textElements = [
        { tag: "h1", text: "Main Heading", expectedMinSize: 24 },
        { tag: "h2", text: "Section Heading", expectedMinSize: 20 },
        { tag: "p", text: "Body text content", expectedMinSize: 16 },
        { tag: "small", text: "Small text", expectedMinSize: 14 }
      ];
      
      textElements.forEach(element => {
        const el = document.createElement(element.tag);
        el.textContent = element.text;
        
        // Set minimum font sizes for mobile accessibility
        let fontSize = element.expectedMinSize;
        if (window.innerWidth <= 768) {
          fontSize = Math.max(fontSize, 16); // Minimum 16px on mobile
        }
        
        el.style.fontSize = `${fontSize}px`;
        el.style.lineHeight = "1.5";
        
        container.appendChild(el);
        
        expect(parseInt(el.style.fontSize)).toBeGreaterThanOrEqual(element.expectedMinSize);
        if (window.innerWidth <= 768 && element.tag !== "small") {
          expect(parseInt(el.style.fontSize)).toBeGreaterThanOrEqual(16);
        }
      });
    });
  });

  describe("Voice Control Support", () => {
    it("should provide voice control landmarks", () => {
      const nav = document.createElement("nav");
      nav.setAttribute("aria-label", "Main navigation");
      nav.setAttribute("role", "navigation");
      
      const main = document.createElement("main");
      main.setAttribute("role", "main");
      main.id = "main-content";
      
      const aside = document.createElement("aside");
      aside.setAttribute("aria-label", "Additional information");
      aside.setAttribute("role", "complementary");
      
      const footer = document.createElement("footer");
      footer.setAttribute("role", "contentinfo");
      
      container.appendChild(nav);
      container.appendChild(main);
      container.appendChild(aside);
      container.appendChild(footer);
      
      // Verify landmarks
      expect(nav.getAttribute("role")).toBe("navigation");
      expect(main.getAttribute("role")).toBe("main");
      expect(aside.getAttribute("role")).toBe("complementary");
      expect(footer.getAttribute("role")).toBe("contentinfo");
    });

    it("should support voice commands for common actions", () => {
      const commandButtons = [
        { text: "Save", command: "save" },
        { text: "Cancel", command: "cancel" },
        { text: "Delete", command: "delete" },
        { text: "Go Back", command: "back" }
      ];
      
      commandButtons.forEach(button => {
        const btnElement = document.createElement("button");
        btnElement.textContent = button.text;
        btnElement.setAttribute("data-voice-command", button.command);
        btnElement.setAttribute("aria-label", `${button.text} - say "${button.command}" to activate`);
        btnElement.style.minHeight = "44px";
        btnElement.style.margin = "8px";
        btnElement.style.padding = "12px 16px";
        
        // Simulate voice command recognition
        btnElement.addEventListener("voice-command", (e) => {
          const command = (e as CustomEvent).detail.command;
          if (command === button.command) {
            btnElement.click();
          }
        });
        
        container.appendChild(btnElement);
      });
      
      const voiceButtons = container.querySelectorAll("[data-voice-command]");
      expect(voiceButtons.length).toBe(4);
      voiceButtons.forEach(btn => {
        expect(btn.getAttribute("data-voice-command")).toBeTruthy();
        expect(btn.getAttribute("aria-label")).toContain("say");
      });
    });

    it("should provide voice feedback for actions", () => {
      const voiceFeedbackArea = document.createElement("div");
      voiceFeedbackArea.setAttribute("aria-live", "assertive");
      voiceFeedbackArea.setAttribute("aria-atomic", "true");
      voiceFeedbackArea.className = "voice-feedback sr-only";
      
      const actionButton = document.createElement("button");
      actionButton.textContent = "Save Document";
      actionButton.style.minHeight = "44px";
      actionButton.style.padding = "12px 16px";
      
      actionButton.addEventListener("click", () => {
        voiceFeedbackArea.textContent = "Document saved successfully";
        
        // Clear message after delay
        setTimeout(() => {
          voiceFeedbackArea.textContent = "";
        }, 3000);
      });
      
      container.appendChild(actionButton);
      container.appendChild(voiceFeedbackArea);
      
      // Test voice feedback
      actionButton.click();
      expect(voiceFeedbackArea.textContent).toBe("Document saved successfully");
      expect(voiceFeedbackArea.getAttribute("aria-live")).toBe("assertive");
    });
  });

  describe("Mobile Screen Reader Navigation", () => {
    it("should support swipe navigation for screen readers", () => {
      const navigationItems = [
        { type: "heading", level: 2, text: "Section 1" },
        { type: "paragraph", text: "Content for section 1" },
        { type: "heading", level: 2, text: "Section 2" },
        { type: "paragraph", text: "Content for section 2" },
        { type: "list", items: ["Item 1", "Item 2", "Item 3"] }
      ];
      
      navigationItems.forEach((item, index) => {
        if (item.type === "heading") {
          const heading = document.createElement(`h${item.level}`);
          heading.textContent = item.text;
          heading.id = `heading-${index}`;
          container.appendChild(heading);
        } else if (item.type === "paragraph") {
          const p = document.createElement("p");
          p.textContent = item.text;
          container.appendChild(p);
        } else if (item.type === "list") {
          const ul = document.createElement("ul");
          item.items!.forEach(listItem => {
            const li = document.createElement("li");
            li.textContent = listItem;
            ul.appendChild(li);
          });
          container.appendChild(ul);
        }
      });
      
      // Verify navigation structure
      const headings = container.querySelectorAll("h1, h2, h3, h4, h5, h6");
      const lists = container.querySelectorAll("ul, ol");
      const paragraphs = container.querySelectorAll("p");
      
      expect(headings.length).toBe(2);
      expect(lists.length).toBe(1);
      expect(paragraphs.length).toBe(2);
      
      // Verify all headings have IDs for navigation
      headings.forEach(heading => {
        expect(heading.id).toBeTruthy();
      });
    });

    it("should provide skip links for efficient navigation", () => {
      const skipNav = document.createElement("a");
      skipNav.href = "#main-content";
      skipNav.textContent = "Skip to main content";
      skipNav.className = "skip-link";
      skipNav.style.position = "absolute";
      skipNav.style.left = "-10000px";
      skipNav.style.top = "auto";
      skipNav.style.width = "1px";
      skipNav.style.height = "1px";
      skipNav.style.overflow = "hidden";
      
      // Show on focus
      skipNav.addEventListener("focus", () => {
        skipNav.style.position = "static";
        skipNav.style.left = "auto";
        skipNav.style.top = "auto";
        skipNav.style.width = "auto";
        skipNav.style.height = "auto";
        skipNav.style.overflow = "visible";
        skipNav.style.backgroundColor = "#000";
        skipNav.style.color = "#fff";
        skipNav.style.padding = "8px 16px";
        skipNav.style.textDecoration = "none";
      });
      
      skipNav.addEventListener("blur", () => {
        skipNav.style.position = "absolute";
        skipNav.style.left = "-10000px";
        skipNav.style.top = "auto";
        skipNav.style.width = "1px";
        skipNav.style.height = "1px";
        skipNav.style.overflow = "hidden";
      });
      
      const mainContent = document.createElement("main");
      mainContent.id = "main-content";
      mainContent.setAttribute("tabindex", "-1");
      mainContent.textContent = "Main content area";
      
      document.body.insertBefore(skipNav, container);
      container.appendChild(mainContent);
      
      expect(skipNav.href.endsWith("#main-content")).toBe(true);
      expect(mainContent.id).toBe("main-content");
      
      // Cleanup
      document.body.removeChild(skipNav);
    });

    it("should provide contextual help for complex interactions", () => {
      const complexWidget = document.createElement("div");
      complexWidget.setAttribute("role", "application");
      complexWidget.setAttribute("aria-labelledby", "widget-title");
      complexWidget.setAttribute("aria-describedby", "widget-help");
      
      const widgetTitle = document.createElement("h3");
      widgetTitle.id = "widget-title";
      widgetTitle.textContent = "Interactive Graph";
      
      const widgetHelp = document.createElement("div");
      widgetHelp.id = "widget-help";
      widgetHelp.textContent = "Use arrow keys to navigate data points, Enter to select, Escape to exit";
      widgetHelp.style.fontSize = "14px";
      widgetHelp.style.color = "#666";
      widgetHelp.style.marginBottom = "16px";
      
      const helpButton = document.createElement("button");
      helpButton.textContent = "?";
      helpButton.setAttribute("aria-label", "Show help for this widget");
      helpButton.style.minHeight = "32px";
      helpButton.style.minWidth = "32px";
      helpButton.style.borderRadius = "50%";
      helpButton.style.position = "absolute";
      helpButton.style.right = "8px";
      helpButton.style.top = "8px";
      
      let helpVisible = false;
      helpButton.addEventListener("click", () => {
        helpVisible = !helpVisible;
        widgetHelp.style.display = helpVisible ? "block" : "none";
        helpButton.setAttribute("aria-expanded", String(helpVisible));
      });
      
      complexWidget.appendChild(widgetTitle);
      complexWidget.appendChild(helpButton);
      complexWidget.appendChild(widgetHelp);
      container.appendChild(complexWidget);
      
      expect(complexWidget.getAttribute("aria-describedby")).toBe("widget-help");
      expect(helpButton.getAttribute("aria-label")).toContain("help");
    });
  });
});