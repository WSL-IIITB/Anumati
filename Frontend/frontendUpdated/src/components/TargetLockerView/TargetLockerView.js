// import React, { useContext, useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import "./page7.css";
// import Navbar from "../Navbar/Navbar";

// export const TargetLockerView = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser, setUser } = useContext(usercontext);
//   const [parentUser, setParentUser] = useState(
//     location.state ? location.state.user : null
//   );
//   const [resources, setResources] = useState([]);
//   const [otherConnections, setOtherConnections] = useState([]);
//   const [locker, setLocker] = useState(
//     location.state ? location.state.locker : null
//   );
//   const [error, setError] = useState(null);
//   const [outgoingConnections, setOutgoingConnections] = useState([]); // State for outgoing connections
//   const [trackerData, setTrackerData] = useState({}); // State for tracker data

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }
//     if (parentUser && locker) {
//       fetchResources();
//       fetchOtherConnections();
//       fetchConnections(); // Fetch connections when component mounts
//     }
//   }, [curruser, navigate, parentUser, locker]);

//   const fetchResources = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         locker_name: locker.name,
//         username: parentUser.username,
//       });
//       const response = await fetch(
//         `localhost:8000/get-public-resources?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       if (data.success) {
//         setResources(data.resources);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching resources");
//     }
//   };

//   const fetchOtherConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         guest_username: parentUser.username,
//         guest_locker_name: locker.name,
//       });
//       const response = await fetch(
//         `localhost:8000/get-other-connection-types/?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       console.log("other types", data);
//       if (data.success) {
//         setOtherConnections(data.connection_types);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching other connections");
//     }
//   };

//   const fetchConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         host_username: parentUser.username,
//         host_locker_name: locker.name,
//       });
//       const response = await fetch(
//         `localhost:8000/get-outgoing-connections/?${params}`,
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to fetch connections");
//       }

//       const data = await response.json();
//       if (data.success) {
//         console.log("Fetched connections:", data.connections); // Debugging output
//         setOutgoingConnections(data.connections);
//         data.connections.forEach((connection) => fetchTrackerData(connection)); // Fetch tracker data for each connection
//       } else {
//         setError(data.message || "Failed to fetch connections");
//       }
//     } catch (error) {
//       console.error("Error fetching connections:", error);
//       setError("An error occurred while fetching connections");
//     }
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
//         `localhost:8000/get-terms-status/?${params}`,
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
//       }
//     } catch (error) {
//       console.error("Error fetching tracker data:", error);
//     }
//   };

//   const handleClick = () => {
//     navigate("/make-connection", {
//       state: { hostuser: parentUser, hostlocker: locker },
//     });
//   };

//   const handleResourceClick = (filePath) => {
//     const url = `localhost:8000/media/${filePath}`;
//     window.open(url, "_blank");
//   };

//   const handleTracker = (connection) => {
//     navigate("/view-terms-by-type", {
//       state: {
//         connection_name: connection.connection_name,
//         host_locker_name: connection.host_locker.name,
//         guest_locker_name: connection.guest_locker.name,
//         host_user_username: connection.host_user.username,
//         guest_user_username: connection.guest_user.username,
//       },
//     });
//   };

//   const getStatusColor = (tracker) => {
//     const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
//     if (tracker.count_T === totalObligations && tracker.count_R === 0 ) {
//       return "green";
//     } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
//       return "red";
//     } else {
//       return "orange";
//     }
//   };

//   const calculateRatio = (tracker) => {
//     const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
//     return totalObligations > 0
//       ? `${tracker.filled}/${totalObligations}`
//       : "0/0";
//   };


//   const content = (
//     <>
//       <div className="navbarBrand">{locker?.name}</div>
//       <div className="description7">
//         Owner:<u>{parentUser?.username}</u>
//       </div>
//     </>
//   );

//   const handleConnectionClick = (connection) => {
//     console.log("Navigating to make-connection with:", connection);
//     navigate("/make-connection", {
//       state: {
//         hostuser: parentUser,
//         hostlocker: locker,
//         selectedConnectionType: connection,
//       },
//     });
//   };

//   return (
//     <div>
//       <Navbar content={content} />
//       <div className="page7description">
//         <div className="descriptionpage7">{locker?.description}</div>
//         <button onClick={handleClick} className="new-connection-btn">
//           Create New Connection
//         </button>
//       </div>
//       <div className="page7container">
//         <div className="notvisible">
//           <div className="page7publicresources">
//             <p>Public resources: Resources for all</p>
//             {resources.length > 0 ? (
//               resources.map((resource) => (
//                 <div className="page7resource" key={resource.id}>
//                   <div
//                     id="documentspage7"
//                     onClick={() => handleResourceClick(resource.i_node_pointer)}
//                   >
//                     {resource.document_name}
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="page7nores">No resources found.</p>
//             )}
//           </div>

