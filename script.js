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

        this.init();
    }

    init() {
        this.initDarkMode();
        this.bindEvents();
        this.loadPersonalInfo();
        this.renderPreview();
        this.initKeyboardShortcuts();
        // Check if API key exists, if not, prompt or show a notice
        if (
            !localStorage.getItem("openai_api_key") &&
            this.openaiApiKey === "YOUR_FALLBACK_OPENAI_API_KEY_HERE"
        ) {
            this.showNotification(
                "OpenAI API Key not set. AI features will be limited. Please set it in 'API Key Settings'.",
                "warning",
                7000
            );
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
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem("darkMode", this.darkMode.toString());
        this.updateDarkMode();

        this.showNotification(
            `Switched to ${this.darkMode ? "dark" : "light"} mode`,
            "info",
            2000
        );
    }

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
    }

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
    }

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
    }

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
    }

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
    }

    updatePersonalInfo() {
        this.cvData.personalInfo = {
            fullName: document.getElementById("fullName")?.value || "",
            jobTitle: document.getElementById("jobTitle")?.value || "",
            email: document.getElementById("email")?.value || "",
            phone: document.getElementById("phone")?.value || "",
            location: document.getElementById("location")?.value || "",
            websites: Array.from(document.querySelectorAll(".website-field"))
                .map((field) => {
                    const url = field
                        .querySelector(".website-url")
                        ?.value.trim();
                    const type = field.querySelector(".website-type")?.value;

                    if (!url) return null;

                    const typeIcons = {
                        portfolio: "fas fa-globe",
                        linkedin: "fab fa-linkedin",
                        github: "fab fa-github",
                        instagram: "fab fa-instagram",
                        twitter: "fab fa-twitter",
                        personal: "fas fa-user",
                        custom: "fas fa-link",
                    };

                    return {
                        url: url,
                        type: type || "custom",
                        iconClass: typeIcons[type] || "fas fa-globe",
                    };
                })
                .filter(Boolean),
        };
        this.renderPreview();
    }

    loadPersonalInfo() {
        this.updatePersonalInfo();
    }

    handleAddSectionClick() {
        const selectEl = document.getElementById("sectionTypeSelect"),
            confirmBtn = document.getElementById("confirmAddSectionBtn"),
            addBtn = document.getElementById("addSectionBtn");
        this.sectionSelectVisible = !this.sectionSelectVisible;
        selectEl.classList.toggle("d-none", !this.sectionSelectVisible);
        confirmBtn.classList.toggle("d-none", !this.sectionSelectVisible);
        addBtn.innerHTML = this.sectionSelectVisible
            ? '<i class="fas fa-times me-2"></i>Cancel'
            : '<i class="fas fa-plus me-2"></i>Add New Section';
        addBtn.classList.toggle("btn-danger", this.sectionSelectVisible);
        addBtn.classList.toggle("btn-primary", !this.sectionSelectVisible);
        if (this.sectionSelectVisible) selectEl.focus();
    }

    addNewSection() {
        const sectionType =
            document.getElementById("sectionTypeSelect")?.value || "custom";
        const newSection = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: sectionType,
            title: this.getSectionTitle(sectionType),
            visible: true,
        };
        if (["experience", "education", "skills"].includes(sectionType))
            newSection.items = this.getDefaultContent(sectionType);
        else newSection.content = this.getDefaultContent(sectionType);
        this.sections.push(newSection);
        this.cvData.sections = this.sections;
        this.createSectionForm(newSection);
        this.renderPreview();
        this.handleAddSectionClick();
        if (document.getElementById("sectionTypeSelect"))
            document.getElementById("sectionTypeSelect").selectedIndex = 0;
        document
            .getElementById(`section-form-${newSection.id}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    getSectionTitle(type) {
        return (
            {
                summary: "Professional Summary",
                experience: "Work Experience",
                education: "Education",
                skills: "Skills",
                custom: "Custom Section",
            }[type] || "New Section"
        );
    }
    getDefaultContent(type) {
        const genId = () =>
            Date.now().toString() + Math.random().toString(36).substr(2, 5);
        return (
            {
                summary: "A brief, compelling overview...",
                experience: [
                    {
                        id: genId(),
                        company: "",
                        position: "",
                        duration: "",
                        location: "",
                        description: "",
                    },
                ],
                education: [
                    {
                        id: genId(),
                        institution: "",
                        degree: "",
                        year: "",
                        location: "",
                        details: "",
                    },
                ],
                skills: [
                    { id: genId(), category: "Technical Skills", items: [] },
                ],
                custom: "Detail custom content...",
            }[type] || ""
        );
    }

    createSectionForm(section) {
        const formContainer = document.getElementById("formContainer");
        if (!formContainer) return;
        const formDiv = document.createElement("div");
        formDiv.className =
            "form-section animate-fade-in card card-custom mb-4";
        formDiv.id = `section-form-${section.id}`;

        const showAiButtonForSection = [
            "summary",
            "experience",
            "education",
            "skills",
            "custom",
        ].includes(section.type);

        let formHTML = `
            <div class="card-body p-4">
            <div class="d-flex align-items-center justify-content-between mb-4">
                <div class="d-flex align-items-center flex-grow-1 min-width-0">
                    <div class="section-icon bg-gradient me-3 d-flex align-items-center justify-content-center text-white rounded ${this.getSectionGradient(
                        section.type
                    )}">
                        <i class="${this.getSectionIcon(
                            section.type
                        )} fs-5"></i>
                    </div>
                    <div class="flex-fill min-width-0">
                        <h3 id="section-title-${
                            section.id
                        }" class="h5 fw-bold text-secondary-800 cursor-pointer hover-text-primary text-truncate" onclick="cvGenius.editSectionTitle('${
            section.id
        }')" title="Click to edit: ${section.title}">${section.title}</h3>
                        <input id="section-title-input-${
                            section.id
                        }" class="form-control form-control-sm border-0 border-bottom border-primary bg-transparent fw-bold d-none w-100" value="${
            section.title
        }" onblur="cvGenius.saveSectionTitle('${
            section.id
        }')" onkeypress="if(event.key==='Enter') cvGenius.saveSectionTitle('${
            section.id
        }')">
                    </div>
                </div>
                <div class="d-flex align-items-center gap-1 flex-shrink-0 ms-2">
                    ${
                        showAiButtonForSection
                            ? `<button onclick="window.cvGenius.enhanceWithAI('${section.id}', '${section.type}')" class="btn btn-link btn-sm text-purple p-1" title="AI: Enhance this section"><i class="fas fa-robot"></i></button>`
                            : ""
                    }
                    <button onclick="window.cvGenius.showSectionOptions('${
                        section.id
                    }')" class="btn btn-link btn-sm text-muted p-1" title="Options"><i class="fas fa-cog"></i></button>
                    <button onclick="window.cvGenius.duplicateSection('${
                        section.id
                    }')" class="btn btn-link btn-sm text-muted p-1" title="Duplicate"><i class="fas fa-copy"></i></button>
                    <button onclick="window.cvGenius.moveSection('${
                        section.id
                    }', 'up')" class="btn btn-link btn-sm text-muted p-1" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                    <button onclick="window.cvGenius.moveSection('${
                        section.id
                    }', 'down')" class="btn btn-link btn-sm text-muted p-1" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                    <button onclick="window.cvGenius.removeSection('${
                        section.id
                    }')" class="btn btn-link btn-sm text-danger p-1" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div id="section-options-${
                section.id
            }" class="d-none bg border border-secondary rounded p-3 mb-3 animate-fade-in">
                <h4 class="fw-semibold text-secondary mb-3">Settings</h4>
                <div class="row g-3">
                    <div class="col-sm-6">
                        <label class="form-label small fw-medium text-secondary">Type:</label>
                        <select id="section-type-${
                            section.id
                        }" class="form-select form-select-sm" onchange="window.cvGenius.changeSectionType('${
            section.id
        }')">${["summary", "experience", "education", "skills", "custom"]
            .map(
                (t) =>
                    `<option value="${t}" ${
                        section.type === t ? "selected" : ""
                    }>${
                        {
                            summary: "📝 Summary",
                            experience: "💼 Experience",
                            education: "🎓 Education",
                            skills: "⚡ Skills",
                            custom: "🔧 Custom",
                        }[t]
                    }</option>`
            )
            .join("")}</select>
                    </div>
                    <div class="col-sm-6">
                        <label class="form-label small fw-medium text-secondary">Visibility:</label>
                        <div class="form-check">
                            <input type="checkbox" id="section-visible-${
                                section.id
                            }" ${
            section.visible ? "checked" : ""
        } onchange="window.cvGenius.toggleSectionVisibility('${
            section.id
        }')" class="form-check-input">
                            <label class="form-check-label small text-secondary" for="section-visible-${
                                section.id
                            }">Show in CV</label>
                        </div>
                    </div>
                </div>
                <div class="d-flex gap-2 mt-3">
                    <button onclick="window.cvGenius.hideSectionOptions('${
                        section.id
                    }')" class="btn btn-secondary btn-sm">Close</button>
                    <button onclick="window.cvGenius.exportSection('${
                        section.id
                    }')" class="btn btn-outline-secondary btn-sm">Export</button>
                </div>
            </div>`;
        const itemsToRender =
            Array.isArray(section.items) && section.items.length > 0
                ? section.items
                : this.getDefaultContent(section.type);
        if (section.type === "summary")
            formHTML += `<div class="mb-3">
                <label class="form-label fw-semibold">
                    <i class="fas fa-align-left me-2 text-primary"></i>Summary
                </label>
                <textarea id="summary-${
                    section.id
                }" class="form-control form-control-custom" rows="5" placeholder="Write a compelling summary...">${
                section.content || ""
            }</textarea>
            </div>`;
        else if (section.type === "experience")
            formHTML += `<div class="mb-3">
                <div id="experience-entries-${section.id}">${itemsToRender
                .map(
                    (item) =>
                        `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                            item.id
                        }">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label small fw-medium">Company</label>
                                    <input type="text" placeholder="e.g., Google" class="form-control form-control-sm" value="${
                                        item.company || ""
                                    }" data-field="company">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-medium">Position</label>
                                    <input type="text" placeholder="e.g., Engineer" class="form-control form-control-sm" value="${
                                        item.position || ""
                                    }" data-field="position">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-medium">Duration</label>
                                    <input type="text" placeholder="e.g., Jan 2020 - Present" class="form-control form-control-sm" value="${
                                        item.duration || ""
                                    }" data-field="duration">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-medium">Location</label>
                                    <input type="text" placeholder="e.g., Mountain View, CA" class="form-control form-control-sm" value="${
                                        item.location || ""
                                    }" data-field="location">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-medium">Description</label>
                                <textarea placeholder="Describe responsibilities..." class="form-control form-control-sm" rows="4" data-field="description">${
                                    item.description || ""
                                }</textarea>
                            </div>
                            ${
                                itemsToRender.length > 1
                                    ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                    <i class="fas fa-minus-circle me-1"></i>Remove
                                </button>`
                                    : ""
                            }
                        </div>`
                )
                .join("")}
                </div>
                <button type="button" onclick="window.cvGenius.addItemToSection('${
                    section.id
                }','${section.type}')" class="btn btn-secondary btn-sm">
                    <i class="fas fa-plus me-2"></i>Add Position
                </button>
            </div>`;
        else if (section.type === "education")
            formHTML += `<div class="mb-3">
                <div id="education-entries-${section.id}">${itemsToRender
                .map(
                    (item) =>
                        `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                            item.id
                        }">
                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label small fw-medium">Institution</label>
                                    <input type="text" placeholder="e.g., Stanford" class="form-control form-control-sm" value="${
                                        item.institution || ""
                                    }" data-field="institution">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-medium">Degree</label>
                                    <input type="text" placeholder="e.g., B.S. CS" class="form-control form-control-sm" value="${
                                        item.degree || ""
                                    }" data-field="degree">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-medium">Year/Duration</label>
                                    <input type="text" placeholder="e.g., 2016 - 2020" class="form-control form-control-sm" value="${
                                        item.year || ""
                                    }" data-field="year">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label small fw-medium">Location</label>
                                    <input type="text" placeholder="e.g., Stanford, CA" class="form-control form-control-sm" value="${
                                        item.location || ""
                                    }" data-field="location">
                                </div>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-medium">Details</label>
                                <textarea placeholder="e.g., GPA, Honors" class="form-control form-control-sm" rows="3" data-field="details">${
                                    item.details || ""
                                }</textarea>
                            </div>
                            ${
                                itemsToRender.length > 1
                                    ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                    <i class="fas fa-minus-circle me-1"></i>Remove
                                </button>`
                                    : ""
                            }
                        </div>`
                )
                .join("")}
                </div>
                <button type="button" onclick="window.cvGenius.addItemToSection('${
                    section.id
                }','${section.type}')" class="btn btn-secondary btn-sm">
                    <i class="fas fa-plus me-2"></i>Add Education
                </button>
            </div>`;
        else if (section.type === "skills")
            formHTML += `<div class="mb-3">
                <div id="skills-entries-${section.id}">${itemsToRender
                .map(
                    (item) =>
                        `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                            item.id
                        }">
                            <div class="mb-3">
                                <label class="form-label small fw-medium">Category</label>
                                <input type="text" placeholder="e.g., Programming" class="form-control form-control-sm" value="${
                                    item.category || ""
                                }" data-field="category">
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-medium">Skills (comma-separated)</label>
                                <textarea placeholder="e.g., JS, Python" class="form-control form-control-sm" rows="3" data-field="items">${
                                    Array.isArray(item.items)
                                        ? item.items.join(", ")
                                        : ""
                                }</textarea>
                            </div>
                            ${
                                itemsToRender.length > 1
                                    ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                    <i class="fas fa-minus-circle me-1"></i>Remove
                                </button>`
                                    : ""
                            }
                        </div>`
                )
                .join("")}
                </div>
                <button type="button" onclick="window.cvGenius.addItemToSection('${
                    section.id
                }','${section.type}')" class="btn btn-secondary btn-sm">
                    <i class="fas fa-plus me-2"></i>Add Category
                </button>
            </div>`;
        else
            formHTML += `<div class="mb-3">
                <label class="form-label fw-semibold">
                    <i class="fas fa-pencil-alt me-2 text-primary"></i>Custom Content
                </label>
                <textarea id="custom-content-${
                    section.id
                }" class="form-control form-control-custom" rows="5" placeholder="Add custom content...">${
                section.content || ""
            }</textarea>
            </div>`;
        formHTML += `</div>`;
        formDiv.innerHTML = formHTML;
        formContainer.appendChild(formDiv);
        this.bindSectionEvents(section);
    }

    getSectionIcon(type) {
        return (
            {
                summary: "fas fa-user-tie",
                experience: "fas fa-briefcase",
                education: "fas fa-graduation-cap",
                skills: "fas fa-cogs",
                custom: "fas fa-tools",
            }[type] || "fas fa-file-alt"
        );
    }
    getSectionGradient(type) {
        return (
            {
                summary: "bg-gradient-purple",
                experience: "bg-gradient-success",
                education: "bg-gradient-info",
                skills: "bg-gradient-warning",
                custom: "bg-gradient-danger",
            }[type] || "bg-gradient-secondary"
        );
    }

    bindSectionEvents(section) {
        const formEl = document.getElementById(`section-form-${section.id}`);
        if (!formEl) return;
        formEl.querySelectorAll("input, textarea").forEach((input) => {
            input.addEventListener("input", () =>
                this.updateSectionData(section.id)
            );
            input.addEventListener("change", () =>
                this.updateSectionData(section.id)
            );
        });
    }

    updateSectionData(sectionId) {
        const section = this.sections.find((s) => s.id === sectionId);
        if (!section) return;
        const formEl = document.getElementById(`section-form-${sectionId}`);
        if (!formEl) return;
        if (section.type === "summary")
            section.content =
                formEl.querySelector(`#summary-${sectionId}`)?.value || "";
        else if (["experience", "education", "skills"].includes(section.type)) {
            const itemEntries = formEl.querySelectorAll(".item-entry");
            section.items = Array.from(itemEntries).map((entryEl) => {
                const item = {
                    id:
                        entryEl.dataset.itemId ||
                        Date.now().toString() +
                            Math.random().toString(36).substr(2, 5),
                };
                entryEl.querySelectorAll("[data-field]").forEach((fieldEl) => {
                    const fieldName = fieldEl.dataset.field;
                    item[fieldName] =
                        fieldName === "items" && section.type === "skills"
                            ? fieldEl.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter((s) => s)
                            : fieldEl.value.trim();
                });
                return item;
            });
        } else if (section.type === "custom")
            section.content =
                formEl.querySelector(`#custom-content-${sectionId}`)?.value ||
                "";
        this.cvData.sections = this.sections;
        this.renderPreview();
    }

    addItemToSection(sectionId, sectionType) {
        const section = this.sections.find(
            (s) => s.id === sectionId && s.type === sectionType
        );
        if (!section || !Array.isArray(section.items)) return;
        const genId = () =>
            Date.now().toString() + Math.random().toString(36).substr(2, 5);
        let newItem;
        if (sectionType === "experience")
            newItem = {
                id: genId(),
                company: "",
                position: "",
                duration: "",
                location: "",
                description: "",
            };
        else if (sectionType === "education")
            newItem = {
                id: genId(),
                institution: "",
                degree: "",
                year: "",
                location: "",
                details: "",
            };
        else if (sectionType === "skills")
            newItem = { id: genId(), category: "", items: [] };
        else return;
        section.items.push(newItem);
        this.recreateSectionForm(section);
        this.renderPreview();
        const newEntryEl = document.querySelector(
            `#section-form-${sectionId} .item-entry[data-item-id="${newItem.id}"] input, #section-form-${sectionId} .item-entry[data-item-id="${newItem.id}"] textarea`
        );
        if (newEntryEl) newEntryEl.focus();
    }

    removeItemFromSection(sectionId, sectionType, itemId) {
        const section = this.sections.find(
            (s) => s.id === sectionId && s.type === sectionType
        );
        if (!section || !Array.isArray(section.items)) return;
        const itemIndex = section.items.findIndex((item) => item.id === itemId);
        if (itemIndex === -1) {
            console.warn("Item not found for removal:", itemId);
            return;
        }
        let confirmMsg = "Are you sure you want to remove this entry?";
        if (section.items.length === 1)
            confirmMsg = `This is the last entry in "${section.title}". Removing it will make this part empty. Continue?`;
        if (confirm(confirmMsg)) {
            section.items.splice(itemIndex, 1);
            if (section.items.length === 0) {
                const genId = () =>
                    Date.now().toString() +
                    Math.random().toString(36).substr(2, 5);
                if (sectionType === "experience")
                    section.items.push({
                        id: genId(),
                        company: "",
                        position: "",
                        duration: "",
                        location: "",
                        description: "",
                    });
                else if (sectionType === "education")
                    section.items.push({
                        id: genId(),
                        institution: "",
                        degree: "",
                        year: "",
                        location: "",
                        details: "",
                    });
                else if (sectionType === "skills")
                    section.items.push({
                        id: genId(),
                        category: "",
                        items: [],
                    });
            }
            this.recreateSectionForm(section);
            this.renderPreview();
            this.showNotification("Entry removed.", "info");
        }
    }

    editSectionTitle(sectionId) {
        const titleEl = document.getElementById(`section-title-${sectionId}`),
            inputEl = document.getElementById(
                `section-title-input-${sectionId}`
            );
        if (titleEl && inputEl) {
            titleEl.classList.add("d-none");
            inputEl.classList.remove("d-none");
            inputEl.focus();
            inputEl.select();
        }
    }
    saveSectionTitle(sectionId) {
        const titleEl = document.getElementById(`section-title-${sectionId}`),
            inputEl = document.getElementById(
                `section-title-input-${sectionId}`
            ),
            section = this.sections.find((s) => s.id === sectionId);
        if (titleEl && inputEl && section) {
            const newTitle = inputEl.value.trim() || section.title;
            if (newTitle) {
                section.title = newTitle;
                titleEl.textContent = newTitle;
                titleEl.title = `Click to edit: ${newTitle}`;
            } else {
                titleEl.textContent =
                    section.title || this.getSectionTitle(section.type);
                inputEl.value =
                    section.title || this.getSectionTitle(section.type);
            }
            titleEl.classList.remove("d-none");
            inputEl.classList.add("d-none");
            this.renderPreview();
            if (newTitle && newTitle !== section.title)
                this.showNotification("Section title updated!", "success");
        }
    }
    showSectionOptions(sectionId) {
        document.querySelectorAll('[id^="section-options-"]').forEach((p) => {
            if (p.id !== `section-options-${sectionId}`)
                p.classList.add("d-none");
        });
        document
            .getElementById(`section-options-${sectionId}`)
            ?.classList.toggle("d-none");
    }
    hideSectionOptions(sectionId) {
        document
            .getElementById(`section-options-${sectionId}`)
            ?.classList.add("d-none");
    }
    changeSectionType(sectionId) {
        const selectEl = document.getElementById(`section-type-${sectionId}`),
            section = this.sections.find((s) => s.id === sectionId);
        if (selectEl && section) {
            const newType = selectEl.value;
            if (
                section.type !== newType &&
                this.sectionHasContent(section) &&
                !confirm(
                    `Changing section type for "${section.title}" will reset its content. Continue?`
                )
            ) {
                selectEl.value = section.type;
                return;
            }
            section.type = newType;
            section.title = this.getSectionTitle(newType);
            if (["experience", "education", "skills"].includes(newType)) {
                delete section.content;
                section.items = this.getDefaultContent(newType);
            } else {
                delete section.items;
                section.content = this.getDefaultContent(newType);
            }
            this.recreateSectionForm(section);
            this.renderPreview();
            this.showNotification(
                `Section type changed. Title and content reset.`,
                "success"
            );
        }
    }
    sectionHasContent(section) {
        if (Array.isArray(section.items))
            return section.items.some((item) =>
                Object.keys(item).some(
                    (key) =>
                        key !== "id" &&
                        item[key] &&
                        (Array.isArray(item[key])
                            ? item[key].length > 0
                            : String(item[key]).trim() !== "")
                )
            );
        if (typeof section.content === "string") {
            const defaultContent = this.getDefaultContent(section.type);
            return (
                section.content.trim() !== "" &&
                section.content.trim() !==
                    (Array.isArray(defaultContent) ? "" : defaultContent.trim())
            );
        }
        return false;
    }
    recreateSectionForm(section) {
        document.getElementById(`section-form-${section.id}`)?.remove();
        this.createSectionForm(section);
    }
    toggleSectionVisibility(sectionId) {
        const checkbox = document.getElementById(
                `section-visible-${sectionId}`
            ),
            section = this.sections.find((s) => s.id === sectionId);
        if (checkbox && section) {
            section.visible = checkbox.checked;
            this.renderPreview();
            this.showNotification(
                `Section "${section.title}" ${
                    section.visible ? "shown" : "hidden"
                }.`,
                "info"
            );
        }
    }
    duplicateSection(sectionId) {
        const originalSection = this.sections.find((s) => s.id === sectionId);
        if (originalSection) {
            const duplicatedSection = JSON.parse(
                JSON.stringify(originalSection)
            );
            const genId = () =>
                Date.now().toString() + Math.random().toString(36).substr(2, 5);
            duplicatedSection.id = genId();
            duplicatedSection.title = `${originalSection.title} (Copy)`;
            if (Array.isArray(duplicatedSection.items))
                duplicatedSection.items.forEach((item) => (item.id = genId()));
            const index = this.sections.findIndex((s) => s.id === sectionId);
            this.sections.splice(index + 1, 0, duplicatedSection);
            this.cvData.sections = this.sections;
            this.createSectionForm(duplicatedSection);
            this.reorderSectionForms();
            this.renderPreview();
            this.showNotification("Section duplicated!", "success");
        }
    }
    moveSection(sectionId, direction) {
        const index = this.sections.findIndex((s) => s.id === sectionId);
        if (index === -1) return;
        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= this.sections.length) {
            this.showNotification(
                `Cannot move section further ${direction}.`,
                "warning"
            );
            return;
        }
        [this.sections[index], this.sections[newIndex]] = [
            this.sections[newIndex],
            this.sections[index],
        ];
        this.reorderSectionForms();
        this.renderPreview();
        this.showNotification(`Section moved ${direction}!`, "success");
    }
    reorderSectionForms() {
        const formContainer = document.getElementById("formContainer");
        if (!formContainer) return;
        Array.from(
            formContainer.querySelectorAll(".form-section[id^='section-form-']")
        ).forEach((form) => form.remove());
        this.sections.forEach((section) => {
            let formEl = document.getElementById(`section-form-${section.id}`);
            if (!formEl) this.createSectionForm(section);
            formEl = document.getElementById(`section-form-${section.id}`);
            if (formEl) formContainer.appendChild(formEl);
        });
    }
    exportSection(sectionId) {
        this.showNotification("Export Section: Not fully implemented.", "info");
    }
    removeSection(sectionId) {
        const section = this.sections.find((s) => s.id === sectionId);
        if (!section) return;
        let confirmMsg = `Delete "${section.title}"?`;
        if (this.sectionHasContent(section))
            confirmMsg += `\n\nThis section has content that will be lost.`;
        if (confirm(confirmMsg)) {
            this.sections = this.sections.filter((s) => s.id !== sectionId);
            this.cvData.sections = this.sections;
            const formEl = document.getElementById(`section-form-${sectionId}`);
            if (formEl) {
                formEl.style.transition =
                    "opacity 0.3s ease, transform 0.3s ease";
                formEl.style.opacity = "0";
                formEl.style.transform = "scale(0.95)";
                setTimeout(() => formEl.remove(), 300);
            }
            this.renderPreview();
            this.showNotification(
                `Section "${section.title}" deleted.`,
                "success"
            );
        }
    }
    reorderAllSections() {
        this.showNotification("Reorder All: Not fully implemented.", "info");
    }
    showBulkActions() {
        this.showNotification("Bulk Actions: Not fully implemented.", "info");
    }
    initKeyboardShortcuts() {
        document.addEventListener("keydown", (e) => {
            const activeEl = document.activeElement,
                isTyping =
                    activeEl &&
                    (activeEl.tagName === "INPUT" ||
                        activeEl.tagName === "TEXTAREA" ||
                        activeEl.isContentEditable);
            if (isTyping && e.key !== "Escape") return;
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case "s":
                        e.preventDefault();
                        this.saveCV();
                        break;
                    case "o":
                        e.preventDefault();
                        this.loadCV();
                        break;
                    case "p":
                        e.preventDefault();
                        this.printCV();
                        break;
                    case "n":
                        e.preventDefault();
                        document.getElementById("addSectionBtn").focus();
                        this.handleAddSectionClick();
                        break;
                    case "a":
                        e.preventDefault();
                        this.generateAISuggestions(true);
                        break;
                    case "b":
                        e.preventDefault();
                        this.showBulkActions();
                        break;
                }
            }
            if (e.key === "Escape") this.closeAllModals();
        });
    }
    closeAllModals() {
        document.getElementById("aiSuggestionPopup")?.classList.add("d-none");
        if (this.bulkModal) this.closeBulkActions();
        if (this.reorderModal) this.cancelReorder();
        document
            .querySelectorAll('[id^="section-options-"]')
            .forEach((p) => p.classList.add("d-none"));
        document.querySelector(".api-key-modal")?.remove();
        if (this.sectionSelectVisible) this.handleAddSectionClick();
    }
    renderPreview() {
        const personalInfo = this.cvData.personalInfo;

        const nameEl =
            document.getElementById("previewName") ||
            document.querySelector("#cvHeader h2");
        if (nameEl) {
            nameEl.textContent = personalInfo.fullName || "Your Name";
        }

        const jobTitleEl =
            document.getElementById("previewJobTitle") ||
            document.querySelector("#cvHeader p");
        if (jobTitleEl) {
            jobTitleEl.textContent = personalInfo.jobTitle || "Your Job Title";
            jobTitleEl.classList.toggle("text-muted", !personalInfo.jobTitle);
        }

        const contactInfoContainer = document.getElementById("cvContactInfo");
        if (contactInfoContainer) {
            const contactItems = [
                personalInfo.email
                    ? `<span class="d-flex align-items-center"><i class="fas fa-envelope me-2 text-primary"></i>${personalInfo.email}</span>`
                    : "",
                personalInfo.phone
                    ? `<span class="d-flex align-items-center"><i class="fas fa-phone me-2 text-primary"></i>${personalInfo.phone}</span>`
                    : "",
                personalInfo.location
                    ? `<span class="d-flex align-items-center"><i class="fas fa-map-marker-alt me-2 text-primary"></i>${personalInfo.location}</span>`
                    : "",
            ].filter(Boolean);

            contactInfoContainer.innerHTML =
                contactItems.length > 0
                    ? contactItems.join("")
                    : `<span class="small text-muted fst-italic">Add contact details</span>`;
        }

        const websitesContainer = document.getElementById("cvWebsites");
        if (websitesContainer) {
            if (personalInfo.websites && personalInfo.websites.length > 0) {
                const websiteItems = personalInfo.websites.map(
                    (w) =>
                        `<a href="${this.formatURL(
                            w.url
                        )}" class="text-primary text-decoration-none d-flex align-items-center" target="_blank" rel="noopener noreferrer"><i class="${
                            w.iconClass
                        } me-2"></i>${this.formatURLToDisplay(w.url)}</a>`
                );
                websitesContainer.innerHTML = websiteItems.join("");
            } else {
                websitesContainer.innerHTML = "";
            }
        }

        const sectionsContainer = document.getElementById(
            "cvSectionsContainer"
        );
        if (!sectionsContainer) return;

        sectionsContainer.innerHTML = "";
        this.sections
            .filter((s) => s.visible)
            .forEach((section) => {
                const sectionDiv = document.createElement("div");
                sectionDiv.className = "cv-section mb-5";
                sectionDiv.setAttribute("data-cv-section-id", section.id);

                let sectionContentHTML = `<h3 class="h4 fw-bold border-bottom border-2 ${this.getSectionBorderColor(
                    section.type
                )} pb-2 mb-3">${section.title}</h3>`;

                if (!this.sectionHasContent(section)) {
                    sectionContentHTML += `<p class="text-muted fst-italic">No content added for this section.</p>`;
                } else {
                    if (
                        section.type === "summary" ||
                        section.type === "custom"
                    ) {
                        sectionContentHTML += `<div class="text-secondary lh-lg">${this.formatTextToHtml(
                            section.content || ""
                        )}</div>`;
                    } else if (
                        section.type === "experience" &&
                        Array.isArray(section.items)
                    ) {
                        section.items.forEach((item) => {
                            const hasContent = Object.entries(item).some(
                                ([key, value]) => {
                                    return (
                                        key !== "id" &&
                                        value &&
                                        (typeof value === "string"
                                            ? value.trim() !== ""
                                            : true)
                                    );
                                }
                            );

                            if (!hasContent) return;

                            sectionContentHTML += `<div class="mb-4 bg bg-opacity-50 p-3 rounded cv-entry">${
                                item.position
                                    ? `<h5 class="fw-semibold text">${item.position}</h5>`
                                    : ""
                            }${
                                item.company
                                    ? `<p class="text-primary fw-medium mb-1">${
                                          item.company
                                      }${
                                          item.location
                                              ? ` <span class="text-muted fw-normal small">- ${item.location}</span>`
                                              : ""
                                      }</p>`
                                    : ""
                            }${
                                item.duration
                                    ? `<p class="small text-muted mb-2">${item.duration}</p>`
                                    : ""
                            }${
                                item.description
                                    ? `<div class="text-secondary lh-base">${this.formatTextToHtml(
                                          item.description
                                      )}</div>`
                                    : ""
                            }</div>`;
                        });
                    } else if (
                        section.type === "education" &&
                        Array.isArray(section.items)
                    ) {
                        section.items.forEach((item) => {
                            const hasContent = Object.entries(item).some(
                                ([key, value]) => {
                                    return (
                                        key !== "id" &&
                                        value &&
                                        (typeof value === "string"
                                            ? value.trim() !== ""
                                            : true)
                                    );
                                }
                            );

                            if (!hasContent) return;

                            sectionContentHTML += `<div class="mb-4 bg bg-opacity-50 p-3 rounded cv-entry">${
                                item.degree
                                    ? `<h5 class="fw-semibold text">${item.degree}</h5>`
                                    : ""
                            }${
                                item.institution
                                    ? `<p class="text-primary fw-medium mb-1">${
                                          item.institution
                                      }${
                                          item.location
                                              ? ` <span class="text-muted fw-normal small">- ${item.location}</span>`
                                              : ""
                                      }</p>`
                                    : ""
                            }${
                                item.year
                                    ? `<p class="small text-muted mb-2">${item.year}</p>`
                                    : ""
                            }${
                                item.details
                                    ? `<div class="text-secondary lh-base">${this.formatTextToHtml(
                                          item.details
                                      )}</div>`
                                    : ""
                            }</div>`;
                        });
                    } else if (
                        section.type === "skills" &&
                        Array.isArray(section.items)
                    ) {
                        section.items.forEach((category) => {
                            if (
                                !category.category &&
                                (!category.items || category.items.length === 0)
                            )
                                return;
                            sectionContentHTML += `<div class="mb-3">`;
                            if (category.category)
                                sectionContentHTML += `<h6 class="fw-semibold text-secondary mb-2">${category.category}:</h6>`;
                            if (category.items && category.items.length > 0) {
                                sectionContentHTML += `<div class="d-flex flex-wrap gap-2">${category.items
                                    .map(
                                        (skill) =>
                                            `<span class="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill fw-medium">${skill}</span>`
                                    )
                                    .join("")}</div>`;
                            }
                            sectionContentHTML += `</div>`;
                        });
                    }
                }
                sectionDiv.innerHTML = sectionContentHTML;
                sectionsContainer.appendChild(sectionDiv);
            });
    }
    getSectionBorderColor(type) {
        return (
            {
                summary: "border-purple",
                experience: "border-success",
                education: "border-info",
                skills: "border-warning",
                custom: "border-danger",
            }[type] || "border-primary"
        );
    }
    formatURL(url) {
        if (!url) return "#";
        return !url.startsWith("http://") && !url.startsWith("https://")
            ? "https://" + url
            : url;
    }
    formatURLToDisplay(url) {
        if (!url) return "N/A";
        const displayUrl = url.replace(/https?:\/\//, "");
        return displayUrl;
    }
    formatTextToHtml(text) {
        if (!text || typeof text !== "string") return "";
        const esc = (s) =>
            s
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        let html = "",
            inList = false;
        text.split("\n").forEach((line) => {
            const tl = line.trim();
            if (tl.startsWith("* ") || tl.startsWith("- ")) {
                if (!inList) {
                    html += '<ul class="list-unstyled ps-3 my-2">';
                    inList = true;
                }
                html += `<li class="mb-1"><i class="fas fa-circle text-primary me-2" style="font-size: 0.5rem;"></i>${esc(
                    tl.substring(2)
                )}</li>`;
            } else {
                if (inList) {
                    html += "</ul>";
                    inList = false;
                }
                if (tl) html += `<p class="mb-2">${esc(tl)}</p>`;
            }
        });
        if (inList) html += "</ul>";
        return html || `<p>${esc(text).replace(/\n/g, "<br>")}</p>`;
    }

    async enhancePersonalInfoWithAI() {
        this.showNotification(
            "AI is reviewing personal information...",
            "info"
        );
        try {
            const pi = this.cvData.personalInfo;
            const currentInfo = `Full Name: ${
                pi.fullName || "N/A"
            }, Job Title: ${pi.jobTitle || "N/A"}, Email: ${
                pi.email || "N/A"
            }, Phone: ${pi.phone || "N/A"}, Location: ${pi.location || "N/A"}`;
            const prompt = `Review the following personal contact information for a CV. Suggest improvements for conciseness, professionalism, or any missing critical elements (like a more professional job title if the current one is vague, or a more standard phone format). Provide a brief suggestion. IMPORTANT: You MUST respond in the exact same language as the input text. If the input is in Polish, respond in Polish. If the input is in Spanish, respond in Spanish, etc.
Current Info: ${currentInfo}
Suggestion:`;
            const suggestion = await this.callOpenAI(prompt);
            if (suggestion)
                this.showNotification(
                    `AI Suggestion for Personal Info: ${suggestion}`,
                    "info",
                    10000
                );
        } catch (error) {
            this.showNotification(
                "Could not get AI suggestion for personal info.",
                "error"
            );
        }
    }

    async generateAISuggestions(forceOpen = false) {
        const aiPopup = document.getElementById("aiSuggestionPopup");
        if (!forceOpen && aiPopup && !aiPopup.classList.contains("d-none")) {
        } else {
            aiPopup.classList.remove("d-none");
        }
        const suggestionsList = document.getElementById("suggestionsList"),
            aiAnalysisScore = document.getElementById("aiAnalysisScore"),
            aiSuggestionsCount = document.getElementById("aiSuggestionsCount"),
            aiImpactLevel = document.getElementById("aiImpactLevel");
        suggestionsList.innerHTML = `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2 text-muted">Analyzing with AI...</p></div>`;
        aiAnalysisScore.textContent = "??";
        aiSuggestionsCount.textContent = "?";
        aiImpactLevel.textContent = "Calculating...";
        try {
            const cvData = this.cvData;
            let cvContentText = `CV for ${
                cvData.personalInfo.fullName || "User"
            } (${cvData.personalInfo.jobTitle || "N/A"})\nContact: ${
                cvData.personalInfo.email || "N/A"
            }, ${cvData.personalInfo.phone || "N/A"}, Location: ${
                cvData.personalInfo.location || "N/A"
            }\nWebsites: ${
                (cvData.personalInfo.websites || [])
                    .map((w) => w.url)
                    .join(", ") || "N/A"
            }\n\n`;
            this.sections
                .filter((s) => s.visible)
                .forEach((section) => {
                    cvContentText += `SECTION: ${section.title} (${section.type})\n`;
                    if (Array.isArray(section.items)) {
                        section.items.forEach((item) => {
                            Object.entries(item)
                                .filter(([k, v]) => k !== "id" && v)
                                .forEach(([key, value]) => {
                                    cvContentText += `${key}: ${
                                        Array.isArray(value)
                                            ? value.join(", ")
                                            : value
                                    }\n`;
                                });
                        });
                    } else if (section.content) {
                        cvContentText += `${section.content}\n`;
                    }
                    cvContentText += "\n";
                });
            if (cvContentText.length < 100 && !cvData.personalInfo.fullName) {
                suggestionsList.innerHTML = `<div class="text-center py-4"><i class="fas fa-info-circle text-primary fs-4 mb-2"></i><p class="text-muted">Add more content for AI analysis.</p></div>`;
                return;
            }
            const prompt = `Analyze the CV. Provide: 1. Overall Score (0-100). 2. Impact Level (Low, Medium, High). 3. 5-7 specific, actionable suggestions formatted as: [Priority:High/Medium/Low] [Type:Content/Formatting/Skills/Experience/etc.] - Suggestion text. CRITICAL: You MUST first check what language the user is using on the CV then you MUST respond in the exact same language as the CV content. If the CV is in Polish, respond in Polish. If in Spanish, respond in Spanish, etc.
CV CONTENT:\n${cvContentText}`;
            const aiResponse = await this.callOpenAI(prompt);
            const scoreMatch = aiResponse.match(/Overall Score: (\d+)/i);
            const impactMatch = aiResponse.match(
                /Impact Level: (Low|Medium|High)/i
            );
            const suggestions = aiResponse
                .split("\n")
                .filter((line) =>
                    line.match(/^\[Priority:.*?\] \[Type:.*?\] - .*?$/)
                );
            aiAnalysisScore.textContent = scoreMatch ? scoreMatch[1] : "N/A";
            aiImpactLevel.textContent = impactMatch ? impactMatch[1] : "N/A";
            aiSuggestionsCount.textContent = suggestions.length;
            if (suggestions.length > 0)
                suggestionsList.innerHTML = suggestions
                    .map((s) => this.formatAISuggestionItem(s))
                    .join("");
            else
                suggestionsList.innerHTML = `<div class="text-center py-4"><i class="fas fa-check-circle text-success fs-4 mb-2"></i><p class="text-muted">AI analysis complete. No critical suggestions found or format was unexpected.</p></div>`;
        } catch (error) {
            console.error("AI Suggestions Error:", error);
            suggestionsList.innerHTML = `<div class="text-center py-4 text-danger"><i class="fas fa-exclamation-triangle fs-4 mb-2"></i><p>Error fetching AI suggestions. ${
                error.message.includes("API key")
                    ? "Check API key."
                    : "Try again."
            }</p></div>`;
            aiAnalysisScore.textContent = "Err";
            aiSuggestionsCount.textContent = "0";
            aiImpactLevel.textContent = "Error";
        }
    }
    formatAISuggestionItem(suggestionText) {
        const match = suggestionText.match(
            /^\[Priority:(.*?)\] \[Type:(.*?)\] - (.*)$/
        );
        if (!match)
            return `<div class="suggestion-item border rounded p-3"><p class="mb-0">${suggestionText}</p></div>`;
        const [, priority, type, text] = match;
        let pColCls = "bg-secondary text-white",
            tIcon = "fas fa-lightbulb";
        if (priority.toLowerCase() === "high") pColCls = "bg-danger text-white";
        else if (priority.toLowerCase() === "medium")
            pColCls = "bg-warning text";
        else if (priority.toLowerCase() === "low")
            pColCls = "bg-success text-white";
        if (type.toLowerCase().includes("content")) tIcon = "fas fa-file-alt";
        else if (type.toLowerCase().includes("format"))
            tIcon = "fas fa-paint-brush";
        else if (type.toLowerCase().includes("skill")) tIcon = "fas fa-cogs";
        else if (type.toLowerCase().includes("experien"))
            tIcon = "fas fa-briefcase";
        return `<div class="suggestion-item border rounded p-3 mb-3 animate-fade-in" data-priority="${priority.toLowerCase()}" data-type="${type.toLowerCase()}">
            <div class="d-flex align-items-start gap-3">
                <div class="p-2 rounded-circle ${pColCls} d-flex align-items-center justify-content-center" style="width: 2.5rem; height: 2.5rem;">
                    <i class="${tIcon}"></i>
                </div>
                <div class="flex-fill">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="badge ${pColCls} px-2 py-1">${priority} Priority</span>
                        <span class="badge bg text-dark px-2 py-1">${type}</span>
                    </div>
                    <p class="mb-0 text-secondary lh-base">${text}</p>
                </div>
                <button class="btn btn-link btn-sm text-muted p-1" title="Apply suggestion (Placeholder)">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        </div>`;
    }
    filterAISuggestions() {
        const prioFilter = document.getElementById("aiFilterPriority").value,
            typeFilter = document.getElementById("aiFilterType").value;
        document
            .querySelectorAll("#suggestionsList .suggestion-item")
            .forEach((item) => {
                const show =
                    (prioFilter === "all" ||
                        item.dataset.priority === prioFilter) &&
                    (typeFilter === "all" || item.dataset.type === typeFilter);
                item.style.display = show ? "" : "none";
            });
    }
    exportSuggestions() {
        this.showNotification("Export Suggestions: Not implemented.", "info");
    }

    async quickAIAction(actionType) {
        this.showNotification(
            `AI performing: ${actionType.replace(/_/g, " ")}...`,
            "info"
        );
        let sectionToEnhance;
        let prompt = "";
        const jobTitle = this.cvData.personalInfo.jobTitle || "a professional";
        const langInstruction =
            "IMPORTANT: You MUST respond in the exact same language as the input text. If the input is in Polish, respond in Polish. If the input is in Spanish, respond in Spanish, etc.";

        switch (actionType) {
            case "enhance_summary":
                sectionToEnhance = this.sections.find(
                    (s) => s.type === "summary"
                );
                if (!sectionToEnhance) {
                    this.showNotification(
                        "No summary section found.",
                        "warning"
                    );
                    return;
                }
                prompt = `Enhance this CV summary for a ${jobTitle}: "${sectionToEnhance.content}". Make it impactful and concise. Return only the enhanced summary text. ${langInstruction}`;
                try {
                    const enhanced = await this.callOpenAI(prompt);
                    if (enhanced) {
                        sectionToEnhance.content = enhanced;
                        this.recreateSectionForm(sectionToEnhance);
                        this.renderPreview();
                        this.showNotification("Summary enhanced!", "success");
                    }
                } catch (e) {
                    this.showNotification(
                        "AI summary enhancement failed.",
                        "error"
                    );
                }
                break;
            case "optimize_keywords":
                let cvSnap = `Job Title: ${jobTitle}. Sections: ${this.sections
                    .filter((s) => s.visible)
                    .map((s) => s.title)
                    .join(", ")}.`;
                if (this.sections.find((s) => s.type === "summary")?.content)
                    cvSnap += ` Summary: ${this.sections
                        .find((s) => s.type === "summary")
                        .content.substring(0, 100)}...`;
                prompt = `Based on CV snapshot for a ${jobTitle}, suggest 5-7 relevant keywords (nouns, short phrases) for ATS. List comma-separated. Respond in English. Snapshot: ${cvSnap}`;
                try {
                    const keywords = await this.callOpenAI(prompt);
                    this.showNotification(
                        `AI Suggested Keywords: ${keywords}. Add to relevant sections.`,
                        "info",
                        10000
                    );
                } catch (e) {
                    this.showNotification(
                        "AI keyword suggestion failed.",
                        "error"
                    );
                }
                break;
            case "improve_experience":
                sectionToEnhance = this.sections.find(
                    (s) => s.type === "experience"
                );
                if (
                    !sectionToEnhance ||
                    !sectionToEnhance.items ||
                    sectionToEnhance.items.length === 0
                ) {
                    this.showNotification(
                        "No experience items found.",
                        "warning"
                    );
                    return;
                }
                const firstExp = sectionToEnhance.items[0];
                prompt = `Rewrite job description for ${jobTitle} (role: ${
                    firstExp.position || "N/A"
                } at ${
                    firstExp.company || "N/A"
                }) to be action-oriented/quantifiable (STAR method). Original: "${
                    firstExp.description
                }". Return improved text only. ${langInstruction}`;
                try {
                    const improved = await this.callOpenAI(prompt);
                    if (improved) {
                        firstExp.description = improved;
                        this.recreateSectionForm(sectionToEnhance);
                        this.renderPreview();
                        this.showNotification(
                            "First experience description improved!",
                            "success"
                        );
                    }
                } catch (e) {
                    this.showNotification(
                        "AI experience improvement failed.",
                        "error"
                    );
                }
                break;
            case "suggest_skills":
                prompt = `Based on CV for a ${jobTitle}, suggest 3-5 relevant skills (technical/soft). List comma-separated. Respond in English.`;
                try {
                    const skills = await this.callOpenAI(prompt);
                    this.showNotification(
                        `AI Suggested Skills: ${skills}. Add to skills section.`,
                        "info",
                        10000
                    );
                } catch (e) {
                    this.showNotification(
                        "AI skill suggestion failed.",
                        "error"
                    );
                }
                break;
            default:
                this.showNotification(
                    `Quick AI Action '${actionType}' not implemented.`,
                    "warning"
                );
        }
    }

    async enhanceWithAI(sectionId, sectionType) {
        const section = this.sections.find((s) => s.id === sectionId);
        if (!section) {
            this.showNotification("Section not found.", "error");
            return;
        }
        this.showNotification(`AI enhancing ${section.title}...`, "info");
        let promptText = "";
        let targetElementId = null;
        let isItemBased = false;
        let itemToUpdate = null;
        let fieldToUpdate = null;
        const jobTitleForContext =
            this.cvData.personalInfo.jobTitle || "a professional";
        const langInstruction =
            "CRITICAL: You MUST respond in the exact same language as the CV content. If the CV is in Polish, respond in Polish. If it is in Spanish, respond in Spanish, etc. ALWAYS match the users input!";

        if (sectionType === "summary") {
            promptText = `Enhance CV summary for a ${jobTitleForContext}: "${section.content}". Make impactful, concise. Return enhanced text only. ${langInstruction}`;
            targetElementId = `summary-${section.id}`;
        } else if (sectionType === "experience") {
            if (!section.items || section.items.length === 0) {
                this.showNotification("No experience entries.", "warning");
                return;
            }
            itemToUpdate = section.items[0];
            fieldToUpdate = "description";
            isItemBased = true;
            promptText = `Rewrite job description for "${
                itemToUpdate.position || "N/A"
            }" at "${
                itemToUpdate.company || "N/A"
            }" (${jobTitleForContext}) to be action-oriented/quantifiable (STAR method). Original: "${
                itemToUpdate.description
            }". Return improved text only. ${langInstruction}`;
        } else if (sectionType === "education") {
            if (!section.items || section.items.length === 0) {
                this.showNotification("No education entries.", "warning");
                return;
            }
            itemToUpdate = section.items[0];
            fieldToUpdate = "details";
            isItemBased = true;
            promptText = `Enhance 'details' for education: Degree: "${itemToUpdate.degree}", Institution: "${itemToUpdate.institution}". Current details: "${itemToUpdate.details}". Make compelling for a ${jobTitleForContext}. Return enhanced text only. ${langInstruction}`;
        } else if (sectionType === "skills") {
            const skillsText = (section.items || [])
                .map((cat) => `${cat.category}: ${cat.items.join(", ")}`)
                .join("; ");
            promptText = `For a ${jobTitleForContext} with skills "${skillsText}", suggest 3-5 additional relevant skills OR refine categorization/phrasing for clarity. Return list or improved categories/skills. Respond in English.`;
        } else if (sectionType === "custom") {
            promptText = `Improve text for CV custom section "${section.title}" for a ${jobTitleForContext}: "${section.content}". Make professional, clear. Return improved text only. ${langInstruction}`;
            targetElementId = `custom-content-${section.id}`;
        } else {
            this.showNotification(
                `AI enhancement for '${sectionType}' not configured.`,
                "info"
            );
            return;
        }

        try {
            const enhancedContent = await this.callOpenAI(promptText);
            if (enhancedContent) {
                if (sectionType === "skills") {
                    this.showNotification(
                        `AI Skill Suggestions: ${enhancedContent}. Add manually.`,
                        "info",
                        15000
                    );
                } else if (isItemBased && itemToUpdate && fieldToUpdate) {
                    itemToUpdate[fieldToUpdate] = enhancedContent;
                } else if (targetElementId) {
                    section.content = enhancedContent;
                    const el = document.getElementById(targetElementId);
                    if (el) el.value = enhancedContent;
                } else {
                    section.content = enhancedContent;
                }
                if (sectionType !== "skills") {
                    this.recreateSectionForm(section);
                    this.renderPreview();
                }
                this.showNotification(
                    `${section.title} processed by AI!`,
                    "success"
                );
            }
        } catch (e) {
            this.showNotification(
                `AI enhancement for ${section.title} failed. ${e.message}`,
                "error"
            );
        }
    }

    addWebsiteField() {
        const container = document.getElementById("websiteContainer");
        const websiteId = Date.now();

        const websiteHtml = `
            <div class="input-group mb-2 website-field" data-website-id="${websiteId}">
                <select class="form-select form-select-sm website-type">
                    <option value="portfolio">🌐 Portfolio</option>
                    <option value="linkedin">💼 LinkedIn</option>
                    <option value="github">💻 GitHub</option>
                    <option value="instagram">📷 Instagram</option>
                    <option value="twitter">🐦 Twitter</option>
                    <option value="custom">🔗 Custom</option>
                </select>
                <input type="url" class="form-control form-control-sm website-url" placeholder="https://example.com">
                <button type="button" class="btn btn-outline-danger btn-sm remove-website">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", websiteHtml);

        const removeBtn = container.querySelector(
            `[data-website-id="${websiteId}"] .remove-website`
        );
        removeBtn.addEventListener("click", () => {
            container
                .querySelector(`[data-website-id="${websiteId}"]`)
                .remove();
            this.updatePersonalInfo();
        });

        const websiteElement = container.querySelector(
            `[data-website-id="${websiteId}"]`
        );
        websiteElement
            .querySelector(".website-type")
            .addEventListener("change", () => this.updatePersonalInfo());
        websiteElement
            .querySelector(".website-url")
            .addEventListener("input", () => this.updatePersonalInfo());
    }
    addWebsiteFieldWithData(websiteData) {
        const container = document.getElementById("websiteContainer");
        if (!container) return;

        const websiteId = Date.now() + Math.random();
        const {
            url = "",
            type = "custom",
            iconClass = "fas fa-link",
        } = websiteData;

        const typeLabels = {
            portfolio: "🌐 Portfolio",
            linkedin: "💼 LinkedIn",
            github: "💻 GitHub",
            instagram: "📷 Instagram",
            twitter: "🐦 Twitter",
            personal: "👤 Personal Website",
            custom: "🔗 Custom",
        };

        const websiteHtml = `
            <div class="input-group mb-2 website-field" data-website-id="${websiteId}">
                <select class="form-select form-select-sm website-type">
                    <option value="portfolio" ${
                        type === "portfolio" ? "selected" : ""
                    }>🌐 Portfolio</option>
                    <option value="linkedin" ${
                        type === "linkedin" ? "selected" : ""
                    }>💼 LinkedIn</option>
                    <option value="github" ${
                        type === "github" ? "selected" : ""
                    }>💻 GitHub</option>
                    <option value="instagram" ${
                        type === "instagram" ? "selected" : ""
                    }>📷 Instagram</option>
                    <option value="twitter" ${
                        type === "twitter" ? "selected" : ""
                    }>🐦 Twitter</option>
                    <option value="personal" ${
                        type === "personal" ? "selected" : ""
                    }>👤 Personal Website</option>
                    <option value="custom" ${
                        type === "custom" ? "selected" : ""
                    }>🔗 Custom</option>
                </select>
                <input type="url" class="form-control form-control-sm website-url" value="${url}" placeholder="https://example.com">
                <button type="button" class="btn btn-outline-danger btn-sm remove-website">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        container.insertAdjacentHTML("beforeend", websiteHtml);

        const removeBtn = container.querySelector(
            `[data-website-id="${websiteId}"] .remove-website`
        );
        removeBtn.addEventListener("click", () => {
            container
                .querySelector(`[data-website-id="${websiteId}"]`)
                .remove();
            this.updatePersonalInfo();
        });

        const websiteElement = container.querySelector(
            `[data-website-id="${websiteId}"]`
        );
        websiteElement
            .querySelector(".website-type")
            .addEventListener("change", () => this.updatePersonalInfo());
        websiteElement
            .querySelector(".website-url")
            .addEventListener("input", () => this.updatePersonalInfo());
    }

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
        notification.style.cssText =
            "top: 20px; right: 20px; z-index: 1055; max-width: 400px;";

        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.classList.remove("show");
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 150);
            }
        }, duration);
    }
    async manageApiKey() {
        const existingModal = document.querySelector(".api-key-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className =
            "api-key-modal position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
        modalOverlay.style.cssText =
            "background: rgba(0,0,0,0.5); z-index: 1060; backdrop-filter: blur(3px);";

        const modalContent = document.createElement("div");
        modalContent.className = "bg rounded shadow-lg p-4 mx-3";
        modalContent.style.cssText = "max-width: 500px; width: 100%;";

        const currentKey = localStorage.getItem("openai_api_key") || "";
        const maskedKey = currentKey
            ? currentKey.substring(0, 7) +
              "..." +
              currentKey.substring(currentKey.length - 4)
            : "Not set";

        modalContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0"><i class="fas fa-key me-2 text-primary"></i>OpenAI API Key</h4>
                <button type="button" class="btn-close" id="closeApiModal"></button>
            </div>
            <div class="mb-3">
                <p class="text-muted small mb-2">Current key: <code>${maskedKey}</code></p>
                <p class="text-muted small">Enter your OpenAI API key to enable AI features. Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" class="text-primary">OpenAI Platform</a>.</p>
            </div>
            <div class="mb-3">
                <label for="apiKeyInput" class="form-label">API Key:</label>
                <input type="password" id="apiKeyInput" class="form-control" placeholder="sk-..." value="${currentKey}">
                <div class="form-check mt-2">
                    <input type="checkbox" id="showApiKey" class="form-check-input">
                    <label for="showApiKey" class="form-check-label small">Show key</label>
                </div>
            </div>
            <div class="d-flex gap-2">
                <button type="button" id="saveApiKey" class="btn btn-primary flex-fill">
                    <i class="fas fa-save me-1"></i>Save
                </button>
                <button type="button" id="testApiKey" class="btn btn-outline-primary">
                    <i class="fas fa-flask me-1"></i>Test
                </button>
                <button type="button" id="clearApiKey" class="btn btn-outline-danger">
                    <i class="fas fa-trash me-1"></i>Clear
                </button>
            </div>
            <div id="apiKeyStatus" class="mt-3"></div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        const apiKeyInput = document.getElementById("apiKeyInput");
        const showKeyCheckbox = document.getElementById("showApiKey");
        const statusDiv = document.getElementById("apiKeyStatus");

        showKeyCheckbox.addEventListener("change", () => {
            apiKeyInput.type = showKeyCheckbox.checked ? "text" : "password";
        });

        document
            .getElementById("closeApiModal")
            .addEventListener("click", () => {
                modalOverlay.remove();
            });

        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.remove();
            }
        });

        document.getElementById("saveApiKey").addEventListener("click", () => {
            const key = apiKeyInput.value.trim();
            if (key) {
                if (!key.startsWith("sk-")) {
                    statusDiv.innerHTML =
                        '<div class="alert alert-warning small">Warning: API key should start with "sk-"</div>';
                    return;
                }
                localStorage.setItem("openai_api_key", key);
                this.openaiApiKey = key;
                statusDiv.innerHTML =
                    '<div class="alert alert-success small">API key saved successfully!</div>';
                this.showNotification("API key saved successfully!", "success");
                setTimeout(() => modalOverlay.remove(), 1500);
            } else {
                statusDiv.innerHTML =
                    '<div class="alert alert-danger small">Please enter a valid API key</div>';
            }
        });

        document
            .getElementById("testApiKey")
            .addEventListener("click", async () => {
                const key = apiKeyInput.value.trim();
                if (!key) {
                    statusDiv.innerHTML =
                        '<div class="alert alert-danger small">Please enter an API key to test</div>';
                    return;
                }

                const testBtn = document.getElementById("testApiKey");
                const originalText = testBtn.innerHTML;
                testBtn.innerHTML =
                    '<i class="fas fa-spinner fa-spin me-1"></i>Testing...';
                testBtn.disabled = true;

                try {
                    const response = await fetch(this.openaiBaseUrl, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${key}`,
                        },
                        body: JSON.stringify({
                            model: "gpt-3.5-turbo",
                            messages: [{ role: "user", content: "Hello" }],
                            max_tokens: 5,
                        }),
                    });

                    if (response.ok) {
                        statusDiv.innerHTML =
                            '<div class="alert alert-success small">✅ API key is valid and working!</div>';
                    } else if (response.status === 401) {
                        statusDiv.innerHTML =
                            '<div class="alert alert-danger small">❌ Invalid API key</div>';
                    } else {
                        statusDiv.innerHTML =
                            '<div class="alert alert-warning small">⚠️ API key might be valid but there was an error</div>';
                    }
                } catch (error) {
                    statusDiv.innerHTML =
                        '<div class="alert alert-danger small">❌ Error testing API key</div>';
                } finally {
                    testBtn.innerHTML = originalText;
                    testBtn.disabled = false;
                }
            });

        document.getElementById("clearApiKey").addEventListener("click", () => {
            if (confirm("Are you sure you want to clear the API key?")) {
                localStorage.removeItem("openai_api_key");
                this.openaiApiKey = "YOUR_FALLBACK_OPENAI_API_KEY_HERE";
                apiKeyInput.value = "";
                statusDiv.innerHTML =
                    '<div class="alert alert-info small">API key cleared</div>';
                this.showNotification("API key cleared", "info");
            }
        });

        apiKeyInput.focus();
    }

    async promptForApiKey() {
        return new Promise((resolve) => {
            const existingModal = document.querySelector(
                ".api-key-prompt-modal"
            );
            if (existingModal) {
                existingModal.remove();
            }

            const modalOverlay = document.createElement("div");
            modalOverlay.className =
                "api-key-prompt-modal position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
            modalOverlay.style.cssText =
                "background: rgba(0,0,0,0.7); z-index: 1070; backdrop-filter: blur(3px);";

            const modalContent = document.createElement("div");
            modalContent.className = "bg rounded shadow-lg p-4 mx-3";
            modalContent.style.cssText = "max-width: 450px; width: 100%;";

            modalContent.innerHTML = `
                <div class="text-center mb-3">
                    <i class="fas fa-robot fs-1 text-primary mb-2"></i>
                    <h4>AI Features Require API Key</h4>
                    <p class="text-muted small">Enter your OpenAI API key to use AI enhancement features.</p>
                </div>
                <div class="mb-3">
                    <label for="promptApiKeyInput" class="form-label">OpenAI API Key:</label>
                    <input type="password" id="promptApiKeyInput" class="form-control" placeholder="sk-...">
                    <div class="form-text">Get your key from <a href="https://platform.openai.com/api-keys" target="_blank" class="text-primary">OpenAI Platform</a></div>
                </div>
                <div class="d-flex gap-2">
                    <button type="button" id="promptSaveKey" class="btn btn-primary flex-fill">Continue</button>
                    <button type="button" id="promptSkipKey" class="btn btn-outline-secondary">Skip</button>
                </div>
                <div id="promptKeyStatus" class="mt-2"></div>
            `;

            modalOverlay.appendChild(modalContent);
            document.body.appendChild(modalOverlay);

            const apiKeyInput = document.getElementById("promptApiKeyInput");
            const statusDiv = document.getElementById("promptKeyStatus");

            document
                .getElementById("promptSaveKey")
                .addEventListener("click", () => {
                    const key = apiKeyInput.value.trim();
                    if (key) {
                        if (!key.startsWith("sk-")) {
                            statusDiv.innerHTML =
                                '<div class="alert alert-warning small">Warning: API key should start with "sk-"</div>';
                            return;
                        }
                        localStorage.setItem("openai_api_key", key);
                        modalOverlay.remove();
                        resolve(key);
                    } else {
                        statusDiv.innerHTML =
                            '<div class="alert alert-danger small">Please enter a valid API key</div>';
                    }
                });

            document
                .getElementById("promptSkipKey")
                .addEventListener("click", () => {
                    modalOverlay.remove();
                    resolve(null);
                });

            apiKeyInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    document.getElementById("promptSaveKey").click();
                }
            });

            apiKeyInput.focus();
        });
    }
    async callOpenAI(prompt) {
        let apiKey =
            localStorage.getItem("openai_api_key") || this.openaiApiKey;
        if (
            !apiKey ||
            !apiKey.startsWith("sk-") ||
            apiKey === "YOUR_FALLBACK_OPENAI_API_KEY_HERE"
        ) {
            apiKey = await this.promptForApiKey();
            if (!apiKey) throw new Error("OpenAI API key required.");
            this.openaiApiKey = apiKey;
        }
        const systemPrompt =
            "You are a helpful CV/resume writing assistant. Provide concise, professional, and actionable advice. CRITICAL INSTRUCTION: Respond in the same language the user uses. For example, if the input is in Polish, respond in Polish. If the input is in Spanish, respond in Spanish. If the input is in French, respond in French. Only use English if the input is clearly in English or if the language cannot be determined. Language detection is your highest priority.";
        try {
            const response = await fetch(this.openaiBaseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: prompt },
                    ],
                    max_tokens: 800,
                    temperature: 0.6,
                }),
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (response.status === 401) {
                    localStorage.removeItem("openai_api_key");
                    this.openaiApiKey = "YOUR_FALLBACK_OPENAI_API_KEY_HERE";
                    throw new Error("Invalid OpenAI API key. Re-enter key.");
                }
                throw new Error(
                    `OpenAI API Error: ${response.status} - ${
                        errData.error?.message || "Unknown error"
                    }`
                );
            }
            const data = await response.json();
            if (!data.choices || !data.choices[0] || !data.choices[0].message)
                throw new Error("Invalid response from OpenAI API.");
            return data.choices[0].message.content.trim();
        } catch (error) {
            console.error("OpenAI API Error:", error);
            this.showNotification(error.message, "error");
            throw error;
        }
    }
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
        a.download = `cv-genius-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
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
    }

    showExportModal() {
        const existingModal = document.querySelector(".export-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className =
            "export-modal position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
        modalOverlay.style.cssText =
            "background: rgba(0,0,0,0.5); z-index: 1060; backdrop-filter: blur(3px);";

        const modalContent = document.createElement("div");
        modalContent.className = "bg rounded shadow-lg p-4 mx-3";
        modalContent.style.cssText = "max-width: 500px; width: 100%;";

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
            // PDF export using jsPDF or similar library 
        });

        document.getElementById("printCVGUI").addEventListener("click", () => {
            modalOverlay.remove();
            this.printPDF();
        });

        document.getElementById("exportHTML").addEventListener("click", () => {
            modalOverlay.remove();
            this.exportToHTML();
        });
    }

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
    }

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
    }

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
    }

    getFileName() {
        const personalInfo = this.cvData.personalInfo;
        const name = personalInfo.fullName || "CV";
        const cleanName = name
            .replace(/[^a-zA-Z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
        const date = new Date().toISOString().split("T")[0];
        return `${cleanName}-${date}`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.cvGenius = new CVGenius();
});
