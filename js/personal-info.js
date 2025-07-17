/**
 * CV Genius Personal Information Management
 * Handles personal info, websites, and contact details
 */

// Extend CVGenius with personal info management methods
Object.assign(CVGenius.prototype, {
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
        // Auto-save to localStorage after a short delay
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSaveToLocalStorage();
        }, 1000);
    },

    loadPersonalInfo() {
        this.updatePersonalInfo();
    },

    addWebsiteField() {
        const container = document.getElementById("websiteContainer");
        const websiteId = Date.now();

        const websiteHtml = `
            <div class="input-group mb-2 website-field" data-website-id="${websiteId}">
                <select class="form-select form-select-sm website-type">
                    <option value="portfolio"><i class="fas fa-globe"></i> Portfolio</option>
                    <option value="linkedin"><i class="fab fa-linkedin"></i> LinkedIn</option>
                    <option value="github"><i class="fab fa-github"></i> GitHub</option>
                    <option value="instagram"><i class="fab fa-instagram"></i> Instagram</option>
                    <option value="twitter"><i class="fab fa-twitter"></i> Twitter</option>
                    <option value="custom"><i class="fas fa-link"></i> Custom</option>
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
    },

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
            portfolio: '<i class="fas fa-globe"></i> Portfolio',
            linkedin: '<i class="fab fa-linkedin"></i> LinkedIn',
            github: '<i class="fab fa-github"></i> GitHub',
            instagram: '<i class="fab fa-instagram"></i> Instagram',
            twitter: '<i class="fab fa-twitter"></i> Twitter',
            personal: '<i class="fas fa-user"></i> Personal Website',
            custom: '<i class="fas fa-link"></i> Custom',
        };

        const websiteHtml = `
            <div class="input-group mb-2 website-field" data-website-id="${websiteId}">
                <select class="form-select form-select-sm website-type">
                    <option value="portfolio" ${
                        type === "portfolio" ? "selected" : ""
                    }><i class="fas fa-globe"></i> Portfolio</option>
                    <option value="linkedin" ${
                        type === "linkedin" ? "selected" : ""
                    }><i class="fab fa-linkedin"></i> LinkedIn</option>
                    <option value="github" ${
                        type === "github" ? "selected" : ""
                    }><i class="fab fa-github"></i> GitHub</option>
                    <option value="instagram" ${
                        type === "instagram" ? "selected" : ""
                    }><i class="fab fa-instagram"></i> Instagram</option>
                    <option value="twitter" ${
                        type === "twitter" ? "selected" : ""
                    }><i class="fab fa-twitter"></i> Twitter</option>
                    <option value="personal" ${
                        type === "personal" ? "selected" : ""
                    }><i class="fas fa-user"></i> Personal Website</option>
                    <option value="custom" ${
                        type === "custom" ? "selected" : ""
                    }><i class="fas fa-link"></i> Custom</option>
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
    },
});
