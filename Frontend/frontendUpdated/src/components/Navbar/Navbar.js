import React, { useState, useContext, useEffect, useRef } from "react";
import "./Navbar.css";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg";
import { usercontext } from "../../usercontext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { frontend_host } from "../../config";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import { QrReader } from 'react-qr-reader';
import { Grid } from '@mui/material'

export default function Navbar({ content, lockerAdmin, lockerObj, breadcrumbs }) {
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false); // State for directory dropdown
  const { curruser, setUser } = useContext(usercontext);
  const [scanning, setScanning] = useState(false); // State to manage QR scanner visibility
  const [isQRModalOpen, setIsQRModalOpen] = useState(false); // State for QR modal
  const [qrData, setQrData] = useState(null); // State for QR data
  const notificationsRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const systemDropdownRef = useRef(null);
  const lockerSettingDropdownRef = useRef(null);
  const connectionSettingDropdownRef = useRef(null);
  const directoryRef = useRef(null);
  // const { curruser } = useContext(usercontext);
  const isSystemAdmin = curruser && (curruser.user_type === 'sys_admin' || curruser.user_type === 'system_admin');

  // const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isGlobalConnectionOpen, setIsGlobalConnectionOpen] = useState(false);
  const [isLockerSettingOpen, setIsLockerSettingOpen] = useState(false)
  const [isConnectionSettingOpen, setIsConnectionSettingOpen] = useState(false)

  // const toggleDirectoryDropdown = () => setIsDirectoryOpen(!isDirectoryOpen);
  const toggleGlobalConnectionDropdown = () => setIsGlobalConnectionOpen(!isGlobalConnectionOpen);
  const toggleLockerSettingDropdown = () => setIsLockerSettingOpen(!isLockerSettingOpen)
  const toggleConnectionSettingDropdown = () => setIsConnectionSettingOpen(!isConnectionSettingOpen)

  const handleDPIDirectory = () => {
    navigate("/dpi-directory");
  };

  const handleGlobalConnectionDirectory = () => {
    navigate("/create-global-connection-type");
  };

  const handleHomeClick = () => {
    navigate("/home");

    // Check if Bootstrap's Offcanvas is defined in the global scope
    const offcanvas = document.querySelector('.offcanvas');
    if (window.bootstrap) {
      const bsOffcanvas = window.bootstrap.Offcanvas.getInstance(offcanvas);
      if (bsOffcanvas) {
        bsOffcanvas.hide();
      }
    }
  };
  const handlePageClick = () => {
    navigate("/dpi-directory");
  }
  const handleLogout = () => {
    Cookies.remove("authToken");
    localStorage.removeItem("curruser");
    setUser(null);
    navigate("/");
  };

  const toggleDirectoryDropdown = () => {
    setIsDirectoryOpen(!isDirectoryOpen); // Toggle directory dropdown
  };

  useEffect(() => {
    fetchNotifications();

    const handleStorageChange = (e) => {
      if (e.key === 'notifications') {
        const updatedNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
        setNotifications(updatedNotifications);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
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



  useEffect(() => {
    const handleClickSystemOutside = (event) => {
      // if (
      //   systemDropdownRef.current &&
      //   !systemDropdownRef.current.contains(event.target)
      // ) {
      //   setIsGlobalConnectionOpen(false); // Close dropdown on outside click
      // }
      if (systemDropdownRef.current && !systemDropdownRef.current.contains(event.target)) {
        setIsGlobalConnectionOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickSystemOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickSystemOutside);
    };
  }, [systemDropdownRef]);

  useEffect(() => {
    const handleClickLokerOutside = (event) => {
      if (lockerSettingDropdownRef.current && !lockerSettingDropdownRef.current.contains(event.target)) {
        setIsLockerSettingOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickLokerOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickLokerOutside);
    };
  }, [lockerSettingDropdownRef]);

  useEffect(() => {
    const handleClickConnectionOutside = (event) => {
      if (connectionSettingDropdownRef.current && !connectionSettingDropdownRef.current.contains(event.target)) {
        setIsConnectionSettingOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickConnectionOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickConnectionOutside);
    };
  }, [connectionSettingDropdownRef]);



  useEffect(() => {
    const handleClickOutsideDirectory = (event) => {
      if (directoryRef.current && !directoryRef.current.contains(event.target)) {
        setIsDirectoryOpen(false);
      }
    };

    if (isDirectoryOpen) {
      document.addEventListener("mousedown", handleClickOutsideDirectory);
    } else {
      document.removeEventListener("mousedown", handleClickOutsideDirectory);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutsideDirectory);
    };
  }, [isDirectoryOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);


  const fetchNotifications = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        "host/get-notifications/".replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch notifications");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        localStorage.setItem("notifications", JSON.stringify(data.notifications || []));
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching notifications.");
    }
  };

  const handleSettings = () => {
    navigate("/settings-page");
  };

  const handleConnection = () => {
    navigate("/admin", { state: lockerObj });
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleAdminSettings = () => {
    if (isSystemAdmin) {
      toggleGlobalConnectionDropdown();
    }
  };

  const handleLockerSettings = () => {
    toggleLockerSettingDropdown();
  };

  const handleConnectionSettings = () => {
    toggleConnectionSettingDropdown();
  };

  const handleModeratorSettings = () => {
    navigate("/freeze-locker-connection");
  };

  const toggleNotifications = async () => {
    setIsNotificationsOpen(!isNotificationsOpen);

    if (!isNotificationsOpen) {
      await markAllNotificationsAsRead();
    }
  };


  const markAllNotificationsAsRead = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        "host/mark-all-notifications-read/".replace(/host/, frontend_host),
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedNotifications = notifications.map((notif) => ({ ...notif, read: true }));
        setNotifications(updatedNotifications);
        localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to mark notifications as read");
      }
    } catch (error) {
      setError("An error occurred while marking notifications as read.");
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `host/mark-notification-read/${id}/`.replace(/host/, frontend_host),
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const updatedNotifications = notifications.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        );
        setNotifications(updatedNotifications);
        localStorage.setItem("notifications", JSON.stringify(updatedNotifications));
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to mark notification as read");
      }
    } catch (error) {
      setError("An error occurred while marking notification as read.");
    }
  };

  // const handleGlobalConnectionClick = () => {
  //   if (isSystemAdmin) {
  //     handleGlobalConnectionDirectory();
  //   } else {
  //     handleGlobalConnectionDirectory();
  //   }
  // };

  const handleQRScanner = (event) => {
    event.stopPropagation(); // Prevent event from bubbling up
    setIsQRModalOpen(true); // Open the QR modal
  };

  const handleQRModalClose = () => {
    setIsQRModalOpen(false); // Close the QR modal
    setQrData(null); // Clear QR data when closing
    setScanning(false);
    const videoElement = document.querySelector("video");
    if (videoElement && videoElement.srcObject) {
      const stream = videoElement.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop(); // Stop each track (both video and audio)
      });

      videoElement.srcObject = null; // Clear the video element source
    }

    // Refresh the page when closing the scanner
    window.location.reload();
  };


  const handleScan = (data) => {
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        console.log("Scanned QR Data:", parsedData);

        // Check for essential fields and handle optional ones
        if (
          parsedData.connection_name &&
          parsedData.connection_type_name &&
          parsedData.host_username &&
          parsedData.host_locker_name
        ) {
          // Navigate to CreateConnectionType page with the state data
          navigate("/create-connection-type", {
            state: {
              hostuser: { username: parsedData.host_username },
              hostlocker: { name: parsedData.host_locker_name },
              selectedConnectionType: {
                connection_type_name: parsedData.connection_type_name,
                connection_description: parsedData.connection_description || '',
              },
            },
          });

          // Stop scanning and reload the page
          setScanning(false);
          window.location.reload(); // This will reload the page after navigating
        } else {
          console.error("Parsed data is missing essential fields");
        }
      } catch (error) {
        console.error("Invalid QR Code:", error);
      }
    }
  };


  const handleError = (err) => {
    console.error(err); // Log any error during scanning
  };


  // Inside your component
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768); // Adjust based on your breakpoint
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Initial check on mount
    handleResize();

    // Clean up event listener on unmount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleManageAdmin = () => {
    navigate("/manage-admins");
  };

  const handleManageModerators = () => {
    navigate("/manage-moderators");
  };

  // const handleFreezeLockerConnection = () => {
  //   navigate("/freeze-locker-connection");
  // };

  const handleFreezeLocker = () => {
    navigate("/freeze-locker");
  };

  const handleLockers = () => {
    navigate("/all-lockers");
  };

  const handleConnectionTypes = () => {
    navigate("/all-connection-types");
  };

  const handleFreezeConnection = () => {
    navigate("/freeze-connection");
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary fixed-top" style={{ marginTop: 0 }}>
        <div className="container-fluid">
          {/* <a className="navbar-brand" href="#">Offcanvas navbar</a> */}
          <Grid container>
            <Grid item xs={10} md={6}>
              <div className="wrap">{content}</div>
            </Grid>
            <Grid item xs={2} md={6}>
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasNavbar"
                aria-controls="offcanvasNavbar"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
              <div
                className="offcanvas offcanvas-end"
                tabindex="-1"
                id="offcanvasNavbar"
                aria-labelledby="offcanvasNavbarLabel"
              >
                <div className="offcanvas-header">
                  {/* <h5 className="offcanvas-title" id="offcanvasNavbarLabel">{content}</h5> */}
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="offcanvas"
                    aria-label="Close"
                  ></button>
                </div>
                <div className="offcanvas-body">
                  <ul className="navbar-nav justify-content-end flex-grow-1 pe-3">
                    {lockerAdmin && (
                      <li className="nav-item">
                        <a
                          className="nav-link active"
                          aria-current="page"
                          onClick={handleConnection}
                        >
                          Locker Admin
                        </a>
                      </li>
                    )}
                    {/* <li className="nav-item dropdown" ref={directoryRef}>
                      <a
                        className="nav-link dropdown-toggle"
                        role="button"
                        onClick={toggleDirectoryDropdown}
                        aria-expanded={isDirectoryOpen}
                      >
                        Directory
                      </a>
                      {isDirectoryOpen && ( 
                        <ul className="dropdown-menu show">
                          <div className="">
                            <li>
                              <a className="dropdown-item" onClick={handleDPIDirectory}>
                                DPI Directory
                              </a>
                            </li>
                            <li>
                              <a className="dropdown-item" onClick={handleGlobalConnectionDirectory}>
                                Global Connection Directory
                              </a>
                            </li>
                          </div>
                        </ul>
                      )}
                    </li> */}

                    <li className="nav-item" style={{ cursor: "pointer" }}>
                      <a className="nav-link" onClick={handlePageClick}>
                        Directory
                      </a>
                    </li>

                    <li className="nav-item" style={{ cursor: "pointer" }}>
                      <a className="nav-link" onClick={handleHomeClick}>
                        Home
                      </a>
                    </li>

                    <li className="nav-item dropdown" ref={notificationsRef}>
                      <a className="nav-link dropdown-toggle" role="button" onClick={toggleNotifications}>
                        <div className="notification-icon">
                          <FontAwesomeIcon
                            icon={faBell}
                            className="notification-bell"
                            size="2x"
                          />
                          {notifications.some((n) => !n.read) && (
                            <span className="notification-badge">
                              {notifications.filter((n) => !n.read).length}
                            </span>
                          )}
                        </div>
                      </a>

                      {isNotificationsOpen && (
                        <ul className="dropdownmenu">
                          <div className="">
                            <div className="notification-dropdown dropdownContent" min-width={{ xs: "", md: "450px" }}>
                              <h4>Notifications</h4>
                              {notifications.length > 0 ? (
                                notifications.map((notification) => (
                                  <li className="dropdown-item" key={notification.id}>
                                    <div
                                      key={notification.id}
                                      className={`notification-box ${notification.read ? "read" : "unread"
                                        }`}
                                      onClick={() => markNotificationAsRead(notification.id)}
                                    >
                                      <p>
                
                                        <p>{notification.message}</p>
                                      <p>{new Date(notification.created_at).toLocaleString()}</p>

                                        
                                      </p>
                                    </div>
                                  </li>
                                ))
                              ) : (
                                <p>No notifications found.</p>
                              )}
                            </div>
                          </div>
                        </ul>
                      )}
                    </li>
                    {/* <li className="nav-item" style={{ cursor: "pointer" }}>
                      <div className="nav-link qr-scanner-icons" onClick={handleQRScanner}>
                        <MdOutlineQrCodeScanner size={24} />
                      </div>
                    </li> */}
                    {/* {isQRModalOpen && (
                      <div className="qr-scanner-overlays">
                        <div className="qr-scanner-boxs">
                          <QrReader
                            onResult={(result, error) => {
                              if (result) {
                                handleScan(result?.text);  // Directly call handleScan with the scanned text
                              }
                              if (error) {
                                handleError(error);  // Call handleError for any errors
                              }
                            }}
                            constraints={{ facingMode: "environment" }}  // Use the back camera
                            style={{ width: "100%", height: "100%" }}
                          />
                          <button className="qr-scanner-closes" onClick={handleQRModalClose}>Close</button>
                        </div>
                      </div>
                    )} */}
                    <li className="nav-item dropdown" ref={profileDropdownRef}>
                      <a
                        className="nav-link dropdown-toggle"
                        role="button"
                        onClick={toggleDropdown}
                      >
                        <div className="profileContainer">
                          <div className="center-large-screen"                           >
                            <img
                              src={userImage}
                              alt="User Icon"
                              className="dropdownImage"
                            />
                          </div>
                          <div className="username">{capitalizeFirstLetter(curruser.username)}</div>
                        </div>
                      </a>
                      {isOpen && (
                        <ul className="dropdownmenu">
                          <div className="dropdownContent">
                            <li className="dropdown-items" style={{ listStyle: "none" }}>
                              <div className="currusername">
                                {capitalizeFirstLetter(curruser.username)}
                              </div>
                              <div className="curruserdesc">{curruser.description}</div>
                            </li>

                            <li className="dropdown-item dropdown" ref={systemDropdownRef}>
                              {(curruser.user_type === "sys_admin" || curruser.user_type === "system_admin") && (
                                <div>
                                  <button onClick={handleAdminSettings}>System Admin Settings</button>
                                  {isSystemAdmin && isGlobalConnectionOpen && (

                                    <ul className="dropdown-menu menu1 show">
                                      <li><a onClick={handleManageAdmin} className="dropdown-item">Manage Admin</a></li>
                                      <li><a onClick={handleManageModerators} className="dropdown-item">Manage Moderators</a></li>
                                      {/* <li><a onClick={handleFreezeLockerConnection} className="dropdown-item">Freeze Connection/Locker</a></li> */}
                                    </ul>

                                  )}
                                </div>
                              )}
                            </li>

                            <li className="dropdown-item dropdown" ref={lockerSettingDropdownRef}>
                              {/* {(curruser.user_type === "sys_admin" || curruser.user_type === "system_admin") && (
                                <div >
                                  <button onClick={handleLockerSettings}>Locker Settings</button>
                                  {isSystemAdmin && isLockerSettingOpen && (
                                    <ul className="dropdown-menu menu2 show">
                                      <li><a onClick={handleFreezeLockerConnection} className="dropdown-item">Lockers</a></li>
                                      <li><a onClick={handleFreezeLockerConnection} className="dropdown-item">Freeze Lockers</a></li>
                                    </ul>
                                  )}
                                </div>
                              )} */}
                              <div >
                                <button onClick={handleLockerSettings}>Locker Settings</button>
                                {isLockerSettingOpen && (
                                  <ul className="dropdown-menu menu2 show">
                                    <li><a onClick={handleLockers} className="dropdown-item">Lockers</a></li>
                                    {isSystemAdmin && (
                                      <li><a onClick={handleFreezeLocker} className="dropdown-item">Freeze Lockers</a></li>

                                    )}
                                  </ul>
                                )}
                              </div>
                            </li>

                            <li className="dropdown-item dropdown" ref={connectionSettingDropdownRef}>
                              {/* {(curruser.user_type === "sys_admin" || curruser.user_type === "system_admin") && (
                                <div>
                                  <button onClick={handleConnectionSettings}>Connection Settings</button>
                                  {isConnectionSettingOpen && (
                                    <ul className="dropdown-menu menu2 show">
                                      <li><a onClick={handleGlobalConnectionDirectory} className="dropdown-item">Create Global Connection</a></li>
                                    </ul>
                                  )}
                                </div>
                              )} */}
                              <div>
                                <button onClick={handleConnectionSettings}>Connection Settings</button>
                                {isConnectionSettingOpen && (
                                  <ul className="dropdown-menu menu3 show">
                                    <li><a onClick={handleConnectionTypes} className="dropdown-item">Connection Types</a></li>
                                    {/* <li><a className="dropdown-item">Create new Connection Type</a></li> */}
                                    <li><a onClick={handleGlobalConnectionDirectory} className="dropdown-item">Global Connection Directory</a></li>
                                    {isSystemAdmin && (
                                      <li><a onClick={handleFreezeConnection} className="dropdown-item">Freeze Connection</a></li>
                                    )}
                                  </ul>
                                )}
                              </div>
                            </li>


                            <li className="dropdown-item">
                              {curruser.user_type === "moderator" && (
                                <button onClick={handleModeratorSettings}>Moderator Settings</button>
                              )}
                            </li>

                            <li className="dropdown-item">
                              <button onClick={handleSettings}>Profile Settings</button>
                            </li>

                            <li className="dropdown-item">
                              <button onClick={handleLogout}>Logout</button>
                            </li>
                          </div>
                        </ul>
                      )}

                    </li>

                  </ul>
                </div>
              </div>
            </Grid>
            <div>{breadcrumbs}</div>
          </Grid>
        </div>
      </nav>
    </>
  );
}