const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/chatapp');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['manager', 'employee'], default: 'employee' },
  avatar: String,
  status: { type: String, enum: ['online', 'offline', 'away', 'busy'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  isApproved: { type: Boolean, default: false },
  registeredAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function fixAdminAccount() {
  try {
    console.log('🔍 البحث عن حساب الأدمن...');
    
    // البحث عن حساب الأدمن
    let admin = await User.findOne({ email: 'iibadmin@iib.com' });
    
    if (admin) {
      console.log('✅ تم العثور على حساب الأدمن');
      console.log('📊 حالة الحساب:', {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        isApproved: admin.isApproved,
        status: admin.status
      });
      
      // إصلاح حالة الحساب
      admin.role = 'manager';
      admin.isApproved = true;
      admin.status = 'online';
      
      await admin.save();
      console.log('✅ تم إصلاح حساب الأدمن بنجاح!');
    } else {
      console.log('❌ لم يتم العثور على حساب الأدمن، سيتم إنشاؤه...');
      
      const hashedPassword = await bcrypt.hash('iibiibiib', 10);
      const newAdmin = new User({
        name: 'IIB Admin',
        email: 'iibadmin@iib.com',
        password: hashedPassword,
        role: 'manager',
        avatar: '',
        status: 'online',
        isApproved: true
      });
      
      await newAdmin.save();
      console.log('✅ تم إنشاء حساب أدمن جديد بنجاح!');
    }
    
    // التحقق النهائي
    const verifyAdmin = await User.findOne({ email: 'iibadmin@iib.com' });
    console.log('🔧 التحقق النهائي:', {
      exists: !!verifyAdmin,
      isManager: verifyAdmin?.role === 'manager',
      isApproved: verifyAdmin?.isApproved,
      canLogin: verifyAdmin?.isApproved && verifyAdmin?.role === 'manager'
    });
    
    console.log('\n🎉 حساب الأدمن جاهز للاستخدام:');
    console.log('   Email: iibadmin@iib.com');
    console.log('   Password: iibiibiib');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    mongoose.connection.close();
  }
}

fixAdminAccount(); 