//           <div className="page7publicresources">
//             <p>Available Connection Types</p>
//             {otherConnections.length > 0 ? (
//               otherConnections.map((connection) => (
//                 <div
//                   className="page7connection"
//                   key={connection.connection_type_id}
//                 >
//                   <div id="connectionpage7">
//                     <div
//                       onClick={() => handleConnectionClick(connection)}
//                     >
//                       <h4 className="clickable-tag">
//                         <u>{connection.connection_type_name}</u>
//                       </h4>
//                     </div>
//                     <div id="availconntype">
//                       {connection.connection_description}
//                     </div>
//                     <div id="availconntype">
//                       Created On:{" "}
//                       {new Date(connection.created_time).toLocaleDateString()}
//                     </div>
//                     <div id="availconntype">
//                       Valid Until:{" "}
//                       {new Date(connection.validity_time).toLocaleDateString()}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="noconnfound">No available connection type found.</p>
//             )}
//           </div>
//         </div>
//         <div className="page7containerB">
//           <p>
//             My connections: {locker?.name} :: {parentUser?.username}
//           </p>
//           {outgoingConnections.length > 0 ? (
//   outgoingConnections.map((connection, index) => {
//     const tracker = trackerData[connection.connection_id];
//     const color = tracker ? getStatusColor(tracker) : "gray";
//     const ratio = tracker ? calculateRatio(tracker) : "Loading...";

//     return (
//       <div className="page7myconnections" key={index}>
//         <div id="conntent">
//           <h2>{connection.connection_name}</h2>
//           <div>{connection.host_locker.name} &lt;&gt; {connection.guest_locker.name}</div>
//           <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
//           <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
//         </div>
//         <div className="tracker">
//           <button
//             onClick={() => handleTracker(connection)}
//             style={{ backgroundColor: color }}
//           >
//             {ratio}
//           </button>
//         </div>
//       </div>
//     );
//   })
// ) : (
//   <p id="noconnfound">No outgoing connections found.</p>
// )}

//         </div>
//       </div>
//     </div>
//   );
// };
//recentcode
// import React, { useContext, useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import "./page7.css";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";
// import Modal from '../Modal/Modal.jsx';

// export const TargetLockerView = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser, setUser } = useContext(usercontext);
//   const [parentUser, setParentUser] = useState(
//     location.state ? location.state.user : null
//   );
//   const [resources, setResources] = useState([]);
//   const [otherConnections, setOtherConnections] = useState([]);
//   const [locker, setLocker] = useState(
//     location.state ? location.state.locker : null
//   );
//   const [error, setError] = useState(null);

//   const [outgoingConnections, setOutgoingConnections] = useState([]); // State for outgoing connections
//   const [trackerData, setTrackerData] = useState({}); // State for tracker data
//   const [modalMessage, setModalMessage] = useState({message: "", type: ""});
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }
//     if (parentUser && locker) {
//       fetchResources();
//       fetchOtherConnections();
//       fetchConnections();
//     }
//   }, [curruser, navigate, parentUser, locker]);

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setModalMessage({message: "", type: ""});
//   };

//   const fetchResources = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         locker_name: locker.name,
//         username: parentUser.username,
//       });
//       const response = await fetch(
//         `host/get-public-resources?${params}`.replace(/host/, frontend_host),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       if (data.success) {
//         setResources(data.resources);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching resources");
//     }
//   };

//   const fetchOtherConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         guest_username: parentUser.username,
//         guest_locker_name: locker.name,
//       });
//       const response = await fetch(
//         `host/get-other-connection-types/?${params}`.replace(/host/, frontend_host),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       if (data.success) {
//         setOtherConnections(data.connection_types);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching other connections");
//     }
//   };

//   const fetchConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         host_username: parentUser.username,
//         host_locker_name: locker.name,
//       });
//       const response = await fetch(
//         `host/get-outgoing-connections/?${params}`.replace(/host/, frontend_host),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to fetch connections");
//       }

//       const data = await response.json();
//       if (data.success) {
//         setOutgoingConnections(data.connections);

//         data.connections.forEach((connection) => fetchTrackerData(connection)); // Fetch tracker data for each connection

//       } else {
//         setError(data.message || "Failed to fetch connections");
//       }
//     } catch (error) {
//       console.error("Error fetching connections:", error);
//       setError("An error occurred while fetching connections");
//     }
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

//       }
//        else {
//         setError(data.message || "Failed to fetch tracker data");
//       }
//     } catch (error) {
//       console.error("Error fetching tracker data:", error);
//       setError("An error occurred while fetching tracker data");

//     }
//   };

//   const handleClick = () => {
//     if(otherConnections.length > 0){
//       navigate("/make-connection", {
//         state: { hostuser: parentUser, hostlocker: locker, selectedConnectionType: null, },
//       });
//     }
//     else{
//       setModalMessage({ message: "No available connection types found. Cannot create a new connection.", type: 'info' });
//       setIsModalOpen(true);
//     }
//   };

//   const handleResourceClick = (filePath) => {
//     const url = `host/media/${filePath}`.replace(/host/, frontend_host);
//     window.open(url, "_blank");
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

//   const getStatusColor = (tracker) => {
//     const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
//     if (tracker.count_T === totalObligations && tracker.count_R === 0 ) {

//       return "green";
//     } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
//       return "red";
//     } else {
//       return "orange";
//     }
//   };

//   const calculateRatio = (tracker) => {
//     const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
//     return totalObligations > 0
//       ? `${tracker.filled}/${totalObligations}`
//       : "0/0";
//   };

//   const content = (
//     <>
//       <div className="navbarBrand">{locker?.name}</div>
//       <div className="description7">
//         Owner:<u>{parentUser?.username}</u>
//       </div>
//     </>
//   );

