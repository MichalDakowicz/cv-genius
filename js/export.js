/**
 * CV Genius Export/Import Functionality
 * Handles saving, loading, and exporting CVs in various formats
 */

// Extend CVGenius with export/import methods
Object.assign(CVGenius.prototype, {
    saveCV() {
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
        };
        localStorage.setItem("cvGeniusData", JSON.stringify(cvData));
        this.showNotification("CV saved successfully!", "success");
        this.renderPreview();
        const blob = new Blob([JSON.stringify(cvData, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    loadCV() {
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

                    if (!cvData || typeof cvData !== "object") {
                        throw new Error("Invalid CV data format");
                    }

                    if (
                        cvData.personalInfo &&
                        typeof cvData.personalInfo === "object"
                    ) {
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
                                element.value =
                                    cvData.personalInfo[field] || "";
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

                                cvData.personalInfo.websites.forEach(
                                    (website) => {
                                        this.addWebsiteFieldWithData(website);
                                    }
                                );
                            }
                        }
                    }

                    if (cvData.sections && Array.isArray(cvData.sections)) {
                        this.sections = [];
                        const formContainer =
                            document.getElementById("formContainer");
                        if (formContainer) {
                            const sectionForms =
                                formContainer.querySelectorAll(".form-section");
                            sectionForms.forEach((form) => form.remove());
                        }

                        cvData.sections.forEach((sectionData) => {
                            if (!sectionData.id || !sectionData.type) {
                                console.warn(
                                    "Skipping invalid section:",
                                    sectionData
                                );
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
                                ["experience", "education", "skills"].includes(
                                    section.type
                                )
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

                    this.showNotification("CV loaded successfully!", "success");

                    localStorage.setItem(
                        "cvGeniusData",
                        JSON.stringify(cvData)
                    );
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
                <h4 class="mb-0"><i class="fas fa-download me-2 text-primary"></i>Export CV</h4>
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
            printWindow.document.write(printContent);
            printWindow.document.close();

            await new Promise((resolve) => {
                printWindow.onload = resolve;
                setTimeout(resolve, 500);
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

            // Store original styles and classes
            const originalStyles = {
                paddingTop: originalElement.style.paddingTop,
                marginTop: originalElement.style.marginTop,
                padding: originalElement.style.padding,
                headerMarginBottom: cvHeader
                    ? cvHeader.style.marginBottom
                    : null,
                className: originalElement.className,
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

    getFileName() {
        const personalInfo = this.cvData.personalInfo;
        const name = personalInfo.fullName || "CV";
        const cleanName = name
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
        const date = new Date().toISOString().split("T")[0];
        return `${cleanName}-${date}`;
    },
});
