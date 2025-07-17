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
});
