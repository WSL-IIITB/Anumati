// import React, { useEffect, useState, useContext } from 'react';
// import { usercontext } from '../../usercontext';
// import Cookies from 'js-cookie';
// import './SettingsPage.css';
// import Navbar from '../Navbar/Navbar';

// export default function SettingsPage() {
//     const { curruser, setUser } = useContext(usercontext);

//     console.log(curruser);
//     const [isEditing, setIsEditing] = useState(false);
//     const [newUsername, setNewUsername] = useState(curruser?.username || '');
//     const [password, setPassword] = useState('');
//     const [description, setDescription] = useState(curruser?.description || '');
//     const [errorMessage, setErrorMessage] = useState('');

//     useEffect(() => {
//         if (curruser) {
//             setNewUsername(curruser.username);
//             setDescription(curruser.description);
//         }
//     }, [curruser]);

//     if (!curruser) {
//         return <div>Loading...</div>;
//     }

//     const handleEditToggle = () => {
//         setIsEditing(!isEditing);
//     };

//     const handleSave = async () => {
//         const updatedUser = {
//             username: curruser.username, // Keep current username for reference
//             new_name: newUsername,       // New username
//             new_description: description,
//             new_password: password
//         };

//         console.log("Updated User Data: ", updatedUser);
//         const token = Cookies.get('authToken');
//         fetch('localhost:8000/signup-user/', {
//             method: 'PUT',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Content-Type': 'application/json'
//             },
//             body: JSON.stringify(updatedUser),
//         })
//         .then(response => response.json())
//         .then(data => {
//             if (data.success) {
//                 setUser({ ...curruser, username: newUsername, description: description });
//                 setIsEditing(false);
//                 setErrorMessage('');
//                 alert("Profile updated successfully.");
//             } else {
//                 console.error("Error:", data.error);
//                 setErrorMessage(data.error);
//                 alert(data.error);
//             }
//         })
//         .catch(error => {
//             console.error("Error:", error);
//             setErrorMessage("An error occurred during profile update.");
//             alert("An error occurred during profile update.");
//         });
//     };

//     return (
//         <>
//             <Navbar />
//             <div className="settings-page">
//                 <h1>User Profile</h1>
//                 {errorMessage && <div className="error-message">{errorMessage}</div>}
//                 <div className="profile-info">
//                     <label>Username:</label>
//                     {isEditing ? (
//                         <input
//                             type="text"
//                             value={newUsername}
//                             onChange={(e) => setNewUsername(e.target.value)}
//                         />
//                     ) : (
//                         <p>{curruser.username}</p>
//                     )}
//                 </div>
//                 <div className="profile-info">
//                     <label>Description:</label>
//                     {isEditing ? (
//                         <input
//                             type="text"
//                             value={description}
//                             onChange={(e) => setDescription(e.target.value)}
//                         />
//                     ) : (
//                         <p>{curruser.description}</p>
//                     )}
//                 </div>
//                 {isEditing && (
//                     <div className="profile-info">
//                         <label>Password:</label>
//                         <input
//                             type="password"
//                             value={password}
//                             onChange={(e) => setPassword(e.target.value)}
//                         />
//                     </div>
//                 )}
//                 <div className="profile-actions">
//                     <button onClick={handleEditToggle}>
//                         {isEditing ? 'Cancel' : 'Edit Profile'}
//                     </button>
//                     {isEditing && (
//                         <button onClick={handleSave}>
//                             Save Changes
//                         </button>
//                     )}
//                 </div>
//             </div>
//         </>
//     );
// }
import React, { useEffect, useState, useContext } from 'react';
import { usercontext } from '../../usercontext';
import Cookies from 'js-cookie';
import './SettingsPage.css';
import Navbar from '../Navbar/Navbar';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Using FontAwesome icons
import { frontend_host } from '../../config';
import { Button, Grid, Box } from '@mui/material'
import Sidebar from '../Sidebar/Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

