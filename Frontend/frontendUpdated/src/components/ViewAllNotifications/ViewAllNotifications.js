import { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { frontend_host } from "../../config";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import './ViewAllNotifications.css';
import Sidebar from "../Sidebar/Sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Menu, MenuItem, IconButton } from '@mui/material';

const ViewAllNotifications = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [lockers, setLockers] = useState([]);
  const { curruser } = useContext(usercontext);
  const [notifications, setNotifications] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const open = Boolean(anchorEl);
  // const [notifications, setNotifications] = useState([]);

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
    const fetchLockers = async () => {
      try {
        const token = Cookies.get('authToken');
        const response = await fetch('host/get-lockers-user/'.replace(/host/, frontend_host), {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch lockers');
          return;
        }

        const data = await response.json();
        if (data.success) {
          setLockers(data.lockers || []);
        } else {
          setError(data.message || data.error);
        }
      } catch (error) {
        setError("An error occurred while fetching lockers.");
      }
    };

    if (curruser) {
      fetchLockers();
      fetchNotifications();
    }
  }, [curruser]);

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const fetchNotifications = async () => {
    try {
      const token = Cookies.get('authToken');
      const response = await fetch('host/get-notifications/'.replace(/host/, frontend_host), {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch notifications');
        return;
      }
      const data = await response.json();
      console.log("data", data)
      if (data.success) {
        setNotifications(data.notifications || []);
        console.log("................")
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching notifications.");
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const token = Cookies.get("authToken");
      const data = {
        notification_id: id,
      };
      const response = await fetch(`${frontend_host}/mark-notification-read/`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))

        );
        // fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };
  useEffect(() => {
    console.log("Notifications updated:", notifications);
  }, [notifications]);

  const handleNotificationClick = (notification, index) => {
    setSelectedNotification(notification);
    if (!notification.is_read) {
      markNotificationAsRead(notification.id);
    }
  };

  const handleMenuOpen = (event, notification) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notification);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const handleMarkAsRead = (notifications) => {
    markNotificationAsRead(notifications.id);
    handleMenuClose();
  };

  const handleMarkAsUnread = () => {
    console.log("Marked as Unread:", selectedNotification);
    handleMenuClose();
  };

  const handleDelete = () => {
    console.log("Deleted:", selectedNotification);
    handleMenuClose();
  };

  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  //user desrciption on top right
  const content = (
    <>
      <div className="navbarBrands">
        {curruser ? capitalizeFirstLetter(curruser.username) : "None"}
      </div>
      <div>
        {curruser ? curruser.description : "None"}
      </div>
      {/* <Typography> {curruser ? curruser.description : "None"}</Typography> */}

    </>
  );

  // keep on every page
  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">View All Notifications</span>
    </div>
  )
  // 

  return (
    <div>
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

      {/* make changes here */}
      <div className="notification-page">
        <div className="notification-header2">
          <h2>All Notifications</h2>
          <div className="notification-controls">
            <div className="notification-tabs">
              <button className="tab active">All</button>
              <button className="tab">Unread</button>
            </div>
            <input
              type="text"
              placeholder="Search notifications"
              className="notification-search"
            />

          </div>
        </div>
        <div className="outer-box-notif">
          <div className="notification-body">
            {notifications.length === 0 ? (
              <div className="empty-state">

                <h3>All caught up!</h3>

              </div>
            ) : (

              notifications.map((notif, index) => (

                <div key={index} className={`all-notification-card ${notif.is_read ? 'read' : ''}`}
                  onClick={() => handleNotificationClick(notif)}>
                  {/* <div className="notification-title">{notif.notification_type}</div> */}
                  <div className="notification-card-left">
                    <div className="notification-message">{notif.message}</div>
                    <div className="date-and-time">
                      {new Date(notif.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="notification-card-right">
                    {/* icon */}
                    <IconButton onClick={(e) => handleMenuOpen(e, notif)}>
                      <MoreVertIcon />
                    </IconButton>


                  </div>

                </div>
              ))
            )}
          </div>
        </div>
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem >Mark as Read</MenuItem>
          <MenuItem onClick={handleMarkAsUnread}>Mark as Unread</MenuItem>
          <MenuItem onClick={handleDelete}>Delete</MenuItem>
        </Menu>

      </div>

    </div>
  )
}

export default ViewAllNotifications