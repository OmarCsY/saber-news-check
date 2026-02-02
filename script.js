document.addEventListener('DOMContentLoaded', () => {
    
    // --- تعريف العناصر ---
    const screens = {
        home: document.getElementById('home-screen'),
        loading: document.getElementById('loading-screen'),
        result: document.getElementById('result-screen'),
        saved: document.getElementById('saved-screen')
    };

    const newsInput = document.getElementById('newsInput');
    const charCount = document.getElementById('charCount');
    const verifyBtn = document.getElementById('verifyBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const micBtn = document.getElementById('micBtn');
    
    // عناصر النتيجة
    const resultHeader = document.getElementById('resultHeader');
    const resultIcon = document.getElementById('resultIcon');
    const resultIconCircle = document.getElementById('resultIconCircle');
    const resultTitle = document.getElementById('resultTitle');
    const resultDesc = document.getElementById('resultDesc');
    const resultScore = document.getElementById('resultScore');
    const resultBar = document.getElementById('resultBar');
    const resultContent = document.getElementById('resultContent');
    const warningCard = document.getElementById('warningCard');
    const recommendationText = document.getElementById('recommendationText');
    const resultSources = document.getElementById('resultSources');
    const saveBtn = document.getElementById('saveBtn');

    // عناصر التنقل
    const navItems = {
        home: document.getElementById('navHome'),
        saved: document.getElementById('navSaved'),
        profile: document.getElementById('navProfile')
    };

    let currentResultData = null;
    const API_URL = "https://tahaqquq.app.n8n.cloud/webhook/8b6bb407-f82d-44d9-8e2d-98879f489005";

    // --- 1. منطق عداد الأحرف ---
    newsInput.addEventListener('input', function() {
        const maxLength = 5000;
        let currentLength = this.value.length;

        if (currentLength > maxLength) {
            this.value = this.value.substring(0, maxLength);
            currentLength = maxLength;
        }

        charCount.innerText = `${currentLength} / ${maxLength}`;

        if (currentLength >= 4900) {
            charCount.classList.add('limit-reached');
        } else {
            charCount.classList.remove('limit-reached');
        }
    });

    // --- 2. منطق زر اللصق ---
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            newsInput.value = text;
            newsInput.dispatchEvent(new Event('input'));
        } catch (err) {
            console.error('فشل اللصق:', err);
            alert('يرجى السماح بالوصول للحافظة للصق النص.');
        }
    });

    // --- 3. التنقل بين الشاشات ---
    function showScreen(screenName) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        if(screens[screenName]) screens[screenName].classList.add('active');
        document.querySelector('.app-container').scrollTop = 0;
        updateBottomNav(screenName);
    }

    function updateBottomNav(activeScreen) {
        Object.values(navItems).forEach(item => item.classList.remove('active'));
        
        if (activeScreen === 'home' || activeScreen === 'result' || activeScreen === 'loading') {
            navItems.home.classList.add('active');
        } else if (activeScreen === 'saved') {
            navItems.saved.classList.add('active');
        } else if (activeScreen === 'profile') {
            navItems.profile.classList.add('active');
        }
    }

    navItems.home.addEventListener('click', () => showScreen('home'));
    navItems.saved.addEventListener('click', () => {
        renderSavedItems();
        showScreen('saved');
    });

    document.getElementById('cancelBtn').addEventListener('click', () => showScreen('home'));
    document.querySelectorAll('.new-search-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            newsInput.value = "";
            newsInput.dispatchEvent(new Event('input'));
            showScreen('home');
        });
    });

    // --- 4. منطق التحقق (API) ---
    verifyBtn.addEventListener('click', async () => {
        const text = newsInput.value.trim();
        if (!text) return alert("الرجاء إدخال نص الخبر");

        showScreen('loading');

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text })
            });

            const data = await response.json();
            let result = data.full_result || data;
            if (typeof result === "string") {
                try { result = JSON.parse(result); } catch(e) {}
            }

            console.log("Result:", result);
            currentResultData = { ...result, inputText: text, timestamp: new Date().toISOString() };
            displayResult(result);

        } catch (error) {
            console.error("Error:", error);
            alert("حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.");
            showScreen('home');
        }
    });

    // --- 5. عرض النتائج ---
    function displayResult(result) {
        const color = (result.color_hex || "#95a5a6").toLowerCase();
        
        resultHeader.style.backgroundColor = color + "15";
        resultIconCircle.style.backgroundColor = color + "30";
        resultIconCircle.style.color = color;
        resultTitle.style.color = color;
        
        let iconClass = "fa-check";
        if (result.status_code === 'verified') iconClass = "fa-check";
        else if (result.status_code === 'outdated') iconClass = "fa-history";
        else if (result.status_code === 'misleading' || result.status_code === 'rumor') iconClass = "fa-xmark";
        else iconClass = "fa-question";
        
        resultIcon.className = `fa-solid ${iconClass}`;
        
        resultTitle.innerText = result.status_title || "نتيجة الفحص";
        resultDesc.innerText = getStatusDescription(result.status_code);

        const score = result.confidence_score || 0;
        resultScore.innerText = score + "%";
        resultScore.style.color = color;
        resultBar.style.width = score + "%";
        resultBar.style.backgroundColor = color;

        resultContent.innerText = result.explanation_text || "لا يتوفر شرح إضافي.";

        if (result.recommendation_text) {
            warningCard.style.display = 'block';
            recommendationText.innerText = result.recommendation_text;
            warningCard.style.backgroundColor = color + "10";
            warningCard.style.borderColor = color + "40";
            warningCard.querySelector('.warning-title').style.color = color;
            recommendationText.style.color = color;
        } else {
            warningCard.style.display = 'none';
        }

        resultSources.innerHTML = "";
        if (result.source_name && result.source_url) {
            resultSources.innerHTML = `
                <div class="source-item">
                    <div class="source-info">
                        <h5>${result.source_name}</h5>
                        <a href="${result.source_url}" target="_blank">زيارة المصدر</a>
                    </div>
                    <a href="${result.source_url}" target="_blank" style="color:${color}">
                        <i class="fa-solid fa-arrow-up-right-from-square"></i>
                    </a>
                </div>
            `;
        } else {
            resultSources.innerHTML = `<p style="font-size:12px; color:#aaa; text-align:center">لم يتم العثور على مصادر مباشرة.</p>`;
        }

        saveBtn.innerText = "حفظ النتيجة";
        saveBtn.style.background = color;
        saveBtn.disabled = false;

        showScreen('result');
    }

    function getStatusDescription(code) {
        if (code === 'verified') return "المعلومات مؤكدة وتتطابق مع المصادر الرسمية.";
        if (code === 'misleading') return "المعلومات مضللة أو تعتمد على سياق خاطئ.";
        if (code === 'outdated') return "الخبر صحيح ولكنه قديم (أرشيف).";
        if (code === 'rumor') return "إشاعة لا أساس لها من الصحة.";
        return "لم يتم العثور على تأكيدات كافية.";
    }

    // --- 6. نظام الحفظ ---
    saveBtn.addEventListener('click', () => {
        if (!currentResultData) return;
        let savedItems = JSON.parse(localStorage.getItem('saberSavedNews')) || [];
        savedItems.unshift(currentResultData);
        localStorage.setItem('saberSavedNews', JSON.stringify(savedItems));
        saveBtn.innerText = "تم الحفظ بنجاح ✓";
        saveBtn.disabled = true;
    });

    window.renderSavedItems = function() {
        const listContainer = document.getElementById('savedList');
        const savedItems = JSON.parse(localStorage.getItem('saberSavedNews')) || [];

        listContainer.innerHTML = "";

        if (savedItems.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-bookmark"></i>
                    <p>لا توجد أخبار محفوظة حالياً</p>
                </div>`;
            return;
        }

        savedItems.forEach((item, index) => {
            const date = new Date(item.timestamp).toLocaleDateString('ar-SA');
            const color = item.color_hex || "#ccc";
            const card = document.createElement('div');
            card.className = "saved-card";
            card.style.borderRightColor = color;
            card.innerHTML = `
                <div class="saved-meta">
                    <span>${date}</span>
                    <span style="color:${color}">${item.status_title}</span>
                </div>
                <div class="saved-topic">${item.inputText.substring(0, 80)}${item.inputText.length > 80 ? '...' : ''}</div>
                <div class="saved-result-text" style="color:${color}">${item.explanation_text ? item.explanation_text.substring(0, 60) + '...' : ''}</div>
                <button class="delete-btn" onclick="deleteItem(${index})"><i class="fa-regular fa-trash-can"></i> حذف</button>
            `;
            listContainer.appendChild(card);
        });
    };

    window.deleteItem = function(index) {
        if(!confirm("هل أنت متأكد من حذف هذا الخبر؟")) return;
        let savedItems = JSON.parse(localStorage.getItem('saberSavedNews')) || [];
        savedItems.splice(index, 1);
        localStorage.setItem('saberSavedNews', JSON.stringify(savedItems));
        renderSavedItems();
    };

    // --- 7. ميزة التحدث الصوتي الذكي (Speech to Text) ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'ar-SA';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            micBtn.classList.add('recording');
            micBtn.innerHTML = '<i class="fa-solid fa-microphone-lines"></i> جاري الاستماع...';
            newsInput.placeholder = "تحدث الآن...";
        };

        recognition.onend = () => {
            micBtn.classList.remove('recording');
            micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> تحدث';
            newsInput.placeholder = "ألصق الخبر هنا للتحقق...";
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            
            newsInput.value = transcript;
            newsInput.dispatchEvent(new Event('input'));

            // إرسال تلقائي إذا تم التقاط نص
            if (transcript.trim().length > 0) {
                setTimeout(() => {
                    verifyBtn.click();
                }, 500);
            }
        };

        micBtn.addEventListener('click', () => {
            if (micBtn.classList.contains('recording')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        micBtn.style.display = 'none';
        console.log("Web Speech API not supported in this browser.");
    }

});