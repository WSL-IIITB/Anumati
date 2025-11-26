import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./page6.css";
import "../Home/page1.css";
import Cookies from "js-cookie";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
import { Button } from '@mui/material'
import Sidebar from "../Sidebar/Sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

export const TargetUserView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state ? location.state.user : null;
  const [allLockers, setLockers] = useState([]);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const { curruser, setUser } = useContext(usercontext);
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
    if (!curruser) {
      navigate('/');
      return;
    }
  }, []);

  const handleNewLockerClick = () => {
    navigate('/create-locker');
  };


  const handleLockersClick = (lockers) => {
    navigate('/target-locker-view', { state: { locker: lockers, user: user } });
  }

  useEffect(() => {
    const fetchLockers = async () => {
      try {
        const token = Cookies.get('authToken');
        const params = new URLSearchParams({ username: user ? user.username : '' });

        console.log('Fetching lockers with token:', token);
        console.log('Fetching lockers with params:', params.toString());
        console.log('User object:', user);

        const response = await fetch(`host/get-lockers-user/?${params}`.replace(/host/, frontend_host), {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch lockers');
          console.error('Error fetching lockers:', errorData);
          return;
        }

        const data = await response.json();
        console.log('Response data:', data);

        if (data.success) {
          setLockers(data.lockers || []);
        } else {
          setError(data.message || data.error);
        }
      } catch (error) {
        setError("An error occurred while fetching this user's lockers.");
        console.error("Error:", error);
      }
    };

    if (user) {
      fetchLockers();
    }
  }, [user]);

  const content = (
    <>
      <div className="navbarBrands">{user ? user.username.charAt(0).toUpperCase() + user.username.slice(1) : 'None'}</div>
      <div>{user ? user.description : 'None'}</div>
    </>
  );

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <a className="breadcrumb-item" href="/dpi-directory">User Directory</a>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">TargetUserView</span>
    </div>
  )

  return (
    <div id="targetUserView">
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
      {/* <Navbar content={content} breadcrumbs={breadcrumbs}/> */}

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "120px" }}>
        <div className="heroContainers">
          <div className="page6-allLockers" style={{ border: "none" }}>
            {error && <div className="error">{error}</div>}
            {Array.isArray(allLockers) && allLockers.length > 0 ? (
              allLockers.map(lockers => (
                <div key={lockers.locker_id} className="page6-locker" style={{ borderRadius: "5px" }}>
                  <h4>{lockers.name}</h4>

                  {lockers.is_frozen === false && <Button id="docsBtn" className="subbutton" style={{ padding: "6px 8px" }} variant="contained" onClick={() => handleLockersClick(lockers)}>
                    Open
                  </Button>}
                  {lockers.is_frozen === true && <Button id="docsBtn" className="subbutton" style={{ padding: "6px 8px" }} variant="contained">Frozen</Button>}

                  <p className="description2">{lockers.description}</p>
                </div>
              ))
            ) : (
              <p style={{ marginTop: "1.30rem" }}>No lockers found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