export default function SettingsPage() {
    const { curruser, setUser } = useContext(usercontext);

    console.log(curruser);
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState(curruser?.username || '');
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState(curruser?.description || '');
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState("Home");
    const [openSubmenus, setOpenSubmenus] = useState({
        directory: false,
        settings: false,
    });
const [notifications, setNotifications] = useState([]);

    const capitalizeFirstLetter = (string) => {
        if (!string) return "";
        return string.charAt(0).toUpperCase() + string.slice(1);
    };
    const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
    const toggleSubmenu = (menu) =>
        setOpenSubmenus((prev) => ({
            ...prev,
            [menu]: !prev[menu],
        }));
useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(`${frontend_host}/get-notifications/`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setNotifications(data.notifications || []);
          }
        }
      } catch (error) {
        console.error("Error fetching notifications");
      }
    };

    if (curruser) {
      fetchNotifications();
    }
}, [curruser, isSidebarOpen]);
    useEffect(() => {
        if (curruser) {
            setNewUsername(curruser.username);
            setDescription(curruser.description);
        }
    }, [curruser]);

    if (!curruser) {
        return <div>Loading...</div>;
    }

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleSave = async () => {
        const updatedUser = {
            username: curruser.username, // Keep current username for reference
            new_name: newUsername,       // New username
            new_description: description,
            new_password: password
        };

        console.log("Updated User Data: ", updatedUser);
        const token = Cookies.get('authToken');
        fetch('host/signup-user/'.replace(/host/, frontend_host), {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedUser),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setUser({ ...curruser, username: newUsername, description: description });
                    setIsEditing(false);
                    setErrorMessage('');
                    alert("Profile updated successfully.");
                } else {
                    console.error("Error:", data.error);
                    setErrorMessage(data.error);
                    alert(data.error);
                }
            })
            .catch(error => {
                console.error("Error:", error);
                setErrorMessage("An error occurred during profile update.");
                alert("An error occurred during profile update.");
            });
    };

    const breadcrumbs = (
        <div className="breadcrumbs">
            <a href="/home" className="breadcrumb-item">
                Home
            </a>
            <span className="breadcrumb-separator">▶</span>
            <span className="breadcrumb-item current">User Settings</span>
        </div>
    )

    const content = (
        <>
            <div className="navbarBrands">User Settings</div>
            {/* <div className="navbarBrands">Owner : {capitalizeFirstLetter(curruser.username)} </div> */}
        </>
    );

    return (
        <>
            <div className={`user-greeting-container shadow ${isSidebarOpen ? "d-none" : ""}`}>
               <button
                    className="hamburger-btn me-2 position-relative"
                    onClick={toggleSidebar}
                >
                    <FontAwesomeIcon icon={faBars} />
                    {notifications.some((n) => !n.is_read) && (
                        <span className="notification-dot"></span>
                    )}
                </button>
                <span className="fw-semibold fs-6 text-dark">
                    Hi, {capitalizeFirstLetter(curruser.username)}
                </span>
            </div>

            <Sidebar
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={toggleSidebar}
                activeMenu={activeMenu}
                setActiveMenu={setActiveMenu}
                openSubmenus={openSubmenus}
                toggleSubmenu={toggleSubmenu}
            />
            <div className="locker-header">
                <div className="locker-text">
                    <div className="navbar-content">{content}</div>
                </div>
                <div className="navbar-breadcrumbs">{breadcrumbs}</div>
            </div>
            {/* <Navbar breadcrumbs={breadcrumbs} /> */}
            <Box className="settings-page" style={{ border: "2px solid rgb(107, 120, 231)" }} marginTop={{ xs: "1%", md: "5%" }}>
                <h1>User Profile</h1>
                {errorMessage && <div className="error-message">{errorMessage}</div>}
                <div style={{ alignItems: "center" }}>
                    <div className="profile-info">
                        <label>Username:</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                            />
                        ) : (
                            <p>{curruser.username}</p>
                        )}
                    </div>
                    <div className="profile-info">
                        <label>Description:</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        ) : (
                            <p>{curruser.description}</p>
                        )}
                    </div>
                </div>
                {isEditing && (
                    <div className="profile-info">
                        <label>Password:</label>
                        <div className="password-wrapper">
                            <input
                                type={passwordVisible ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <span
                                className="toggle-password"
                                onClick={() => setPasswordVisible(!passwordVisible)}
                            >
                                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                    </div>
                )}
                <Grid container spacing={1}>
                    <Grid item md={3} xs={10}>
                        <Button fullWidth variant="contained" onClick={handleEditToggle}>
                            {isEditing ? 'Cancel' : 'Edit Profile'}
                        </Button>
                    </Grid>
                    <Grid item md={3} xs={12}></Grid>
                    <Grid item md={3.7} xs={10}>
                        {isEditing && (
                            <Button fullWidth variant="contained" onClick={handleSave}>
                                Save Changes
                            </Button>
                        )}
                    </Grid>
                    <Grid item md={2.3}></Grid>
                </Grid>
            </Box>
        </>
    );
}

