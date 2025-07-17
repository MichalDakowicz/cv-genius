/**
 * CV Genius AI Integration
 * Handles OpenAI API calls and AI-powered features
 */

// Extend CVGenius with AI integration methods
Object.assign(CVGenius.prototype, {
    getLanguageInstruction() {
        // Get language from global setting
        const globalLanguage =
            localStorage.getItem("cvg_language") ||
            localStorage.getItem("cvg_ai_language") ||
            this.cvData.personalInfo.language ||
            "English";

        if (globalLanguage === "Auto-detect") {
            return `CRITICAL: You MUST respond in the exact same language as the CV content. If the CV is in Polish, respond in Polish. If in Spanish, respond in Spanish, etc. Analyze the CV content language first and respond accordingly.`;
        }

        return `CRITICAL: You MUST respond in ${globalLanguage}. All suggestions, analysis, and text improvements must be written in ${globalLanguage}. Do not use any other language.`;
    },

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
            const prompt = `Review the following personal contact information for a CV. Suggest improvements for conciseness, professionalism, or any missing critical elements (like a more professional job title if the current one is vague, or a more standard phone format). Provide a brief suggestion. ${this.getLanguageInstruction()}
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
    },

    async generateAISuggestions(forceOpen = false) {
        const langInstruction = this.getLanguageInstruction();
        const aiPopup = document.getElementById("aiSuggestionPopup");
        if (!forceOpen && aiPopup && !aiPopup.classList.contains("d-none")) {
            return;
        } else {
            aiPopup.classList.remove("d-none");
        }

        // Update language indicator
        const aiLanguageIndicator = document.getElementById(
            "aiLanguageIndicator"
        );
        if (aiLanguageIndicator) {
            const currentLanguage =
                localStorage.getItem("cvg_language") || "English";
            aiLanguageIndicator.textContent = `🌐 ${currentLanguage}`;
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

            const prompt = `You are an expert CV/resume reviewer. Analyze this CV and provide detailed feedback in this EXACT format:

OVERALL SCORE: [number 0-100]
IMPACT LEVEL: [High/Medium/Low]

SUGGESTIONS:
[Priority:High] [Type:Content] - [specific suggestion text]
[Priority:Medium] [Type:Formatting] - [specific suggestion text]
[Priority:Low] [Type:Skills] - [specific suggestion text]
[Continue with more suggestions...]

CRITICAL FORMATTING REQUIREMENTS:
- Priority MUST be exactly one of: High, Medium, Low (in English)
- Type MUST be exactly one of: Content, Formatting, Skills, Experience, General (in English)
- Only the suggestion text after the dash should be in the requested language
- The [Priority:] and [Type:] tags must always be in English

${langInstruction}

CV CONTENT:
${cvContentText}`;

            const aiResponse = await this.callOpenAI(prompt);

            // More robust parsing
            const scoreMatch = aiResponse.match(
                /(?:OVERALL SCORE|Overall Score|Score):\s*(\d+)/i
            );
            const impactMatch = aiResponse.match(
                /(?:IMPACT LEVEL|Impact Level):\s*(High|Medium|Low)/i
            );

            // Extract suggestions with more flexible patterns
            const suggestionPatterns = [
                /^\[Priority:(.*?)\]\s*\[Type:(.*?)\]\s*-\s*(.*)$/gm,
                /^\[Priorytet:(.*?)\]\s*\[Typ:(.*?)\]\s*-\s*(.*)$/gm, // Polish
                /^\[Prioridad:(.*?)\]\s*\[Tipo:(.*?)\]\s*-\s*(.*)$/gm, // Spanish
                /^\[Priorité:(.*?)\]\s*\[Type:(.*?)\]\s*-\s*(.*)$/gm, // French
                /^\[Priorität:(.*?)\]\s*\[Typ:(.*?)\]\s*-\s*(.*)$/gm, // German
                /^\[Priorità:(.*?)\]\s*\[Tipo:(.*?)\]\s*-\s*(.*)$/gm, // Italian
                /^\[Prioridade:(.*?)\]\s*\[Tipo:(.*?)\]\s*-\s*(.*)$/gm, // Portuguese
                /^\[(High|Medium|Low|Wysoki|Średni|Niski|Alto|Medio|Bajo|Élevé|Moyen|Bas|Hoch|Mittel|Niedrig|Basso|Prioridade)\]\s*\[(.*?)\]\s*-\s*(.*)$/gm,
                /^(High|Medium|Low|Wysoki|Średni|Niski|Alto|Medio|Bajo|Élevé|Moyen|Bas|Hoch|Mittel|Niedrig|Basso)\s*Priority.*?-\s*(.*)$/gm,
            ];

            let suggestions = [];
            for (const pattern of suggestionPatterns) {
                const matches = Array.from(aiResponse.matchAll(pattern));
                if (matches.length > 0) {
                    suggestions = matches.map((match) => {
                        if (match.length === 4) {
                            // Normalize the priority and type before creating the suggestion
                            const normalized = this.normalizeAIParameters(
                                match[1],
                                match[2]
                            );
                            return `[Priority:${normalized.priority}] [Type:${normalized.type}] - ${match[3]}`;
                        } else if (match.length === 3) {
                            // Normalize the priority before creating the suggestion
                            const normalized = this.normalizeAIParameters(
                                match[1],
                                "General"
                            );
                            return `[Priority:${normalized.priority}] [Type:${normalized.type}] - ${match[2]}`;
                        }
                        return match[0];
                    });
                    break;
                }
            }

            // Fallback: extract numbered suggestions
            if (suggestions.length === 0) {
                const numberedSuggestions =
                    aiResponse.match(/^\d+\.\s*(.+)$/gm);
                if (numberedSuggestions) {
                    suggestions = numberedSuggestions.map((s, i) => {
                        const priority =
                            i < 2 ? "High" : i < 4 ? "Medium" : "Low";
                        return `[Priority:${priority}] [Type:General] - ${s.replace(
                            /^\d+\.\s*/,
                            ""
                        )}`;
                    });
                }
            }

            // Final fallback: split by lines and filter meaningful content
            if (suggestions.length === 0) {
                const lines = aiResponse
                    .split("\n")
                    .filter(
                        (line) =>
                            (line.trim().length > 20 &&
                                !line.match(
                                    /^(OVERALL SCORE|IMPACT LEVEL|SUGGESTIONS:)/i
                                ) &&
                                line.includes("-")) ||
                            line.match(/^\d+\./)
                    );
                suggestions = lines.slice(0, 6).map((line, i) => {
                    const priority = i < 2 ? "High" : i < 4 ? "Medium" : "Low";
                    const cleanLine = line.replace(/^[\d\-\*\•\s]+/, "").trim();
                    return `[Priority:${priority}] [Type:General] - ${cleanLine}`;
                });
            }

            aiAnalysisScore.textContent = scoreMatch ? scoreMatch[1] : "75";
            aiImpactLevel.textContent = impactMatch ? impactMatch[1] : "Medium";
            aiSuggestionsCount.textContent = suggestions.length;

            if (suggestions.length > 0) {
                suggestionsList.innerHTML = suggestions
                    .map((s) => this.formatAISuggestionItem(s))
                    .join("");
            } else {
                suggestionsList.innerHTML = `<div class="text-center py-4"><i class="fas fa-check-circle text-success fs-4 mb-2"></i><p class="text-muted">AI analysis complete. No critical suggestions found or format was unexpected.</p></div>`;
            }
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
    },

    // Normalize priority and type parameters to English
    normalizeAIParameters(priority, type) {
        // Priority normalization mapping
        const priorityMap = {
            // English
            high: "High",
            medium: "Medium",
            low: "Low",
            // Polish
            wysoki: "High",
            wysokie: "High",
            średni: "Medium",
            średnie: "Medium",
            niski: "Low",
            niskie: "Low",
            // Spanish
            alto: "High",
            alta: "High",
            medio: "Medium",
            media: "Medium",
            bajo: "Low",
            baja: "Low",
            // French
            élevé: "High",
            élevée: "High",
            moyen: "Medium",
            moyenne: "Medium",
            bas: "Low",
            basse: "Low",
            // German
            hoch: "High",
            mittel: "Medium",
            niedrig: "Low",
            // Italian
            alto: "High",
            alta: "High",
            medio: "Medium",
            media: "Medium",
            basso: "Low",
            bassa: "Low",
            // Portuguese
            alto: "High",
            alta: "High",
            médio: "Medium",
            média: "Medium",
            baixo: "Low",
            baixa: "Low",
        };

        // Type normalization mapping
        const typeMap = {
            // English
            content: "Content",
            formatting: "Formatting",
            skills: "Skills",
            experience: "Experience",
            general: "General",
            // Polish
            treść: "Content",
            zawartość: "Content",
            formatowanie: "Formatting",
            umiejętności: "Skills",
            doświadczenie: "Experience",
            ogólne: "General",
            // Spanish
            contenido: "Content",
            formato: "Formatting",
            habilidades: "Skills",
            experiencia: "Experience",
            general: "General",
            // French
            contenu: "Content",
            formatage: "Formatting",
            compétences: "Skills",
            expérience: "Experience",
            général: "General",
            // German
            inhalt: "Content",
            formatierung: "Formatting",
            fähigkeiten: "Skills",
            erfahrung: "Experience",
            allgemein: "General",
            // Italian
            contenuto: "Content",
            formattazione: "Formatting",
            competenze: "Skills",
            esperienza: "Experience",
            generale: "General",
            // Portuguese
            conteúdo: "Content",
            formatação: "Formatting",
            habilidades: "Skills",
            experiência: "Experience",
            geral: "General",
        };

        // Normalize priority
        const normalizedPriority =
            priorityMap[priority.toLowerCase()] || "Medium";

        // Normalize type
        const normalizedType = typeMap[type.toLowerCase()] || "General";

        return {
            priority: normalizedPriority,
            type: normalizedType,
        };
    },

    formatAISuggestionItem(suggestionText) {
        // Try to match the standard format
        let match = suggestionText.match(
            /^\[Priority:(.*?)\]\s*\[Type:(.*?)\]\s*-\s*(.*)$/
        );

        let priority = "Medium";
        let type = "General";
        let text = suggestionText;

        if (match) {
            [, priority, type, text] = match;
        } else {
            // Try alternative formats
            const altMatch = suggestionText.match(
                /^(High|Medium|Low).*?-\s*(.*)$/i
            );
            if (altMatch) {
                priority = altMatch[1];
                text = altMatch[2];
            } else {
                // Just clean up the text
                text = suggestionText
                    .replace(/^[\[\]\(\)\-\s\d\.]+/, "")
                    .trim();
            }
        }

        // Clean up extracted values
        priority = priority.trim();
        type = type.trim();
        text = text.trim();

        // Normalize priority and type to English
        const normalized = this.normalizeAIParameters(priority, type);
        priority = normalized.priority;
        type = normalized.type;

        // Set colors and icons based on priority and type
        let pColCls = "bg-secondary text-white";
        let tIcon = "fas fa-lightbulb";

        if (priority.toLowerCase() === "high") pColCls = "bg-danger text-white";
        else if (priority.toLowerCase() === "medium")
            pColCls = "bg-warning text-dark";
        else if (priority.toLowerCase() === "low")
            pColCls = "bg-success text-white";

        if (type.toLowerCase().includes("content")) tIcon = "fas fa-file-alt";
        else if (type.toLowerCase().includes("format"))
            tIcon = "fas fa-paint-brush";
        else if (type.toLowerCase().includes("skill")) tIcon = "fas fa-cogs";
        else if (type.toLowerCase().includes("experien"))
            tIcon = "fas fa-briefcase";
        else if (type.toLowerCase().includes("education"))
            tIcon = "fas fa-graduation-cap";
        else if (type.toLowerCase().includes("keyword")) tIcon = "fas fa-key";

        return `<div class="suggestion-item border rounded p-3 mb-3 animate-fade-in" data-priority="${priority.toLowerCase()}" data-type="${type.toLowerCase()}">
            <div class="d-flex align-items-center gap-3">
                <div class="priority-icon p-2 ${pColCls}">
                    <i class="${tIcon}"></i>
                </div>
                <div class="flex-fill">
                    <div class="d-flex align-items-center gap-2 mb-2">
                        <span class="badge ${pColCls} px-2 py-1">${priority} Priority</span>
                        <span class="badge bg-light text-dark px-2 py-1">${type}</span>
                    </div>
                    <p class="mb-0 lh-base">${text}</p>
                </div>
                <button class="suggestion-action-btn btn btn-sm text-muted" title="Helpful suggestion" onclick="this.innerHTML='<i class=&quot;fas fa-check text-success&quot;></i>'; this.disabled=true;">
                    <i class="fas fa-thumbs-up"></i>
                </button>
            </div>
        </div>`;
    },

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
    },

    exportSuggestions() {
        this.showNotification("Export Suggestions: Not implemented.", "info");
    },

    async quickAIAction(actionType) {
        this.showNotification(
            `AI performing: ${actionType.replace(/_/g, " ")}...`,
            "info"
        );
        let sectionToEnhance;
        let prompt = "";
        const jobTitle = this.cvData.personalInfo.jobTitle || "a professional";
        const langInstruction = this.getLanguageInstruction();

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
                prompt = `Based on CV snapshot for a ${jobTitle}, suggest 5-7 relevant keywords (nouns, short phrases) for ATS optimization. List them comma-separated. ${langInstruction} CV Snapshot: ${cvSnap}`;
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
                prompt = `Based on CV for a ${jobTitle}, suggest 3-5 relevant skills (technical/soft) that would improve this CV. List them comma-separated. ${langInstruction}`;
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
    },

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
        const langInstruction = this.getLanguageInstruction();

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
            promptText = `For a ${jobTitleForContext} with skills "${skillsText}", suggest 3-5 additional relevant skills OR refine categorization/phrasing for clarity. Return list or improved categories/skills. ${langInstruction}`;
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
    },

    async manageApiKey() {
        const existingModal = document.querySelector(".api-key-modal");
        if (existingModal) {
            existingModal.remove();
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className =
            "api-key-modal position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center";
        modalOverlay.style.cssText =
            "background: rgba(0,0,0,0.5); z-index: 1050; backdrop-filter: blur(3px);";

        const modalContent = document.createElement("div");
        modalContent.className = "bg-body text-body rounded shadow-lg p-4 mx-3";
        modalContent.style.cssText =
            "max-width: 500px; width: 100%; border: 1px solid var(--bs-border-color, #dee2e6);";

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
                            messages: [
                                { role: "user", content: "Test message" },
                            ],
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
                            '<div class="alert alert-danger small">❌ Error testing API key</div>';
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
    },

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
                "background: rgba(0,0,0,0.7); z-index: 1052; backdrop-filter: blur(3px);";

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
    },

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
        const systemPrompt = `You are a helpful CV/resume writing assistant. Provide concise, professional, and actionable advice. 

LANGUAGE INSTRUCTION: The user will provide language instructions in their prompt. Follow these instructions precisely. If asked to respond in a specific language, use ONLY that language. If asked to detect language from content, analyze the content carefully and respond in the same language as the content.

Your responses should be professional, clear, and in the requested language.`;
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
    },
});
