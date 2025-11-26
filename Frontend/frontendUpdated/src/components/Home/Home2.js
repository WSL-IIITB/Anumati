import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import { Menu } from "lucide-react";
import Sidebar from "../Sidebar/Sidebar";
import "./home.css";
import { frontend_host } from "../../config";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

export const Home2 = () => {
  const navigate = useNavigate();
  const [scale, setScale] = useState(1);
  const [lockers, setLockers] = useState([]);
  const [outgoingConnections, setOutgoingConnections] = useState([]);
  const [showOutgoingConnections, setShowOutgoingConnections] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [expandedIndex, setExpandedIndex] = useState(null);
  const { curruser } = useContext(usercontext);
  const [notifications, setNotifications] = useState([]);
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  // const curruser = JSON.parse(localStorage.getItem("curruser"));
  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
  }, [curruser, navigate]);
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

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const handleConsentDashboardClick = async () => {
    setShowOutgoingConnections(!showOutgoingConnections); // Toggle the state

    if (!showOutgoingConnections) {
      // Fetch outgoing connections if showing them
      try {
        const token = Cookies.get('authToken');
        const guestUsername = curruser ? curruser.username : null; // Get the current user's username

        if (!guestUsername) {
          setError('Guest username is required to fetch outgoing connections.');
          return;
        }

        // Fetch outgoing connections
        const response = await fetch(`host/get-outgoing-connections-user/?guest_username=${guestUsername}`.replace(/host/, frontend_host), {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          // setError(errorData.error || 'Failed to fetch outgoing connections');
          return;
        }

        const data = await response.json();
        console.log(data)
        if (data.success) {
          const filteredOutgoing = data.outgoing_connections.filter(
            (connection) => connection.closed !== false
          );
          setOutgoingConnections(filteredOutgoing || []);
        } else {
          setError(data.message || data.error);
        }
      } catch (error) {
        setError('An error occurred while fetching outgoing connections.');
      }
    }

  };
  const navigateToViewTerms = (connection) => {
    const locker = connection.guest_locker;
    console.log("Connection ID:", connection.connection_id);
    console.log("Connection Name:", connection.connection_name);
    console.log("Connection Description:", connection.connection_description);
    console.log("Host Locker Name:", connection.host_locker);
    console.log("Guest Locker Name:", connection.guest_locker);
    console.log("Host User Username:", connection.host_user);
    console.log("Guest User Username:", curruser.username);
    console.log("Locker Details:", locker);

    navigate("/view-terms-by-type", {
      state: {
        connection: connection,
        connection_id: connection.connection_id,
        connectionName: connection.connection_name,
        connectionDescription: connection.connection_description,
        hostLockerName: connection.host_locker?.name,
        guestLockerName: connection.guest_locker?.name,
        hostUserUsername: connection.host_user?.username,
        guestUserUsername: connection.guest_user?.username,
        locker: locker,
        guest_locker_id: connection.guest_locker?.locker_id,
        host_locker_id: connection.host_locker?.locker_id,
        hostLocker: connection.host_locker,
        guestLocker: connection.guest_locker
      },
    });
  };
  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index); // Toggle expand/collapse
  };

  const handleInfo = (connection) => {
    const connectionParts = connection.connection_name.split(/[-:]/).map(part => part.trim());
    const connectionTypeName = connectionParts[0];  // Extract connection type
    const guestUserUsername = connectionParts[1];   // Extract guest username
    const hostUserUsername = connectionParts[2];
    const locker = connection.guest_locker;


    console.log("Navigating with state:", {
      connectionName: connection.connection_name,
      hostLockerName: connection.host_locker?.name,
      guestLockerName: connection.guest_locker?.name,
      hostUserUsername: connection.host_user?.username,
      guestUserUsername: connection.guest_user?.username,
      locker: connection.guest_locker?.name,
      connectionTypeName,
      connectionDescription: connection.connection_description,
    });

    navigate("/display-terms", {
      state: {
        connection_id: connection.connection_id,
        connectionName: connection.connection_name,
        connectionDescription: connection.connection_description,
        hostLockerName: connection.host_locker.name,
        guestLockerName: connection.guest_locker.name,
        hostUserUsername: connection.host_user.username,
        guestUserUsername: curruser.username,
        locker: locker,
        connectionTypeName,
        guest_locker_id: connection.guest_locker?.id,
        host_locker_id: connection.host_locker?.id,
        lockerComplete: locker,
        hostLocker: connection.host_locker,
        guestLocker: connection.guest_locker,
        createdtime: connection.created_time,
        validitytime: connection.validity_time,
        homeDisplay: true,
      },
    });
  };



  const handleConsent = (connection) => {
    // Split the connection_name using both '-' and ':' to get relevant parts
    const connectionParts = connection.connection_name.split(/[-:]/).map(part => part.trim());
    const connectionTypeName = connectionParts[0];  // The first part is the connection type
    const guestUserUsername = connectionParts[1];   // The second part is the guest username
    const hostUserUsername = connectionParts[2];    // The third part is the host locker name

    // Ensure that locker IDs are not undefined by extracting from the connection object
    const guestLockerId = connection.guest_locker?.id
    const hostLockerId = connection.host_locker?.id
    const locker = connection.guest_locker;


    console.log("Navigating with state:", {
      connectionName: connection.connection_name,
      connectionTypeName,
      guestUserUsername,
      hostUserUsername,
      guestLockerId,
      hostLockerId,
      connection_id: connection.connection_id,
    });

    navigate("/show-connection-terms", {
      state: {
        connection: connection,
        connection_id: connection.connection_id,
        connectionName: connection.connection_name,
        connectionDescription: connection.connection_description,
        hostLockerName: connection.host_locker.name,
        guestLockerName: connection.guest_locker.name,
        hostUserUsername: connection.host_user.username,
        guestUserUsername: curruser.username,
        locker: locker.name,
        connectionTypeName,
        showConsent: true,
        guest_locker_id: connection.guest_locker?.id,
        host_locker_id: connection.host_locker?.id,
        lockerComplete: locker,
        hostLocker: connection.host_locker,
        guestLocker: connection.guest_locker,
        homeConsent: true,

      },
    });
  };


  // useEffect(() => {
  //   const handleResize = () => {
  //     const width = window.innerWidth;
  //     if (width < 480) setScale(0.6);
  //     else if (width < 768) setScale(0.7);
  //     else if (width < 1024) setScale(0.85);
  //     else setScale(1);
  //   };

  //   handleResize();
  //   window.addEventListener("resize", handleResize);
  //   return () => window.removeEventListener("resize", handleResize);
  // }, []);

  useEffect(() => {

    const checkAndUpdateConnectionStatus = async () => {
      try {
        const token = Cookies.get('authToken');
        const response = await fetch("host/update_connection_status_if_expired_onlogin/".replace(/host/, frontend_host), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`
          }
        });

        const result = await response.json();
        if (result.success) {
          console.log("Expired connections updated:", result.updated_connection_ids);
        } else {
          console.warn("API Error:", result.error);
        }
      } catch (error) {
        console.error("Error calling update_connection_status_if_expired:", error);
      }
    };

    const checkAndUpdateXnodeStatus = async () => {
      try {
        const token = Cookies.get('authToken');
        const response = await fetch("host/update_xnode_v2_status/".replace(/host/, frontend_host), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`
          }
        });

        const result = await response.json();
        if (result.success) {
          console.log("Expired xnode updated");
        } else {
          console.warn("API Error:", result.error);
        }
      } catch (error) {
        console.error("Error calling update_xnode_v2_status:", error);
      }
    };

    const fetchLockers = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(`${frontend_host}/get-lockers-user/`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          // setError(data.error || data.message || "Failed to fetch lockers");
          return;
        }

        setLockers(data.lockers || []);
      } catch (error) {
        setError("An error occurred while fetching lockers.");
      }
    };

    if (curruser) {
      checkAndUpdateConnectionStatus().then(() => {
        fetchLockers();
        checkAndUpdateXnodeStatus();
      });
    }
  }, [curruser]);



  const handleClick = (locker) => {
    navigate('/view-locker', { state: { locker } });
  };

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));


  const content = (
    <>
      <div className="navbarBrands">
        {curruser ? capitalizeFirstLetter(curruser.username) : "None"}
      </div>
      <div>
        {curruser ? curruser.description : "None"}
      </div>
    </>
  );

  return (
    <div className="app-container">
      {/* Hamburger menu, visible on mobile/tablet hidden on PC by CSS */}
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
      </div>


      {/* Main content area */}
      <main
        className={`main-content ${isSidebarOpen ? "sidebar-open" : ""}`}
        // Inline style for scaling - kept as per request for current PC look
        style={{ transform: `scale(${scale})`, transformOrigin: "top center" }}
      >
        {/* Page Title */}
        {/* <h1 className="page-title" style={{ fontSize: `${48 * scale}px` }}>
          Home Page
        </h1> */}

        {/* Container for buttons and lockers/consent dashboard */}
        <div className="content-container">
          {!showOutgoingConnections ? (
            <>
              {/* Button and "My Lockers" text container */}
              <div className="button-container">
                {/* Text Button */}
                <span className="text-button" style={{ fontSize: `${28 * scale}px` }}> {/* Inline style for dynamic font size on PC */}
                  My Lockers
                </span>
                {/* Create Locker Button */}
                <button
                  className="primary-button"
                  onClick={() => navigate("/create-locker")}
                  // Inline styles for dynamic padding/font size on PC
                  style={{
                    fontSize: `${14 * scale}px`,
                    padding: `${10 * scale}px ${24 * scale}px`,
                  }}
                >
                  CREATE NEW LOCKER
                </button>
                {/* Consent Dashboard Button */}
                <button
                  className="primary-button"
                 onClick={() => navigate("/consent-dashboard")}
                  // Inline styles for dynamic padding/font size on PC
                  style={{
                    fontSize: `${14 * scale}px`,
                    padding: `${10 * scale}px ${24 * scale}px`,
                  }}
                >
                  CONSENT DASHBOARD
                </button>
              </div>

              {/* Error message */}
              {/* {error && <div style={{ color: "red", marginTop: "1rem" }}>{error}</div>} */}

              {/* Lockers Container */}
              <div className="locker-box2">
                {lockers.map((locker, index) => (
                  <div key={index} className="locker-box">
                    <div className="locker-inner">
                      <div className="locker-content">
                        {/* Locker Heading */}
                        <h2
                          className="locker-heading"
                          style={{ fontSize: `${20 * scale}px` }}
                        >
                          {locker.name || "Untitled Locker"}
                        </h2>
                        {/* Locker Description */}
                        <p
                          className="locker-text" style={{ textAlign: "left" }}
                        // style={{ fontSize: `${14 * scale}px` }} 
                        >
                          {locker.description || "No description provided."}
                        </p>
                      </div>
                      {/* Open Locker Button */}

                      {locker.is_frozen === false ? (
                        <button
                          className="open-button"
                          onClick={() => handleClick(locker)}
                          // Inline styles for dynamic padding/font size on PC
                          style={{
                            fontSize: `${14 * scale}px`,
                            padding: `${8 * scale}px ${24 * scale}px`,
                          }}
                        >
                          Open
                        </button>
                      ) : (
                        <button
                          className=" btn btn-secondary"
                          // onClick={() => handleClick(locker)}
                          // Inline styles for dynamic padding/font size on PC
                          style={{
                            fontSize: `${14 * scale}px`,
                            padding: `${8 * scale}px ${24 * scale}px`,
                          }}
                        >
                          Frozen
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="consent-dashboard-container">
              <button
                className="primary-button"
                onClick={() => setShowOutgoingConnections(false)}
                style={{
                  fontSize: `${14 * scale}px`,
                  padding: `${10 * scale}px ${24 * scale}px`,
                  marginBottom: "1rem",
                }}
              >
                ← Back to Lockers
              </button>
              <h2 style={{ fontSize: `${24 * scale}px` }}>Consent Dashboard</h2>

              {outgoingConnections?.length > 0 ? (
                <div className="tableContainer table-responsive"> {/* table-responsive class is likely from Bootstrap, keeping it */}
                  <table className="table table-bordered table-striped table-hover outgoingConnectionsTable"> {/* Bootstrap table classes, keeping them */}
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Connection Type</th>
                        <th>Host User</th>
                        <th>Host Locker</th>
                        <th>Guest Locker</th>
                        <th>Created On</th>
                        <th>Validity On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outgoingConnections?.map((connection, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <button
                              className="connection-name-button"
                              onClick={() => navigateToViewTerms(connection)}
                              style={{
                                textDecoration: "underline",
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                                color: "inherit",
                                textAlign: "left",
                              }}
                            >
                              {connection.connection_name}
                            </button>
                            {expandedIndex === index ? (
                              <div>
                                <div>{connection.connection_description}</div>
                                <button
                                  onClick={() => toggleExpand(index)}
                                  style={{
                                    textDecoration: "underline",
                                    background: "none",
                                    border: "none",
                                    padding: 0,
                                    cursor: "pointer",
                                    color: "blue",
                                  }}
                                >
                                  Read less
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => toggleExpand(index)}
                                style={{
                                  textDecoration: "underline",
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  color: "blue",
                                }}
                              >
                                Read more
                              </button>
                            )}
                          </td>
                          <td>{connection.host_user.username}</td>
                          <td>{connection.host_locker.name}</td>
                          <td>{connection.guest_locker.name}</td>
                          <td>{new Date(connection.created_time).toLocaleString()}</td>
                          <td>{new Date(connection.validity_time).toLocaleString()}</td>
                          <td>
                            <div className="d-flex justify-content-center">
                              <button
                                className="btn btn-outline-dark rounded-circle p-0 d-flex align-items-center justify-content-center me-2"
                                onClick={() => handleInfo(connection)}
                                style={{ width: "30px", height: "30px", fontWeight: "bold" }}
                              >
                                I
                              </button>
                              <button
                                className="btn btn-outline-dark rounded-circle p-0 d-flex align-items-center justify-content-center"
                                onClick={() => handleConsent(connection)}
                                style={{ width: "30px", height: "30px", fontWeight: "bold" }}
                              >
                                C
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ fontSize: `${16 * scale}px` }}> {/* Inline style for dynamic font size on PC */}
                  No outgoing connections found.
                </p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

