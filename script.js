// Gemini API Configuration
const apiKey = "AIzaSyB2AMjXHldeiJrE8zZz1L4Yn88FEeT_izw";
const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

// DOM Elements
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");
const loginBtn = document.getElementById("loginBtn");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const newChatBtn = document.getElementById("newChatBtn");
const adminBtn = document.getElementById("adminBtn");
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const modalTitle = document.getElementById("modalTitle");
const closeModal = document.querySelectorAll(".close");
const userInfo = document.getElementById("userInfo");
const adminModal = document.getElementById("adminModal");
const userList = document.getElementById("userList");
const blacklistedMessage = document.getElementById("blacklistedMessage");
const mainContainer = document.getElementById("mainContainer");
const typingIndicator = document.getElementById("typingIndicator");
const suggestions = document.getElementById("suggestions");
const newsDateTime = document.getElementById("newsDateTime");

// Track Current User and Chat Session
let currentUser = null;
let currentChatId = null;

// "Database" using localStorage
const usersDB = JSON.parse(localStorage.getItem("usersDB") || "{}");
const chatsDB = JSON.parse(localStorage.getItem("chatsDB") || "[]");
const bannedUsers = JSON.parse(localStorage.getItem("bannedUsers") || "[]");

// Initialize Database Memory for Founder and School
const founderDB = JSON.parse(localStorage.getItem("founderDB")) || {
    name: "Shoaib Carrington",
    role: "Founder of GRACE AI"
};
localStorage.setItem("founderDB", JSON.stringify(founderDB));

const schoolDB = JSON.parse(localStorage.getItem("schoolDB")) || {
    name: "International School of Dhaka",
    description: "The International School of Dhaka (ISD) is an IB World School in Dhaka, Bangladesh, offering the IB Continuum (PYP, MYP, DP) and a U.S. High School Diploma pathway. GRACE AI was created for ISD to support its students and educators.",
    website: "https://www.isdbd.org/",
    stats: {
        nationalities: 30,
        topUniversities: 27,
        students: 401,
        sportsTeams: 21,
        libraryBooks: 18000,
        staff: 203
    }
};
localStorage.setItem("schoolDB", JSON.stringify(schoolDB));

// Set the date and time for the news item
if (newsDateTime) {
    const uploadDate = new Date("2025-04-09T10:00:00"); // Example date, can be dynamic
    newsDateTime.textContent = uploadDate.toLocaleString();
}

// Check if user is already logged in
const storedUser = localStorage.getItem("currentUser");
if (storedUser) {
    currentUser = JSON.parse(storedUser);
    if (bannedUsers.includes(currentUser.userId)) {
        showBlacklistedMessage();
    } else {
        loginBtn.style.display = "none";
        signupBtn.style.display = "none";
        logoutBtn.style.display = "block";
        newChatBtn.style.display = "block";
        userInfo.style.display = "block";
        userInfo.textContent = `User: ${currentUser.username} (ID: ${currentUser.userId})`;
        if (currentUser.userId === "ad6ed825-2e21-44f2-ac29-293de9bc5903") {
            adminBtn.style.display = "block";
        }
        startNewChat();
    }
}

// Event Listeners
sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

loginBtn.addEventListener("click", () => showModal("Login", authModal));
signupBtn.addEventListener("click", () => showModal("Signup", authModal));
logoutBtn.addEventListener("click", logout);
newChatBtn.addEventListener("click", startNewChat);
adminBtn.addEventListener("click", () => showModal("Admin", adminModal));
closeModal.forEach(btn => btn.addEventListener("click", () => {
    authModal.style.display = "none";
    adminModal.style.display = "none";
}));
authForm.addEventListener("submit", handleAuth);

// Chat Suggestions
suggestions.querySelectorAll(".suggestion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        userInput.value = btn.textContent;
        sendMessage();
    });
});

function showModal(type, modal) {
    if (type !== "Admin") {
        modalTitle.textContent = type;
    }
    modal.style.display = "block";
    if (type === "Admin") {
        displayUserList();
    }
}

function generateUserId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function handleAuth(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const type = modalTitle.textContent.toLowerCase();

    if (type === "signup") {
        if (usersDB[username]) {
            alert("Username already exists!");
            return;
        }

        const userId = generateUserId();
        usersDB[username] = {
            userId: userId,
            username: username,
            password: password
        };
        localStorage.setItem("usersDB", JSON.stringify(usersDB));

        alert("Signup successful! Please login.");
        authModal.style.display = "none";
    } else {
        const user = usersDB[username];
        if (!user || user.password !== password) {
            alert("Invalid credentials!");
            return;
        }

        if (bannedUsers.includes(user.userId)) {
            showBlacklistedMessage();
            return;
        }

        currentUser = user;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        loginBtn.style.display = "none";
        signupBtn.style.display = "none";
        logoutBtn.style.display = "block";
        newChatBtn.style.display = "block";
        userInfo.style.display = "block";
        userInfo.textContent = `User: ${currentUser.username} (ID: ${currentUser.userId})`;
        if (currentUser.userId === "ad6ed825-2e21-44f2-ac29-293de9bc5903") {
            adminBtn.style.display = "block";
        }
        authModal.style.display = "none";
        startNewChat();
    }
}

