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
        this.loadPersonalInfo();
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
                    aiLanguageIndicator.textContent = `🌐 ${e.target.value}`;
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

    closeAllModals() {
        document.getElementById("aiSuggestionPopup")?.classList.add("d-none");
        if (this.bulkModal) this.closeBulkActions();
        if (this.reorderModal) this.cancelReorder();
        document
            .querySelectorAll(".notification-toast")
            .forEach((p) => p.classList.add("d-none"));
        document.querySelector(".api-key-modal")?.remove();
        if (this.sectionSelectVisible) this.handleAddSectionClick();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    window.cvGenius = new CVGenius();
});
