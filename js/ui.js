/**
 * CV Genius Theme & UI Management
 * Handles dark mode, theming, notifications, and UI interactions
 */

// Extend CVGenius with theme and UI management methods
Object.assign(CVGenius.prototype, {
    initDarkMode() {
        this.updateDarkMode();

        const themeToggle = document.getElementById("themeToggle");
        if (themeToggle) {
            themeToggle.addEventListener("click", () => this.toggleDarkMode());
        }

        window
            .matchMedia("(prefers-color-scheme: dark)")
            .addEventListener("change", (e) => {
                if (!localStorage.getItem("darkMode")) {
                    this.darkMode = e.matches;
                    this.updateDarkMode();
                }
            });
    },

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem("darkMode", this.darkMode.toString());
        this.updateDarkMode();

        this.showNotification(
            `Switched to ${this.darkMode ? "dark" : "light"} mode`,
            "info",
            2000
        );
    },

    updateDarkMode() {
        const html = document.documentElement;

        if (this.darkMode) {
            html.setAttribute("data-bs-theme", "dark");
        } else {
            html.setAttribute("data-bs-theme", "light");
        }

        const sunIcon = document.querySelector(".sun-icon");
        const moonIcon = document.querySelector(".moon-icon");

        if (sunIcon && moonIcon) {
            if (this.darkMode) {
                sunIcon.classList.add("d-none");
                moonIcon.classList.remove("d-none");
            } else {
                sunIcon.classList.remove("d-none");
                moonIcon.classList.add("d-none");
            }
        }
    },

    initScrollSync() {
        const controlsPanel = document.getElementById("controlsPanel");
        const cvPreviewPanel = document.getElementById("cvPreviewPanel");
        if (!controlsPanel || !cvPreviewPanel) return;

        let scrollSyncEnabled = true;
        const handleMainScroll = () => {
            if (!scrollSyncEnabled || window.innerWidth < 1024) return;
            const scrollY = window.pageYOffset,
                windowHeight = window.innerHeight,
                documentHeight = document.documentElement.scrollHeight;
            const maxScroll = documentHeight - windowHeight;
            if (maxScroll <= 0) return;
            const scrollProgress = Math.min(
                Math.max(scrollY / maxScroll, 0),
                1
            );
            const cvPreview = cvPreviewPanel.querySelector(".cv-preview");
            if (cvPreview) {
                const cvScrollableHeight =
                    cvPreview.scrollHeight - cvPreviewPanel.clientHeight;
                if (cvScrollableHeight > 0) {
                    const targetScroll = Math.min(
                        scrollProgress *
                            cvScrollableHeight *
                            1.2 *
                            (1 + scrollProgress * 0.3) +
                            scrollProgress * 150,
                        cvScrollableHeight
                    );
                    cvPreviewPanel.scrollTo({
                        top: targetScroll,
                        behavior: "smooth",
                    });
                }
            }
            this.updateScrollIndicator(scrollProgress);
        };
        let ticking = false;
        const throttledScrollHandler = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    handleMainScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener("scroll", throttledScrollHandler, {
            passive: true,
        });
        this.addScrollToSectionHandlers();
    },

    updateScrollIndicator(progress) {
        let indicator = document.getElementById("scrollProgressIndicator");
        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = "scrollProgressIndicator";
            indicator.className =
                "position-fixed top-0 start-0 h-1 bg-primary transition-all";
            indicator.style.height = "4px";
            indicator.style.zIndex = "1100";
            document.body.appendChild(indicator);
        }
        indicator.style.width = `${Math.min(
            Math.max(progress * 100, 0),
            100
        )}%`;
        indicator.style.boxShadow =
            progress > 0 && progress < 1
                ? "0 0 10px rgba(59, 130, 246, 0.5)"
                : "none";
    },

    addScrollToSectionHandlers() {
        const formContainer = document.getElementById("formContainer");
        if (formContainer)
            formContainer.addEventListener("click", (e) => {
                const sectionForm = e.target.closest('[id^="section-form-"]');
                if (sectionForm)
                    this.scrollToCVSection(
                        sectionForm.id.replace("section-form-", "")
                    );
            });
    },

    scrollToCVSection(sectionId) {
        const cvSection = document.querySelector(
                `[data-cv-section-id="${sectionId}"]`
            ),
            cvPreviewPanel = document.getElementById("cvPreviewPanel");
        if (cvSection && cvPreviewPanel) {
            const sectionTop = cvSection.offsetTop,
                panelHeight = cvPreviewPanel.clientHeight,
                headerOffset =
                    document.getElementById("cvHeader")?.offsetHeight || 80;
            const targetScroll = Math.max(
                0,
                sectionTop - headerOffset - panelHeight / 4
            );
            cvPreviewPanel.scrollTo({ top: targetScroll, behavior: "smooth" });
            cvSection.classList.add("flash-highlight");
            setTimeout(
                () => cvSection.classList.remove("flash-highlight"),
                1500
            );
        }
    },

    showNotification(message, type = "info", duration = 3000) {
        const existingNotification = document.querySelector(
            ".notification-toast"
        );
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement("div");
        notification.className = `notification-toast alert alert-${
            type === "info"
                ? "primary"
                : type === "success"
                ? "success"
                : type === "warning"
                ? "warning"
                : "danger"
        } alert-dismissible fade show position-fixed`;

        // Position next to the dark mode button
        const isMobile = window.innerWidth <= 768;
        const rightOffset = isMobile ? "4.5rem" : "5.5rem"; // Account for button width + spacing
        const topOffset = isMobile ? "1rem" : "1.5rem"; // Match button position

        notification.style.cssText = `
            top: ${topOffset}; 
            right: ${rightOffset}; 
            z-index: 1100; 
            max-width: ${isMobile ? "250px" : "350px"};
            transform: translateX(0);
            transition: all 0.3s ease;
        `;

        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        document.body.appendChild(notification);

        // Add entrance animation
        requestAnimationFrame(() => {
            notification.style.transform = "translateX(0)";
        });

        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove("show");
                notification.style.transform = "translateX(100%)";
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 150);
            }
        }, duration);
    }
});
