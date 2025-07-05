# إعداد قاعدة البيانات - MongoDB

## 🚀 **خيارات إعداد قاعدة البيانات**

لديك خياران لإعداد قاعدة البيانات:

### الخيار 1: MongoDB Atlas (cloud) - **الأسهل والموصى به** ⭐

#### المميزات:
- ✅ لا يحتاج تثبيت على جهازك
- ✅ مجاني حتى 512MB
- ✅ آمن ومضمون
- ✅ سهل الإعداد

#### خطوات الإعداد:

1. **إنشاء حساب MongoDB Atlas**:
   - اذهب إلى: https://cloud.mongodb.com/
   - اضغط "Try Free"
   - أنشئ حساب جديد

2. **إنشاء Cluster**:
   - اختر "Build a Database"
   - اختر "FREE" (M0 Sandbox)
   - اختر أقرب منطقة (مثل Frankfurt)
   - اضغط "Create Cluster"

3. **إعداد المستخدم**:
   - اختر "Database Access" من القائمة الجانبية
   - اضغط "Add New Database User"
   - ضع username: `chatuser`
   - ضع password قوية (احفظها!)
   - اختر "Read and write to any database"

4. **إعداد الوصول**:
   - اختر "Network Access"
   - اضغط "Add IP Address"
   - اختر "Allow Access from Anywhere" (0.0.0.0/0)

5. **الحصول على Connection String**:
   - ارجع لـ "Clusters"
   - اضغط "Connect" بجانب cluster
   - اختر "Connect your application"
   - انسخ الـ connection string
   - مثال: `mongodb+srv://chatuser:<password>@cluster0.xxxxx.mongodb.net/`

6. **تحديث الخادم**:
   ```bash
   # في مجلد server، عدل ملف index.js
   # غير السطر:
   const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp';
   
   # إلى:
   const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://chatuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/chatapp';
   ```

---

### الخيار 2: تثبيت MongoDB محلياً

#### مطلوب للمتقدمين فقط:

1. **تحميل MongoDB Community**:
   - Windows: https://www.mongodb.com/try/download/community
   - اختر Windows x64
   - حمل وثبت

2. **تشغيل MongoDB**:
   ```bash
   # بعد التثبيت، شغل:
   mongod
   ```

3. **التحقق من التشغيل**:
   - افتح terminal جديد
   ```bash
   mongo
   # يجب أن تشاهد MongoDB shell
   ```

---

## 🔧 **اختبار الاتصال**

بعد إعداد قاعدة البيانات، اختبر الاتصال:

1. **شغل الخادم**:
   ```bash
   cd server
   npm run dev
   # أو
   npm start
   ```

2. **تحقق من الرسائل**:
   - يجب أن تشاهد: `Connected to MongoDB`
   - يجب أن تشاهد: `✅ تم إنشاء مستخدم أدمن افتراضي`

---

## 🚨 **استكشاف الأخطاء**

### خطأ الاتصال بقاعدة البيانات:

```
MongoDB connection error: MongoNetworkError
```

**الحلول**:
1. تأكد من صحة connection string
2. تأكد من صحة username/password
3. تأكد من إعداد Network Access في Atlas

### خطأ المصادقة:

```
Authentication failed
```

**الحلول**:
1. تحقق من كلمة مرور المستخدم
2. تحقق من صلاحيات المستخدم

---

## 🎯 **نصائح مهمة**

1. **لـ Atlas**: احفظ كلمة المرور في مكان آمن
2. **للإنتاج**: استخدم متغيرات البيئة لحفظ connection string
3. **النسخ الاحتياطي**: Atlas يعمل نسخ احتياطي تلقائي
4. **المراقبة**: يمكنك مراقبة قاعدة البيانات من لوحة Atlas

---

## ✅ **التحقق من نجاح الإعداد**

عند تشغيل الخادم بنجاح، يجب أن تشاهد:

```
🚀 Server running on port 3000
Connected to MongoDB
✅ تم إنشاء مستخدم أدمن افتراضي: iibadmin@iib.com / iibiibiib
```

**إذا شاهدت هذه الرسائل، فقاعدة البيانات جاهزة! 🎉**

---

## 🔄 **الخطوة التالية**

بعد إعداد قاعدة البيانات بنجاح، يمكنك:

1. تشغيل الخادم: `cd server && npm start`
2. تشغيل الفرونت إند: `npm run dev`
3. فتح التطبيق: http://localhost:5173
4. تسجيل الدخول بحساب الأدمن: `iibadmin@iib.com` / `iibiibiib`

**بالتوفيق! 🚀** 