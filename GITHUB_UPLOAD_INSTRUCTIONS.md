# تعليمات رفع المشروع على GitHub

## الخطوة 1: إنشاء مستودع على GitHub

1. اذهب إلى [GitHub.com](https://github.com)
2. انقر على "New repository" أو علامة "+"
3. اختر اسماً للمستودع مثل: `iib-chat-application`
4. اجعل المستودع عاماً (Public) أو خاصاً (Private)
5. **لا تضع علامة على** "Initialize this repository with a README"
6. انقر على "Create repository"

## الخطوة 2: ربط المستودع المحلي بـ GitHub

بعد إنشاء المستودع، قم بتنفيذ هذه الأوامر في PowerShell:

```powershell
# استبدل YOUR_USERNAME بإسم المستخدم الخاص بك
# استبدل YOUR_REPOSITORY_NAME بإسم المستودع الذي أنشأته
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# تغيير اسم الفرع إلى main
git branch -M main

# رفع الكود إلى GitHub
git push -u origin main
```

## مثال:
إذا كان اسم المستخدم `zaid-saad` واسم المستودع `iib-chat-application`:

```powershell
git remote add origin https://github.com/zaid-saad/iib-chat-application.git
git branch -M main
git push -u origin main
```

## الخطوة 3: التحقق من الرفع

بعد تنفيذ الأوامر، اذهب إلى صفحة المستودع على GitHub للتأكد من رفع جميع الملفات.

## ملاحظات مهمة:

- ✅ تم إعداد Git repository محلياً
- ✅ تم عمل commit لجميع الملفات
- ✅ المشروع جاهز للرفع على GitHub
- ✅ تم إنشاء ملف .gitignore شامل
- ✅ تم إنشاء README.md مفصل

## محتويات المشروع المرفوعة:

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + Socket.IO
- **Database**: JSON files (لا يحتاج MongoDB)
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.IO
- **UI**: Tailwind CSS + Arabic/English support
- **Documentation**: شاملة باللغة الإنجليزية

## بعد الرفع على GitHub:

1. يمكن للآخرين استنساخ المشروع بـ:
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
   ```

2. تشغيل المشروع بـ:
   ```powershell
   .\start-app-simple.ps1
   ```

3. الوصول للتطبيق على:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000

## بيانات الدخول الافتراضية:
- **Email**: admin@iibchat.com
- **Password**: admin123 