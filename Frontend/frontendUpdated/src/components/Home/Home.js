// import React, { useContext, useEffect, useState } from "react";
// import Cookies from 'js-cookie';
// import "./page1.css";
// import { useNavigate } from "react-router-dom";
// //import userImage from "../../assets/WhatsApp Image 2024-07-11 at 16.04.18.jpeg"; 
// import { usercontext } from "../../usercontext";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";

// // Helper function to capitalize the first letter of a string
// const capitalizeFirstLetter = (string) => {
//   if (!string) return '';
//   return string.charAt(0).toUpperCase() + string.slice(1);
// };

// export const Home = () => {
//   const navigate = useNavigate();
//   const [lockers, setLockers] = useState([]);
//   const [notifications, setNotifications] = useState([]);  // New state for notifications
//   const [error, setError] = useState(null);
//   const [isOpen, setIsOpen] = useState(false);
//   const { curruser } = useContext(usercontext);
//   const [outgoingConnections, setOutgoingConnections] = useState([]);  // Add this state



//   useEffect(() => {
//     if (!curruser) {
//         navigate('/');
//         return;
//     }},[]);


//   useEffect(() => {
//     const fetchLockers = async () => {
//       try {
//         const token = Cookies.get('authToken');
//         console.log('Fetching lockers with token:', token);

//         const response = await fetch('host/get-lockers-user/'.replace(/host/, frontend_host), {
//           method: 'GET',
//           headers: {
//             'Authorization': `Basic ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         console.log('Response status:', response.status);

//         if (!response.ok) {
//           const errorData = await response.json();
//           setError(errorData.error || 'Failed to fetch lockers');
//           console.error('Error fetching lockers:', errorData);
//           return;
//         }

//         const data = await response.json();
//         console.log('Response data:', data);

//         if (data.success) {
//           setLockers(data.lockers || []);
//         } else {
//           setError(data.message || data.error);
//         }
//       } catch (error) {
//         setError("An error occurred while fetching this user's lockers.");
//         console.error("Error:", error);
//       }
//     };

//     if (curruser) {
//       fetchLockers();
//       fetchNotifications();  // Fetch notifications when fetching lockers
//     }
//   }, [curruser]);

//     // Fetch notifications for the user
//     const fetchNotifications = async () => {
//       try {
//         const token = Cookies.get('authToken');
//         const response = await fetch('host/get-notifications/'.replace(/host/, frontend_host), {
//           method: 'GET',
//           headers: {
//             'Authorization': `Basic ${token}`,
//             'Content-Type': 'application/json'
//           }
//         });

//         if (!response.ok) {
//           const errorData = await response.json();
//           setError(errorData.error || 'Failed to fetch notifications');
//           return;
//         }

//         const data = await response.json();
//         if (data.success) {
//           setNotifications(data.notifications || []);
//         } else {
//           setError(data.message || data.error);
//         }
//       } catch (error) {
//         setError("An error occurred while fetching notifications.");
//       }
//     };  

//   const handleNewLockerClick = () => {
//     navigate('/create-locker');
//   };

//   const handleClick = (locker) => {
//     navigate('/view-locker', { state: { locker } });
//   };

//   const handleConsentDashboardClick = async () => {
//     try {
//       const token = Cookies.get('authToken');
//       const response = await fetch('host/get-outgoing-connections/'.replace(/host/, frontend_host), {
//         method: 'GET',
//         headers: {
//           'Authorization': `Basic ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         setError(errorData.error || 'Failed to fetch outgoing connections');
//         return;
//       }

//       const data = await response.json();
//       if (data.success) {
//         setOutgoingConnections(data.outgoing_connections || []);
//       } else {
//         setError(data.message || data.error);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching outgoing connections.");
//     }
//   };
//   const content = (
//     <>
//       <div className="navbarBrand">
//         {curruser ? capitalizeFirstLetter(curruser.username) : "None"}
//       </div>
//       <div className="description">
//         {curruser ? curruser.description : "None"}
//       </div>
//     </>
//   );

//   return (
//     <div>

//   <Navbar content = {content}/>

//       <div className="heroContainer">
//         <div className="newLocker">
//           <h3>My Lockers</h3>
//           <button id="newLockerBtn" onClick={handleNewLockerClick}>
//             Create New Locker
//           </button>
//           <button id="consentDashboardBtn" onClick={handleConsentDashboardClick}>
//         Consent Dashboard
//       </button>
//         </div>

//         <div className="allLockers">
//           {lockers.length > 0 ? (
//             lockers.map(locker => (
//               <div key={locker.locker_id} className="page1-locker">
//                 <h4>{locker.name}</h4>

//                 {locker.is_frozen === false && <button id="openLockerBtn" onClick={() => handleClick(locker)}>Open</button>}
//                 {locker.is_frozen === true && <button id="openLockerBtn">Frozen</button>}

//                 <p className="description2">{locker.description}</p>

//               </div>
//             ))
//           ) : (
//             <p>No lockers found.</p>
//           )}
//         </div>

