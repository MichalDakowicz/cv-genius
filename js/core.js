/**
 * CV Genius Core - Main application logic for CV Genius
 */

class CVGenius {
    constructor() {
        this.sections = [];
        this.cvData = {
            personalInfo: {},
            sections: [],
        };

        this.openaiApiKey =
            localStorage.getItem("openai_api_key") ||
            "YOUR_FALLBACK_OPENAI_API_KEY_HERE";
        this.openaiBaseUrl = "https://api.openai.com/v1/chat/completions";
        this.sectionSelectVisible = false;

        this.darkMode =
            localStorage.getItem("darkMode") === "true" ||
            (!localStorage.getItem("darkMode") &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        this.predefinedLanguages = [
            "English",
            "Polish",
            "Spanish",
            "French",
            "German",
            "Chinese",
            "Hindi",
            "Arabic",
            "Portuguese",
            "Russian",
        ];
        this.language = localStorage.getItem("cvg_language") || "English";

        this.init();
    }

    init() {
        this.initDarkMode();
        this.bindEvents();

        // Try to load from localStorage first
        if (!this.loadFromLocalStorage()) {
            // If no saved data, load default personal info
            this.loadPersonalInfo();
        }

        this.renderPreview();
        this.initKeyboardShortcuts();
        if (
            !localStorage.getItem("openai_api_key") &&
            this.openaiApiKey === "YOUR_FALLBACK_OPENAI_API_KEY_HERE"
        ) {
            this.showNotification(
                "OpenAI API Key not set. AI features will be limited. Please set it in 'API Key Settings'.",
                "warning",
                7000
            );
            this.manageApiKey();
        }
    }

    bindEvents() {
        const personalInputs = [
            "fullName",
            "jobTitle",
            "email",
            "phone",
            "location",
        ];
        personalInputs.forEach((inputId) => {
            const element = document.getElementById(inputId);
            if (element)
                element.addEventListener("input", () =>
                    this.updatePersonalInfo()
                );
        });

        const websiteInputs = ["website-url", "website-type"];
        websiteInputs.forEach((InputElement) => {
            const element = document.getElementsByClassName(InputElement);
            if (element.length > 0) {
                Array.from(element).forEach((el) =>
                    el.addEventListener("input", () =>
                        this.updatePersonalInfo()
                    )
                );
            }
        });

        document
            .getElementById("addSectionBtn")
            ?.addEventListener("click", () => this.handleAddSectionClick());
        document
            .getElementById("confirmAddSectionBtn")
            ?.addEventListener("click", () => this.addNewSection());
        document
            .getElementById("saveCV")
            ?.addEventListener("click", () => this.saveCV());
        document
            .getElementById("loadCV")
            ?.addEventListener("click", () => this.loadCV());
        document
            .getElementById("printCV")
            ?.addEventListener("click", () => this.showExportModal());
        document
            .getElementById("clearCV")
            ?.addEventListener("click", () => this.clearCV());
        document
            .getElementById("manageApiKey")
            ?.addEventListener("click", () => this.manageApiKey());
        document
            .getElementById("getAISuggestion")
            ?.addEventListener("click", () => this.generateAISuggestions(true));

        const presetSelectElement = document.getElementById(
            "presetWebsiteSelect"
        );
        if (presetSelectElement) {
            document
                .getElementById("addPresetWebsiteBtn")
                ?.addEventListener("click", () =>
                    this.addWebsiteField(presetSelectElement.value)
                );
        }
        document
            .getElementById("addCustomWebsiteBtn")
            ?.addEventListener("click", () => this.addWebsiteField());

        document
            .getElementById("closeAiPopup")
            ?.addEventListener("click", () =>
                document
                    .getElementById("aiSuggestionPopup")
                    .classList.add("d-none")
            );
        document
            .getElementById("aiFilterPriority")
            ?.addEventListener("change", () => this.filterAISuggestions());
        document
            .getElementById("aiFilterType")
            ?.addEventListener("change", () => this.filterAISuggestions());

        // AI Language selector event
        document
            .getElementById("aiLanguageSelect")
            ?.addEventListener("change", (e) => {
                localStorage.setItem("cvg_ai_language", e.target.value);
                this.showNotification(
                    `AI language set to ${e.target.value}`,
                    "info",
                    3000
                );
            });

        // Global language selector
        document
            .getElementById("globalLanguage")
            ?.addEventListener("change", (e) => {
                this.cvData.personalInfo.language = e.target.value;
                localStorage.setItem("cvg_language", e.target.value);
                this.language = e.target.value;

                // Also update AI language selector if it exists
                const aiLanguageSelect =
                    document.getElementById("aiLanguageSelect");
                const aiLanguageIndicator = document.getElementById(
                    "aiLanguageIndicator"
                );
                if (aiLanguageSelect) {
                    aiLanguageSelect.value = e.target.value;
                    localStorage.setItem("cvg_ai_language", e.target.value);
                }
                if (aiLanguageIndicator) {
                    aiLanguageIndicator.innerHTML = `<i class="fas fa-globe"></i> ${e.target.value}`;
                }

                this.showNotification(
                    `Language set to ${e.target.value}`,
                    "info",
                    3000
                );
            });

        const regenerateAnalysisBtn = document.querySelector(
            '#aiSuggestionPopup button[onclick="cvGenius.generateAISuggestions()"]'
        );
        if (regenerateAnalysisBtn)
            regenerateAnalysisBtn.onclick = () =>
                window.cvGenius.generateAISuggestions(true);

        const exportReportBtn = document.querySelector(
            '#aiSuggestionPopup button[onclick="cvGenius.exportSuggestions()"]'
        );
        if (exportReportBtn)
            exportReportBtn.onclick = () => window.cvGenius.exportSuggestions();

        document
            .querySelectorAll("#aiSuggestionPopup .quick-action-btn")
            .forEach((button) => {
                const actionMatch = button
                    .getAttribute("onclick")
                    ?.match(/cvGenius\.quickAIAction\('(.*?)'\)/);
                if (actionMatch && actionMatch[1]) {
                    const action = actionMatch[1];
                    button.onclick = () =>
                        window.cvGenius.quickAIAction(action);
                }
            });
        document
            .getElementById("aiSuggestPersonalInfo")
            ?.addEventListener("click", () => this.enhancePersonalInfoWithAI());
        this.initScrollSync();
    }

    initKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") this.closeAllModals();
        });
    }

    clearCV() {
        this.showClearCVModal();
    }

    showClearCVModal() {
        const existingModal = document.querySelector(".clear-cv-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className =
            "clear-cv-modal position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
        modalOverlay.style.cssText =
            "background: rgba(0,0,0,0.5); z-index: 1053; backdrop-filter: blur(3px);";

        const modalContent = document.createElement("div");
        modalContent.className = "bg-body text-body rounded shadow-lg p-4 mx-3";
        modalContent.style.cssText =
            "max-width: 500px; width: 100%; border: 1px solid var(--bs-border-color, #dee2e6);";

        modalContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0 text-danger"><i class="fas fa-exclamation-triangle me-2"></i>Clear CV</h4>
                <button type="button" class="btn-close" onclick="this.closest('.clear-cv-modal').remove()"></button>
            </div>
            <div class="alert alert-warning mb-4">
                <i class="fas fa-warning me-2"></i>
                <strong>Warning:</strong> This action will permanently delete all your CV data including personal information, sections, and content.
            </div>
            <p class="text-muted mb-4">Before proceeding, you may want to save your current CV as a backup.</p>
            
            <div class="d-grid gap-2 mb-4">
                <button type="button" class="btn btn-outline-primary" onclick="cvGenius.saveBeforeClear()">
                    <i class="fas fa-download me-2"></i>Save CV as JSON First
                    <small class="d-block text-muted">Download a backup before clearing</small>
                </button>
            </div>

            <div class="border-top pt-3">
                <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="confirmClearCheck">
                    <label class="form-check-label" for="confirmClearCheck">
                        I understand that this action cannot be undone and all CV data will be permanently deleted.
                    </label>
                </div>
                
                <div class="d-grid gap-2">
                    <button type="button" class="btn btn-danger" id="confirmClearBtn" disabled onclick="cvGenius.performClearCV()">
                        <i class="fas fa-eraser me-2"></i>Clear CV Permanently
                    </button>
                    <button type="button" class="btn btn-outline-secondary" onclick="this.closest('.clear-cv-modal').remove();">
                        Cancel
                    </button>
                </div>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Add event listener for checkbox
        const checkbox = modalContent.querySelector("#confirmClearCheck");
        const confirmBtn = modalContent.querySelector("#confirmClearBtn");

        checkbox.addEventListener("change", () => {
            confirmBtn.disabled = !checkbox.checked;
        });

        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
    }

    saveBeforeClear() {
        // Use the existing export functionality
        this.exportCVAsFile();
        this.showNotification(
            "CV saved! You can now safely clear your data.",
            "success"
        );
    }

    performClearCV() {
        // Double confirmation with native confirm dialog
        if (
            confirm(
                "Are you absolutely sure you want to clear all CV data? This is your final chance to cancel."
            )
        ) {
            // Close the modal first
            const modal = document.querySelector(".clear-cv-modal");
            if (modal) {
                modal.remove();
            }

            // Clear personal info
            this.cvData.personalInfo = {};

            // Clear all form fields
            const personalFields = [
                "fullName",
                "jobTitle",
                "email",
                "phone",
                "location",
            ];
            personalFields.forEach((field) => {
                const element = document.getElementById(field);
                if (element) {
                    element.value = "";
                }
            });

            // Clear websites container
            const websiteContainer =
                document.getElementById("websiteContainer");
            if (websiteContainer) {
                websiteContainer.innerHTML = "";
            }

            // Clear all sections
            this.sections = [];
            this.cvData.sections = [];

            // Remove all section forms
            const formContainer = document.getElementById("formContainer");
            if (formContainer) {
                const sectionForms =
                    formContainer.querySelectorAll(".form-section");
                sectionForms.forEach((form) => form.remove());
            }

            // Reset language to default
            this.language = "English";
            this.cvData.personalInfo.language = "English";

            // Update language selector
            const languageDisplayText = document.getElementById(
                "languageDisplayText"
            );
            if (languageDisplayText) {
                languageDisplayText.textContent = "English";
                languageDisplayText.className = "multi-select-text selected";
            }

            // Re-render the preview
            this.renderPreview();

            // Auto-save the cleared state
            this.autoSaveToLocalStorage();

            // Show success notification
            this.showNotification("CV cleared successfully!", "success");
        }
    }

    closeAllModals() {
        document.getElementById("aiSuggestionPopup")?.classList.add("d-none");
        if (this.bulkModal) this.closeBulkActions();
        if (this.reorderModal) this.cancelReorder();
        document
            .querySelectorAll(".notification-toast")
            .forEach((p) => p.classList.add("d-none"));
        document.querySelector(".api-key-modal")?.remove();
        document.querySelector(".clear-cv-modal")?.remove();
        document.querySelector(".save-modal")?.remove();
        document.querySelector(".load-modal")?.remove();
        document.querySelector(".export-modal")?.remove();
        document.querySelector(".reorder-modal")?.remove();
        document.querySelector(".bulk-edit-modal")?.remove();
        if (this.sectionSelectVisible) this.handleAddSectionClick();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.cvGenius = new CVGenius();
});
