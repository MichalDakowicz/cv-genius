/**
 * CV Genius Utilities & Helpers
 * Utility functions, formatters, and rendering helpers
 */

// Extend CVGenius with utility methods
Object.assign(CVGenius.prototype, {
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
                    } else if (
                        section.type === "projects" &&
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
                                item.name
                                    ? `<h5 class="fw-semibold text">${item.name}</h5>`
                                    : ""
                            }${
                                item.technologies
                                    ? `<p class="text-primary fw-medium mb-1">${item.technologies}</p>`
                                    : ""
                            }${
                                item.duration
                                    ? `<p class="small text-muted mb-2">${item.duration}</p>`
                                    : ""
                            }${
                                item.description
                                    ? `<div class="text-secondary lh-base mb-2">${this.formatTextToHtml(
                                          item.description
                                      )}</div>`
                                    : ""
                            }${
                                item.url || item.github
                                    ? `<div class="d-flex gap-3 small">${
                                          item.url
                                              ? `<a href="${this.formatURL(
                                                    item.url
                                                )}" class="text-primary text-decoration-none" target="_blank"><i class="fas fa-external-link-alt me-1"></i>${this.formatURL(
                                                    item.url
                                                )}</a>`
                                              : ""
                                      }${
                                          item.github
                                              ? `<a href="${this.formatURL(
                                                    item.github
                                                )}" class="text-primary text-decoration-none" target="_blank"><i class="fab fa-github me-1"></i>${this.formatURL(
                                                    item.github
                                                )}</a>`
                                              : ""
                                      }</div>`
                                    : ""
                            }</div>`;
                        });
                    } else if (
                        section.type === "publications" &&
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
                                item.title
                                    ? `<h5 class="fw-semibold text">${item.title}</h5>`
                                    : ""
                            }${
                                item.authors
                                    ? `<p class="text-primary fw-medium mb-1">${item.authors}</p>`
                                    : ""
                            }${
                                item.publication
                                    ? `<p class="text-secondary mb-1">${
                                          item.publication
                                      }${
                                          item.year ? ` (${item.year})` : ""
                                      }</p>`
                                    : ""
                            }${
                                item.doi || item.url
                                    ? `<div class="d-flex gap-3 small">${
                                          item.doi
                                              ? `<span class="text-muted">DOI: ${item.doi}</span>`
                                              : ""
                                      }${
                                          item.url
                                              ? `<a href="${this.formatURL(
                                                    item.url
                                                )}" class="text-primary text-decoration-none" target="_blank"><i class="fas fa-external-link-alt me-1"></i>View</a>`
                                              : ""
                                      }</div>`
                                    : ""
                            }</div>`;
                        });
                    } else if (
                        section.type === "languages" &&
                        Array.isArray(section.items)
                    ) {
                        section.items.forEach((item) => {
                            if (!item.language) return;

                            sectionContentHTML += `<div class="mb-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="fw-medium">${
                                        item.language
                                    }</span>
                                    ${
                                        item.certification
                                            ? `<span class="text-muted small ms-2">(${item.certification})</span>`
                                            : ""
                                    }
                                </div>
                                ${
                                    item.proficiency
                                        ? `<span class="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill">${item.proficiency}</span>`
                                        : ""
                                }
                            </div>`;
                        });
                    } else if (
                        section.type === "certifications" &&
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
                                item.name
                                    ? `<h5 class="fw-semibold text">${item.name}</h5>`
                                    : ""
                            }${
                                item.issuer
                                    ? `<p class="text-primary fw-medium mb-1">${item.issuer}</p>`
                                    : ""
                            }${
                                item.date || item.expiryDate
                                    ? `<p class="small text-muted mb-2">${
                                          item.date || ""
                                      }${
                                          item.date && item.expiryDate
                                              ? " - "
                                              : ""
                                      }${
                                          item.expiryDate
                                              ? `Expires: ${item.expiryDate}`
                                              : ""
                                      }</p>`
                                    : ""
                            }${
                                item.credentialId
                                    ? `<p class="small text-muted mb-2">Credential ID: ${item.credentialId}</p>`
                                    : ""
                            }${
                                item.url
                                    ? `<div class="small"><a href="${this.formatURL(
                                          item.url
                                      )}" class="text-primary text-decoration-none" target="_blank"><i class="fas fa-external-link-alt me-1"></i>Verify</a></div>`
                                    : ""
                            }</div>`;
                        });
                    } else if (
                        section.type === "awards" &&
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
                                item.name
                                    ? `<h5 class="fw-semibold text">${item.name}</h5>`
                                    : ""
                            }${
                                item.issuer
                                    ? `<p class="text-primary fw-medium mb-1">${item.issuer}</p>`
                                    : ""
                            }${
                                item.date
                                    ? `<p class="small text-muted mb-2">${item.date}</p>`
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
                        section.type === "volunteer" &&
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
                                item.role
                                    ? `<h5 class="fw-semibold text">${item.role}</h5>`
                                    : ""
                            }${
                                item.organization
                                    ? `<p class="text-primary fw-medium mb-1">${
                                          item.organization
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
                        section.type === "references" &&
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
                                item.name
                                    ? `<h5 class="fw-semibold text">${item.name}</h5>`
                                    : ""
                            }${
                                item.title || item.company
                                    ? `<p class="text-primary fw-medium mb-1">${
                                          item.title || ""
                                      }${
                                          item.title && item.company
                                              ? " at "
                                              : ""
                                      }${item.company || ""}</p>`
                                    : ""
                            }${
                                item.relationship
                                    ? `<p class="small text-muted mb-2">${item.relationship}</p>`
                                    : ""
                            }${
                                item.email || item.phone
                                    ? `<div class="d-flex gap-3 small">${
                                          item.email
                                              ? `<span class="text-muted"><i class="fas fa-envelope me-1"></i>${item.email}</span>`
                                              : ""
                                      }${
                                          item.phone
                                              ? `<span class="text-muted"><i class="fas fa-phone me-1"></i>${item.phone}</span>`
                                              : ""
                                      }</div>`
                                    : ""
                            }</div>`;
                        });
                    }
                }
                sectionDiv.innerHTML = sectionContentHTML;
                sectionsContainer.appendChild(sectionDiv);
            });
    },

    getSectionBorderColor(type) {
        return (
            {
                summary: "border-purple",
                experience: "border-success",
                education: "border-info",
                skills: "border-warning",
                projects: "border-primary",
                publications: "border-secondary",
                languages: "border-dark",
                certifications: "border-success",
                awards: "border-warning",
                volunteer: "border-info",
                references: "border-secondary",
                custom: "border-danger",
            }[type] || "border-primary"
        );
    },

    formatURL(url) {
        if (!url) return "#";
        if (url.startsWith("http://")) {
            return url.slice(7);
        }
        if (url.startsWith("https://")) {
            return url.slice(8);
        }
        return url;
    },

    formatURLToDisplay(url) {
        if (!url) return "N/A";
        const displayUrl = url.replace(/https?:\/\//, "");
        return displayUrl;
    },

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
    },
});