//         {/* <div className="allLockers">
//         <h3>My Notifications</h3>
//           {notifications.length > 0 ? (
//             notifications.map(notification => (
//               <div key={notification.id} className="notification-box">
//                 <p>
//                   Notification from <b>{notification.guest_user}</b> 
//                   to <b>{notification.host_user}</b> 
//                   for connection <b>{notification.connection_name}</b>
//                 </p>
//                 <p>{new Date(notification.created_at).toLocaleString()}</p>
//               </div>
//             ))
//           ) : (
//             <p>No notifications found.</p>
//           )}
//         </div>         */}
//       </div>
//     </div>
//   );
// };
import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import "./page1.css";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
import { Button, Grid, Grid2, Typography } from '@mui/material'
import { Scanner } from '../Scanner/Scanner'


// Helper function to capitalizeFirstLetter
const capitalizeFirstLetter = (string) => {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const Home = () => {
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [outgoingConnections, setOutgoingConnections] = useState([]);
  const [error, setError] = useState(null);
  const { curruser } = useContext(usercontext);
  const [showOutgoingConnections, setShowOutgoingConnections] = useState(false); // Toggle state
  const [expandedIndex, setExpandedIndex] = useState(null);

  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }
  }, [curruser, navigate]);

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

    //   const fetchLockers = async () => {
    //     try {
    //         const token = Cookies.get('authToken');

    //         const response = await fetch(`${frontend_host}/get-lockers-user/`, {
    //             method: 'GET',
    //             headers: {
    //                 'Authorization': `Basic ${(token)}`,  // Ensure proper decoding
    //                 'Content-Type': 'application/json',
    //             },
    //             mode: 'cors',  // Enable CORS
    //             credentials: 'include' // Include cookies if required
    //         });

    //         if (!response.ok) {
    //             const errorData = await response.json();
    //             setError(errorData.error || 'Failed to fetch lockers');
    //             return;
    //         }

    //         const data = await response.json();
    //         if (data.success) {
    //             setLockers(data.lockers || []);
    //         } else {
    //             setError(data.message || data.error);
    //         }
    //     } catch (error) {
    //         setError("An error occurred while fetching lockers.");
    //     }
    // };


    if (curruser) {
      checkAndUpdateConnectionStatus().then(() => {
        fetchLockers();
        checkAndUpdateXnodeStatus();
        fetchNotifications();
      });
    }
  }, [curruser]);

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
      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching notifications.");
    }
  };

  const handleNewLockerClick = () => {
    navigate('/create-locker');
  };

  const handleClick = (locker) => {
    navigate('/view-locker', { state: { locker } });
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
          setError(errorData.error || 'Failed to fetch outgoing connections');
          return;
        }

        const data = await response.json();
        if (data.success) {
          const filteredOutgoing = data.outgoing_connections.filter(
            (connection) => connection.connection_status !== "closed"
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
  


  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index); // Toggle expand/collapse
  };
  return (
    <div>
      <div>
        <Navbar content={content} />
      </div>


      <div style={{ marginTop: "130px" }}>
        <div className="heroContainer">
          {/* <div> */}


          <Grid container>
            <Grid item md={4} xs={12} sx={{ textAlign: "center" }}>
              <h4>{showOutgoingConnections ? "Consent Dashboard" : "My Lockers"}</h4>
            </Grid>
            <Grid item md={4} xs={6}>
              {!showOutgoingConnections && (
                <Button className="btn-color" variant="contained" style={{ fontWeight: "bold" }} onClick={handleNewLockerClick} size="small">
                  Create New Locker
                </Button>
              )}
            </Grid>
            <Grid item md={4} xs={6}>
              <Button className="btn-color" variant="contained" onClick={handleConsentDashboardClick} size="small" >
                {showOutgoingConnections ? "Lockers" : "Consent Dashboard"} {/* Change button text based on state */}
              </Button>
            </Grid>
          </Grid>



          {/* </div> */}
          {showOutgoingConnections ? (
            <div className="allOutgoingConnections">
              {outgoingConnections.length > 0 ? (
                <div className="tableContainer table-responsive"> {/* Ensure no height constraints here */}
                  <table className="table table-bordered table-striped table-hover outgoingConnectionsTable">
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
                      {outgoingConnections.map((connection, index) => (
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
                            {expandedIndex === index && (
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
                            )}
                            {expandedIndex !== index && (
                              <button
                                onClick={() => toggleExpand(index)}
                                style={{
                                  textDecoration: "underline",
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  color: "blue"
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
                            <div id="conntent" className="d-flex justify-content-center">
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
                <p>No outgoing connections found.</p>
              )}
            </div>
          ) : (
            <div className="allLockers" style={{ border: "none" }}>
              {lockers.length > 0 ? (
                lockers.map(locker => (
                  <div key={locker.locker_id} className="page1-locker" style={{ borderRadius: "5px" }}>
                    <h4>{locker.name}</h4>
                    {locker.is_frozen === false ? (
                      <Button className="subbutton" id="openLockerBtn" onClick={() => handleClick(locker)}>
                        Open
                      </Button>
                    ) : (
                      <button className="btn btn-secondary" id="openLockerBtn">Frozen</button>
                    )}
                    <p className="description2">{locker.description}</p>
                  </div>
                ))
              ) : (
                <p style={{ marginTop: "1.30rem" }}>No lockers found.</p>
              )}
            </div>
          )}

        </div>
      </div>

    </div>
  );
}