import React, { useContext, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faArrowLeft,
  faArrowRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';

// import {
//   Bell,
//   Home as HomeIcon,
//   FolderClosed as Folder,
//   Lock,
//   LayoutGrid,
//   Settings,
//   User,
//   LogOut,
//   ArrowLeft,
// } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";
import Cookies from "js-cookie";
import { frontend_host } from "../../config";
import { usercontext } from "../../usercontext";
import { Link } from "react-router-dom";
import { TextField } from "@mui/material";
// const frontend_host = "http://your-backend-api.com"; // Replace with actual host

const Sidebar = ({
  isSidebarOpen,
  toggleSidebar,
  activeMenu,
  setActiveMenu,
  openSubmenus,
  toggleSubmenu,
  lockerObj = null,
  locker_on = false
}) => {
  const navigate = useNavigate();
  const { curruser, setUser } = useContext(usercontext);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const notificationsRef = useRef(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [hoveredNotificationId, setHoveredNotificationId] = useState(null);
  const [revertRejectReason, setRevertRejectReason ] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [revertXnode, setRevertXnode] = useState();
  const handleLogout = () => {
    Cookies.remove("authToken");
    localStorage.removeItem("curruser");
    console.log("Logged out");
    navigate("/");
    window.location.reload();
    setUser(null);
  };


  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleNavigate = (menuName, path) => {
    setActiveMenu(menuName);
    navigate(path);
  };

  const handleLockerAdminNavigate = () => {
    if (lockerObj) {
      navigate(`/admin`, { state: lockerObj });
    }
  };

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

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch notifications");
        return;
      }

      const data = await response.json();
      if (data.success) {
        console.log(data);
        setNotifications(data.notifications || []);
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching notifications.");
    }
  };

  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    setIsNotificationsOpen(false);
    markNotificationAsRead(notification.id);
  };


  const closePopup = () => {
    setSelectedNotification(null);
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
  // --- NEW useEffect to fetch notifications on component mount ---
  useEffect(() => {
    if (curruser) {
      fetchNotifications();
    } else {
      console.error("fetchNotifications function is not available!");
    }
  }, [curruser]);


  const toggleNotifications = async () => {
    setIsNotificationsOpen((prev) => !prev);
    if (!isNotificationsOpen) {
      await fetchNotifications();
    }
  };

  const handleRevertRejectClick = (xnodeId) => {
    setShowRejectModal(true);
    setRevertXnode(xnodeId);
  }

  const handleReject = async () => {
    const xnodeId = revertXnode;
    const reject_reason = revertRejectReason;
    if (!reject_reason || reject_reason.trim() === "") {
      alert("Reason is required to reject the revert request");
      return;
    }

    try {
       const token = Cookies.get("authToken");
 
       const response = await fetch(`${frontend_host}/reject_revert_consent/`, {
         method: "POST",
         headers: {
           Authorization: `Basic ${token}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           xnode_id: xnodeId,
           revert_reject_reason: revertRejectReason.trim(),
         }),
       });
 
       const data = await response.json();
 
       if (data.success) {
          alert(data.message)      
          setSelectedNotification(null);
          setRevertXnode();
          setRevertRejectReason("");
          setShowRejectModal(false);
 
       } else {
        alert(data.message || "Revert failed");
       }
     } catch (error) {
       alert("An error occurred while reverting consent.");
     } finally {
      //  setLoadingResourceId(null);
     }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setIsNotificationsOpen(false);
      }
    };

    if (isNotificationsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationsOpen]);

  const linkStyle = {
    color: '#0d6efd',        // Bootstrap primary blue
    textDecoration: 'none',  // Remove underline
    fontWeight: '600',
    cursor: 'pointer',
  };

  const handleSenderUserClick = (user) => {
    navigate('/target-user-view', { state: { user } });
  };
  const handleReceiverLockerClick = (locker, user) => {
    navigate('/view-locker', { state: { locker: locker, user: user } });
  };

  const handleHostConnectionClick = (connection, connectionType) => {
    console.log("navigate", connection, connectionType);
    if (connection.connection_status == "established" || connection.connection_status == "live") {
      navigate("/guest-terms-review", { state: { connection, connectionType } });
    } else {
      alert("Connection has been " + connection.connection_status + ". You cannot navigate further.");
    }
  };

  const handleRejectConnectionClick = (extraData) => {
    console.log("extraData", extraData);
    if (extraData.connection_info.connection_status == "established" || extraData.connection_info.connection_status == "live") {
      if (extraData?.rejector_role === "Guest") {
        navigate('/guest-terms-review', { state: { connection: extraData.connection_info, connectionType: extraData.connection_type } });
      } else if (extraData?.rejector_role === "Host") {
        navigate('/host-terms-review', { state: { connection: extraData.connection_info, connectionType: extraData.connection_type } });
      }
    } else {
      alert("Connection has been " + extraData.connection_info.connection_status + ". You cannot navigate further.");
    }
  }
  // Sender user click
  const SenderUserLink = ({ user }) => (
    <span style={linkStyle} onClick={() => handleSenderUserClick(user)}>
      {user.username}
    </span>
  );

  // Reject user click
  const RejectUserLink = ({ extraData }) => (
    <>
      {extraData.rejector_role === "Guest" ? (
        <span style={linkStyle} onClick={() => handleSenderUserClick(extraData.guest_user)}>
          {extraData.guest_user.username}
        </span>
      ) : (
        <span style={linkStyle} onClick={() => handleSenderUserClick(extraData.host_user)}>
          {extraData.host_user.username}
        </span>
      )}
    </>
  );

  // Receiver locker click
  const ReveiverLockerLink = ({ locker, user }) => (
    <span style={linkStyle} onClick={() => handleReceiverLockerClick(locker, user)}>
      {locker.name}
    </span>
  );

  // Host connection click

  const HostConnectionLink = ({ connection, connectionType }) => (
    <span style={linkStyle} onClick={() => handleHostConnectionClick(connection, connectionType)}>
      {connection?.connection_type_name}
    </span>
  )

  const RejectConnectionLink = ({ extraData }) => (
    <span style={linkStyle} onClick={() => handleRejectConnectionClick(extraData)}>
      {extraData?.connection_type?.connection_type_name}
    </span>
  )


  const renderNotificationMessage = (notification) => {
    const { notification_type, extra_data } = notification;

    switch (notification_type) {
      case 'connection_created':
        return (
          <>
            <p>
              <SenderUserLink user={extra_data.guest_user} /> has connected to the connection type {" "}
              <HostConnectionLink connection={extra_data.connection_info} connectionType={extra_data.connection_type} /> associated with Locker{' '}
              <ReveiverLockerLink locker={extra_data.host_locker} user={extra_data.host_user} />.
            </p>
            <small>{new Date(selectedNotification.created_at).toLocaleString()}</small>
          </>
        );

      case 'resource_rejected':
        return (
          <p>
            {extra_data?.rejector_role} <RejectUserLink extraData={extra_data} /> has rejected the resource '{extra_data.resource_name}' from the connection <RejectConnectionLink extraData={extra_data} />.<br />
            Reason: {extra_data?.rejection_reason}
          </p>
        );

      case 'resource_deleted':
        return (
          <>
            <p>{notification.message}</p>
            <small>{new Date(selectedNotification.created_at).toLocaleString()}</small>
          </>
        );
      case 'revert_approval_pending':
        return (
          <>
            {/* <p className="text-center">{notification.message}</p> */}
            <p> 
              User '<SenderUserLink user={extra_data.user_details} />' has requested to withdraw the collateral provided for the consent '{extra_data.resource_name}'. Please review and approve or reject the request. <br />
            Reason: {extra_data?.revert_reason}
            </p>
            <small>{new Date(selectedNotification.created_at).toLocaleString()}</small>

            <div
              className="d-flex flex-wrap justify-content-center align-items-center gap-2 mt-3"
              style={{ minWidth: "220px" }}
            >
              <button
                className="btn btn-sm btn-success"
                style={{ minWidth: "80px", padding: "4px 10px" }}
                onClick={() => handleRevertClick(notification.extra_data.xnode_id)}
              >
                <i className="bi bi-check2-circle"></i> Approve
              </button>
              <button
                className="btn btn-sm btn-danger"
                style={{ minWidth: "80px", padding: "4px 10px" }}
                onClick={() => handleRevertRejectClick(notification.extra_data.xnode_id)}
              >
                <i className="bi bi-x-circle"></i> Reject
              </button>
            </div>

          </>


        );

      case 'revert_approved_or_rejected':
        return (
          <>
            <p> 
              User '<SenderUserLink user={extra_data.user_details} />' has requested to withdraw the collateral provided for the consent '{extra_data.resource_name}'. Please review and approve or reject the request. <br />
              Reason: {extra_data?.revert_reason}
            </p>
            <small>{new Date(selectedNotification.created_at).toLocaleString()}</small>
          </>
        );

      case 'revert_rejected':
        return (
          <>
            <p>
               User '<SenderUserLink user={extra_data.user_details} />' has rejected the request to revert the collateral consent for '{extra_data.resource_name}'.<br />
               Reason: {extra_data?.revert_reject_reason}
            </p>
          </>
        )  
      default:
        return (
        <>
          <p>{notification.message}</p>
          <small>{new Date(selectedNotification.created_at).toLocaleString()}</small>
        </>
        )
    }
  };
 const handleRevertClick = async (xnodeId) => {
     console.log("Revert clicked for xnodeId:", xnodeId);
    //  const revert_reason = prompt("Enter reason for reverting consent:");
    //  if (!revert_reason) return;
 
    //  setLoadingResourceId(xnodeId);
    //  setMessage("");
 
     try {
       const token = Cookies.get("authToken");
 
       const response = await fetch(`${frontend_host}/revert-consent/`, {
         method: "POST",
         headers: {
           Authorization: `Basic ${token}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           xnode_id: xnodeId,
          //  revert_reason: revert_reason.trim(),
         }),
       });
 
       const data = await response.json();
 
       if (data.success) {
          alert(data.message)      
          setSelectedNotification(null);
 
       } else {
        alert(data.message || "Revert failed");
       }
     } catch (error) {
       alert("An error occurred while reverting consent.");
     } finally {
      //  setLoadingResourceId(null);
     }
   };
  return (
    <div className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="user-info">
          <h2 className="sidebar-title">
            {capitalizeFirstLetter(curruser?.username)}
          </h2>
          <p className="sidebar-subtitle">
            {typeof curruser?.description === "string" ? curruser.description : "Invalid description"}
          </p>
        </div>
        <div className="notification-container" ref={notificationsRef}>
          <button className="notification-btn" onClick={toggleNotifications}>
            <FontAwesomeIcon icon={faBell} style={{ fontSize: "20px" }} />
            {notifications.some((n) => !n.is_read) && (
              <span className="notification-badge">
                {notifications.filter((n) => !n.is_read).length}
              </span>
            )}
          </button>
          {isNotificationsOpen && (
            <div className="notification-modal right">
              <div className="header-div">
                <h4>Notifications</h4>
                <Link to="/view-all-notifications" className="view-all-btn">
                  View All
                </Link>
              </div>
              <hr style={{ border: "none", margin: "10px 0", borderTop: "2px solid #ccc" }}></hr>
              {/* {error && <p className="error">{error}</p>} */}
              {notifications.length > 0 ? (
                <div className="notification-list">
                  {notifications.map((n) => (
                    <div
                      className="notification-card"
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      onMouseEnter={() => setHoveredNotificationId(n.id)}
                      onMouseLeave={() => setHoveredNotificationId(null)}
                      style={{
                        background: n.is_read
                          ? "linear-gradient(145deg, #f0f0f0, #ffffff)"
                          : "linear-gradient(145deg, #e6f0ff, #ffffff)",
                        boxShadow:
                          hoveredNotificationId === n.id
                            ? "0 10px 20px rgba(0, 0, 0, 0.12)"
                            : "0 2px 6px rgba(0, 0, 0, 0.08)",
                        transform:
                          hoveredNotificationId === n.id ? "translateY(-5px) scale(1.02)" : "scale(1)",
                        borderLeft: n.is_read ? "4px solid #ccc" : "4px solid #007bff",
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: "10px" }}>
                        <p
                          style={{
                            fontWeight: n.is_read ? "400" : "600",
                          }}
                        >
                          {n.message.length > 50 ? `${n.message.slice(0, 50)}...` : n.message}
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: "12px", color: "#666" }}>
                            {new Date(n.created_at).toLocaleString()}
                          </span>
                          {!n.is_read && (
                            <div className="notification-new-badge">
                              New
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No notifications.</p>
              )}

              {/* Popup Modal */}

            </div>
          )}
        </div>
        <button className="notification-btn" onClick={toggleSidebar}>
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
      </div>


      <nav className="sidebar-nav scrollable-nav-container">
        <ul>
          <li>
            <button
              className="nav-item"
              onClick={() => handleNavigate("Home", "/home")}
            >
              <i className="bi bi-house-door" style={{ color: "#0D6EFD", fontSize: "20px" }}></i>
              <span>Home</span>
            </button>
          </li>
          <li>
            <button
              className="nav-item"
              onClick={() => handleNavigate("Consent Dashboard", "/consent-dashboard")}
            >
              <i className="bi bi-grid" style={{ color: "#0D6EFD", fontSize: "20px" }}></i>
              <span>Consent Dashboard</span>
            </button>
          </li>
          <li>
            <button
              className={`nav-item ${openSubmenus.directory ? "submenu-open" : ""}`}
              onClick={() => toggleSubmenu("directory")}
            >
              <i className="bi bi-folder2" style={{ color: "#0D6EFD", fontSize: "20px" }}></i>
              <span>Directory</span>
            </button>
            <ul className={`submenu ${openSubmenus.directory ? "show" : ""}`}>
              <li
                className="submenu-item" // Added class for potential styling
                onClick={() => handleNavigate("DPI Directory", "/dpi-directory")}
              >
                • DPI Directory
              </li>
              <li
                className="submenu-item" // Added class for potential styling
                onClick={() =>
                  handleNavigate(
                    "Global Connection Directory",
                    "/create-global-connection-type"
                  )
                }
              >
                • Global Connection Directory
              </li>
            </ul>
          </li>
          {locker_on && (<li>
            <button
              className={`nav-item ${activeMenu === "Locker Admin" ? "active" : ""}`}
              onClick={handleLockerAdminNavigate}
            >
              <i className="bi bi-person-lock" style={{ color: "#0D6EFD", fontSize: "22px" }}></i>
              <span>Locker Admin</span>
            </button>
          </li>)
          }
          <li>
            <button
              className={`nav-item ${openSubmenus.settings ? "submenu-open nested-submenu" : ""}`}
              onClick={() => toggleSubmenu("settings")}
            >
              <i className="bi bi-gear" style={{ color: "#0D6EFD", fontSize: "20px" }}></i>
              <span>Settings</span>
            </button>
            <ul className={`submenu ${openSubmenus.settings ? "show" : ""}`}>
              <li
                className="submenu-item" // Added class for potential styling
                onClick={() => handleNavigate("User Settings", "/settings-page")}
              >
                • User Settings
              </li>

              {/* Conditional Rendering for Admin-specific Settings */}
              {(curruser.user_type === "sys_admin" ||
                curruser.user_type === "system_admin") ? (
                <>
                  <li
                    className={`submenu-item ${openSubmenus.lockerSettings ? "submenu-open" : ""}`}
                    onClick={() => toggleSubmenu("lockerSettings")}
                  >
                    • Locker Settings
                  </li>
                  {openSubmenus.lockerSettings && (
                    <>
                      <li
                        className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("Freeze Locker", "/freeze-locker")
                        }
                      >
                        • Freeze Locker
                      </li>
                      <li
                        className="submenu-item nested" // Added class for potential styling
                        onClick={() => handleNavigate("Locker", "/all-lockers")}
                      >
                        • Locker
                      </li>
                    </>
                  )}

                  <li
                    className={`submenu-item ${openSubmenus.lockerSettings1 ? "submenu-open" : ""}`}
                    onClick={() => toggleSubmenu("lockerSettings1")}
                  >
                    • Connection Settings
                  </li>
                  {openSubmenus.lockerSettings1 && (
                    <ul className={`submenu ${openSubmenus.lockerSettings1 ? "show" : ""} nested-submenu`}>

                      <li
                        className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("Freeze Connection", "/freeze-connection")
                        }
                      >
                        • Freeze Connection
                      </li>
                      <li
                        className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("Connection Types", "/all-connection-types")
                        }
                      >
                        • Connection Types
                      </li>



                    </ul>
                  )}

                  {/* NEW: Admin Settings Option */}
                  <li
                    className={`submenu-item ${openSubmenus.adminSettings ? "submenu-open" : ""}`}
                    onClick={() => toggleSubmenu("adminSettings")}
                  >
                    • System Admin Settings
                  </li>
                  {openSubmenus.adminSettings && (
                    <>
                      <li
                        className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("Manage Users", "/manage-admins")
                        }
                      >
                        • Manage Admin
                      </li>
                      <li
                        className="submenu-item nested" // Added class for potential styling
                        onClick={() =>
                          handleNavigate("System Configuration", "/manage-moderators")
                        }
                      >
                        • Manage Moderator
                      </li>
                      {/* Add more admin specific items here */}
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Non-admin user's view of Settings */}
                  <li
                    className="submenu-item" // Added class for potential styling
                    onClick={() => handleNavigate("Locker Settings", "/all-lockers")}
                  >
                    • Locker Settings
                  </li>
                  <li
                    className="submenu-item" // Added class for potential styling
                    onClick={() => handleNavigate("Connection Settings", "/all-connection-types")}
                  >
                    • Connection Settings
                  </li>
                </>
              )}
            </ul>
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <i className="bi bi-person" style={{ color: "#0D6EFD", fontSize: "20px" }}></i>
          </div>
          <span>{capitalizeFirstLetter(curruser?.username)}</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <FontAwesomeIcon icon={faArrowRightFromBracket} />
        </button>
      </div>
      {selectedNotification && (
        <div className="edit-modal" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
          <div className="modal-content">
            {/* Close Button */}
            <div className="close-detail">
              <button
                type="button"
                className="position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center border-0 bg-transparent"
                onClick={closePopup}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#f8d7da",
                  color: "#721c24",
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                  transition: "0.3s ease-in-out",
                }}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" style={{ fontSize: "18px" }}></i>
              </button>
            </div>

            <div className="card p-3 shadow-lg border-0">
              {renderNotificationMessage(selectedNotification)}
              {/* <small>{new Date(selectedNotification.created_at).toLocaleString()}</small> */}

              {/* <p>{selectedNotification.message}</p> */}
              {/* <small>{new Date(selectedNotification.created_at).toLocaleString()}</small> */}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
              <div className="edit-modal ">
                <div className="modal-content">
                  <h4>Enter reason for rejecting revert consent</h4>
                  <div style={{ marginBottom: "1rem" }}>
                    <TextField
                      fullWidth
                      multiline
                      type="text"
                      rows={3}
                      value={revertRejectReason}
                      onChange={(e) => setRevertRejectReason(e.target.value)}
                      placeholder="Enter reason here..."
      
                      style={{ width: "100%", marginTop: "0.5rem", borderRadius: "5px" }}
                    />
                  </div>
      
                  <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
                    <button className="btn btn-primary p-2" onClick={() => handleReject()}>Submit</button>
                    <button className="btn btn-primary p-2" onClick={() => {
                      setShowRejectModal(false);
                      setRevertRejectReason("");
                      setRevertXnode();
                    }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

    </div>
  );
};

export default Sidebar;