function logout() {
    currentUser = null;
    currentChatId = null;
    localStorage.removeItem("currentUser");
    loginBtn.style.display = "block";
    signupBtn.style.display = "block";
    logoutBtn.style.display = "none";
    newChatBtn.style.display = "none";
    adminBtn.style.display = "none";
    userInfo.style.display = "none";
    chatBox.innerHTML = "";
}

function startNewChat() {
    if (!currentUser) return;

    if (currentChatId) {
        const chatIndex = chatsDB.findIndex(chat => chat.chatId === currentChatId);
        if (chatIndex !== -1) {
            const messages = Array.from(chatBox.children).map(child => ({
                className: child.className,
                text: child.textContent
            }));
            chatsDB[chatIndex].messages = messages;
            localStorage.setItem("chatsDB", JSON.stringify(chatsDB));
        }
    }

    currentChatId = generateUserId();
    chatsDB.push({
        userId: currentUser.userId,
        chatId: currentChatId,
        messages: []
    });
    localStorage.setItem("chatsDB", JSON.stringify(chatsDB));

    chatBox.innerHTML = "";
    loadChatHistory();
}

async function sendMessage() {
    if (!currentUser) {
        alert("Please login or signup first!");
        return;
    }

    const message = userInput.value.trim();
    if (!message) return;

    appendMessage("user-message", message);
    userInput.value = "";
    sendButton.disabled = true;
    typingIndicator.style.display = "block";

    // Check for queries about the founder, school, website, or stats
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("who is shoaib") || lowerMessage.includes("who is shoaib carrington")) {
        typingIndicator.style.display = "none";
        typeMessage("Hello! Shoaib Carrington is the wonderful founder of GRACE AI. We're so grateful for his vision!");
        saveMessageToChat("ai-message", "Hello! Shoaib Carrington is the wonderful founder of GRACE AI. We're so grateful for his vision!");
        sendButton.disabled = false;
        return;
    }

    if (lowerMessage.includes("international school of dhaka") || lowerMessage.includes("isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`Here’s some information about the International School of Dhaka (ISD): ${schoolDB.description}`);
        saveMessageToChat("ai-message", `Here’s some information about the International School of Dhaka (ISD): ${schoolDB.description}`);
        sendButton.disabled = false;
        return;
    }

    if (lowerMessage.includes("website") && (lowerMessage.includes("isd") || lowerMessage.includes("international school of dhaka"))) {
        typingIndicator.style.display = "none";
        typeMessage(`The website for the International School of Dhaka is ${schoolDB.website}. You can visit it for more information!`);
        saveMessageToChat("ai-message", `The website for the International School of Dhaka is ${schoolDB.website}. You can visit it for more information!`);
        sendButton.disabled = false;
        return;
    }

    // Check for statistics-related queries
    if (lowerMessage.includes("how many nationalities") || lowerMessage.includes("nationalities at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`The ISD community proudly represents ${schoolDB.stats.nationalities} nationalities! It’s such a diverse and vibrant place to learn.`);
        saveMessageToChat("ai-message", `The ISD community proudly represents ${schoolDB.stats.nationalities} nationalities! It’s such a diverse and vibrant place to learn.`);
        sendButton.disabled = false;
        return;
    }

    if (lowerMessage.includes("top universities") || lowerMessage.includes("universities isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`The Class of 2023 from ISD was accepted into ${schoolDB.stats.topUniversities} of the world’s top 100 universities. That’s an amazing achievement!`);
        saveMessageToChat("ai-message", `The Class of 2023 from ISD was accepted into ${schoolDB.stats.topUniversities} of the world’s top 100 universities. That’s an amazing achievement!`);
        sendButton.disabled = false;
        return;
    }

    if (lowerMessage.includes("how many students") || lowerMessage.includes("students at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`ISD has ${schoolDB.stats.students} students, ranging from ages 2 to 19. It’s a wonderful community!`);
        saveMessageToChat("ai-message", `ISD has ${schoolDB.stats.students} students, ranging from ages 2 to 19. It’s a wonderful community!`);
        sendButton.disabled = false;
        return;
    }

    if (lowerMessage.includes("sports teams") || lowerMessage.includes("teams at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`ISD offers ${schoolDB.stats.sportsTeams} sports teams for students to join. There’s something for everyone!`);
        saveMessageToChat("ai-message", `ISD offers ${schoolDB.stats.sportsTeams} sports teams for students to join. There’s something for everyone!`);
        sendButton.disabled = false;
        return;
    }

    if (lowerMessage.includes("library books") || lowerMessage.includes("books at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`The ISD library is well-resourced with over ${schoolDB.stats.libraryBooks} books in 5 different languages. It’s a great place for learning!`);
        saveMessageToChat("ai-message", `The ISD library is well-resourced with over ${schoolDB.stats.libraryBooks} books in 5 different languages. It’s a great place for learning!`);
        sendButton.disabled = false;
        return;
    }

    if (lowerMessage.includes("how many staff") || lowerMessage.includes("staff at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`ISD has ${schoolDB.stats.staff} dedicated staff members supporting the school community. They’re amazing!`);
        saveMessageToChat("ai-message", `ISD has ${schoolDB.stats.staff} dedicated staff members supporting the school community. They’re amazing!`);
        sendButton.disabled = false;
        return;
    }

    const politePrompt = `
        You are GRACE AI, a friendly and helpful AI created for the International School of Dhaka. Respond in a polite, conversational, and supportive tone, as if you’re a kind assistant eager to help. Provide accurate and thoughtful answers, and if the user requests code, format the response as a code block with the programming language specified (e.g., "javascript", "python"). Here’s the user’s input: "${message}"
    `;

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: politePrompt }] }]
            })
        });
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text.trim();
        typingIndicator.style.display = "none";

        // Check if the response contains a code block
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/;
        const match = aiResponse.match(codeBlockRegex);
        if (match) {
            const language = match[1] || "text";
            const code = match[2].trim();
            appendCodeMessage(language, code);
        } else {
            typeMessage(aiResponse);
        }

        saveMessageToChat("ai-message", aiResponse);
        sendButton.disabled = false;
    } catch (error) {
        typingIndicator.style.display = "none";
        appendMessage("ai-message", `I’m so sorry, there was an error: ${error.message}. Let me know how I can assist you further!`);
        saveMessageToChat("ai-message", `I’m so sorry, there was an error: ${error.message}. Let me know how I can assist you further!`);
        sendButton.disabled = false;
    }
}

