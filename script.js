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
const profileBtn = document.getElementById("profileBtn");
const adminBtn = document.getElementById("adminBtn");
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const profileModal = document.getElementById("profileModal");
const profileForm = document.getElementById("profileForm");
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
const chatHistory = document.getElementById("chatHistory");
const chatList = document.getElementById("chatList");
const newsList = document.getElementById("newsList");

// Track Current User and Chat Session
let currentUser = null;
let currentChatId = null;

// "Database" using localStorage
const usersDB = JSON.parse(localStorage.getItem("usersDB") || "{}");
const chatsDB = JSON.parse(localStorage.getItem("chatsDB") || "[]");
const bannedUsers = JSON.parse(localStorage.getItem("bannedUsers") || "[]");
const profilesDB = JSON.parse(localStorage.getItem("profilesDB") || "{}");
const newsDB = JSON.parse(localStorage.getItem("newsDB") || "[]");

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

// Initialize News DB with the existing article if empty
if (newsDB.length === 0) {
    newsDB.push({
        id: generateUserId(),
        title: "ISD student makes his mark in global competition",
        content: "An ISD student has recently made headlines by achieving a remarkable position in a prestigious global competition. Representing the International School of Dhaka, the student showcased exceptional talent and dedication, bringing pride to the school community. This achievement highlights ISD's commitment to fostering excellence and supporting students in their endeavors on an international stage.",
        image: "https://tds-images.thedailystar.net/sites/default/files/styles/big_202/public/images/2025/03/17/aditya_varshney.jpeg",
        date: "2025-04-09"
    });
    localStorage.setItem("newsDB", JSON.stringify(newsDB));
}

// Set the date and time for the news item (for news.html)
if (newsDateTime) {
    const newsId = new URLSearchParams(window.location.search).get("id");
    const newsArticle = newsDB.find(article => article.id === newsId);
    if (newsArticle) {
        document.querySelector(".news-article h2").textContent = newsArticle.title;
        document.querySelector(".news-meta").textContent = `Posted on: ${new Date(newsArticle.date).toLocaleString()}`;
        document.querySelector(".news-image").src = newsArticle.image || "";
        document.querySelector(".news-article p").textContent = newsArticle.content;
    }
}

// Display news articles in the sidebar
function displayNews() {
    newsList.innerHTML = "";
    newsDB.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
    newsDB.slice(0, 3).forEach(article => { // Show only the latest 3 articles
        const newsItem = document.createElement("div");
        newsItem.className = "news-item";
        newsItem.innerHTML = `
            <a href="news.html?id=${article.id}" target="_blank">${article.title}</a>
            <span>${new Date(article.date).toLocaleDateString()}</span>
        `;
        newsList.appendChild(newsItem);
    });
}
displayNews();

// Apply the user's theme on page load
function applyTheme() {
    if (currentUser && profilesDB[currentUser.userId]) {
        const theme = profilesDB[currentUser.userId].theme || "dark";
        document.body.className = theme + "-theme";
    } else {
        document.body.className = "dark-theme"; // Default to dark theme
    }
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
        profileBtn.style.display = "block";
        chatHistory.style.display = "block";
        userInfo.style.display = "block";
        userInfo.textContent = `User: ${currentUser.username} (ID: ${currentUser.userId})`;
        if (currentUser.userId === "ad6ed825-2e21-44f2-ac29-293de9bc5903") {
            adminBtn.style.display = "block";
        }
        applyTheme();
        displayChatHistory();
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
profileBtn.addEventListener("click", () => showModal("Profile", profileModal));
adminBtn.addEventListener("click", () => showModal("Admin", adminModal));
closeModal.forEach(btn => btn.addEventListener("click", () => {
    authModal.style.display = "none";
    profileModal.style.display = "none";
    adminModal.style.display = "none";
}));
authForm.addEventListener("submit", handleAuth);
profileForm.addEventListener("submit", handleProfileUpdate);

// Chat Suggestions
suggestions.querySelectorAll(".suggestion-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        userInput.value = btn.textContent;
        sendMessage();
    });
});

