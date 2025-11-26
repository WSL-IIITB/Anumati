// import React, { useContext, useEffect, useState } from "react";
// import "./page3.css";
// import { useNavigate } from "react-router-dom";
// import Cookies from "js-cookie";
// import { useLocation, useParams } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";
// import QRCode from "react-qr-code";

// export const ViewLocker = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const locker = location.state ? location.state.locker : null;

//   const [isOpen, setIsOpen] = useState(false);
//   const { curruser, setUser } = useContext(usercontext);
//   const [resources, setResources] = useState([]);
//   const [error, setError] = useState(null);
//   const [connections, setConnections] = useState({
//     incoming_connections: [],
//     outgoing_connections: [],
//   });
//   const [otherConnections, setOtherConnections] = useState([]);
//   const [trackerData, setTrackerData] = useState({});

//   const [VnodeResources, setVnodeResources] = useState([]);

//   useEffect(() => {
//     if (locker) {
//       fetchConnectionsAndOtherConnections(); // Combine the two fetches
//       fetchResources(); // Keep resources fetch separate
//       fetchVnodeResources();
//     }
//   }, [locker]);

//   console.log("locker", locker);
//   console.log("resources", resources);
//   const fetchConnectionsAndOtherConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({ locker_name: locker.name });

//       // Fetch connections
//       const [connectionsResponse, otherConnectionsResponse] = await Promise.all(
//         [
//           fetch(
//             `host/get-connections-user-locker/?${params}`.replace(
//               /host/,
//               frontend_host
//             ),
//             {
//               method: "GET",
//               headers: {
//                 Authorization: `Basic ${token}`,
//                 "Content-Type": "application/json",
//               },
//             }
//           ),
//           fetch(
//             `host/connection_types/?${params}`.replace(/host/, frontend_host),
//             {
//               method: "GET",
//               headers: {
//                 Authorization: `Basic ${token}`,
//                 "Content-Type": "application/json",
//               },
//             }
//           ),
//         ]
//       );

//       // Handle connections response
//       if (!connectionsResponse.ok)
//         throw new Error("Failed to fetch connections");
//       const connectionsData = await connectionsResponse.json();
//       if (connectionsData.success) {
//         setConnections(connectionsData.connections);
//         fetchAllTrackerData(connectionsData.connections.outgoing_connections);

//         // Count incoming connections for each connection type
//         const incomingConnectionCounts = {};
//         connectionsData.connections.incoming_connections.forEach(
//           (connection) => {
//             const typeId = connection.connection_type;
//             if (incomingConnectionCounts[typeId]) {
//               incomingConnectionCounts[typeId]++;
//             } else {
//               incomingConnectionCounts[typeId] = 1;
//             }
//           }
//         );

//         // Handle other connections response
//         if (!otherConnectionsResponse.ok)
//           throw new Error("Failed to fetch other connections");
//         const otherConnectionsData = await otherConnectionsResponse.json();
//         if (otherConnectionsData.success) {
//           // Update otherConnections with the count of incoming connections
//           setOtherConnections(
//             otherConnectionsData.connection_types.map((connection) => ({
//               ...connection,
//               incoming_count:
//                 incomingConnectionCounts[connection.connection_type_id] || 0,
//             }))
//           );
//         } else {
//           setError(
//             otherConnectionsData.message || "Failed to fetch other connections"
//           );
//         }
//       } else {
//         setError(connectionsData.message || "Failed to fetch connections");
//       }
//     } catch (error) {
//       console.error("Error fetching connections and other connections:", error);
//       setError(
//         "An error occurred while fetching connections or other connections"
//       );
//     }
//   };

//   const fetchResources = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({ locker_name: locker.name });
//       const response = await fetch(
//         `host/get-resources-user-locker/?${params}`.replace(
//           /host/,
//           frontend_host
//         ),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch resources");
//       }
//       const data = await response.json();
//       console.log("resour", data);
//       if (data.success) {
//         setResources(data.resources);
//       } else {
//         setError(data.message || "Failed to fetch resources");
//       }
//     } catch (error) {
//       console.error("Error fetching resources:", error);
//       setError("An error occurred while fetching resources");
//     }
//   };
//   console.log(locker);
//   const fetchVnodeResources = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({ host_locker_id: locker.locker_id });

//       const response = await fetch(
//         `host/get-vnodes/?${params}`.replace(/host/, frontend_host),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch resources");
//       }

