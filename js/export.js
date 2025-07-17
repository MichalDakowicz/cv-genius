/**
 * CV Genius Export/Import Functionality
 * Handles saving, loading, and exporting CVs in various formats
 */

// Extend CVGenius with export/import methods
Object.assign(CVGenius.prototype, {
    // Auto-save to local storage
    autoSaveToLocalStorage() {
        const cvData = {
            personalInfo: this.cvData.personalInfo,
            sections: this.sections.map((s) => ({
                id: s.id,
                type: s.type,
                title: s.title,
                content: s.content,
                items: s.items || [],
                visible: s.visible,
            })),
            lastSaved: new Date().toISOString(),
        };
        localStorage.setItem("cvGeniusData", JSON.stringify(cvData));
        this.showAutoSaveIndicator();
    },

    // Show auto-save indicator
    showAutoSaveIndicator() {
        // Remove existing indicator
        const existingIndicator = document.querySelector(
            ".auto-save-indicator"
        );
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // Create new indicator
        const indicator = document.createElement("div");
        indicator.className = "auto-save-indicator position-fixed";
        indicator.style.cssText = `
            top: 20px;
            right: 20px;
            background: var(--bs-success);
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.875rem;
            z-index: 1060;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        indicator.innerHTML = '<i class="fas fa-check me-1"></i>Auto-saved';

        document.body.appendChild(indicator);

        // Show indicator
        setTimeout(() => {
            indicator.style.opacity = "1";
        }, 10);

        // Hide indicator after 2 seconds
        setTimeout(() => {
            indicator.style.opacity = "0";
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
            }, 300);
        }, 2000);
    },

    // Load from local storage
    loadFromLocalStorage() {
        try {
            const savedData = localStorage.getItem("cvGeniusData");
            if (savedData) {
                const cvData = JSON.parse(savedData);
                this.loadCVData(cvData);
                return true;
            }
        } catch (error) {
            console.error("Error loading from local storage:", error);
        }
        return false;
    },

    // Save CV (now shows a modal with options)
    saveCV() {
        this.showSaveModal();
    },

    // Save CV as file
    exportCVAsFile() {
        const cvData = {
            personalInfo: this.cvData.personalInfo,
            sections: this.sections.map((s) => ({
                id: s.id,
                type: s.type,
                title: s.title,
                content: s.content,
                items: s.items || [],
                visible: s.visible,
            })),
            exportedAt: new Date().toISOString(),
        };

        const blob = new Blob([JSON.stringify(cvData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Use the same filename generation logic for consistency
        const personalInfo = this.cvData.personalInfo;
        const name = personalInfo.fullName || "cv-genius";
        const latinName = this.convertToLatinChars(name);
        const cleanName = latinName
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
        const date = new Date().toISOString().split("T")[0];

        a.download = `${cleanName}-${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification("CV exported as file!", "success");
    },

    // Show save modal
    showSaveModal() {
        const existingModal = document.querySelector(".save-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className =
            "save-modal position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
        modalOverlay.style.cssText =
            "background: rgba(0,0,0,0.5); z-index: 1053; backdrop-filter: blur(3px);";

        const modalContent = document.createElement("div");
        modalContent.className = "bg-body text-body rounded shadow-lg p-4 mx-3";
        modalContent.style.cssText =
            "max-width: 500px; width: 100%; border: 1px solid var(--bs-border-color, #dee2e6);";

        modalContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0"><i class="fas fa-download me-2 text-primary"></i>Export & Manage</h4>
                <button type="button" class="btn-close" onclick="this.closest('.save-modal').remove()"></button>
            </div>
            <p class="text-muted mb-4">Your CV is automatically saved. Choose an action:</p>
            <div class="d-grid gap-2">
                <button type="button" class="btn btn-primary" onclick="cvGenius.exportCVAsFile(); this.closest('.save-modal').remove();">
                    <i class="fas fa-download me-2"></i>Save as JSON
                    <small class="d-block text-light opacity-75">Download JSON file to your computer</small>
                </button>
                <hr class="my-3">
                <button type="button" class="btn btn-outline-danger" onclick="cvGenius.clearLocalStorage(); this.closest('.save-modal').remove();">
                    <i class="fas fa-trash me-2"></i>Clear Local Storage
                    <small class="d-block text-muted">Remove all saved CV data from browser</small>
                </button>
                <button type="button" class="btn btn-outline-secondary" onclick="this.closest('.save-modal').remove();">
                    Cancel
                </button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
    },

    // Load CV data (refactored for reusability)
    loadCVData(cvData) {
        if (!cvData || typeof cvData !== "object") {
            throw new Error("Invalid CV data format");
        }

        if (cvData.personalInfo && typeof cvData.personalInfo === "object") {
            this.cvData.personalInfo = cvData.personalInfo;

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
                    element.value = cvData.personalInfo[field] || "";
                }
            });

            if (
                cvData.personalInfo.websites &&
                Array.isArray(cvData.personalInfo.websites)
            ) {
                const websiteContainer =
                    document.getElementById("websiteContainer");
                if (websiteContainer) {
                    websiteContainer.innerHTML = "";
                    cvData.personalInfo.websites.forEach((website) => {
                        this.addWebsiteFieldWithData(website);
                    });
                }
            }
        }

        if (cvData.sections && Array.isArray(cvData.sections)) {
            this.sections = [];
            const formContainer = document.getElementById("formContainer");
            if (formContainer) {
                const sectionForms =
                    formContainer.querySelectorAll(".form-section");
                sectionForms.forEach((form) => form.remove());
            }

            cvData.sections.forEach((sectionData) => {
                if (!sectionData.id || !sectionData.type) {
                    console.warn("Skipping invalid section:", sectionData);
                    return;
                }

                const section = {
                    id: sectionData.id,
                    type: sectionData.type,
                    title:
                        sectionData.title ||
                        this.getSectionTitle(sectionData.type),
                    visible: sectionData.visible !== false,
                };

                if (
                    [
                        "experience",
                        "education",
                        "skills",
                        "projects",
                        "publications",
                        "languages",
                        "certifications",
                        "awards",
                        "volunteer",
                        "references",
                    ].includes(section.type)
                ) {
                    section.items =
                        sectionData.items ||
                        this.getDefaultContent(section.type);
                } else {
                    section.content =
                        sectionData.content ||
                        this.getDefaultContent(section.type);
                }

                this.sections.push(section);
                this.createSectionForm(section);
            });

            this.cvData.sections = this.sections;
        }

        this.renderPreview();
    },

    // Show load modal
    showLoadModal() {
        const existingModal = document.querySelector(".load-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className =
            "load-modal position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
        modalOverlay.style.cssText =
            "background: rgba(0,0,0,0.5); z-index: 1053; backdrop-filter: blur(3px);";

        const modalContent = document.createElement("div");
        modalContent.className = "bg-body text-body rounded shadow-lg p-4 mx-3";
        modalContent.style.cssText =
            "max-width: 500px; width: 100%; border: 1px solid var(--bs-border-color, #dee2e6);";

        modalContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0"><i class="fas fa-file-import me-2 text-info"></i>Import CV</h4>
                <button type="button" class="btn-close" onclick="this.closest('.load-modal').remove()"></button>
            </div>
            <p class="text-muted mb-4">Import a CV file from your computer. Your CV is automatically saved and loaded from local storage.</p>
            <div class="d-grid gap-2">
                <button type="button" class="btn btn-primary" onclick="cvGenius.loadFromFile(); this.closest('.load-modal').remove();">
                    <i class="fas fa-file-import me-2 text-white"></i>Import from File
                    <small class="d-block text-light opacity-75">Import JSON file from your computer</small>
                </button>
                <button type="button" class="btn btn-outline-secondary" onclick="this.closest('.load-modal').remove();">
                    Cancel
                </button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });
    },

    // Load from file
    loadFromFile() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.style.display = "none";

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.name.endsWith(".json")) {
                this.showNotification(
                    "Please select a valid JSON file",
                    "danger"
                );
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const cvData = JSON.parse(e.target.result);
                    this.loadCVData(cvData);
                    this.showNotification("CV loaded successfully!", "success");
                    // Also save to localStorage for future quick access
                    this.autoSaveToLocalStorage();
                } catch (error) {
                    console.error("Error loading CV:", error);
                    this.showNotification(
                        "Error loading CV file. Please check the file format.",
                        "danger"
                    );
                }
            };

            reader.onerror = () => {
                this.showNotification("Error reading file", "danger");
            };

            reader.readAsText(file);
        };

        document.body.appendChild(input);
        input.click();
        document.body.removeChild(input);
    },

    // Clear local storage
    clearLocalStorage() {
        if (
            confirm(
                "Are you sure you want to clear all saved CV data from local storage? This action cannot be undone."
            )
        ) {
            localStorage.removeItem("cvGeniusData");
            this.showNotification(
                "Local storage cleared! Page will refresh.",
                "success"
            );
            // Refresh the page after a short delay to show the notification
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    },

    loadCV() {
        this.showLoadModal();
    },

    showExportModal() {
        const existingModal = document.querySelector(".export-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className =
            "export-modal position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
        modalOverlay.style.cssText =
            "background: rgba(0,0,0,0.5); z-index: 1053; backdrop-filter: blur(3px);";

        const modalContent = document.createElement("div");
        modalContent.className = "bg-body text-body rounded shadow-lg p-4 mx-3";
        modalContent.style.cssText =
            "max-width: 500px; width: 100%; border: 1px solid var(--bs-border-color, #dee2e6);";

        modalContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0"><i class="fas fa-download me-2 text-primary"></i>Save CV</h4>
                <button type="button" class="btn-close" id="closeExportModal"></button>
            </div>
            <div class="mb-4">
                <p class="text-muted">Choose how you'd like to export your CV:</p>
            </div>
            <div class="d-grid gap-3">
                <button type="button" id="exportPDF" class="btn btn-primary btn-lg d-flex align-items-center justify-content-start">
                    <i class="fas fa-file-pdf me-3 fs-4"></i>
                    <div class="text-start">
                        <div class="fw-bold">Export as PDF</div>
                        <small class="text-white-50">Professional PDF document</small>
                    </div>
                </button>
                <button type="button" id="printCVGUI" class="btn btn-outline-primary btn-lg d-flex align-items-center justify-content-start">
                    <i class="fas fa-print me-3 fs-4"></i>
                    <div class="text-start">
                        <div class="fw-bold">Print</div>
                        <small class="text-muted">Print or save as PDF from print dialog</small>
                    </div>
                </button>
                <button type="button" id="exportHTML" class="btn btn-outline-secondary btn-lg d-flex align-items-center justify-content-start">
                    <i class="fas fa-code me-3 fs-4"></i>
                    <div class="text-start">
                        <div class="fw-bold">Export as HTML</div>
                        <small class="text-muted">Standalone HTML file</small>
                    </div>
                </button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        document
            .getElementById("closeExportModal")
            .addEventListener("click", () => {
                modalOverlay.remove();
            });

        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });

        document.getElementById("exportPDF").addEventListener("click", () => {
            modalOverlay.remove();
            this.exportPDF();
        });

        document.getElementById("printCVGUI").addEventListener("click", () => {
            modalOverlay.remove();
            this.printPDF();
        });

        document.getElementById("exportHTML").addEventListener("click", () => {
            modalOverlay.remove();
            this.exportToHTML();
        });
    },

    async printPDF() {
        try {
            this.showNotification("Preparing PDF export...", "info");

            const printContent = this.getPrintableContent();

            const printWindow = window.open("", "_blank");
            printWindow.document.open();
            printWindow.document.write(printContent);
            printWindow.document.close();

            await new Promise((resolve) => {
                printWindow.onload = resolve;
                setTimeout(resolve, 1000);
            });

            printWindow.focus();

            this.showNotification(
                'Print dialog opened. Choose "Save as PDF" or "Microsoft Print to PDF" as destination.',
                "info",
                8000
            );

            setTimeout(() => {
                printWindow.print();
            }, 100);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            this.showNotification(
                "Error generating PDF. Please try the print option.",
                "danger"
            );
        }
    },

    exportToHTML() {
        try {
            const htmlContent = this.getPrintableContent();
            const blob = new Blob([htmlContent], { type: "text/html" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement("a");
            a.href = url;
            a.download = `cv-${this.getFileName()}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification(
                "HTML file downloaded successfully!",
                "success"
            );
        } catch (error) {
            console.error("Error exporting HTML:", error);
            this.showNotification("Error exporting HTML file", "danger");
        }
    },

    exportPDF() {
        try {
            const previousTheme =
                document.documentElement.getAttribute("data-bs-theme");
            this.showNotification("Exporting PDF...", "info");

            const originalElement = document.querySelector(".cv-preview");
            if (!originalElement)
                throw new Error("CV preview element not found");

            const cvHeader = document.querySelector("#cvHeader");
            const cvHeaderGradient = cvHeader
                ? cvHeader.querySelector(".position-absolute")
                : null;
            const allLinks = originalElement.querySelectorAll("a[href]");

            // Store original styles and classes
            const originalStyles = {
                paddingTop: originalElement.style.paddingTop,
                marginTop: originalElement.style.marginTop,
                padding: originalElement.style.padding,
                headerMarginBottom: cvHeader
                    ? cvHeader.style.marginBottom
                    : null,
                className: originalElement.className,
                gradientBackground: cvHeaderGradient
                    ? cvHeaderGradient.style.background
                    : null,
                linkHrefs: Array.from(allLinks).map((link) => link.href),
            };

            // Temporarily remove p-5 class and add custom styling
            originalElement.className = originalElement.className.replace(
                /\bp-5\b/g,
                ""
            );
            originalElement.style.padding = "0 3rem 3rem 3rem"; // Remove top padding, keep others
            originalElement.style.paddingTop = "0";
            originalElement.style.marginTop = "0";

            if (cvHeader) {
                cvHeader.style.marginBottom = "1rem"; // Reduce header bottom margin
            }

            // Change gradient to solid color for PDF export
            if (cvHeaderGradient) {
                cvHeaderGradient.style.background = "#f2f2f2";
            }

            // Remove href attributes to prevent clickable links in PDF
            allLinks.forEach((link) => {
                link.removeAttribute("href");
            });

            const filename = `cv-${this.getFileName()}.pdf`;
            const opts = {
                margin: [0.5, 0, 0.5, 0], // Top, Right, Bottom, Left margins in inches
                filename,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    y: 0, // Ensure capture starts from the top
                },
                jsPDF: {
                    unit: "in",
                    format: "letter",
                    orientation: "portrait",
                },
            };

            if (previousTheme !== "light") {
                document.documentElement.setAttribute("data-bs-theme", "light");
            }

            html2pdf()
                .set(opts)
                .from(originalElement)
                .save()
                .then(() => {
                    // Restore original styles and classes
                    originalElement.className = originalStyles.className;
                    originalElement.style.paddingTop =
                        originalStyles.paddingTop;
                    originalElement.style.marginTop = originalStyles.marginTop;
                    originalElement.style.padding = originalStyles.padding;

                    if (
                        cvHeader &&
                        originalStyles.headerMarginBottom !== null
                    ) {
                        cvHeader.style.marginBottom =
                            originalStyles.headerMarginBottom;
                    }

                    // Restore gradient background
                    if (cvHeaderGradient && originalStyles.gradientBackground) {
                        cvHeaderGradient.style.background =
                            originalStyles.gradientBackground;
                    }

                    // Restore link href attributes
                    allLinks.forEach((link, index) => {
                        if (originalStyles.linkHrefs[index]) {
                            link.href = originalStyles.linkHrefs[index];
                        }
                    });

                    this.showNotification(
                        "PDF downloaded successfully!",
                        "success"
                    );
                    document.documentElement.setAttribute(
                        "data-bs-theme",
                        previousTheme
                    );
                })
                .catch((error) => {
                    // Restore original styles and classes on error
                    originalElement.className = originalStyles.className;
                    originalElement.style.paddingTop =
                        originalStyles.paddingTop;
                    originalElement.style.marginTop = originalStyles.marginTop;
                    originalElement.style.padding = originalStyles.padding;

                    if (
                        cvHeader &&
                        originalStyles.headerMarginBottom !== null
                    ) {
                        cvHeader.style.marginBottom =
                            originalStyles.headerMarginBottom;
                    }

                    // Restore gradient background on error
                    if (cvHeaderGradient && originalStyles.gradientBackground) {
                        cvHeaderGradient.style.background =
                            originalStyles.gradientBackground;
                    }

                    // Restore link href attributes on error
                    allLinks.forEach((link, index) => {
                        if (originalStyles.linkHrefs[index]) {
                            link.href = originalStyles.linkHrefs[index];
                        }
                    });

                    document.documentElement.setAttribute(
                        "data-bs-theme",
                        previousTheme
                    );
                    throw error;
                });
        } catch (error) {
            console.error("Error exporting PDF:", error);
            this.showNotification(
                "Error exporting PDF. Please try again.",
                "danger"
            );
            const previousTheme =
                document.documentElement.getAttribute("data-bs-theme");
            document.documentElement.setAttribute(
                "data-bs-theme",
                previousTheme
            );
        }
    },

    getPrintableContent() {
        const cvPreview = document.querySelector(".cv-preview");
        if (!cvPreview) {
            throw new Error("CV preview not found");
        }

        const printContent = cvPreview.innerHTML;
        const personalInfo = this.cvData.personalInfo;
        const fileName = this.getFileName();

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${fileName} - CV</title>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
                <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { 
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        background: white;
                        margin: 0;
                        padding: 20px;
                    }
                    .cv-preview {
                        background: white !important;
                        box-shadow: none !important;
                        border: none !important;
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .cv-entry {
                        background: rgba(248, 249, 250, 0.8) !important;
                        border: 1px solid #e9ecef !important;
                    }
                    @media print {
                        body { 
                            background: white !important;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .cv-preview { 
                            background: white !important; 
                            box-shadow: none !important;
                            padding: 0 !important;
                            margin: 0 !important;
                            max-width: none !important;
                        }
                        @page {
                            margin: 1cm;
                            size: A4;
                        }
                        .cv-entry {
                            break-inside: avoid;
                            page-break-inside: avoid;
                        }
                        h1, h2, h3, h4, h5, h6 {
                            break-after: avoid;
                            page-break-after: avoid;
                        }
                    }
                    @media screen {
                        body {
                            background: #f8f9fa;
                        }
                        .cv-preview {
                            box-shadow: 0 0 20px rgba(0,0,0,0.1);
                            border-radius: 8px;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="cv-preview">
                    ${printContent}
                </div>
            </body>
            </html>
        `;
    },

    // Convert non-Latin characters to Latin equivalents
    convertToLatinChars(text) {
        const charMap = {
            // Polish characters
            ą: "a",
            ć: "c",
            ę: "e",
            ł: "l",
            ń: "n",
            ó: "o",
            ś: "s",
            ź: "z",
            ż: "z",
            Ą: "A",
            Ć: "C",
            Ę: "E",
            Ł: "L",
            Ń: "N",
            Ó: "O",
            Ś: "S",
            Ź: "Z",
            Ż: "Z",

            // German characters
            ä: "ae",
            ö: "oe",
            ü: "ue",
            ß: "ss",
            Ä: "AE",
            Ö: "OE",
            Ü: "UE",

            // French characters
            à: "a",
            á: "a",
            â: "a",
            ã: "a",
            ä: "a",
            å: "a",
            è: "e",
            é: "e",
            ê: "e",
            ë: "e",
            ì: "i",
            í: "i",
            î: "i",
            ï: "i",
            ò: "o",
            ó: "o",
            ô: "o",
            õ: "o",
            ö: "o",
            ù: "u",
            ú: "u",
            û: "u",
            ü: "u",
            ý: "y",
            ÿ: "y",
            ç: "c",
            ñ: "n",
            À: "A",
            Á: "A",
            Â: "A",
            Ã: "A",
            Ä: "A",
            Å: "A",
            È: "E",
            É: "E",
            Ê: "E",
            Ë: "E",
            Ì: "I",
            Í: "I",
            Î: "I",
            Ï: "I",
            Ò: "O",
            Ó: "O",
            Ô: "O",
            Õ: "O",
            Ö: "O",
            Ù: "U",
            Ú: "U",
            Û: "U",
            Ü: "U",
            Ý: "Y",
            Ÿ: "Y",
            Ç: "C",
            Ñ: "N",

            // Spanish characters
            ñ: "n",
            Ñ: "N",

            // Italian characters
            à: "a",
            è: "e",
            ì: "i",
            ò: "o",
            ù: "u",
            À: "A",
            È: "E",
            Ì: "I",
            Ò: "O",
            Ù: "U",

            // Portuguese characters
            ã: "a",
            õ: "o",
            ç: "c",
            Ã: "A",
            Õ: "O",
            Ç: "C",

            // Czech characters
            č: "c",
            ď: "d",
            ě: "e",
            ň: "n",
            ř: "r",
            š: "s",
            ť: "t",
            ů: "u",
            ž: "z",
            Č: "C",
            Ď: "D",
            Ě: "E",
            Ň: "N",
            Ř: "R",
            Š: "S",
            Ť: "T",
            Ů: "U",
            Ž: "Z",

            // Slovak characters
            á: "a",
            ä: "a",
            č: "c",
            ď: "d",
            é: "e",
            í: "i",
            ĺ: "l",
            ľ: "l",
            ň: "n",
            ó: "o",
            ô: "o",
            ŕ: "r",
            š: "s",
            ť: "t",
            ú: "u",
            ý: "y",
            ž: "z",
            Á: "A",
            Ä: "A",
            Č: "C",
            Ď: "D",
            É: "E",
            Í: "I",
            Ĺ: "L",
            Ľ: "L",
            Ň: "N",
            Ó: "O",
            Ô: "O",
            Ŕ: "R",
            Š: "S",
            Ť: "T",
            Ú: "U",
            Ý: "Y",
            Ž: "Z",

            // Hungarian characters
            á: "a",
            é: "e",
            í: "i",
            ó: "o",
            ö: "oe",
            ő: "o",
            ú: "u",
            ü: "ue",
            ű: "u",
            Á: "A",
            É: "E",
            Í: "I",
            Ó: "O",
            Ö: "OE",
            Ő: "O",
            Ú: "U",
            Ü: "UE",
            Ű: "U",

            // Romanian characters
            ă: "a",
            â: "a",
            î: "i",
            ș: "s",
            ț: "t",
            Ă: "A",
            Â: "A",
            Î: "I",
            Ș: "S",
            Ț: "T",

            // Russian/Cyrillic characters
            а: "a",
            б: "b",
            в: "v",
            г: "g",
            д: "d",
            е: "e",
            ё: "yo",
            ж: "zh",
            з: "z",
            и: "i",
            й: "y",
            к: "k",
            л: "l",
            м: "m",
            н: "n",
            о: "o",
            п: "p",
            р: "r",
            с: "s",
            т: "t",
            у: "u",
            ф: "f",
            х: "h",
            ц: "ts",
            ч: "ch",
            ш: "sh",
            щ: "sch",
            ъ: "",
            ы: "y",
            ь: "",
            э: "e",
            ю: "yu",
            я: "ya",
            А: "A",
            Б: "B",
            В: "V",
            Г: "G",
            Д: "D",
            Е: "E",
            Ё: "YO",
            Ж: "ZH",
            З: "Z",
            И: "I",
            Й: "Y",
            К: "K",
            Л: "L",
            М: "M",
            Н: "N",
            О: "O",
            П: "P",
            Р: "R",
            С: "S",
            Т: "T",
            У: "U",
            Ф: "F",
            Х: "H",
            Ц: "TS",
            Ч: "CH",
            Ш: "SH",
            Щ: "SCH",
            Ъ: "",
            Ы: "Y",
            Ь: "",
            Э: "E",
            Ю: "YU",
            Я: "YA",

            // Greek characters
            α: "a",
            β: "b",
            γ: "g",
            δ: "d",
            ε: "e",
            ζ: "z",
            η: "h",
            θ: "th",
            ι: "i",
            κ: "k",
            λ: "l",
            μ: "m",
            ν: "n",
            ξ: "x",
            ο: "o",
            π: "p",
            ρ: "r",
            σ: "s",
            τ: "t",
            υ: "y",
            φ: "f",
            χ: "ch",
            ψ: "ps",
            ω: "w",
            Α: "A",
            Β: "B",
            Γ: "G",
            Δ: "D",
            Ε: "E",
            Ζ: "Z",
            Η: "H",
            Θ: "TH",
            Ι: "I",
            Κ: "K",
            Λ: "L",
            Μ: "M",
            Ν: "N",
            Ξ: "X",
            Ο: "O",
            Π: "P",
            Ρ: "R",
            Σ: "S",
            Τ: "T",
            Υ: "Y",
            Φ: "F",
            Χ: "CH",
            Ψ: "PS",
            Ω: "W",

            // Turkish characters
            ç: "c",
            ğ: "g",
            ı: "i",
            ş: "s",
            ü: "u",
            ö: "o",
            Ç: "C",
            Ğ: "G",
            İ: "I",
            Ş: "S",
            Ü: "U",
            Ö: "O",

            // Nordic characters
            å: "a",
            æ: "ae",
            ø: "o",
            đ: "d",
            þ: "th",
            ð: "d",
            Å: "A",
            Æ: "AE",
            Ø: "O",
            Đ: "D",
            Þ: "TH",
            Ð: "D",

            // Other common characters
            "€": "EUR",
            "£": "GBP",
            $: "USD",
            "¥": "JPY",
            "©": "c",
            "®": "r",
            "™": "tm",
        };

        return text.replace(/[^\x00-\x7F]/g, function (char) {
            return charMap[char] || char;
        });
    },

    getFileName() {
        const personalInfo = this.cvData.personalInfo;
        const name = personalInfo.fullName || "CV";

        // First convert non-Latin characters to Latin equivalents
        const latinName = this.convertToLatinChars(name);

        // Then clean up the filename
        const cleanName = latinName
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "-");

        const date = new Date().toISOString().split("T")[0];
        return `${cleanName}-${date}`;
    },
});
