import React, { useState, useEffect, useContext } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import './ManageUsers.css';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import Modal from '../Modal/Modal';
import { frontend_host } from '../../config';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

export default function ManageUsers({ role }) {  // Role can be 'moderator' or 'admin'
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRoleUser, setSelectedRoleUser] = useState(null);
  const navigate = useNavigate();
  const { curruser } = useContext(usercontext);
  const [error, setError] = useState(null);
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [locker, setLocker] = useState(null); // Added placeholder state for locker
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("My Lockers"); // Default active menu, might need adjustment
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  const [notifications, setNotifications] = useState([]);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
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
    // Redirect if user is not logged in or doesn't have appropriate role (optional, depending on your auth logic)
    if (!curruser) {
      navigate('/');
      return;
    }

    // Potentially add role check here if only specific roles can access this page
    // if (curruser.user_type !== 'sys_admin' && curruser.user_type !== 'moderator') {
    //   navigate('/unauthorized'); // or redirect elsewhere
    //   return;
    // }


    const token = Cookies.get('authToken');

    fetch('host/dpi-directory/'.replace(/host/, frontend_host), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => {
        if (!response.ok) {
          // Handle non-200 responses
          return response.json().then(err => { throw new Error(err.message || 'Failed to fetch users') });
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          console.log("manage users data:", data); // Added log for data structure
          // Ensure data.users is an array before setting state
          if (Array.isArray(data.users)) {
            setUsers(data.users);
          } else {
            setError("Unexpected data format for users.");
            console.error("API returned non-array users data:", data);
          }
        } else {
          setError(data.message || data.error || "Failed to fetch users.");
        }
      })
      .catch(error => {
        setError(`An error occurred while fetching users: ${error.message}`);
        console.error("Error fetching users:", error);
      });
  }, [curruser, navigate]); // Added navigate to dependency array

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
    // Optional: Refetch users after a successful role change if needed
    // window.location.reload();
  };

  const handleRoleChange = (action) => {
    const user = action === 'make' ? selectedUser : selectedRoleUser;

    if (!user) {
      setModalMessage({ message: `Please select a user to ${action === 'make' ? 'make' : 'remove'} as ${role}.`, type: 'failure' });
      setIsModalOpen(true);
      return;
    }

    //if we are making default user as admin/moderator(action = make), admin/moderator(stored in role) would be the newUserType
    //if we are removing an admin/moderator(action = remove), we would be making them as a user(newUserType)
    const newUserType = action === 'make' ? role : 'user';
    const typeOfAction = action === "make" ? "create-" : "remove-";
    // Use the lowercase role for the URL segment
    const typeOfRole = (role === "sys_admin" || role === "system_admin") ? "admin/" : "moderator/";
    const token = Cookies.get('authToken');

    const url = `host/${typeOfAction}${typeOfRole}`.replace(/host/, frontend_host);
    console.log("Role change URL:", url);
    console.log("Sending payload:", { username: user.username });

    fetch(url, {
      method: 'PUT', // Or 'POST' depending on your backend API design
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: user.username,
        // Note: user_type might not be needed in the payload if the endpoint is role-specific (e.g., /create-admin/)
      }),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(err => { throw new Error(err.message || `Failed to ${action} user role`) });
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          // Update the user list state
          setUsers(users.map(u => u.user_id === user.user_id ? { ...u, user_type: newUserType } : u));

          // Clear the selected user/role user dropdown
          if (action === 'make') {
            setSelectedUser(null); // Reset select element implicitly by state change
          } else {
            setSelectedRoleUser(null); // Reset select element implicitly by state change
          }

          setModalMessage({ message: data.message || `User "${user.username}" ${action}d as ${role}.`, type: 'success' });
        } else {
          setModalMessage({ message: data.message || data.error || `Failed to ${action} user role.`, type: 'failure' });
        }
        setIsModalOpen(true);
      })
      .catch(error => {
        console.error(`Error during ${action} role change:`, error);
        setModalMessage({ message: `An error occurred while ${action}ing the user role: ${error.message}`, type: 'failure' });
        setIsModalOpen(true);
      });
  };

  const value = (role === 'sys_admin' || role === "system_admin") ? "System Admin" : role.charAt(0).toUpperCase() + role.slice(1);

  // Filter users for dropdowns - ensure roles match backend strings ('user', 'moderator', 'sys_admin')
  const usersWithoutRole = users.filter(user => user.user_type === 'user');
  const usersWithRole = users.filter(user => user.user_type === role);


  return (
    <div className='content'>
      {/* <Navbar /> */} {/* Navbar might be placed outside this component depending on layout */}
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
        lockerObj={locker} // Pass the locker state
        locker_on={false} // Set to false if locker features are not relevant on this page
      />
      <div style={{ marginTop: '120px' }}> {/* Adjust margin based on Navbar height if present */}
        <h2>Manage {value}s</h2>

        {/* Add Role Section */}
        <div className='add'>
          <label>Add {value}</label>
          {/* Ensure the value in option matches the user object's username */}
          <select onChange={(e) => setSelectedUser(users.find(user => user.username === e.target.value))} value={selectedUser?.username || ''}>
            <option value="">Select User</option>
            {usersWithoutRole.map(user => (
              <option key={user.user_id} value={user.username}>
                {user.username.charAt(0).toUpperCase() + user.username.slice(1)} {/* Display capitalized username */}
              </option>
            ))}
          </select>
          <button onClick={() => handleRoleChange('make')} disabled={!selectedUser}>Make as {value}</button>
        </div>

        {/* Remove Role Section */}
        <div className="remove">
          <label>Remove {value}</label>
          {/* Ensure the value in option matches the user object's username */}
          <select onChange={(e) => setSelectedRoleUser(usersWithRole.find(user => user.username === e.target.value))} value={selectedRoleUser?.username || ''}>
            <option value="">Select {value}</option>
            {usersWithRole.map(user => (
              <option key={user.user_id} value={user.username}>
                {user.username.charAt(0).toUpperCase() + user.username.slice(1)} {/* Display capitalized username */}
              </option>
            ))}
          </select>
          <button onClick={() => handleRoleChange('remove')} disabled={!selectedRoleUser}>Remove as {value}</button>
        </div>

        {/* Error message display replaced by Modal */}
        {/* {error && <p className="error">{error}</p>} */}

        {/* Modal for messages */}
        {isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}
      </div>
    </div>
  );
};