//       const data = await response.json();
//       console.log("data", data);
//       console.log("vnodes", data.data);

//       //if (data.success) {
//       setVnodeResources(data.data);
//       //} else {
//       //setError(data.message || "Failed to fetch resources");
//       //}
//       //}
//     } catch (error) {
//       console.error("Error fetching resources:", error);
//       setError("An error occurred while fetching resources");
//     }
//   };

//   const fetchAllTrackerData = (outgoingConnections) => {
//     outgoingConnections.forEach((connection) => {
//       fetchTrackerData(connection);
//     });
//   };

//   const fetchTrackerData = async (connection) => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         connection_name: connection.connection_name,
//         host_locker_name: connection.host_locker.name,
//         guest_locker_name: connection.guest_locker.name,
//         host_user_username: connection.host_user.username,
//         guest_user_username: connection.guest_user.username,
//       });
//       const response = await fetch(
//         `host/get-terms-status/?${params}`.replace(/host/, frontend_host),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       if (!response.ok) {
//         throw new Error("Failed to fetch tracker data");
//       }
//       const data = await response.json();
//       if (data.success) {
//         // console.log("view locker", data);
//         setTrackerData((prevState) => ({
//           ...prevState,
//           [connection.connection_id]: {
//             count_T: data.count_T,
//             count_F: data.count_F,
//             count_R: data.count_R,
//             filled: data.filled,
//             empty: data.empty,
//           },
//         }));
//       } else {
//         setError(data.message || "Failed to fetch tracker data");
//       }
//     } catch (error) {
//       console.error("Error fetching tracker data:", error);
//       setError("An error occurred while fetching tracker data");
//     }
//   };

//   const getStatusColor = (tracker) => {
//     const totalObligations =
//       tracker.count_T + tracker.count_F + tracker.count_R;
//     if (tracker.count_T === totalObligations && tracker.count_R === 0) {
//       return "green";
//     } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
//       return "red";
//     } else {
//       return "orange";
//     }
//   };

//   const calculateRatio = (tracker) => {
//     const totalObligations =
//       tracker.count_T + tracker.count_F + tracker.count_R;
//     return totalObligations > 0
//       ? `${tracker.filled}/${totalObligations}`
//       : "0/0";
//   };

//   const handleUploadResource = () => {
//     navigate("/upload-resource", { state: { locker } });
//   };

//   const handleResourceClick = (filePath) => {
//     const url = `host/media/${filePath}`.replace(/host/, frontend_host);
//     window.open(url, "_blank");
//   };

//   const handleNewLockerClick = () => {
//     navigate("/create-locker");
//   };

//   const handleTracker = (connection) => {
//     navigate("/view-terms-by-type", {
//       state: {
//         connectionName: connection.connection_name,
//         hostLockerName: connection.host_locker?.name,
//         guestLockerName: connection.guest_locker?.name,
//         hostUserUsername: connection.host_user?.username,
//         guestUserUsername: connection.guest_user?.username,
//         locker: locker,
//       },
//     });
//   };

//   const handleDocsClick = () => {
//     console.log("Open Docs button clicked");
//   };

//   const handleEducationClick = () => {
//     console.log("Open Education button clicked");
//     navigate("/view-locker");
//   };

//   const handleConnectionClick = (connection) => {
//     navigate("/show-guest-users", { state: { connection, locker } });
//   };
//   const handleInfo = (connection) => {
//     // Split the connection_name by the hyphen and take the last part as the connection_type_name
//     const connectionTypeName = connection.connection_name
//       .split("-")
//       .pop()
//       .trim();

//     console.log("Navigating with state:", {
//       connectionName: connection.connection_name,
//       hostLockerName: connection.host_locker?.name,
//       connectionTypeName, // Pass the extracted connection_type_name
//       hostUserUsername: connection.host_user?.username,
//       locker: locker,
//     });

//     navigate("/show-connection-terms", {
//       state: {
//         connectionName: connection.connection_name,
//         hostLockerName: connection.host_locker?.name,
//         connectionTypeName, // Pass the extracted connection_type_name
//         hostUserUsername: connection.host_user?.username,
//         locker: locker,
//       },
//     });
//   };

//   const content = (
//     <>
//       <div className="navbarBrand">
//         {locker ? `Locker: ${locker.name}` : "Locker"}
//       </div>
//     </>
//   );
//   console.log("res vnode", VnodeResources);
//   console.log("res", resources);

