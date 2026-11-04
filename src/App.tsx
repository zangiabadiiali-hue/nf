import { useState, useEffect, useRef } from 'react';
// @ts-ignore
import initSqlJs from 'sql.js';

interface Personnel {
  id: number;
  first_name: string;
  last_name: string;
  national_code: string;
  phone: string;
  address: string;
  birth_date: string;
  job_title: string;
  photo: string;
  created_at: string;
}

type SqlJsDatabase = any;

function App() {
  const [db, setDb] = useState<SqlJsDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [showForm, setShowForm] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [photoPreview, setPhotoPreview] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize SQLite database
  useEffect(() => {
    const initDB = async () => {
      try {
        const SQL = await initSqlJs({
          locateFile: (file: string) => `https://sql.js.org/dist/${file}`
        });

        // Try to load existing database from localStorage
        const savedDb = localStorage.getItem('personnel_db');
        let database: SqlJsDatabase;

        if (savedDb) {
          const buf = Uint8Array.from(atob(savedDb), c => c.charCodeAt(0));
          database = new SQL.Database(buf);
        } else {
          database = new SQL.Database();
        }

        // Create table if not exists
        database.run(`
          CREATE TABLE IF NOT EXISTS personnel (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            national_code TEXT UNIQUE NOT NULL,
            phone TEXT,
            address TEXT,
            birth_date TEXT,
            job_title TEXT,
            photo TEXT,
            created_at TEXT DEFAULT (datetime('now', 'localtime'))
          )
        `);

        setDb(database);
        loadPersonnel(database);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing database:', error);
        setLoading(false);
      }
    };

    initDB();
  }, []);

  const saveDb = (database: SqlJsDatabase) => {
    const data = database.export();
    const buffer = btoa(String.fromCharCode(...data));
    localStorage.setItem('personnel_db', buffer);
  };

  const loadPersonnel = (database: SqlJsDatabase) => {
    const results = database.exec('SELECT * FROM personnel ORDER BY created_at DESC');
    if (results.length > 0) {
      const columns = results[0].columns;
      const values = results[0].values;
      const personnel: Personnel[] = values.map((row: any) => {
        const obj: any = {};
        columns.forEach((col: any, idx: any) => {
          obj[col] = row[idx];
        });
        return obj as Personnel;
      });
      setPersonnelList(personnel);
    } else {
      setPersonnelList([]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('حجم عکس نباید بیشتر از 2 مگابایت باشد');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPhoto(base64);
        setPhotoPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setNationalCode('');
    setPhone('');
    setAddress('');
    setBirthDate('');
    setJobTitle('');
    setPhoto('');
    setPhotoPreview('');
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) return;

    if (!firstName || !lastName || !nationalCode) {
      alert('لطفاً فیلدهای اجباری (نام، نام خانوادگی و کد ملی) را پر کنید');
      return;
    }

    try {
      if (editingId) {
        // Update existing record
        db.run(
          `UPDATE personnel SET first_name=?, last_name=?, national_code=?, phone=?, address=?, birth_date=?, job_title=?, photo=? WHERE id=?`,
          [firstName, lastName, nationalCode, phone, address, birthDate, jobTitle, photo, editingId]
        );
      } else {
        // Insert new record
        db.run(
          `INSERT INTO personnel (first_name, last_name, national_code, phone, address, birth_date, job_title, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [firstName, lastName, nationalCode, phone, address, birthDate, jobTitle, photo]
        );
      }

      saveDb(db);
      loadPersonnel(db);
      resetForm();
      alert(editingId ? 'اطلاعات پرسنل با موفقیت ویرایش شد' : 'پرسنل جدید با موفقیت ثبت شد');
    } catch (error: any) {
      if (error.message && error.message.includes('UNIQUE')) {
        alert('این کد ملی قبلاً ثبت شده است');
      } else {
        alert('خطا در ذخیره اطلاعات: ' + error.message);
      }
    }
  };

  const handleEdit = (person: Personnel) => {
    setFirstName(person.first_name);
    setLastName(person.last_name);
    setNationalCode(person.national_code);
    setPhone(person.phone || '');
    setAddress(person.address || '');
    setBirthDate(person.birth_date || '');
    setJobTitle(person.job_title || '');
    setPhoto(person.photo || '');
    setPhotoPreview(person.photo || '');
    setEditingId(person.id);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (!db) return;
    if (confirm('آیا از حذف این پرسنل اطمینان دارید؟')) {
      db.run('DELETE FROM personnel WHERE id=?', [id]);
      saveDb(db);
      loadPersonnel(db);
    }
  };

  const filteredPersonnel = personnelList.filter(p =>
    p.first_name.includes(searchTerm) ||
    p.last_name.includes(searchTerm) ||
    p.national_code.includes(searchTerm) ||
    p.job_title?.includes(searchTerm) ||
    (p.first_name + ' ' + p.last_name).includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-indigo-900">
        <div className="text-white text-xl">
          <i className="fas fa-spinner fa-spin ml-2"></i>
          در حال بارگذاری پایگاه داده...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-gradient-to-l from-blue-700 to-indigo-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-3 rounded-xl">
              <i className="fas fa-users-cog text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">سامانه ثبت نام پرسنل</h1>
              <p className="text-blue-200 text-sm">مدیریت اطلاعات کارکنان</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-green-400/20 text-green-200 px-3 py-1 rounded-full text-sm">
              <i className="fas fa-database ml-1"></i>
              SQLite
            </span>
            <span className="bg-blue-400/20 text-blue-200 px-3 py-1 rounded-full text-sm">
              {personnelList.length} پرسنل
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Toggle Button */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowForm(true)}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              showForm
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
            }`}
          >
            <i className="fas fa-plus-circle ml-2"></i>
            {editingId ? 'ویرایش پرسنل' : 'ثبت پرسنل جدید'}
          </button>
          <button
            onClick={() => { setShowForm(false); resetForm(); }}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
              !showForm
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow'
            }`}
          >
            <i className="fas fa-list ml-2"></i>
            لیست پرسنل
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <i className="fas fa-user-edit text-blue-600"></i>
              {editingId ? 'ویرایش اطلاعات پرسنل' : 'فرم ثبت نام پرسنل جدید'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Photo Upload */}
                <div className="lg:col-span-1 flex flex-col items-center justify-center">
                  <label className="text-sm font-medium text-gray-700 mb-2">عکس پرسنلی</label>
                  <div
                    className="w-40 h-48 rounded-xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all overflow-hidden relative group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="عکس پرسنلی" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <i className="fas fa-camera text-3xl text-blue-400 mb-2"></i>
                        <span className="text-xs text-gray-500 text-center px-2">انتخاب عکس</span>
                      </>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <i className="fas fa-edit text-white text-xl"></i>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => { setPhoto(''); setPhotoPreview(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                    className="mt-2 text-xs text-red-500 hover:text-red-700"
                  >
                    <i className="fas fa-trash-alt ml-1"></i>
                    حذف عکس
                  </button>
                </div>

                {/* Form Fields */}
                <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نام <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="نام"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نام خانوادگی <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="نام خانوادگی"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      کد ملی <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={nationalCode}
                      onChange={(e) => setNationalCode(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="کد ملی ۱۰ رقمی"
                      maxLength={10}
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      شماره تلفن
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      تاریخ تولد
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      سمت شغلی
                    </label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="مثلاً: مهندس نرم‌افزار"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      آدرس
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                      rows={2}
                      placeholder="آدرس محل سکونت"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-600/30 font-medium"
                >
                  <i className="fas fa-save ml-2"></i>
                  {editingId ? 'ذخیره تغییرات' : 'ثبت پرسنل'}
                </button>
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowForm(false); }}
                  className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                >
                  <i className="fas fa-times ml-2"></i>
                  انصراف
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Personnel List */}
        {!showForm && (
          <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <i className="fas fa-address-book text-blue-600"></i>
                لیست پرسنل ثبت شده
              </h2>
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="جستجو..."
                />
                <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
              </div>
            </div>

            {filteredPersonnel.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-users text-5xl text-gray-300 mb-4"></i>
                <p className="text-gray-500 text-lg">
                  {searchTerm ? 'نتیجه‌ای یافت نشد' : 'هنوز پرسنلی ثبت نشده است'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPersonnel.map((person) => (
                  <div
                    key={person.id}
                    className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all hover:border-blue-200 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-20 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
                        {person.photo ? (
                          <img src={person.photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <i className="fas fa-user text-gray-400 text-xl"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 truncate">
                          {person.first_name} {person.last_name}
                        </h3>
                        {person.job_title && (
                          <p className="text-sm text-blue-600 truncate">
                            <i className="fas fa-briefcase ml-1"></i>
                            {person.job_title}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1" dir="ltr">
                          <i className="fas fa-id-card ml-1"></i>
                          {person.national_code}
                        </p>
                        {person.phone && (
                          <p className="text-xs text-gray-500" dir="ltr">
                            <i className="fas fa-phone ml-1"></i>
                            {person.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {person.address && (
                      <p className="text-xs text-gray-500 mt-2 truncate">
                        <i className="fas fa-map-marker-alt ml-1"></i>
                        {person.address}
                      </p>
                    )}
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleEdit(person)}
                        className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                      >
                        <i className="fas fa-edit ml-1"></i>
                        ویرایش
                      </button>
                      <button
                        onClick={() => handleDelete(person.id)}
                        className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-sm font-medium"
                      >
                        <i className="fas fa-trash ml-1"></i>
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 text-center py-4 mt-8">
        <p className="text-sm">
          <i className="fas fa-database ml-1"></i>
          پایگاه داده SQLite | تمامی اطلاعات به صورت محلی ذخیره می‌شود
        </p>
      </footer>
    </div>
  );
}

export default App;
