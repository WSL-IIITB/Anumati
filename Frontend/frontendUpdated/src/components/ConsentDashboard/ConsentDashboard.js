import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import "./ConsentDashboard.css";
import Cookies from "js-cookie";
import { frontend_host } from "../../config";
import Modal from "../Modal/Modal.jsx";
import Sidebar from "../Sidebar/Sidebar.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { Box, TextField } from "@mui/material";
import { FaUnlink } from 'react-icons/fa';


export const ConsentDashboard = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("incoming");
  const [activeMenu, setActiveMenu] = useState("Home");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  const [incomingConnections, setIncomingConnections] = useState([]);
  const [outgoingConnections, setOutgoingConnections] = useState([]);
  const [openCards, setOpenCards] = useState({});
  const [openOutgoingCards, setOpenOutgoingCards] = useState({});
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  // const[incomingRevertComment, setIncomingRevertComment] = useState("");
  const [showIncomingRevertPopup, setShowIncomingRevertPopup] = useState(false);
  const [showOutgoingRevertPopup, setShowOutgoingRevertPopup] = useState(false);
  // const [showModal, setShowModal] = useState(false);
  const [revertReason, setRevertReason] = useState("");
  const [currentData, setCurrentData] = useState({});
  // const [showFilters, setShowFilters] = useState(false);
  const [lockers, setLockers] = useState([]);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showLockers, setShowLockers] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [searchValue, setSearchValue] = useState(""); // Triggered search
  const [responseMessage, setResponseMessage] = useState("");
  const [responseModal, setResponseModal] = useState(false);
  const [allIncomingConnections, setAllIncomingConnections] = useState([]);
  const [allOutgoingConnections, setAllOutgoingConnections] = useState([]);
  const [revertRejectReason, setRevertRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false)


  // const [error] = useState("");

  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  const [statsData, setStatsData] = useState({
    incoming: {
      total_Users: 0,
      live: 0,
      established: 0,
      closed: 0,
      total_connections_type: 0
    },
    outgoing: {
      total_Connections: 0,
      live: 0,
      established: 0,
      closed: 0
    }
  });
  const [loadingResourceId, setLoadingResourceId] = useState(null);
  const [connectionUsers, setConnectionUsers] = useState({});
  const [openUserDetails, setOpenUserDetails] = useState({});
  const [resourceLists, setResourceLists] = useState({});
  const [resourceViewModal, setResourceViewModal] = useState(false);
  const [resourceData, setResourceData] = useState(null)
  const [outgoingResourceLists, setOutgoingResourceLists] = useState({});
  const [loadingOutgoingResource, setLoadingOutgoingResource] = useState({});
  const [message, setMessage] = useState("");
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [loadingResources, setLoadingResources] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [tempSelectedStatus, setTempSelectedStatus] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [tempSelectedLockers, setTempSelectedLockers] = useState([]);
  const [selectedLockers, setSelectedLockers] = useState([]);
  const [filteredConnections, setFilteredConnections] = useState([])

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
    fetchLockers();
  }, []);

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedLockers.length > 0 || selectedStatus.length > 0) {
      handleApplyFilter();
    } else {
      if (activeTab === "incoming") {
        setFilteredConnections(incomingConnections);
      } else {
        setFilteredConnections(outgoingConnections);
      }
    }
  }, [
    activeTab,
    incomingConnections,
    outgoingConnections,
    selectedLockers,
    selectedStatus,
  ]);

  useEffect(() => {
    if (selectedLockers.length > 0 || selectedStatus.length > 0) {
      handleApplyFilter();
    } else if (!searchQuery.trim()) {
      if (activeTab === "incoming") {
        setFilteredConnections(incomingConnections);
      } else {
        setFilteredConnections(outgoingConnections);
      }
    }
  }, [
    searchQuery,
    activeTab,
    incomingConnections,
    outgoingConnections,
    selectedLockers,
    selectedStatus,
  ]);

  useEffect(() => {

  }, [searchQuery])

  // useEffect(() => {
  //   const activeConnections =
  //     activeTab === "incoming" ? allIncomingConnections : allOutgoingConnections;

  //   setFilteredConnections(activeConnections);
  //   setSearchQuery(""); // clear search on tab change
  // }, [activeTab]);


  console.log("searchQuery", searchQuery)

  // useEffect(() => {
  //   if (!searchQuery.trim()) {
  //     if (activeTab === "incoming") {
  //       setFilteredConnections(incomingConnections);
  //     } else {
  //       setFilteredConnections(outgoingConnections);
  //     }
  //   }
  // }, [searchQuery, activeTab, incomingConnections, outgoingConnections]);



  const fetchStats = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`${frontend_host}/stats/`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("Response status:", response.status);
      console.log("Raw stats data:", data);

      // ✅ Only check for response.ok
      if (!response.ok) {
        console.warn("Stats fetch failed with status:", response.status);
        return;
      }

      // ✅ Update state directly
      setStatsData({
        incoming: data.incoming,
        outgoing: data.outgoing
      });

    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleToggleOutgoing = (index) => {
    setOpenOutgoingCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleToggle = async (index, conn) => {
    setOpenCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));


    // Only fetch if not already fetched
    if (!connectionUsers[index]) {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(
          `${frontend_host}/get-guest-user-connection-id/?connection_type_id=${conn.connection_type_id}&locker_id=${conn.owner_locker}&user_id=${conn.owner_user}`,
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        if (response.ok && data.connections) {
          setConnectionUsers((prev) => ({
            ...prev,
            [index]: data.connections,
          }));
        } else {
          console.error("Error fetching users:", data.error);
          setConnectionUsers((prev) => ({
            ...prev,
            [index]: [],
          }));
        }
      } catch (err) {
        console.error("Fetch failed:", err);
      }
    }
  };

  useEffect(() => {



    const fetchIncomingConnections = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(`${frontend_host}/all_connection_types/`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        console.log("Fetched data:", data);

        if (!response.ok || !data.success) {
          return;
        }

        // setIncomingConnections(data.connection_types || []);
        setIncomingConnections(data.connection_types || []);
        setAllIncomingConnections(data.connection_types || []);

      } catch (error) {
        console.error("Error fetching connections:", error);
      }
    };

    const fetchOutgoingConnections = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(`${frontend_host}/get-outgoing-connections-by-user/`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        console.log("Fetched outgoing data:", data);

        if (!response.ok || !data.success) {
          return;
        }

        // setOutgoingConnections(data.outgoing_connections || []);
        setOutgoingConnections(data.outgoing_connections || []);
        setAllOutgoingConnections(data.outgoing_connections || []);

      } catch (error) {
        console.error("Error fetching connections:", error);
      }
    };


    if (curruser) {
      fetchStats();
      fetchIncomingConnections();
      fetchOutgoingConnections();
    }
  }, [curruser]);

  // console.log("Incoming Connections:", incomingConnections);
  console.log("Outgoing Connections:", statsData);

  const handleUserToggle = (connIndex, userIndex) => {
    setOpenUserDetails((prev) => ({
      ...prev,
      [`${connIndex}-${userIndex}`]: !prev[`${connIndex}-${userIndex}`],
    }));
  };

  const fetchResources = async (user, connectionIndex, userIndex) => {
    console.log("Calling fetchResources with:", user, connectionIndex, userIndex);
    const key = `${connectionIndex}-${userIndex}`;
    const connectionId = user.connection_id;
    setLoadingResources(prev => ({ ...prev, [key]: true }));

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `${frontend_host}/all_incoming_connection_resource/?connection_id=${connectionId}&guest_user_id=${user.guest_user.user_id}&guest_locker_id=${user.guest_locker.locker_id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        setResourceLists(prev => ({
          ...prev,
          [key]: data.data
        }));
      } else {
        setResourceLists(prev => ({
          ...prev,
          [key]: []
        }));
      }

      // setSelectedResourceCards(prev => ({
      //   ...prev,
      //   [key]: true
      // }));

    } catch (err) {
      console.error("Error fetching resources:", err);
    } finally {
      setLoadingResources(prev => ({ ...prev, [key]: false }));
    }
  };

  const fetchOutgoingResources = async (user, index) => {
    const key = `${index}`;
    setLoadingOutgoingResource((prev) => ({ ...prev, [key]: true }));

    try {
      const token = Cookies.get("authToken");

      const res = await fetch(
        `${frontend_host}/all_outgoing_connection_resource/?connection_id=${user.connection_id}&host_user_id=${user.host_user.user_id}&host_locker_id=${user.host_locker.locker_id}`,
        {
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await res.json();
      console.log("Outgoing Resources:", data);

      if (data.success) {
        setOutgoingResourceLists((prev) => ({
          ...prev,
          [key]: data.data || [],
        }));
      } else {
        setOutgoingResourceLists((prev) => ({
          ...prev,
          [key]: [],
        }));
      }
    } catch (error) {
      console.error("Error fetching outgoing resources:", error);
    } finally {
      setLoadingOutgoingResource((prev) => ({ ...prev, [key]: false }));
    }
  };

  const outgoingRevertModal = (xnodeId, conn, index) => {
    setCurrentData({ xnodeId, conn, index });
    setShowOutgoingRevertPopup(true);
    console.log("Outgoing Revert Modal Data:", { xnodeId, conn, index });
  }

console.log("currentData", currentData)


  const handleOutgoingRevertClick = async () => {
    console.log("Revert clicked for xnodeId:", currentData);
    const revert_reason = revertReason;
    // if (!revert_reason) alert("Reason is required to revert the consent");
    if(responseModal){

    } else if (!revert_reason || revert_reason.trim() === "") {
      alert("Reason is required to revert the consent.");
      return; // Stop execution if no reason is provided
    }

    setLoadingResourceId(currentData.xnodeId);
    setMessage("");

    try {
      const token = Cookies.get("authToken");

      const response = await fetch(`${frontend_host}/revert-consent/`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xnode_id: currentData.xnodeId,
          revert_reason: revert_reason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setModalMessage({
          message: data.message || "Revert successful",
          type: 'success',
        });
        setShowOutgoingRevertPopup(false);
        setRevertReason("");
        setCurrentData({});
        setIsModalOpen(true);
        setResponseModal(false)
        setResponseMessage("")

        fetchOutgoingResources(currentData.conn, currentData.index)


      } else {
        setModalMessage({
          message: data.error || "Failed to revert consent",
          type: 'failure',
        });
        setShowOutgoingRevertPopup(false);
        setRevertReason("");
        setCurrentData({});
        setResponseModal(false)
        setResponseMessage("")
        setIsModalOpen(true);
      }
    } catch (error) {
      // console.error("Error during revert request:", error);
      setModalMessage({
        message: error || "Error during revert request",
        type: 'failure',
      });
      setShowOutgoingRevertPopup(false);
      setRevertReason("");
      setCurrentData({});
      setResponseModal(false)
      setResponseMessage("")
      setIsModalOpen(true);
    } finally {
      setLoadingResourceId(null);
    }
  };
  const incomingRevertModal = (xnodeId, user, index, uIdx) => {
    setCurrentData({ xnodeId, user, index, uIdx });
    setShowIncomingRevertPopup(true);
  }
  const handleIncomingRevertClick = async () => {
    console.log("Revert clicked for xnodeId:", currentData);
    // const revert_reason = prompt("Enter reason for reverting consent:");
    const revert_reason = revertReason;
    console.log("Revert reason:", revert_reason);
    // if (!revert_reason) alert("Reason is required to revert the consent.");

    if(responseModal){

    } else if (!revert_reason || revert_reason.trim() === "") {
      alert("Reason is required to revert the consent.");
      return; // Stop execution if no reason is provided
    }

    setLoadingResourceId(currentData.xnodeId);
    setMessage("");

    try {
      const token = Cookies.get("authToken");

      const response = await fetch(`${frontend_host}/revert-consent/`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          xnode_id: currentData?.xnodeId,
          revert_reason: revert_reason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setModalMessage({
          message: data.message || "Revert successful",
          type: 'success',
        });
        setShowIncomingRevertPopup(false);
        setRevertReason("");
        setCurrentData({});
        setResponseModal(false)
        setResponseMessage("")
        setIsModalOpen(true);

        console.log("activeTab", activeTab)

        // console.log("Calling fetchResources withss:", user, index, uIdx);
        fetchResources(currentData.user, currentData.index, currentData.uIdx)

      } else {
        setModalMessage({
          message: data.error || "Failed to revert consent",
          type: 'failure',
        });
        setShowIncomingRevertPopup(false);
        setRevertReason("");
        setCurrentData({});
        setResponseModal(false)
        setResponseMessage("")
        setIsModalOpen(true);
      }
    } catch (error) {
      // console.error("Error during revert request:", error);
      setModalMessage({
        message: error || "Error during revert request",
        type: 'failure',
      });
      setShowIncomingRevertPopup(false);
      setRevertReason("");
      setCurrentData({});
      setResponseModal(false)
      setResponseMessage("")
      setIsModalOpen(true);
    } finally {
      setLoadingResourceId(null);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
  }

  const getTrueKeys = (obj) => {
    return Object.entries(obj)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);
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
        // throw new Error(errorData.message || 'Failed to access the resource');
      }

      const data = await response.json();
      console.log(data);
      const { xnode } = data;
      if (xnode) {
        setResourceData(xnode)
        setResourceViewModal(true)
      } else {
        // setError('Unable to retrieve the file link.');
        // console.log(error);
      }
    } catch (err) {
      // setError(`Error: ${err.message}`);
      console.log(err);
    } finally {
      // setLoading(false);
    }
  };

  const postConditionsKeys = getTrueKeys(resourceData?.post_conditions || {});

  const handleViewClose = () => {
    setResourceViewModal(false);
    setResourceData(null);
  };

  const handleuserclick = (user) => {
    if (curruser && curruser.username && user.username === curruser.username) {
      navigate('/home');
    } else {
      navigate(`/target-user-view`, { state: { user } });
    }
  };

  const navigateDisplayTerms = (user, connection) => {
    console.log("Navigating to display terms for connection:", connection);
    console.log("Navigating to display terms for connection:", user);
    console.log("Navigating to display terms for connection:", connection.connection_type_name,
      user.host_locker.name,
      connection.connection_description,
      user.created_time,
      user.validity_time,
      user.host_user.username,
      user.host_locker,
      user.host_locker.name,
      connection
    );

    navigate("/display-terms", {
      state: {
        connectionTypeName: connection.connection_type_name, // Extracted from connection object
        hostLockerName: user?.host_locker?.name,
        // connectionTypeName: connection.connection_type_name,
        connectionDescription: connection.connection_description,
        createdtime: user.created_time,
        validitytime: user.validity_time,
        hostUserUsername: user.host_user.username,
        locker: user.host_locker,
        hostLocker: user.host_locker.name,
        // connectionType: connectionType,
        connection: connection,
        viewConsentDashboard: true,
      }
    })

  }

  const handleIncomingConsent = (user, connection) => {
    console.log("connections...", user, connection)
    navigate("/show-connection-terms", {
      state: {
        connectionTypeName: connection.connection_type_name, // Extracted from connection object
        hostLockerName: user?.host_locker?.name,
        connectionName: user?.connection_name,
        connectionTypeName: connection.connection_type_name,
        connectionDescription: connection.connection_description,
        createdtime: user.created_time,
        validitytime: user.validity_time,
        hostUserUsername: user.host_user.username,
        locker: user.host_locker,
        guestLockerName: user?.guest_locker.name,
        guestUserUsername: user.guest_user.username,
        hostLockerName: user.host_locker.name,
        connectionTypeID: connection?.connection_type_id,
        // connectionType: connectionType,
        showConsent: true,
        connection: connection,
        viewConsentDashboard: true,
        guest_locker_id: user?.guest_locker.locker_id,
        host_locker_id: user?.host_locker.locker_id,
        connection_id: user.connection_id,
        hostLocker: user?.host_locker,
        guestLocker: user?.guest_locker,
        lockerComplete: user?.host_locker,
        consentDashboard: true

      }
    })
  }

  const navigateConnectionTerms = (connection) => {
    console.log("Dispaly connections", connection)

    navigate("/display-terms", {
      state: {
        connectionTypeName: connection.connection_type_name, // Extracted from connection object
        hostLockerName: connection?.host_locker?.name,
        // connectionTypeName: connection.connection_type_name,
        connectionDescription: connection.connection_description,
        createdtime: connection.created_time,
        validitytime: connection.validity_time,
        hostUserUsername: connection.host_user.username,
        locker: connection.host_locker,
        hostLocker: connection.host_locker.name,
        // connectionType: connectionType,
        connection: connection,
        viewConsentDashboard: true,
      }
    })
  }

  const handleOutgoingConsent = (connection) => {
    console.log("connections...", connection)
    navigate("/show-connection-terms", {
      state: {
        connectionTypeName: connection.connection_type_name, // Extracted from connection object
        hostLockerName: connection?.host_locker?.name,
        connectionName: connection?.connection_name,
        connectionTypeName: connection.connection_type_name,
        connectionDescription: connection.connection_description,
        createdtime: connection.created_time,
        validitytime: connection.validity_time,
        hostUserUsername: connection.host_user.username,
        locker: connection.host_locker,
        guestLockerName: connection?.guest_locker.name,
        guestUserUsername: connection.guest_user.username,
        hostLockerName: connection.host_locker.name,
        connectionTypeID: connection?.connection_type,
        // connectionType: connectionType,
        showConsent: true,
        connection: connection,
        viewConsentDashboard: true,
        guest_locker_id: connection?.guest_locker.locker_id,
        host_locker_id: connection?.host_locker.locker_id,
        connection_id: connection.connection_id,
        hostLocker: connection?.host_locker,
        guestLocker: connection?.guest_locker,
        lockerComplete: connection?.host_locker,
        consentDashboard: true

      }
    })
  }

  const handleLockerChange = (lockerID) => {
    setTempSelectedLockers((prev) =>
      prev.includes(lockerID)
        ? prev.filter((name) => name !== lockerID)
        : [...prev, lockerID]
    );
  };

  const handleStatusChange = (status) => {
    setTempSelectedStatus((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  // const handleApplyFilter = () => {
  //   setSelectedLockers(tempSelectedLockers);
  //   setSelectedStatus(tempSelectedStatus);

  //   if (activeTab === "incoming") {
  //     console.log("out...incoming", incomingConnections)

  //     const filtered = incomingConnections.filter((conn) => {
  //       const lockerMatch =
  //         tempSelectedLockers.length === 0 || tempSelectedLockers.includes(conn.owner_locker);
  //       // const statusMatch =
  //         // tempSelectedStatus.length === 0 ||  tempSelectedStatus.includes(conn.status);
  //       return lockerMatch;
  //     });
  //     setFilteredConnections(filtered);
  //     setShowFilters(false);
  //     // setSearchQuery("");

  //   } else {
  //     console.log("out...outgoing", outgoingConnections)
  //     const filtered = outgoingConnections.filter((conn) => {
  //       const lockerMatch =
  //         tempSelectedLockers.length === 0 || tempSelectedLockers.includes(conn.guest_locker.locker_id);
  //       const statusMatch =
  //         tempSelectedStatus.length === 0 || tempSelectedStatus.includes(conn.connection_status);
  //       return lockerMatch && statusMatch;
  //     });
  //     setFilteredConnections(filtered);
  //     setShowFilters(false);
  //     // setSearchQuery("");

  //   }
  // };


  const handleApplyFilter = () => {
    setSelectedLockers(tempSelectedLockers);
    setSelectedStatus(tempSelectedStatus);

    if (activeTab === "incoming") {
      const filtered = allIncomingConnections.filter((conn) => {
        const lockerMatch =
          tempSelectedLockers.length === 0 || tempSelectedLockers.includes(conn.owner_locker);

        const searchMatch =
          !searchQuery.trim() ||
          conn.connection_type_name.toLowerCase().includes(searchQuery.toLowerCase());

        return lockerMatch && searchMatch;
      });

      setFilteredConnections(filtered);
      setShowFilters(false);

    } else {
      const filtered = allOutgoingConnections.filter((conn) => {
        const lockerMatch =
          tempSelectedLockers.length === 0 || tempSelectedLockers.includes(conn.guest_locker.locker_id);

        const statusMatch =
          tempSelectedStatus.length === 0 || tempSelectedStatus.includes(conn.connection_status);

        const searchMatch =
          !searchQuery.trim() ||
          conn.connection_name.toLowerCase().includes(searchQuery.toLowerCase());

        return lockerMatch && statusMatch && searchMatch;
      });

      setFilteredConnections(filtered);
      setShowFilters(false);
    }
  };

  console.log("selected", selectedLockers, selectedStatus)
  const handleClearFilter = () => {
    setTempSelectedLockers([]);
    setTempSelectedStatus([]);
    setSelectedLockers([]);
    setSelectedStatus([]);
    setShowFilters(false);
    setSearchQuery("");

    const baseList =
      activeTab === "incoming" ? allIncomingConnections : allOutgoingConnections;

    // Reapply current search query
    const filtered = baseList.filter((conn) => {
      const connectionName =
        activeTab === "incoming"
          ? conn.connection_type_name
          : conn.connection_name;

      return connectionName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    setFilteredConnections(filtered);
  };


  // const handleClearFilter = () => {
  //   setTempSelectedLockers([]);
  //   setTempSelectedStatus([]);
  //   setSelectedLockers([]);
  //   setSelectedStatus([]);
  //   setShowFilters(false);

  //   if (activeTab === "incoming") {
  //     setFilteredConnections(incomingConnections);
  //   } else {
  //     setFilteredConnections(outgoingConnections);
  //   }
  // };
  // const handleSearchClick = () => {
  //   if (!searchQuery.trim()) {
  //     // If input is empty, reset to show all connections.
  //     setFilteredConnections(filteredConnections);
  //     return;
  //   }

  //   const filtered = filteredConnections.filter((conn) => {
  //     const connectionName = activeTab === "incoming" ? conn.connection_type_name : conn.connection_name;
  //     return connectionName.toLowerCase().includes(searchQuery.toLowerCase());
  //   });
  //   setFilteredConnections(filtered);
  // };

  const handleSearchClick = () => {
    const baseList =
      activeTab === "incoming" ? allIncomingConnections : allOutgoingConnections;

    const filtered = baseList.filter((conn) => {
      // --- Search match ---
      const connectionName =
        activeTab === "incoming" ? conn.connection_type_name : conn.connection_name;
      const searchMatch = !searchQuery.trim() || connectionName.toLowerCase().includes(searchQuery.toLowerCase());

      // --- Locker match ---
      const lockerMatch =
        tempSelectedLockers.length === 0 ||
        (activeTab === "incoming"
          ? tempSelectedLockers.includes(conn.owner_locker)
          : tempSelectedLockers.includes(conn.guest_locker.locker_id));

      // --- Status match (only for outgoing) ---
      const statusMatch =
        activeTab === "incoming" ||
        tempSelectedStatus.length === 0 ||
        tempSelectedStatus.includes(conn.connection_status);

      return searchMatch && lockerMatch && statusMatch;
    });

    setFilteredConnections(filtered);
  };



  const handleOutgoingApproveRevert = (xnodeId, conn, index) => {
    setCurrentData({ xnodeId, conn, index });
    setResponseMessage("Are you sure you want to approve the revert")
    setResponseModal(true);
  }

  const handleIncomingApproveRevert = (xnodeId, user, index, uIdx) => {
    setCurrentData({ xnodeId, user, index, uIdx });
    setResponseMessage("Are you sure you want to approve the revert")
    setResponseModal(true);
  }

  console.log("filteredConnections", filteredConnections)

  const handleIncomingRejectRevert = async () => {
    console.log("Reject incoming clicked for xnodeId:", currentData);
    const reject_reason = revertRejectReason;
    console.log("Revert reason:", reject_reason);
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
          xnode_id: currentData?.xnodeId,
          revert_reject_reason: reject_reason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setModalMessage({
          message: data.message || "Revert successful",
          type: 'success',
        });
        
        
        setShowRejectModal(false);
        setRevertRejectReason("");
        setCurrentData({});
        setIsModalOpen(true);

        console.log("activeTab", activeTab)

        // console.log("Calling fetchResources withss:", user, index, uIdx);
        fetchResources(currentData.user, currentData.index, currentData.uIdx)

      } else {
        setModalMessage({
          message: data.error || "Failed to revert consent",
          type: 'failure',
        });
        setShowRejectModal(false);
        setRevertRejectReason("");
        setCurrentData({});
        setIsModalOpen(true);
      }
    } catch (error) {
      // console.error("Error during revert request:", error);
      setModalMessage({
        message: error || "Error during revert request",
        type: 'failure',
      });
      setShowRejectModal(false);
      setRevertRejectReason("");
      setCurrentData({});
      setIsModalOpen(true);
    } finally {
      setLoadingResourceId(null);
    }

  }

  const handleOutgoingRejectRevert = async () => {
    console.log("Reject outgoing clicked for xnodeId:", currentData);
    const reject_reason = revertRejectReason;
    // console.log("Revert reason:", reject_reason);
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
          xnode_id: currentData.xnodeId,
          revert_reject_reason: reject_reason.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setModalMessage({
          message: data.message || "Revert successful",
          type: 'success',
        });
        setShowRejectModal(false);
        setRevertRejectReason("");
        setCurrentData({});
        setIsModalOpen(true);

        fetchOutgoingResources(currentData.conn, currentData.index)


      } else {
        setModalMessage({
          message: data.error || "Failed to revert consent",
          type: 'failure',
        });
        setShowRejectModal(false);
        setRevertRejectReason("");
        setCurrentData({});
        setIsModalOpen(true);
      }
    } catch (error) {
      // console.error("Error during revert request:", error);
      setModalMessage({
        message: error || "Error during revert request",
        type: 'failure',
      });
      setShowRejectModal(false);
      setRevertRejectReason("");
      setCurrentData({});
      setIsModalOpen(true);
    } finally {
      setLoadingResourceId(null);
    }
  

  };
  

  const handleIncomingRejectRevertModal = (xnodeId, user, index, uIdx) => {
    setCurrentData({ xnodeId, user, index, uIdx });
    setShowRejectModal(true);
  };

  const handleOutgoingRejectRevertModal = (xnodeId, conn, index) => {
    setCurrentData({ xnodeId, conn, index });
    setShowRejectModal(true);
    console.log("Outgoing Revert Modal Data:", { xnodeId, conn, index });
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
        return;
      }
      setLockers(data.lockers || []);
    } catch (error) {
      setError("An error occurred while fetching lockers.");
    }
  };

  return (
    <div style={{ height: "100vh", overflowY: "auto" }}>
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
      {/* <div className="locker-header">
        <div className="locker-text">
          <div className="navbar-content">{content}</div>
        </div>
        <div className="navbar-breadcrumbs">{breadcrumbs}</div>
      </div> */}
      <Box style={{ display: "flex", justifyContent: "center" }}>
        <div className="consent-dashboard-container">
          {/* Title */}
          <span className="consent-dashboard-title">
            My Consent Dashboard
          </span>

          {/* Button */}
          <button className="back-button" onClick={() => navigate("/home")}>
            ← Back to Lockers
          </button>
        </div>
      </Box>
      <div className="dashboard-wrapper m-4">
        <div className="consent-dashboard">
          {/* <h3 className="consent-title">Incoming Connection <i className="bi bi-arrow-down-short" style={{fontSize:"30px"}}></i></h3> */}
          <h3 className="consent-title">
            Incoming Connection
            <span
              className="align-arrow"
            >
              <i
                className="bi bi-arrow-down-short"
              ></i>
            </span>
          </h3>

          <div className="stat-grid">
            <StatBox label="Total Connection Type" value={statsData?.incoming?.total_connections_type} fullWidth />
            <StatBox label="Total" value={<><span className="main-value">{statsData?.incoming?.total_Users}</span><sub className="sub-label"> users</sub></>} />
            <StatBox label="Established" value={<><span className="main-value">{statsData?.incoming?.established}</span><sub className="sub-label"> users</sub></>} />
            <StatBox label="Live" value={<><span className="main-value">{statsData?.incoming?.live}</span><sub className="sub-label"> users</sub></>} />
            <StatBox label="Closed" value={<><span className="main-value">{statsData?.incoming?.closed}</span><sub className="sub-label"> users</sub></>} />
          </div>

        </div>

        <div className="consent-dashboard">
          <h3 className="consent-title">Outgoing Connection  <span
            className="align-arrow"
          >
            <i
              className="bi bi-arrow-up-short"
            ></i>
          </span></h3>
          <div className="stat-grids">
            <StatBox label="Total Connection" value={statsData?.outgoing?.total_Connections} fullWidth />
            <StatBox label="Established" value={<><span className="main-value">{statsData?.outgoing?.established}</span><sub className="sub-label"> connections</sub></>} />
            <StatBox label="Live" value={<><span className="main-value">{statsData?.outgoing?.live}</span><sub className="sub-label"> connections</sub></>} />
            <StatBox label="Closed" value={<><span className="main-value">{statsData?.outgoing?.closed}</span><sub className="sub-label"> connections</sub></>} />
          </div>
        </div>
      </div>
      <div
        className="container bg-white rounded p-3 mt-4"
      >

        <div className="row g-3 align-items-center">

          {/* Search Input */}
          <div className="col-lg-4 col-md-6 col-12">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search Connections by Name"
                aria-label="Search Connection"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchClick()}
              />
              <span className="input-group-text" onClick={handleSearchClick}>
                <i className="bi bi-search" style={{ cursor: "pointer" }}></i>
              </span>
            </div>
          </div>

          {/* Date Picker */}
          {/* <div className="col-lg-2 col-md-6 col-12">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="dd-mm-yyyy"
                aria-label="Select Date"
                onFocus={(e) => (e.target.type = "date")}
                onBlur={(e) => (e.target.type = "text")}
              />
              <span className="input-group-text">
                <i className="bi bi-calendar3"></i>
              </span>
            </div>
          </div> */}

          {/* Sort Dropdown */}
          <div className="col-lg-3 col-md-6 col-12">

            <div className="input-group position-relative" onClick={(e) => { e.stopPropagation(); setShowFilters(!showFilters) }} style={{ cursor: "pointer" }}>
              <div className="form-control disabled-filter">Filter</div>
              
              <div style={{ position: "relative" }}>
                <span className="input-group-text">
                  <i className="bi bi-sliders"></i>
                </span>

                {(selectedLockers.length > 0 || selectedStatus.length > 0) && (
                  <span className="filter-indicator-dot"></span>
                )}
              </div>
              {showFilters && (
                <div className="filter-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="filter-content-scrollable">
                    <div className="section-header" onClick={() => setShowLockers(!showLockers)}>
                      <h6>Lockers</h6>
                      <span>{showLockers ? "▲" : "▼"}</span>
                    </div>

                    {showLockers && (
                      <div className="section-content">
                        <div>
                          {lockers.map((locker, index) => (
                            <div key={index}>
                              <input
                                type="checkbox"
                                id={`locker-${index}`}
                                onChange={() => handleLockerChange(locker.locker_id)}
                                checked={tempSelectedLockers.includes(locker.locker_id)}
                              />
                              <label htmlFor={`locker-${index}`}> {locker.name}</label>
                            </div>
                          ))}

                        </div>
                      </div>
                    )}
                    {activeTab === "outgoing" && (
                      <div className="section-header" onClick={() => setShowStatus(!showStatus)}>
                        <h6>Connection Status</h6>
                        <span>{showStatus ? "▲" : "▼"}</span>
                      </div>
                    )}
                    {showStatus && activeTab === "outgoing" && (
                      <div className="section-content">
                        <div>
                          <div>
                            <input
                              type="checkbox"
                              id="established"
                              onChange={() => handleStatusChange("established")}
                              checked={tempSelectedStatus.includes("established")}
                            />
                            <label htmlFor="established"> Established</label>
                          </div>
                          <div>
                            <input
                              type="checkbox"
                              id="live"
                              onChange={() => handleStatusChange("live")}
                              checked={tempSelectedStatus.includes("live")}
                            />
                            <label htmlFor="live"> Live</label>
                          </div>
                          <div>
                            <input
                              type="checkbox"
                              id="closed"
                              onChange={() => handleStatusChange("closed")}
                              checked={tempSelectedStatus.includes("closed")}
                            />
                            <label htmlFor="closed"> Closed</label>
                          </div>

                        </div>
                      </div>
                    )}
                  </div>

                  <div className="filter-actions">
                    <button className="clear-btn" onClick={handleClearFilter}>
                      Clear Filter
                    </button>

                    <button className="apply-btn" onClick={handleApplyFilter}>
                      Apply Filter
                    </button>

                  </div>
                </div>

              )}
            </div>


          </div>




          <div className="col-lg-5 col-md-6 col-12">
            {/* Wrap the buttons in a div with the 'btn-group' class */}
            <div className="btn-group gap-4 w-100" role="group" aria-label="Connection Type">
              <button
                type="button"
                className={`btn ${activeTab === 'incoming' ? 'btn-primary' : ''}`}
                onClick={() => setActiveTab('incoming')}
                style={{ borderRadius: "4px", border: "2px solid #007bff" }}
              >
                INCOMING CONNECTIONS
              </button>
              <button
                type="button"
                className={`btn ${activeTab === 'outgoing' ? 'btn-primary' : ''}`}
                onClick={() => setActiveTab('outgoing')}
                style={{ borderRadius: "4px", border: "2px solid #007bff" }}
              >
                OUTGOING CONNECTIONS
              </button>
            </div>
          </div>
        </div>
      </div>
      <div>
        {activeTab === "incoming" && (
          <div className="container mt-4">
            {filteredConnections.length > 0 ? (
              <div className="row">
                {filteredConnections.map((conn, index) => (
                  <div key={index} className="col-12">
                    <div
                      className="card border-0 shadow rounded-4 px-3 py-2"
                      style={{
                        backgroundColor: "#f8f9fa",  // Light gray (optional)
                        transition: "all 0.2s ease-in-out",
                      }}
                    >
                      <div className="card-body d-flex justify-content-between align-items-center px-2">
                        <h6 className="card-title mb-0 fw-semibold">{conn.connection_type_name}</h6>

                        <button
                          className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                          onClick={() => handleToggle(index, conn)}
                          style={{
                            width: "32px",
                            height: "32px",
                            padding: 0,
                          }}
                          aria-label="Toggle users"
                        >
                          {openCards[index] ? "▲" : "▼"}
                        </button>
                      </div>
                      {openCards[index] && (
                        <div className="card-body pt-0">
                          {connectionUsers[index] ? (
                            connectionUsers[index].length > 0 ? (
                              <ul className="list-group list-group-flush">
                                {connectionUsers[index].map((user, uIdx) => (
                                  <li key={uIdx} className="list-group-item">
                                    <div className="d-flex justify-content-between align-items-center">
                                      <span>{openUserDetails[`${index}-${uIdx}`] ? <strong>{user.connection_name}</strong> : <strong>{user.guest_user.username}</strong>}</span>
                                      <button
                                        className="btn btn-md btn-outline-primary rounded-circle p-0"
                                        style={{ width: "28px", height: "28px", fontSize: "18px" }}
                                        onClick={() => handleUserToggle(index, uIdx)}
                                        aria-label="Toggle user details"
                                      >
                                        {openUserDetails[`${index}-${uIdx}`] ? <i className="bi bi-chevron-up"></i> : <i className="bi bi-chevron-down"></i>}
                                      </button>
                                    </div>
                                    {/* {openUserDetails[`${index}-${uIdx}`] ? <hr></hr>  : ""} */}


                                    {openUserDetails[`${index}-${uIdx}`] && (
                                      <div className="card-body">
                                        <div className="row">
                                          <div className="col-md-5">
                                            <p className="mb-3"><strong>Connection Type:</strong> {conn.connection_type_name}</p>
                                            <div className="d-flex flex-column flex-md-row gap-4 mb-3">
                                              <div className="user-container">
                                                <i className="hostuser-icon" /> &nbsp;
                                                <span className="userName">: {capitalizeFirstLetter(user.host_user.username)}</span>
                                              </div>
                                              <div className="user-container">
                                                <i className="guestuser-icon" /> &nbsp;
                                                <span className="userName">: {capitalizeFirstLetter(user.guest_user.username)}</span>
                                              </div>
                                            </div>

                                            <div className="d-flex flex-column flex-md-row gap-4 mb-3">
                                              <div className="user-container">
                                                <i className="hostLocker-icon" /> &nbsp;
                                                <span className="userName">: {user.host_locker.name}</span>
                                              </div>
                                              <div className="user-container">
                                                <i className="guestLocker-icon" /> &nbsp;
                                                <span className="userName">: {user.guest_locker.name}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="col-md-5">
                                            <p className="mb-3"><strong>Status:</strong> {capitalizeFirstLetter(user.connection_status) || ""}</p>
                                            <p className="mb-3"><strong>Created On:</strong> {new Date(user.created_time).toLocaleString()}</p>
                                            <p className="mb-3"><strong>Valid Till:</strong> {new Date(user.validity_time).toLocaleString()}</p>
                                          </div>

                                          <div className="col-md-2">
                                            <span className="me-2 mb-3">Actions:</span>
                                            <button className="btn btn-sm btn-light rounded-circle me-2" onClick={() => navigateDisplayTerms(user, conn)}>I</button>
                                            {user.connection_status !== "closed" && user.connection_status !== "revoked" && (
                                              <button className="btn btn-sm btn-light rounded-circle" onClick={() => handleIncomingConsent(user, conn)}>C</button>
                                            )}
                                          </div>
                                        </div>
                                        <div className="row mt-3">
                                          <div className="col-sm-12 col-md-6 mb-3">
                                            <button
                                              type="button"
                                              className="btn btn-primary"
                                              style={{ borderRadius: "4px", border: "2px solid #007bff" }}
                                              onClick={() => fetchResources(user, index, uIdx)}
                                            >
                                              {loadingResources[`${index}-${uIdx}`] ? "Loading..." : "List of Resources"}
                                            </button>
                                          </div>



                                          <div className="col-sm-12 col-md-6">
                                            {resourceLists[`${index}-${uIdx}`] ? (
                                              <div className="">
                                                <ul className="list-group">
                                                  {resourceLists[`${index}-${uIdx}`].length > 0 ? (
                                                    resourceLists[`${index}-${uIdx}`].map((resource, rIdx) => (
                                                      <li key={rIdx} className="list-group-item"


                                                      // id={
                                                      //   resource.xnode_Type === "INODE"
                                                      //     ? "documents"
                                                      //     : resource.xnode_Type === "SNODE"
                                                      //       ? "documents-byConfer"
                                                      //       : "documents-byShare"
                                                      // }

                                                      // onMouseEnter={() => setHovered(xnode.id)}
                                                      // onMouseLeave={() => setHovered(null)}
                                                      >
                                                        <div>
                                                          <span
                                                            // onClick={() => handleClick(xnode.id)}
                                                            style={{ cursor: "pointer", flexGrow: 1, fontSize: "16px", marginLeft: "-2px" }}
                                                            id={
                                                              resource.xnode_Type === "INODE"
                                                                ? "documents"
                                                                : resource.xnode_Type === "SNODE"
                                                                  ? "documents-byConfer"
                                                                  : "documents-byShare"
                                                            }
                                                          >
                                                            {resource.resource_name}
                                                          </span>
                                                          <span className="float-end mt-1">
                                                            <i className="bi bi-info-square "
                                                              data-tooltip-id="tooltip"
                                                              data-tooltip-content="View Details"
                                                              style={{ cursor: "pointer", fontSize: "20px", color: "#007bff" }}
                                                              onClick={() => handleViewDetails(resource.id)}
                                                            />{" "} &nbsp;


                                                            {/* <button type="button" className="btn btn-outline-primary" onClick={() => incomingRevertModal(resource.id, user, index, uIdx)} style={{ borderRadius: "4px", border: "2px solid #007bff", fontSize: "80%", padding: "3px 10px" }} disabled={loadingResourceId === resource.id}>
                                                              {loadingResourceId === resource.id ? "Reverting..." : "Revert"}

                                                            </button> */}
                                                            {resource.guest_revert_status === 0 && resource.host_revert_status === 1 ? (
                                                              <button className="btn btn-outline-secondary" disabled style={{ borderRadius: "4px", fontSize: "80%", padding: "3px 10px" }}>Pending</button>
                                                            ) : resource.guest_revert_status === 1 && resource.host_revert_status === 0 ? (
                                                              <>
                                                                <button className="btn btn-success me-2" style={{ borderRadius: "4px", fontSize: "80%", padding: "3px 10px" }} onClick={() => handleIncomingApproveRevert(resource.id, user, index, uIdx)}>Approve</button>
                                                                <button className="btn btn-danger" style={{ borderRadius: "4px", fontSize: "80%", padding: "3px 10px" }} onClick={() => handleIncomingRejectRevertModal(resource.id, user, index, uIdx)}>Reject</button>
                                                              </>
                                                            ) : (
                                                              <button
                                                                type="button"
                                                                className="btn btn-outline-primary"
                                                                onClick={() => incomingRevertModal(resource.id, user, index, uIdx)}
                                                                style={{ borderRadius: "4px", border: "2px solid #007bff", fontSize: "80%", padding: "3px 10px" }}
                                                                disabled={loadingResourceId === resource.id}
                                                              >
                                                                {loadingResourceId === resource.id ? "Reverting..." : "Revert"}
                                                              </button>
                                                            )}


                                                          </span>




                                                          {/* {error && <div className="error-message">{error}</div>} */}
                                                        </div>

                                                      </li>
                                                    ))
                                                  ) : (
                                                    <li className="list-group-item text-muted">No resources found.</li>
                                                  )}
                                                </ul>
                                              </div>
                                            ) : (
                                              <div className="mt-3 text-muted"></div>
                                            )}
                                          </div>
                                        </div>




                                      </div>
                                    )}
                                  </li>

                                ))}
                              </ul>
                            ) : (
                              <p className="text-muted mb-0">No users found for this connection.</p>
                            )
                          ) : (

                            <div className="loading-dots text-center my-2">
                              <span className="dot"></span>
                              <span className="dot"></span>
                              <span className="dot"></span>
                            </div>

                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center mt-5">
                <FaUnlink size={64} color="#adb5bd" />

                <h6 className="mt-3 text-secondary">No incoming connections available.</h6>
                <p className="text-muted small">Try creating a connection type or check outgoing connections.</p>
              </div>

            )}

          </div>
        )}

        {activeTab === "outgoing" && (
          <div className="container mt-4">
            {filteredConnections.length > 0 ? (
              <div className="row">
                {filteredConnections.map((conn, index) => (
                  <div key={conn.connection_id} className="col-12">
                    <div className="card border-0 shadow rounded-4 px-3 py-2" style={{ backgroundColor: "#f8f9fa" }}>
                      <div className="card-body d-flex justify-content-between align-items-center px-2">
                        <h6 className="card-title mb-0 fw-semibold">{conn.connection_name}</h6>

                        <button
                          className="btn btn-sm btn-outline-primary rounded-circle d-flex align-items-center justify-content-center"
                          onClick={() => handleToggleOutgoing(index)}
                          style={{ width: "32px", height: "32px", padding: 0 }}
                          aria-label="Toggle users"
                        >
                          {openOutgoingCards[index] ? "▲" : "▼"}
                        </button>
                      </div>

                      {openOutgoingCards[index] && (
                        <div className="card-body bg-white p-4 rounded-3" style={{ marginBottom: "15px" }}>
                          <div className="row">
                            <div className="col-md-5">
                              <p className="mb-3"><strong>Connection Type:</strong> {conn.connection_type_name}</p>

                              <div className="d-flex flex-column flex-md-row gap-4 mb-3">
                                <div className="user-container">
                                  <i className="hostuser-icon" /> &nbsp;
                                  <span className="userName">: {capitalizeFirstLetter(conn.host_user.username)}</span>
                                </div>
                                <div className="user-container">
                                  <i className="guestuser-icon" /> &nbsp;
                                  <span className="userName">: {capitalizeFirstLetter(conn.guest_user.username)}</span>
                                </div>
                              </div>

                              <div className="d-flex flex-column flex-md-row gap-4 mb-3">
                                <div className="user-container">
                                  <i className="hostLocker-icon" /> &nbsp;
                                  <span className="userName">: {conn.host_locker.name}</span>
                                </div>
                                <div className="user-container">
                                  <i className="guestLocker-icon" /> &nbsp;
                                  <span className="userName">: {conn.guest_locker.name}</span>
                                </div>
                              </div>
                            </div>

                            <div className="col-md-5">
                              <p className="mb-3"><strong>Status:</strong> {capitalizeFirstLetter(conn.connection_status) || ""}</p>
                              <p className="mb-3"><strong>Created On:</strong> {new Date(conn.created_time).toLocaleString()}</p>
                              <p className="mb-3"><strong>Valid Till:</strong> {new Date(conn.validity_time).toLocaleString()}</p>
                            </div>

                            <div className="col-md-2">
                              <span className="me-2 mb-3">Actions:</span>
                              <button className="btn btn-sm btn-light rounded-circle me-2" onClick={() => navigateConnectionTerms(conn)} >I</button>
                              {conn.connection_status !== "closed" && conn.connection_status !== "revoked" && (
                                <button className="btn btn-sm btn-light rounded-circle" onClick={() => handleOutgoingConsent(conn)}>C</button>
                              )}
                            </div>
                          </div>
                          <div className="row mt-3">
                            <div className="col-sm-12 col-md-6 mb-3">
                              <button
                                type="button"
                                className="btn btn-primary"
                                style={{ borderRadius: "4px", border: "2px solid #007bff" }}
                                onClick={() => fetchOutgoingResources(conn, index)}
                              >
                                {loadingOutgoingResource[`${index}`] ? "Loading..." : "List of Resources"}
                              </button>
                            </div>

                            <div className="col-sm-12 col-md-6">
                              {outgoingResourceLists[`${index}`] && (
                                <div>
                                  <ul className="list-group">
                                    {outgoingResourceLists[`${index}`].length > 0 ? (
                                      outgoingResourceLists[`${index}`].map((resource, rIdx) => (
                                        <li
                                          key={rIdx}
                                          className="list-group-item"
                                          style={{ marginLeft: "-2px", marginBottom: "0" }}
                                          id={
                                            resource.xnode_Type === "INODE"
                                              ? "documents"
                                              : resource.xnode_Type === "SNODE"
                                                ? "documents-byConfer"
                                                : "documents-byShare"
                                          }
                                        >
                                          <div>
                                            <span style={{ cursor: "pointer", flexGrow: 1, fontSize: "16px" }}>
                                              {resource.resource_name}
                                            </span>
                                            {/* <button
                                              type="button"
                                              className="btn btn-outline-primary float-end"
                                              style={{
                                                borderRadius: "4px",
                                                border: "2px solid #007bff",
                                                fontSize: "70%",
                                                padding: "3px 10px",
                                              }}
                                            >
                                              Revert
                                            </button> */}
                                            <>
                                              <span className="float-end mt-1">
                                                <i className="bi bi-info-square "
                                                  data-tooltip-id="tooltip"
                                                  data-tooltip-content="View Details"
                                                  style={{ cursor: "pointer", fontSize: "20px", color: "#007bff" }}
                                                  onClick={() => handleViewDetails(resource.id)}
                                                />{" "} &nbsp;

                                                {resource.guest_revert_status === 1 && resource.host_revert_status === 0 ? (
                                                  <button className="btn btn-outline-secondary" disabled style={{ borderRadius: "4px", fontSize: "80%", padding: "3px 10px" }}>Pending</button>
                                                ) : resource.guest_revert_status === 0 && resource.host_revert_status === 1 ? (
                                                  <>
                                                    <button className="btn btn-success me-2" style={{ borderRadius: "4px", fontSize: "80%", padding: "3px 10px" }} onClick={() => handleOutgoingApproveRevert(resource.id, conn, index)}>Approve</button>
                                                    <button className="btn btn-danger" style={{ borderRadius: "4px", fontSize: "80%", padding: "3px 12px" }} onClick={() => handleOutgoingRejectRevertModal(resource.id, conn, index)}>Reject</button>
                                                  </>
                                                ) : (
                                                  <button
                                                    type="button"
                                                    className="btn btn-outline-primary float-end"
                                                    style={{
                                                      borderRadius: "4px",
                                                      border: "2px solid #007bff",
                                                      fontSize: "70%",
                                                      padding: "3px 10px",
                                                    }}
                                                    onClick={() => outgoingRevertModal(resource.id, conn, index)}
                                                    disabled={loadingResourceId === resource.id}
                                                  >

                                                    {loadingResourceId === resource.id ? "Reverting..." : "Revert"}
                                                  </button>
                                                )}
                                                {/* <button
                                                  type="button"
                                                  className="btn btn-outline-primary float-end"
                                                  style={{
                                                    borderRadius: "4px",
                                                    border: "2px solid #007bff",
                                                    fontSize: "70%",
                                                    padding: "3px 10px",
                                                  }}
                                                  onClick={() => outgoingRevertModal(resource.id, conn, index)}
                                                  disabled={loadingResourceId === resource.id}
                                                >

                                                  {loadingResourceId === resource.id ? "Reverting..." : "Revert"}
                                                </button> */}
                                              </span>
                                            </>
                                          </div>
                                        </li>
                                      ))
                                    ) : (
                                      <li className="list-group-item text-muted">
                                        No resources found.
                                      </li>
                                    )}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center mt-5">
                <FaUnlink size={64} color="#adb5bd" />
                <h6 className="mt-3 text-secondary">No outgoing connections available.</h6>
                <p className="text-muted small">Try creating a connection or check incoming connections.</p>
              </div>
            )}
          </div>
        )}
      </div>
      {isModalOpen && (
        <Modal
          message={modalMessage.message}
          onClose={handleCloseModal}
          type={modalMessage.type}
        // revoke={revokeState}
        // onRevoke={() => onRevokeButtonClick(conndetails.connection_id)}
        // viewTerms={() => navigateToConnectionTerms(conndetails)}
        />
      )}

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
                <span style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }} onClick={() => handleuserclick(resourceData.current_owner_details)}>{capitalizeFirstLetter(resourceData.current_owner_username)}</span>
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

      {showIncomingRevertPopup && (
        <div className="edit-modal ">
          <div className="modal-content">
            <h4>Enter reason for reverting consent</h4>
            <div style={{ marginBottom: "1rem" }}>
              <TextField
                fullWidth
                multiline
                type="text"
                rows={3}
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}
                placeholder="Enter reason here..."

                style={{ width: "100%", marginTop: "0.5rem", borderRadius: "5px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
              <button className="btn btn-primary p-2" onClick={() => handleIncomingRevertClick(currentData)}>Submit</button>
              <button className="btn btn-primary p-2" onClick={() => {
                setShowIncomingRevertPopup(false);
                setRevertReason("");
                setCurrentData({});
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {responseModal && (
        <div id="revert-response" className="modal-backdrop">
          <div className="modal-content">
            <p className="modal-message">{responseMessage}</p>
            <div className="modal-actions">
              <button
                className="btn btn-primary"
                onClick={() => {
                  activeTab === "incoming"
                    ? handleIncomingRevertClick()
                    : handleOutgoingRevertClick();
                }}
              >
                Yes
              </button>

              <button className="btn btn-primary" onClick={() => {
                setCurrentData({});
                setResponseMessage("");
                setResponseModal(false);
                }}>
                No
                </button>
            </div>
          </div>
        </div>
      )}

      {showOutgoingRevertPopup && (
        <div className="edit-modal ">
          <div className="modal-content">
            <h4>Enter reason for reverting consent</h4>
            <div style={{ marginBottom: "1rem" }}>
              <TextField
                fullWidth
                multiline
                type="text"
                rows={3}
                value={revertReason}
                onChange={(e) => setRevertReason(e.target.value)}

                placeholder="Enter reason here..."

                style={{ width: "100%", marginTop: "0.5rem", borderRadius: "5px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
              <button className="btn btn-primary p-2" onClick={() => handleOutgoingRevertClick(currentData)}>Submit</button>
              <button className="btn btn-primary p-2" onClick={() => {
                setShowOutgoingRevertPopup(false);
                setRevertReason("");
                setCurrentData({});
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="edit-modal ">
          <div className="modal-content">
            <h4>Enter the reason for rejecting the revert request</h4>
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
              <button className="btn btn-primary p-2" onClick={() => {
                  activeTab === "incoming"
                    ? handleIncomingRejectRevert()
                    : handleOutgoingRejectRevert();
                }}>Submit</button>
              <button className="btn btn-primary p-2" onClick={() => {
                setShowRejectModal(false);
                setRevertRejectReason("");
                setCurrentData({});
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

const StatBox = ({ label, value, fullWidth }) => {
  const colorClassMap = {
    "Live": "stat-success",
    "Established": "stat-warning",
    "Closed": "stat-secondary",
    "Total": "stat-info",
    "Total Connection": "stat-primary",
    "Total Connection Type": "stat-primary"
  };

  const colorClass = colorClassMap[label] || "stat-default";

  return (
    <div className={`stat-box ${fullWidth ? "full-width" : ""} ${colorClass}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
};