//   return (
//     <div>
//       <Navbar content={content} lockerAdmin={true} lockerObj={locker} />
//       <div className="container">
//       <div className="locker-description">
//             {locker ? ` ${locker.description}` : "Description"}
//           </div>
//         <div className="locker-name">
//           <QRCode title="Locker QR Code" value={locker.name} size={100} />
        
//         </div>
//         <div className="container-2 clearfix">
//           <div className="a">
//             <div className="res">
//               <h3>Resources</h3>
//             </div>
//             <div className="container-3 clearfix">
//               <div className="aa">
//                 {resources.length > 0 ? (
//                   resources.map((resource, index) => (
//                     <div key={resource.resource_id} className="resource-item">
//                       <div className="resource-details">
//                         <div
//                           id="documents"
//                           onClick={() =>
//                             handleResourceClick(resource.i_node_pointer)
//                           }
//                         >
//                           {resource.document_name}
//                         </div>
//                         <div className="public-private">
//                           {resource.type === "private" ? (
//                             <>
//                               Private
//                               {/* Private - Shared with:
//                               {resource.connections.map((connection, index) => (
//                                 <span key={connection.connection_id}>
//                                   {connection.host_user.username}
//                                   {index < resource.connections.length - 1
//                                     ? ", "
//                                     : ""}
//                                 </span>
//                               ))} */}
//                             </>
//                           ) : (
//                             "Public"
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="not-found">No resources found.</p>
//                 )}

//                 {VnodeResources.length > 0 ? (
//                   [...VnodeResources].map((resource, index) => (
//                     <div
//                       key={resource.resource.resource_id}
//                       className="resource-item"
//                     >
//                       <div className="resource-details">
//                         <div
//                           id="documents-byShare"
//                           onClick={() =>
//                             handleResourceClick(
//                               resource.resource.i_node_pointer
//                             )
//                           }
//                         >
//                           {resource.resource.document_name}
//                         </div>
//                         <div className="public-private">
//                           {resource.resource.type === "private" ? (
//                             <>
//                               {/* Private - Shared with: */}
//                               Private
//                               {/* {resource.resource.connections.map((connection, index) => (
//                             <span key={connection.connection_id}>
//                               {connection.host_user.username}
//                               {index < resource.connections.length - 1
//                                 ? ", "
//                                 : ""}
//                             </span>
//                           ))} */}
//                             </>
//                           ) : (
//                             "Public"
//                           )}
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 ) : (
//                   <p className="not-found"></p>
//                 )}
//               </div>
//             </div>
//             {/* <button className="page3button">Share</button>
//               &nbsp;&nbsp;&nbsp; */}
//             <button className="page3button" onClick={handleUploadResource}>
//               Upload resource
//             </button>
//           </div>
//           <div className="b">
//             <h3 id="mycon">My Connections:</h3>
//             <h4 id="headingconnection">Incoming Connection types</h4>
//             <div className="conn">
//               {otherConnections.length > 0 ? (
//                 otherConnections.map((connection, index) => (
//                   <div
//                     key={connection.connection_type_id}
//                     className="viewlockerconnections"
//                     onClick={() => handleConnectionClick(connection)}
//                   >
//                     <h4 id="connectiontype">
//                       {" "}
//                       <div>
//                         <u>
//                           {connection.connection_type_name}
//                         </u>{" "}
//                         ( users: {connection.incoming_count} )
//                       </div>
//                     </h4>
//                   </div>
//                 ))
//               ) : (
//                 <p>No connections found.</p>
//               )}
//             </div>

//             <h4 id="headingconnection">Outgoing Connections</h4>
//             <div className="conn">
//               {connections.outgoing_connections.length > 0 ? (
//                 connections.outgoing_connections.map((connection, index) => {
//                   const tracker = trackerData[connection.connection_id];
//                   const color = tracker ? getStatusColor(tracker) : "gray";
//                   const ratio = tracker
//                     ? calculateRatio(tracker)
//                     : "Loading...";

//                   return (
//                     <div
//                       key={connection.connection_id}
//                       className="viewlockerconnections"
//                     >
//                       <div id="conntent">
//                         {/* Making the connection name clickable */}
//                         <button
//                           className="connection-name-button"
//                           onClick={() => handleTracker(connection)}
//                           style={{
//                             textDecoration: "underline",
//                             background: "none",
//                             border: "none",
//                             padding: 0,
//                             cursor: "pointer",
//                             color: "inherit",
//                           }}
//                         >
//                           {connection.connection_name}
//                         </button>
//                       </div>
//                       <div id="conntent">
//                         {connection.host_user.username} &lt;&gt;{" "}
//                         {connection.guest_user.username}
//                       </div>
//                       <div id="conntent">
//                         Created On:{" "}
//                         {new Date(connection.created_time).toLocaleString()}
//                       </div>
//                       <div id="conntent">
//                         Valid Until:{" "}
//                         {new Date(connection.validity_time).toLocaleString()}
//                       </div>
//                       <div className="Lockertracker">
//                         <button
//                           className="info-button"
//                           onClick={() => handleInfo(connection)}
//                         >
//                           {" "}
//                           i{" "}
//                         </button>
//                         <button
//                           onClick={() => handleTracker(connection)}
//                           style={{ backgroundColor: color }}
//                         >
//                           {ratio}
//                         </button>
//                       </div>
//                     </div>
//                   );
//                 })
//               ) : (
//                 <p>No outgoing connections found.</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

//tabcode
import React, { useContext, useEffect, useState } from "react";
import "./page3.css";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useLocation, useParams } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
import QRCode from "react-qr-code";

