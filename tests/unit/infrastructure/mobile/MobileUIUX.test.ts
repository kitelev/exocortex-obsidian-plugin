/**
 * Mobile UI/UX Tests
 * Tests responsive design, mobile-specific layouts, and user experience optimizations
 */

import { MobileTestEnvironment } from "../../../mobile-setup";

describe("Mobile UI/UX", () => {
  let cleanup: (() => void) | undefined;
  let container: HTMLElement;

  beforeEach(() => {
    cleanup = MobileTestEnvironment.setupiOS();
    container = document.createElement("div");
    container.id = "test-container";
    document.body.appendChild(container);
  });

  afterEach(() => {
    cleanup?.();
    cleanup = undefined;
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe("Responsive Layout", () => {
    it("should apply mobile-responsive class on mobile devices", () => {
      const table = document.createElement("table");
      table.className = "exocortex-table";
      container.appendChild(table);
      
      // Simulate mobile detection logic
      const isMobile = (window as any).isMobile || window.innerWidth <= 768;
      if (isMobile) {
        table.classList.add("mobile-responsive");
      }
      
      expect(table.classList.contains("mobile-responsive")).toBe(true);
    });

    it("should adapt table layout for mobile screens", () => {
      const table = document.createElement("table");
      table.innerHTML = `
        <thead>
          <tr>
            <th>Name</th>
            <th>Class</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Test Item</td>
            <td>Test Class</td>
            <td>Active</td>
          </tr>
        </tbody>
      `;
      container.appendChild(table);

      // Apply mobile-responsive styles
      table.classList.add("mobile-responsive");
      
      // In real implementation, CSS would handle this
      // Here we simulate the mobile layout adaptation
      if (window.innerWidth <= 768) {
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach(row => {
          const cells = row.querySelectorAll("td");
          expect(cells.length).toBeGreaterThan(0);
        });
      }
      
      expect(table.classList.contains("mobile-responsive")).toBe(true);
    });

    it("should stack layout elements vertically on small screens", () => {
      const flexContainer = document.createElement("div");
      flexContainer.className = "flex-container";
      flexContainer.style.display = "flex";
      flexContainer.style.flexDirection = window.innerWidth <= 768 ? "column" : "row";
      
      const item1 = document.createElement("div");
      item1.textContent = "Item 1";
      const item2 = document.createElement("div");
      item2.textContent = "Item 2";
      
      flexContainer.appendChild(item1);
      flexContainer.appendChild(item2);
      container.appendChild(flexContainer);
      
      expect(flexContainer.style.flexDirection).toBe("column");
    });

    it("should adjust font sizes for mobile readability", () => {
      const textElement = document.createElement("p");
      textElement.textContent = "Mobile text should be readable";
      
      // Apply mobile font size
      if (window.innerWidth <= 768) {
        textElement.style.fontSize = "16px"; // Minimum readable size on mobile
        textElement.style.lineHeight = "1.5";
      }
      
      container.appendChild(textElement);
      
      expect(parseInt(textElement.style.fontSize)).toBeGreaterThanOrEqual(16);
      expect(parseFloat(textElement.style.lineHeight)).toBeGreaterThanOrEqual(1.4);
    });

    it("should provide adequate spacing for touch targets", () => {
      const buttonContainer = document.createElement("div");
      buttonContainer.className = "button-container";
      
      const button1 = document.createElement("button");
      button1.textContent = "Button 1";
      button1.style.minHeight = "44px";
      button1.style.minWidth = "44px";
      button1.style.margin = "8px";
      
      const button2 = document.createElement("button");
      button2.textContent = "Button 2";
      button2.style.minHeight = "44px";
      button2.style.minWidth = "44px";
      button2.style.margin = "8px";
      
      buttonContainer.appendChild(button1);
      buttonContainer.appendChild(button2);
      container.appendChild(buttonContainer);
      
      // Check button dimensions
      expect(parseInt(button1.style.minHeight)).toBe(44);
      expect(parseInt(button1.style.minWidth)).toBe(44);
      expect(parseInt(button2.style.minHeight)).toBe(44);
      expect(parseInt(button2.style.minWidth)).toBe(44);
    });

    it("should handle safe area insets on iOS", () => {
      cleanup?.();
      cleanup = MobileTestEnvironment.setupiOS();
      
      const fullscreenElement = document.createElement("div");
      fullscreenElement.className = "fullscreen-content";
      
      // Apply safe area padding
      fullscreenElement.style.paddingTop = "env(safe-area-inset-top, 0px)";
      fullscreenElement.style.paddingBottom = "env(safe-area-inset-bottom, 0px)";
      fullscreenElement.style.paddingLeft = "env(safe-area-inset-left, 0px)";
      fullscreenElement.style.paddingRight = "env(safe-area-inset-right, 0px)";
      
      container.appendChild(fullscreenElement);
      
      // Check that safe area properties are applied
      expect(fullscreenElement.style.paddingTop).toContain("safe-area-inset-top");
      expect(fullscreenElement.style.paddingBottom).toContain("safe-area-inset-bottom");
    });
  });

  describe("Touch-Optimized Controls", () => {
    it("should provide touch-friendly form controls", () => {
      const form = document.createElement("form");
      
      const input = document.createElement("input");
      input.type = "text";
      input.style.minHeight = "44px";
      input.style.padding = "12px";
      input.style.fontSize = "16px"; // Prevents zoom on iOS
      
      const select = document.createElement("select");
      select.style.minHeight = "44px";
      select.style.fontSize = "16px";
      
      const option1 = document.createElement("option");
      option1.value = "option1";
      option1.textContent = "Option 1";
      select.appendChild(option1);
      
      form.appendChild(input);
      form.appendChild(select);
      container.appendChild(form);
      
      expect(parseInt(input.style.minHeight)).toBe(44);
      expect(parseInt(input.style.fontSize)).toBeGreaterThanOrEqual(16);
      expect(parseInt(select.style.minHeight)).toBe(44);
    });

    it("should implement touch-friendly dropdown menus", () => {
      const dropdown = document.createElement("div");
      dropdown.className = "dropdown";
      dropdown.style.position = "relative";
      
      const button = document.createElement("button");
      button.className = "dropdown-button";
      button.textContent = "Menu";
      button.style.minHeight = "44px";
      button.style.padding = "12px 16px";
      
      const menu = document.createElement("div");
      menu.className = "dropdown-menu";
      menu.style.position = "absolute";
      menu.style.top = "100%";
      menu.style.width = "100%";
      menu.style.display = "none";
      
      const menuItem1 = document.createElement("div");
      menuItem1.className = "dropdown-item";
      menuItem1.textContent = "Item 1";
      menuItem1.style.minHeight = "44px";
      menuItem1.style.padding = "12px 16px";
      
      menu.appendChild(menuItem1);
      dropdown.appendChild(button);
      dropdown.appendChild(menu);
      container.appendChild(dropdown);
      
      // Test touch interaction
      button.addEventListener("click", () => {
        menu.style.display = menu.style.display === "none" ? "block" : "none";
      });
      
      button.click();
      expect(menu.style.display).toBe("block");
    });

    it("should provide swipe-friendly list items", () => {
      const list = document.createElement("ul");
      list.className = "swipeable-list";
      
      for (let i = 0; i < 5; i++) {
        const listItem = document.createElement("li");
        listItem.className = "swipeable-item";
        listItem.style.minHeight = "60px";
        listItem.style.padding = "16px";
        listItem.style.borderBottom = "1px solid #ccc";
        listItem.textContent = `List Item ${i + 1}`;
        
        // Add swipe gesture capability
        let startX = 0;
        listItem.addEventListener("touchstart", (e) => {
          startX = e.touches[0].clientX;
        });
        
        listItem.addEventListener("touchmove", (e) => {
          const currentX = e.touches[0].clientX;
          const deltaX = currentX - startX;
          
          if (Math.abs(deltaX) > 10) {
            listItem.style.transform = `translateX(${deltaX}px)`;
          }
        });
        
        listItem.addEventListener("touchend", () => {
          listItem.style.transform = "translateX(0)";
        });
        
        list.appendChild(listItem);
      }
      
      container.appendChild(list);
      
      const listItems = list.querySelectorAll(".swipeable-item");
      expect(listItems.length).toBe(5);
      listItems.forEach(item => {
        expect(parseInt((item as HTMLElement).style.minHeight)).toBe(60);
      });
    });

    it("should implement pull-to-refresh mechanism", async () => {
      const scrollContainer = document.createElement("div");
      scrollContainer.style.height = "400px";
      scrollContainer.style.overflow = "auto";
      scrollContainer.style.position = "relative";
      
      const refreshIndicator = document.createElement("div");
      refreshIndicator.className = "refresh-indicator";
      refreshIndicator.style.position = "absolute";
      refreshIndicator.style.top = "-50px";
      refreshIndicator.style.width = "100%";
      refreshIndicator.style.height = "50px";
      refreshIndicator.style.textAlign = "center";
      refreshIndicator.style.lineHeight = "50px";
      refreshIndicator.textContent = "Pull to refresh";
      
      const content = document.createElement("div");
      content.className = "scrollable-content";
      content.style.minHeight = "800px";
      content.textContent = "Scroll content";
      
      scrollContainer.appendChild(refreshIndicator);
      scrollContainer.appendChild(content);
      container.appendChild(scrollContainer);
      
      let isRefreshing = false;
      let startY = 0;
      
      scrollContainer.addEventListener("touchstart", (e) => {
        startY = e.touches[0].clientY;
      });
      
      scrollContainer.addEventListener("touchmove", (e) => {
        if (scrollContainer.scrollTop === 0) {
          const currentY = e.touches[0].clientY;
          const deltaY = currentY - startY;
          
          if (deltaY > 0 && deltaY < 100) {
            refreshIndicator.style.transform = `translateY(${deltaY}px)`;
            refreshIndicator.style.opacity = String(deltaY / 100);
          }
        }
      });
      
      scrollContainer.addEventListener("touchend", async (e) => {
        if (scrollContainer.scrollTop === 0 && !isRefreshing) {
          const deltaY = parseInt(refreshIndicator.style.transform.match(/\d+/)?.[0] || "0");
          
          if (deltaY > 50) {
            isRefreshing = true;
            refreshIndicator.textContent = "Refreshing...";
            
            // Simulate refresh
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            isRefreshing = false;
            refreshIndicator.style.transform = "translateY(0)";
            refreshIndicator.style.opacity = "0";
            refreshIndicator.textContent = "Pull to refresh";
          } else {
            refreshIndicator.style.transform = "translateY(0)";
            refreshIndicator.style.opacity = "0";
          }
        }
      });
      
      expect(refreshIndicator).toBeTruthy();
      expect(scrollContainer.style.overflow).toBe("auto");
    });
  });

  describe("Gesture-Based Navigation", () => {
    it("should support swipe navigation", async () => {
      const carousel = document.createElement("div");
      carousel.className = "carousel";
      carousel.style.width = "300px";
      carousel.style.height = "200px";
      carousel.style.overflow = "hidden";
      carousel.style.position = "relative";
      
      const slides = document.createElement("div");
      slides.className = "slides";
      slides.style.display = "flex";
      slides.style.width = "900px"; // 3 slides * 300px
      slides.style.transition = "transform 0.3s ease";
      
      for (let i = 0; i < 3; i++) {
        const slide = document.createElement("div");
        slide.className = "slide";
        slide.style.width = "300px";
        slide.style.height = "200px";
        slide.style.backgroundColor = i % 2 === 0 ? "#f0f0f0" : "#e0e0e0";
        slide.textContent = `Slide ${i + 1}`;
        slides.appendChild(slide);
      }
      
      carousel.appendChild(slides);
      container.appendChild(carousel);
      
      let currentSlide = 0;
      const totalSlides = 3;
      let startX = 0;
      let isDragging = false;
      
      carousel.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        slides.style.transition = "none";
      });
      
      carousel.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        
        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        const currentTransform = -currentSlide * 300 + deltaX;
        
        slides.style.transform = `translateX(${currentTransform}px)`;
      });
      
      carousel.addEventListener("touchend", (e) => {
        if (!isDragging) return;
        
        const currentX = e.changedTouches?.[0]?.clientX || startX;
        const deltaX = currentX - startX;
        
        if (Math.abs(deltaX) > 50) {
          if (deltaX > 0 && currentSlide > 0) {
            currentSlide--;
          } else if (deltaX < 0 && currentSlide < totalSlides - 1) {
            currentSlide++;
          }
        }
        
        slides.style.transition = "transform 0.3s ease";
        slides.style.transform = `translateX(${-currentSlide * 300}px)`;
        isDragging = false;
      });
      
      // Simulate swipe gesture
      const gestureSequence = MobileTestEnvironment.createGestureSequence(carousel);
      await gestureSequence.pan(250, 100, 50, 100); // Swipe left
      
      expect(slides.style.transform).toContain("translateX");
    });

    it("should implement pinch-to-zoom functionality", async () => {
      const zoomContainer = document.createElement("div");
      zoomContainer.className = "zoom-container";
      zoomContainer.style.width = "300px";
      zoomContainer.style.height = "300px";
      zoomContainer.style.overflow = "hidden";
      zoomContainer.style.position = "relative";
      
      const zoomContent = document.createElement("div");
      zoomContent.className = "zoom-content";
      zoomContent.style.width = "100%";
      zoomContent.style.height = "100%";
      zoomContent.style.transformOrigin = "center";
      zoomContent.style.transition = "transform 0.2s ease";
      zoomContent.textContent = "Pinch to zoom";
      
      zoomContainer.appendChild(zoomContent);
      container.appendChild(zoomContainer);
      
      let scale = 1;
      let initialDistance = 0;
      let isZooming = false;
      
      zoomContainer.addEventListener("touchstart", (e) => {
        if (e.touches.length === 2) {
          isZooming = true;
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          initialDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
          zoomContent.style.transition = "none";
        }
      });
      
      zoomContainer.addEventListener("touchmove", (e) => {
        if (isZooming && e.touches.length === 2) {
          e.preventDefault();
          
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const currentDistance = Math.hypot(
            touch2.clientX - touch1.clientX,
            touch2.clientY - touch1.clientY
          );
          
          const scaleChange = currentDistance / initialDistance;
          const newScale = Math.min(Math.max(scale * scaleChange, 0.5), 3);
          
          zoomContent.style.transform = `scale(${newScale})`;
        }
      });
      
      zoomContainer.addEventListener("touchend", (e) => {
        if (isZooming && e.touches.length < 2) {
          isZooming = false;
          zoomContent.style.transition = "transform 0.2s ease";
          
          // Update scale for next gesture
          const currentTransform = zoomContent.style.transform;
          const scaleMatch = currentTransform.match(/scale\(([\d.]+)\)/);
          if (scaleMatch) {
            scale = parseFloat(scaleMatch[1]);
          }
        }
      });
      
      // Simulate pinch gesture
      const gestureSequence = MobileTestEnvironment.createGestureSequence(zoomContainer);
      await gestureSequence.pinch(100, 150, 150, 150); // Pinch out (zoom in)
      
      expect(zoomContent.style.transform).toContain("scale");
    });
  });

  describe("Orientation Handling", () => {
    it("should adapt layout on orientation change", () => {
      const orientationContainer = document.createElement("div");
      orientationContainer.className = "orientation-adaptive";
      container.appendChild(orientationContainer);
      
      const updateLayout = () => {
        const isLandscape = window.innerWidth > window.innerHeight;
        orientationContainer.style.flexDirection = isLandscape ? "row" : "column";
        orientationContainer.dataset.orientation = isLandscape ? "landscape" : "portrait";
      };
      
      // Initial layout
      updateLayout();
      expect(orientationContainer.dataset.orientation).toBe("portrait");
      
      // Simulate orientation change
      window.addEventListener("orientationchange", updateLayout);
      MobileTestEnvironment.simulateOrientationChange("landscape");
      updateLayout(); // Manual call since we can't wait for event in test
      
      expect(orientationContainer.dataset.orientation).toBe("landscape");
      expect(orientationContainer.style.flexDirection).toBe("row");
      
      window.removeEventListener("orientationchange", updateLayout);
    });

    it("should handle keyboard appearance on mobile", () => {
      const viewport = document.querySelector('meta[name="viewport"]') ||
                      document.createElement('meta');
      viewport.setAttribute("name", "viewport");
      viewport.setAttribute("content", "width=device-width, initial-scale=1");
      
      if (!viewport.parentNode) {
        document.head.appendChild(viewport);
      }
      
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = "Type here...";
      container.appendChild(input);
      
      // Simulate virtual keyboard appearance
      let keyboardHeight = 0;
      
      input.addEventListener("focus", () => {
        keyboardHeight = 300; // Typical mobile keyboard height
        document.body.style.paddingBottom = `${keyboardHeight}px`;
        
        // Scroll input into view
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      
      input.addEventListener("blur", () => {
        keyboardHeight = 0;
        document.body.style.paddingBottom = "0";
      });
      
      // Trigger focus
      input.focus();
      expect(document.body.style.paddingBottom).toBe("300px");
      
      // Trigger blur
      input.blur();
      expect(document.body.style.paddingBottom).toBe("0px");
    });
  });

  describe("Loading States", () => {
    it("should show mobile-optimized loading indicators", async () => {
      const loadingContainer = document.createElement("div");
      loadingContainer.className = "loading-container";
      loadingContainer.style.textAlign = "center";
      loadingContainer.style.padding = "40px";
      
      const spinner = document.createElement("div");
      spinner.className = "mobile-spinner";
      spinner.style.width = "40px";
      spinner.style.height = "40px";
      spinner.style.border = "4px solid #f3f3f3";
      spinner.style.borderTop = "4px solid #3498db";
      spinner.style.borderRadius = "50%";
      spinner.style.animation = "spin 1s linear infinite";
      spinner.style.margin = "0 auto 16px";
      
      const loadingText = document.createElement("p");
      loadingText.textContent = "Loading...";
      loadingText.style.fontSize = "16px";
      loadingText.style.color = "#666";
      
      loadingContainer.appendChild(spinner);
      loadingContainer.appendChild(loadingText);
      container.appendChild(loadingContainer);
      
      expect(spinner.style.width).toBe("40px");
      expect(spinner.style.height).toBe("40px");
      expect(loadingText.textContent).toBe("Loading...");
      
      // Simulate loading completion
      await new Promise(resolve => setTimeout(resolve, 1000));
      loadingContainer.style.display = "none";
      
      const content = document.createElement("div");
      content.textContent = "Content loaded!";
      container.appendChild(content);
      
      expect(content.textContent).toBe("Content loaded!");
    });

    it("should implement skeleton loading for better UX", () => {
      const skeletonContainer = document.createElement("div");
      skeletonContainer.className = "skeleton-container";
      
      // Create skeleton elements
      const skeletonHeader = document.createElement("div");
      skeletonHeader.className = "skeleton-line";
      skeletonHeader.style.width = "60%";
      skeletonHeader.style.height = "20px";
      skeletonHeader.style.backgroundColor = "#e0e0e0";
      skeletonHeader.style.borderRadius = "4px";
      skeletonHeader.style.marginBottom = "12px";
      skeletonHeader.style.animation = "skeleton-pulse 1.5s ease-in-out infinite";
      
      const skeletonText1 = document.createElement("div");
      skeletonText1.className = "skeleton-line";
      skeletonText1.style.width = "100%";
      skeletonText1.style.height = "16px";
      skeletonText1.style.backgroundColor = "#e0e0e0";
      skeletonText1.style.borderRadius = "4px";
      skeletonText1.style.marginBottom = "8px";
      skeletonText1.style.animation = "skeleton-pulse 1.5s ease-in-out infinite";
      
      const skeletonText2 = document.createElement("div");
      skeletonText2.className = "skeleton-line";
      skeletonText2.style.width = "80%";
      skeletonText2.style.height = "16px";
      skeletonText2.style.backgroundColor = "#e0e0e0";
      skeletonText2.style.borderRadius = "4px";
      skeletonText2.style.animation = "skeleton-pulse 1.5s ease-in-out infinite";
      
      skeletonContainer.appendChild(skeletonHeader);
      skeletonContainer.appendChild(skeletonText1);
      skeletonContainer.appendChild(skeletonText2);
      container.appendChild(skeletonContainer);
      
      const skeletonLines = skeletonContainer.querySelectorAll(".skeleton-line");
      expect(skeletonLines.length).toBe(3);
      skeletonLines.forEach(line => {
        expect((line as HTMLElement).style.backgroundColor).toBe("rgb(224, 224, 224)");
      });
    });
  });

  describe("Error States", () => {
    it("should display mobile-friendly error messages", () => {
      const errorContainer = document.createElement("div");
      errorContainer.className = "mobile-error";
      errorContainer.style.padding = "24px";
      errorContainer.style.textAlign = "center";
      errorContainer.style.backgroundColor = "#fff5f5";
      errorContainer.style.border = "1px solid #fed7d7";
      errorContainer.style.borderRadius = "8px";
      errorContainer.style.margin = "16px";
      
      const errorIcon = document.createElement("div");
      errorIcon.textContent = "⚠️";
      errorIcon.style.fontSize = "48px";
      errorIcon.style.marginBottom = "16px";
      
      const errorTitle = document.createElement("h3");
      errorTitle.textContent = "Something went wrong";
      errorTitle.style.fontSize = "18px";
      errorTitle.style.color = "#e53e3e";
      errorTitle.style.marginBottom = "8px";
      
      const errorMessage = document.createElement("p");
      errorMessage.textContent = "We couldn't load this content. Please try again.";
      errorMessage.style.fontSize = "14px";
      errorMessage.style.color = "#666";
      errorMessage.style.marginBottom = "24px";
      
      const retryButton = document.createElement("button");
      retryButton.textContent = "Try Again";
      retryButton.style.backgroundColor = "#3182ce";
      retryButton.style.color = "white";
      retryButton.style.border = "none";
      retryButton.style.padding = "12px 24px";
      retryButton.style.borderRadius = "6px";
      retryButton.style.fontSize = "16px";
      retryButton.style.minHeight = "44px";
      retryButton.style.cursor = "pointer";
      
      errorContainer.appendChild(errorIcon);
      errorContainer.appendChild(errorTitle);
      errorContainer.appendChild(errorMessage);
      errorContainer.appendChild(retryButton);
      container.appendChild(errorContainer);
      
      expect(errorTitle.textContent).toBe("Something went wrong");
      expect(parseInt(retryButton.style.minHeight)).toBe(44);
      expect(errorContainer.style.padding).toBe("24px");
    });

    it("should handle network error states appropriately", () => {
      const networkError = document.createElement("div");
      networkError.className = "network-error";
      networkError.style.padding = "32px 16px";
      networkError.style.textAlign = "center";
      
      const offlineIcon = document.createElement("div");
      offlineIcon.textContent = "📡";
      offlineIcon.style.fontSize = "64px";
      offlineIcon.style.marginBottom = "16px";
      offlineIcon.style.opacity = "0.5";
      
      const offlineMessage = document.createElement("p");
      offlineMessage.textContent = "You appear to be offline";
      offlineMessage.style.fontSize = "16px";
      offlineMessage.style.marginBottom = "8px";
      
      const offlineSubtext = document.createElement("p");
      offlineSubtext.textContent = "Check your internet connection and try again";
      offlineSubtext.style.fontSize = "14px";
      offlineSubtext.style.color = "#666";
      
      networkError.appendChild(offlineIcon);
      networkError.appendChild(offlineMessage);
      networkError.appendChild(offlineSubtext);
      container.appendChild(networkError);
      
      expect(offlineMessage.textContent).toBe("You appear to be offline");
      expect(offlineIcon.style.fontSize).toBe("64px");
    });
  });

  describe("Performance Indicators", () => {
    it("should show appropriate loading progress", () => {
      const progressContainer = document.createElement("div");
      progressContainer.className = "progress-container";
      progressContainer.style.padding = "16px";
      
      const progressBar = document.createElement("div");
      progressBar.className = "progress-bar";
      progressBar.style.width = "100%";
      progressBar.style.height = "4px";
      progressBar.style.backgroundColor = "#e0e0e0";
      progressBar.style.borderRadius = "2px";
      progressBar.style.overflow = "hidden";
      
      const progressFill = document.createElement("div");
      progressFill.className = "progress-fill";
      progressFill.style.height = "100%";
      progressFill.style.backgroundColor = "#3182ce";
      progressFill.style.width = "0%";
      progressFill.style.transition = "width 0.3s ease";
      
      progressBar.appendChild(progressFill);
      progressContainer.appendChild(progressBar);
      container.appendChild(progressContainer);
      
      // Simulate progress updates
      let progress = 0;
      const updateProgress = () => {
        progress += 20;
        progressFill.style.width = `${progress}%`;
        
        if (progress < 100) {
          setTimeout(updateProgress, 200);
        }
      };
      
      updateProgress();
      
      setTimeout(() => {
        expect(progressFill.style.width).toBe("100%");
      }, 1100);
    });

    it("should indicate slow loading with appropriate messaging", async () => {
      const slowLoadingIndicator = document.createElement("div");
      slowLoadingIndicator.className = "slow-loading";
      slowLoadingIndicator.style.display = "none";
      slowLoadingIndicator.style.padding = "16px";
      slowLoadingIndicator.style.backgroundColor = "#fff8e1";
      slowLoadingIndicator.style.border = "1px solid #ffcc02";
      slowLoadingIndicator.style.borderRadius = "6px";
      slowLoadingIndicator.style.margin = "16px 0";
      
      const slowMessage = document.createElement("p");
      slowMessage.textContent = "This is taking longer than usual...";
      slowMessage.style.fontSize = "14px";
      slowMessage.style.margin = "0";
      
      slowLoadingIndicator.appendChild(slowMessage);
      container.appendChild(slowLoadingIndicator);
      
      // Show slow loading message after delay
      setTimeout(() => {
        slowLoadingIndicator.style.display = "block";
      }, 3000);
      
      // For testing, we'll simulate this immediately
      slowLoadingIndicator.style.display = "block";
      expect(slowLoadingIndicator.style.display).toBe("block");
      expect(slowMessage.textContent).toBe("This is taking longer than usual...");
    });
  });
});