//   const handleInfo = (connection) => {
//     const connectionTypeName = connection.connection_name.split('-').pop().trim();
//     navigate("/show-connection-terms", {
//       state: {
//         //connectionId: connection.connection_id,
//         connectionName: connection.connection_name,
//         hostLockerName: connection.host_locker?.name,
//         guestLockerName: connection.guest_locker?.name,
//         hostUserUsername: connection.host_user?.username,
//         guestUserUsername: connection.guest_user?.username,
//         locker: locker,
//         connectionTypeName,
//       },
//     });
//   };

//   const handleConnectionClick = (connection) => {
//     navigate("/make-connection", {
//       state: {
//         hostuser: parentUser,
//         hostlocker: locker,
//         selectedConnectionType: connection,
//       },
//     });
//   };

//   return (

//     <div>
//       <>{isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}</>
//       <Navbar content={content} />
//       <div className="page7description">
//         <div className="descriptionpage7">{locker?.description}</div>
//         <button onClick={handleClick} className="new-connection-btn-1">
//           Create New Connection
//         </button>
//       </div>
//       <div className="page7container">
//         <div className="notvisible">
//           <div className="page7publicresources">
//             <p>Public resources: Resources for all</p>
//             {resources.length > 0 ? (
//               resources.map((resource) => (
//                 <div className="page7resource" key={resource.resource_id}>
//                   <div
//                     id="documentspage7"
//                     onClick={() => handleResourceClick(resource.i_node_pointer)}
//                   >
//                     {resource.document_name}
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="page7nores">No resources found.</p>
//             )}
//           </div>

//           <div className="page7publicresources">
//             <p>Available Connection Types</p>
//             {otherConnections.length > 0 ? (
//               otherConnections.map((connection) => (
//                 <div className="page7connection" key={connection.connection_type_id}>
//                   <div id="connectionpage7">
//                     <div
//                       onClick={() => handleConnectionClick(connection)}
//                     >
//                       <h4 className="clickable-tag">
//                         <u>{connection.connection_type_name}</u>

//                       </h4>
//                     </div>
//                     <div id="availconntype">
//                       Description: {connection.connection_description}
//                     </div>
//                     <div id="availconntype">
//                       Created On: {new Date(connection.created_time).toLocaleDateString()}
//                     </div>
//                     <div id="availconntype">
//                       Valid Until: {new Date(connection.validity_time).toLocaleDateString()}
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="noconnfound">No available connection type found.</p>
//             )}
//           </div>
//         </div>
//         <div className="page7containerB">
//           <p>
//             {/* My connections: {locker?.name} :: {parentUser?.username} */}
//             My connections with {locker?.name} locker of {parentUser?.username}: 
//           </p>
//           {outgoingConnections.length > 0 ? (
//   outgoingConnections.map((connection, index) => {
//     const tracker = trackerData[connection.connection_id];
//     const color = tracker ? getStatusColor(tracker) : "gray";
//     const ratio = tracker ? calculateRatio(tracker) : "Loading...";

//     return (
//       <div className="page7myconnections" key={index}>
//         <div id="conntent">
//           <h2
//             onClick={() => handleTracker(connection)}
//             style={{ textDecoration: "underline", cursor: "pointer" }}
//           >
//             {connection.connection_name}
//           </h2>
//           <div>
//             {connection.host_user.username} &lt;&gt;{" "}
//             {connection.guest_user.username}
//           </div>
//           <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
//           <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
//         </div>
//         <div className="tracker">
//         <button className="info-button1" onClick={() => handleInfo(connection)}> i </button>

//           <button
//             onClick={() => handleTracker(connection)}
//             style={{ backgroundColor: color }}
//           >
//             {ratio}
//           </button>
//         </div>
//       </div>
//     );
//   })
// ) : (
//   <p id="noconnfound">No outgoing connections found.</p>
// )}

//         </div>
//       </div>
//     </div>

//   );
// };
// import React, { useContext, useEffect, useState } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Cookies from "js-cookie";
// import "./page7.css";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";
// import Modal from '../Modal/Modal.jsx';
// import QRCode from "react-qr-code";

// export const TargetLockerView = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser, setUser } = useContext(usercontext);
//   const [parentUser, setParentUser] = useState(
//     location.state ? location.state.user : null
//   );
//   const [resources, setResources] = useState([]);
//   const [otherConnections, setOtherConnections] = useState([]);
//   const [locker, setLocker] = useState(
//     location.state ? location.state.locker : null
//   );
//   const [error, setError] = useState(null);

//   const [outgoingConnections, setOutgoingConnections] = useState([]); // State for outgoing connections
//   const [trackerData, setTrackerData] = useState({}); // State for tracker data
//   const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [qrData, setQrData] = useState("");  // State for QR code data

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }
//     if (parentUser && locker) {
//       fetchResources();
//       fetchOtherConnections();
//       fetchConnections();
//     }
//   }, [curruser, navigate, parentUser, locker]);

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setModalMessage({ message: "", type: "" });
//     setQrData("");  // Reset QR code data when modal is closed
//   };

//   const fetchResources = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         locker_name: locker.name,
//         username: parentUser.username,
//       });
//       const response = await fetch(
//         `host/get-public-resources?${params}`.replace(/host/, frontend_host),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       if (data.success) {
//         setResources(data.resources);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching resources");
//     }
//   };

//   const fetchOtherConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         guest_username: parentUser.username,
//         guest_locker_name: locker.name,
//       });
//       const response = await fetch(
//         `host/get-other-connection-types/?${params}`.replace(/host/, frontend_host),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       const data = await response.json();
//       if (data.success) {
//         setOtherConnections(data.connection_types);
//       } else {
//         setError(data.message);
//       }
//     } catch (error) {
//       setError("An error occurred while fetching other connections");
//     }
//   };

