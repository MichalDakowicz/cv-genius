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
    },

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

        if (section.type === "summary") {
            formHTML += this.createSummaryForm(section);
        } else if (section.type === "experience") {
            formHTML += this.createExperienceForm(section, itemsToRender);
        } else if (section.type === "education") {
            formHTML += this.createEducationForm(section, itemsToRender);
        } else if (section.type === "skills") {
            formHTML += this.createSkillsForm(section, itemsToRender);
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
    },

    createEducationForm(section, itemsToRender) {
        return `<div class="mb-3">
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
    },

    createSkillsForm(section, itemsToRender) {
        return `<div class="mb-3">
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
    },

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
            ["experience", "education", "skills"].includes(section.type)
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
        }
    },

    reorderAllSections() {
        this.showNotification("Reorder All: Not fully implemented.", "info");
    },

    showBulkActions() {
        this.showNotification("Bulk Actions: Not fully implemented.", "info");
    },
});
