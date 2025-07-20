/**
 * CV Genius Section Management
 * Handles creating, editing, and managing CV sections
 */

// Extend CVGenius with section management methods
Object.assign(CVGenius.prototype, {
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
    },

    addNewSection() {
        const sectionType =
            document.getElementById("sectionTypeSelect")?.value || "custom";
        const newSection = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: sectionType,
            title: this.getSectionTitle(sectionType),
            visible: true,
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
            ].includes(sectionType)
        )
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

        // Auto-save after adding new section
        this.autoSaveToLocalStorage();
    },

    getSectionTitle(type) {
        return (
            {
                summary: "Professional Summary",
                experience: "Work Experience",
                education: "Education",
                skills: "Skills",
                projects: "Projects",
                publications: "Publications",
                languages: "Languages",
                certifications: "Certifications",
                awards: "Awards & Achievements",
                volunteer: "Volunteer Experience",
                references: "References",
                custom: "Custom Section",
            }[type] || "New Section"
        );
    },

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
                projects: [
                    {
                        id: genId(),
                        name: "",
                        description: "",
                        technologies: "",
                        duration: "",
                        url: "",
                        github: "",
                    },
                ],
                publications: [
                    {
                        id: genId(),
                        title: "",
                        authors: "",
                        publication: "",
                        year: "",
                        url: "",
                        doi: "",
                    },
                ],
                languages: [
                    {
                        id: genId(),
                        language: "",
                        proficiency: "",
                        certification: "",
                    },
                ],
                certifications: [
                    {
                        id: genId(),
                        name: "",
                        issuer: "",
                        date: "",
                        expiryDate: "",
                        credentialId: "",
                        url: "",
                    },
                ],
                awards: [
                    {
                        id: genId(),
                        name: "",
                        issuer: "",
                        date: "",
                        description: "",
                    },
                ],
                volunteer: [
                    {
                        id: genId(),
                        organization: "",
                        role: "",
                        duration: "",
                        location: "",
                        description: "",
                    },
                ],
                references: [
                    {
                        id: genId(),
                        name: "",
                        title: "",
                        company: "",
                        email: "",
                        phone: "",
                        relationship: "",
                    },
                ],
                custom: "Detail custom content...",
            }[type] || ""
        );
    },

    createSectionForm(section) {
        const formContainer = document.getElementById("formContainer");
        if (!formContainer) return;
        const formDiv = this.buildSectionFormElement(section);
        formContainer.appendChild(formDiv);
        this.bindSectionEvents(section);
    },

    buildSectionFormElement(section) {
        const formDiv = document.createElement("div");
        formDiv.className =
            "form-section animate-fade-in card card-custom mb-4";
        formDiv.id = `section-form-${section.id}`;

        const showAiButtonForSection = [
            "summary",
            "custom",
            "projects",
            "publications",
            "volunteer",
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
                            ? `<button onclick="window.cvGenius.enhanceWithAI('${section.id}', '${section.type}')" class="btn btn-sm text-purple p-1" title="AI: Enhance this section"><i class="fas fa-robot"></i></button>`
                            : ""
                    }
                    <button onclick="window.cvGenius.showSectionOptions('${
                        section.id
                    }')" class="btn btn-sm text-muted p-1" title="Options"><i class="fas fa-cog"></i></button>
                    <button onclick="window.cvGenius.duplicateSection('${
                        section.id
                    }')" class="btn btn-sm text-muted p-1" title="Duplicate"><i class="fas fa-copy"></i></button>
                    <button onclick="window.cvGenius.moveSection('${
                        section.id
                    }', 'up')" class="btn btn-sm text-muted p-1" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                    <button onclick="window.cvGenius.moveSection('${
                        section.id
                    }', 'down')" class="btn btn-sm text-muted p-1" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                    <button onclick="window.cvGenius.removeSection('${
                        section.id
                    }')" class="btn btn-sm text-danger p-1" title="Delete"><i class="fas fa-trash"></i></button>
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
        }')">${[
            "summary",
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
            "custom",
        ]
            .map(
                (t) =>
                    `<option value="${t}" ${
                        section.type === t ? "selected" : ""
                    }>${
                        {
                            summary: '<i class="fas fa-file-alt"></i> Summary',
                            experience:
                                '<i class="fas fa-briefcase"></i> Experience',
                            education:
                                '<i class="fas fa-graduation-cap"></i> Education',
                            skills: '<i class="fas fa-bolt"></i> Skills',
                            projects:
                                '<i class="fas fa-project-diagram"></i> Projects',
                            publications:
                                '<i class="fas fa-book"></i> Publications',
                            languages:
                                '<i class="fas fa-language"></i> Languages',
                            certifications:
                                '<i class="fas fa-certificate"></i> Certifications',
                            awards: '<i class="fas fa-trophy"></i> Awards',
                            volunteer:
                                '<i class="fas fa-hands-helping"></i> Volunteer',
                            references:
                                '<i class="fas fa-users"></i> References',
                            custom: '<i class="fas fa-wrench"></i> Custom',
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

        if (section.type === "summary") {
            formHTML += this.createSummaryForm(section);
        } else if (section.type === "experience") {
            formHTML += this.createExperienceForm(section, itemsToRender);
        } else if (section.type === "education") {
            formHTML += this.createEducationForm(section, itemsToRender);
        } else if (section.type === "skills") {
            formHTML += this.createSkillsForm(section, itemsToRender);
        } else if (section.type === "projects") {
            formHTML += this.createProjectsForm(section, itemsToRender);
        } else if (section.type === "publications") {
            formHTML += this.createPublicationsForm(section, itemsToRender);
        } else if (section.type === "languages") {
            formHTML += this.createLanguagesForm(section, itemsToRender);
        } else if (section.type === "certifications") {
            formHTML += this.createCertificationsForm(section, itemsToRender);
        } else if (section.type === "awards") {
            formHTML += this.createAwardsForm(section, itemsToRender);
        } else if (section.type === "volunteer") {
            formHTML += this.createVolunteerForm(section, itemsToRender);
        } else if (section.type === "references") {
            formHTML += this.createReferencesForm(section, itemsToRender);
        } else {
            formHTML += this.createCustomForm(section);
        }

        formHTML += `</div>`;
        formDiv.innerHTML = formHTML;
        return formDiv;
    },

    createSummaryForm(section) {
        return `<div class="mb-3">
            <label class="form-label fw-semibold">
                <i class="fas fa-align-left me-2 text-primary"></i>Summary
            </label>
            <textarea id="summary-${
                section.id
            }" class="form-control form-control-custom" rows="5" placeholder="Write a compelling summary...">${
            section.content || ""
        }</textarea>
        </div>`;
    },

    createExperienceForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="experience-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Position ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                <button onclick="window.cvGenius.enhanceWithAI('${
                                    section.id
                                }', '${section.type}', '${
                        item.id
                    }')" class="btn btn-sm text-purple p-1" title="AI: Enhance this position">
                                    <i class="fas fa-robot"></i>
                                </button>
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
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
    },

    createEducationForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="education-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Education ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                <button onclick="window.cvGenius.enhanceWithAI('${
                                    section.id
                                }', '${section.type}', '${
                        item.id
                    }')" class="btn btn-sm text-purple p-1" title="AI: Enhance this education">
                                    <i class="fas fa-robot"></i>
                                </button>
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
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
    },

    createSkillsForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="skills-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Skills Category ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                <button onclick="window.cvGenius.enhanceWithAI('${
                                    section.id
                                }', '${section.type}', '${
                        item.id
                    }')" class="btn btn-sm text-purple p-1" title="AI: Enhance this skill category">
                                    <i class="fas fa-robot"></i>
                                </button>
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
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
    },

    createCustomForm(section) {
        return `<div class="mb-3">
            <label class="form-label fw-semibold">
                <i class="fas fa-pencil-alt me-2 text-primary"></i>Custom Content
            </label>
            <textarea id="custom-content-${
                section.id
            }" class="form-control form-control-custom" rows="5" placeholder="Add custom content...">${
            section.content || ""
        }</textarea>
        </div>`;
    },

    createProjectsForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="projects-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Project ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                <button onclick="window.cvGenius.enhanceWithAI('${
                                    section.id
                                }', '${section.type}', '${
                        item.id
                    }')" class="btn btn-sm text-purple p-1" title="AI: Enhance this project">
                                    <i class="fas fa-robot"></i>
                                </button>
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Project Name</label>
                                <input type="text" placeholder="e.g., E-commerce Platform" class="form-control form-control-sm" value="${
                                    item.name || ""
                                }" data-field="name">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Duration</label>
                                <input type="text" placeholder="e.g., Jan 2023 - Mar 2023" class="form-control form-control-sm" value="${
                                    item.duration || ""
                                }" data-field="duration">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Technologies</label>
                                <input type="text" placeholder="e.g., React, Node.js, MongoDB" class="form-control form-control-sm" value="${
                                    item.technologies || ""
                                }" data-field="technologies">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Project URL</label>
                                <input type="url" placeholder="https://project-demo.com" class="form-control form-control-sm" value="${
                                    item.url || ""
                                }" data-field="url">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">GitHub</label>
                                <input type="url" placeholder="https://github.com/username/project" class="form-control form-control-sm" value="${
                                    item.github || ""
                                }" data-field="github">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-medium">Description</label>
                                <textarea placeholder="Describe the project, your role, and achievements..." class="form-control form-control-sm" rows="3" data-field="description">${
                                    item.description || ""
                                }</textarea>
                            </div>
                        </div>
                    </div>`
            )
            .join("")}</div>
            <button type="button" onclick="window.cvGenius.addItemToSection('${
                section.id
            }','${section.type}')" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-plus me-1"></i>Add Project
            </button>
        </div>`;
    },

    createPublicationsForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="publications-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Publication ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-12">
                                <label class="form-label small fw-medium">Title</label>
                                <input type="text" placeholder="e.g., Machine Learning in Healthcare" class="form-control form-control-sm" value="${
                                    item.title || ""
                                }" data-field="title">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Authors</label>
                                <input type="text" placeholder="e.g., John Doe, Jane Smith" class="form-control form-control-sm" value="${
                                    item.authors || ""
                                }" data-field="authors">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Publication</label>
                                <input type="text" placeholder="e.g., Journal of AI Research" class="form-control form-control-sm" value="${
                                    item.publication || ""
                                }" data-field="publication">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">Year</label>
                                <input type="text" placeholder="e.g., 2023" class="form-control form-control-sm" value="${
                                    item.year || ""
                                }" data-field="year">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">DOI</label>
                                <input type="text" placeholder="e.g., 10.1000/xyz123" class="form-control form-control-sm" value="${
                                    item.doi || ""
                                }" data-field="doi">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">URL</label>
                                <input type="url" placeholder="https://journal.com/article" class="form-control form-control-sm" value="${
                                    item.url || ""
                                }" data-field="url">
                            </div>
                        </div>
                    </div>`
            )
            .join("")}</div>
            <button type="button" onclick="window.cvGenius.addItemToSection('${
                section.id
            }','${section.type}')" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-plus me-1"></i>Add Publication
            </button>
        </div>`;
    },

    createLanguagesForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="languages-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Language ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">Language</label>
                                <input type="text" placeholder="e.g., Spanish" class="form-control form-control-sm" value="${
                                    item.language || ""
                                }" data-field="language">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">Proficiency</label>
                                <select class="form-select form-select-sm" data-field="proficiency">
                                    <option value="">Select level</option>
                                    <option value="Native" ${
                                        item.proficiency === "Native"
                                            ? "selected"
                                            : ""
                                    }>Native</option>
                                    <option value="Fluent" ${
                                        item.proficiency === "Fluent"
                                            ? "selected"
                                            : ""
                                    }>Fluent</option>
                                    <option value="Advanced" ${
                                        item.proficiency === "Advanced"
                                            ? "selected"
                                            : ""
                                    }>Advanced</option>
                                    <option value="Intermediate" ${
                                        item.proficiency === "Intermediate"
                                            ? "selected"
                                            : ""
                                    }>Intermediate</option>
                                    <option value="Basic" ${
                                        item.proficiency === "Basic"
                                            ? "selected"
                                            : ""
                                    }>Basic</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">Certification</label>
                                <input type="text" placeholder="e.g., DELE C1" class="form-control form-control-sm" value="${
                                    item.certification || ""
                                }" data-field="certification">
                            </div>
                        </div>
                    </div>`
            )
            .join("")}</div>
            <button type="button" onclick="window.cvGenius.addItemToSection('${
                section.id
            }','${section.type}')" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-plus me-1"></i>Add Language
            </button>
        </div>`;
    },

    createCertificationsForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="certifications-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Certification ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Certification Name</label>
                                <input type="text" placeholder="e.g., AWS Certified Solutions Architect" class="form-control form-control-sm" value="${
                                    item.name || ""
                                }" data-field="name">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Issuing Authority</label>
                                <input type="text" placeholder="e.g., Amazon Web Services" class="form-control form-control-sm" value="${
                                    item.issuer || ""
                                }" data-field="issuer">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">Issue Date</label>
                                <input type="text" placeholder="e.g., March 2023" class="form-control form-control-sm" value="${
                                    item.date || ""
                                }" data-field="date">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">Expiry Date</label>
                                <input type="text" placeholder="e.g., March 2026" class="form-control form-control-sm" value="${
                                    item.expiryDate || ""
                                }" data-field="expiryDate">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">Credential ID</label>
                                <input type="text" placeholder="e.g., ABC-123-DEF" class="form-control form-control-sm" value="${
                                    item.credentialId || ""
                                }" data-field="credentialId">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-medium">Verification URL</label>
                                <input type="url" placeholder="https://verify.certification.com" class="form-control form-control-sm" value="${
                                    item.url || ""
                                }" data-field="url">
                            </div>
                        </div>
                    </div>`
            )
            .join("")}</div>
            <button type="button" onclick="window.cvGenius.addItemToSection('${
                section.id
            }','${section.type}')" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-plus me-1"></i>Add Certification
            </button>
        </div>`;
    },

    createAwardsForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="awards-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Award ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-md-8">
                                <label class="form-label small fw-medium">Award Name</label>
                                <input type="text" placeholder="e.g., Employee of the Year" class="form-control form-control-sm" value="${
                                    item.name || ""
                                }" data-field="name">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-medium">Date</label>
                                <input type="text" placeholder="e.g., 2023" class="form-control form-control-sm" value="${
                                    item.date || ""
                                }" data-field="date">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-medium">Issuing Organization</label>
                                <input type="text" placeholder="e.g., Tech Corp Inc." class="form-control form-control-sm" value="${
                                    item.issuer || ""
                                }" data-field="issuer">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-medium">Description</label>
                                <textarea placeholder="Describe the achievement and its significance..." class="form-control form-control-sm" rows="2" data-field="description">${
                                    item.description || ""
                                }</textarea>
                            </div>
                        </div>
                    </div>`
            )
            .join("")}</div>
            <button type="button" onclick="window.cvGenius.addItemToSection('${
                section.id
            }','${section.type}')" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-plus me-1"></i>Add Award
            </button>
        </div>`;
    },

    createVolunteerForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="volunteer-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Volunteer Position ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                <button onclick="window.cvGenius.enhanceWithAI('${
                                    section.id
                                }', '${section.type}', '${
                        item.id
                    }')" class="btn btn-sm text-purple p-1" title="AI: Enhance this volunteer position">
                                    <i class="fas fa-robot"></i>
                                </button>
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Organization</label>
                                <input type="text" placeholder="e.g., Red Cross" class="form-control form-control-sm" value="${
                                    item.organization || ""
                                }" data-field="organization">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Role</label>
                                <input type="text" placeholder="e.g., Volunteer Coordinator" class="form-control form-control-sm" value="${
                                    item.role || ""
                                }" data-field="role">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Duration</label>
                                <input type="text" placeholder="e.g., Jan 2022 - Dec 2022" class="form-control form-control-sm" value="${
                                    item.duration || ""
                                }" data-field="duration">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Location</label>
                                <input type="text" placeholder="e.g., New York, NY" class="form-control form-control-sm" value="${
                                    item.location || ""
                                }" data-field="location">
                            </div>
                            <div class="col-12">
                                <label class="form-label small fw-medium">Description</label>
                                <textarea placeholder="Describe your volunteer work and impact..." class="form-control form-control-sm" rows="3" data-field="description">${
                                    item.description || ""
                                }</textarea>
                            </div>
                        </div>
                    </div>`
            )
            .join("")}</div>
            <button type="button" onclick="window.cvGenius.addItemToSection('${
                section.id
            }','${section.type}')" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-plus me-1"></i>Add Volunteer Experience
            </button>
        </div>`;
    },

    createReferencesForm(section, itemsToRender) {
        return `<div class="mb-3">
            <div id="references-entries-${section.id}">${itemsToRender
            .map(
                (item) =>
                    `<div class="border rounded p-3 mb-3 item-entry" data-item-id="${
                        item.id
                    }">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h6 class="mb-0 text-muted">Reference ${
                                itemsToRender.indexOf(item) + 1
                            }</h6>
                            <div class="d-flex gap-1">
                                ${
                                    itemsToRender.length > 1
                                        ? `<button type="button" onclick="window.cvGenius.removeItemFromSection('${section.id}','${section.type}','${item.id}')" class="btn btn-sm btn-outline-danger">
                                        <i class="fas fa-minus-circle me-1"></i>Remove
                                    </button>`
                                        : ""
                                }
                            </div>
                        </div>
                        <div class="row g-3 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Name</label>
                                <input type="text" placeholder="e.g., John Smith" class="form-control form-control-sm" value="${
                                    item.name || ""
                                }" data-field="name">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Title</label>
                                <input type="text" placeholder="e.g., Senior Manager" class="form-control form-control-sm" value="${
                                    item.title || ""
                                }" data-field="title">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Company</label>
                                <input type="text" placeholder="e.g., Tech Corp" class="form-control form-control-sm" value="${
                                    item.company || ""
                                }" data-field="company">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Relationship</label>
                                <input type="text" placeholder="e.g., Former Supervisor" class="form-control form-control-sm" value="${
                                    item.relationship || ""
                                }" data-field="relationship">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Email</label>
                                <input type="email" placeholder="john.smith@company.com" class="form-control form-control-sm" value="${
                                    item.email || ""
                                }" data-field="email">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-medium">Phone</label>
                                <input type="tel" placeholder="(555) 123-4567" class="form-control form-control-sm" value="${
                                    item.phone || ""
                                }" data-field="phone">
                            </div>
                        </div>
                    </div>`
            )
            .join("")}</div>
            <button type="button" onclick="window.cvGenius.addItemToSection('${
                section.id
            }','${section.type}')" class="btn btn-outline-primary btn-sm">
                <i class="fas fa-plus me-1"></i>Add Reference
            </button>
        </div>`;
    },

    getSectionIcon(type) {
        return (
            {
                summary: "fas fa-user-tie",
                experience: "fas fa-briefcase",
                education: "fas fa-graduation-cap",
                skills: "fas fa-cogs",
                projects: "fas fa-project-diagram",
                publications: "fas fa-book",
                languages: "fas fa-language",
                certifications: "fas fa-certificate",
                awards: "fas fa-trophy",
                volunteer: "fas fa-hands-helping",
                references: "fas fa-users",
                custom: "fas fa-tools",
            }[type] || "fas fa-file-alt"
        );
    },

    getSectionGradient(type) {
        return (
            {
                summary: "bg-gradient-purple",
                experience: "bg-gradient-success",
                education: "bg-gradient-info",
                skills: "bg-gradient-warning",
                projects: "bg-gradient-primary",
                publications: "bg-gradient-secondary",
                languages: "bg-gradient-dark",
                certifications: "bg-gradient-success",
                awards: "bg-gradient-warning",
                volunteer: "bg-gradient-info",
                references: "bg-gradient-secondary",
                custom: "bg-gradient-danger",
            }[type] || "bg-gradient-secondary"
        );
    },

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
    },

    updateSectionData(sectionId) {
        const section = this.sections.find((s) => s.id === sectionId);
        if (!section) return;
        const formEl = document.getElementById(`section-form-${sectionId}`);
        if (!formEl) return;

        if (section.type === "summary") {
            section.content =
                formEl.querySelector(`#summary-${sectionId}`)?.value || "";
        } else if (
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
        } else if (section.type === "custom") {
            section.content =
                formEl.querySelector(`#custom-content-${sectionId}`)?.value ||
                "";
        }

        // Auto-save to localStorage after a short delay
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSaveToLocalStorage();
        }, 1000);

        this.cvData.sections = this.sections;
        this.renderPreview();
    },

    addItemToSection(sectionId, sectionType) {
        const section = this.sections.find(
            (s) => s.id === sectionId && s.type === sectionType
        );
        if (!section || !Array.isArray(section.items)) return;

        const genId = () =>
            Date.now().toString() + Math.random().toString(36).substr(2, 5);
        let newItem;

        if (sectionType === "experience") {
            newItem = {
                id: genId(),
                company: "",
                position: "",
                duration: "",
                location: "",
                description: "",
            };
        } else if (sectionType === "education") {
            newItem = {
                id: genId(),
                institution: "",
                degree: "",
                year: "",
                location: "",
                details: "",
            };
        } else if (sectionType === "skills") {
            newItem = { id: genId(), category: "", items: [] };
        } else if (sectionType === "projects") {
            newItem = {
                id: genId(),
                name: "",
                description: "",
                technologies: "",
                duration: "",
                url: "",
                github: "",
            };
        } else if (sectionType === "publications") {
            newItem = {
                id: genId(),
                title: "",
                authors: "",
                publication: "",
                year: "",
                url: "",
                doi: "",
            };
        } else if (sectionType === "languages") {
            newItem = {
                id: genId(),
                language: "",
                proficiency: "",
                certification: "",
            };
        } else if (sectionType === "certifications") {
            newItem = {
                id: genId(),
                name: "",
                issuer: "",
                date: "",
                expiryDate: "",
                credentialId: "",
                url: "",
            };
        } else if (sectionType === "awards") {
            newItem = {
                id: genId(),
                name: "",
                issuer: "",
                date: "",
                description: "",
            };
        } else if (sectionType === "volunteer") {
            newItem = {
                id: genId(),
                organization: "",
                role: "",
                duration: "",
                location: "",
                description: "",
            };
        } else if (sectionType === "references") {
            newItem = {
                id: genId(),
                name: "",
                title: "",
                company: "",
                email: "",
                phone: "",
                relationship: "",
            };
        } else return;

        section.items.push(newItem);
        this.recreateSectionForm(section);
        this.renderPreview();

        const newEntryEl = document.querySelector(
            `#section-form-${sectionId} .item-entry[data-item-id="${newItem.id}"] input, #section-form-${sectionId} .item-entry[data-item-id="${newItem.id}"] textarea`
        );
        if (newEntryEl) newEntryEl.focus();
    },

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
        if (section.items.length === 1) {
            confirmMsg = `This is the last entry in "${section.title}". Removing it will make this part empty. Continue?`;
        }

        if (confirm(confirmMsg)) {
            section.items.splice(itemIndex, 1);
            if (section.items.length === 0) {
                const genId = () =>
                    Date.now().toString() +
                    Math.random().toString(36).substr(2, 5);

                if (sectionType === "experience") {
                    section.items.push({
                        id: genId(),
                        company: "",
                        position: "",
                        duration: "",
                        location: "",
                        description: "",
                    });
                } else if (sectionType === "education") {
                    section.items.push({
                        id: genId(),
                        institution: "",
                        degree: "",
                        year: "",
                        location: "",
                        details: "",
                    });
                } else if (sectionType === "skills") {
                    section.items.push({
                        id: genId(),
                        category: "",
                        items: [],
                    });
                } else if (sectionType === "projects") {
                    section.items.push({
                        id: genId(),
                        name: "",
                        description: "",
                        technologies: "",
                        duration: "",
                        url: "",
                        github: "",
                    });
                } else if (sectionType === "publications") {
                    section.items.push({
                        id: genId(),
                        title: "",
                        authors: "",
                        publication: "",
                        year: "",
                        url: "",
                        doi: "",
                    });
                } else if (sectionType === "languages") {
                    section.items.push({
                        id: genId(),
                        language: "",
                        proficiency: "",
                        certification: "",
                    });
                } else if (sectionType === "certifications") {
                    section.items.push({
                        id: genId(),
                        name: "",
                        issuer: "",
                        date: "",
                        expiryDate: "",
                        credentialId: "",
                        url: "",
                    });
                } else if (sectionType === "awards") {
                    section.items.push({
                        id: genId(),
                        name: "",
                        issuer: "",
                        date: "",
                        description: "",
                    });
                } else if (sectionType === "volunteer") {
                    section.items.push({
                        id: genId(),
                        organization: "",
                        role: "",
                        duration: "",
                        location: "",
                        description: "",
                    });
                } else if (sectionType === "references") {
                    section.items.push({
                        id: genId(),
                        name: "",
                        title: "",
                        company: "",
                        email: "",
                        phone: "",
                        relationship: "",
                    });
                }
            }
            this.recreateSectionForm(section);
            this.renderPreview();
            this.showNotification("Entry removed.", "info");
        }
    },

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
    },

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
            if (newTitle && newTitle !== section.title) {
                this.showNotification("Section title updated!", "success");
            }
        }
    },

    showSectionOptions(sectionId) {
        document.querySelectorAll('[id^="section-options-"]').forEach((p) => {
            if (p.id !== `section-options-${sectionId}`)
                p.classList.add("d-none");
        });
        document
            .getElementById(`section-options-${sectionId}`)
            ?.classList.toggle("d-none");
    },

    hideSectionOptions(sectionId) {
        document
            .getElementById(`section-options-${sectionId}`)
            ?.classList.add("d-none");
    },

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
    },

    sectionHasContent(section) {
        if (Array.isArray(section.items)) {
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
        }
        if (typeof section.content === "string") {
            const defaultContent = this.getDefaultContent(section.type);
            return (
                section.content.trim() !== "" &&
                section.content.trim() !==
                    (Array.isArray(defaultContent) ? "" : defaultContent.trim())
            );
        }
        return false;
    },

    recreateSectionForm(section) {
        const existingForm = document.getElementById(
            `section-form-${section.id}`
        );
        const nextSibling = existingForm ? existingForm.nextSibling : null;
        const parentContainer = existingForm ? existingForm.parentNode : null;

        // Remove the existing form
        if (existingForm) {
            existingForm.remove();
        }

        // Create the new form
        const formContainer = document.getElementById("formContainer");
        if (!formContainer) return;

        const formDiv = this.buildSectionFormElement(section);

        // Insert at the original position if we have a reference, otherwise append
        if (parentContainer && nextSibling) {
            parentContainer.insertBefore(formDiv, nextSibling);
        } else if (parentContainer) {
            parentContainer.appendChild(formDiv);
        } else {
            formContainer.appendChild(formDiv);
        }

        this.bindSectionEvents(section);
    },

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
    },

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
            if (Array.isArray(duplicatedSection.items)) {
                duplicatedSection.items.forEach((item) => (item.id = genId()));
            }
            const index = this.sections.findIndex((s) => s.id === sectionId);
            this.sections.splice(index + 1, 0, duplicatedSection);
            this.cvData.sections = this.sections;
            this.createSectionForm(duplicatedSection);
            this.reorderSectionForms();
            this.renderPreview();
            this.showNotification("Section duplicated!", "success");

            // Auto-save after duplicating section
            this.autoSaveToLocalStorage();
        }
    },

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

        // Auto-save after moving section
        this.autoSaveToLocalStorage();
    },

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
    },

    exportSection(sectionId) {
        this.showNotification("Export Section: Not fully implemented.", "info");
    },

    removeSection(sectionId) {
        const section = this.sections.find((s) => s.id === sectionId);
        if (!section) return;
        let confirmMsg = `Delete "${section.title}"?`;
        if (this.sectionHasContent(section)) {
            confirmMsg += `\n\nThis section has content that will be lost.`;
        }
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

            // Auto-save after removing section
            this.autoSaveToLocalStorage();
        }
    },

    reorderAllSections() {
        this.showReorderModal();
    },

    showReorderModal() {
        const existingModal = document.querySelector(".reorder-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className = "reorder-modal modal-overlay";

        const modalContent = document.createElement("div");
        modalContent.className = "modal-content modal-content-md"

        const sectionsList = this.sections.map((section, index) => 
            `<div class="reorder-item" data-section-id="${section.id}" draggable="true">
                <i class="fas fa-grip-vertical reorder-grip"></i>
                <div class="reorder-content">
                    <strong class="reorder-title">${section.title}</strong>
                    <small class="reorder-type">${section.type.replace(/([A-Z])/g, ' $1').trim()}</small>
                </div>
                <span class="badge reorder-number">${index + 1}</span>
            </div>`
        ).join('');

        modalContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0"><i class="fas fa-sort me-2 text-primary"></i>Reorder Sections</h4>
                <button type="button" class="btn-close" onclick="this.closest('.reorder-modal').remove()"></button>
            </div>
            <p class="text-muted mb-4">Choose how to reorder your sections:</p>
            <div class="mb-4">
                <h6>Quick Reorder Options:</h6>
                <div class="d-grid gap-2 mb-3">
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="cvGenius.reorderSectionsAlphabetically(); this.closest('.reorder-modal').remove();">
                        <i class="fas fa-sort-alpha-down me-2"></i>Alphabetical (A-Z)
                    </button>
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="cvGenius.reorderSectionsByType(); this.closest('.reorder-modal').remove();">
                        <i class="fas fa-layer-group me-2"></i>By Type (Summary, Experience, Education...)
                    </button>
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="cvGenius.reverseCurrentOrder(); this.closest('.reorder-modal').remove();">
                        <i class="fas fa-sort-numeric-up me-2"></i>Reverse Current Order
                    </button>
                </div>
            </div>
            <div class="mb-4">
                <h6>Manual Reorder:</h6>
                <p class="small text-muted mb-3">Drag and drop sections to reorder manually</p>
                <div class="reorder-list-container" id="reorder-list">
                    ${sectionsList}
                </div>
                <div class="d-flex justify-content-between mt-3">
                    <button type="button" class="btn btn-outline-success btn-sm" onclick="cvGenius.applyManualReorder(); this.closest('.reorder-modal').remove();">
                        <i class="fas fa-check me-2"></i>Apply New Order
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="cvGenius.resetReorderList()">
                        <i class="fas fa-undo me-2"></i>Reset
                    </button>
                </div>
            </div>
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-secondary" onclick="this.closest('.reorder-modal').remove();">
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

        // Initialize drag and drop after modal is added to DOM
        setTimeout(() => this.initializeDragAndDrop(), 100);
    },

    reorderSectionsAlphabetically() {
        this.sections.sort((a, b) => a.title.localeCompare(b.title));
        this.reorderSectionForms();
        this.renderPreview();
        this.showNotification("Sections reordered alphabetically!", "success");
        this.autoSaveToLocalStorage();
    },

    reorderSectionsByType() {
        const typeOrder = {
            'summary': 1,
            'experience': 2,
            'education': 3,
            'skills': 4,
            'projects': 5,
            'publications': 6,
            'languages': 7,
            'certifications': 8,
            'awards': 9,
            'volunteer': 10,
            'references': 11,
            'custom': 12
        };
        
        this.sections.sort((a, b) => {
            const orderA = typeOrder[a.type] || 99;
            const orderB = typeOrder[b.type] || 99;
            return orderA - orderB;
        });
        this.reorderSectionForms();
        this.renderPreview();
        this.showNotification("Sections reordered by type!", "success");
        this.autoSaveToLocalStorage();
    },

    reverseCurrentOrder() {
        this.sections.reverse();
        this.reorderSectionForms();
        this.renderPreview();
        this.showNotification("Section order reversed!", "success");
        this.autoSaveToLocalStorage();
    },

    showBulkActions() {
        this.showBulkEditModal();
    },

    showBulkEditModal() {
        const existingModal = document.querySelector(".bulk-edit-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className = "bulk-edit-modal modal-overlay";

        const modalContent = document.createElement("div");
        modalContent.className = "modal-content modal-content-lg"

        const sectionsCheckboxes = this.sections.map(section => 
            `<div class="bulk-section-item">
                <input class="form-check-input bulk-section-checkbox" type="checkbox" value="${section.id}" id="bulk-${section.id}">
                <label class="form-check-label d-flex align-items-center" for="bulk-${section.id}">
                    <div class="flex-grow-1">
                        <strong class="bulk-section-title">${section.title}</strong>
                        <small class="bulk-section-type d-block">${section.type.replace(/([A-Z])/g, ' $1').trim()}</small>
                    </div>
                    <span class="badge ${section.visible ? 'bg-success' : 'bg-secondary'}">
                        <i class="fas ${section.visible ? 'fa-eye' : 'fa-eye-slash'} me-1"></i>
                        ${section.visible ? 'Visible' : 'Hidden'}
                    </span>
                </label>
            </div>`
        ).join('');

        modalContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4 class="mb-0"><i class="fas fa-tasks me-2 text-primary"></i>Bulk Edit Sections</h4>
                <button type="button" class="btn-close" onclick="this.closest('.bulk-edit-modal').remove()"></button>
            </div>
            <p class="text-muted mb-4">Select sections to perform bulk actions:</p>
            
            <div class="mb-3">
                <div class="d-flex gap-2 mb-3">
                    <button type="button" class="btn btn-outline-primary btn-sm" onclick="cvGenius.selectAllBulkSections()">
                        <i class="fas fa-check-square me-1"></i>Select All
                    </button>
                    <button type="button" class="btn btn-outline-secondary btn-sm" onclick="cvGenius.clearAllBulkSections()">
                        <i class="fas fa-square me-1"></i>Clear All
                    </button>
                </div>
                
                <div class="sections-list-container">
                    ${sectionsCheckboxes}
                </div>
            </div>
            
            <div class="mb-4">
                <h6>Bulk Actions:</h6>
                <div class="d-grid gap-2">
                    <button type="button" class="btn btn-success" onclick="cvGenius.bulkToggleVisibility(true)">
                        <i class="fas fa-eye me-2"></i>Show Selected Sections
                    </button>
                    <button type="button" class="btn btn-warning" onclick="cvGenius.bulkToggleVisibility(false)">
                        <i class="fas fa-eye-slash me-2"></i>Hide Selected Sections
                    </button>
                    <button type="button" class="btn btn-info" onclick="cvGenius.bulkDuplicateSections()">
                        <i class="fas fa-copy me-2"></i>Duplicate Selected Sections
                    </button>
                    <button type="button" class="btn btn-danger" onclick="cvGenius.bulkDeleteSections()">
                        <i class="fas fa-trash me-2"></i>Delete Selected Sections
                    </button>
                </div>
            </div>
            
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline-secondary" onclick="this.closest('.bulk-edit-modal').remove();">
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

    selectAllBulkSections() {
        const checkboxes = document.querySelectorAll('.bulk-section-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = true);
    },

    clearAllBulkSections() {
        const checkboxes = document.querySelectorAll('.bulk-section-checkbox');
        checkboxes.forEach(checkbox => checkbox.checked = false);
    },

    getSelectedBulkSections() {
        const checkboxes = document.querySelectorAll('.bulk-section-checkbox:checked');
        return Array.from(checkboxes).map(checkbox => checkbox.value);
    },

    bulkToggleVisibility(visible) {
        const selectedIds = this.getSelectedBulkSections();
        if (selectedIds.length === 0) {
            this.showNotification("Please select at least one section.", "warning");
            return;
        }

        selectedIds.forEach(sectionId => {
            const section = this.sections.find(s => s.id === sectionId);
            if (section) {
                section.visible = visible;
                // Update the checkbox in the section form if it exists
                const checkbox = document.getElementById(`section-visible-${sectionId}`);
                if (checkbox) {
                    checkbox.checked = visible;
                }
            }
        });

        this.renderPreview();
        this.autoSaveToLocalStorage();
        
        const action = visible ? 'shown' : 'hidden';
        this.showNotification(`${selectedIds.length} section(s) ${action}!`, "success");
        
        // Close the modal
        document.querySelector('.bulk-edit-modal')?.remove();
    },

    bulkDuplicateSections() {
        const selectedIds = this.getSelectedBulkSections();
        if (selectedIds.length === 0) {
            this.showNotification("Please select at least one section to duplicate.", "warning");
            return;
        }

        if (!confirm(`Duplicate ${selectedIds.length} selected section(s)?`)) {
            return;
        }

        const genId = () => Date.now().toString() + Math.random().toString(36).substr(2, 5);
        let duplicatedCount = 0;

        selectedIds.forEach(sectionId => {
            const originalSection = this.sections.find(s => s.id === sectionId);
            if (originalSection) {
                const duplicatedSection = JSON.parse(JSON.stringify(originalSection));
                duplicatedSection.id = genId();
                duplicatedSection.title = `${originalSection.title} (Copy)`;
                
                if (Array.isArray(duplicatedSection.items)) {
                    duplicatedSection.items.forEach(item => item.id = genId());
                }
                
                const index = this.sections.findIndex(s => s.id === sectionId);
                this.sections.splice(index + 1, 0, duplicatedSection);
                duplicatedCount++;
            }
        });

        this.cvData.sections = this.sections;
        
        // Recreate all section forms to maintain order
        const formContainer = document.getElementById("formContainer");
        if (formContainer) {
            Array.from(formContainer.querySelectorAll(".form-section[id^='section-form-']")).forEach(form => form.remove());
            this.sections.forEach(section => this.createSectionForm(section));
        }
        
        this.renderPreview();
        this.autoSaveToLocalStorage();
        
        this.showNotification(`${duplicatedCount} section(s) duplicated!`, "success");
        
        // Close the modal
        document.querySelector('.bulk-edit-modal')?.remove();
    },

    bulkDeleteSections() {
        const selectedIds = this.getSelectedBulkSections();
        if (selectedIds.length === 0) {
            this.showNotification("Please select at least one section to delete.", "warning");
            return;
        }

        if (!confirm(`Are you sure you want to delete ${selectedIds.length} selected section(s)? This action cannot be undone.`)) {
            return;
        }

        let deletedCount = 0;
        selectedIds.forEach(sectionId => {
            const section = this.sections.find(s => s.id === sectionId);
            if (section) {
                this.sections = this.sections.filter(s => s.id !== sectionId);
                const formEl = document.getElementById(`section-form-${sectionId}`);
                if (formEl) {
                    formEl.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                    formEl.style.opacity = "0";
                    formEl.style.transform = "scale(0.95)";
                    setTimeout(() => formEl.remove(), 300);
                }
                deletedCount++;
            }
        });

        this.cvData.sections = this.sections;
        this.renderPreview();
        this.autoSaveToLocalStorage();
        
        this.showNotification(`${deletedCount} section(s) deleted!`, "success");
        
        // Close the modal
        document.querySelector('.bulk-edit-modal')?.remove();
    },

    initializeDragAndDrop() {
        const reorderList = document.getElementById('reorder-list');
        if (!reorderList) return;

        let draggedElement = null;
        let draggedIndex = -1;
        let placeholder = null;

        // Create placeholder element
        const createPlaceholder = () => {
            const placeholder = document.createElement('div');
            placeholder.className = 'reorder-placeholder';
            placeholder.innerHTML = '<i class="fas fa-arrow-down text-primary"></i>';
            return placeholder;
        };

        reorderList.addEventListener('dragstart', (e) => {
            if (!e.target.classList.contains('reorder-item')) return;
            
            draggedElement = e.target;
            draggedIndex = Array.from(reorderList.children).indexOf(draggedElement);
            
            e.target.classList.add('dragging');
            
            // Create and insert placeholder
            placeholder = createPlaceholder();
            draggedElement.parentNode.insertBefore(placeholder, draggedElement.nextSibling);
            
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', e.target.outerHTML);
        });

        reorderList.addEventListener('dragend', (e) => {
            if (e.target === draggedElement) {
                e.target.classList.remove('dragging');
            }
            
            // Remove placeholder
            if (placeholder && placeholder.parentNode) {
                placeholder.parentNode.removeChild(placeholder);
            }
            
            draggedElement = null;
            draggedIndex = -1;
            placeholder = null;
        });

        reorderList.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = getDragAfterElement(reorderList, e.clientY);
            if (placeholder) {
                if (afterElement == null) {
                    reorderList.appendChild(placeholder);
                } else {
                    reorderList.insertBefore(placeholder, afterElement);
                }
            }
        });

        reorderList.addEventListener('drop', (e) => {
            e.preventDefault();
            
            if (!draggedElement || !placeholder) return;
            
            // Insert dragged element at placeholder position
            placeholder.parentNode.insertBefore(draggedElement, placeholder);
            
            // Update visual order numbers
            this.updateReorderNumbers();
        });

        // Hover effects are handled by CSS

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.reorder-item:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
    },

    updateReorderNumbers() {
        const reorderItems = document.querySelectorAll('.reorder-item');
        reorderItems.forEach((item, index) => {
            const badge = item.querySelector('.badge');
            if (badge) {
                badge.textContent = index + 1;
            }
        });
    },

    applyManualReorder() {
        const reorderItems = document.querySelectorAll('.reorder-item');
        const newOrder = Array.from(reorderItems).map(item => {
            const sectionId = item.dataset.sectionId;
            return this.sections.find(s => s.id === sectionId);
        }).filter(Boolean);

        if (newOrder.length === this.sections.length) {
            this.sections = newOrder;
            this.reorderSectionForms();
            this.renderPreview();
            this.showNotification("Sections reordered manually!", "success");
            this.autoSaveToLocalStorage();
        } else {
            this.showNotification("Error applying new order. Please try again.", "error");
        }
    },

    resetReorderList() {
        const reorderList = document.getElementById('reorder-list');
        if (!reorderList) return;

        // Regenerate the list with original order
        const sectionsList = this.sections.map((section, index) => 
            `<div class="reorder-item" data-section-id="${section.id}" draggable="true">
                <i class="fas fa-grip-vertical reorder-grip"></i>
                <div class="reorder-content">
                    <strong class="reorder-title">${section.title}</strong>
                    <small class="reorder-type">${section.type.replace(/([A-Z])/g, ' $1').trim()}</small>
                </div>
                <span class="badge reorder-number">${index + 1}</span>
            </div>`
        ).join('');

        reorderList.innerHTML = sectionsList;
        this.showNotification("Order reset to original!", "info");
    },
});
