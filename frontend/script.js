/* ============================================
   EcoWise — Chatbot Engine
   ============================================ */

(() => {
    "use strict";

    // ── DOM References ──
    const $ = (sel) => document.querySelector(sel);
    const chatMessages = $("#chat-messages");
    const userInput = $("#user-input");
    const btnSend = $("#btn-send");
    const typingIndicator = $("#typing-indicator");
    const quickReplies = $("#quick-replies");
    const btnToggleSidebar = $("#btn-toggle-sidebar");
    const sidebar = $("#sidebar");
    const btnThemeToggle = $("#btn-theme-toggle");
    const btnClearChat = $("#btn-clear-chat");

    // ── State ──
    let conversationState = "idle"; // idle | awaiting_food_type | awaiting_prep_time | awaiting_servings | awaiting_storage
    let donationAssessment = {};

    // ── Theme ──
    function initTheme() {
        const saved = localStorage.getItem("ecowise-theme");
        if (saved === "light") {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.setAttribute("data-theme", "dark");
        }
    }
    initTheme();

    btnThemeToggle.addEventListener("click", () => {
        const isDark = document.documentElement.getAttribute("data-theme") === "dark";
        document.documentElement.setAttribute("data-theme", isDark ? "light" : "dark");
        localStorage.setItem("ecowise-theme", isDark ? "light" : "dark");
    });

    // ── Sidebar ──
    let overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);

    btnToggleSidebar.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        overlay.classList.toggle("visible");
    });
    overlay.addEventListener("click", () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("visible");
    });

    // Sidebar nav items
    document.querySelectorAll(".nav-item").forEach((btn) => {
        btn.addEventListener("click", () => {
            sidebar.classList.remove("open");
            overlay.classList.remove("visible");
            const action = btn.dataset.action;
            if (action) handleSidebarAction(action);
        });
    });

    function handleSidebarAction(action) {
        conversationState = "idle";
        donationAssessment = {};
        switch (action) {
            case "new-chat":
                clearChat();
                showWelcome();
                break;
            case "donate":
                addUserMessage("Check if food can be donated");
                startDonationAssessment();
                break;
            case "storage":
                addUserMessage("Food storage guidelines");
                respondWithStorageGuide();
                break;
            case "tips":
                addUserMessage("Learn about food waste reduction");
                respondWithTips();
                break;
            case "find-ngos":
                addUserMessage("Find donation suggestions");
                respondWithDonationSuggestions();
                break;
            case "support":
                addUserMessage("Contact support");
                respondWithSupport();
                break;
        }
    }

    // ── Clear Chat ──
    btnClearChat.addEventListener("click", () => {
        clearChat();
        showWelcome();
        conversationState = "idle";
        donationAssessment = {};
    });

    function clearChat() {
        chatMessages.innerHTML = "";
        quickReplies.innerHTML = "";
    }

    // ── Input Handling ──
    userInput.addEventListener("input", () => {
        btnSend.disabled = !userInput.value.trim();
        userInput.style.height = "auto";
        userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
    });

    userInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    btnSend.addEventListener("click", sendMessage);

    function sendMessage() {
        const text = userInput.value.trim();
        if (!text) return;
        addUserMessage(text);
        userInput.value = "";
        userInput.style.height = "auto";
        btnSend.disabled = true;
        quickReplies.innerHTML = "";
        processInput(text);
    }

    // ── Message Rendering ──
    function addUserMessage(text) {
        const msg = createMessageEl("user", text);
        chatMessages.appendChild(msg);
        scrollToBottom();
    }

    function addBotMessage(html, delay = 600) {
        showTyping();
        return new Promise((resolve) => {
            setTimeout(() => {
                hideTyping();
                const msg = createMessageEl("bot", html);
                chatMessages.appendChild(msg);
                scrollToBottom();
                resolve(msg);
            }, delay);
        });
    }

    function createMessageEl(type, content) {
        const wrapper = document.createElement("div");
        wrapper.className = `message ${type}`;

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = type === "bot" ? "🌱" : "👤";

        const bubble = document.createElement("div");
        bubble.className = "message-content";
        bubble.innerHTML = content;

        const time = document.createElement("div");
        time.className = "message-time";
        time.textContent = formatTime();

        const col = document.createElement("div");
        col.appendChild(bubble);
        col.appendChild(time);

        wrapper.appendChild(avatar);
        wrapper.appendChild(col);
        return wrapper;
    }

    function formatTime() {
        return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    function showTyping() {
        typingIndicator.classList.remove("hidden");
        scrollToBottom();
    }

    function hideTyping() {
        typingIndicator.classList.add("hidden");
    }

    function scrollToBottom() {
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    function setQuickReplies(options) {
        quickReplies.innerHTML = "";
        options.forEach((opt) => {
            const btn = document.createElement("button");
            btn.className = "quick-reply-btn";
            btn.textContent = opt.label;
            btn.addEventListener("click", () => {
                quickReplies.innerHTML = "";
                addUserMessage(opt.label);
                if (opt.handler) opt.handler();
                else processInput(opt.label);
            });
            quickReplies.appendChild(btn);
        });
        scrollToBottom();
    }

    // ── Welcome Screen ──
    function showWelcome() {
        const hero = document.createElement("div");
        hero.className = "welcome-hero";
        hero.innerHTML = `
            <div class="welcome-emoji">🌱</div>
            <h2 class="welcome-title">Welcome to EcoWise</h2>
            <p class="welcome-subtitle">I help reduce food waste by guiding you on food donation and safe food handling. How can I assist you today?</p>
            <div class="welcome-cards">
                <div class="welcome-card" data-action="donate">
                    <div class="welcome-card-icon">🤝</div>
                    <div class="welcome-card-title">Donation Check</div>
                    <div class="welcome-card-desc">Find out if your surplus food is safe to donate</div>
                </div>
                <div class="welcome-card" data-action="storage">
                    <div class="welcome-card-icon">🧊</div>
                    <div class="welcome-card-title">Storage Guide</div>
                    <div class="welcome-card-desc">Learn how to store food properly and extend shelf life</div>
                </div>
                <div class="welcome-card" data-action="tips">
                    <div class="welcome-card-icon">💡</div>
                    <div class="welcome-card-title">Waste Reduction</div>
                    <div class="welcome-card-desc">Practical tips to minimize food waste at home</div>
                </div>
                <div class="welcome-card" data-action="find-ngos">
                    <div class="welcome-card-icon">📍</div>
                    <div class="welcome-card-title">Donation Centers</div>
                    <div class="welcome-card-desc">Find NGOs, food banks, and community kitchens near you</div>
                </div>
            </div>
        `;
        chatMessages.appendChild(hero);

        hero.querySelectorAll(".welcome-card").forEach((card) => {
            card.addEventListener("click", () => {
                hero.remove();
                handleSidebarAction(card.dataset.action);
            });
        });

        scrollToBottom();
    }

    // ── Process User Input ──
    function processInput(text) {
        const lower = text.toLowerCase().trim();

        // State machine for donation assessment
        if (conversationState !== "idle") {
            handleAssessmentFlow(lower);
            return;
        }

        // Intent detection — check specific intents BEFORE broad ones
        // Donation suggestions / location (must come before generic "donate" check)
        if (matchesIntent(lower, ["ngo", "food bank", "community kitchen", "where to donate", "find donation", "donation center", "donation suggestion", "donation location", "nearby", "donation place", "where can i donate", "how to donate food", "donate food near"])) {
            respondWithDonationSuggestions();
        } else if (matchesIntent(lower, ["storage", "store", "refrigerat", "how long can", "shelf life", "preserve", "keep food"])) {
            handleStorageQuestion(lower);
        } else if (matchesIntent(lower, ["tip", "reduce", "waste", "minimize", "reduce food waste", "less waste", "how can i reduce"])) {
            respondWithTips();
        } else if (matchesIntent(lower, ["check if food", "can i donate", "safe to donate", "eligibility", "donation check", "is my food safe", "can this be donated", "donate check", "surplus food"])) {
            startDonationAssessment();
        } else if (matchesIntent(lower, ["support", "contact", "help me", "speak to someone", "customer service"])) {
            respondWithSupport();
        } else if (matchesIntent(lower, ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings"])) {
            respondWithGreeting();
        } else if (matchesIntent(lower, ["thank", "thanks", "thank you", "appreciate"])) {
            respondWithThanks();
        } else if (matchesIntent(lower, ["menu", "options", "what can you do", "main menu"])) {
            respondWithMenu();
        } else if (matchesIntent(lower, ["room temperature", "how long", "cooked food", "safe time"])) {
            handleStorageQuestion(lower);
        } else if (parseNaturalDonation(lower)) {
            // Try to parse a natural donation message like "I have 20 servings of cooked rice prepared 1 hour ago"
            handleNaturalDonation(lower);
        } else {
            respondWithFallback();
        }
    }

    function matchesIntent(text, keywords) {
        return keywords.some((kw) => text.includes(kw));
    }

    // ── Donation Assessment Flow ──
    function startDonationAssessment() {
        conversationState = "awaiting_food_type";
        donationAssessment = {};

        addBotMessage(
            `<strong>🤝 Donation Eligibility Assessment</strong>
            <p>I'll help you determine if your surplus food is safe for donation. Let's go through a quick check!</p>
            <p><strong>What type of food do you have?</strong></p>`
        ).then(() => {
            setQuickReplies([
                { label: "🍛 Cooked Food" },
                { label: "📦 Packaged Food" },
                { label: "🥕 Fruits / Vegetables" },
                { label: "🍞 Bakery Items" },
            ]);
        });
    }

    function handleAssessmentFlow(text) {
        switch (conversationState) {
            case "awaiting_food_type":
                if (text.includes("cooked")) donationAssessment.type = "Cooked Food";
                else if (text.includes("packaged") || text.includes("package")) donationAssessment.type = "Packaged Food";
                else if (text.includes("fruit") || text.includes("vegetable") || text.includes("veggie")) donationAssessment.type = "Fruits/Vegetables";
                else if (text.includes("bakery") || text.includes("bread") || text.includes("cake") || text.includes("pastry")) donationAssessment.type = "Bakery Items";
                else donationAssessment.type = text;

                conversationState = "awaiting_prep_time";
                addBotMessage(
                    `<p>Got it — <strong>${donationAssessment.type}</strong>. 👍</p>
                    <p><strong>How long ago was it prepared or purchased?</strong></p>`
                ).then(() => {
                    setQuickReplies([
                        { label: "Less than 1 hour" },
                        { label: "1–2 hours ago" },
                        { label: "2–4 hours ago" },
                        { label: "More than 4 hours" },
                        { label: "Today (refrigerated)" },
                    ]);
                });
                break;

            case "awaiting_prep_time":
                donationAssessment.prepTime = text;
                if (text.includes("less than 1") || text.includes("< 1") || text.includes("just now")) donationAssessment.hours = 0.5;
                else if (text.includes("1") && (text.includes("2") || text.includes("–"))) donationAssessment.hours = 1.5;
                else if (text.includes("2") && (text.includes("4") || text.includes("–"))) donationAssessment.hours = 3;
                else if (text.includes("more than 4") || text.includes("> 4") || text.includes("5") || text.includes("6")) donationAssessment.hours = 5;
                else if (text.includes("refrigerat") || text.includes("fridge")) donationAssessment.hours = 1;
                else {
                    // Try to extract number
                    const match = text.match(/(\d+)/);
                    donationAssessment.hours = match ? parseInt(match[1]) : 2;
                }

                conversationState = "awaiting_servings";
                addBotMessage(
                    `<p><strong>How many servings are available?</strong></p>`
                ).then(() => {
                    setQuickReplies([
                        { label: "1–5 servings" },
                        { label: "5–15 servings" },
                        { label: "15–30 servings" },
                        { label: "30+ servings" },
                    ]);
                });
                break;

            case "awaiting_servings":
                const servMatch = text.match(/(\d+)/);
                donationAssessment.servings = servMatch ? parseInt(servMatch[1]) : 10;
                donationAssessment.servingsText = text;

                conversationState = "awaiting_storage";
                addBotMessage(
                    `<p><strong>${donationAssessment.servings}+ servings — that's great!</strong></p>
                    <p><strong>Was the food stored properly?</strong> (e.g., covered, refrigerated, kept at safe temperature)</p>`
                ).then(() => {
                    setQuickReplies([
                        { label: "✅ Yes, stored properly" },
                        { label: "❌ No, left uncovered" },
                        { label: "🤔 Not sure" },
                    ]);
                });
                break;

            case "awaiting_storage":
                donationAssessment.storedProperly = text.includes("yes") || text.includes("✅") || text.includes("properly");
                donationAssessment.notSure = text.includes("not sure") || text.includes("🤔") || text.includes("maybe");

                conversationState = "idle";
                generateAssessment();
                break;
        }
    }

    function generateAssessment() {
        const { type, hours, servings, storedProperly, notSure } = donationAssessment;

        let safe = true;
        let status = "safe";
        let title = "";
        let desc = "";
        let icon = "";

        // Determine safety
        if (type === "Cooked Food") {
            if (hours > 4 || (!storedProperly && hours > 2)) {
                safe = false;
            } else if (hours > 2 || notSure) {
                status = "caution";
            }
        } else if (type === "Bakery Items") {
            if (hours > 6 && !storedProperly) {
                safe = false;
            } else if (hours > 4) {
                status = "caution";
            }
        } else if (type === "Fruits/Vegetables") {
            if (!storedProperly && hours > 8) {
                safe = false;
            } else if (hours > 4 && !storedProperly) {
                status = "caution";
            }
        } else if (type === "Packaged Food") {
            // packaged food is generally safe if sealed
            if (!storedProperly) {
                status = "caution";
            }
        }

        if (!storedProperly && !notSure) {
            if (hours > 2) safe = false;
        }

        if (!safe) {
            status = "unsafe";
            icon = "⚠️";
            title = "Not Recommended for Donation";
            desc = `Based on your responses, this <strong>${type}</strong> may not be suitable for donation due to food safety concerns. The food has been out for approximately <strong>${hours} hours</strong> and may not have been stored at a safe temperature.<br><br>
                    <strong>Alternatives:</strong>
                    <ul>
                        <li>Consider composting if possible</li>
                        <li>Check if local farms accept food waste for animal feed</li>
                        <li>Next time, try to donate sooner!</li>
                    </ul>`;
        } else if (status === "caution") {
            icon = "⏳";
            title = "Donate With Caution";
            const remaining = Math.max(0, 2 - (hours - 1));
            desc = `The food appears to be in an acceptable condition, but time is limited. Please <strong>donate within the next ${remaining > 0 ? remaining : 1} hour${remaining > 1 ? "s" : ""}</strong>.<br><br>
                    <strong>Before donating:</strong>
                    <ul>
                        <li>Ensure the food is covered and stored hygienically</li>
                        <li>Keep it at safe temperature (below 5°C or above 60°C)</li>
                        <li>Label with preparation time if possible</li>
                        <li>Transport in clean, insulated containers</li>
                    </ul>`;
        } else {
            icon = "✅";
            title = "Safe for Donation!";
            desc = `Great news! Your <strong>${type}</strong> (approx. <strong>${servings} servings</strong>) appears safe for donation. Please ensure it is stored hygienically and <strong>donate within the next 2 hours</strong>.<br><br>
                    <strong>Donation tips:</strong>
                    <ul>
                        <li>Keep the food covered and at a safe temperature</li>
                        <li>Label it with contents and preparation time</li>
                        <li>Contact a nearby food bank or NGO for pickup</li>
                        <li>Use clean, food-safe containers for transport</li>
                    </ul>`;
        }

        addBotMessage(
            `<strong>📋 Assessment Complete</strong>
            <div class="assessment-card ${status}">
                <div class="assessment-icon">${icon}</div>
                <div class="assessment-title">${title}</div>
                <div class="assessment-desc">${desc}</div>
            </div>`
        ).then(() => {
            setQuickReplies([
                { label: "🔄 Check another food item", handler: () => startDonationAssessment() },
                { label: "📍 Find donation centers" },
                { label: "💡 Waste reduction tips" },
                { label: "🏠 Main menu", handler: () => respondWithMenu() },
            ]);
        });
    }

    // ── Natural Donation Parser ──
    function parseNaturalDonation(text) {
        // e.g. "I have 20 servings of cooked rice prepared 1 hour ago"
        const hasServings = /(\d+)\s*serving/i.test(text);
        const hasFood = /(cooked|rice|food|roti|bread|dal|curry|vegetable|fruit|bakery|cake)/i.test(text);
        const hasTime = /(\d+)\s*hour/i.test(text) || /prepared|made|cooked/i.test(text);
        return hasServings && hasFood && hasTime;
    }

    function handleNaturalDonation(text) {
        const servingsMatch = text.match(/(\d+)\s*serving/i);
        const hoursMatch = text.match(/(\d+)\s*hour/i);
        const servings = servingsMatch ? parseInt(servingsMatch[1]) : 10;
        const hours = hoursMatch ? parseInt(hoursMatch[1]) : 2;

        let type = "Cooked Food";
        if (/fruit|vegetable|veggie/i.test(text)) type = "Fruits/Vegetables";
        else if (/bread|bakery|cake|pastry/i.test(text)) type = "Bakery Items";
        else if (/packaged|sealed|packet/i.test(text)) type = "Packaged Food";

        donationAssessment = { type, hours, servings, storedProperly: true, notSure: false };

        if (hours <= 2) {
            addBotMessage(
                `<strong>📋 Quick Assessment</strong>
                <div class="assessment-card safe">
                    <div class="assessment-icon">✅</div>
                    <div class="assessment-title">Safe for Donation!</div>
                    <div class="assessment-desc">Your <strong>${type}</strong> (approx. <strong>${servings} servings</strong>, prepared <strong>${hours} hour${hours > 1 ? "s" : ""} ago</strong>) appears safe for donation. Ensure it has been stored hygienically and <strong>donate within the next ${Math.max(1, 4 - hours)} hours</strong>.<br><br>
                    <strong>Remember:</strong>
                    <ul>
                        <li>Keep the food covered at safe temperature</li>
                        <li>Use clean containers for transport</li>
                        <li>Label with contents and preparation time</li>
                    </ul></div>
                </div>`
            ).then(() => {
                setQuickReplies([
                    { label: "📍 Find donation centers" },
                    { label: "🔄 Check another food item", handler: () => startDonationAssessment() },
                    { label: "🏠 Main menu", handler: () => respondWithMenu() },
                ]);
            });
        } else if (hours <= 4) {
            addBotMessage(
                `<strong>📋 Quick Assessment</strong>
                <div class="assessment-card caution">
                    <div class="assessment-icon">⏳</div>
                    <div class="assessment-title">Donate With Caution</div>
                    <div class="assessment-desc">Your <strong>${type}</strong> was prepared <strong>${hours} hours ago</strong>. It may still be safe if stored properly (refrigerated or kept hot). Please <strong>donate immediately</strong> and inform the recipient of the preparation time.</div>
                </div>`
            ).then(() => {
                setQuickReplies([
                    { label: "📍 Find donation centers" },
                    { label: "💡 Storage tips" },
                    { label: "🏠 Main menu", handler: () => respondWithMenu() },
                ]);
            });
        } else {
            addBotMessage(
                `<strong>📋 Quick Assessment</strong>
                <div class="assessment-card unsafe">
                    <div class="assessment-icon">⚠️</div>
                    <div class="assessment-title">Not Recommended for Donation</div>
                    <div class="assessment-desc">Your <strong>${type}</strong> was prepared over <strong>${hours} hours ago</strong>. Cooked food should generally not remain at room temperature for more than 2 hours. This food may not be suitable for donation due to food safety concerns.</div>
                </div>`
            ).then(() => {
                setQuickReplies([
                    { label: "💡 Waste reduction tips" },
                    { label: "🔄 Check another item", handler: () => startDonationAssessment() },
                    { label: "🏠 Main menu", handler: () => respondWithMenu() },
                ]);
            });
        }
    }

    // ── Storage Guidance ──
    function handleStorageQuestion(text) {
        if (text.includes("rice") || text.includes("cooked rice")) {
            addBotMessage(
                `<strong>🍚 Cooked Rice Storage</strong>
                <p>Cooked rice should be stored carefully:</p>
                <ul>
                    <li><strong>Room temperature:</strong> Maximum 1 hour (bacteria multiply quickly in rice)</li>
                    <li><strong>Refrigerator (below 5°C):</strong> Up to 1 day in an airtight container</li>
                    <li><strong>Freezer:</strong> Up to 1 month</li>
                </ul>
                <p>⚠️ <em>Never reheat rice more than once. Cool it quickly before refrigerating.</em></p>`
            ).then(() => showStorageQuickReplies());
        } else if (text.includes("room temperature") || text.includes("how long") || text.includes("safe time")) {
            addBotMessage(
                `<strong>🌡️ Room Temperature Safety</strong>
                <p>Cooked food should generally <strong>not remain at room temperature for more than 2 hours</strong>. In hot weather (above 32°C / 90°F), this reduces to <strong>1 hour</strong>.</p>
                <p>The "Danger Zone" for food is between <strong>5°C – 60°C (40°F – 140°F)</strong>, where bacteria grow most rapidly.</p>
                <ul>
                    <li><strong>Hot food:</strong> Keep above 60°C if serving later</li>
                    <li><strong>Cold food:</strong> Keep below 5°C (refrigerate)</li>
                    <li><strong>Leftovers:</strong> Refrigerate within 2 hours of cooking</li>
                </ul>`
            ).then(() => showStorageQuickReplies());
        } else if (text.includes("leftover") || text.includes("refrigerat") || text.includes("fridge")) {
            addBotMessage(
                `<strong>❄️ Refrigerating Leftovers</strong>
                <p>Follow these best practices for storing leftovers:</p>
                <ul>
                    <li><strong>Cool quickly:</strong> Don't leave food out for more than 2 hours</li>
                    <li><strong>Use shallow containers:</strong> Helps food cool faster in the fridge</li>
                    <li><strong>Cover tightly:</strong> Use airtight lids or wrap with cling film</li>
                    <li><strong>Label with date:</strong> Use within 3–4 days</li>
                    <li><strong>Store at 5°C or below:</strong> Check fridge temperature regularly</li>
                    <li><strong>Reheat thoroughly:</strong> Heat to 74°C (165°F) before serving</li>
                </ul>`
            ).then(() => showStorageQuickReplies());
        } else if (text.includes("packaged") || text.includes("open")) {
            addBotMessage(
                `<strong>📦 Packaged Food After Opening</strong>
                <p>Can opened packaged food be donated? It depends:</p>
                <ul>
                    <li><strong>Unopened & within expiry:</strong> ✅ Safe to donate</li>
                    <li><strong>Opened but sealed:</strong> ⚠️ Depends on the item — dry goods like rice or pasta are usually fine if resealed</li>
                    <li><strong>Opened perishables:</strong> ❌ Generally not recommended for donation</li>
                </ul>
                <p><em>Always check the expiry date and packaging integrity before donating.</em></p>`
            ).then(() => showStorageQuickReplies());
        } else {
            respondWithStorageGuide();
        }
    }

    function respondWithStorageGuide() {
        addBotMessage(
            `<strong>🧊 Food Storage Guidelines</strong>
            <p>Here's a quick reference for common food storage:</p>
            <ul>
                <li><strong>Cooked rice:</strong> 1 hour at room temp, 1 day refrigerated</li>
                <li><strong>Cooked meals:</strong> 2 hours at room temp, 3–4 days refrigerated</li>
                <li><strong>Fresh fruits:</strong> 2–7 days depending on type, store in cool area</li>
                <li><strong>Bread & bakery:</strong> 2–3 days at room temp, 1 week+ if frozen</li>
                <li><strong>Packaged food:</strong> Follow expiry date; refrigerate after opening</li>
            </ul>
            <p>Would you like detailed guidance on a specific food type?</p>`
        ).then(() => {
            setQuickReplies([
                { label: "🍚 Cooked rice storage" },
                { label: "🌡️ Room temperature limits" },
                { label: "❄️ Refrigerating leftovers" },
                { label: "📦 Opened packaged food" },
                { label: "🏠 Main menu", handler: () => respondWithMenu() },
            ]);
        });
    }

    function showStorageQuickReplies() {
        setQuickReplies([
            { label: "🍚 Cooked rice storage" },
            { label: "🌡️ Room temperature limits" },
            { label: "❄️ Refrigerating leftovers" },
            { label: "📦 Opened packaged food" },
            { label: "🤝 Check food for donation", handler: () => startDonationAssessment() },
            { label: "🏠 Main menu", handler: () => respondWithMenu() },
        ]);
    }

    // ── Waste Reduction Tips ──
    function respondWithTips() {
        addBotMessage(
            `<strong>💡 Food Waste Reduction Tips</strong>
            <p>Here are practical ways to reduce food waste at home:</p>
            <ul>
                <li>🗒️ <strong>Plan your meals</strong> — make a weekly plan and buy only what you need</li>
                <li>🧊 <strong>Store food correctly</strong> — proper storage extends shelf life significantly</li>
                <li>🍳 <strong>Use leftovers creatively</strong> — yesterday's rice becomes today's fried rice!</li>
                <li>🤝 <strong>Donate before it spoils</strong> — share surplus with those in need</li>
                <li>📅 <strong>First In, First Out</strong> — use older items before newer purchases</li>
                <li>🥶 <strong>Freeze extras</strong> — most cooked meals freeze well for up to a month</li>
                <li>📏 <strong>Right-size your portions</strong> — cook appropriate amounts to reduce leftovers</li>
                <li>🌿 <strong>Compost what you can't eat</strong> — turn waste into nutrient-rich soil</li>
            </ul>
            <p><em>Even small changes make a big impact. Globally, 1/3 of all food produced is wasted! 🌍</em></p>`
        ).then(() => {
            setQuickReplies([
                { label: "🤝 Check food for donation", handler: () => startDonationAssessment() },
                { label: "🧊 Storage guidelines" },
                { label: "📍 Find donation centers" },
                { label: "🏠 Main menu", handler: () => respondWithMenu() },
            ]);
        });
    }

    // ── Donation Suggestions ──
    function respondWithDonationSuggestions() {
        addBotMessage(
            `<strong>📍 Donation Suggestions</strong>
            <p>Here are some ways to donate your surplus food:</p>
            <ul>
                <li>🏛️ <strong>Food Banks</strong> — Contact your local food bank; they accept most non-perishable and freshly cooked food</li>
                <li>🍲 <strong>Community Kitchens</strong> — Many run daily meal programs and welcome surplus food donations</li>
                <li>🤝 <strong>NGOs & Charities</strong> — Organizations like Feeding India, Robin Hood Army, and local shelters often coordinate food pickups</li>
                <li>📱 <strong>Food Sharing Apps</strong> — Use platforms like OLIO, Too Good To Go, or local food-sharing networks to connect with people nearby</li>
                <li>🏘️ <strong>Neighbors & Community</strong> — Share surplus food with neighbors, office colleagues, or through community WhatsApp groups</li>
                <li>🕌 <strong>Religious Institutions</strong> — Temples, mosques, churches, and gurudwaras often distribute food to those in need</li>
            </ul>
            <p><strong>💡 Tip:</strong> For large quantities, many organizations offer free pickup. Call ahead to coordinate!</p>`
        ).then(() => {
            setQuickReplies([
                { label: "🤝 Check food for donation", handler: () => startDonationAssessment() },
                { label: "💡 Waste reduction tips" },
                { label: "🧊 Storage guidelines" },
                { label: "🏠 Main menu", handler: () => respondWithMenu() },
            ]);
        });
    }

    // ── Support ──
    function respondWithSupport() {
        addBotMessage(
            `<strong>📞 Contact Support</strong>
            <p>We're here to help! You can reach the EcoWise team through:</p>
            <ul>
                <li>📧 <strong>Email:</strong> support@ecowise.org</li>
                <li>📱 <strong>Phone:</strong> +1-800-ECO-WISE (326-9473)</li>
                <li>💬 <strong>Live Chat:</strong> Available Mon–Sat, 9 AM – 6 PM</li>
                <li>🌐 <strong>Website:</strong> www.ecowise.org/help</li>
            </ul>
            <p>You can also continue chatting with me for food donation and waste reduction guidance!</p>`
        ).then(() => {
            setQuickReplies([
                { label: "🏠 Main menu", handler: () => respondWithMenu() },
                { label: "🤝 Check food for donation", handler: () => startDonationAssessment() },
            ]);
        });
    }

    // ── Greeting ──
    function respondWithGreeting() {
        addBotMessage(
            `<p>Hello! Welcome to <strong>EcoWise</strong> 🌱. I help reduce food waste by guiding you on food donation and safe food handling. How can I assist you today?</p>`
        ).then(() => respondWithMenuOptions());
    }

    // ── Thanks ──
    function respondWithThanks() {
        const responses = [
            "You're welcome! Every effort to reduce food waste makes a difference. 🌍💚",
            "Happy to help! Together we can work towards Zero Hunger. 🤝🌱",
            "Glad I could assist! Remember, small steps lead to big changes. 💪🌿",
        ];
        addBotMessage(`<p>${responses[Math.floor(Math.random() * responses.length)]}</p>`).then(() => {
            setQuickReplies([
                { label: "🏠 Main menu", handler: () => respondWithMenu() },
                { label: "🤝 Check food for donation", handler: () => startDonationAssessment() },
            ]);
        });
    }

    // ── Menu ──
    function respondWithMenu() {
        addBotMessage(
            `<strong>📋 How can I help you?</strong>
            <p>Here are the things I can assist you with:</p>`
        ).then(() => respondWithMenuOptions());
    }

    function respondWithMenuOptions() {
        setQuickReplies([
            { label: "🤝 Check if food can be donated", handler: () => startDonationAssessment() },
            { label: "🧊 Food storage guidelines" },
            { label: "📍 Find donation suggestions" },
            { label: "💡 Food waste reduction tips" },
            { label: "📞 Contact support" },
        ]);
    }

    // ── Fallback ──
    function respondWithFallback() {
        addBotMessage(
            `<p>I'm sorry, I didn't quite understand that. 😊 Please choose one of the available options or rephrase your question.</p>
            <p>Here's what I can help you with:</p>`
        ).then(() => respondWithMenuOptions());
    }

    // ── Welcome Card Clicks ──
    chatMessages.addEventListener("click", (e) => {
        const card = e.target.closest(".welcome-card");
        if (card) {
            const hero = card.closest(".welcome-hero");
            if (hero) hero.remove();
            handleSidebarAction(card.dataset.action);
        }
    });

    // ── Initialize ──
    showWelcome();

})();