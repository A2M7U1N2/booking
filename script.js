// ==================== التهيئة ====================
// 🚀 رابط Pipedream بتاعك (استبدله بالرابط اللي ظهرلك)
const PIPEDREAM_URL = "https://eo95yz9lndrxg30.m.pipedream.net";

// 🔐 لو فعّلت Authentication في Pipedream، اكتب التوكن هنا. لو لا، سيبه null
const BEARER_TOKEN = null; // مثال: "Bearer booking2026"

// ==================== المواعيد المتاحة ====================
let availableSlots = [
    "2026-02-15 10:00 ص",
    "2026-02-15 11:30 ص",
    "2026-02-16 09:00 ص",
    "2026-02-16 02:00 م",
    "2026-02-17 01:00 م",
    "2026-02-18 12:00 م"
];

// ==================== عناصر DOM ====================
const slotSelect = document.getElementById('appointmentSlot');
const form = document.getElementById('bookingForm');
const resultDiv = document.getElementById('resultMessage');

// ==================== دالة عرض المواعيد ====================
function populateSlots() {
    slotSelect.innerHTML = '<option value="">-- اختر موعداً --</option>';
    availableSlots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot;
        option.textContent = slot;
        slotSelect.appendChild(option);
    });
}
populateSlots();

// ==================== دالة عرض الرسائل ====================
function showMessage(text, type) {
    resultDiv.textContent = text;
    resultDiv.className = 'result-message ' + type;
}

// ==================== دالة إرسال البيانات لـ Pipedream ====================
async function sendToGoogleSheet(bookingData) {
    // تجهيز headers
    const headers = {
        'Content-Type': 'application/json'
    };
    if (BEARER_TOKEN) {
        headers['Authorization'] = `Bearer ${BEARER_TOKEN}`;
    }

    try {
        const response = await fetch(PIPEDREAM_URL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                name: bookingData.customerName,
                phone: bookingData.customerPhone,
                email: bookingData.customerEmail,
                date: bookingData.appointmentSlot,
                message: bookingData.message || "لا يوجد"
            })
        });

        if (response.ok) {
            return true;
        } else {
            const errorText = await response.text();
            console.error('Pipedream error:', errorText);
            return false;
        }
    } catch (error) {
        console.error('Network error:', error);
        return false;
    }
}

// ==================== (اختياري) دوال إرسال الإيميل والواتساب ====================
// لو عايز تشغل EmailJS أو UltraMsg، فك التعليق وهات المفاتيح بتاعتك
/*
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";
emailjs.init(EMAILJS_PUBLIC_KEY);

async function sendEmails(bookingData) { ... }

async function sendWhatsAppMessages(bookingData) { ... }
*/

// ==================== معالجة تقديم النموذج ====================
form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الحجز...';

    // جمع البيانات
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail').value.trim();
    const appointmentSlot = document.getElementById('appointmentSlot').value;
    const message = document.getElementById('message').value.trim();

    // التحقق من الحقول
    if (!customerName || !customerPhone || !customerEmail || !appointmentSlot) {
        showMessage('❌ من فضلك املأ جميع الحقول المطلوبة.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'تأكيد الحجز';
        return;
    }

    // التحقق من توفر الموعد
    if (!availableSlots.includes(appointmentSlot)) {
        showMessage('❌ هذا الموعد غير متاح حالياً، اختر موعد آخر.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'تأكيد الحجز';
        populateSlots();
        return;
    }

    // تجهيز بيانات الحجز
    const bookingData = {
        customerName,
        customerPhone,
        customerEmail,
        appointmentSlot,
        message
    };

    try {
        // 1️⃣ إرسال البيانات إلى Google Sheets عبر Pipedream
        const sheetSuccess = await sendToGoogleSheet(bookingData);

        if (!sheetSuccess) {
            throw new Error('فشل في تسجيل البيانات في جدول المواعيد');
        }

        // 2️⃣ (اختياري) إرسال إيميلات وواتساب - فك التعليق لو عايز تشغلها
        // await sendEmails(bookingData);
        // await sendWhatsAppMessages(bookingData);

        // 3️⃣ إزالة الموعد المحجوز من القائمة
        const index = availableSlots.indexOf(appointmentSlot);
        if (index > -1) availableSlots.splice(index, 1);
        populateSlots();

        // 4️⃣ عرض رسالة نجاح
        showMessage('✅ تم حجز موعدك بنجاح! تم تسجيله في النظام.', 'success');

        // 5️⃣ تفريغ الفورم
        form.reset();
    } catch (error) {
        console.error(error);
        showMessage('❌ حدث خطأ أثناء الحجز. حاول مرة أخرى أو تواصل مع الدعم.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'تأكيد الحجز';
    }
});
