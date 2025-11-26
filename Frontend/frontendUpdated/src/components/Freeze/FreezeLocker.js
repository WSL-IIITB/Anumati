import React, { useState, useContext, useEffect } from "react";
import Modal from '../Modal/Modal.jsx';
import { usercontext } from '../../usercontext';
import { frontend_host } from "../../config.js";
import Cookies from 'js-cookie';
import Navbar from "../Navbar/Navbar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from "../Sidebar/Sidebar.js";
export const FreezeLocker = () => {
    const [lockerName, setLockerName] = useState("");
    const [users, setUsers] = useState([]);
    const [userLockers, setUserLockers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [freezeMode, setFreezeMode] = useState(true); // Toggle state
    const { curruser } = useContext(usercontext);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [activeMenu, setActiveMenu] = useState("Home");
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
        const token = Cookies.get('authToken');
        fetch('host/dpi-directory/'.replace(/host/, frontend_host), {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log("dpi ", data);
                    setUsers(data.users);
                } else {
                    setError(data.message || data.error);
                }
            })
            .catch(error => {
                setError("An error occurred while fetching users.");
                console.error("Error:", error);
            });

    }, []);

    const fetchLockers = async () => {
        if (!selectedUser) return;
        const token = Cookies.get('authToken');
        const params = new URLSearchParams({ username: selectedUser.username });

        try {
            const response = await fetch(`host/get-lockers-user/?${params}`.replace(/host/, frontend_host), {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch lockers');
                console.error('Error fetching lockers:', errorData);
                return;
            }

            const data = await response.json();
            if (data.success) {
                setUserLockers(data.lockers.filter(locker => locker.is_frozen === !freezeMode));
            } else {
                setError(data.message || data.error);
            }
        } catch (error) {
            setError("An error occurred while fetching this user's lockers.");
            console.error("Error:", error);
        }
    };

    useEffect(() => {
        if (selectedUser) {
            fetchLockers();
        }
    }, [selectedUser, freezeMode]);

    const handleFreezeLocker = async () => {
        if (!lockerName) {
            setModalMessage({ message: 'Please enter a locker name', type: 'info' });
            setIsModalOpen(true);
            return;
        }

        const action = freezeMode ? 'freeze' : 'unfreeze'; // Determine action based on toggle
        console.log("action in free", action);

        setIsLoading((prevState) => ({ ...prevState, locker: true }));

        const token = Cookies.get('authToken');

        try {
            const response = await fetch("host/freeze-unfreeze-locker/".replace(/host/, frontend_host), {
                method: "PUT",
                body: JSON.stringify({ locker_name: lockerName, username: selectedUser.username, action }),
                headers: {
                    'Authorization': `Basic ${token}`,
                    "Content-Type": "application/json",
                },
            });
            const data = await response.json();
            if (response.ok) {
                setModalMessage({ message: data.message || 'Locker freeze request successful', type: 'success' });
                //to clear input fields
                setLockerName("");
                setSelectedUser(null);
                //fetching updated list of lockers and connections
                await fetchLockers();
            } else {
                setModalMessage({ message: data.error || data.message || 'Locker freeze request failed', type: 'failure' });
            }
            setIsModalOpen(true);
        } catch (error) {
            console.log('er', error);
            setModalMessage({ message: `Error while performing ${action}`, type: 'failure' });
            setIsModalOpen(true);
        } finally {
            setIsLoading((prevState) => ({ ...prevState, locker: false }));
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setModalMessage({ message: "", type: "" });
    };
    const toggleFreezeMode = () => {
        // setIsFreezing(prev => !prev);
        setFreezeMode(prev => !prev);
        setLockerName("");
        setSelectedUser(null);
    };

    const content = (
        <>
            <div className="navbarBrands">Freeze Locker</div>
        </>
    );

    const breadcrumbs = (
        <div className="breadcrumbs mt-2">
            <a href="/home" className="breadcrumb-item">
                Home
            </a>
            <span className="breadcrumb-separator">▶</span>
            <span className="breadcrumb-item current">Freeze Locker</span>
        </div>
    )

    const code = (
        <>
            {/* <Navbar breadcrumbs={breadcrumbs} /> */}
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
            <div className="container" style={{ marginTop: "12px" }}>
                <div className="row justify-content-center p-4">
                    <div className="col-md-6 col-sm-12 col-xs-12 p-4 border border-primary rounded shadow">
                        <button onClick={toggleFreezeMode}>
                            {freezeMode ? 'Switch to Unfreeze' : 'Switch to Freeze'}
                        </button>
                        <div className="row justify-content-center mt-4">
                            <div className="col-md-8 col-sm-12 col-xs-12 p-4 border border-primary rounded shadow">

                                <h2 className="m-4" style={{ textAlign: "center" }}>{freezeMode ? "Freeze Locker" : "Unfreeze Locker"}</h2>

                                <div className="mb-3">
                                    <label className="form-label fw-bold">Select Username</label>
                                    <select
                                        className="form-select"
                                        onChange={(e) => {
                                            const selected = users.find(user => user.username === e.target.value);
                                            setSelectedUser(selected);
                                        }}
                                        value={selectedUser ? selectedUser.username : ""}
                                    >
                                        <option value="">Select a user</option>
                                        {users.map(user => (
                                            <option key={user.user_id} value={user.username}>
                                                {user.username}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Select Locker Name</label>
                                    <select
                                        className="form-select"
                                        onChange={(e) => setLockerName(e.target.value)}
                                        value={lockerName}
                                    >
                                        <option value="">Select a locker</option>
                                        {userLockers.map(locker => (
                                            <option key={locker.locker_id} value={locker.name}>
                                                {locker.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <button onClick={handleFreezeLocker} disabled={isLoading.locker}>
                                    {isLoading.locker ? (freezeMode ? "Freezing Locker..." : "Unfreezing Locker...") : (freezeMode ? "Freeze Locker" : "Unfreeze Locker")}
                                </button>
                            </div>
                        </div>


                    </div>

                </div>
                {isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}
            </div>
        </>
    );

    return (
        <>

            {((curruser.user_type === 'sys_admin' || curruser.user_type === 'system_admin') && (curruser.user_type !== 'moderator')) &&
                <div >{code}
                    {/* <Sidebar /> */}
                </div>}

            {curruser.user_type === 'moderator' && <>{code}</>}

        </>
    );
}
