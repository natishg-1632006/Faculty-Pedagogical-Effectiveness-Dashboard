# 🚀 FPED Dashboard - Quick Start Guide

## Prerequisites
- Node.js v18+ installed
- MongoDB v7.0+ installed and running
- Git (optional)

---

## ⚡ 5-Minute Setup

### Option 1: Automated Setup (Recommended)

**Windows:**
```bash
setup.bat
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

**Step 1: Install Backend**
```bash
cd server
npm install
```

**Step 2: Install Frontend**
```bash
cd ../client
npm install
```

**Step 3: Seed Database**
```bash
cd ../server
npm run seed
```

---

## 🎮 Running the Application

### Terminal 1 - Backend
```bash
cd server
npm run dev
```
✅ Backend running on http://localhost:5000

### Terminal 2 - Frontend
```bash
cd client
npm run dev
```
✅ Frontend running on http://localhost:5173

---

## 🔑 Login Credentials

### Admin Account
```
Email: admin@fped.com
Password: Admin@123
```

### HOD Accounts
```
Computer Science HOD:
Email: hod.cs@fped.com
Password: Welcome@123

Electrical Engineering HOD:
Email: hod.ee@fped.com
Password: Welcome@123
```

### Faculty Accounts
```
Faculty 1:
Email: michael.brown@fped.com
Password: Welcome@123

Faculty 2:
Email: emily.davis@fped.com
Password: Welcome@123

Faculty 3:
Email: robert.wilson@fped.com
Password: Welcome@123
```

---

## 🎯 What to Test

### As Admin:
1. ✅ Login with admin credentials
2. ✅ Navigate to User Management
3. ✅ Create a new Faculty user
4. ✅ Create a new HOD user
5. ✅ Go to Department Management
6. ✅ Create a new department
7. ✅ Assign HOD to department
8. ✅ Go to Course Management
9. ✅ Create a new course
10. ✅ Assign faculty to course
11. ✅ View system statistics
12. ✅ Check audit logs
13. ✅ Toggle dark mode
14. ✅ Test user activation/deactivation
15. ✅ Reset a user's password

### As HOD:
1. ✅ Login with HOD credentials
2. ✅ View department dashboard
3. ✅ Check faculty ranking leaderboard
4. ✅ Identify low performers
5. ✅ View performance charts
6. ✅ Compare faculty performance
7. ✅ Toggle dark mode

### As Faculty:
1. ✅ Login with faculty credentials
2. ✅ View personal dashboard
3. ✅ Check overall performance score
4. ✅ Compare with department average
5. ✅ View subject-wise performance
6. ✅ Check semester trends
7. ✅ View radar chart
8. ✅ Read feedback comments
9. ✅ View improvement suggestions
10. ✅ Toggle dark mode

---

## 🎨 UI Features to Explore

- 🌓 **Dark Mode**: Click moon/sun icon in header
- 📱 **Responsive**: Resize browser to see mobile/tablet views
- 🎭 **Animations**: Watch smooth transitions on page changes
- 📊 **Charts**: Hover over charts for interactive tooltips
- 🔔 **Notifications**: Check notification bell (top right)
- 🎯 **Glassmorphism**: Notice the glass effect on cards
- 🌈 **Gradients**: See gradient backgrounds and buttons
- 📂 **Sidebar**: Click menu icon to collapse/expand sidebar

---

## 🐛 Troubleshooting

### MongoDB Not Running
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Port Already in Use

**Backend (5000):**
Edit `server/.env`:
```
PORT=5001
```

**Frontend (5173):**
Edit `client/vite.config.js`:
```javascript
server: { port: 5174 }
```

### Cannot Connect to Backend
1. Check if backend is running
2. Verify `http://localhost:5000` is accessible
3. Check CORS settings in `server/server.js`
4. Verify `.env` file exists in server folder

### Seed Data Not Loading
```bash
cd server
npm run seed
```

### Dependencies Not Installing
```bash
# Clear cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## 📁 Project Structure Quick Reference

```
FPED-final/
├── server/          # Backend (Port 5000)
│   ├── controllers/ # Business logic
│   ├── models/      # Database schemas
│   ├── routes/      # API endpoints
│   └── server.js    # Entry point
│
└── client/          # Frontend (Port 5173)
    ├── src/
    │   ├── pages/   # Page components
    │   ├── context/ # State management
    │   └── services/# API calls
    └── index.html
```

---

## 🔗 Important URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **MongoDB**: mongodb://localhost:27017

---

## 📚 Documentation

- **Full README**: `README.md`
- **API Docs**: `API_DOCUMENTATION.md`
- **Database Schema**: `ER_DIAGRAM.md`
- **Project Summary**: `PROJECT_SUMMARY.md`
- **Feature List**: `FEATURE_CHECKLIST.md`

---

## 🎓 Learning Path

1. **Day 1**: Setup and explore Admin features
2. **Day 2**: Test HOD dashboard and rankings
3. **Day 3**: Explore Faculty performance views
4. **Day 4**: Understand API endpoints
5. **Day 5**: Study database schema
6. **Day 6**: Customize UI/UX
7. **Day 7**: Deploy to production

---

## 💡 Pro Tips

1. **Use Dark Mode**: Easier on the eyes for long sessions
2. **Seed Multiple Times**: Run seed script to reset data
3. **Check Console**: Open browser DevTools for debugging
4. **Test Responsive**: Use browser DevTools device toolbar
5. **Read Logs**: Check terminal for backend logs
6. **Explore Charts**: Hover and click on chart elements
7. **Try All Roles**: Login as Admin, HOD, and Faculty

---

## 🚀 Next Steps

1. ✅ Complete setup
2. ✅ Test all features
3. ✅ Customize branding
4. ✅ Add more sample data
5. ✅ Configure email settings
6. ✅ Deploy to production
7. ✅ Share with team

---

## 📞 Need Help?

1. Check documentation files
2. Review error messages in console
3. Verify all dependencies installed
4. Ensure MongoDB is running
5. Check environment variables
6. Review API_DOCUMENTATION.md

---

## ✨ Features Highlights

- ✅ **200+ Features** implemented
- ✅ **30+ API Endpoints** ready
- ✅ **7 Database Models** configured
- ✅ **8 Pages** with full functionality
- ✅ **Dark Mode** support
- ✅ **Responsive Design** for all devices
- ✅ **Real-time** notifications ready
- ✅ **PDF/CSV** export capability
- ✅ **Docker** support included

---

## 🎉 You're Ready!

Open http://localhost:5173 and start exploring!

**Happy Coding! 🚀**
