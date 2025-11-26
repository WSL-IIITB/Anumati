# IUDX- POLICY BASED CONSENT SERVICE ARCHITECTURE

Managing data sharing in compliance with regulations and obtaining consent from data owners can be complex.  To address this, we are developing a web application specifically designed to streamline the consent management process, ensuring that data sharing is both open-ended and compliant.​

## Features
#### Creating account-SignUp/Login
Sign Up to create to new account.

/signup-user

Use form-data:
    
    username: iiitb,

    description: Deemed University,
    
    password: iiitb.

/login-user

Use form-data:
    
    username: iiitb,
    
    password: iiitb.


#### User Functionality
- Locker Creation: Users can create lockers to upload and organise resources.
- Resource Sharing: Share resources with others through connections.

#### Administrative Functions
- Freezing Lockers: System administrators and moderators can freeze lockers.
- Global Connections: System administrators can create global connections.

#### Locker Management
- Resource Organization: Lockers serve as primary storage for user content.
- Collaborative Management: Connections between lockers enable collaborative sharing and resource management.
  
/create-locker- creates new locker 

Use form-data:
    
    name: Education,
    
    description: This locker consists of Education records.

Eg: Education locker which hold the education documents

#### Connections
- User Connections: Establish links between users through connections.
- Locker Connections: Connections link the lockers of different users.

/create-new-connection-creates a new connection.


Use form-data:
    
    connection_name: Connection No.1,
    
    connection_type_name: MTech 2024 Admissions,
    
    guest_username: Rohith,
    
    guest_lockername: Education,
    
    host_username: iiitb,
    
    host_lockername: Admissions.
    
#### Connection Types
- Diverse Interactions: Define various connection types (e.g., BTech, MTech, staff admissions) with specific attributes and rules.
- Categorization: Helps categorise and manage connections based on purpose and requirements.

/create-connection-type-and-terms-creates a new connection type

Use raw-json:

    {
        "connectionName": "Alumni Networks",
        "connectionDescription": "Connection type that establishes communication between alumni.",
        "lockerName": "Transcripts",
        "obligations":
        [{
            "labelName": "Graduation Batch",
            "typeOfAction": "Add Value",
            "typeOfSharing": "Share",
            "labelDescription": "It is obligatory to submit your graduation batch in order to accept the terms of this connection",
            "hostPermissions": ["Re-share", "Download"]
        }],
        "permissions":
        {
            "canShareMoreData": true,
            "canDownloadData": false
        },
        "validity": "2024-12-31"
    }

Eg:Mtech 2024 Admission-contains details for Mtech 2024 Admissions

#### Connection Terms
- Customizable Terms: Define terms for connection types, specifying rules and conditions.
- Governance and Control: Tailor connections to specific needs, ensuring proper governance over shared resources.

/create-connection-type-and-terms-create new connection terms

Use raw-json:

    {
        "connectionName": "Alumni Networks",
        "connectionDescription": "Connection type that establishes communication between alumni.",
        "lockerName": "Transcripts",
        "obligations":
        [{
            "labelName": "Graduation Batch",
            "typeOfAction": "Add Value",
            "typeOfSharing": "Share",
            "labelDescription": "It is obligatory to submit your graduation batch in order to accept the terms of this connection",
            "hostPermissions": ["Re-share", "Download"]
        }],
        "permissions":
        {
            "canShareMoreData": true,
            "canDownloadData": false
        },
        "validity": "2024-12-31"
    }

## Work Flow
![Connection Type (1)](https://github.com/user-attachments/assets/8466c8cb-9d82-4df7-ba9f-6891f34777b2)



## Prerequisites
- Python 3.x
- Django 5.0.6
- Django REST framework
- Django REST framework authtoken
- SQLite (or another database, if configured)
- Node.js and npm (for the frontend)

## Steps to Run

### Backend Setup

1. #### Clone the repository:
   git clone https://github.com/WSL-IIITB/DPI-Primitive.git <br>
   cd DPI-Primitive/
   
2. #### Check out the ‘backend’ branch:
   git checkout backend
   
3. #### Install dependencies:
   pip install -r requirements.txt
   
4. #### Make Migrations:
   python manage.py makemigrations
   
5. #### Run the Development Server:
   python manage.py runserver

### Frontend Setup

1. #### Return to project root directory:
   cd ..

2. #### Check out the ‘frontend’ branch:
   git checkout frontend
   
3. #### Install Dependencies:
   npm  install
   
4. #### Start the Development Server:
   npm start (or) npm run dev
   