//   const fetchConnections = async () => {
//     try {
//       const token = Cookies.get("authToken");
//       const params = new URLSearchParams({
//         host_username: parentUser.username,
//         host_locker_name: locker.name,
//       });
//       const response = await fetch(
//         `host/get-outgoing-connections/?${params}`.replace(/host/, frontend_host),
//         {
//           method: "GET",
//           headers: {
//             Authorization: `Basic ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       if (!response.ok) {
//         throw new Error("Failed to fetch connections");
//       }

//       const data = await response.json();
//       if (data.success) {
//         setOutgoingConnections(data.connections);

//         data.connections.forEach((connection) => fetchTrackerData(connection)); // Fetch tracker data for each connection

//       } else {
//         setError(data.message || "Failed to fetch connections");
//       }
//     } catch (error) {
//       console.error("Error fetching connections:", error);
//       setError("An error occurred while fetching connections");
//     }
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

//       }
//        else {
//         setError(data.message || "Failed to fetch tracker data");
//       }
//     } catch (error) {
//       console.error("Error fetching tracker data:", error);
//       setError("An error occurred while fetching tracker data");

//     }
//   };

//   const handleClick = () => {
//     if(otherConnections.length > 0){
//       navigate("/make-connection", {
//         state: { hostuser: parentUser, hostlocker: locker, selectedConnectionType: null, },
//       });
//     }
//     else{
//       setModalMessage({ message: "No available connection types found. Cannot create a new connection.", type: 'info' });
//       setIsModalOpen(true);
//     }
//   };

//   const handleResourceClick = (filePath) => {
//     const url = `host/media/${filePath}`.replace(/host/, frontend_host);
//     window.open(url, "_blank");
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

//   const getStatusColor = (tracker) => {
//     const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
//     if (tracker.count_T === totalObligations && tracker.count_R === 0 ) {

//       return "green";
//     } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
//       return "red";
//     } else {
//       return "orange";
//     }
//   };

//   const calculateRatio = (tracker) => {
//     const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
//     return totalObligations > 0
//       ? `${tracker.filled}/${totalObligations}`
//       : "0/0";
//   };

//   const handleInfo = (connection) => {
//         const connectionTypeName = connection.connection_name.split('-').pop().trim();
//         navigate("/show-connection-terms", {
//           state: {
//             //connectionId: connection.connection_id,
//             connectionName: connection.connection_name,
//             hostLockerName: connection.host_locker?.name,
//             guestLockerName: connection.guest_locker?.name,
//             hostUserUsername: connection.host_user?.username,
//             guestUserUsername: connection.guest_user?.username,
//             locker: locker,
//             connectionTypeName,
//           },
//         });
//       };

//   const handleConnectionClick = (connection) => {
//     navigate("/make-connection", {
//       state: {
//         hostuser: parentUser,
//         hostlocker: locker,
//         selectedConnectionType: connection,
//       },
//     });
//   };

//   // Function to handle showing the QR code
//   const handleShowQrCode = (connection) => {
//     const qrContent = JSON.stringify({
//       connection_type_name: connection.connection_type_name,
//       connection_description: connection.connection_description,
//       host_username: parentUser.username,
//       host_locker_name: locker.name,
//     });

//     setQrData(qrContent); // Set the QR code data with relevant information
//     setIsModalOpen(true); // Open the modal with QR code
//   };
//   const handleQrScan = (qrData) => {
//     try {
//       const parsedData = JSON.parse(qrData); // Parse the QR content

//       // Navigate to the terms page with the parsed data
//       navigate('/show-connection-terms', {
//         state: {
//           connectionTypeName: parsedData.connection_type_name,
//           connectionDescription: parsedData.connection_description,
//           locker: locker,
//           hostUserUsername: parsedData.host_username,
//           hostLockerName: parsedData.host_locker_name,
//           connectionName: `${parsedData.connection_type_name}-${curruser.username}:${parsedData.host_username}`,
//         }
//       });
//     } catch (error) {
//       console.error("Error parsing QR data:", error);
//     }
//   };



//   return (
//     <div>
//       {isModalOpen && (
//         <Modal message={modalMessage.message || <QRCode value={qrData} />} onClose={handleCloseModal} type={modalMessage.type || "info"} />
//       )}
//       <Navbar content={<>
//         <div className="navbarBrand">{locker?.name}</div>
//         <div className="description7">Owner:<u>{parentUser?.username}</u></div>
//       </>} />

//       <div className="page7description">
//         <div className="descriptionpage7">{locker?.description}</div>
//         <button onClick={handleClick} className="new-connection-btn-1">Create New Connection</button>
//       </div>

//       <div className="page7container">
//         <div className="notvisible">
//           <div className="page7publicresources">
//             <p>Public resources: Resources for all</p>
//             {resources.length > 0 ? (
//               resources.map((resource) => (
//                 <div className="page7resource" key={resource.resource_id}>
//                   <div id="documentspage7" onClick={() => handleResourceClick(resource.i_node_pointer)}>
//                     {resource.document_name}
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="page7nores">No resources found.</p>
//             )}
//           </div>