function showModal(type, modal) {
    if (type !== "Admin" && type !== "Profile") {
        modalTitle.textContent = type;
    }
    modal.style.display = "block";
    if (type === "Admin") {
        displayUserList();
    } else if (type === "Profile") {
        // Populate profile form with existing data
        const profile = profilesDB[currentUser.userId] || {};
        document.getElementById("profilePicture").value = profile.profilePicture || "";
        document.getElementById("bio").value = profile.bio || "";
        document.getElementById("theme").value = profile.theme || "dark";
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
        profileBtn.style.display = "block";
        chatHistory.style.display = "block";
        userInfo.style.display = "block";
        userInfo.textContent = `User: ${currentUser.username} (ID: ${currentUser.userId})`;
        if (currentUser.userId === "ad6ed825-2e21-44f2-ac29-293de9bc5903") {
            adminBtn.style.display = "block";
        }
        authModal.style.display = "none";
        applyTheme();
        displayChatHistory();
        startNewChat();
    }
}

function handleProfileUpdate(e) {
    e.preventDefault();
    const profilePicture = document.getElementById("profilePicture").value;
    const bio = document.getElementById("bio").value;
    const theme = document.getElementById("theme").value;

    profilesDB[currentUser.userId] = {
        profilePicture: profilePicture,
        bio: bio,
        theme: theme
    };
    localStorage.setItem("profilesDB", JSON.stringify(profilesDB));

    applyTheme();
    profileModal.style.display = "none";
    alert("Profile updated successfully!");
}

function logout() {
    currentUser = null;
    currentChatId = null;
    localStorage.removeItem("currentUser");
    loginBtn.style.display = "block";
    signupBtn.style.display = "block";
    logoutBtn.style.display = "none";
    newChatBtn.style.display = "none";
    profileBtn.style.display = "none";
    chatHistory.style.display = "none";
    adminBtn.style.display = "none";
    userInfo.style.display = "none";
    chatBox.innerHTML = "";
    chatList.innerHTML = "";
    document.body.className = "dark-theme"; // Reset to default theme
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
            chatsDB[chatIndex].lastUpdated = new Date().toISOString();
            localStorage.setItem("chatsDB", JSON.stringify(chatsDB));
        }
    }

    currentChatId = generateUserId();
    chatsDB.push({
        userId: currentUser.userId,
        chatId: currentChatId,
        messages: [],
        lastUpdated: new Date().toISOString()
    });
    localStorage.setItem("chatsDB", JSON.stringify(chatsDB));

    chatBox.innerHTML = "";
    displayChatHistory();
    loadChatHistory();
}

function displayChatHistory() {
    if (!currentUser) return;

    chatList.innerHTML = "";
    const userChats = chatsDB.filter(chat => chat.userId === currentUser.userId);
    userChats.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)); // Sort by last updated

    userChats.forEach((chat, index) => {
        const chatItem = document.createElement("div");
        chatItem.className = "chat-item";
        const chatTitle = chat.messages.length > 0 ? chat.messages[0].text.substring(0, 20) + "..." : "New Chat";
        const chatDate = new Date(chat.lastUpdated).toLocaleDateString();
        chatItem.innerHTML = `
            <a href="#" onclick="loadChat('${chat.chatId}'); return false;">Chat ${index + 1}: ${chatTitle} (${chatDate})</a>
            <button onclick="deleteChat('${chat.chatId}')">Delete</button>
        `;
        chatList.appendChild(chatItem);
    });
}

window.loadChat = function(chatId) {
    if (currentChatId) {
        const chatIndex = chatsDB.findIndex(chat => chat.chatId === currentChatId);
        if (chatIndex !== -1) {
            const messages = Array.from(chatBox.children).map(child => ({
                className: child.className,
                text: child.textContent
            }));
            chatsDB[chatIndex].messages = messages;
            chatsDB[chatIndex].lastUpdated = new Date().toISOString();
            localStorage.setItem("chatsDB", JSON.stringify(chatsDB));
        }
    }

    currentChatId = chatId;
    loadChatHistory();
};