export const ViewLocker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locker = location.state ? location.state.locker : null;

  const [isOpen, setIsOpen] = useState(false);
  const { curruser, setUser } = useContext(usercontext);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);
  const [connections, setConnections] = useState({
    incoming_connections: [],
    outgoing_connections: [],
  });
  const [otherConnections, setOtherConnections] = useState([]);
  const [trackerData, setTrackerData] = useState({});

  const [VnodeResources, setVnodeResources] = useState([]);
  const [activeTab, setActiveTab] = useState("incoming");


  useEffect(() => {
    if (locker) {
      fetchConnectionsAndOtherConnections(); // Combine the two fetches
      fetchResources(); // Keep resources fetch separate
      fetchVnodeResources();
    }
  }, [locker]);

  console.log("locker", locker);
  console.log("resources", resources);
  const fetchConnectionsAndOtherConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ locker_name: locker.name });

      // Fetch connections
      const [connectionsResponse, otherConnectionsResponse] = await Promise.all(
        [
          fetch(
            `host/get-connections-user-locker/?${params}`.replace(
              /host/,
              frontend_host
            ),
            {
              method: "GET",
              headers: {
                Authorization: `Basic ${token}`,
                "Content-Type": "application/json",
              },
            }
          ),
          fetch(
            `host/connection_types/?${params}`.replace(/host/, frontend_host),
            {
              method: "GET",
              headers: {
                Authorization: `Basic ${token}`,
                "Content-Type": "application/json",
              },
            }
          ),
        ]
      );

      // Handle connections response
      if (!connectionsResponse.ok)
        throw new Error("Failed to fetch connections");
      const connectionsData = await connectionsResponse.json();
      if (connectionsData.success) {
        setConnections(connectionsData.connections);
        fetchAllTrackerData(connectionsData.connections.outgoing_connections);

        // Count incoming connections for each connection type
        const incomingConnectionCounts = {};
        connectionsData.connections.incoming_connections.forEach(
          (connection) => {
            const typeId = connection.connection_type;
            if (incomingConnectionCounts[typeId]) {
              incomingConnectionCounts[typeId]++;
            } else {
              incomingConnectionCounts[typeId] = 1;
            }
          }
        );

        // Handle other connections response
        if (!otherConnectionsResponse.ok)
          throw new Error("Failed to fetch other connections");
        const otherConnectionsData = await otherConnectionsResponse.json();
        if (otherConnectionsData.success) {
          // Update otherConnections with the count of incoming connections
          setOtherConnections(
            otherConnectionsData.connection_types.map((connection) => ({
              ...connection,
              incoming_count:
                incomingConnectionCounts[connection.connection_type_id] || 0,
            }))
          );
        } else {
          setError(
            otherConnectionsData.message || "Failed to fetch other connections"
          );
        }
      } else {
        setError(connectionsData.message || "Failed to fetch connections");
      }
    } catch (error) {
      console.error("Error fetching connections and other connections:", error);
      setError(
        "An error occurred while fetching connections or other connections"
      );
    }
  };

  const fetchResources = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ locker_name: locker.name });
      const response = await fetch(
        `host/get-resources-user-locker/?${params}`.replace(
          /host/,
          frontend_host
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }
      const data = await response.json();
      console.log("resour", data);
      if (data.success) {
        setResources(data.resources);
      } else {
        setError(data.message || "Failed to fetch resources");
      }
    } catch (error) {
      console.error("Error fetching resources:", error);
      setError("An error occurred while fetching resources");
    }
  };
  console.log(locker);
  const fetchVnodeResources = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ host_locker_id: locker.locker_id });

      const response = await fetch(
        `host/get-vnodes/?${params}`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }

      const data = await response.json();
      console.log("data", data);
      console.log("vnodes", data.data);

      //if (data.success) {
      setVnodeResources(data.data);
      //} else {
      //setError(data.message || "Failed to fetch resources");
      //}
      //}
    } catch (error) {
      console.error("Error fetching resources:", error);
      setError("An error occurred while fetching resources");
    }
  };

  const fetchAllTrackerData = (outgoingConnections) => {
    outgoingConnections.forEach((connection) => {
      fetchTrackerData(connection);
    });
  };

  const fetchTrackerData = async (connection) => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        connection_name: connection.connection_name,
        host_locker_name: connection.host_locker.name,
        guest_locker_name: connection.guest_locker.name,
        host_user_username: connection.host_user.username,
        guest_user_username: connection.guest_user.username,
      });
      const response = await fetch(
        `host/get-terms-status/?${params}`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tracker data");
      }
      const data = await response.json();
      if (data.success) {
        // console.log("view locker", data);
        setTrackerData((prevState) => ({
          ...prevState,
          [connection.connection_id]: {
            count_T: data.count_T,
            count_F: data.count_F,
            count_R: data.count_R,
            filled: data.filled,
            empty: data.empty,
          },
        }));
      } else {
        setError(data.message || "Failed to fetch tracker data");
      }
    } catch (error) {
      console.error("Error fetching tracker data:", error);
      setError("An error occurred while fetching tracker data");
    }
  };

  const getStatusColor = (tracker) => {
    const totalObligations =
      tracker.count_T + tracker.count_F + tracker.count_R;
    if (tracker.count_T === totalObligations && tracker.count_R === 0) {
      return "green";
    } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
      return "red";
    } else {
      return "orange";
    }
  };

  const calculateRatio = (tracker) => {
    const totalObligations =
      tracker.count_T + tracker.count_F + tracker.count_R;
    return totalObligations > 0
      ? `${tracker.filled}/${totalObligations}`
      : "0/0";
  };

  const handleUploadResource = () => {
    navigate("/upload-resource", { state: { locker } });
  };

  const handleResourceClick = (filePath) => {
    const url = `host/media/${filePath}`.replace(/host/, frontend_host);
    window.open(url, "_blank");
  };

  const handleNewLockerClick = () => {
    navigate("/create-locker");
  };

  const handleTracker = (connection) => {
    navigate("/view-terms-by-type", {
      state: {
        connectionName: connection.connection_name,
        hostLockerName: connection.host_locker?.name,
        guestLockerName: connection.guest_locker?.name,
        hostUserUsername: connection.host_user?.username,
        guestUserUsername: connection.guest_user?.username,
        locker: locker,
      },
    });
  };

  const handleDocsClick = () => {
    console.log("Open Docs button clicked");
  };

  const handleEducationClick = () => {
    console.log("Open Education button clicked");
    navigate("/view-locker");
  };

  const handleConnectionClick = (connection) => {
    navigate("/show-guest-users", { state: { connection, locker } });
  };
  const handleInfo = (connection) => {
    // Split the connection_name by the hyphen and take the last part as the connection_type_name
    const connectionTypeName = connection.connection_name
      .split("-")
      .shift()
      .trim();
      console.log("conntype",connectionTypeName)

    console.log("Navigating with state:", {
      connectionName: connection.connection_name,
      hostLockerName: connection.host_locker?.name,
      connectionTypeName, // Pass the extracted connection_type_name
      hostUserUsername: connection.host_user?.username,
      locker: locker,
    });

    navigate("/show-connection-terms", {
      state: {
        connectionName: connection.connection_name,
        hostLockerName: connection.host_locker?.name,
        connectionTypeName, // Pass the extracted connection_type_name
        hostUserUsername: connection.host_user?.username,
        locker: locker,
      },
    });
  };

  const content = (
    <>
      <div className="navbarBrand">
        {locker ? `Locker: ${locker.name}` : "Locker"}
      </div>
    </>
  );
  console.log("res vnode", VnodeResources);
  console.log("res", resources);

  return (
    <div>
      <Navbar content={content} lockerAdmin={true} lockerObj={locker} />
      <div className="container">
        <div className="locker-description">
          {locker ? ` ${locker.description}` : "Description"}
        </div>
        <div className="locker-name">
          <QRCode title="Locker QR Code" value={locker.name} size={100} />
        </div>
        <div className="container-2 clearfix">
          <div className="a">
            <div className="res">
              <h3>Resources</h3>
            </div>
            <div className="container-3 clearfix">
              <div className="aa">
                {resources.length > 0 ? (
                  resources.map((resource, index) => (
                    <div key={resource.resource_id} className="resource-item">
                      <div className="resource-details">
                        <div
                          id="documents"
                          onClick={() =>
                            handleResourceClick(resource.i_node_pointer)
                          }
                        >
                          {resource.document_name}
                        </div>
                        <div className="public-private">
                          {resource.type === "private" ? (
                            <>Private</>
                          ) : (
                            "Public"
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="not-found">No resources found.</p>
                )}

                {VnodeResources.length > 0 ? (
                  [...VnodeResources].map((resource, index) => (
                    <div
                      key={resource.resource.resource_id}
                      className="resource-item"
                    >
                      <div className="resource-details">
                        <div
                          id="documents-byShare"
                          onClick={() =>
                            handleResourceClick(resource.resource.i_node_pointer)
                          }
                        >
                          {resource.resource.document_name}
                        </div>
                        <div className="public-private">
                          {resource.resource.type === "private" ? (
                            <>Private</>
                          ) : (
                            "Public"
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="not-found"></p>
                )}
              </div>
            </div>
            <button className="page3button" onClick={handleUploadResource}>
              Upload resource
            </button>
          </div>
          <div className="b">
            <h3 id="mycon">My Connections:</h3>
            <div className="tabs">
              <div className={`tab-header ${activeTab === 'incoming' ? 'active' : ''}`} onClick={() => setActiveTab('incoming')}>
                Incoming Connections
              </div>
              <div className={`tab-header ${activeTab === 'outgoing' ? 'active' : ''}`} onClick={() => setActiveTab('outgoing')}>
                Outgoing Connections
              </div>
            </div>
            <div className="tab-content">
              {activeTab === 'incoming' && (
                <div className="tab-panel">
                  <h4 id="headingconnection">Incoming Connection types</h4>
                  <div className="conn">
                    {otherConnections.length > 0 ? (
                      otherConnections.map((connection, index) => (
                        <div
                          key={connection.connection_type_id}
                          className="viewlockerconnections"
                          onClick={() => handleConnectionClick(connection)}
                        >
                          <h4 id="connectiontype">
                            <div>
                              <u>{connection.connection_type_name}</u>{" "}
                              ( users: {connection.incoming_count} )
                            </div>
                          </h4>
                        </div>
                      ))
                    ) : (
                      <p>No connections found.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'outgoing' && (
                <div className="tab-panel">
                  <h4 id="headingconnection">Outgoing Connections</h4>
                  <div className="conn">
                    {connections.outgoing_connections.length > 0 ? (
                      connections.outgoing_connections.map((connection, index) => {
                        const tracker = trackerData[connection.connection_id];
                        const color = tracker ? getStatusColor(tracker) : "gray";
                        const ratio = tracker
                          ? calculateRatio(tracker)
                          : "Loading...";

                        return (
                          <div
                            key={connection.connection_id}
                            className="viewlockerconnections"
                          >
                            <div id="conntent">
                              <button
                                className="connection-name-button"
                                onClick={() => handleTracker(connection)}
                                style={{
                                  textDecoration: "underline",
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  color: "inherit",
                                }}
                              >
                                {connection.connection_name}
                              </button>
                            </div>
                            <div id="conntent">
                              {connection.guest_user.username} &lt;&gt;{" "}
                              {connection.host_user.username}
                            </div>
                            <div id="conntent">
                              Created On:{" "}
                              {new Date(connection.created_time).toLocaleString()}
                            </div>
                            <div id="conntent">
                              Valid Until:{" "}
                              {new Date(connection.validity_time).toLocaleString()}
                            </div>
                            <div className="Lockertracker">
                              <button
                                className="info-button"
                                onClick={() => handleInfo(connection)}
                              >
                                {" "}
                                i{" "}
                              </button>
                              <button
                                onClick={() => handleTracker(connection)}
                                style={{ backgroundColor: color }}
                              >
                                {ratio}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p>No outgoing connections found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};