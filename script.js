// ==================== التهيئة ====================
// ✅ استبدل بالمفتاح العام الخاص بك من EmailJS
emailjs.init("XF3y39FEOYPY43nuX"); // 👈 ضع Public Key هنا

// ==================== المواعيد المتاحة (مصفوفة ثابتة) ====================
let availableSlots = [
    "2026-02-15 10:00 ص",
    "2026-02-15 11:30 ص",
    "2026-02-16 09:00 ص",
    "2026-02-16 02:00 م",
    "2026-02-17 01:00 م"
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

// ==================== إعدادات EmailJS ====================
// ✅ استبدل SERVICE_ID وأسماء القوالب بما يخصك
const EMAIL_SERVICE_ID = "service_clmzhi8"; // 👈 Service ID من EmailJS
const TEMPLATE_CLIENT = "template_client_confirmation";
const TEMPLATE_PROFESSIONAL = "template_professional_notification";
const TEMPLATE_ADMIN = "template_admin_report";

// ==================== دالة إرسال الإيميلات ====================
function sendEmails(bookingData) {
    // 1️⃣ إيميل الإدمن (شركتك) – يُرسل أولاً كما طلبت
    const adminParams = {
        to_email: "cardvia0@gmail.com",          // 👈 إيميل شركتك
        subject: "✅ تم حجز موعد بنجاح",
        customer_name: bookingData.customerName,
        customer_email: bookingData.customerEmail,
        customer_phone: bookingData.customerPhone,
        appointment_date: bookingData.appointmentSlot,
        message: bookingData.message || "لا يوجد"
    };

    return emailjs.send(EMAIL_SERVICE_ID, TEMPLATE_ADMIN, adminParams)
        .then(() => {
            // 2️⃣ إيميل تأكيد للعميل الحاجز
            const clientParams = {
                to_email: bookingData.customerEmail,
                customer_name: bookingData.customerName,
                appointment_date: bookingData.appointmentSlot,
                message: bookingData.message || "لا يوجد",
                reply_to: "cardvia0@gmail.com"   // 👈 ردود العميل تروح لشركتك
            };
            return emailjs.send(EMAIL_SERVICE_ID, TEMPLATE_CLIENT, clientParams);
        })
        .then(() => {
            // 3️⃣ إيميل إشعار للعميل صاحب الموعد (markatef219@gmail.com)
            const professionalParams = {
                to_email: "markatef219@gmail.com", // 👈 عميلك الأساسي
                customer_name: bookingData.customerName,
                customer_phone: bookingData.customerPhone,
                appointment_date: bookingData.appointmentSlot,
                message: bookingData.message || "لا يوجد"
            };
            return emailjs.send(EMAIL_SERVICE_ID, TEMPLATE_PROFESSIONAL, professionalParams);
        });
}

// ==================== إعدادات UltraMsg للواتساب ====================
// ✅ استبدل Instance ID و Token بمعلومات حسابك
const ULTRA_MSG_INSTANCE = "instance161679"; // 👈 Instance ID
const ULTRA_MSG_TOKEN = "4g9tkm7no8mhp5lt";       // 👈 API Token

// أرقام الواتساب (اكتب الأرقام بدون + أو صفر، مثال: 201234567890)
const PROFESSIONAL_WHATSAPP = "201140567825"; // 👈 رقم واتساب صاحب الموعد (markatef219)
const ADMIN_WHATSAPP      = "201090225298"; // 👈 رقم واتساب شركتك (cardvia0) - غيّره لرقمك الحقيقي

async function sendWhatsApp(phoneNumber, message) {
    const url = `https://api.ultramsg.com/${ULTRA_MSG_INSTANCE}/messages/chat`;
    const payload = {
        token: ULTRA_MSG_TOKEN,
        to: phoneNumber,
        body: message,
        priority: 10,
        referenceId: ""
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (data.sent) {
            console.log(`WhatsApp sent to ${phoneNumber}`);
        } else {
            console.error('WhatsApp error:', data);
        }
    } catch (error) {
        console.error('WhatsApp send failed:', error);
    }
}

async function sendWhatsAppMessages(bookingData) {
    // 1️⃣ رسالة للعميل الحاجز
    const clientMsg = `مرحباً ${bookingData.customerName}،
تم تأكيد موعدك يوم ${bookingData.appointmentSlot}.
شكراً لاستخدامك خدماتنا.`;
    await sendWhatsApp(bookingData.customerPhone, clientMsg);

    // 2️⃣ رسالة لصاحب الموعد (markatef219)
    const professionalMsg = `📌 حجز جديد!
العميل: ${bookingData.customerName}
رقمه: ${bookingData.customerPhone}
موعده: ${bookingData.appointmentSlot}
الرسالة: ${bookingData.message || "لا يوجد"}`;
    await sendWhatsApp(PROFESSIONAL_WHATSAPP, professionalMsg);

    // 3️⃣ رسالة لشركتك (cardvia0) – تأكيد أن العملية تمت
    const adminMsg = `✅ تم حجز موعد بنجاح (تأكيد إضافي واتساب)
العميل: ${bookingData.customerName}
الايميل: ${bookingData.customerEmail}
الرقم: ${bookingData.customerPhone}
الموعد: ${bookingData.appointmentSlot}
الرسالة: ${bookingData.message || "لا يوجد"}`;
    await sendWhatsApp(ADMIN_WHATSAPP, adminMsg);
}

// ==================== دالة عرض الرسائل ====================
function showMessage(text, type) {
    resultDiv.textContent = text;
    resultDiv.className = 'result-message ' + type;
}

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

    const bookingData = {
        customerName,
        customerPhone,
        customerEmail,
        appointmentSlot,
        message
    };

    try {
        // 1. إرسال الإيميلات (أولاً إيميل الإدمن، ثم العميل، ثم صاحب الموعد)
        await sendEmails(bookingData);

        // 2. إرسال رسائل الواتساب (لجميع الأطراف)
        await sendWhatsAppMessages(bookingData);

        // 3. إزالة الموعد المحجوز من القائمة
        const index = availableSlots.indexOf(appointmentSlot);
        if (index > -1) availableSlots.splice(index, 1);
        populateSlots();

        // 4. عرض رسالة نجاح
        showMessage('✅ تم حجز موعدك بنجاح! تم إرسال التأكيد على إيميلك وواتساب.', 'success');

        // 5. تفريغ الفورم
        form.reset();
    } catch (error) {
        console.error(error);
        showMessage('❌ حدث خطأ أثناء الحجز. حاول مرة أخرى أو تواصل مع الدعم.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'تأكيد الحجز';
    }
});