window.deleteChat = function(chatId) {
    const chatIndex = chatsDB.findIndex(chat => chat.chatId === chatId);
    if (chatIndex !== -1) {
        chatsDB.splice(chatIndex, 1);
        localStorage.setItem("chatsDB", JSON.stringify(chatsDB));
        if (currentChatId === chatId) {
            chatBox.innerHTML = "";
            startNewChat();
        } else {
            displayChatHistory();
        }
    }
};

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

    // Check for queries about the founder, school, website, stats, or ManageBac
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("who is shoaib") || lowerMessage.includes("who is shoaib carrington")) {
        typingIndicator.style.display = "none";
        typeMessage("Hello! Shoaib Carrington is the wonderful founder of GRACE AI. We're so grateful for his vision!");
        saveMessageToChat("ai-message", "Hello! Shoaib Carrington is the wonderful founder of GRACE AI. We're so grateful for his vision!");
        sendButton.disabled = false;
        displayChatHistory();
        return;
    }

    if (lowerMessage.includes("international school of dhaka") || lowerMessage.includes("isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`Here’s some information about the International School of Dhaka (ISD): ${schoolDB.description}`);
        saveMessageToChat("ai-message", `Here’s some information about the International School of Dhaka (ISD): ${schoolDB.description}`);
        sendButton.disabled = false;
        displayChatHistory();
        return;
    }

    if (lowerMessage.includes("website") && (lowerMessage.includes("isd") || lowerMessage.includes("international school of dhaka"))) {
        typingIndicator.style.display = "none";
        typeMessage(`The website for the International School of Dhaka is ${schoolDB.website}. You can visit it for more information!`);
        saveMessageToChat("ai-message", `The website for the International School of Dhaka is ${schoolDB.website}. You can visit it for more information!`);
        sendButton.disabled = false;
        displayChatHistory();
        return;
    }

    // Check for ManageBac queries or suggestion click
    if (lowerMessage.includes("how to use managebac") || lowerMessage === "how to use managebac?") {
        typingIndicator.style.display = "none";
        const manageBacGuide = `
            <h3>🎓 FULL STUDENT GUIDE TO MANAGEBAC</h3>
            <h4>🔐 1. Logging In</h4>
            <p><strong>How:</strong></p>
            <ul>
                <li>Visit <a href="https://www.managebac.com" target="_blank">https://www.managebac.com</a></li>
                <li>Click "Log In"</li>
                <li>Choose your school name or email domain.</li>
                <li>You may have options like:</li>
                <ul>
                    <li>Sign in with Google</li>
                    <li>Sign in with Microsoft</li>
                    <li>Use your username/email + password.</li>
                </ul>
            </ul>
            <p><strong>Tips:</strong></p>
            <ul>
                <li>Use the same credentials your school gave you.</li>
                <li>If you forgot your password, click "Forgot Password?" and reset it via email.</li>
            </ul>

            <h4>🏠 2. Dashboard Overview</h4>
            <p>Once you're in, you’ll see your Dashboard:</p>
            <ul>
                <li>Quick links to your classes.</li>
                <li>A calendar showing upcoming due dates.</li>
                <li>Recent activity feed – updates from your teachers or assignments.</li>
                <li>A summary of CAS, EE, and TOK (if you're in the IB program).</li>
                <li>Your IB DP Progress if you’re in Grade 11–12.</li>
            </ul>

            <h4>📚 3. Accessing Classes</h4>
            <p>From the sidebar or dashboard:</p>
            <ul>
                <li>Click on a subject name (e.g., "English Language and Literature SL").</li>
                <li>Inside a class, you’ll see:</li>
            </ul>
            <table>
                <tr><th>Tab</th><th>What It Shows</th></tr>
                <tr><td>Overview</td><td>Teacher info, unit summaries</td></tr>
                <tr><td>Files</td><td>Study materials, worksheets, rubrics</td></tr>
                <tr><td>Tasks & Deadlines</td><td>Upcoming assignments & homework</td></tr>
                <tr><td>Grades</td><td>Your scores & feedback</td></tr>
                <tr><td>Messages</td><td>Notices or updates from the teacher</td></tr>
            </table>

            <h4>📝 4. Submitting Assignments</h4>
            <p><strong>To turn in your work:</strong></p>
            <ul>
                <li>Go to the Calendar or your Class > Tasks & Deadlines.</li>
                <li>Click on the assignment you want to submit.</li>
                <li>You’ll see:</li>
                <ul>
                    <li>Due date</li>
                    <li>Description & instructions</li>
                    <li>Any attached files or rubrics</li>
                </ul>
                <li>Click "Submit Work"</li>
                <li>Upload your file (PDF, DOCX, etc.) or enter text if it's a written response.</li>
                <li>Click "Submit" or "Save as Draft" if you're not ready.</li>
            </ul>
            <p><strong>✅ Tip:</strong> Make sure to check the deadline and file requirements before uploading!</p>

            <h4>🧠 5. IB Core: CAS / EE / TOK</h4>
            <p><strong>CAS (Creativity, Activity, Service)</strong></p>
            <ul>
                <li>Click CAS from the sidebar.</li>
                <li>Click "Add Experience" to log an activity (e.g., volunteering, music, sports).</li>
                <li>Fill in:</li>
                <ul>
                    <li>Title</li>
                    <li>Description</li>
                    <li>Goals & Outcomes</li>
                    <li>Dates & Hours</li>
                    <li>Reflections</li>
                    <li>Supervisor name & email</li>
                </ul>
                <li>Upload photos or documents.</li>
                <li>Submit for advisor approval.</li>
            </ul>
            <p><strong>EE (Extended Essay)</strong></p>
            <ul>
                <li>Navigate to the Extended Essay section.</li>
                <li>Log your research question, meetings, reflections (RPPF).</li>
                <li>Upload drafts and final submission.</li>
                <li>Keep track of deadlines set by your school.</li>
            </ul>
            <p><strong>TOK (Theory of Knowledge)</strong></p>
            <ul>
                <li>Manage your Essay and Exhibition.</li>
                <li>Log your progress and upload work.</li>
                <li>Reflection journals might be required.</li>
            </ul>

            <h4>📅 6. Using the Calendar</h4>
            <p>Go to Calendar to view:</p>
            <ul>
                <li>Deadlines across all your classes.</li>
                <li>Personal events or school-wide announcements.</li>
                <li>Click on any task to open it directly.</li>
                <li>Color-coded by class makes it easy to track.</li>
            </ul>

            <h4>💬 7. Messaging</h4>
            <ul>
                <li>Use the Messages tab in each class for updates from teachers.</li>
                <li>Some schools allow student-teacher messaging, others may not.</li>
                <li>You might see school-wide bulletins or announcements here too.</li>
            </ul>

            <h4>📈 8. Grades & Reports</h4>
            <p>Click on a class and go to the Grades tab.</p>
            <ul>
                <li>You’ll see:</li>
                <ul>
                    <li>Individual assignment scores</li>
                    <li>Feedback from your teacher</li>
                    <li>MYP/DP criteria breakdown</li>
                </ul>
                <li>Your overall grade is calculated based on IB assessment standards.</li>
                <li>Reports may also be available to download (PDF).</li>
            </ul>

            <h4>⚙️ 9. Settings & Help</h4>
            <p>Click your profile picture or name (top-right).</p>
            <ul>
                <li>From there, you can:</li>
                <ul>
                    <li>Change password</li>
                    <li>Switch themes (if available)</li>
                    <li>Set notification preferences</li>
                    <li>Access the Help Centre or contact support</li>
                </ul>
            </ul>

            <h4>🙋‍♂️ Common Student Questions</h4>
            <table>
                <tr><th>Question</th><th>Answer</th></tr>
                <tr><td>Can I edit a submission after uploading?</td><td>Depends on teacher settings. Some allow resubmission.</td></tr>
                <tr><td>Where do I upload my EE final version?</td><td>In the Extended Essay section under “Final Submission.”</td></tr>
                <tr><td>How do I know if my CAS activity was approved?</td><td>It’ll say “Approved” under status, and you may get a message.</td></tr>
                <tr><td>Do I get notifications?</td><td>Yes, depending on your settings — email or in-site alerts.</td></tr>
            </table>
        `;
        appendFormattedMessage(manageBacGuide);
        saveMessageToChat("ai-message", manageBacGuide);
        sendButton.disabled = false;
        displayChatHistory();
        return;
    }

    // Check for statistics-related queries
    if (lowerMessage.includes("how many nationalities") || lowerMessage.includes("nationalities at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`The ISD community proudly represents ${schoolDB.stats.nationalities} nationalities! It’s such a diverse and vibrant place to learn.`);
        saveMessageToChat("ai-message", `The ISD community proudly represents ${schoolDB.stats.nationalities} nationalities! It’s such a diverse and vibrant place to learn.`);
        sendButton.disabled = false;
        displayChatHistory();
        return;
    }

    if (lowerMessage.includes("top universities") || lowerMessage.includes("universities isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`The Class of 2023 from ISD was accepted into ${schoolDB.stats.topUniversities} of the world’s top 100 universities. That’s an amazing achievement!`);
        saveMessageToChat("ai-message", `The Class of 2023 from ISD was accepted into ${schoolDB.stats.topUniversities} of the world’s top 100 universities. That’s an amazing achievement!`);
        sendButton.disabled = false;
        displayChatHistory();
        return;
    }

    if (lowerMessage.includes("how many students") || lowerMessage.includes("students at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`ISD has ${schoolDB.stats.students} students, ranging from ages 2 to 19. It’s a wonderful community!`);
        saveMessageToChat("ai-message", `ISD has ${schoolDB.stats.students} students, ranging from ages 2 to 19. It’s a wonderful community!`);
        sendButton.disabled = false;
        displayChatHistory();
        return;
    }

    if (lowerMessage.includes("sports teams") || lowerMessage.includes("teams at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`ISD offers ${schoolDB.stats.sportsTeams} sports teams for students to join. There’s something for everyone!`);
        saveMessageToChat("ai-message", `ISD offers ${schoolDB.stats.sportsTeams} sports teams for students to join. There’s something for everyone!`);
        sendButton.disabled = false;
        displayChatHistory();
        return;
    }

    if (lowerMessage.includes("library books") || lowerMessage.includes("books at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`The ISD library is well-resourced with over ${schoolDB.stats.libraryBooks} books in 5 different languages. It’s a great place for learning!`);
        saveMessageToChat("ai-message", `The ISD library is well-resourced with over ${schoolDB.stats.libraryBooks} books in 5 different languages. It’s a great place for learning!`);
        sendButton.disabled = false;
        displayChatHistory();
        return;
    }

    if (lowerMessage.includes("how many staff") || lowerMessage.includes("staff at isd")) {
        typingIndicator.style.display = "none";
        typeMessage(`ISD has ${schoolDB.stats.staff} dedicated staff members supporting the school community. They’re amazing!`);
        saveMessageToChat("ai-message", `ISD has ${schoolDB.stats.staff} dedicated staff members supporting the school community. They’re amazing!`);
        sendButton.disabled = false;
        displayChatHistory();
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
        displayChatHistory();
    } catch (error) {
        typingIndicator.style.display = "none";
        appendMessage("ai-message", `I’m so sorry, there was an error: ${error.message}. Let me know how I can assist you further!`);
        saveMessageToChat("ai-message", `I’m so sorry, there was an error: ${error.message}. Let me know how I can assist you further!`);
        sendButton.disabled = false;
        displayChatHistory();
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

function appendFormattedMessage(htmlContent) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message ai-message";
    const span = document.createElement("span");
    span.className = "typing formatted-message";
    span.innerHTML = htmlContent;
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
        chatsDB[chatIndex].lastUpdated = new Date().toISOString();
        localStorage.setItem("chatsDB", JSON.stringify(chatsDB));
    }
}

function loadChatHistory() {
    if (!currentUser || !currentChatId) return;

    const chat = chatsDB.find(chat => chat.chatId === currentChatId);
    if (chat) {
        chatBox.innerHTML = "";
        chat.messages.forEach(msg => {
            if (msg.className.includes("ai-message") && msg.text.includes("<h3>")) {
                appendFormattedMessage(msg.text);
            } else if (msg.className.includes("ai-message")) {
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
// Add to the existing script.js

const newsForm = document.getElementById("newsForm");

if (newsForm) {
    newsForm.addEventListener("submit", handleNewsPost);
}

function handleNewsPost(e) {
    e.preventDefault();
    const title = document.getElementById("newsTitle").value;
    const content = document.getElementById("newsContent").value;
    const image = document.getElementById("newsImage").value;
    const date = document.getElementById("newsDate").value;

    const newsArticle = {
        id: generateUserId(),
        title: title,
        content: content,
        image: image,
        date: date
    };

    newsDB.push(newsArticle);
    localStorage.setItem("newsDB", JSON.stringify(newsDB));
    displayNews();
    adminModal.style.display = "none";
    alert("News article posted successfully!");
}