function appendMessage(className, text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${className}`;
    messageDiv.textContent = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function typeMessage(text) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message ai-message";
    const span = document.createElement("span");
    span.className = "typing";
    span.textContent = text;
    messageDiv.appendChild(span);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function appendCodeMessage(language, code) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message ai-message";

    const codeBlock = document.createElement("div");
    codeBlock.className = "code-block";

    // Add language header
    const codeHeader = document.createElement("div");
    codeHeader.className = "code-block-header";
    codeHeader.textContent = language;
    codeBlock.appendChild(codeHeader);

    // Add copy button
    const copyButton = document.createElement("button");
    copyButton.className = "code-block-copy";
    copyButton.textContent = "Copy";
    copyButton.addEventListener("click", () => {
        navigator.clipboard.writeText(code).then(() => {
            copyButton.textContent = "Copied!";
            setTimeout(() => (copyButton.textContent = "Copy"), 2000);
        });
    });
    codeBlock.appendChild(copyButton);

    // Basic syntax highlighting
    let highlightedCode = code;
    if (language === "javascript" || language === "python") {
        // Highlight keywords
        const keywords = language === "javascript"
            ? /\b(function|const|let|var|if|else|for|while|return|class|new)\b/g
            : /\b(def|class|if|else|for|while|return|import|from|as|print)\b/g;
        highlightedCode = highlightedCode.replace(keywords, '<span class="keyword">$1</span>');

        // Highlight strings
        highlightedCode = highlightedCode.replace(/"([^"]*)"|'([^']*)'/g, '<span class="string">"$1$2"</span>');

        // Highlight comments
        highlightedCode = highlightedCode.replace(/(\/\/.*$)|(#[^\n]*)/gm, '<span class="comment">$1$2</span>');
    }

    codeBlock.innerHTML += highlightedCode;
    messageDiv.appendChild(codeBlock);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function saveMessageToChat(className, text) {
    const chatIndex = chatsDB.findIndex(chat => chat.chatId === currentChatId);
    if (chatIndex !== -1) {
        const messages = Array.from(chatBox.children).map(child => ({
            className: child.className,
            text: child.textContent
        }));
        chatsDB[chatIndex].messages = messages;
        localStorage.setItem("chatsDB", JSON.stringify(chatsDB));
    }
}

function loadChatHistory() {
    if (!currentUser || !currentChatId) return;

    const chat = chatsDB.find(chat => chat.chatId === currentChatId);
    if (chat) {
        chatBox.innerHTML = "";
        chat.messages.forEach(msg => {
            if (msg.className.includes("ai-message")) {
                typeMessage(msg.text);
            } else {
                appendMessage(msg.className, msg.text);
            }
        });
    }
}

function displayUserList() {
    userList.innerHTML = "";
    Object.values(usersDB).forEach(user => {
        const userDiv = document.createElement("div");
        userDiv.className = "user-item";
        userDiv.innerHTML = `
            <span>${user.username} (ID: ${user.userId})</span>
            <button onclick="banUser('${user.userId}')">Ban</button>
        `;
        userList.appendChild(userDiv);
    });
}

window.banUser = function(userId) {
    if (!bannedUsers.includes(userId)) {
        bannedUsers.push(userId);
        localStorage.setItem("bannedUsers", JSON.stringify(bannedUsers));
        alert(`User with ID ${userId} has been banned.`);
        if (currentUser && currentUser.userId === userId) {
            showBlacklistedMessage();
        }
        displayUserList();
    }
};

function showBlacklistedMessage() {
    mainContainer.style.display = "none";
    blacklistedMessage.style.display = "flex";
    localStorage.removeItem("currentUser");
}
