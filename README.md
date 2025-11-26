# Anumati Project
## Ownership & Information Flow Primitives for DPIs 

Anumati Project is a reference implementation of Digital Public Infrastructure (DPI) primitives enabling legitimate, governed, transparent, and purpose-bound data sharing.  
It provides a Locker-based architecture, Connection Types, Terms, and X-Node Structure for Maintaing the Flow Control for Transfer of Ownership

---

## 📁 Updated Project Structure
```
Anumati-Project/
│
├── Backend/
│   ├── api/
│   ├── media/
│   ├── mysite/
│   ├── static/
│   ├── templates/
│   ├── .gitignore
│   ├── Connection Type.png
│   ├── Data.data
│   ├── db.sqlite3
│   ├── manage.py
│   ├── README.md
│   └── requirements_backend.txt
│
└── Frontend/
    ├── frontendUpdated/
    ├── node_modules/
    ├── package.json
    └── package-lock.json
```

---

## ✨ Core Features

### **1. User Management**
#### **Sign Up**
**Endpoint:** `/signup-user` (form-data)  
Example:
- username: iiitb  
- description: Deemed University  
- password: iiitb

#### **Login**
**Endpoint:** `/login-user` (form-data)

---

### **2. Locker Management**
Users can create multiple lockers.  
Lockers organize user resources (documents, files, certificates).

**API:** `/create-locker`  
Example form-data:
```
name: Education
description: Education records locker
```

---

### **3. Resource Sharing via Connections**
Connections link two lockers (host ↔ guest).

**API:** `/create-new-connection`  
Example form-data:
```
connection_name: Connection No.1
connection_type_name: MTech 2024 Admissions
guest_username: Rohith
guest_lockername: Education
host_username: iiitb
host_lockername: Admissions
```

---

### **4. Connection Types**
Define:
- Obligations  
- Permissions  
- Rules  
- Validity  
- Purpose of sharing  

**API:** `/create-connection-type-and-terms`  
Example JSON:
```json
{
  "connectionName": "Alumni Networks",
  "connectionDescription": "Connection type for alumni communication.",
  "lockerName": "Transcripts",
  "obligations": [{
      "labelName": "Graduation Batch",
      "typeOfAction": "Add Value",
      "typeOfSharing": "Share",
      "labelDescription": "Mandatory to enter graduation batch",
      "hostPermissions": ["Re-share", "Download"]
  }],
  "permissions": {
      "canShareMoreData": true,
      "canDownloadData": false
  },
  "validity": "2024-12-31"
}
```

---

### **5. Admin Functions**
- Freeze lockers  
- Manage global connections  
- Control connection types and terms  

---

## 🚀 Running the Project

---

# **Backend Setup (Django)**

### **1. Navigate to Backend folder**
```bash
cd Backend
```

### **2. Install Python dependencies**
```bash
pip install -r requirements_backend.txt
```

### **3. Make and apply migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

### **4. Start backend server**
```bash
python manage.py runserver
```

Backend runs at:  
👉 http://127.0.0.1:8000/

---

# **Frontend Setup (React)**

### **1. Navigate to Frontend folder**
```bash
cd Frontend
```

### **2. Install Node dependencies**
```bash
npm install
```

### **3. Start React development server**
```bash
npm start
# OR
npm run dev
```

Frontend runs at:  
👉 http://localhost:3000/

---

## 📘 Workflow Overview

### **Step 1 — Create Connection Type**
Defines:
- Purpose  
- Terms  
- Obligations  
- Permissions  
- Validity  

### **Step 2 — Create Lockers**
Users create lockers to store their documents/resources.

### **Step 3 — Create Connection**
Connect host ↔ guest lockers using a connection type.

### **Step 4 — Enforce Terms**
System enforces:
- Obligations  
- Permissions  
- Validity rules  
- Sharing restrictions  

---

## 📜 Project Goals
- Standardized primitives for legitimate data sharing  
- User-controlled data governance  
- Transparent & auditable access  
- DPI-aligned design (similar to UPI but for data)  
- Scalable for cross-border consented sharing  

---

## 🛠 Tech Stack

### **Backend**
- Python  
- Django 5.x  
- Django REST Framework  
- SQLite  

### **Frontend**
- React  
- Node.js  
- HTML/CSS/JS  

---

## 📄 License
This project is developed as part of **IIIT-B DPI Research Initiative** and follows academic open-source guidelines.

---