//           <div className="page7publicresources">
//             <p>Available Connection Types</p>
//             {otherConnections.length > 0 ? (
//               otherConnections.map((connection) => (
//                 <div className="page7connection" key={connection.connection_type_id}>
//                   <div id="connectionpage7">
//                     <div onClick={() => handleConnectionClick(connection)}>
//                       <h4 className="clickable-tag"><u>{connection.connection_type_name}</u></h4>
//                     </div>
//                     <div id="availconntype">
//                       Description: {connection.connection_description}
//                     </div>
//                     <div id="availconntype">
//                       Created On: {new Date(connection.created_time).toLocaleDateString()}
//                     </div>
//                     <div id="availconntype">
//                       Valid Until: {new Date(connection.validity_time).toLocaleDateString()}
//                     </div>
//                     {/* "Scan QR" link to show QR code */}
//                     <div id="availconntype">
//                       <button onClick={() => handleShowQrCode(connection)}>Scan QR</button>

//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p id="noconnfound">No available connection type found.</p>
//             )}
//           </div>
//         </div>

//         <div className="page7containerB">
//           <p>My connections with {locker?.name} locker of {parentUser?.username}: </p>
//           {outgoingConnections.length > 0 ? (
//             outgoingConnections.map((connection, index) => {
//               const tracker = trackerData[connection.connection_id];
//               const color = tracker ? getStatusColor(tracker) : "gray";
//               const ratio = tracker ? calculateRatio(tracker) : "Loading...";

//               return (
//                 <div className="page7myconnections" key={index}>
//                   <div id="conntent">
//                     <h2 onClick={() => handleTracker(connection)} style={{ textDecoration: "underline", cursor: "pointer" }}>
//                       {connection.connection_name}
//                     </h2>
//                     <div>{connection.host_user.username} &lt;&gt; {connection.guest_user.username}</div>
//                     <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
//                     <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
//                   </div>
//                   <div className="tracker">
//                     <button className="info-button1" onClick={() => handleInfo(connection)}> i </button>
//                     <button onClick={() => handleTracker(connection)} style={{ backgroundColor: color }}>
//                       {ratio}
//                     </button>
//                   </div>
//                 </div>
//               );
//             })
//           ) : (
//             <p id="noconnfound">No outgoing connections found.</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };


import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import "./page7.css";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
import Modal from '../Modal/Modal.jsx';
import QRCode from "react-qr-code";
import { Grid, Box, Button } from '@mui/material'
import { Tooltip } from 'react-tooltip';
import ReactModal from "react-modal";
import Sidebar from "../Sidebar/Sidebar.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
// import pdfWorker from "pdfjs-dist/build/pdf.worker.min.js"
import { Viewer, Worker } from "@react-pdf-viewer/core"; // PDF Viewer

