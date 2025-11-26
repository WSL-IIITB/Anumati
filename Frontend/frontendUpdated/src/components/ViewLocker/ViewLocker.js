import React, { useContext, useEffect, useState } from "react";
import "./page3.css";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { useLocation, useParams } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import { frontend_host } from "../../config";
import { QrReader } from "react-qr-reader";
import Modal from "../Modal/Modal";
import { Grid, Button, ButtonBase, Breadcrumbs } from "@mui/material"
import Tooltips from '@mui/material/Tooltip';
import { Tooltip } from 'react-tooltip';
import ReactModal from "react-modal";
import { Viewer, Worker } from "@react-pdf-viewer/core"; // PDF Viewer
import "@react-pdf-viewer/core/lib/styles/index.css";
import { ConnectionContext } from "../../ConnectionContext";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
// import { Menu } from "lucide-react";

// import {PDFViewer} from "../PDFViewer/PDFViewer.js";
export const ViewLocker = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const locker = location.state ? location.state.locker : null;

  const [isOpen, setIsOpen] = useState(false);
  const { curruser, setUser } = useContext(usercontext);
  const [resources, setResources] = useState([]);
  const [error, setError] = useState(null);
  const [subsetError, setSubsetError] = useState(null)
  const [connections, setConnections] = useState({
    incoming_connections: [],
    outgoing_connections: [],
  });
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("My Lockers");
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

  const [allOutgoingConnections, setAllOutgoingConnections] = useState([]);
  const [closedConnections, setClosedConnections] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [otherConnections, setOtherConnections] = useState([]);
  const [trackerData, setTrackerData] = useState({});
  const [trackerDataReverse, setTrackerDataReverse] = useState({});
  const [scanning, setScanning] = useState(false);
  const [qrResult, setQrResult] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [resourceName, setResourceName] = useState("");
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceVisibility, setResourceVisibility] = useState("private");
  const [resourceValidity, setResourceValidity] = useState("");
  const [modalMessage, setModalMessage] = useState(null)
  const [VnodeResources, setVnodeResources] = useState([]);
  const [SnodeResources, setSnodeResources] = useState([]);
  const [activeTab, setActiveTab] = useState("incoming");
  const [xnodes, setXnodes] = useState([]);
  const [isResourcesVisible, setResourcesVisible] = useState(false);
  const [isConnectionsVisible, setConnectionsVisible] = useState(false);
  const [isIncomingVisible, setIncomingVisible] = useState(false);
  const [isOutgoingVisible, setOutgoingVisible] = useState(false);
  const [userResource, setUserResource] = useState([])
  const { locker_conn, setLocker_conn } = useContext(ConnectionContext);
  const [lockers, setLockers] = useState(() => {
    const storedLocker = localStorage.getItem("locker");
    return storedLocker ? JSON.parse(storedLocker) : location.state || null;
  });
  const [showSubsetModal, setShowSubsetModal] = useState(false);
  const [resourceViewModal, setResourceViewModal] = useState(false);
  const [resourceData, setResourceData] = useState(null)
  const [totalPages, setTotalPages] = useState("Loading...")
  const [selectedResourceId, setSelectedResourceId] = useState(null)
  const [inodeName, setInodeName] = useState("");
  const [fromPage, setFromPage] = useState();
  const [toPage, setToPage] = useState();
  const [hovered, setHovered] = useState(null);
  const [expandedConnections, setExpandedConnections] = useState([]);
  const [allpostConditions, setAllPostConditions] = useState();
  const [postConditions, setPostConditions] = useState();
  const [isLockedPostConditions, setIsLockedPostConditions] = useState();
  const [notifications, setNotifications] = useState([]);

  // const [correspondingNames, setCorrespondingNames] = useState([]);
  // const [pdfUrl, setPdfUrl] = useState("");
  console.log("allOutgoingConnectionsr", allOutgoingConnections)
  console.log("closedConnectionsr", closedConnections)
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

  console.log("connections", connections.outgoing_connections)
  useEffect(() => {
    // const token = Cookies.get("authToken");
    // const checkAndUpdateConnectionStatus = async () => {
    //   try {
    //     const user_id = curruser?.user_id;
    //     const lockerData = location.state || locker?.locker_id;
    //     const locker_id = lockerData?.locker?.locker_id;
    //     if (!user_id || !locker_id) {
    //       console.warn("Missing user_id or locker_id");
    //       return;
    //     }

    //     const response = await fetch("host/update_connection_status/".replace(/host/, frontend_host), {
    //       method: "POST",
    //       headers: {
    //         "Content-Type": "application/json",
    //         Authorization: `Basic ${token}`
    //       },
    //       body: JSON.stringify({ user_id, locker_id }),
    //     });

    //     const result = await response.json();
    //     if (result.success) {
    //       console.log("Expired connections updated:", result.updated_connection_ids);
    //     } else {
    //       console.warn("API Error:", result.error);
    //     }
    //   } catch (error) {
    //     console.error("Error calling update_connection_status_if_expired:", error);
    //   }
    // };

    if (locker) {
      // First update expired connection statuses
      // checkAndUpdateConnectionStatus().then(() => {
      // Then fetch other dependent data
      fetchConnectionsAndOtherConnections();
      fetchResources();
      fetchXnodes();
      // });
    }

    if (location.state) {
      setLockers(location.state);
      setLocker_conn(location.state.locker);
      localStorage.setItem("locker", JSON.stringify(location.state));
    } else if (locker) {
      localStorage.setItem("locker", JSON.stringify(locker));
    }
  }, [locker]);

  useEffect(() => {
    const fetchData = async () => {
      const token = Cookies.get("authToken"); // Get the token from Cookies
      if (!token) return alert("Authentication token is missing.");

      try {
        const pages = await fetchTotalPages(selectedResourceId, token);
        setTotalPages(pages); // Set the total pages in state
      } catch (error) {
        alert(error.message || "Failed to fetch total pages.");
      }
    };

    if (selectedResourceId) fetchData();
  }, [selectedResourceId]);

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




  const legendItems = [
    { color: "blue", label: "Your resource" },
    { color: "rgb(255, 38, 0)", label: "Shared resource" },
    { color: "green", label: "Conferred / Pledged resource" },
  ];

  const fetchXnodes = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ locker_id: locker.locker_id });

      const response = await fetch(
        `host/get_all_xnodes_for_locker_v2/?${params}`.replace(
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
        throw new Error("Failed to fetch Xnodes");
      }

      const data = await response.json();
      console.log(data.message || data.error, "mssg");
      console.log("xnode data", data);

      if (data.xnode_list) {
        setXnodes(data.xnode_list);
        // setCorrespondingNames(data.corresponding_document_name_list);
      } else {
        setError(data.message || data.error || "Failed to fetch Xnodes");
        console.log("msg", data.message || data.error);
      }
    } catch (error) {
      console.error("Error fetching Xnodes:", error);
      setError("An error occurred while fetching Xnodes");
    }
  };
  const fetchTotalPages = async (selectedResourceId, token) => {
    const url = `${frontend_host}/get_total_pages_v2/?xnode_id=${selectedResourceId}`;
    console.log("Fetching data from URL:", url); // Log the URL

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch total pages.");
      }
      return data.total_pages;
    } catch (error) {
      console.error("Error details:", error); // Log the error details
      // throw new Error("An error occurred while fetching the total pages.");
    }
  };
  // console.log("locker", locker);
  // console.log("resources", resources);
  const fetchConnectionsAndOtherConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const params = new URLSearchParams({ locker_name: locker.name });

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

      if (!connectionsResponse.ok)
        throw new Error("Failed to fetch connections");
      const connectionsData = await connectionsResponse.json();

      if (connectionsData.success) {
        setAllOutgoingConnections(connectionsData.connections.outgoing_connections)
        const filteredIncoming = connectionsData.connections.incoming_connections.filter(
          (connection) => connection.connection_status !== "closed" && connection.connection_status !== "revoked"
        );
        const filteredOutgoing = connectionsData.connections.outgoing_connections.filter(
          (connection) => connection.connection_status !== "closed" && connection.connection_status !== "revoked"
        );

        setConnections({
          incoming_connections: filteredIncoming,
          outgoing_connections: filteredOutgoing,
        });
        fetchAllTrackerData(connectionsData.connections.outgoing_connections);

        const incomingConnectionCounts = {};
        filteredIncoming.forEach((connection) => {
          const typeId = connection.connection_type;
          incomingConnectionCounts[typeId] =
            (incomingConnectionCounts[typeId] || 0) + 1;
        });

        if (!otherConnectionsResponse.ok)
          throw new Error("Failed to fetch other connections");
        const otherConnectionsData = await otherConnectionsResponse.json();

        if (otherConnectionsData.success) {
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
    }
  };

  useEffect(() => {
    fetchConnectionsAndOtherConnections();
  }, [locker.name]);
  useEffect(() => {
    if (allOutgoingConnections && allOutgoingConnections.length > 0) {
      const filtered = allOutgoingConnections.filter(
        (connection) => connection.connection_status === "closed"
      );
      setClosedConnections(filtered);
    }
  }, [allOutgoingConnections]);
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
      // setError("An error occurred while fetching resources");
    }
  };
  // console.log(locker);
  // const fetchVnodeResources = async () => {
  //   try {
  //     const token = Cookies.get("authToken");
  //     const params = new URLSearchParams({ host_locker_id: locker.locker_id });

  //     const response = await fetch(
  //       `host/get-vnodes/?${params}`.replace(/host/, frontend_host),
  //       {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Basic ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch resources");
  //     }

  //     const data = await response.json();
  //     // console.log("data", data);
  //     // console.log("vnodes", data.data);

  //     //if (data.success) {
  //     setVnodeResources(data.data);
  //     //} else {
  //     //setError(data.message || "Failed to fetch resources");
  //     //}
  //     //}
  //   } catch (error) {
  //     console.error("Error fetching resources:", error);
  //     // setError("An error occurred while fetching resources");
  //   }
  // };

  // const fetchSnodeResources = async () => {
  //   try {
  //     const token = Cookies.get("authToken");
  //     const params = new URLSearchParams({ host_locker_id: locker.locker_id });

  //     const response = await fetch(
  //       `host/get-snodes/?${params}`.replace(/host/, frontend_host),
  //       {
  //         method: "GET",
  //         headers: {
  //           Authorization: `Basic ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );
  //     if (!response.ok) {
  //       throw new Error("Failed to fetch resources");
  //     }

  //     const data = await response.json();
  //     console.log("data", data);
  //     console.log("vnodes", data.data);

  //     //if (data.success) {
  //     setSnodeResources(data.data);
  //     //} else {
  //     //setError(data.message || "Failed to fetch resources");
  //     //}
  //     //}
  //   } catch (error) {
  //     console.error("Error fetching resources:", error);
  //     // setError("An error occurred while fetching resources");
  //   }
  // };

  const fetchAllTrackerData = (outgoingConnections) => {
    outgoingConnections.forEach((connection) => {
      fetchTrackerData(connection);
      fetchTrackerDataReverse(connection);
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
        console.log("view locker", data);
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

  console.log("trackerData", trackerData)
  console.log("trackerDataReverse", trackerDataReverse)

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
    const totalObligations =
      tracker.count_T + tracker.count_F + tracker.count_R;
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
    console.log("navigate view-terms-by-type", {
      connection,
      guest_locker_id: connection.guest_locker?.locker_id,
      host_locker_id: connection.host_locker?.locker_id,
    });
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
    console.log("navigate view-terms-by-type", {
      connection,
      guest_locker_id: connection.guest_locker?.locker_id,
      host_locker_id: connection.host_locker?.locker_id,
    });
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

  const handleDocsClick = () => {
    // console.log("Open Docs button clicked");
  };

  const handleEducationClick = () => {
    // console.log("Open Education button clicked");
    navigate("/view-locker");
  };
  console.log("connectionsss", locker)
  const handleConnectionClick = (connection) => {
    console.log("navigate show-guest-users", {
      connection,
      locker,
    });
    navigate("/show-guest-users", {
      state: {
        connection,
        locker,
        hostLocker: connections?.incoming_connections?.[0]?.host_locker || locker,
        hostUserUsername: connections?.incoming_connections?.[0]?.host_user.username || curruser.username,
        hostLockerName: connections?.incoming_connections?.[0]?.host_locker.name || locker.name
      }
    });
  };
  const handleIncomingInfo = (connection) => {


    navigate("/display-terms", {
      state: {
        hostLockerName: connections?.incoming_connections?.[0]?.host_locker.name || locker.name,
        connectionTypeName: connection.connection_type_name,
        connectionDescription: connection.connection_description,
        createdtime: connection.created_time,
        validitytime: connection.validity_time,
        hostUserUsername: connections?.incoming_connections?.[0]?.host_user.username || curruser.username,
        locker: locker,
        viewlockerDisplay: true,
        hostLocker: connections?.incoming_connections?.[0]?.host_locker || locker,
      },
    });
  };
  const handleInfo = (connection) => {
    // Split the connection_name by the hyphen and take the last part as the connection_type_name
    const connectionTypeName = connection.connection_name
      .split("-")
      .shift()
      .trim();
    // console.log("conntype",connectionTypeName)

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
        connectionDescription: connection.connection_description,
        guestLockerName: connection.guest_locker?.name,
        hostLockerName: connection.host_locker?.name,
        connectionTypeName, // Pass the extracted connection_type_name
        hostUserUsername: connection.host_user?.username,
        guestUserUsername: connection.guest_user?.username,
        locker: locker.name,
        showConsent: false,
        guest_locker_id: connection.guest_locker?.id,
        host_locker_id: connection.host_locker?.id,
        lockerComplete: locker,
        hostLocker: connection.host_locker,
        guestLocker: connection.guest_locker
      },
    });
  };

  const handleConsentAndInfo = (connection) => {
    // Split the connection_name by the hyphen and take the last part as the connection_type_name
    const connectionTypeName = connection.connection_name
      .split("-")
      .shift()
      .trim();
    // console.log("conntype",connectionTypeName)

    console.log("Navigating with state:", {
      connectionName: connection.connection_name,
      hostLockerName: connection.host_locker?.name,
      guestLockerName: connection.guest_locker?.name,
      connectionTypeName, // Pass the extracted connection_type_name
      hostUserUsername: connection.host_user?.username,
      guestUserUsername: connection.guest_user?.username,
      locker: locker,
      guest_locker_id: connection.guest_locker?.id,
      host_locker_id: connection.host_locker?.id,
      connection_id: connection.connection_id,
      hostLocker: connection.host_locker,
      guestLocker: connection.guest_locker
    });

    navigate("/show-connection-terms", {
      state: {
        connection: connection,
        connectionName: connection.connection_name,
        connectionDescription: connection.connection_description,
        guestLockerName: connection.guest_locker?.name,
        hostLockerName: connection.host_locker?.name,
        connectionTypeName,
        guestUserUsername: connection.guest_user?.username,
        // connectionTypeName: connection.connection_type_name,
        hostUserUsername: connection.host_user?.username,
        locker: locker.name,
        showConsent: true,
        guest_locker_id: connection.guest_locker?.id,
        host_locker_id: connection.host_locker?.id,
        connection_id: connection.connection_id,
        lockerComplete: locker,
        hostLocker: connection.host_locker,
        guestLocker: connection.guest_locker,
        viewConsentGuest: true,
      },
    });
  };

  useEffect(() => {
    if (scanning) {
      // When scanning starts, make sure QR reader is active
    } else {
      // Stop the QR reader or camera when scanning is false
      setQrResult(null); // Reset the result when scanning stops
    }
  }, [scanning]);

  // const handleQrScan = (data) => {
  //   if (data) {
  //     try {
  //       const parsedData = JSON.parse(data);
  //       console.log("Scanned QR Data:", parsedData);

  //       // Navigate and reload the page after navigating
  //       navigate("/show-connection-terms", {
  //         state: {
  //           connectionTypeName: parsedData.connection_type_name,
  //           connectionDescription: parsedData.connection_description,
  //           locker: locker,
  //           hostUserUsername: parsedData.host_username,
  //           hostLockerName: parsedData.host_locker_name,
  //           connectionName: parsedData.connection_name,
  //           connection_id: parsedData.connection_id,
  //           showConsent: true,
  //           guest_locker_id: parsedData.guest_locker?.id,
  //           host_locker_id: parsedData.host_locker?.id,
  //           lockerComplete: locker,
  //         },
  //       });

  //       // Stop scanning and reload the page
  //       setScanning(false);
  //       window.location.reload(); // This will reload the page after navigating
  //     } catch (error) {
  //       console.error("Invalid QR Code:", error);
  //     }
  //   }
  // };

  // const handleQrError = (error) => {
  //   console.error("QR Reader Error:", error);
  // };

  // const closeScanner = () => {
  //   // Stop the QR scanner
  //   setScanning(false);

  //   // Manually stop all video streams from the camera
  //   const videoElement = document.querySelector("video");
  //   if (videoElement && videoElement.srcObject) {
  //     const stream = videoElement.srcObject;
  //     const tracks = stream.getTracks();

  //     tracks.forEach((track) => {
  //       track.stop(); // Stop each track (both video and audio)
  //     });

  //     videoElement.srcObject = null; // Clear the video element source
  //   }

  //   // Refresh the page when closing the scanner
  //   window.location.reload();
  // };


  console.log("lockers", lockers)
  const handleClick = async (xnode_id) => {

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
      console.log("link to file", link_To_File);
      if (link_To_File) {
        const secureFileUrl = link_To_File.replace('http://', 'https://');
        setPdfUrl(secureFileUrl);

        // const secureFileUrl =
        //   process.env.NODE_ENV === 'production'
        //     ? link_To_File.replace('http://', 'https://')
        //     : link_To_File;
        // setPdfUrl(link_To_File);
        setIsModalOpen(true); // Open the modal
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
  const handleViewDetails = async (xnode_id) => {

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
      const { xnode } = data;
      if (xnode) {
        setResourceData(xnode)
        setResourceViewModal(true)
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
  console.log("setResourceData", resourceData)

  const getTrueKeys = (obj) => {
    return Object.entries(obj)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);
  };
  const postConditionsKeys = getTrueKeys(resourceData?.post_conditions || {});

  console.log("doc", locker.name, curruser.username, xnodes.resource_name);
  xnodes.forEach((xnode) => {
    console.log("Full xnode object:", xnode);
  });

  console.log("pdfUrl", pdfUrl)

  const handleEditClick = (xnode) => {
    setSelectedResource(xnode);
    setResourceName(xnode.resource_name);
    setResourceVisibility(xnode.visibility);
    setResourceValidity(xnode.validity_until);
    setShowEditModal(true);

    // Destructure to remove creator_conditions
    const { creator_conditions, ...restPostConditions } = xnode.post_conditions;

    let filteredPostConditions = restPostConditions;

    // If it's a VNODE, keep only 'share' and 'transfer'
    if (xnode.xnode_Type === "VNODE") {
      filteredPostConditions = Object.fromEntries(
        Object.entries(restPostConditions).filter(([key]) =>
          ["share", "transfer"].includes(key)
        )
      );
    } else if (xnode.xnode_Type === "SNODE") {
      // Exclude "subset"
      filteredPostConditions = Object.fromEntries(
        Object.entries(restPostConditions).filter(([key]) =>
          !["subset"].includes(key)
        )
      );
    }

    setPostConditions(filteredPostConditions);
    setIsLockedPostConditions(xnode.is_locked);
  };

  console.log("setSelectedResource", selectedResource, postConditions, isLockedPostConditions)
  const handleSubsetClick = (xnode) => {
    setSelectedResource(xnode);
    // setResourceName(xnode.resource_name);
    // setResourceVisibility(xnode.visibility);
    // setResourceValidity(xnode.validity_until);
    setSelectedResourceId(xnode.id)
    console.log("clicked", totalPages);

    setShowSubsetModal(true);
  };
  console.log("resourcevalidity", selectedResourceId);
  const handleSaveResource = async (xnode) => {
    console.log("xnode in handleSaveResource:", xnode);

    if (!xnode || !xnode.resource_name) {
      console.error("Invalid resource structure or missing resource_name.");
      return;
    }

    // Access the res object through the foreign key in xnode
    const res = xnode.res;
    const currentVisibility = res ? res.visibility : undefined;

    const payload = {
      locker_name: locker.name,
      owner_name: curruser.username,
      xnode_id: xnode.id,
      document_name: xnode.resource_name,
      new_document_name: resourceName,
      new_visibility: resourceVisibility || currentVisibility,
      new_validity_time: resourceValidity || res.validity_until,
      post_conditions: postConditions
    };

    console.log("Payload:", payload);

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`${frontend_host}/edit-delete-resource-v2/`, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response Status:", response.status);
      const data = await response.json();
      console.log("Response Data:", data);

      if (response.ok) {

        setXnodes((prevXnodes) =>
          prevXnodes.map((item) =>
            item.id === xnode.id
              ? { ...item, resource_name: resourceName, visibility: resourceVisibility || currentVisibility, validity_until: resourceValidity || res.validity_until }
              : item
          )
        );

        setModalMessage({ message: "Resource updated successfully!", type: "success" });
        setShowEditModal(false);
        // window.location.reload();
      } else {
        setModalMessage({ message: data.message || "Failed to update resource.", type: "failure" });
      }
    } catch (error) {
      console.error("Error updating resource:", error);
      setModalMessage({ message: "An error occurred while updating the resource.", type: "failure" });
    }
  };

  const handleCreateSubset = async () => {
    // if (!selectedResourceId || !fromPage || !toPage || !inodeName) {
    //     alert("Please fill all fields.");
    //     return;
    // }

    try {
      const token = Cookies.get("authToken");
      console.log("Sending request with:", {
        xnode_id: selectedResourceId,
        from_page: parseInt(fromPage, 10),  // Convert to integer
        to_page: parseInt(toPage, 10),      // Convert to integer
        resource_name: inodeName,
      });

      const response = await fetch(`${frontend_host}/create-subset-resource/`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xnode_id: selectedResourceId,
          from_page: parseInt(fromPage, 10), // Ensure integers are sent
          to_page: parseInt(toPage, 10),     // Ensure integers are sent
          resource_name: inodeName,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Subset resource created successfully!");
        setTimeout(() => {
          setShowSubsetModal(false);
          setTotalPages("Loading...");
          setSelectedResourceId(null)
          setInodeName("");
          setFromPage();
          setToPage();
          setSubsetError(null)
        }, 1000);


        fetchXnodes();
      } else {
        setSubsetError(data.error)
        // alert(`Error: ${data.error}`);
        // console.error("API Error:", data);
      }
    } catch (error) {
      setSubsetError(error);
      // alert("Something went wrong. Please try again.");
    }
  };

  const handleCloseSubset = () => {
    setShowSubsetModal(false)
    setTotalPages("Loading...");
    setSelectedResourceId(null)
    setInodeName("");
    setFromPage();
    setToPage();
    setSubsetError(null)
    fetchXnodes();
  }




  // console.log("doc",locker.name,curruser.username,xnodes.resource_name);
  // xnodes.forEach((xnode) => {
  //   console.log("Resource Name:", xnode.resource_name); // Log each resource_name
  // });
  const handleDeleteClick = async (xnode) => {
    console.log("Xnode to be deleted:", xnode);  // Log the entire xnode object

    if (!xnode.id) {
      console.error("Document name is missing in xnode!");
      return;  // Exit the function if resource_name is missing
    }

    if (window.confirm("Do you want to delete this resource?")) {
      const lockerName = locker.name;
      const xnodeId = xnode.id;
      const ownerName = curruser.username;

      const payload = {
        locker_name: lockerName,
        owner_name: ownerName,
        xnode_id: xnodeId,
      };

      console.log("Payload to be sent:", payload);

      try {
        const token = Cookies.get("authToken");
        const response = await fetch(`${frontend_host}/edit-delete-resource-v2/`, {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.log("Response from backend:", response);
        const data = await response.json();
        console.log("Response data:", data);

        if (response.ok) {

          setXnodes((prevXnodes) =>
            prevXnodes.filter((item) => item.id !== xnode.id)
          );

          setModalMessage({ message: "Resource deleted successfully!", type: "success" });
        } else {
          setModalMessage({ message: data.message || "Failed to delete resource.", type: "failure" });
        }
      } catch (error) {
        setModalMessage({ message: "An error occurred while deleting the resource.", type: "failure" });
        console.error("Error during delete:", error);
      }
    }
  };
  const handleDeleteClicks = async (resource) => {
    console.log("Xnode to be deleted:", resource);  // Log the entire xnode object

    if (!resource.resource_name) {
      console.error("Document name is missing in xnode!");
      return;  // Exit the function if resource_name is missing
    }

    if (window.confirm("Do you want to delete this resource?")) {
      const lockerName = locker.name;
      const documentName = resource.resource_name;
      const ownerName = curruser.username;

      const payload = {
        locker_name: lockerName,
        owner_name: ownerName,
        document_name: documentName,
      };

      console.log("Payload to be sent:", payload);

      try {
        const token = Cookies.get("authToken");
        const response = await fetch(`${frontend_host}/edit-delete-resource-v2/`, {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        console.log("Response from backend:", response);
        const data = await response.json();
        console.log("Response data:", data);

        if (response.ok) {

          setXnodes((prevXnodes) =>
            prevXnodes.filter((item) => item.id !== resource.xnode.id)
          );

          setModalMessage({ message: "Resource deleted successfully!", type: "success" });
        } else {
          setModalMessage({ message: data.message || "Failed to delete resource.", type: "failure" });
        }
      } catch (error) {
        setModalMessage({ message: "An error occurred while deleting the resource.", type: "failure" });
        console.error("Error during delete:", error);
      }
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setPdfUrl(null);
  };
  const handleViewClose = () => {
    setResourceViewModal(false);
    setResourceData(null);
  };

  const handleFileChange = (e) => {
    setResourceFile(e.target.files[0]);
  };

  const handleCloseModal = () => {
    setModalMessage(null);
    window.location.reload();
  };
  const toggleResourcesVisibility = () => {
    setResourcesVisible(!isResourcesVisible);
  };
  const [expandedConnection, setExpandedConnection] = useState([]); // Tracks which connection is expanded
  const [connectionUsers, setConnectionUsers] = useState({}); // Store users for each connection
  const [expandedusers, setExpandedusers] = useState([]);
  const [userResources, setUserResources] = useState({});
  // Toggle connection to expand/collapse user list
  const toggleConnections = (connection) => {
    const connectionId = connection.connection_type_id
    setExpandedConnection((prev) => {
      if (prev.includes(connectionId)) {
        // If the connection is already expanded, close it
        return prev.filter((id) => id !== connectionId);
      } else {
        // Otherwise, expand it
        return [...prev, connectionId];
      }
    });

    if (!connectionUsers[connectionId]) {
      fetchUsersForConnection(connection); // Fetch users if not already fetched
    }
  };
  const toggleConnection = (connection) => {
    const connectionId = connection.connection_type_id;

    setExpandedConnection((prev) =>
      prev.includes(connectionId) ? prev.filter((id) => id !== connectionId) : [...prev, connectionId]
    );

    // Fetch users only if they haven’t been fetched already
    if (!connectionUsers[connectionId]) {
      fetchUsersForConnection(connection);
    }
  };
  const toggleOutgoingConnection = (connection) => {
    const connectionId = connection.connection_id;

    if (expandedConnections.includes(connectionId)) {
      setExpandedConnections((prev) => prev.filter((id) => id !== connectionId));
    } else {
      setExpandedConnections((prev) => [...prev, connectionId]);
      if (!userResources[connectionId]) {
        fetchResourcesForOutgoingConnection(connectionId, connection.host_locker.locker_id);
      }
    }
  };
  console.log("userResources", userResources)

  // const toggleusers = (connectionDetail, connection) => {
  //   const userId = connectionDetail.guest_user.user_id;
  //   const username = connectionDetail.guest_user.username;
  //   const connectionId = connection.connection_type_id
  //   console.log("usernames", username)
  //   setExpandedusers((prev) => {
  //     if (prev.includes(userId)) {
  //       // If the user is already expanded, remove it
  //       return prev.filter((id) => id !== userId);
  //     } else {
  //       // Otherwise, add the user ID to the expanded list
  //       return [...prev, userId];
  //     }
  //   });
  //   if (!expandedusers[connectionId]) {
  //     fetchResourcesForConnection(connectionId, username)

  //   }
  //   // Optionally, fetch additional data if needed
  //   // fetchUsersForConnection(connectionDetail); // Uncomment if fetching is required
  // };

  console.log("expandedusers", expandedusers)


  const toggleuser = (user, connection) => {
    const uniqueUserKey = `${user.guest_user.user_id}-${connection.connection_type_id}`; // Unique key per user per connection

    console.log("Clicked user:", user.guest_user.username, "in connection:", connection.connection_type_id);

    setExpandedusers((prev) => {
      if (prev.includes(uniqueUserKey)) {
        return prev.filter((id) => id !== uniqueUserKey); // Collapse user
      } else {
        return [...prev, uniqueUserKey]; // Expand user
      }
    });

    // Fetch resources when expanding the user, and only if they haven’t been fetched yet
    if (!userResources[`${user.guest_user.username}-${connection.connection_type_id}`]) {
      fetchResourcesForConnection(connection.connection_type_id, user.guest_user.username);
    }
  };

  const handleuserclick = (user) => {
    if (curruser && curruser.username && user.username === curruser.username) {
      navigate('/home');
    } else {
      navigate(`/target-user-view`, { state: { user } });
    }
  };



  console.log("connectionUsers", connectionUsers)

  console.log("expandedConnection", expandedConnection)
  const [loadingConnections, setLoadingConnections] = useState({});
  const fetchUsersForConnection = async (connection) => {
    // Extract required values from the connection object
    const connection_type_name = connection.connection_type_name; // Connection type name
    const host_user_username = connection.owner_user; // Map this to the user who owns the connection
    const locker_name = connection.owner_locker; // Map this to the locker associated with the connection
    const connection_type_id = connection.connection_type_id;

    // Log the parameters being used to make sure they are correct
    console.log("Final parameters used for API call:");
    console.log("connection_type_name:", connection_type_name);
    console.log("host_user_username:", curruser.username);
    console.log("locker_name:", locker.name);
    console.log("connection_type_id:", connection_type_id);

    // Construct the URL for the API call
    const url = `${frontend_host}/get-guest-user-connection?connection_type_name=${encodeURIComponent(connection_type_name)}&host_user_username=${encodeURIComponent(curruser.username)}&host_locker_name=${encodeURIComponent(locker.name)}`;

    // Log the constructed URL for debugging
    console.log("Constructed URL:", url);

    try {
      // Get the authentication token (assumed to be stored in cookies)
      const token = Cookies.get("authToken");

      if (!token) {
        throw new Error("Authentication token is missing.");
      }

      // Fetch the data from the backend with the token in the Authorization header
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      // Parse the response data (users)
      const users = await response.json();
      console.log("Fetched users:", users);

      // Store the users in state for this specific connection type
      setConnectionUsers((prev) => ({
        ...prev,
        [connection_type_id]: users,
      }));
    } catch (error) {
      // Log any errors encountered during the API call
      console.error("Error in API call:", error);
    }
  };



  const fetchResourcesForConnection = async (connectionTypeId, username) => {
    console.log("Parameters used for API call:");
    console.log("connectionTypeId:", connectionTypeId);
    console.log("username:", username);


    const url = `${frontend_host}/get_user_resources_by_connection_type_2/?connection_type_id=${encodeURIComponent(connectionTypeId)}&username=${encodeURIComponent(username)}&locker_id=${encodeURIComponent(locker.locker_id)}`;
    console.log("Constructed URL:", url);

    try {
      const token = Cookies.get("authToken");
      if (!token) {
        throw new Error("Authentication token is missing.");
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Fetched resources:", responseData);

      if (responseData.success) {
        setUserResources((prevResources) => ({
          ...prevResources,
          [`${username}-${connectionTypeId}`]: responseData.data, // Ensure key format
        }));

      } else {
        // setError(responseData.message || "Failed to fetch resources");
      }
    } catch (error) {
      console.error("Error in API call:", error);
      // setError("An error occurred while fetching resources.");
    } finally {
      console.log("Loading");
    }
  };

  const fetchResourcesForOutgoingConnection = async (connectionId) => {
    console.log("Parameters used for API call:");
    console.log("connectionTypeId:", connectionId);
    // console.log("username:", username);


    const url = `${frontend_host}/get_outgoing_connection_xnode_details_v2/?connection_id=${encodeURIComponent(connectionId)}&locker_id=${encodeURIComponent(locker.locker_id)}`;
    console.log("Constructed URL:", url);

    try {
      const token = Cookies.get("authToken");
      if (!token) {
        throw new Error("Authentication token is missing.");
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`API call failed with status ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Fetched resources:", responseData);

      if (responseData.success) {
        setUserResources((prevResources) => ({
          ...prevResources,
          [`${connectionId}`]: responseData.data, // Ensure key format
        }));

      } else {
        // setError(responseData.message || "Failed to fetch resources");
      }
    } catch (error) {
      console.error("Error in API call:", error);
      // setError("An error occurred while fetching resources.");
    } finally {
      console.log("Loading");
    }
  };

  console.log("datadata", userResource)
  const content = (
    <>
      <div className="navbarBrands">
        {locker ? `Locker: ${locker.name}` : "Locker"}
      </div>
      <div>
        {locker ? ` ${locker.description}` : "Description"}
      </div>
    </>
  );

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">View Locker</span>
    </div>
  )
  // console.log("res vnode", VnodeResources);
  console.log("xnodes", xnodes);

  console.log("connections", connections.outgoing_connections
  );

  const gotopage12createconnection = () => {
    navigate("/connection", { state: { lockers, connectionBreadcrumbs: true, } });
    console.log("dataa", locker)
  };
  return (
    <div id="viewLocker">
      {/* <Navbar content={content} lockerAdmin={true} lockerObj={locker} breadcrumbs={breadcrumbs} /> */}

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


      {/* <span className="fw-medium">Hi, Meghana</span> */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
        lockerObj={locker}
        locker_on={true}
      />

      <div className="locker-header">
        <div className="locker-text">
          <div className="navbar-content">{content}</div>
        </div>
        <div className="navbar-breadcrumbs">{breadcrumbs}</div>
      </div>



      <div className="containers" style={{ marginTop: "50px" }}>


        {/* <div className="locker-description">
          {locker ? ` ${locker.description}` : "Description"}
        </div> */}
        {/* QR Scanner Section
        {scanning && (
          <div className="qr-scanner-overlay">
            <div className="qr-scanner-box">
              <QrReader
                onResult={(result, error) => {
                  if (!!result) {
                    handleQrScan(result?.text);
                  }
                  if (!!error) {
                    handleQrError(error);
                  }
                }}
                constraints={{ facingMode: "environment" }} // Use the environment (back) camera
                style={{ width: "100%", height: "100%" }}
              />
              <button className="qr-scanner-close" onClick={closeScanner}>
                Close
              </button>
            </div>
          </div>
        )} */}
        {/* <div className="qr-scan-section">
          {!scanning && (
            <button className="qrbutton" onClick={() => setScanning(true)}>
              Start QR Scan
            </button>
          )}
        </div> */}



        <Grid container padding={{ md: "50px", xs: "20px" }}>
          <Grid item md={5.5} xs={12} className="a">
            <div className="res">
              <div style={{ marginLeft: "-10px" }}>
                <h4 className="mt-2">Locker resources</h4>
                <Grid container>
                  {legendItems.map((item, index) => (
                    <Grid item xs={12} md={12}
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <span className="mt-1"
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          backgroundColor: item.color,
                          border: "none",
                          marginRight: "5px",
                          marginLeft: "10px",
                        }}
                      ></span>
                      <span className="mt-1" style={{ fontSize: "16px", color: "#333" }}><b>{item.label}</b></span>
                    </Grid>
                  ))}
                </Grid>
              </div>
              <div className="container-3 clearfix">
                <div>
                  {/* "My Resources" folder */}
                  <div
                    className="resource-folder"
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                      marginTop: "20px"
                    }}
                    onClick={() => setResourcesVisible(!isResourcesVisible)}
                  >
                    <i
                      className={`fa-solid fa-folder${isResourcesVisible ? "-open" : ""}`}
                      style={{ marginRight: "10px", fontSize: "24px" }}
                    />
                    <span fontSize={{ md: "16px", xs: "12px" }}>My Resources</span>
                    <Button className="btn-color" style={{ marginLeft: "12px", fontSize: "13px", }} onClick={handleUploadResource}>
                      UPLOAD RESOURCE
                    </Button>
                  </div>

                  {/* Resource List inside the folder */}
                  {isResourcesVisible && (
                    <ul style={{ paddingTop: "10px", paddingLeft: "20px" }}>
                      {xnodes?.filter((xnode) => xnode.status !== "closed").length > 0 ? (
                        xnodes.filter((xnode) => xnode.connection === null).length > 0 ? (
                          xnodes
                            .filter((xnode) => xnode.connection === null)
                            .map((xnode) => (
                              <div
                                key={xnode.id}
                                className="resource-item"
                                style={{ paddingBottom: "0px" }}
                              >
                                <div className="resource-details">
                                  <Tooltips
                                    title={
                                      <>
                                        <div>
                                          <strong>Created:</strong>{" "}
                                          {new Date(xnode.created_at).toLocaleString()}
                                        </div>
                                        <div>
                                          <strong>Validity:</strong>{" "}
                                          {new Date(xnode.validity_until).toLocaleString()}
                                        </div>
                                        <div>
                                          <strong>Node Type:</strong> {xnode.xnode_Type}
                                        </div>
                                        {/* <div>
                                      <strong>Primary owner:</strong>{" "}
                                      {capitalizeFirstLetter(xnode.primary_owner_username) || "N/A"}
                                    </div> */}
                                        <div>
                                          <strong>Current owner:</strong>{" "}
                                          {capitalizeFirstLetter(xnode.current_owner_username) || "N/A"}
                                        </div>
                                      </>
                                    }
                                  >
                                    <div className="resource-hover"
                                      id={
                                        xnode.xnode_Type === "INODE"
                                          ? "documents"
                                          : xnode.xnode_Type === "SNODE"
                                            ? "documents-byConfer"
                                            : "documents-byShare"
                                      }
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                      onMouseEnter={() => setHovered(xnode.id)}
                                      onMouseLeave={() => setHovered(null)}
                                    >
                                      <div>
                                        <span
                                          onClick={() => handleClick(xnode.id)}
                                          style={{ cursor: "pointer", flexGrow: 1, fontSize: "16px" }}
                                        >
                                          {xnode.resource_name}
                                        </span>



                                        {/* {error && <div className="error-message">{error}</div>} */}
                                      </div>
                                      <span
                                        className="resource-icons"
                                        style={{
                                          marginLeft: "auto",
                                          display: "flex",
                                          display: hovered === xnode.id ? "flex" : "none",
                                          gap: "10px",
                                        }}
                                      >
                                        {xnode.xnode_Type === "SNODE" && xnode.node_information.primary_owner == xnode.node_information.current_owner && (

                                          <>
                                            {/* <i
                                              className="subset-icon"
                                              data-tooltip-id="tooltip" data-tooltip-content="Subset"
                                              style={{
                                                cursor: "pointer",
                                              }}
                                              onClick={() => handleSubsetClick(xnode)}

                                            /> */}
                                            <i
                                              className="fa-regular fa-pen-to-square"
                                              data-tooltip-id="tooltip" data-tooltip-content="Edit"
                                              style={{
                                                cursor: "pointer",
                                              }}
                                              onClick={() => handleEditClick(xnode)}
                                            />
                                            <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} />

                                          </>

                                        )}
                                        {xnode.xnode_Type === "INODE" && xnode.node_information.primary_owner == xnode.node_information.current_owner && (
                                          <>
                                            <i
                                              className="subset-icon"
                                              data-tooltip-id="tooltip" data-tooltip-content="Subset"

                                              style={{
                                                cursor: "pointer",
                                              }}
                                              onClick={() => handleSubsetClick(xnode)}

                                            />

                                            <i
                                              className="fa-regular fa-pen-to-square"
                                              data-tooltip-id="tooltip" data-tooltip-content="Edit"
                                              style={{
                                                cursor: "pointer",
                                              }}
                                              onClick={() => handleEditClick(xnode)}
                                            />
                                            <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px", backgroundColor: "grey" }} />

                                          </>

                                        )}

                                        {xnode.xnode_Type === "VNODE" && (
                                          <>
                                            <i
                                              className="fa-regular fa-pen-to-square"
                                              data-tooltip-id="tooltip" data-tooltip-content="Edit"
                                              style={{
                                                cursor: "pointer",
                                              }}
                                              onClick={() => handleEditClick(xnode)}
                                            />
                                          </>
                                        )}

                                        <i className="bi bi-info-square"
                                          data-tooltip-id="tooltip"
                                          data-tooltip-content="View Details"
                                          style={{ marginTop: "-4px", cursor: "pointer" }}
                                          onClick={() => handleViewDetails(xnode.id)}
                                        />

                                        {xnode.xnode_Type === "INODE" && xnode.connection === null && xnode.node_information.primary_owner == xnode.node_information.current_owner && (
                                          <>
                                            <i
                                              className="fa-regular fa-trash-can"
                                              data-tooltip-id="tooltip" data-tooltip-content="Delete"
                                              style={{ cursor: "pointer" }}
                                              onClick={() => handleDeleteClick(xnode)}
                                            />
                                          </>
                                        )}



                                        <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} />

                                      </span>
                                    </div>
                                  </Tooltips>
                                  <ReactModal
                                    isOpen={isModalOpen}
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

                                </div>
                              </div>
                            )
                            )
                        ) : (
                          <p className="not-found">No Resources found.</p>
                        )
                      ) : (
                        <p className="not-found">No Resources found.</p>
                      )}
                    </ul>


                  )}




                  {/* "Connections" folder */}
                  {/* "Connections" folder */}
                  <div
                    className="resource-folder"
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      marginTop: "30px",
                    }}
                    onClick={() => setConnectionsVisible(!isConnectionsVisible)}
                  >
                    <i
                      className={`fa-solid fa-folder${isConnectionsVisible ? "-open" : ""}`}
                      style={{ marginRight: "10px", fontSize: "24px" }}
                    />
                    <span>Connections</span>
                  </div>

                  {/* Connections List inside the folder */}
                  {isConnectionsVisible && (
                    <ul style={{ paddingTop: "10px", paddingLeft: "20px", listStyleType: "none" }}>
                      {/* Incoming Connections Folder */}
                      <li
                        style={{ cursor: "pointer", fontSize: "18px" }}
                        onClick={() => setIncomingVisible(!isIncomingVisible)}
                      >
                        <i
                          className={`fa-solid fa-folder${isIncomingVisible ? "-open" : ""}`}
                          style={{ marginRight: "10px", fontSize: "18px" }}
                        />
                        Incoming Connections
                      </li>

                      {isIncomingVisible && (
                        <ul style={{ paddingLeft: "20px", listStyleType: "none" }}>
                          {otherConnections.length > 0 ? (
                            otherConnections.map((connection) => (
                              <li key={connection.connection_type_id} style={{ marginTop: "5px", fontSize: "18px" }}>
                                {/* Clickable connection name with folder icon */}
                                <div
                                  style={{
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                  onClick={() => toggleConnection(connection)}
                                >
                                  <i
                                    className={`fa-solid fa-folder${expandedConnection.includes(connection.connection_type_id) ? "-open" : ""}`}
                                    style={{ marginRight: "10px", fontSize: "18px" }}
                                  />
                                  {connection.connection_type_name}
                                </div>

                                {/* If connection is expanded, show users */}
                                {/* If connection is expanded, show users */}
                                {expandedConnection.includes(connection.connection_type_id) && (
                                  <ul style={{ paddingLeft: "30px", marginTop: "5px", listStyleType: "none" }}>
                                    {connectionUsers[connection.connection_type_id]?.connections?.length > 0 ? (
                                      connectionUsers[connection.connection_type_id].connections.map((user) => {
                                        const uniqueUserKey = `${user.guest_user.user_id}-${connection.connection_type_id}`; // Unique key for each user per connection

                                        return (
                                          <li key={uniqueUserKey} style={{ marginTop: "5px" }}>
                                            {/* Clickable user with folder icon */}
                                            <div
                                              style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                              }}
                                              onClick={() => toggleuser(user, connection)}
                                            >
                                              <i
                                                className={`fa-solid fa-folder${expandedusers.includes(uniqueUserKey) ? "-open" : ""}`}
                                                style={{ marginRight: "10px", fontSize: "16px" }}
                                              />
                                              {user.guest_user.username}
                                            </div>

                                            {/* If user is expanded, show resources */}
                                            {expandedusers.includes(uniqueUserKey) && (
                                              <ul style={{ paddingLeft: "40px", marginTop: "5px" }}>
                                                {userResources[`${user.guest_user.username}-${connection.connection_type_id}`]?.filter(xnode => xnode.status !== "closed").length > 0 ? (
                                                  userResources[`${user.guest_user.username}-${connection.connection_type_id}`].map((xnode) => (
                                                    <div
                                                      key={xnode.id}
                                                      className="resource-item"
                                                      style={{ paddingBottom: "0px" }}
                                                    >
                                                      <div className="resource-details">
                                                        <Tooltips
                                                          title={
                                                            <>
                                                              <div>
                                                                <strong>Created:</strong>{" "}
                                                                {new Date(xnode.created_at).toLocaleString()}
                                                              </div>
                                                              <div>
                                                                <strong>Validity:</strong>{" "}
                                                                {new Date(xnode.validity_until).toLocaleString()}
                                                              </div>
                                                              <div>
                                                                <strong>Node Type:</strong> {xnode.xnode_Type}
                                                              </div>
                                                              {/* <div>
                                                                <strong>Primary owner:</strong>{" "}
                                                                {capitalizeFirstLetter(xnode.primary_owner_username) || "N/A"}
                                                              </div> */}
                                                              <div>
                                                                <strong>Current owner:</strong>{" "}
                                                                {capitalizeFirstLetter(xnode.current_owner_username) || "N/A"}
                                                              </div>
                                                            </>
                                                          }
                                                        >
                                                          <div className="resource-hover"
                                                            id={
                                                              xnode.xnode_Type === "INODE"
                                                                ? "documents"
                                                                : xnode.xnode_Type === "SNODE"
                                                                  ? "documents-byConfer"
                                                                  : "documents-byShare"
                                                            }
                                                            style={{
                                                              display: "flex",
                                                              alignItems: "center",
                                                            }}
                                                            onMouseEnter={() => setHovered(xnode.id)}
                                                            onMouseLeave={() => setHovered(null)}
                                                          >
                                                            <div>
                                                              <span
                                                                onClick={() => handleClick(xnode.id)}
                                                                style={{ cursor: "pointer", flexGrow: 1, fontSize: "16px" }}
                                                              >
                                                                {xnode.resource_name}
                                                              </span>



                                                              {/* {error && <div className="error-message">{error}</div>} */}
                                                            </div>
                                                            <span
                                                              className="resource-icons"
                                                              style={{
                                                                marginLeft: "auto",
                                                                display: "flex",
                                                                display: hovered === xnode.id ? "flex" : "none",
                                                                gap: "10px",
                                                              }}
                                                            >
                                                              {xnode.xnode_Type === "SNODE" && xnode.node_information.primary_owner == xnode.node_information.current_owner && (

                                                                <>
                                                                  {/* <i
                                                                    className="subset-icon"
                                                                    data-tooltip-id="tooltip" data-tooltip-content="Subset"
                                                                    style={{
                                                                      cursor: "pointer",
                                                                    }}
                                                                    onClick={() => handleSubsetClick(xnode)}

                                                                  /> */}
                                                                  <i
                                                                    className="fa-regular fa-pen-to-square"
                                                                    data-tooltip-id="tooltip" data-tooltip-content="Edit"
                                                                    style={{
                                                                      cursor: "pointer",
                                                                    }}
                                                                    onClick={() => handleEditClick(xnode)}
                                                                  />
                                                                  <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} />

                                                                </>

                                                              )}
                                                              {xnode.xnode_Type === "INODE" && xnode.node_information.primary_owner == xnode.node_information.current_owner && (
                                                                <>
                                                                  <i
                                                                    className="subset-icon"
                                                                    data-tooltip-id="tooltip" data-tooltip-content="Subset"

                                                                    style={{
                                                                      cursor: "pointer",
                                                                    }}
                                                                    onClick={() => handleSubsetClick(xnode)}

                                                                  />

                                                                  <i
                                                                    className="fa-regular fa-pen-to-square"
                                                                    data-tooltip-id="tooltip" data-tooltip-content="Edit"
                                                                    style={{
                                                                      cursor: "pointer",
                                                                    }}
                                                                    onClick={() => handleEditClick(xnode)}
                                                                  />
                                                                  <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px", backgroundColor: "grey" }} />

                                                                </>

                                                              )}


                                                              {xnode.xnode_Type === "VNODE" && (
                                                                <>
                                                                  <i
                                                                    className="fa-regular fa-pen-to-square"
                                                                    data-tooltip-id="tooltip" data-tooltip-content="Edit"
                                                                    style={{
                                                                      cursor: "pointer",
                                                                    }}
                                                                    onClick={() => handleEditClick(xnode)}
                                                                  />
                                                                </>
                                                              )}

                                                              <i className="bi bi-info-square"
                                                                data-tooltip-id="tooltip"
                                                                data-tooltip-content="View Details"
                                                                style={{ marginTop: "-4px", cursor: "pointer" }}
                                                                onClick={() => handleViewDetails(xnode.id)}
                                                              />

                                                              {/* <i
                                                                className="fa-regular fa-trash-can"
                                                                data-tooltip-id="tooltip" data-tooltip-content="Delete"
                                                                style={{ cursor: "pointer" }}
                                                                onClick={() => handleDeleteClick(xnode)}
                                                              /> */}
                                                              <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} />

                                                            </span>
                                                          </div>
                                                        </Tooltips>
                                                        <ReactModal
                                                          isOpen={isModalOpen}
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

                                                      </div>
                                                    </div>
                                                  ))
                                                ) : (
                                                  <p style={{ fontSize: "14px", color: "#888" }}>No Resources found.</p>
                                                )}

                                              </ul>
                                            )}
                                          </li>
                                        );
                                      })
                                    ) : (
                                      <p style={{ fontSize: "14px", color: "#888" }}>No users found.</p>
                                    )}
                                  </ul>
                                )}

                              </li>
                            ))
                          ) : (
                            <p style={{ fontSize: "16px", color: "#888" }}>No connections found.</p>
                          )}
                        </ul>
                      )}



                      {/* Outgoing Connections Folder */}
                      <li
                        style={{ cursor: "pointer", marginTop: "5px", fontSize: "18px" }}
                        onClick={() => setOutgoingVisible(!isOutgoingVisible)}
                      >
                        <i
                          className={`fa-solid fa-folder${isOutgoingVisible ? "-open" : ""}`}
                          style={{ marginRight: "10px", fontSize: "18px" }}
                        />
                        Outgoing Connections
                      </li>
                      {isOutgoingVisible && (
                        <ul style={{ paddingLeft: "20px", listStyleType: "none" }}>
                          {allOutgoingConnections.length > 0 ? (
                            allOutgoingConnections.map((connection) => (
                              <li key={connection.connection_id} style={{ marginTop: "5px", fontSize: "18px" }}>
                                <div
                                  style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
                                  onClick={() => toggleOutgoingConnection(connection)}
                                >
                                  <i
                                    className={`fa-solid fa-folder${expandedConnections.includes(connection.connection_id) ? "-open" : ""}`}
                                    style={{ marginRight: "10px", fontSize: "18px" }}
                                  />
                                  {connection.connection_type_name}
                                </div>

                                {/* If connection is expanded, show resources */}
                                {expandedConnections.includes(connection.connection_id) && (
                                  <ul style={{ paddingLeft: "40px", marginTop: "5px" }}>
                                    {userResources[connection.connection_id]?.filter(xnode => xnode.status !== "closed").length > 0 ? (
                                      userResources[connection.connection_id].map((xnode) => (
                                        <div
                                          key={xnode.id}
                                          className="resource-item"
                                          style={{ paddingBottom: "0px" }}
                                        >
                                          <div className="resource-details">
                                            <Tooltips
                                              title={
                                                <>
                                                  <div>
                                                    <strong>Created:</strong>{" "}
                                                    {new Date(xnode.created_at).toLocaleString()}
                                                  </div>
                                                  <div>
                                                    <strong>Validity:</strong>{" "}
                                                    {new Date(xnode.validity_until).toLocaleString()}
                                                  </div>
                                                  <div>
                                                    <strong>Node Type:</strong> {xnode.xnode_Type}
                                                  </div>
                                                  {/* <div>
                                                                <strong>Primary owner:</strong>{" "}
                                                                {capitalizeFirstLetter(xnode.primary_owner_username) || "N/A"}
                                                              </div> */}
                                                  <div>
                                                    <strong>Current owner:</strong>{" "}
                                                    {capitalizeFirstLetter(xnode.current_owner_username) || "N/A"}
                                                  </div>
                                                </>
                                              }
                                            >
                                              <div className="resource-hover"
                                                id={
                                                  xnode.xnode_Type === "INODE"
                                                    ? "documents"
                                                    : xnode.xnode_Type === "SNODE"
                                                      ? "documents-byConfer"
                                                      : "documents-byShare"
                                                }
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                }}
                                                onMouseEnter={() => setHovered(xnode.id)}
                                                onMouseLeave={() => setHovered(null)}
                                              >
                                                <div>
                                                  <span
                                                    onClick={() => handleClick(xnode.id)}
                                                    style={{ cursor: "pointer", flexGrow: 1, fontSize: "16px" }}
                                                  >
                                                    {xnode.resource_name}
                                                  </span>



                                                  {/* {error && <div className="error-message">{error}</div>} */}
                                                </div>
                                                <span
                                                  className="resource-icons"
                                                  style={{
                                                    marginLeft: "auto",
                                                    display: "flex",
                                                    display: hovered === xnode.id ? "flex" : "none",
                                                    gap: "10px",
                                                  }}
                                                >
                                                  {xnode.xnode_Type === "SNODE" && xnode.node_information.primary_owner == xnode.node_information.current_owner && (

                                                    <>
                                                      {/* <i
                                                        className="subset-icon"
                                                        data-tooltip-id="tooltip" data-tooltip-content="Subset"
                                                        style={{
                                                          cursor: "pointer",
                                                        }}
                                                        onClick={() => handleSubsetClick(xnode)}

                                                      /> */}
                                                      <i
                                                        className="fa-regular fa-pen-to-square"
                                                        data-tooltip-id="tooltip" data-tooltip-content="Edit"
                                                        style={{
                                                          cursor: "pointer",
                                                        }}
                                                        onClick={() => handleEditClick(xnode)}
                                                      />
                                                      <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} />

                                                    </>

                                                  )}
                                                  {xnode.xnode_Type === "INODE" && xnode.node_information.primary_owner == xnode.node_information.current_owner && (
                                                    <>
                                                      <i
                                                        className="subset-icon"
                                                        data-tooltip-id="tooltip" data-tooltip-content="Subset"

                                                        style={{
                                                          cursor: "pointer",
                                                        }}
                                                        onClick={() => handleSubsetClick(xnode)}

                                                      />

                                                      <i
                                                        className="fa-regular fa-pen-to-square"
                                                        data-tooltip-id="tooltip" data-tooltip-content="Edit"
                                                        style={{
                                                          cursor: "pointer",
                                                        }}
                                                        onClick={() => handleEditClick(xnode)}
                                                      />
                                                      <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px", backgroundColor: "grey" }} />

                                                    </>

                                                  )}

                                                  {xnode.xnode_Type === "VNODE" && (
                                                    <>
                                                      <i
                                                        className="fa-regular fa-pen-to-square"
                                                        data-tooltip-id="tooltip" data-tooltip-content="Edit"
                                                        style={{
                                                          cursor: "pointer",
                                                        }}
                                                        onClick={() => handleEditClick(xnode)}
                                                      />
                                                    </>
                                                  )}

                                                  <i className="bi bi-info-square"
                                                    data-tooltip-id="tooltip"
                                                    data-tooltip-content="View Details"
                                                    style={{ marginTop: "-4px", cursor: "pointer" }}
                                                    onClick={() => handleViewDetails(xnode.id)}
                                                  />

                                                  {/* <i
                                                    className="fa-regular fa-trash-can"
                                                    data-tooltip-id="tooltip" data-tooltip-content="Delete"
                                                    style={{ cursor: "pointer" }}
                                                    onClick={() => handleDeleteClick(xnode)}
                                                  /> */}
                                                  <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} />

                                                </span>
                                              </div>
                                            </Tooltips>
                                            <ReactModal
                                              isOpen={isModalOpen}
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

                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <p style={{ fontSize: "14px", color: "#888" }}>No Resources found.</p>
                                    )}
                                  </ul>
                                )}
                              </li>
                            ))
                          ) : (
                            <p style={{ fontSize: "14px", color: "#888" }}>No outgoing connections found.</p>
                          )}
                        </ul>
                      )}
                    </ul>
                  )}


                </div>

              </div>

            </div>
            {/* <button className="page3button" onClick={handleUploadResource}>
              Upload resource
            </button> */}
          </Grid>
          <Grid item md={1} xs={12} marginBottom={{ md: "", xs: "50px" }}></Grid>
          <Grid item md={5.5} xs={12} className="b">
            <Grid container paddingBottom={"10px"}>
              <Grid item md={7} xs={12}><h3 id="mycon">Connections for this locker </h3></Grid>
              {/* <Grid item md={1} xs={12}></Grid> */}
              <Grid item md={5} xs={12}>
                <Button onClick={gotopage12createconnection} className="btn-color" style={{ fontSize: "13px" }}>
                  Create New Connection Type
                </Button>
              </Grid>
            </Grid>
            <div className="tabs">
              <div
                className={`tab-header ${activeTab === "incoming" ? "active" : ""
                  }`}
                data-tooltip-id="tooltip" data-tooltip-content=""
                onClick={() => setActiveTab("incoming")}
              >
                Incoming Connections
              </div>
              <div
                className={`tab-header ${activeTab === "outgoing" ? "active" : ""
                  }`}
                data-tooltip-id="tooltip" data-tooltip-content=""
                onClick={() => setActiveTab("outgoing")}
              >
                Outgoing Connections
              </div>
              <div
                className={`tab-header ${activeTab === "archived" ? "active" : ""
                  }`}
                data-tooltip-id="tooltip" data-tooltip-content=""
                onClick={() => setActiveTab("archived")}
              >
                Archived Connections
              </div>
              {/* <Tooltip id="tooltip" style={{ maxWidth: '150px', whiteSpace: 'normal', fontSize: "13px" }} /> */}
            </div>
            <div className="tab-content">
              {activeTab === "incoming" && (
                //               <div className="tab-panel">
                //   <h4 id="headingconnection">Incoming Connection types</h4>
                //   <div className="conn">
                //     {otherConnections.length > 0 ? (
                //       otherConnections.map((connection) => (
                //         <div
                //           key={connection.connection_type_id}
                //           className="viewlockerconnections"
                //         >
                //           <h4 id="connectiontype">
                //             <button
                //               className="connection-name-button"
                //               onClick={() => handleConnectionClick(connection)}
                //               style={{
                //                 textDecoration: "underline",
                //                 background: "none",
                //                 border: "none",
                //                 padding: 0,
                //                 cursor: "pointer",
                //                 color: "inherit",
                //               }}
                //             >
                //               <u>{connection.connection_type_name}</u>
                //             </button>
                //             {" "} (users: {connection.incoming_count})
                //           </h4>
                //           <button
                //             className="info-button2"
                //             onClick={() => handleIncomingInfo(connection)}
                //           >
                //             i
                //           </button>
                //           <div id="conntent">
                //                 {connection.connection_description}
                //               </div>
                //               <div id="conntent">
                //                 Created On:{" "}
                //                 {new Date(connection.created_time).toLocaleString()}
                //               </div>
                //               <div id="conntent">
                //                 Valid Until:{" "}
                //                 {new Date(connection.validity_time).toLocaleString()}
                //               </div>

                //         </div>
                //       ))
                //     ) : (
                //       <p>No connections found.</p>
                //     )}
                //   </div>
                // </div>

                <div className="tab-panel">
                  <h4 id="headingconnection">Incoming connection types</h4>
                  <div className="conn">
                    {otherConnections.length > 0 ? (
                      otherConnections.map((connection) => (
                        <Grid container
                          key={connection.connection_type_id}
                          className="viewlockerconnections"
                        >
                          <Grid item md={11} xs={10}>
                            <h4 id="connectiontype">
                              <button
                                className="connection-name-button"
                                onClick={() => handleConnectionClick(connection)}
                                style={{
                                  textDecoration: "none",
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  cursor: "pointer",
                                  color: "inherit",
                                }}
                              >
                                <u>{connection.connection_type_name}</u>
                              </button>{" "}
                              (users: {connection.incoming_count})
                            </h4>
                          </Grid>

                          <Grid item md={1} xs={1}>
                            <i class="bi bi-info-circle info-icon " data-tooltip-id="tooltip" data-tooltip-content="Connection Terms" style={{ fontSize: "20px", fontWeight: "bold", cursor: "pointer" }} onClick={() => handleIncomingInfo(connection)}></i>
                            {/* <button
                              className="info-button2"
                              onClick={() => handleIncomingInfo(connection)}
                            >
                              i
                            </button> */}
                          </Grid>
                        </Grid>
                      ))
                    ) : (
                      <p>No connections found.</p>
                    )}
                  </div>
                </div>
              )}

              {showSubsetModal && (
                <div className="edit-modal">
                  <div className="modal-content">
                    <h4 className="subset-title">
                      Create Subset for {selectedResource.resource_name}
                    </h4>
                    {/* {subsetError && <div className="error-popup" style={{color:"red"}}>*{subsetError}</div>} */}
                    <label className="form-label fw-bold mt-1">Resource Name <span style={{ color: "red" }}>*</span></label>
                    <input
                      className="form-control"
                      type="text"
                      value={inodeName}
                      onChange={(e) => setInodeName(e.target.value)}
                    />
                    <label className="form-label fw-bold  mt-1">Max Page</label>
                    <input readOnly disabled
                      className="form-control"
                      // type="number"
                      // min="1"
                      value={totalPages}
                    />
                    <label className="form-label fw-bold mt-1">From Page <span style={{ color: "red" }}>*</span></label>
                    <input
                      className="form-control"
                      type="number"

                      // max={maxPage ? maxPage - 1 : ""}
                      value={fromPage}
                      onChange={(e) =>
                        setFromPage(e.target.value)
                      }

                    />
                    <label className="form-label fw-bold  mt-1">To Page <span style={{ color: "red" }}>*</span></label>
                    <input
                      className="form-control"
                      type="number"
                      value={toPage}
                      onChange={(e) =>
                        setToPage(e.target.value)
                      }
                    />
                    {subsetError && <div className="error-popup mt-1" style={{ color: "red" }}>{subsetError}</div>}

                    <div className="modal-buttons mt-4">
                      <button
                        onClick={() => handleCreateSubset(selectedResource)}
                      >
                        Create
                      </button>
                      <button onClick={() => handleCloseSubset()}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Resource Modal */}
              {showEditModal && (
                <div className="edit-modal">
                  <div className="modal-content">
                    <h3>Edit Resource</h3>
                    <label className="form-label fw-bold">Resource Name:</label>
                    <input
                      className="form-control"
                      type="text"
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                      disabled={selectedResource?.xnode_Type !== "INODE"}
                    />

                    <label className="form-label fw-bold">Visibility:</label>
                    <select
                      className="form-select"
                      id="visibility"
                      value={resourceVisibility}
                      onChange={(e) => setResourceVisibility(e.target.value)}
                      disabled={selectedResource?.xnode_Type !== "INODE"}
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                    </select>

                    <label htmlFor="validityTime" className="form-label fw-bold">Validity Time</label>
                    <input
                      type="date"
                      className="form-control"
                      value={resourceValidity}
                      onChange={(e) => setResourceValidity(e.target.value)}
                      disabled={selectedResource?.xnode_Type !== "INODE"}
                    />

                    <label htmlFor="postConditions" className="form-label fw-bold mt-2">Post conditions</label>
                    <div id="postConditions" className="row">
                      {Object.entries(postConditions).map(([key, value], index) => (
                        <div className="col-md-4" key={key}>
                          <div className="form-check mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={key}
                              checked={value}
                              disabled={
                                selectedResource?.creator !== selectedResource?.node_information?.current_owner &&
                                isLockedPostConditions?.[key] === true
                              }
                              onChange={(e) => {
                                setPostConditions((prev) => ({
                                  ...prev,
                                  [key]: e.target.checked,
                                }));
                              }}
                              style={{ cursor: "pointer" }}
                            />
                            <label className="form-check-label" htmlFor={key}>
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>




                    <div className="modal-buttons mt-4">
                      {/* Use an anonymous function to call handleSaveResource */}
                      <button onClick={() => handleSaveResource(selectedResource)} >Save</button>
                      <button onClick={() => setShowEditModal(false)}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}



              {/* Success/Failure Modal */}
              {modalMessage && (
                <Modal
                  message={modalMessage.message}
                  type={modalMessage.type}
                  onClose={handleCloseModal}
                />
              )}


              {activeTab === "outgoing" && (
                <div className="tab-panel">
                  <h4 id="headingconnection">Outgoing connections</h4>
                  <div className="conn">
                    {connections.outgoing_connections.length > 0 ? (
                      connections.outgoing_connections.map(
                        (connection, index) => {
                          const tracker = trackerData[connection.connection_id];
                          const color = tracker
                            ? getStatusColor(tracker)
                            : "gray";
                          const ratio = tracker
                            ? calculateRatio(tracker)
                            : "Loading...";
                          const trackerReverse = trackerDataReverse[connection.connection_id]
                          const colorReverse = trackerReverse
                            ? getStatusColorReverse(trackerReverse)
                            : "gray";
                          const ratioReverse = trackerReverse
                            ? calculateRatioReverse(trackerReverse)
                            : "Loading...";
                          return (
                            <Grid container
                              key={connection.connection_id}
                              className="viewlockerconnections"
                            >

                              <Grid item md={8} xs={12}>
                                <div className="mb-2">
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
                                {/* <div id="conntent">
                                  {connection.guest_locker.name} <i class="bi bi-arrows me-1" style={{ fontSize: "16px" }}></i>
                                  {connection.host_locker.name}
                                </div> */}
                                {/* <div id="conntent">
                                  Created On:{" "}
                                  {new Date(
                                    connection.created_time
                                  ).toLocaleString()}
                                </div> */}
                                <div id="conntent">
                                  Valid Until:{" "}
                                  {new Date(
                                    connection.validity_time
                                  ).toLocaleString()}
                                </div>
                              </Grid>
                              <Grid item paddingTop={{ md: "10px", xs: "" }} md={4} xs={12}>
                                {/* <div>
                                  <button data-tooltip-id="tooltip" data-tooltip-content="Terms of connection"
                                    className="info-button" style={{ marginRight: '26px', marginLeft: "-6px" }}
                                    onClick={() =>
                                      handleConsentAndInfo(connection)
                                    }
                                  >
                                    c
                                  </button>
                                  <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} />

                                </div> */}

                                {/* <button
                                  className="info-button"
                                  onClick={() => handleInfo(connection)}
                                >
                                  i{" "}
                                </button> */}
                                <div className="d-flex align-items-center">

                                  <h6 className="mt-2 me-2">{capitalizeFirstLetter(connection.guest_user.username)}</h6>
                                  <i className="bi bi-arrow-right me-2" style={{ fontSize: '1.2rem' }}></i>
                                  <button
                                    onClick={() => handleTracker(connection)}
                                    style={{
                                      backgroundColor: color,
                                      border: 'none',
                                      padding: '5px 10px',
                                      borderRadius: '5px',
                                      color: '#fff',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {ratio}
                                  </button>
                                </div>

                                <div className="d-flex align-items-center mt-1">
                                  <button className="me-2"
                                    onClick={() => handleTrackerHost(connection)}
                                    style={{
                                      backgroundColor: colorReverse,
                                      border: 'none',
                                      padding: '5px 10px',
                                      borderRadius: '5px',
                                      color: '#fff',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {ratioReverse}
                                  </button>
                                  <i className="bi bi-arrow-left me-2" style={{ fontSize: '1.2rem' }}></i>

                                  <h6 className="mt-2">{capitalizeFirstLetter(connection.host_user.username)}</h6>


                                </div>
                              </Grid>
                            </Grid>
                          );
                        }
                      )
                    ) : (
                      <p>No outgoing connections found.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "archived" && (
                <>
                  <div className="tab-panel">
                    <h4 id="headingconnection">Closed connections</h4>
                    <div className="conn">
                      {closedConnections.length > 0 ? (
                        closedConnections.map(
                          (connection, index) => {
                            const tracker = trackerData[connection.connection_id];
                            const color = tracker
                              ? "gray"
                              : "gray";
                            const ratio = tracker
                              ? calculateRatio(tracker)
                              : "Loading...";
                            const trackerReverse = trackerDataReverse[connection.connection_id]
                            const colorReverse = trackerReverse
                              ? "gray"
                              : "gray";
                            const ratioReverse = trackerReverse
                              ? calculateRatioReverse(trackerReverse)
                              : "Loading...";
                            return (
                              <Grid container
                                key={connection.connection_id}
                                className="viewlockerconnections"
                                style={{
                                  backgroundColor: "#f0f0f0",
                                  border: "1px solid #ccc",
                                  opacity: "0.85",
                                  color: "#555",
                                  padding: "1rem",
                                  borderRadius: "8px",
                                  marginBottom: "1rem",
                                }}
                              >

                                <Grid item md={8} xs={12}>
                                  <div className="mb-2">
                                    <button
                                      className="connection-name-button"
                                      // onClick={() => handleTracker(connection)}
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
                                  {/* <div id="conntent">
                                  {connection.guest_locker.name} <i class="bi bi-arrows me-1" style={{ fontSize: "16px" }}></i>
                                  {connection.host_locker.name}
                                </div> */}
                                  {/* <div id="conntent">
                                  Created On:{" "}
                                  {new Date(
                                    connection.created_time
                                  ).toLocaleString()}
                                </div> */}
                                  <div id="conntent">
                                    Valid Until:{" "}
                                    {new Date(
                                      connection.validity_time
                                    ).toLocaleString()}
                                  </div>
                                </Grid>
                                <Grid item paddingTop={{ md: "10px", xs: "" }} md={4} xs={12}>
                                  {/* <div>
                                  <button data-tooltip-id="tooltip" data-tooltip-content="Terms of connection"
                                    className="info-button" style={{ marginRight: '26px', marginLeft: "-6px" }}
                                    onClick={() =>
                                      handleConsentAndInfo(connection)
                                    }
                                  >
                                    c
                                  </button>
                                  <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} />

                                </div> */}

                                  {/* <button
                                  className="info-button"
                                  onClick={() => handleInfo(connection)}
                                >
                                  i{" "}
                                </button> */}
                                  <div className="d-flex align-items-center">

                                    <h6 className="mt-2 me-2">{capitalizeFirstLetter(connection.guest_user.username)}</h6>
                                    <i className="bi bi-arrow-right me-2" style={{ fontSize: '1.2rem' }}></i>
                                    <button
                                      // onClick={() => handleTracker(connection)}
                                      style={{
                                        backgroundColor: color,
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '5px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {ratio}
                                    </button>
                                  </div>

                                  <div className="d-flex align-items-center mt-1">
                                    <button className="me-2"
                                      // onClick={() => handleTrackerHost(connection)}
                                      style={{
                                        backgroundColor: colorReverse,
                                        border: 'none',
                                        padding: '5px 10px',
                                        borderRadius: '5px',
                                        color: '#fff',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      {ratioReverse}
                                    </button>
                                    <i className="bi bi-arrow-left me-2" style={{ fontSize: '1.2rem' }}></i>

                                    <h6 className="mt-2">{capitalizeFirstLetter(connection.host_user.username)}</h6>


                                  </div>
                                </Grid>
                              </Grid>
                            );
                          }
                        )
                      ) : (
                        <p>No archived connections found.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </Grid>
        </Grid>

      </div>
      {/* {pdfUrl && <PDFViewer pdfUrl={pdfUrl} />} */}
      {resourceViewModal && (
        <div className="edit-modal ">
          <div className="modal-content">
            {/* Close Button */}
            <div className="close-detail">
              <button
                type="button"
                className="position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center border-0 bg-transparent"
                onClick={handleViewClose}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#f8d7da", // Light red for a subtle look
                  color: "#721c24", // Darker red for contrast
                  boxShadow: "0 3px 10px rgba(0, 0, 0, 0.2)",
                  cursor: "pointer",
                  transition: "0.3s ease-in-out",
                }}
                aria-label="Close"
              >
                <i className="bi bi-x-lg" style={{ fontSize: "18px" }}></i>
              </button>
            </div>
            <div
              className="fw-bold  mb-1"
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "15px",
                marginBottom: "15px",
                marginTop: "4px",
                fontSize: "1.5rem",
                fontWeight: "bold"
              }}
            >
              Resource Details
              {resourceData?.xnode_Type !== "VNODE" && (
                <>
                  {resourceData?.current_owner_username === resourceData?.primary_owner_username ? (
                    <i className="bi bi-unlock-fill"></i>
                  ) : (
                    <i className="bi bi-lock-fill"></i>
                  )}
                </>
              )}
            </div>

            <div className="card p-3 shadow-lg border-0">
              <div className="d-flex justify-content-between border-bottom pb-2">
                <span className="fw-bold">Resource Name:</span>
                <span>{resourceData.resource_name}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom py-2">
                <span className="fw-bold">Created at:</span>
                <span>{new Date(resourceData.created_at).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom py-2">
                <span className="fw-bold">Validity until:</span>
                <span>{new Date(resourceData.validity_until).toLocaleString()}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom py-2">
                <span className="fw-bold">Creator:</span>
                <span style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }} onClick={() => handleuserclick(resourceData.creator_details)}>{capitalizeFirstLetter(resourceData.creator_username)}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom py-2">
                <span className="fw-bold">Current owner:</span>
                <span>{capitalizeFirstLetter(resourceData.current_owner_username)}</span>
              </div>
              <div className="d-flex justify-content-between border-bottom py-2">
                <span className="fw-bold">Connection Type:</span>
                <span>{resourceData?.connection?.connection_type_name ? resourceData.connection.connection_type_name : "N/A"}
                </span>
              </div>
              <div className="d-flex justify-content-between border-bottom py-2 align-items-center">
                <span className="fw-bold">Post Conditions:</span>
                <span className=" text-end">
                  {postConditionsKeys.length > 0 ? postConditionsKeys.join(", ") : "No conditions found"}
                </span>
              </div>
            </div>
          </div>
        </div>

      )}
      {/* <Tooltip id="tooltip" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "13px" }} /> */}

    </div>

  );
};