export const TargetLockerView = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser, setUser } = useContext(usercontext);
  const [parentUser, setParentUser] = useState(
    location.state ? location.state.user : null
  );
  const [pdfUrl, setPdfUrl] = useState(null);
  const [resources, setResources] = useState([]);
  const [otherConnections, setOtherConnections] = useState([]);
  const [locker, setLocker] = useState(
    location.state ? location.state.locker : null
  );
  const [error, setError] = useState(null);
  const [outgoingConnections, setOutgoingConnections] = useState([]); // State for outgoing connections
  const [trackerData, setTrackerData] = useState({}); // State for tracker data
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [qrData, setQrData] = useState("");  // State for QR code data
  const [xnodes, setXnodes] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showInfo, setShowInfo] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [trackerDataReverse, setTrackerDataReverse] = useState({});
  console.log("pdfUrl", pdfUrl)
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
      navigate("/");
      return;
    }
    if (parentUser && locker) {
      fetchResources();
      fetchOtherConnections();
      fetchConnections();
      fetchXnodes();
    }
  }, [curruser, navigate, parentUser, locker]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
    setQrData("");  // Reset QR code data when modal is closed
  };
  const handleClose = () => {
    setIsPdfModalOpen(false);
    setPdfUrl(null);
  };
  const fetchXnodes = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ locker_id: locker.locker_id });

      const response = await fetch(
        `host/get_all_xnodes_for_locker_v2/?${params}`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch Xnodes");
      }

      const data = await response.json();
      console.log("xnode data", data);

      if (data.xnode_list) {
        // Filter to include only `inode` nodetype
        const inodes = data.xnode_list.filter(node => node.xnode_Type === "INODE");
        setXnodes(inodes);
      } else {
        setError(data.message || "Failed to fetch Xnodes");
      }
    } catch (error) {
      console.error("Error fetching Xnodes:", error);
      setError("An error occurred while fetching Xnodes");
    }
  };



  const fetchResources = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        locker_name: locker.name,
        username: parentUser.username,
      });
      const response = await fetch(
        `host/get-public-resources?${params}`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setResources(data.resources);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching resources");
    }
  };

  const fetchOtherConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        guest_username: parentUser.username,
        guest_locker_name: locker.name,
      });
      const response = await fetch(
        `host/get-other-connection-types/?${params}`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setOtherConnections(data.connection_types);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching other connections");
    }
  };
  console.log(locker)
  console.log("setOtherConnections", otherConnections)

  const fetchConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({
        host_username: parentUser.username,
        host_locker_name: locker.name,
      });
      const response = await fetch(
        `host/get-outgoing-connections/?${params}`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch connections");
      }

      const data = await response.json();
      if (data.success) {
        // const filteredOutgoing = data.connections.filter(
        //   (connection) => connection.closed === false
        // );
        const filteredOutgoing = data.connections
        setOutgoingConnections(filteredOutgoing);

        data.connections.forEach((connection) => fetchTrackerData(connection));
        data.connections.forEach((connection) => fetchTrackerDataReverse(connection));


      } else {
        setError(data.message || "Failed to fetch connections");
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
      setError("An error occurred while fetching connections");
    }
  };
  console.log("outgoingConnections", outgoingConnections)

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

      }
      else {
        setError(data.message || "Failed to fetch tracker data");
      }
    } catch (error) {
      console.error("Error fetching tracker data:", error);
      setError("An error occurred while fetching tracker data");

    }
  };
  const fetchTrackerDataReverse = async (connection) => {
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
        `host/get-terms-status-reverse/?${params}`.replace(/host/, frontend_host),
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
        console.log("view locker", data);
        setTrackerDataReverse((prevState) => ({
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
  const handleClick = () => {
    if (otherConnections.length > 0) {
      navigate("/make-connection", {
        state: { hostuser: parentUser, hostlocker: locker, selectedConnectionType: null, },
      });
    }
    else {
      setModalMessage({ message: "No available connection types found. Cannot create a new connection.", type: 'info' });
      setIsModalOpen(true);
    }
  };

  const handleResourceClick = (filePath) => {
    const url = `host/media/${filePath}`.replace(/host/, frontend_host);
    window.open(url, "_blank");
  };

  const handleTracker = (connection) => {

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

  const handleTrackerHost = (connection) => {

    navigate("/host-terms-review", {
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

  const getStatusColor = (tracker) => {
    const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
    if (tracker.count_T === totalObligations && tracker.count_R === 0) {

      return "green";
    } else if (tracker.filled === 0 || tracker.count_R === totalObligations) {
      return "red";
    } else {
      return "orange";
    }
  };

  const getStatusColorReverse = (trackerReverse) => {
    const totalObligations =
      trackerReverse.count_T + trackerReverse.count_F + trackerReverse.count_R;
    if (trackerReverse.count_T === totalObligations && trackerReverse.count_R === 0) {
      return "green";
    } else if (trackerReverse.filled === 0 || trackerReverse.count_R === totalObligations) {
      return "red";
    } else {
      return "orange";
    }
  };

  const calculateRatio = (tracker) => {
    const totalObligations = tracker.count_T + tracker.count_F + tracker.count_R;
    return totalObligations > 0
      ? `${tracker.filled}/${totalObligations}`
      : "0/0";
  };

  const calculateRatioReverse = (trackerReverse) => {
    const totalObligations =
      trackerReverse.count_T + trackerReverse.count_F + trackerReverse.count_R;
    return totalObligations > 0
      ? `${trackerReverse.filled}/${totalObligations}`
      : "0/0";
  };

  const handleInfo = (connection) => {
    console.log("conn in i", connection);
    const connectionTypeName = connection.connection_name.split('-').shift().trim();
    console.log(connectionTypeName)
    console.log("lock", connection.guest_locker?.name);
    navigate("/show-connection-terms", {
      state: {
        //connectionId: connection.connection_id,
        connectionName: connection.connection_name,
        hostLockerName: connection.host_locker?.name,
        guestLockerName: connection.guest_locker?.name,
        hostUserUsername: connection.host_user?.username,
        guestUserUsername: connection.guest_user?.username,
        hostLocker: connection.host_locker,
        locker: connection.guest_locker?.name,
        connectionTypeName,
        connectionDescription: connection.connection_description,
        lockerComplete: connection.guest_locker,
      },
    });
  };
  console.log()
  const handleConnectionClick = (connection) => {
    navigate("/make-connection", {
      state: {
        hostuser: parentUser,
        hostlocker: locker,
        selectedConnectionType: connection,
      },
    });
  };

  const handleShowQrCode = (connection) => {
    const connectionName = `${connection.connection_type_name}-${curruser.username}:${parentUser.username}`;
    console.log("show qr", connection);
    const qrContent = JSON.stringify({
      connection_name: connectionName,
      connection_type_name: connection.connection_type_name,
      connection_description: connection.connection_description,
      host_username: parentUser.username,
      host_locker_name: locker.name,
    });

    console.log("QR Content Generated:", qrContent); // Debugging

    setQrData(qrContent);
    setIsModalOpen(true);
  };



  const handleQrScan = (qrData) => {
    try {
      const parsedData = JSON.parse(qrData); // Parse the QR content

      // Navigate to the "Make Connection" page with the parsed data
      navigate("/make-connection", {
        state: {
          hostuser: { username: parsedData.host_username },
          hostlocker: { name: parsedData.host_locker_name },
          selectedConnectionType: {
            connection_type_name: parsedData.connection_type_name,
            connection_description: parsedData.connection_description,
          },
        },
      });
    } catch (error) {
      console.error("Error parsing QR data:", error);
    }
  };

  const handleXnodeClick = async (xnode_id) => {

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`host/access-resource-v2/?xnode_id=${xnode_id}`.replace(
        /host/,
        frontend_host
      ), {
        method: 'GET',
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to access the resource');
      }

      const data = await response.json();
      console.log(data);
      const { link_To_File } = data;

      if (link_To_File) {
        const secureFileUrl = link_To_File.replace('http://', 'https://');
        setPdfUrl(secureFileUrl);
        // setPdfUrl(link_To_File);
        setIsPdfModalOpen(true);
      } else {
        // setError('Unable to retrieve the file link.');
        console.log(error);
      }
    } catch (err) {
      // setError(`Error: ${err.message}`);
      console.log(err);
    } finally {
      // setLoading(false);
    }
  };


  const handleTargetUserView = () => {
    console.log("parentUser", parentUser)
    navigate('/target-user-view', {
      state: {
        user: { username: parentUser.username, description: parentUser.description },
        // locker:{description:parentUser.description}
      },
    });
  }
  const firstTwoWords = locker?.description?.split(' ').slice(0, 2).join(' ') || '';


  const content = (
    <>
      <div className="navbarBrands">{locker?.name}</div>
      <div>Owner:<u>{parentUser?.username}</u></div>



      {/* <div>
        <div>
          {isExpanded ? (
            // Show full content when expanded
            <span>{locker?.description}</span>
          ) : (
            // Show only the first word with ellipsis when collapsed
            <span>
              {firstTwoWords}...
              <button
                onClick={() => setIsExpanded(true)} // Expand on click
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'blue',
                  textDecoration: 'underline',
                  marginLeft: '-10px',
                }}
              >
                Read more
              </button>
            </span>
          )}
        </div>

        {isExpanded && (
          // Show "Show less" button when content is expanded
          <button
            onClick={() => setIsExpanded(false)} // Collapse on click
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'blue',
              textDecoration: 'underline',
              marginTop: '5px',
            }}
          >
            Read less
          </button>
        )}
      </div> */}
    </>
  )

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <a className="breadcrumb-item" href="/dpi-directory">User Directory</a>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleTargetUserView(locker)} className="breadcrumb-item">TargetUserView</span>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">TargetLockerView</span>
    </div>
  )

  const handleToggle = (id) => {
    setShowInfo(showInfo === id ? null : id); // Toggle visibility
  };


  return (
    <div>
      {isModalOpen && (
        <Modal message={modalMessage.message || <QRCode value={qrData} />} onClose={handleCloseModal} type={modalMessage.type || "info"} />
      )}
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
      {/* <Navbar content={content} breadcrumbs={breadcrumbs} /> */}
      <div style={{ marginTop: "14px" }}>
        <Grid container className="page7description" justifyContent="center" alignItems="center">
          <Grid item md={10} sm={12} >

          </Grid>
          <Grid item md={1.5} sm={12}>
            {/* <Box display="flex" justifyContent="center" textAlign="center"> */}
            <Button onClick={handleClick} className="btn-color" size="small" variant="contained" style={{ fontWeight: "bold" }}>Create New Connection</Button>
            {/* </Box> */}
          </Grid>
        </Grid>

        <Grid container className="page7containers" marginTop={0} padding={{ md: "4rem" }}>
          <Grid container md={5} className="notvisible">
            <Grid item md={12} xs={12} className="page7publicresource">
              <p>Resources</p>
              {/* {resources.length > 0 ? (
                resources.map((resource) => (
                  <div className="page7resource" key={resource.resource_id}>
                    <div id="documentspage7" onClick={() => handleResourceClick(resource.i_node_pointer)}>
                      {resource.document_name}
                    </div>
                  </div>
                ))
              ) : (
                <p id="page7nores">No resources found.</p>
              )} */}
              {xnodes.length > 0 ? (
                <ul>
                  {xnodes.map((xnode, index) => (
                    <div
                      key={xnode.id}
                      className="resource-item"
                    // style={{
                    //   color: xnode.xnode_Type === 'INODE' ? 'blue' : 'red',}}
                    >
                      <div className="resource-details">
                        <div
                          id={
                            xnode.xnode_Type === "INODE"
                              ? "documents"
                              : "documents-byShare"
                          }
                          style={{ cursor: "pointer", flexGrow: 1, fontSize: "16px", marginLeft: "0rem" }}
                          onClick={() =>
                            handleXnodeClick(xnode.id)
                          }
                        >
                          {xnode.resource_name}
                        </div>
                        {/* <div className="public-private">
                              {xnode.type === "private" ? <>Private</> : "Public"}
                            </div> */}
                      </div>
                    </div>
                  ))}
                  <ReactModal
                    isOpen={isPdfModalOpen}
                    onRequestClose={handleClose}
                    contentLabel="PDF Viewer"
                    style={{
                      content: {
                        top: "59%",
                        left: "50%",
                        right: "auto",
                        bottom: "auto",
                        marginRight: "-50%",
                        transform: "translate(-50%, -50%)",
                        width: "95%",
                        height: "80%",
                        overflowY: "hidden",
                        maxWidth: "100%", // Ensure it doesn't overflow on smaller screens
                        maxHeight: "90%", // Max height for larger screens
                      },
                    }}
                  >
                    <button
                      onClick={handleClose}
                      style={{
                        marginBottom: "10px",
                        cursor: "pointer",
                        position: "absolute",
                        top: "10px",
                        right: "10px", // Button positioned at the top right
                        zIndex: 100,
                      }}
                    >
                      Close
                    </button>
                    {pdfUrl ? (
                      <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                        <Viewer fileUrl={pdfUrl} />
                      </Worker>
                    ) : (
                      <p>Loading PDF...</p>
                    )}
                  </ReactModal>
                </ul>

              ) : (
                <p className="not-found">No resources visible to you.</p>
              )}
            </Grid>

            <Grid item md={12} xs={12} className="page7publicresource" marginTop={"3rem"}>
              <p>Available Connection Types</p>
              {otherConnections.length > 0 ? (
                otherConnections.map((connection) => (
                  <div className="page7connection" key={connection.connection_type_id} style={{ paddingBottom: "20px", cursor: "pointer" }}>
                    <Box id="connectionpage7" sx={{
                      padding: '5px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      boxShadow: 3,
                      borderRadius: 2,
                      backgroundColor: "#f9f9f9;",
                      border: "1px solid #ccc;",
                      paddingTop: "18px",
                    }}>
                      <Grid container>
                        <Grid item md={8} xs={10} onClick={() => handleConnectionClick(connection)}>
                          <h4 className="clickable-tag"><u>{connection.connection_type_name}</u></h4>

                        </Grid>
                        <Grid item md={4} xs={2} id="">
                          {/* <button onClick={() => handleShowQrCode(connection)}>Scan QR</button> */}
                          <i data-tooltip-id="tooltip" data-tooltip-content="Click for QR code" className="bi bi-qr-code" style={{ color: "#0000FF", fontSize: "24px" }} onClick={() => handleShowQrCode(connection)}></i>
                          {!isModalOpen &&
                            <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} />

                          }
                        </Grid>
                      </Grid>
                      <>
                        <div style={{ marginTop: "-12px" }}>
                          <button onClick={() => handleToggle(connection.connection_type_id)} style={{
                            // textDecoration: "underline",
                            background: "none",
                            border: "none",
                            padding: 0,
                            cursor: "pointer",
                            color: "blue",
                            fontSize: "13px",

                          }}>
                            {showInfo === connection.connection_type_id ? "Info..." : "Info..."}
                          </button>
                        </div>

                        {/* Only show details for the expanded connection */}
                        {showInfo === connection.connection_type_id && (
                          <div>
                            <div id="availconntype">
                              Description: {connection.connection_description}
                            </div>
                            <div id="availconntype">
                              Created On: {new Date(connection.created_time).toLocaleDateString()}
                            </div>
                            <div id="availconntype">
                              Valid Until: {new Date(connection.validity_time).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </>
                      {/* "Scan QR" link to show QR code */}

                    </Box>
                  </div>
                ))
              ) : (
                <p id="noconnfound">No available connection type found.</p>
              )}
            </Grid>
          </Grid>
          <Grid item md={1} sm={12}></Grid>
          <Grid item md={6} xs={12} className="page7containersB" marginTop={{ xs: "3rem", md: "0" }}>
            <p>My connections with {locker?.name} locker of {parentUser?.username}: </p>
            {outgoingConnections.length > 0 ? (
              outgoingConnections.map((connection, index) => {
                const tracker = trackerData[connection.connection_id];
                const color = tracker ? getStatusColor(tracker) : "gray";
                const ratio = tracker ? calculateRatio(tracker) : "Loading...";
                const trackerReverse = trackerDataReverse[connection.connection_id]
                const colorReverse = trackerReverse
                  ? getStatusColorReverse(trackerReverse)
                  : "gray";
                const ratioReverse = trackerReverse
                  ? calculateRatioReverse(trackerReverse)
                  : "Loading...";

                return (
                  <Grid container className="page7myconnection" key={index}>
                    <Grid item id="conntent" md={8.5} xs={12}>
                      <h5 onClick={() => handleTracker(connection)} style={{ textDecoration: "underline", cursor: "pointer" }}>
                        {connection.connection_name}
                      </h5>
                      <div>{connection.host_user.username} &lt;&gt; {connection.guest_user.username}</div>
                      <div>Created On: {new Date(connection.created_time).toLocaleDateString()}</div>
                      <div>Valid Until: {new Date(connection.validity_time).toLocaleDateString()}</div>
                    </Grid>
                    <Grid item paddingTop={{ md: "20px", xs: "" }} md={3.5} xs={12}>
                      <button className="info-button" onClick={() => handleInfo(connection)}> i </button>
                      {/* <button onClick={() => handleTracker(connection)} style={{ backgroundColor: color, padding: "0px", fontSize: "22px" }}>
                        {ratio}
                      </button> */}
                      <div className="d-flex align-items-center mt-2">

                        <h6 className="mt-2 me-2"><b>{capitalizeFirstLetter(connection.guest_user.username)}</b></h6>
                        <i className="bi bi-arrow-right me-2" style={{ fontSize: '1.2rem' }}></i>
                        <button
                          onClick={() => handleTracker(connection)}
                          style={{
                            backgroundColor: color,
                            border: 'none',
                            fontSize: '16px',
                            padding: '5px 10px',
                            borderRadius: '5px',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          {ratio}
                        </button>
                      </div>
                      <div>


                        <div className="d-flex align-items-center mt-1">
                          <button className="me-2"
                            onClick={() => handleTrackerHost(connection)}
                            style={{
                              backgroundColor: colorReverse,
                              border: 'none',
                              fontSize: '16px',
                              padding: '5px 10px',
                              borderRadius: '5px',
                              color: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            {ratioReverse}
                          </button>
                          <i className="bi bi-arrow-left me-2" style={{ fontSize: '1.2rem' }}></i>

                          <h6 className="mt-2 me-2"><b>{capitalizeFirstLetter(connection.host_user.username)}</b></h6>


                        </div>
                      </div>
                    </Grid>
                  </Grid>
                );
              })
            ) : (
              <p id="noconnfound">No outgoing connections found.</p>
            )}
          </Grid>
        </Grid>
      </div>
    </div>
  );
};


