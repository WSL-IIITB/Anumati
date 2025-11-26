//permission table

import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import "./ViewHostTermsByType.css";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
import Modal from "../Modal/Modal.jsx";
import { FaArrowCircleRight, FaUserCircle, FaRegUserCircle } from 'react-icons/fa';
import ReactModal from "react-modal";
import { Viewer, Worker } from "@react-pdf-viewer/core"; // PDF Viewer
import { Tooltip } from 'react-tooltip';
import { Grid } from "@mui/material"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from "../Sidebar/Sidebar.js";

export const ViewHostTermsByType = () => {
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
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [showResources, setShowResources] = useState(false);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [error, setError] = useState(null);
  const [res, setRes] = useState(null);
  const [resources, setResources] = useState([]);
  const [termValues, setTermValues] = useState({});
  const [selectedResources, setSelectedResources] = useState({});
  const [currentLabelName, setCurrentLabelName] = useState(null);
  const [VnodeResources, setVnodeResources] = useState([]);
  const [permissions, setPermissions] = useState({}); // New state for permissions
  const [statuses, setStatuses] = useState({}); // To store the statuses
  // const [resourcesData, setResourcesData] = useState({
  //     share: [],
  //     transfer: [],
  // });
  const [permissionsData, setPermissionsData] = useState([]);
  const [globalTemplates, setGlobalTemplates] = useState([]);
  const [terms, setTerms] = useState([]);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [postConditions, setPostConditions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [resourceModal, setResourceModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [postModal, setPostModal] = useState(false);
  const [moreDataTerms, setMoreDataTerms] = useState([]);
  const [xnodes, setXnodes] = useState([]);
  const [filteredXnodes, setFilteredXnodes] = useState([])
  // const [correspondingNames, setCorrespondingNames] = useState([]);
  const [showPageInput, setShowPageInput] = useState(false);
  const [fromPage, setFromPage] = useState('');
  const [toPage, setToPage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [selection, setSelection] = useState({});
  const [isCompletePages, setIsCompletePages] = useState(false); // Track "Complete Pages" selection
  const [totalPages, setTotalPages] = useState(0);

  const [selectedResourceId2, setSelectedResourceId2] = useState(null);
  const [selection2, setSelection2] = useState({});
  const [selectedResources2, setSelectedResources2] = useState({});
  const [showPageInput2, setShowPageInput2] = useState(false);
  const [showResources2, setShowResources2] = useState(false);
  const [statuses2, setStatuses2] = useState({});

  // const [currentLabelName2, setCurrentLabelName2] = useState(null);

  const [hostObligationMessage, setHostObligationMessage] = useState('');
  const [activeTab, setActiveTab] = useState("host");
  const [guestToHostTerms, setGuestToHostTerms] = useState([]);
  const [hostToGuestTerms, setHostToGuestTerms] = useState([]);
  const [guestToHostObligations, setGuestToHostObligations] = useState([]);
  const [hostToGuestObligations, setHostToGuestObligations] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showRevokeConsentModal, setShowRevokeConsentModal] = useState(false);
  const [showOpenPopup, setShowOpenPopup] = useState(false);
  const [pdfData, setPdfData] = useState(null)
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [selectedRowData1, setSelectedRowData1] = useState(null);
  const [selectedRowData2, setSelectedRowData2] = useState(null);
  const [typeofShare, setTypeofShare] = useState(null)
  const [trackerData, setTrackerData] = useState({});
  const [trackerDataReverse, setTrackerDataReverse] = useState({});
  const [initialPostConditions, setInitialPostConditions] = useState({});
  const [editablePostConditions, setEditablePostConditions] = useState({});
  const [isLockedPostConditions, setIsLockedPostConditions] = useState();
  const [extractedId, setExtractedId] = useState(null);
  const [editableValidityUntil, setEditableValidityUntil] = useState(
    pdfData?.validity_until?.split('T')?.[0] || ""
  );
  const [remarks, setRemarks] = useState("");
  const [isReactModalOpen, setIsReactModalOpen] = useState(false);
  const [isModalOpens, setIsModalOpens] = useState(false);
  const [revokeState, setRevokeState] = useState(true);
  const [isModalOpenClose, setIsModalOpenClose] = useState(false);
  const [closeState, setCloseState] = useState(true);
  const [notifications, setNotifications] = useState([]);
  

  const {
    connectionName,
    connectionDescription,
    hostLockerName,
    guestLockerName,
    hostUserUsername,
    guestUserUsername,
    locker,
    connection_id,
    guest_locker_id,
    host_locker_id,
    connection,
    connectionType,
    guestLocker,
    hostLocker
  } = location.state || {};

  console.log("data",
    connectionName,
    connectionDescription,
    hostLockerName,
    guestLockerName,
    hostUserUsername,
    guestUserUsername,
    locker,
    connection_id,
    guest_locker_id,
    host_locker_id,
    connection,
    connectionType,
    guestLocker,
    hostLocker
  )

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
    if (pdfData?.validity_until) {
      setEditableValidityUntil(pdfData.validity_until.split('T')[0]);
    }
  }, [pdfData]);
  useEffect(() => {
    if (pdfData?.node_information?.remarks !== undefined) {
      setRemarks(pdfData.node_information.remarks);
    }
  }, [pdfData]);

   useEffect(() => {
      if (connectionDetails) {
        const { close_guest, close_host } = connectionDetails;
        //   console.log(revoke_host, revoke_guest);
        if (close_host === true && close_guest === false) {
          setModalMessage({
            message:
              "You closed  the connection waiting for guest to close connection",
            type: "info",
          });
          setIsModalOpens(true);
        }
      }
    }, [connectionDetails]);

    useEffect(() => {
    if (connectionDetails) {
      const { close_guest, close_host } = connectionDetails;
      //   console.log(revoke_host, revoke_guest);
      if (close_host === false && close_guest === true) {
        setModalMessage({
          message:
            "The guest has closed the connection, click Close connection to close the connection",
          type: "info",
        });
        setIsModalOpenClose(true);
      }
    }
  }, [connectionDetails]);

  useEffect(() => {
    if (connectionDetails) {
      const { revoke_guest, revoke_host } = connectionDetails;
      //   console.log(revoke_host, revoke_guest);
      if (revoke_guest === true && revoke_host === false) {
        setModalMessage({
          message:
            "The guest has revoked the connection, click Revoke to revoke the connection",
          type: "info",
        });
        setIsModalOpen(true);
      }
    }
  }, [connectionDetails]);

  useEffect(() => {
    if (connectionDetails) {
      const { revoke_guest, revoke_host } = connectionDetails;
      //   console.log(revoke_host, revoke_guest);
      if (revoke_host === true && revoke_guest === false) {
        setModalMessage({
          message:
            "You revoked  the connection waiting for guest to revoke the connection",
          type: "info",
        });
        setIsModalOpens(true);
      }
    }
  }, [connectionDetails]);

  const connectionsData = connection
  // useEffect(() => {
  //   const fetchData = async () => {
  //     const token = Cookies.get("authToken"); // Get the token from Cookies
  //     if (!token) return setErrorMessage("Authentication token is missing.");

  //     try {
  //       const pages = await fetchTotalPages(selectedResourceId, token);
  //       // setTotalPages(pages); 
  //     } catch (error) {
  //       setErrorMessage(error.message || "Failed to fetch total pages.");
  //     }
  //   };

  //   if (selectedResourceId) fetchData();
  // }, [selectedResourceId]);
  useEffect(() => {
    const token = Cookies.get("authToken");
    const connectionLifeCycle = () => {
      fetch("host/update_connection_status_tolive/".replace(/host/, frontend_host), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${token}`
        },
        body: JSON.stringify({
          connection_name: connectionName,
          host_locker_name: hostLockerName,
          guest_locker_name: guestLockerName,
          host_user_username: hostUserUsername,
          guest_user_username: guestUserUsername
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Response:", data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });

    };
    connectionLifeCycle();
  })

  const onRevokeButtonClick = async (connection_id) => {
    setRevokeState(false);
    handleRevoke();
    setIsModalOpen(false);
    // setModalMessage({ message: message, type: "info" });
    // setIsModalOpen(false);
    setIsModalOpens(false);
  };
  useEffect(() => {
    if (connection || connectionDetails) {
      fetchTrackerData(connection || connectionDetails)
      fetchTrackerDataReverse(connection || connectionDetails);
    }
  }, [connection, connectionDetails]);

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

  // useEffect(() => {
  //   if (pdfData?.post_conditions) {
  //     const { creator_conditions, ...filteredConditions } = pdfData.post_conditions;
  //     setInitialPostConditions(filteredConditions);
  //     setEditablePostConditions(filteredConditions);
  //   }
  // }, [pdfData]);

  useEffect(() => {
    if (pdfData?.post_conditions) {
      const { creator_conditions, ...restPostConditions } = pdfData.post_conditions;
      let filteredPostConditions = restPostConditions;

      if (pdfData.xnode_Type === "VNODE") {
        filteredPostConditions = Object.fromEntries(
          Object.entries(restPostConditions).filter(([key]) =>
            ["share", "transfer"].includes(key)
          )
        );
      } else if (pdfData.xnode_Type === "SNODE") {
        // Exclude "subset"
        filteredPostConditions = Object.fromEntries(
          Object.entries(restPostConditions).filter(([key]) =>
            !["subset"].includes(key)
          )
        );
      }
      // setInitialPostConditions(filteredConditions);
      setEditablePostConditions(filteredPostConditions);
      setIsLockedPostConditions(pdfData.is_locked);
    }
  }, [pdfData]);

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
  const handleCloseModal = () => {
    if(isModalOpen || isModalOpens) {
      setIsModalOpen(false);
      setIsModalOpens(false);
    }
    navigate(`/view-locker?param=${Date.now()}`, { state: { locker: locker } });
    setPostModal(false);
    setModalMessage({ message: "", type: "" });
    // navigate(`/view-locker?param=${Date.now()}`, { state: { locker: locker } });
  };

  const handleCloseModalClose = () => {
    setIsModalOpenClose(false);
    setModalMessage({ message: "", type: "" });
    navigate(`/view-locker?param=${Date.now()}`, {
      state: { locker: connectionDetails.host_locker },
    });
  };

    const onCloseButtonClick = async (connection_id) => {
    setCloseState(false);
    handleCloseConnection(connection_id);
    setIsModalOpenClose(false);
    setIsModalOpen(false);
    setIsModalOpens(false);
    // setModalMessage({ message: message, type: "info" });
    // setIsModalOpenClose(true);
  };

  const handleCloseResourceModal = () => {
    setResourceModal(false);
    setSelectedRowData(null)
    setModalMessage({ message: "", type: "" });
  };

  const handleClose = () => {
    setIsReactModalOpen(false);
    setIsModalOpen(false);
    setPdfUrl(null);
  };

  const openPopup = (rowData) => {
    setSelectedRowData(rowData);
  };

  console.log("selectedRowData", selectedRowData)
  const openInfoPopup = () => {
    console.log("selectedRowDatas", selectedRowData)
    const extractedValue = termValues[selectedRowData.labelName]?.split(";")[0].split("|")[1]; // Extract the required value
    handleClicks(extractedValue); // Pass the extracted value to handleClicks
    console.log("obligationss", extractedValue);
    setShowOpenPopup(true);
  }

  const openInfoPopup2 = () => {
    console.log("selectedRowDatas2", selectedRowData2.enter_value?.split(";")[0].split("|")[1])
    const extractedValue = selectedRowData2.enter_value?.split(";")[0].split("|")[1]; // Extract the required value
    handleClicks(extractedValue); // Pass the extracted value to handleClicks
    // console.log("obligationss", extractedValue);
    setShowOpenPopup(true);
  }

  const openInfoPopup1 = () => {
    console.log("selectedRowDatas1", selectedRowData1.dataElement?.split(";")[0].split("|")[1])
    const extractedValue = selectedRowData1.dataElement.split(";")[0].split("|")[1]; // Extract the required value
    handleClicks(extractedValue); // Pass the extracted value to handleClicks
    console.log("obligationss", extractedValue);
    setShowOpenPopup(true);
  }

  useEffect(() => {
    if (selectedRowData) {
      openInfoPopup();
    }
  }, [selectedRowData]);
  console.log("pdfDatas", selectedRowData)

  const openPopup1 = (rowData) => {
    console.log("second one", rowData)
    setSelectedRowData1(rowData)
  }
  useEffect(() => {
    if (selectedRowData1) {
      openInfoPopup1();
    }
  }, [selectedRowData1]);

  const openPopup2 = (rowData) => {
    console.log("Third one", rowData)
    setSelectedRowData2(rowData)
  }
  useEffect(() => {
    if (selectedRowData2) {
      openInfoPopup2();
    }
  }, [selectedRowData2]);

  const closeOpenPopup = () => {
    setShowOpenPopup(false);
    setPdfData(null);
    setSelectedRowData(null);
    setSelectedRowData1(null);
    setSelectedRowData2(null);
  };
  // console.log("start", guest_locker_id, host_locker_id, locker);
  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }

    const fetchConnectionDetails = async () => {
      const connectionTypeName = connectionName?.split("-").shift().trim();

      const connection_type_name = connectionTypeName;
      const host_locker_name = hostLockerName;
      const guest_locker_name = guestLockerName;
      const host_user_username = hostUserUsername;
      const guest_user_username = guestUserUsername;

      const token = Cookies.get("authToken");

      try {
        const response = await fetch(
          `host/get-connection-details-v2?connection_type_name=${connection_type_name}&host_locker_name=${host_locker_name}&guest_locker_name=${guest_locker_name}&host_user_username=${host_user_username}&guest_user_username=${guest_user_username}`.replace(/host/, frontend_host),
          {
            method: "GET",
            headers: {
              Authorization: `Basic ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        console.log("data conn", data.connections);
        if (response.ok) {
          setConnectionDetails(data.connections);
          setPostConditions(data.post_conditions)
        } else {
          setError(data.error || "Failed to fetch connection details.");
        }
      } catch (err) {
        setError(`Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };


    const fetchGlobalTemplates = () => {
      const token = Cookies.get("authToken");
      fetch("host/get-template-or-templates/".replace(/host/, frontend_host), {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          // console.log("Fetched Templates:", data); // Log the fetched data
          setGlobalTemplates(data.data); // Store fetched templates
          // console.log("global data", data.data);
        })
        .catch((error) => {
          console.error("Error fetching templates:", error);
          setError("Failed to fetch templates");
        });
    };

    //fetch terms from the api
    const fetchObligations = async () => {
      try {
        const token = Cookies.get("authToken");
        const connectionTypeName = connectionName.split("-").shift().trim();
        const apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${hostUserUsername}&host_locker_name=${hostLockerName}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch terms");
        }

        const data = await response.json();

        if (data.success) {
          console.log("Fetched data by connection type:", data.data); // Log to confirm structure

          // Access nested obligations arrays
          const guestToHostObligations = data.data.obligations?.guest_to_host || [];
          const hostToGuestObligations = data.data.obligations?.host_to_guest || [];

          if (guestToHostObligations.length || hostToGuestObligations.length) {
            // Combine obligations if you need a single array, or set them separately as needed
            setTerms({ guestToHost: guestToHostObligations, hostToGuest: hostToGuestObligations });
            console.log("Guest to Host Obligations 1: terms", guestToHostObligations);
            console.log("Host to Guest Obligations 1: terms", hostToGuestObligations);

            setGuestToHostTerms(guestToHostObligations);
            setHostToGuestTerms(hostToGuestObligations);

          } else {
            console.error("No obligations found in data.data.obligations");
            setError("No obligations available in the fetched data");
          }
        } else {
          setError(data.error || "No terms found");
        }
      } catch (err) {
        console.error("Error fetching obligations:", err.message);
        setError(err.message);
      }
    };


    const fetchTerms = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(
          `${frontend_host}/get-terms-value/?host_user_username=${hostUserUsername}&guest_user_username=${guestUserUsername}&host_locker_name=${hostLockerName}&connection_name=${connectionName}&guest_locker_name=${guestLockerName}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch terms");
        }

        const data = await response.json();
        console.log("Fetched data:", data); // Log entire data to check its structure

        if (data.success) {
          const obligations = data.terms.obligations || [];

          // const guestObligations = obligations.filter(
          //   (obligation) => obligation.from === "GUEST" && obligation.to === "HOST"
          // );

          // const hostObligations = obligations.filter(
          //   (obligation) => obligation.from === "HOST" && obligation.to === "GUEST"
          // );

          const guestObligations = obligations.guest_to_host;
          const hostObligations = obligations.host_to_guest;

          // // Check if obligations exist in data.data
          // if (data && data.terms.obligations) {
          //   console.log("Obligations found:", data.terms.obligations); // Confirm obligations structure
          //   console.log("data.data.terms", data.terms);
          //   // Access guest_to_host and host_to_guest arrays
          //   const guestObligations = data.data.obligations.guest_to_host || [];
          //   const hostObligations = data.data.obligations.host_to_guest || [];

          // Log obligations arrays to verify
          console.log("Guest to Host Obligations 2:", guestObligations);
          console.log("Host to Guest Obligations 2:", hostObligations);

          setGuestToHostObligations(guestObligations);
          setHostToGuestObligations(hostObligations);

          // Initialize additional states based on obligations
          const initialValues = {};
          const initialResources = {};
          const statusMap = {};

          // Loop through guest and host obligations
          // [...guestObligations, ...hostObligations].forEach((obligation) => {
          hostObligations.forEach((obligation) => {
            initialValues[obligation.labelName] = obligation.value || "";
            statusMap[obligation.labelName] = obligation.value?.endsWith("T")
              ? "Approved"
              : obligation.value?.endsWith("R")
                ? "Rejected"
                : "Pending";

            if (obligation.typeOfAction === "file" && obligation.value) {
              const [id] = obligation.value.split(";");
              initialResources[obligation.labelName] = {
                id,
                i_node_pointer: obligation.i_node_pointer,
                typeOfSharing: obligation.typeOfSharing,
              };
            }
          });

          setRes(data.terms);
          setTermValues(initialValues);
          console.log("initial values checking", initialValues);
          setSelectedResources(initialResources);
          setStatuses(statusMap);
          setPermissions(data.terms.permissions.host_to_guest);
          console.log("permissions", data.terms.permissions, data.terms);
        } else {
          console.error("No obligations found in data.data.obligations");
          setError("No obligations available in the fetched data");
        }
      } catch (err) {
        console.error("Error fetching terms:", err.message);
        setError(err.message);
      }
    };



    // const fetchPermissionsData = async () => {
    //   // Placeholder for future implementation
    // };
    const fetchPermissionsData = async () => {
      try {
        const token = Cookies.get("authToken");
        const connectionId = connection_id;
        const response = await fetch(
          `host/get-extra-data?connection_id=${connectionId}`.replace(
            /host/,
            frontend_host
          ),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error("");
        }
        const data = await response.json();
        if (data.success) {
          // Create an array from the shared_more_data_terms object
          console.log(data.shared_more_data_terms);
          const sharedData = Object.entries(data.shared_more_data_terms_reverse).map(
            ([key, value], index) => ({
              sno: index + 1,
              labelName: key,
              dataElement: value.enter_value,
              purpose: value.purpose,
              action: value.typeOfValue,
              share: value.typeOfShare,
            })
          );
          setPermissionsData(sharedData);
          console.log("permissionData", sharedData);
          const statusMap2 = {}
          sharedData.forEach((permission) => {
            console.log("perm,", permission);

            statusMap2[permission.labelName] = permission.dataElement.endsWith("T")
              ? "Approved"
              : permission.dataElement.endsWith("R")
                ? "Rejected"
                : "Pending";

          });
          setStatuses2(statusMap2);
          console.log(statusMap2, "map");
        } else {
          setError(data.error || "No permissions data found");
        }
      } catch (err) {
        setError(err.message);
      }
    };


    const fetchResources = async () => {
      if (selectedLocker) {
        try {
          const token = Cookies.get("authToken");
          const response = await fetch(
            `host/get-resources-user-locker/?locker_name=${selectedLocker}`.replace(
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
          if (data.success) {
            setResources(data.resources);
          } else {
            setError(data.message || "Failed to fetch resources");
          }
        } catch (error) {
          setError("An error occurred while fetching resources");
        }
      }
    };

    const fetchVnodeResources = async () => {
      if (selectedLocker) {
        try {
          const token = Cookies.get("authToken");
          const params = new URLSearchParams({
            host_locker_id: locker.locker_id,
          });

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
          //   console.log("data", data);
          //   console.log("vnodes", data.data);

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
      }
    };

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
        console.log("xnode data", data);

        if (data.xnode_list) {
          // Set all xnodes
          // setXnodes(data.xnode_list);

          // Filter xnodes where primary_owner === current_owner
          const filteredData = data.xnode_list.filter(
            // (node) => node.node_information?.primary_owner === node.node_information?.current_owner
            (xnode) => xnode.status !== "closed"
          );
          setXnodes(filteredData);
          // Set filtered xnodes
          setFilteredXnodes(filteredData);
        } else {
          setError(data.message || "Failed to fetch Xnodes");
        }
      } catch (error) {
        console.error("Error fetching Xnodes:", error);
        setError("An error occurred while fetching Xnodes");
      }
    };

    fetchPermissionsData();
    fetchTerms();
    fetchGlobalTemplates();
    fetchObligations();
    fetchConnectionDetails();
    fetchResources();
    fetchXnodes();
    fetchVnodeResources();
  }, [curruser, navigate, hostUserUsername, guestLockerName, connectionName, selectedLocker]);

  // useEffect(() => {
  //   if (connectionDetails) {
  //     const { revoke_guest, revoke_host } = connectionDetails;
  //     // console.log(revoke_host, revoke_guest);
  //     if (revoke_guest === true && revoke_host === false) {
  //       setModalMessage({
  //         message: 'You have closed the connection, but the host is yet to approve your revoke.',
  //         type: 'info',
  //       });
  //       setIsModalOpen(true);
  //     }
  //   }
  // }, [connectionDetails]);



  const handleClicks = async (xnode_id_with_pages) => {
    const xnode_id = xnode_id_with_pages?.split(',')[0];
    const pages = xnode_id_with_pages?.split(',')[1];
    const from_page = parseInt(pages?.split(':')[0].split("(")[1], 10);
    const to_page = parseInt(pages?.split(':')[1].replace(")")[0], 10);
    console.log(xnode_id, "pages", pages, "from", from_page, "to_page", to_page);
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`host/consent-artefact-view-edit/?xnode_id=${xnode_id}`.replace(
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
      console.log("datass", data);
      const { xnode } = data;

      if (xnode) {
        setPdfData(xnode)
      } else {
        setModalMessage({
          message: ` ${data.message}`,
          type: 'info',
        });
        setResourceModal(true);
      }
    } catch (err) {
      setModalMessage({
        message: ` ${err.message}`,
        type: 'info',
      });
      setResourceModal(true);
    } finally {
      // setLoading(false);
    }
  };

  const getTrueKeys = (obj) => {
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => key !== "creator_conditions") // Exclude creator_conditions
    );
  };

  // const getTrueKeys = (obj) => {
  //   return Object.entries(obj)
  //     .filter(([key, value]) => value === true)
  //     .map(([key]) => key);
  // };



  const postConditionsKeys = getTrueKeys(pdfData?.post_conditions || {});

  const getTrueKeysView = (obj) => {
    return Object.entries(obj)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);
  };
  const postConditionsKeysView = getTrueKeysView(pdfData?.post_conditions || {});

  const fetchAndOpenResource = async (xnode_id_with_pages) => {
    const xnode_id = xnode_id_with_pages?.split(',')[0];
    const pages = xnode_id_with_pages?.split(',')[1];
    const from_page = parseInt(pages?.split(':')[0].split("(")[1], 10);
    const to_page = parseInt(pages?.split(':')[1].replace(")")[0], 10);
    console.log(xnode_id, "pages", pages, "from", from_page, "to_page", to_page);
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`host/access-res-submitted-v2/?xnode_id=${xnode_id}`.replace(
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

        // const secureFileUrl =
        //   process.env.NODE_ENV === 'production'
        //     ? link_To_File.replace('http://', 'https://')
        //     : link_To_File;
        // setPdfUrl(link_To_File);
        setIsReactModalOpen(true); // Open the modal
      } else {
        setError('Unable to retrieve the file link.');
        console.log(error);
      }
    } catch (err) {
      // setError(`Error: ${err.message}`);
      console.log(err);
    } finally {
      // setLoading(false);
    }
  };

  // Show loading while fetching connection details
  if (loading) {
    return <div>Loading...</div>; // Replace with a proper loading component if needed
  }

  const handleInputChange = (labelName, value) => {
    setTermValues((prev) => ({
      ...prev,
      [labelName]: value,
    }));
  };

  // console.log("permissionsData", permissionsData);
  const renderInputField = (obligation) => {
    const strippedValue = termValues[obligation.labelName]
      // ?.replace(/;[TFR]$/, "");
      ?.replace(/;[ ]?[TFR]$/, "");
    // console.log(strippedValue, "strippedValue", termValues);
    switch (obligation.typeOfAction) {
      case "text":
        return (
          <input
            type="text"
            placeholder="Enter value"
            value={strippedValue || ""}
            onChange={(e) =>
              handleInputChange(obligation.labelName, e.target.value)
            }
          />
        );
      case "file":
        // console.log("name", selectedResources[obligation.labelName]);
        // console.log("name 2", selectedResources);
        // console.log("selection name", selection);
        return (
          <>
            {termValues[obligation.labelName]?.split(";")[0]?.split("|")[0] && (
              <a className="mb-1"
                style={{ display: "block", color: "blue", textDecoration: "underline", cursor: "pointer" }}
                onClick={() =>
                  fetchAndOpenResource(
                    termValues[obligation.labelName]?.split(";")[0]?.split("|")[1]
                  )
                }
              >
                {termValues[obligation.labelName]?.split(";")[0]?.split("|")[0]}
              </a>
            )}
            {/* <button onClick={() => handleButtonClick(obligation)}>
              {termValues[obligation.labelName]?.split(";")[0]?.split("|")[0] ||
              Select Resource
            </button> */}

            {(obligation.value.endsWith("F") || obligation.value.endsWith("R")) && (
              <button onClick={() => handleButtonClick(obligation)}>

                Select Resource
              </button>
            )}
            <ReactModal
              isOpen={isReactModalOpen}
              onRequestClose={handleClose}
              contentLabel="PDF Viewer"
              style={{
                content: {
                  top: "55%",
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
          </>
        );
      case "date":
        return (
          <input
            type="date"
            value={strippedValue || ""}
            onChange={(e) =>
              handleInputChange(obligation.labelName, e.target.value)
            }
          />
        );
      default:
        return null;
    }
  };

  const handleButtonClick = (obligation) => {
    if (obligation?.value?.includes('|') && obligation?.value?.includes(';')) {
      const idPart = obligation.value.split('|')[1].split(';')[0].trim();
      setExtractedId(idPart);
    } else {
      setExtractedId(null);
    }
    setSelectedLocker(guestLockerName);
    setShowResources(true);
    setCurrentLabelName(obligation.labelName);
    setTypeofShare(obligation.typeOfSharing)
  };
  console.log("obligationsssss2", typeofShare)
  const handleResourceSelection3 = (resource) => {
    // console.log("inside",resource);
    // initialResources[obligation.labelName] = {
    //                 document_name,
    //                 i_node_pointer: obligation.i_node_pointer,
    //                 typeOfSharing: obligation.typeOfSharing,
    //               };

    setSelection((prev) => ({
      ...prev,
      [currentLabelName]: { id: resource.id, resource_name: resource.resource_name, }
    }));
    setSelectedResources((prev) => ({
      ...prev,
      [currentLabelName]: resource,
    }));
    setShowResources(true);
    setSelectedResourceId(resource.id);
    setShowPageInput(true);
    // console.log("resources selected", selectedResources);
    console.log("page input", showPageInput);
  };
  console.log("page input", showPageInput);

  const handleResourceSelection = async (resource) => {
    console.log("X_NODE Post_conditions", resource.post_conditions[typeofShare]);
    console.log("Connection Post_conditions", postConditions[typeofShare])
    console.log("User Post_conditions", curruser.user_id)
    console.log("Creator Post_conditions", resource.creator)
    // if (resource.creator == curruser.user_id || resource.post_conditions[typeofShare]) {

    //   const url = `${frontend_host}/get_total_pages_v2/?xnode_id=${resource.id}`;
    //   // Update selection state

    //   setSelection((prev) => ({
    //     ...prev,
    //     [currentLabelName]: { id: resource.id, resource_name: resource.resource_name, }
    //   }));
    //   setSelectedResources((prev) => ({
    //     ...prev,
    //     [currentLabelName]: resource,
    //   }));
    //   setShowResources(true);
    //   setSelectedResourceId(resource.id);
    //   // setShowPageInput(true);
    //   const token = Cookies.get("authToken");

    //   // Fetch total pages for the selected resource
    //   try {

    //     const response = await fetch(url, {
    //       method: 'GET',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Authorization: `Basic ${token}`,
    //       },
    //     });
    //     const data = await response.json();

    //     if (response.ok) {
    //       setTotalPages(data.total_pages);
    //       setError(null); // Clear any previous errors
    //     } else {
    //       setError(data.error); // Handle error message
    //       setTotalPages(null);
    //     }
    //   } catch (err) {
    //     setError("An unexpected error occurred while fetching total pages.");
    //     setTotalPages(null);
    //   }

    // } else {
    //   setError(`You are not allowed to ${typeofShare} the resource`)
    //   setModalMessage({
    //     message: `You are not allowed to ${typeofShare} the resource`,
    //     type: "error",
    //   });
    //   setPostModal(true);
    //   // alert(`You are not allowed to ${typeofShare} the resource`)
    // }
    setSelection((prev) => ({
      ...prev,
      [currentLabelName]: { id: resource.id, resource_name: resource.resource_name, }
    }));
    setSelectedResources((prev) => ({
      ...prev,
      [currentLabelName]: resource,
    }));
    setShowResources(true);
    setSelectedResourceId(resource.id);
  };


  //********************************************************** */
  const handleButtonClick2 = (term) => {
    if (term?.enter_value?.includes('|') && term?.enter_value?.includes(';')) {
      const idPart = term?.enter_value.split('|')[1].split(';')[0].trim();
      setExtractedId(idPart);
    } else {
      setExtractedId(null);
    }
    setSelectedLocker(guestLockerName);
    setShowResources2(true);
    setCurrentLabelName(term.labelName);
    setTypeofShare(term.typeOfShare || term.typeOfSharing)
  };

  const handleResourceSelection2 = (resource) => {
    // console.log("inside",resource);
    // initialResources[obligation.labelName] = {
    //                 document_name,
    //                 i_node_pointer: obligation.i_node_pointer,
    //                 typeOfSharing: obligation.typeOfSharing,
    //               };

    setSelection2((prev) => ({
      ...prev,
      [currentLabelName]: { id: resource.id, resource_name: resource.resource_name, }
    }));
    setSelectedResources2((prev) => ({
      ...prev,
      [currentLabelName]: resource,
    }));
    // setShowResources2(false);
    setSelectedResourceId2(resource.id);
    // setShowPageInput2(true);
    // console.log("resources selected", selectedResources);
    // console.log("selection", selection);
  };

  // const handlePageSubmits2 = async () => {
  //   // if (!fromPage || !toPage) {
  //   //   setErrorMessage("Both from_page and to_page are required.");
  //   //   return;
  //   // }
  //   const token = Cookies.get("authToken");
  //   try {
  //     // const response = await fetch('host/get_total_pages_v2/'.replace(
  //     //   /host/,
  //     //   frontend_host
  //     // ), {
  //     //   method: 'POST',
  //     //   headers: {
  //     //     'Content-Type': 'application/json',
  //     //     Authorization: `Basic ${token}`,

  //     //   },
  //     //   body: JSON.stringify({
  //     //     xnode_id: selectedResourceId2,
  //     //     from_page: parseInt(fromPage, 10),
  //     //     to_page: parseInt(toPage, 10)
  //     //   })
  //     // });

  //     // const data = await response.json();

  //     if (true) {

  //       const resource = selection2[currentLabelName]; // Current selected resource
  //       // console.log("in page res", resource);
  //       const termValue = `${resource.resource_name}|${resource.id}; F`;
  //       // console.log(termValue, "termValue");


  //       appendPagesToTerms2(termValue);


  //       setShowPageInput2(false);
  //       setShowResources2(false)
  //       setErrorMessage(null);
  //       setFromPage('');
  //       setToPage('');
  //     } else {

  //       setErrorMessage("Error occured");
  //     }
  //   } catch (error) {
  //     setErrorMessage("An error occurred while validating pages.");
  //   }
  // };

  const handlePageSubmit2 = async () => {
    const token = Cookies.get("authToken");
    const resource = selection2[currentLabelName];
    if (resource) {
      const data = {
        connection_name: connectionName,
        host_locker_name: hostLockerName,
        host_user_username: hostUserUsername,
        xnode_id: resource.id,
        share_Type: typeofShare,
        old_xnode: extractedId,
      };
      console.log("payload for post", data)
      try {
        const response = await fetch('host/share_confer_resource_reverse_v2/'.replace(
          /host/,
          frontend_host
        ), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${token}`,

          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
          // alert(result.message);
          console.log("New Xnode ID:", result.new_xnode_id);
          const new_xnode_id = result.new_xnode_id
          const termValue = `${resource.resource_name}|${new_xnode_id}; F`;
          appendPagesToTerms2(termValue);

          setExtractedId(null);
          setShowPageInput2(false);
          setShowResources2(false)
          setErrorMessage(null);
        } else {
          const errorMsg = result.error
          setError(`You are not allowed to ${typeofShare} the resource`)
          setModalMessage({
            message: errorMsg,
            type: "error",
          });
          setPostModal(true);
          // alert(result.error);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong!");
      }
    } else {
      setModalMessage({
        message: "Please choose a resource.",
        type: "error",
      });
      setPostModal(true);
    }
  }

  const handleRevoke = async () => {
          const token = Cookies.get("authToken");
          const formData = new FormData();
          formData.append("connection_name", connectionDetails?.connection_name);
          formData.append("connection_type_name", connectionDetails?.connection_type_name);
          formData.append("guest_username", connectionDetails?.guest_user?.username);
          formData.append("guest_lockername", connectionDetails?.guest_locker?.name);
          formData.append("host_username", connectionDetails?.host_user?.username);
          formData.append("host_lockername", connectionDetails?.host_locker?.name);
      
      console.log("formData", formData);
          try {
            const response = await fetch(
              "host/revoke-consent/".replace(/host/, frontend_host),
              {
                method: "POST",
                headers: {
                  // 'Content-Type': 'application/json',
                  Authorization: `Basic ${token}`,
                },
                body: formData,
              }
            );
            setIsModalOpens(false)
            setIsModalOpen(false)
            const data = await response.json();
            console.log("revoke consent", data);
            if (response.status === 200) {
              // setMessage("Consent revoked successfully.");
              setModalMessage({
                message:  data.message || "Consent revoked successfully.",
                type: "success",
              });
              setIsModalOpen(true);
            } else {
              setModalMessage({
                message: data?.error,
                type: "info",
              });
              setIsModalOpen(true);
            }
          } catch (error) {
            console.error("Error:", error);
            setModalMessage({
              messgae: error,
              type: "error",
            });
            setIsModalOpen(true);
          }
          // setIsModalOpens(true);
          // navigate(`/target-locker-view`);
      
        };

  const handleRevokeConsentConfirm = () => {
    setShowRevokeConsentModal(false); // Close the modal
    handleConsentAndInfo(connectionName); // Execute revoke consent action
  };

  // const appendPagesToTerms2 = (termValue) => {
  // console.log("more", currentLabelName, termValue)
  // console.log(moreDataTerms, "before update more term values")
  // setMoreDataTerms((prevTerms) =>
  //   prevTerms.map((term) =>
  //     term.labelName === currentLabelName
  //       ? { ...term, enter_value: termValue } // Update only 'enter_value'
  //       : term // Keep all other terms and fields intact
  //   )
  // );
  // console.log("updated more term values", moreDataTerms);
  // };

  const appendPagesToTerms2 = (newValue) => {
    console.log("Label to update:", currentLabelName);
    console.log("New value:", newValue);

    setMoreDataTerms((prevTerms) => {
      const updatedTerms = prevTerms.map((term) => {
        console.log("Checking term:", term);
        if (term.labelName.trim().toLowerCase() === currentLabelName.trim().toLowerCase()) {
          console.log("Match found, updating enter_value for:", term.labelName);
          return { ...term, enter_value: newValue }; // Update only 'enter_value'
        }
        return term; // Keep all other terms and fields intact
      });

      console.log("Updated Terms:", updatedTerms);
      return updatedTerms;
    });
  };

  //******************************************************** */
  // useEffect(() => {

  // }, [selectedLocker]);

  const combinedResources = [...resources];
  VnodeResources.forEach((vnode) => {
    combinedResources.push(vnode.resource);
  });

  // const handlePageSubmits = async () => {
  //   // if (!fromPage || !toPage) {
  //   //   setErrorMessage("Both from_page and to_page are required.");
  //   //   return;
  //   // }
  //   const token = Cookies.get("authToken");
  //   try {
  //     // const response = await fetch('host/get_total_pages_v2/'.replace(
  //     //   /host/,
  //     //   frontend_host
  //     // ), {
  //     //   method: 'POST',
  //     //   headers: {
  //     //     'Content-Type': 'application/json',
  //     //     Authorization: `Basic ${token}`,

  //     //   },
  //     //   body: JSON.stringify({
  //     //     xnode_id: selectedResourceId,
  //     //     from_page: parseInt(fromPage, 10),
  //     //     to_page: parseInt(toPage, 10)
  //     //   })
  //     // });

  //     // const data = await response.json();

  //     if (true) {

  //       const resource = selection[currentLabelName]; // Current selected resource
  //       // console.log("in page res", resource);
  //       const termValue = `${resource.resource_name}|${resource.id}; F`;
  //       // console.log(termValue, "termValue");


  //       appendPagesToTerms(termValue);


  //       setShowPageInput(false);
  //       setErrorMessage(null);
  //       setShowResources(false)
  //       setFromPage('');
  //       setToPage('');
  //       setIsCompletePages(false)
  //     } else {

  //       setErrorMessage("Error occured");
  //     }
  //   } catch (error) {
  //     setErrorMessage("An error occurred while validating pages.");
  //   }
  // };

  const handlePageSubmit = async () => {
    const token = Cookies.get("authToken");
    const resource = selection[currentLabelName];
    console.log("resourcess", resource)
    if (resource) {
      const data = {
        connection_name: connectionName,
        host_locker_name: hostLockerName,
        host_user_username: hostUserUsername,
        xnode_id: resource.id,
        share_Type: typeofShare,
        old_xnode: extractedId,
      };
      console.log("payload for post", data)
      try {
        const response = await fetch('host/share_confer_resource_reverse_v2/'.replace(
          /host/,
          frontend_host
        ), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${token}`,

          },
          body: JSON.stringify(data)
        });

        const result = await response.json();
        if (response.ok) {
          // alert(result.message);
          console.log("New Xnode ID:", result.new_xnode_id);
          const new_xnode_id = result.new_xnode_id
          const termValue = `${resource.resource_name}|${new_xnode_id}; F`;
          appendPagesToTerms(termValue);

          setExtractedId(null);
          setShowPageInput(false);
          setErrorMessage(null);
          setShowResources(false)
          setIsCompletePages(false)
        } else {
          const errorMsg = result.error
          // setError(`You are not allowed to ${typeofShare} the resource`)
          setModalMessage({
            message: errorMsg,
            type: "error",
          });
          setPostModal(true);
          // alert(result.error);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("Something went wrong!");
      }
    } else {
      // setError(`You are not allowed to ${typeofShare} the resource`)
      setModalMessage({
        message: "Please choose a resource.",
        type: "error",
      });
      setPostModal(true);
    }
  }

  // const fetchTotalPages = async (selectedResourceId, token) => {
  //   const url = `${frontend_host}/get_total_pages_v2/?xnode_id=${selectedResourceId}`;
  //   console.log("Fetching data from URL:", url); // Log the URL

  //   try {
  //     const response = await fetch(url, {
  //       method: 'GET',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Basic ${token}`,
  //       },
  //     });

  //     const data = await response.json();
  //     if (!response.ok || !data.success) {
  //       throw new Error(data.error || "Failed to fetch total pages.");
  //     }
  //     return data.total_pages;
  //   } catch (error) {
  //     console.error("Error details:", error); // Log the error details
  //     throw new Error("An error occurred while fetching the total pages.");
  //   }
  // };  

  const handleCompletePagesChange = () => {
    setIsCompletePages(prevState => !prevState);
    if (!isCompletePages) {
      setFromPage('1'); // Set fromPage to 1
      setToPage(totalPages); // Set toPage to the total number of pages
    } else {
      setFromPage('');
      setToPage('');
    }
  };

  const appendPagesToTerms = (termValue) => {
    // console.log("in append", termValue);
    setTermValues((prevTerms) => ({
      ...prevTerms,
      [currentLabelName]: termValue,
    }));
    // console.log("updated term values", termValues);
  };


  // const fetchCombinedResources = async () => {
  //     try {
  //         const token = Cookies.get("authToken");
  //         const lockerResponse = await fetch(
  //             `host/get-resource-by-user-by-locker/?locker_name=${selectedLocker}`.replace(/host/, frontend_host),
  //             {
  //                 method: "GET",
  //                 headers: {
  //                     "Content-Type": "application/json",
  //                     Authorization: `Basic ${token}`,
  //                 },
  //             }
  //         );
  //         const vnodeResponse = await fetch(
  //             `host/get-vnodes/?host_locker_id=${locker.locker_id}`.replace(/host/, frontend_host),
  //             {
  //                 method: "GET",
  //                 headers: {
  //                     "Content-Type": "application/json",
  //                     Authorization: `Basic ${token}`,
  //                 },
  //             }
  //         );

  //         if (!lockerResponse.ok || !vnodeResponse.ok) {
  //             throw new Error("Failed to fetch resources");
  //         }

  //         const lockerData = await lockerResponse.json();
  //         const vnodeData = await vnodeResponse.json();
  //         if (lockerData.success && vnodeData.data) {
  //             console.log(vnodeData.data);
  //             const combinedResources = [
  //                 ...lockerData.resources,
  //                 ...vnodeData.data
  //             ];
  //             setResources(combinedResources);
  //         } else {
  //             setError("Failed to fetch combined resources");
  //         }
  //     } catch (error) {
  //         setError("An error occurred while fetching resources");
  //     }
  // };

  // useEffect(() => {
  //     if (selectedLocker) {
  //         fetchCombinedResources();
  //     }
  // }, [selectedLocker]);

  const handleSubmit = async () => {
    try {
      const newResourcesData = {
        Transfer: [],
        Share: [],
        Confer: [],
        Collateral: [],
      };

      // Traverse through permissionsData
      const canShareMoreData = termValues["canShareMoreData"] || {};
      permissionsData.forEach((permission) => {
        const { labelName, dataElement, purpose, action, share } = permission;

        canShareMoreData[labelName] = {
          enter_value: dataElement,
          purpose: purpose,
          typeOfValue: action,
          typeOfSharing: share,
        };
      });


      console.log("check2");
      // console.log("updated term values in submit", termValues);
      const termsValuePayload = {

        ...Object.fromEntries(
          Object.entries(termValues).map(([key, value]) => {
            console.log("updated term values in submit", termValues);
            console.log("after", hostToGuestObligations);
            const obligation = hostToGuestObligations.find(
              (ob) => ob.labelName === key
            );
            console.log("ob", obligation);
            const initialValue = obligation?.value || "";
            // console.log(initialValue, "initial Value");

            if (obligation.typeOfAction === "file") {
              const initialVal = initialValue?.split("|")[1]?.split(",")[0] || "";

              // console.log("initialVal", initialVal, initialValue);
              const resource = selection[key];
              // const v = `${resource?.resource_name+"|"+resource?.id,fromPage+":"+toPage}`;
              // console.log("resource in payload", resource);
              //   const initialResourcePointer = initialValue.split(";")[0];
              //   console.log(initialResourcePointer);
              // if (
              //   resource &&
              //   resource.id && resource.resource_name && 
              //   v !== initialValue?.split(";")[0]
              // ) {
              //     // if (obligation.typeOfSharing === "transfer" && obligation.value.endsWith('T')) {
              //     if (obligation.typeOfSharing === "transfer") {
              //       //if (!updatedResourcesData.transfer.includes(resource.i_node_pointer)) {
              //       // newResourcesData.Transfer.push(resource.i_node_pointer);
              //       // }
              //       // } else if (obligation.typeOfSharing === "share" && obligation.value.endsWith('T')) {
              //     } else if (obligation.typeOfSharing === "share") {
              //       //if (!updatedResourcesData.share.includes(resource.i_node_pointer)) {
              //       // newResourcesData.Share.push(resource.i_node_pointer);
              //       //}
              //     }
              // return [
              //   key,
              //   `${resource.resource_name+"|"+resource.id,fromPage+":"+toPage}; F`,
              // ];
              // } else {
              return [key, value];
              //  }
            } else if (value !== initialValue) {
              return [key, `${value.replace(/;[ ]?[TFR]$/, "")}; F`];
            } else {
              return [key, initialValue];
            }
          })
        ),
      };

      const updatedTermsValue = {
        ...termsValuePayload, // Update all the terms that have changed
        canShareMoreData: canShareMoreData, // Keep canShareMoreData intact
      };

      const token = Cookies.get("authToken");
      // setResourcesData(updatedResourcesData);
      const payload = {
        connection_name: connectionName,
        host_locker_name: hostLockerName,
        guest_locker_name: guestLockerName,
        host_user_username: hostUserUsername,
        guest_user_username: guestUserUsername,
        terms_value_reverse: updatedTermsValue,
        resources: newResourcesData,
      };
      // console.log("resourcesData", payload.resources);
      // console.log("resources", resources);
      // console.log("termsValue", payload.terms_value);
      console.log("payload", payload);

      // if (resourcesData.Transfer.length > 0) {
      //     const transferResponse = await fetch(`localhost:8000/transfer-resource/`, {
      //         method: "POST",
      //         headers: {
      //             "Content-Type": "application/json",
      //             Authorization: `Basic ${token}`,
      //         },
      //         body: JSON.stringify({ ...payload, resources: resourcesData.Transfer }),
      //     });

      //     if (!transferResponse.ok) {
      //         throw new Error("Failed to transfer resources");
      //     }
      // }

      // if (resourcesData.Share.length > 0) {
      //     const shareResponse = await fetch(`localhost:8000/share-resource/`, {
      //         method: "POST",
      //         headers: {
      //             "Content-Type": "application/json",
      //             Authorization: `Basic ${token}`,
      //         },
      //         body: JSON.stringify({ ...payload, resources: resourcesData.Share }),
      //     });

      //     if (!shareResponse.ok) {
      //         throw new Error("Failed to share resources");
      //     }
      // }

      const updateResponse = await fetch(
        `host/update_connection_terms_v2/`.replace(/host/, frontend_host),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!updateResponse.ok) {
        throw new Error("Failed to update terms");
      }

      const data = await updateResponse.json();
      if (data.success) {
        navigate(`/view-locker?param=${Date.now()}`, { state: { locker } });
      } else {
        throw new Error(data.error || "Failed to update terms");
      }
    } catch (err) {
      console.error("Error during submission:", err);
      setError(err.message);
    }
  };

  // console.log("resources list", resources);
  // State for storing user inputs for moreDataTerms

  // Function to handle changes in the permission table
  const handleMoreDataInputChange = (index, field, value) => {
    // Copy the current state of moreDataTerms
    const updatedMoreDataTerms = [...moreDataTerms];

    // Update the specific field (labelName, purpose, or enter_value) for the given index
    updatedMoreDataTerms[index] = {
      ...updatedMoreDataTerms[index],
      [field]: value,
    };

    // Update the state
    setMoreDataTerms(updatedMoreDataTerms);
  };

  // Function to handle action type change
  const handleActionTypeChange = (index, newType) => {
    const updatedMoreDataTerms = [...moreDataTerms];
    updatedMoreDataTerms[index].type = newType;
    setMoreDataTerms(updatedMoreDataTerms);
  };

  // Function to handle form submission
  const handleMoreSubmit = async () => {

    // Build extraDataArray from moreDataTerms
    const extraDataArray = moreDataTerms.map((term) => ({
      labelName: term.labelName || "", // If labelName is not provided, use an empty string
      enter_value: term.enter_value || "", // If value is not provided, use an empty string
      purpose: term.purpose || "Purpose for the document", // Default purpose
      typeOfValue: term.type || "text", // Default to 'text' if no type is selected
      typeOfShare: term.typeOfShare || "share",
      // status: statuses2[term.labelName]||"Pending",
    }));

    const requestBody = {
      connection_name: connectionName,
      host_locker_name: hostLockerName,
      guest_locker_name: guestLockerName,
      host_user_username: hostUserUsername,
      guest_user_username: guestUserUsername,
      extra_data: extraDataArray,
    };

    console.log("Request Body:", JSON.stringify(requestBody, null, 2));

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`${frontend_host}/update-extra-data-v2/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error("Failed to update extra data");
      }

      const data = await response.json();
      if (data.success) {
        alert("Data updated successfully!");
        navigate(`/view-locker?param=${Date.now()}`, { state: { locker } });
      } else {
        alert(data.error || "Error updating data");
      }
    } catch (err) {
      alert(err.message);
    }
  };
  const addMoreDataTerm = () => {
    setMoreDataTerms((prevTerms) => [
      ...prevTerms,
      { labelName: "", purpose: "", enter_value: "", type: "text", typeOfSharing: "share", status: "Pending" }, // Default values
    ]);
  };
  const removeMoreDataTerm = (index) => {
    setMoreDataTerms((prevTerms) => prevTerms.filter((_, i) => i !== index));
  };

  const updateTerm = (index, field, value) => {
    setMoreDataTerms((prevTerms) => {
      const updatedTerms = [...prevTerms];
      updatedTerms[index] = {
        ...updatedTerms[index],
        [field]: value, // Update the specific field based on the input
      };
      return updatedTerms;
    });
  };
  console.log("connectionDetailsss", connectionDetails)
  const navigateToConnectionTerms = (connection) => {
    // console.log("print", connection);
    // Check if connection is a string
    if (typeof connection === "string") {
      const connectionName = connection; // Treat the string as the connection_name
      const connectionTypeName = connectionName.split("-").shift().trim();

      // console.log("conntype", connectionTypeName);
      console.log("navigate", guestUserUsername)

      navigate("/display-terms", {
        state: {
          connectionName: connectionName, // Pass the string as connectionName
          connectionDescription: connectionDescription,
          hostLockerName: hostLockerName,
          guestLockerName: guestLockerName,
          connectionTypeName,
          guestUserUsername: guestUserUsername,
          hostUserUsername: hostUserUsername,
          locker: locker.name,
          showConsent: false,
          lockerComplete: locker,
          hostLocker: hostLocker,
          guestLocker: guestLocker,
          createdtime: connectionDetails.created_time,
          validitytime: connectionDetails.validity_time,
          viewHostDisplay: true,
          connectionDetails,
          connectionType,
        },
      });
    } else {
      console.error(
        "Expected connection to be a string, but received:",
        connection
      );
    }
  };

  console.log("datas", hostLocker)

  const handleConsentAndInfo = (connection) => {
    if (typeof connection === "string") {
      const connectionName = connection; // Treat the string as the connection_name
      const connectionTypeName = connectionName.split("-").shift().trim();

      console.log("Navigating with state:", {
        connectionName,
        connectionTypeName,
        guest_locker_id: connection.guest_locker?.id,
        host_locker_id: connection.host_locker?.id,
        connection_id: connection.connection_id,
      });

      navigate("/show-connection-terms", {
        state: {
          connectionName: connectionName, // Pass the string as connectionName
          connectionDescription: connectionDescription,
          hostLockerName: hostLockerName,
          connectionTypeName,
          connectionTypeID: connectionsData?.connection_type,
          hostUserUsername: hostUserUsername,
          guestUserUsername: guestUserUsername,
          guestLockerName: guestLockerName,
          locker: locker.name,
          showConsent: true,
          guest_locker_id,
          host_locker_id,
          connection_id,
          lockerComplete: locker,
          hostLocker: hostLocker,
          guestLocker: guestLocker,
          viewHost: true,
          connectionType,
          connection
        },
      });
    }
  };

  const handlePermissionChange = (index, value) => {
    const newPermissions = [...permissions];
    newPermissions[index] = value;
    setPermissions(newPermissions);
  };

  // const uniqueGlobalConnTypeIds = [...new Set(terms
  //   .filter(term => term.global_conn_type_id !== null)
  //   .map(term => term.global_conn_type_id)
  // )];
  console.log("Terms:", terms); // Check the content of terms

  // Flatten the object (for example, consider guest_to_host)
  const termsArray = [...(terms.guest_to_host || []), ...(terms.host_to_guest || [])];
  // Access guest_to_host array, fallback to empty array

  // Log the termsArray for debugging
  console.log("Terms Array:", termsArray);

  // Ensure you filter and map properly over the array
  const uniqueGlobalConnTypeIds = Array.isArray(termsArray) ? [
    ...new Set(
      termsArray
        .filter(term => term.global_conn_type_id !== null && term.global_conn_type_id !== undefined)
        .map(term => term.global_conn_type_id)
    )
  ] : [];


  console.log("Unique Global Conn Type Ids:", uniqueGlobalConnTypeIds);



  const globalTemplateNames = uniqueGlobalConnTypeIds.map(id => {
    const template = globalTemplates.find(template => template.global_connection_type_template_id === id);
    // console.log(template, "template for id:", id);  

    return template ? template : null;
  });

  const handleNavigation = (template) => {
    if (template) {
      console.log(template);
      navigate('/GlobalTermsView', {
        state: {
          connectionTypeName: template.global_connection_type_name,
          connectionTypeDescription: template.global_connection_type_description,
          template_Id: template.global_connection_type_template_id,
          hide: true,
        },
      });
    }
  };
  // console.log(uniqueGlobalConnTypeIds, globalTemplates,  globalTemplateNames, "name");
  const allObligationsApproved = () => {
    return res?.hostToGuestObligations?.every((obligation) => statuses[obligation.labelName] === "Approved");
  };
  // const handleNavigation = (template) => {
  //   if (template) {
  //     console.log("temp",template);
  //     console.log("id",template.global_connection_type_template_id);
  //     navigate('/GlobalTermsView', {
  //       state: {
  //         connectionTypeName: template.global_connection_type_name,
  //         connectionTypeDescription: template.global_connection_type_description,
  //         template_Id: template.global_connection_type_template_id,
  //         hide: true,
  //       },
  //     });
  //   }
  // };


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
      // console.log(data);
      const { link_To_File } = data;

      if (link_To_File) {
        const secureFileUrl = link_To_File.replace('http://', 'https://');
        setPdfUrl(secureFileUrl);

        // const secureFileUrl =
        //   process.env.NODE_ENV === 'production'
        //     ? link_To_File.replace('http://', 'https://')
        //     : link_To_File;
        // setPdfUrl(link_To_File);
        setIsReactModalOpen(true); // Open the modal
      } else {
        setError('Unable to retrieve the file link.');
        console.log(error);
      }
    } catch (err) {
      // setError(`Error: ${err.message}`);
      console.log(err);
    } finally {
      // setLoading(false);
    }
  };
  /******  d9cdc380-dc99-4384-bd17-bc2ef54bf849  *******/

  // console.log("selection", selection);
  const userTooltips = {
    guest: "Guest",
    host: "Host",
  };

  const renderUserTooltip = (userType) => {
    return (
      <span className="tooltiptext small-tooltip">
        {userTooltips[userType] || "Hover over an icon to see user details."}
      </span>
    );
  };



  const handleHostClick = (hostUserUsername, hostLockerName) => {
    navigate('/view-locker', {
      state: {
        user: { username: hostUserUsername },
        locker: locker,
      },
    });
  };


  const handleGuestClick = () => {
    navigate('/target-locker-view', {
      state: {
        user: { username: guestUserUsername },
        locker: guestLocker
      }
    });
  };

  const handleGuestNameClick = () => {
    navigate('/target-user-view', {
      state: {
        user: { username: guestUserUsername },
      },
    });
  };

  const handleHostNameClick = () => {
    navigate('/home', {
    });

  };


  const handleConnectionClick = () => {
    const lockers = hostLocker
    const connectionTypes = connectionType
    const hostLockerName = connectionDetails?.host_locker?.name;
    console.log("navigate show-guest-users", {
      connectionTypes,
      lockers
    });
    navigate("/show-guest-users", { state: { connection: connectionTypes, locker: lockers, hostLocker: connectionDetails.host_locker, hostLockerName, hostUserUsername: curruser.username } });
  };

  const handleGuestTermsClick = () => {
    navigate("/guest-terms-review", {
      state: {
        connection: connectionDetails,
        connectionType: connectionType,
      },
    })
  }

  const handleCloseConnection = async (connection_id) => {
    const formData = new FormData();
    formData.append("connection_id", connection_id);
    // formData.append("close_host_bool", "True");

    // console.log(connection_id ,"id");
    const token = Cookies.get("authToken");
    try {
      // Step 1: Call close_connection_host API using fetch
      const revokeHostResponse = await fetch(
        "host/close_connection_host/".replace(/host/, frontend_host),
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${token}`,
          },

          body: formData,
        }
      );

      const revokeHostData = await revokeHostResponse.json(); // Parse JSON response

      if (revokeHostResponse.ok) {
       setIsModalOpenClose(false);
        setModalMessage({
          message: 'Successfully Connection closed',
          type: 'success',
        });
        setIsModalOpens(true)
      } else {
        setModalMessage({
          message: revokeHostResponse.message || "Failed to close the connection.",
          type: "failure",
        });
        setIsModalOpens(true)
      }
    } catch (error) {
      console.error("Error:", error);
    }

    // Step 2: Call close API using fetch
  };

  console.log("selection", selection);
  const content = (
    <>
      {/* <div className="navbarBrand">
        {curruser ? capitalizeFirstLetter(curruser.username) : "None"}
      </div>
      <div className="description">
        {curruser ? curruser.description : "None"}
      </div> */}

      {/* <div className="navbarBrands">
        {connectionName}
      </div> */}
      <h5><b>{connectionName || connection?.connection_name}</b> &nbsp;
        <span
          className={`badge ${connectionDetails?.connection_status === "established"
            ? "text-bg-warning"
            : connectionDetails?.connection_status === "live"
              ? "text-bg-success"
              : "text-bg-secondary"
            }`}
        >
          {capitalizeFirstLetter(connectionDetails?.connection_status) || "Loading..."}
        </span>
      </h5>
      {/* <br></br>
      <div className="connection-details">
        Connection Name: {connectionName}
        <button
          className="info-button"
          onClick={() => navigateToConnectionTerms(connectionName)}
          title="Show Connection Terms"
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            background: "transparent",
            border: "none",
          }}
        >
          <i className="fa fa-info-circle" style={{ fontSize: "16px" }}></i>
        </button>
        <button
          //   className="info-button"
          onClick={() => handleConsentAndInfo(connectionName)}
        >
          Revoke Consent
        </button>
        <br></br>
        <>
        <div style={{paddingBottom:"8px"}}>
        {globalTemplateNames.length > 0 && "Connection has been imported from "}
  <span style={{ fontWeight: "bold" }}>
    {globalTemplateNames.filter(Boolean).map((template, index) => (
      <span key={index}>
        <span 
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => handleNavigation(template)}
        >
          {template.global_connection_type_name}
        </span>
        {index < globalTemplateNames.filter(Boolean).length - 1 && ", "}
      </span>

    ))}
     </span></div></>
        {connectionDescription}
        <br></br>
        <div className="tooltip-container user-container">
          <div className="tooltip user-container">
            <FaUserCircle className="userIcon"/> &nbsp;
            <span className="userName">{renderUserTooltip('guest')} : {guestUserUsername} &nbsp;</span>
          </div>
          <i class="fa-solid fa-right-long"></i> &nbsp;
          <div className="tooltip user-container">
            <FaRegUserCircle className="userIcon"/>&nbsp;
            <span className="userName">{renderUserTooltip('host')} : {hostUserUsername}</span>
          </div>
        </div>
        <div className="tooltip-container user-container">
          <div className="tooltip user-container" onClick={() => navigate("/home")} style={{ cursor: 'pointer' }}>
            <i class="bi bi-person-fill-lock"></i> &nbsp;
            <span className="userName">{renderUserTooltip('guest')} : {guestLockerName} &nbsp;</span>
          </div>
          <i class="fa-solid fa-right-long"></i> &nbsp;
          <div className="tooltip user-container" onClick={() => handleuserclick(hostUserUsername)}>
            <i class="bi bi-person-lock"></i>&nbsp;
            <span className="userName">{renderUserTooltip('host')} : {hostLockerName}</span>
          </div>
        </div>
      </div> */}
    </>
  );

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleHostClick()} className="breadcrumb-item">View Locker</span>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleConnectionClick()} className="breadcrumb-item">ShowGuestUsers</span>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleGuestTermsClick()} className="breadcrumb-item">GuestTermsReview</span>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">ViewHostTermsByType</span>

    </div>
  )

  // const tooltips = {
  //   share: "You are not transferring ownership of this resource, but the recipient can view your resource. The recipient cannot do anything else.",
  //   transfer: "You are transferring ownership of this resource. You will no longer have access to this resource after this operation.",
  //   confer: "You are going to transfer ownership of the resource, but the recipient cannot modify the contents. You still have rights over this resource.",
  //   collateral: "You are temporarily transferring ownership to the recipient. After this operation, you cannot change anything in the resource."
  // };

  const tooltips = {
    share: "Resource is accessible, ownership is not transferred",
    transfer: "Resource is accessible and ownership is transferred",
    confer: "Resource is accessible and delegated ownership is established",
    collateral: "Resource is accessible and pledged ownership is established",
  }

  const renderTooltip = (typeOfShare) => {
    return (
      <span className="tooltiptext">
        {tooltips[typeOfShare] || "Select a type of share to view details."}
      </span>
    );
  };


  console.log(termValues, "term values");
  console.log("moreDataTerms", moreDataTerms);

  const renderPermissionsTable = () => {
    if (permissionsData.length > 0) {
      return (
        <div className="permissions-table">
          <h3>User Permissions</h3>
          <table>
            <thead>
              <tr>
                <th>Sno</th>
                <th>Label Name</th>
                <th>Data Element</th>
                <th>Purpose</th>
                <th>Type of Share</th> {/* New column for Type of Share */}
                <th>Status</th> {/* New column for status dropdown */}
              </tr>
            </thead>
            <tbody>

            </tbody>
          </table>
        </div>
      );
    } else {
      return;
    }
  };

  const handleuserclick = (hostUserUsername) => {
    console.log(hostUserUsername);
    navigate(`/target-user-view`, { state: { user: { username: hostUserUsername } } });
  }


  const handleSubmitPostConditions = async () => {
    if (!pdfData?.id) {
      console.log("Missing xnode_id");
      return;
    }

    const payload = {
      xnode_id: pdfData.id,
      post_conditions: editablePostConditions,
      new_validity: editableValidityUntil,
      remarks: remarks,
    };

    console.log("Sending PATCH request with:", payload);

    try {
      const token = Cookies.get("authToken");
      const response = await fetch(`host/consent-artefact-view-edit/`.replace(
        /host/,
        frontend_host
      ), {
        method: "PATCH",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Updated successfully!");
        closeOpenPopup();
      } else {
        alert(data.message || "Failed");
      }
    } catch (err) {
      console.error("API error:", err);
    }
  };

  const handleclickcreator = (user) => {
    if (curruser && curruser.username && user.username === curruser.username) {
      navigate('/home');
    } else {
      navigate(`/target-user-view`, { state: { user } });
    }
  };

  const getStatusClass = (status) => {
  switch (status) {
    case "Approved":
      return "text-success"; // Green color
    case "Rejected":
      return "text-danger"; // Red color
    case "Pending":
      return "text-warning"; // Yellow/Orange color
    default:
      return "";
  }
};

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
      {/* <Navbar content={content} breadcrumbs={breadcrumbs} /> */}

      {/* <div className={showResources || showResources2 ? "split-view" : ""}>
        <div className="table-container">
          
          <div className="center">
          {globalTemplateNames.length > 0 && "Regulations used: "}
            <span style={{ fontWeight: "bold" }}>
              {globalTemplateNames.filter(Boolean).map((template, index) => (
                <span key={index}>
                  <span 
          style={{ cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => handleNavigation(template)}
        >
          {template.global_connection_type_name}
        </span>
                  {index < globalTemplateNames.filter(Boolean).length - 1 &&
                    ", "}
                </span>
              ))}
            </span>
          </div>
          
          <h3>Your Obligations</h3> */}


      <div style={{ marginTop: "12px" }}>
        <div className="connection-details">
          <b>Connection Name:</b> {connectionName}
          <button
            className="info-button"
            onClick={() => navigateToConnectionTerms(connectionName)}
            title="Show Connection Terms"
            style={{
              marginLeft: "10px",
              cursor: "pointer",
              background: "transparent",
              border: "none",
            }}
          >
            <i className="fa fa-info-circle" style={{ fontSize: "16px" }}></i>
          </button>
          <button
            //   className="info-button"
            data-tooltip-id="tooltip" data-tooltip-content="View connection terms & Manage consent"
            onClick={() => handleConsentAndInfo(connectionName)}
          >
            Manage Consent
          </button>
          <Tooltip id="tooltip" place="bottom" style={{ maxWidth: '200px', whiteSpace: 'normal', fontSize: "14px" }} />

          <br></br>
          <>
            <div style={{ paddingBottom: "8px" }}>
              {globalTemplateNames.length > 0 && "Connection has been imported from "}
              <span style={{ fontWeight: "bold" }}>
                {globalTemplateNames.filter(Boolean).map((template, index) => (
                  <span key={index}>
                    <span
                      style={{ cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => handleNavigation(template)}
                    >
                      {template.global_connection_type_name}
                    </span>
                    {index < globalTemplateNames.filter(Boolean).length - 1 && ", "}
                  </span>

                ))}
              </span></div></>
          {connectionDescription}
          <br></br>
          <Grid container>
            <Grid item xs={12} md={10}>
              <div className="tooltip-container user-container">
                <div className="tooltips user-container" onClick={() => handleGuestNameClick()}>
                  {/* <FaUserCircle className="userIcon" /> &nbsp; */}
                  <i className="guestuser-icon" /> &nbsp;
                  <span className="userName"> : {capitalizeFirstLetter(guestUserUsername)} &nbsp;</span>
                </div>
                <i class="fa-solid fa-right-long mt-1"></i> &nbsp;
                <div className="tooltips user-container" onClick={() => handleHostNameClick()}>
                  {/* <FaRegUserCircle className="userIcon" />&nbsp; */}
                  <i className="hostuser-icon" /> &nbsp;
                  <span className="userName"> : {capitalizeFirstLetter(hostUserUsername)}</span>
                </div>
              </div>
              <div className="tooltip-container user-container">
                <div className="tooltips user-container" onClick={() => handleGuestClick(locker)} style={{ cursor: 'pointer' }}>
                  {/* <i class="bi bi-person-fill-lock"></i> &nbsp; */}
                  <i className="guestLocker-icon" />
                  <span className="userName"> : {guestLockerName} &nbsp;</span>
                </div>
                <i class="fa-solid fa-right-long mt-1"></i> &nbsp;
                <div className="tooltips user-container" onClick={() => handleHostClick(hostUserUsername, hostLockerName)}>
                  {/* <i class="bi bi-person-lock"></i>&nbsp; */}
                  <i className="hostLocker-icon" />
                  <span className="userName"> : {hostLockerName}</span>
                </div>
              </div>
            </Grid>
            <Grid item xs={12} md={1.5}>
              {connection && (() => {
                const tracker = trackerData[connection.connection_id];
                const color = tracker ? getStatusColor(tracker) : "gray";
                const ratio = tracker ? calculateRatio(tracker) : "Loading...";

                const trackerReverse = trackerDataReverse[connection.connection_id];
                const colorReverse = trackerReverse ? getStatusColorReverse(trackerReverse) : "gray";
                const ratioReverse = trackerReverse ? calculateRatioReverse(trackerReverse) : "Loading...";

                return (
                  <Grid container key={connection.connection_id}>

                    <Grid item xs={12} style={{ paddingTop: "10px" }}>
                      <div className="d-flex align-items-center">
                        <h6 className="mt-2 me-2">
                          {capitalizeFirstLetter(connection.guest_user.username)}
                        </h6>
                        <i className="bi bi-arrow-right me-2" style={{ fontSize: "1.2rem" }}></i>
                        <button
                          // onClick={() => handleTracker(connection)}
                          style={{
                            backgroundColor: color,
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "5px",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          {ratio}
                        </button>
                      </div>

                      <div className="d-flex align-items-center mt-1">
                        <button
                          className="me-2"
                          // onClick={() => handleTrackerHost(connection)}
                          style={{
                            backgroundColor: colorReverse,
                            border: "none",
                            padding: "5px 10px",
                            borderRadius: "5px",
                            color: "#fff",
                            cursor: "pointer",
                          }}
                        >
                          {ratioReverse}
                        </button>
                        <i className="bi bi-arrow-left me-2" style={{ fontSize: "1.2rem" }}></i>
                        <h6 className="mt-2">{capitalizeFirstLetter(connection.host_user.username)}</h6>
                      </div>
                    </Grid>
                  </Grid>
                );
              })()}
            </Grid>
          </Grid>
        </div>
        <div className="view-container">
          <div className="b">
            <div className="tabs">
              <div
                className={`tab-header ${activeTab === "guest" ? "active" : ""
                  }`}
                onClick={() => navigate("/guest-terms-review", {
                  state: {
                    connection: connectionDetails,
                    connectionType: connectionType,
                  },
                })}
              >
                Guest Data
              </div>
              <div
                className={`tab-header ${activeTab === "host" ? "active" : ""
                  }`}
                onClick={() => setActiveTab("host")}
              >
                Shared by me
              </div>
            </div>
            <div className="tab-content">
              {activeTab === "host" && (
                <div>

                  <div className={showResources || showResources2 ? "split-view" : ""}>
                    <div className="table-container">

                      <div className="center">
                        {globalTemplateNames.length > 0 && "Regulations used: "}
                        <span style={{ fontWeight: "bold" }}>
                          {globalTemplateNames.filter(Boolean).map((template, index) => (
                            <span key={index}>
                              <span
                                style={{ cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={() => handleNavigation(template)}
                              >
                                {template.global_connection_type_name}
                              </span>
                              {index < globalTemplateNames.filter(Boolean).length - 1 &&
                                ", "}
                            </span>
                          ))}
                        </span>
                      </div>

                      <h3>Host Obligations</h3>

                      <table>
                        <thead>
                          <tr>
                            <th>Sno</th>
                            <th>Name</th>
                            <th>purpose</th>
                            <th>Type of share</th>
                            <th>Enter Data</th>
                            {/* <th>Host Privileges</th> */}
                            <th>Consent Artefact</th>
                            <th>Status</th> {/* New column for Status */}
                          </tr>
                        </thead>
                        <tbody>
                          {hostToGuestObligations.map((obligation, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{obligation.labelName}</td>
                              <td>{obligation.purpose}</td>
                              <td>
                                <div className="tooltips">
                                  {obligation.typeOfSharing}
                                  {renderTooltip(obligation.typeOfSharing)}
                                </div>
                              </td>
                              <td>{renderInputField(obligation)}</td>
                              {/* <td>
                                {obligation.hostPermissions
                                  ? obligation.hostPermissions.join(", ")
                                  : "None"}
                              </td> */}

                              <td> <button onClick={() => openPopup(obligation)}>View</button></td>
                              <td className={getStatusClass(statuses[obligation.labelName])}>{statuses[obligation.labelName] || "Pending"}</td>{" "}
                              {/* Display status */}
                              {/* <td>{obligation.labelDescription}</td> */}
                            </tr>
                          ))}
                        </tbody>

                      </table>
                    </div>
                    <div style={{ margin: "10px 0" }}>
                      <div>
                        {
                          <button style={{ marginLeft: "10px" }} onClick={handleSubmit}>
                            Submit
                          </button>
                        }
                      </div>
                    </div>
                    <div>
                      {showResources && (
                        <div className="resource-container">
                          <h3>Select Resource for {currentLabelName}</h3>
                          {/* {error && <p className="error">{error}</p>} */}
                          {xnodes.length > 0 ? (
                            <ul>
                              {xnodes.map((resource, index) => {
                                const isResourceInFiltered = filteredXnodes.some((item) => item.id === resource.id);

                                return (
                                  <li key={index}>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <label id={
                                        resource.xnode_Type === "INODE"
                                          ? "documents"
                                          : resource.xnode_Type === "SNODE"
                                            ? "documents-byConfer"
                                            : "documents-byShare"
                                      }
                                      // className={typeofShare !== "share" && !isResourceInFiltered ? "disabled-label" : ""}
                                      >
                                        <input
                                          type="radio"
                                          name="selectedResource"
                                          value={resource.resource_name}
                                          checked={selection[currentLabelName]?.id === resource.id}
                                          onClick={() => handleResourceSelection(resource)}
                                        // disabled={typeofShare !== "share" && !isResourceInFiltered}
                                        />
                                        {resource.resource_name}

                                      </label>
                                      <button
                                        id="view"
                                        className="subbutton"
                                        style={{ textDecoration: "none" }}
                                        onClick={() => handleClick(resource.id)}
                                      >
                                        View
                                      </button>
                                    </div>
                                  </li>
                                );
                              })}

                            </ul>
                          ) : (
                            <p>No resource found.</p>
                          )}
                          <div className="button-group">
                            <button className="btn-color" onClick={handlePageSubmit}>Submit</button>
                            <button className="btn-color" onClick={() => {
                              setShowResources(false);
                              setExtractedId(null);
                            }}>Cancel</button>
                          </div>
                        </div>
                      )}

                      {showResources2 && (
                        <div className="resource-container">
                          <h3>Select Resource for {currentLabelName}</h3>
                          {/* {error && <p className="error">{error}</p>} */}
                          {xnodes.length > 0 ? (
                            <ul>
                              {xnodes.map((resource, index) => (
                                <li key={index}>
                                  <div style={{ display: "flex", alignItems: "center" }}>
                                    <label id={
                                      resource.xnode_Type === "INODE"
                                        ? "documents"
                                        : resource.xnode_Type === "SNODE"
                                          ? "documents-byConfer"
                                          : "documents-byShare"
                                    }>
                                      <input
                                        type="radio"
                                        name="selectedResource"
                                        value={resource.resource_name} //i changed here
                                        checked={
                                          selection2[currentLabelName]
                                            ?.id === resource.id
                                        }
                                        onClick={() => handleResourceSelection2(resource)}
                                      />
                                      {resource.resource_name}
                                    </label>
                                    <button button id="view" className="subbutton" style={{ textDecoration: "none" }} onClick={() => handleClick(resource.id)}>View</button>


                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p>No resource found</p>
                          )}
                          <div className="button-group">
                            <button className="btn-color" onClick={handlePageSubmit2}>Submit</button>
                            <button className="btn-color" onClick={() => {
                              setShowResources2(false);
                              setExtractedId(null);
                            }}>Cancel</button>
                          </div>
                        </div>
                      )}

                    </div>

                  </div>
                  <div>
                  </div>
                  <div>
                    {/* </div>
                
            </div>
            <div>
                </div>
              <div>
            {permissions?.canShareMoreData && (
          <div className="table-container">

            <h3>Share more data</h3>
            <table>
              <thead>
                <tr>
                  <th>Sno</th>
                  <th>Name</th>
                  <th>Purpose</th>
                  <th>Type of Share</th>
                  <th>Value</th>
                  <th>Status</th> 
                </tr>
              </thead>
              <tbody>
                
                {permissionsData.map((permission) => (
                  <tr key={permission.sno}>
                    <td>{permission.sno}</td>
                    <td>{permission.labelName}</td>
                    <td>{permission.purpose || "None"}</td>
                    
                    <td>{permission.action}</td>
                    <td>
                      {permission.dataElement || "None"}
                      
                    </td>
                    <td>Status Active</td> 
                  </tr>
                ))}
                {moreDataTerms.map((term, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        value={term.labelName}
                        onChange={(e) =>
                          updateTerm(index, "labelName", e.target.value)
                        }
                        placeholder="Label Name"
                        required
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={term.purpose}
                        onChange={(e) =>
                          updateTerm(index, "purpose", e.target.value)
                        }
                        placeholder="Purpose"
                        required
                      />
                    </td>
                    <td>
                      <select
                        value={term.typeOfShare}
                        onChange={(e) =>
                          updateTerm(index, "typeOfShare", e.target.value)
                        }
                      >
                        <option value="share">Share</option>
                        <option value="transfer">Transfer</option>
                        <option value="confer">Confer</option>
                        <option value="collateral">Collateral</option>
                      </select>
                    </td>
                    <td>
                      
                    
                      <button onClick={() => handleButtonClick(term.labelName)}>
                        {selectedResources[term.labelName]?.id ||
                          "Upload File"}
                      </button>
                    </td>
                    <td>Pending</td> 
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ margin: "20px 0" }}>
              <div>
                <button style={{ marginRight: "10px" }} onClick={addMoreDataTerm}>
                  Add New Term
                </button>
                <button style={{ marginRight: "10px" }} onClick={() => removeMoreDataTerm(moreDataTerms.length - 1)}>
                  Remove Last Term 
                </button>
                <button onClick={handleMoreSubmit}>Submit</button>
              </div>
                
            {allObligationsApproved() && (
          <div>
            <h3 style={{ textAlign: "left", marginTop: "20px" }}>
              Host Obligations
            </h3>
            <p>You will receive a receipt from the host</p>
          </div>
        )}
        
        {hostObligationMessage && (
          <h3 style={{ textAlign: "center", marginTop: "20px" }}>
            Host Obligation: {hostObligationMessage}
          </h3>
        )}
                
            {isModalOpen && (
              <Modal
                message={modalMessage.message}
                onClose={handleCloseModal}
                type={modalMessage.type}
              />
            )}
  */}


                    {/* {showPageInput && (
          <div className="page-input-modal">
          <div>
            <h3>Enter Page Range for {currentLabelName}</h3>
            {errorMessage && <p className="error">{errorMessage}</p>}
        
            <label>
              From Page:
              <input
                type="number"
                value={fromPage}
                onChange={(e) => setFromPage(e.target.value)}
                min="1"
              />
            </label>
            <br></br>
        
            <label>
              To Page:
              <input
                type="number"
                value={toPage}
                onChange={(e) => setToPage(e.target.value)}
                min="1"
              />
            </label>
        
            

          </div>v
          <div className="button-group">
            <button onClick={handlePageSubmit}>Submit</button>
            <button onClick={() =>{
            setShowPageInput(false);
            setErrorMessage(null);
            setFromPage('');
            setToPage('');
          }}>Cancel</button>
          </div>
        <div> */}
                    {connectionDetails?.connection_status === "live" && (
                      <div className="table-container">

                        <h3>Share more data</h3>
                        <table>
                          <thead>
                            <tr>
                              <th>Sno</th>
                              <th>Name</th>
                              <th>Purpose</th>
                              <th>Type of Share</th>
                              <th>Enter Data</th>
                              <th>Consent Artefact</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>

                            {permissionsData.map((permission) => (
                              <tr key={permission.sno}>
                                <td>{permission.sno}</td>
                                <td>{permission.labelName}</td>
                                <td>{permission.purpose || "None"}</td>

                                <td>{permission.share}</td>
                                {/* <td>
          {permission.dataElement || "None"}

        </td> */}
                                <td>

                                  <a className="mb-1"
                                    style={{ display: "block", color: "blue", textDecoration: "underline", cursor: "pointer" }}
                                    onClick={() =>
                                      fetchAndOpenResource(
                                        permission.dataElement?.split(";")[0]?.split("|")[1]
                                      )
                                    }>
                                    {permission.dataElement?.split(";")[0]?.split("|")[0] || "None"}
                                  </a>
                                  {/* <button>{permission.dataElement?.split(";")[0]?.split("|")[0] || "None"}</button> */}
                                  {/* Display "None" if empty */}
                                </td>
                                <td><button onClick={() => openPopup1(permission)}>View</button></td>
                                <td className={getStatusClass(statuses2[permission.labelName])}>{statuses2[permission.labelName]}</td>
                              </tr>
                            ))}
                            {moreDataTerms.map((term, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>
                                  <input
                                    type="text"
                                    value={term.labelName}
                                    onChange={(e) =>
                                      updateTerm(index, "labelName", e.target.value)
                                    }
                                    placeholder="Label Name"
                                    required
                                  />
                                </td>
                                <td>
                                  <input
                                    type="text"
                                    value={term.purpose}
                                    onChange={(e) =>
                                      updateTerm(index, "purpose", e.target.value)
                                    }
                                    placeholder="Purpose"
                                    required
                                  />
                                </td>
                                <td>
                                  <select
                                    value={term.typeOfShare}
                                    onChange={(e) =>
                                      updateTerm(index, "typeOfShare", e.target.value)
                                    }
                                    disabled={moreDataTerms[index].enter_value?.split(";")[0]?.split("|")[0]}
                                  >
                                    <option value="share">Share</option>
                                    <option value="transfer">Transfer</option>
                                    <option value="confer">Confer</option>
                                    <option value="collateral">Collateral</option>
                                  </select>
                                </td>
                                <td>


                                  {moreDataTerms[index].enter_value?.split(";")[0]?.split("|")[0] && (
                                    <a className="mb-1"
                                      style={{ display: "block", textDecoration: "underline", cursor: "pointer" }}
                                      onClick={() =>
                                        fetchAndOpenResource(
                                          moreDataTerms[index].enter_value?.split(";")[0]?.split("|")[1]
                                        )
                                      }
                                    >
                                      {moreDataTerms[index].enter_value?.split(";")[0]?.split("|")[0]}
                                    </a>
                                  )}
                                  <button onClick={() => handleButtonClick2(term)}>

                                    Select Resource
                                  </button>
                                </td>
                                <td><button onClick={() => openPopup2(moreDataTerms[index])}>View</button></td>

                                <td>Pending</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ margin: "20px 0" }}>
                          <div>
                            <button style={{ marginRight: "10px" }} onClick={addMoreDataTerm}>
                              Add New Data
                            </button>
                            <button style={{ marginRight: "10px" }} onClick={() => removeMoreDataTerm(moreDataTerms.length - 1)}>
                              Remove Last Data
                            </button>
                            <button onClick={handleMoreSubmit}>Submit</button>
                          </div>

                          {allObligationsApproved() && (
                            <div>
                              <h3 style={{ textAlign: "left", marginTop: "20px" }}>
                                Host Obligations
                              </h3>
                              <p>You will receive a receipt from the host</p>
                            </div>
                          )}

                          {hostObligationMessage && (
                            <h3 style={{ textAlign: "center", marginTop: "20px" }}>
                              Host Obligation: {hostObligationMessage}
                            </h3>
                          )}

                          {isModalOpen && (
                            <Modal
                              message={modalMessage.message}
                              onClose={handleCloseModal}
                              type={modalMessage.type}
                            />
                          )}



                          {/* {showPageInput && (
<div className="page-input-modal">
<div>
<h3>Enter Page Range for {currentLabelName}</h3>
{errorMessage && <p className="error">{errorMessage}</p>}

<label>
From Page:
<input
type="number"
value={fromPage}
onChange={(e) => setFromPage(e.target.value)}
min="1"
/>
</label>
<br></br>

<label>
To Page:
<input
type="number"
value={toPage}
onChange={(e) => setToPage(e.target.value)}
min="1"
/>
</label>



</div>v
<div className="button-group">
<button onClick={handlePageSubmit}>Submit</button>
<button onClick={() =>{
setShowPageInput(false);
setErrorMessage(null);
setFromPage('');
setToPage('');
}}>Cancel</button>
</div>
<div> */}
                          {showPageInput && (
                            <div className="page-input-modal">
                              <div>
                                <h5 style={{ fontWeight: "bold" }}>Enter Page Range for {currentLabelName}</h5>
                                {errorMessage && <p className="error">{errorMessage}</p>}

                                <label>
                                  From Page:
                                  <input
                                    type="number"
                                    value={fromPage}
                                    onChange={(e) => setFromPage(e.target.value)}
                                    min="1"
                                    disabled={isCompletePages} // Disable if "Complete Pages" is selected
                                  />
                                </label>

                                <label>
                                  To Page:
                                  <input
                                    type="number"
                                    value={toPage}
                                    onChange={(e) => setToPage(e.target.value)}
                                    min="1"
                                    disabled={isCompletePages} // Disable if "Complete Pages" is selected
                                  />
                                </label>

                                <p className="or-text">OR</p>

                                <label>
                                  Select All Pages &nbsp; &nbsp;
                                </label>
                                <input
                                  className="checkboxEntire"
                                  type="checkbox"
                                  checked={isCompletePages}
                                  onChange={handleCompletePagesChange}
                                />


                              </div>
                              <div className="button-group">
                                <button onClick={handlePageSubmit}>Submit</button>
                                <button onClick={() => {
                                  setShowPageInput(false);
                                  setErrorMessage(null);
                                  setFromPage('');
                                  setToPage('');
                                  setIsCompletePages(false)
                                }}>Cancel</button>
                              </div>
                            </div>
                          )}

                          {showPageInput2 && (
                            <div className="page-input-modal">
                              <div>
                                <h3>Enter Page Range for {currentLabelName}</h3>
                                {errorMessage && <p className="error">{errorMessage}</p>}

                                <label>
                                  From Page:
                                  <input
                                    type="number"
                                    value={fromPage}
                                    onChange={(e) => setFromPage(e.target.value)}
                                    min="1"
                                  />
                                </label>

                                <label>
                                  To Page:
                                  <input
                                    type="number"
                                    value={toPage}
                                    onChange={(e) => setToPage(e.target.value)}
                                    min="1"
                                  />
                                </label>


                              </div>
                              <div className="button-group">
                                <button onClick={handlePageSubmit2}>Submit</button>
                                <button onClick={() => {
                                  setShowPageInput2(false);
                                  setErrorMessage(null);
                                  setFromPage('');
                                  setToPage('');
                                }}>Cancel</button>
                              </div>
                            </div>
                          )}


                        </div>
                      </div>
                    )}
                    {showPageInput && (
                      <div className="page-input-modal">
                        <div>
                          <h5 style={{ fontWeight: "bold" }}>Enter Page Range for {currentLabelName}</h5>
                          {errorMessage && <p className="error">{errorMessage}</p>}

                          <label>
                            From Page:
                            <input
                              type="number"
                              value={fromPage}
                              onChange={(e) => setFromPage(e.target.value)}
                              min="1"
                              disabled={isCompletePages} // Disable if "Complete Pages" is selected
                            />
                          </label>

                          <label>
                            To Page:
                            <input
                              type="number"
                              value={toPage}
                              onChange={(e) => setToPage(e.target.value)}
                              min="1"
                              disabled={isCompletePages} // Disable if "Complete Pages" is selected
                            />
                          </label>

                          <p className="or-text">OR</p>

                          <label>
                            Select All Pages &nbsp; &nbsp;
                          </label>
                          <input
                            className="checkboxEntire"
                            type="checkbox"
                            checked={isCompletePages}
                            onChange={handleCompletePagesChange}
                          />


                        </div>
                        <div className="button-group">
                          <button onClick={handlePageSubmit}>Submit</button>
                          <button onClick={() => {
                            setShowPageInput(false);
                            setErrorMessage(null);
                            setFromPage('');
                            setToPage('');
                            setIsCompletePages(false)
                          }}>Cancel</button>
                        </div>
                      </div>
                    )}

                    {showPageInput2 && (
                      <div className="page-input-modal">
                        <div>
                          <h3>Enter Page Range for {currentLabelName}</h3>
                          {errorMessage && <p className="error">{errorMessage}</p>}

                          <label>
                            From Page:
                            <input
                              type="number"
                              value={fromPage}
                              onChange={(e) => setFromPage(e.target.value)}
                              min="1"
                            />
                          </label>

                          <label>
                            To Page:
                            <input
                              type="number"
                              value={toPage}
                              onChange={(e) => setToPage(e.target.value)}
                              min="1"
                            />
                          </label>


                        </div>
                        <div className="button-group">
                          <button onClick={handlePageSubmit2}>Submit</button>
                          <button onClick={() => {
                            setShowPageInput2(false);
                            setErrorMessage(null);
                            setFromPage('');
                            setToPage('');
                          }}>Cancel</button>
                        </div>
                      </div>
                    )}


                  </div>
                </div>
              )}
              {showRevokeConsentModal && (
                <Modal
                  message="Are you sure you want to revoke consent?"
                  type="confirmation"
                  onClose={() => setShowRevokeConsentModal(false)} // Close modal on "No"
                  onConfirm={handleRevokeConsentConfirm} // Execute revoke consent action
                />
              )}
              {postModal && (
                <Modal
                  message={modalMessage.message}
                  onClose={handleCloseModal}
                  type={modalMessage.type}
                />
              )}
              {resourceModal && (
                <Modal
                  message={modalMessage.message}
                  onClose={handleCloseResourceModal}
                  type={modalMessage.type}
                />
              )}
              {showOpenPopup && selectedRowData && pdfData && (
                !selectedRowData.value.endsWith("T") ? (
                  <div className="edit-modal" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
                    <div className="modal-content" style={{ border: "2px solid blue" }}>
                      <div
                        className="subset-title"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                          marginTop: "10px",
                          fontSize: "1.5rem",
                          fontWeight: "bold"
                        }}
                      >
                        Consent Artefact
                        {pdfData?.xnode_Type !== "VNODE" && (
                          <>
                            {pdfData?.current_owner_username === pdfData?.primary_owner_username ? (
                              <i className="bi bi-unlock-fill"></i>
                            ) : (
                              <i className="bi bi-lock-fill"></i>
                            )}
                          </>
                        )}
                      </div>
                      {termValues[selectedRowData.labelName]?.split(";")[0] ? (
                        <div>
                          <label className="form-label fw-bold mt-1">File:{" "}</label>
                          <span> {termValues[selectedRowData.labelName]?.split(";")[0]?.split("|")[0]}</span>
                          {pdfData ? (
                            <div>
                              <div>
                                <label className="form-label fw-bold mt-1">Created on:{" "}</label>
                                <span> {new Date(pdfData.created_at).toLocaleString()}</span>
                              </div>
                              {/* <div>
                                <label className="form-label fw-bold mt-1">Valid until:{" "}</label>
                                {new Date(pdfData.validity_until).toLocaleString()}
                              </div> */}
                              <div>
                                <label className="form-label fw-bold mt-1">Creator: {" "}</label>
                                <span> {capitalizeFirstLetter(pdfData.creator_username) || "N/A"}</span>
                              </div>
                              {/* <div>
                                <label className="form-label fw-bold mt-1">Current owner: {" "}</label>
                                {capitalizeFirstLetter(pdfData.current_owner_username) || "N/A"}
                              </div> */}
                              <div>
                                <label className="form-label fw-bold mt-1">Type of Share: </label>
                                <span className="tooltips">
                                  {selectedRowData.typeOfSharing}
                                  {renderTooltip(selectedRowData.typeOfSharing)}
                                </span>
                              </div>
                              <div>
                                <label className="form-label fw-bold mt-1">Valid until:{" "}</label>
                                <input
                                  type="date"
                                  className="form-control"
                                  value={editableValidityUntil}
                                  onChange={(e) => setEditableValidityUntil(e.target.value)}
                                  min={new Date().toISOString().slice(0, 10)}
                                />
                              </div>
                              <div>
                                <label className="form-label fw-bold mt-1">Remarks:{" "}</label>
                                <input
                                  required
                                  type="text"
                                  className="form-control"
                                  value={remarks}
                                  onChange={(e) => setRemarks(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="form-label fw-bold mt-1">Post Conditions:</label>
                              </div>
                              {Object.keys(postConditionsKeys).length > 0 ? (
                                <ul style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "20px", listStyleType: "none", padding: 0 }}>
                                  {Object.entries(editablePostConditions).map(([key, value]) => (
                                    <li key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={key}
                                        // name={key}
                                        checked={value}
                                        disabled={
                                          pdfData?.creator !== pdfData?.node_information?.current_owner &&
                                          isLockedPostConditions?.[key] === true
                                        }
                                        onChange={(e) =>
                                          setEditablePostConditions((prev) => ({
                                            ...prev,
                                            [key]: e.target.checked,
                                          }))
                                        }
                                      />
                                      <label className="form-check-label" htmlFor={key}>
                                        {key.charAt(0).toUpperCase() + key.slice(1)}
                                      </label>
                                    </li>
                                  ))}

                                </ul>
                              ) : (
                                <p>No conditions found</p>
                              )}
                              <div className="modal-buttons mt-4">
                                <button type="button" onClick={handleSubmitPostConditions}>Submit</button>
                                <button onClick={() => closeOpenPopup()}>Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <p>Loading...</p>
                          )}
                        </div>
                      ) : (
                        "None"
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="edit-modal" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
                    <div className="modal-content">
                      {/* Close Button */}
                      <div className="close-detail">
                        <button
                          type="button"
                          className="position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center border-0 bg-transparent"
                          onClick={() => closeOpenPopup()}
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
                          marginTop: "10px",
                          fontSize: "1.5rem",
                          fontWeight: "bold"
                        }}
                      >
                        Consent Artefact
                        {pdfData?.xnode_Type !== "VNODE" && (
                          <>
                            {pdfData?.current_owner_username === pdfData?.primary_owner_username ? (
                              <i className="bi bi-unlock-fill"></i>
                            ) : (
                              <i className="bi bi-lock-fill"></i>
                            )}
                          </>
                        )}
                      </div>

                      <div className="card p-3 shadow-lg border-0">
                        {termValues[selectedRowData.labelName]?.split(";")[0] ? (
                          <>
                            <div className="d-flex justify-content-between border-bottom pb-2">
                              <span className="fw-bold">File Name:</span>
                              <span> {termValues[selectedRowData.labelName]?.split(";")[0]?.split("|")[0]}</span>
                            </div>
                            {pdfData ? (
                              <>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Created on:</span>
                                  <span>{new Date(pdfData.created_at).toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Validity until:</span>
                                  <span>{new Date(pdfData.validity_until).toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Creator:</span>
                                  <span style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }} onClick={() => handleclickcreator(pdfData.creator_details)}>{capitalizeFirstLetter(pdfData.creator_username) || "N/A"}</span>
                                </div>
                                {/* <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Current owner:</span>
                                  <span>{capitalizeFirstLetter(pdfData.current_owner_username) || "N/A"}</span>
                                </div> */}
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Type of Share:</span>
                                  <span className="tooltips">{selectedRowData.typeOfSharing}{renderTooltip(selectedRowData.typeOfSharing)}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Remarks:</span>
                                  <span>{pdfData.node_information?.remarks}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2 align-items-center">
                                  <span className="fw-bold">Post Conditions:</span>
                                  <span className=" text-end">
                                    {postConditionsKeysView.length > 0 ? postConditionsKeysView.join(", ") : "No conditions found"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <p>Loading...</p>
                            )}
                          </>
                        ) : (
                          "None"
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
              {showOpenPopup && selectedRowData1 && pdfData && (
                !selectedRowData1.dataElement.endsWith("T") ? (
                  <div className="edit-modal" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
                    <div className="modal-content" style={{ border: "2px solid blue" }}>
                      {/* <span className="close" onClick={closeOpenPopup}>
                                      &times;
                                    </span> */}
                      <div
                        className="subset-title"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                          marginTop: "10px",
                          fontSize: "1.5rem",
                          fontWeight: "bold"
                        }}
                      >
                        Consent Artefact
                        {pdfData?.xnode_Type !== "VNODE" && (
                          <>
                            {pdfData?.current_owner_username === pdfData?.primary_owner_username ? (
                              <i className="bi bi-unlock-fill"></i>
                            ) : (
                              <i className="bi bi-lock-fill"></i>
                            )}
                          </>
                        )}
                      </div>
                      <>
                        {selectedRowData1.dataElement ? (
                          <div>
                            <label className="form-label fw-bold mt-1">File:{" "}</label>
                            {/* {termValues[selectedRowData.labelName]?.split(";")[0]?.split("|")[0]} */}
                            <span> {selectedRowData1.dataElement.split("|")[0]}</span>
                            {pdfData ? (
                              <div>

                                <div>
                                  <label className="form-label fw-bold mt-1">Created on:{" "}</label>
                                  <span> {new Date(pdfData.created_at).toLocaleString()}</span>

                                </div>
                                {/* <div>
                                  <label className="form-label fw-bold mt-1">Valid until:{" "}</label>
                                  {new Date(pdfData.validity_until).toLocaleString()}
                                </div> */}
                                <div>
                                  <label className="form-label fw-bold mt-1">Creator: {" "}</label>
                                  <span> {capitalizeFirstLetter(pdfData.creator_username) || "N/A"}</span>
                                </div>

                                {/* <div>
                                  <label className="form-label fw-bold mt-1">Current owner: {" "}</label>
                                  {capitalizeFirstLetter(pdfData.current_owner_username) || "N/A"}

                                </div> */}
                                <div>
                                  <label className="form-label fw-bold mt-1">Type of Share: </label>
                                  <span className="tooltips">
                                    {selectedRowData1.share}
                                    {renderTooltip(selectedRowData1.share)}
                                  </span>

                                </div>
                                <div>
                                  <label className="form-label fw-bold mt-1">Valid until:{" "}</label>
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={editableValidityUntil}
                                    onChange={(e) => setEditableValidityUntil(e.target.value)}
                                    min={new Date().toISOString().slice(0, 10)}
                                  />
                                </div>
                                <div>
                                  <label className="form-label fw-bold mt-1">Remarks:{" "}</label>
                                  <input
                                    required
                                    type="text"
                                    className="form-control"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="form-label fw-bold mt-1">Post Conditions:</label></div>
                                {Object.keys(postConditionsKeys).length > 0 ? (
                                  <ul
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(3, auto)", // Three columns
                                      gap: "20px",
                                      listStyleType: "none",
                                      padding: 0,
                                    }}
                                  >
                                    {Object.entries(editablePostConditions).map(([key, value]) => (
                                      <li key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={key}
                                          // name={key}
                                          checked={value}
                                          disabled={
                                            pdfData?.creator !== pdfData?.node_information?.current_owner &&
                                            isLockedPostConditions?.[key] === true
                                          }
                                          onChange={(e) =>
                                            setEditablePostConditions((prev) => ({
                                              ...prev,
                                              [key]: e.target.checked,
                                            }))
                                          }
                                        />
                                        <label className="form-check-label" htmlFor={key}>
                                          {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </label>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>No conditions found</p>
                                )}
                                <div className="modal-buttons mt-4">
                                  <button
                                    type="button" onClick={handleSubmitPostConditions}
                                  >
                                    Submit
                                  </button>
                                  <button onClick={() => closeOpenPopup()}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <p>Loading...</p>
                            )}
                          </div>
                        ) : (
                          "None"
                        )}
                      </>
                      {/* <p>
                                      Host Privileges:{" "}
                                      {selectedRowData.hostPermissions && selectedRowData.hostPermissions.length > 0 ? (
                                        selectedRowData.hostPermissions.map((permission, index) => (
                                          <li key={index}>Can {permission}</li>
                                        ))
                                      ) : (
                                        "None"
                                      )}
                                    </p> */}
                    </div>
                  </div>
                ) : (
                  <div className="edit-modal" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
                    <div className="modal-content">
                      {/* Close Button */}
                      <div className="close-detail">
                        <button
                          type="button"
                          className="position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center border-0 bg-transparent"
                          onClick={() => closeOpenPopup()}
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
                          marginTop: "10px",
                          fontSize: "1.5rem",
                          fontWeight: "bold"
                        }}
                      >
                        Consent Artefact
                        {pdfData?.xnode_Type !== "VNODE" && (
                          <>
                            {pdfData?.current_owner_username === pdfData?.primary_owner_username ? (
                              <i className="bi bi-unlock-fill"></i>
                            ) : (
                              <i className="bi bi-lock-fill"></i>
                            )}
                          </>
                        )}
                      </div>

                      <div className="card p-3 shadow-lg border-0">
                        {selectedRowData1.dataElement ? (
                          <>
                            <div className="d-flex justify-content-between border-bottom pb-2">
                              <span className="fw-bold">File Name:</span>
                              <span> {selectedRowData1.dataElement?.split(";")[0]?.split("|")[0]}</span>
                            </div>
                            {pdfData ? (
                              <>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Created on:</span>
                                  <span>{new Date(pdfData.created_at).toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Validity until:</span>
                                  <span>{new Date(pdfData.validity_until).toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Creator:</span>
                                  <span style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }} onClick={() => handleclickcreator(pdfData.creator_details)}>{capitalizeFirstLetter(pdfData.creator_username) || "N/A"}</span>
                                </div>
                                {/* <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Current owner:</span>
                                  <span>{capitalizeFirstLetter(pdfData.current_owner_username) || "N/A"}</span>
                                </div> */}
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Type of Share:</span>
                                  <span className="tooltips">{selectedRowData1.share} {renderTooltip(selectedRowData1.share)} </span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Remarks:</span>
                                  <span>{pdfData.node_information?.remarks}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2 align-items-center">
                                  <span className="fw-bold">Post Conditions:</span>
                                  <span className=" text-end">
                                    {postConditionsKeysView.length > 0 ? postConditionsKeysView.join(", ") : "No conditions found"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <p>Loading...</p>
                            )}
                          </>
                        ) : (
                          "None"
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
              {showOpenPopup && selectedRowData2 && pdfData && (
                !selectedRowData2.enter_value?.endsWith("T") ? (
                  <div className="edit-modal" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
                    <div className="modal-content" style={{ border: "2px solid blue" }}>
                      {/* <span className="close" onClick={closeOpenPopup}>
                                    &times;
                                  </span> */}
                      <div
                        className="subset-title"
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "15px",
                          marginBottom: "15px",
                          marginTop: "10px",
                          fontSize: "1.5rem",
                          fontWeight: "bold"
                        }}
                      >
                        Consent Artefact
                        {pdfData?.xnode_Type !== "VNODE" && (
                          <>
                            {pdfData?.current_owner_username === pdfData?.primary_owner_username ? (
                              <i className="bi bi-unlock-fill"></i>
                            ) : (
                              <i className="bi bi-lock-fill"></i>
                            )}
                          </>
                        )}
                      </div>
                      <>
                        {selectedRowData2.enter_value ? (
                          <div>
                            <label className="form-label fw-bold mt-1">File:{" "}</label>
                            {/* {termValues[selectedRowData.labelName]?.split(";")[0]?.split("|")[0]} */}
                            <span> {selectedRowData2.enter_value.split(";")[0].split("|")[0]}</span>
                            {pdfData ? (
                              <div>

                                <div>
                                  <label className="form-label fw-bold mt-1">Created on:{" "}</label>
                                  <span> {new Date(pdfData.created_at).toLocaleString()}</span>

                                </div>
                                {/* <div>
                                  <label className="form-label fw-bold mt-1">Valid until:{" "}</label>
                                  {new Date(pdfData.validity_until).toLocaleString()}
                                </div> */}
                                <div>
                                  <label className="form-label fw-bold mt-1">Creator: {" "}</label>
                                  <span> {capitalizeFirstLetter(pdfData.creator_username) || "N/A"}</span>
                                </div>

                                {/* <div>
                                  <label className="form-label fw-bold mt-1">Current owner: {" "}</label>
                                  {capitalizeFirstLetter(pdfData.current_owner_username) || "N/A"}

                                </div> */}
                                <div>
                                  <label className="form-label fw-bold mt-1">Type of Share: </label>
                                  <span className="tooltips">
                                    {selectedRowData2.typeOfShare || selectedRowData2.typeOfSharing}
                                    {renderTooltip(selectedRowData2.typeOfShare || selectedRowData2.typeOfSharing)}
                                  </span>

                                </div>
                                <div>
                                  <label className="form-label fw-bold mt-1">Valid until:{" "}</label>
                                  <input
                                    type="date"
                                    className="form-control"
                                    value={editableValidityUntil}
                                    onChange={(e) => setEditableValidityUntil(e.target.value)}
                                    min={new Date().toISOString().slice(0, 10)}
                                  />
                                </div>
                                <div>
                                  <label className="form-label fw-bold mt-1">Remarks:{" "}</label>
                                  <input
                                    required
                                    type="text"
                                    className="form-control"
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="form-label fw-bold mt-1">Post Conditions:</label></div>
                                {Object.keys(postConditionsKeys).length > 0 ? (
                                  <ul
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns: "repeat(3, auto)", // Three columns
                                      gap: "20px",
                                      listStyleType: "none",
                                      padding: 0,
                                    }}
                                  >
                                    {Object.entries(editablePostConditions).map(([key, value]) => (
                                      <li key={key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={key}
                                          // name={key}
                                          checked={value}
                                          disabled={
                                            pdfData?.creator !== pdfData?.node_information?.current_owner &&
                                            isLockedPostConditions?.[key] === true
                                          }
                                          onChange={(e) =>
                                            setEditablePostConditions((prev) => ({
                                              ...prev,
                                              [key]: e.target.checked,
                                            }))
                                          }
                                        />
                                        <label className="form-check-label" htmlFor={key}>
                                          {key.charAt(0).toUpperCase() + key.slice(1)}
                                        </label>
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>No conditions found</p>
                                )}
                                <div className="modal-buttons mt-4">
                                  <button
                                    type="button" onClick={handleSubmitPostConditions}
                                  >
                                    Submit
                                  </button>
                                  <button onClick={() => closeOpenPopup()}>Cancel</button>
                                </div>
                              </div>
                            ) : (
                              <p>Loading...</p>
                            )}
                          </div>
                        ) : (
                          "None"
                        )}
                      </>
                      {/* <p>
                                    Host Privileges:{" "}
                                    {selectedRowData.hostPermissions && selectedRowData.hostPermissions.length > 0 ? (
                                      selectedRowData.hostPermissions.map((permission, index) => (
                                        <li key={index}>Can {permission}</li>
                                      ))
                                    ) : (
                                      "None"
                                    )}
                                  </p> */}
                    </div>
                  </div>
                ) : (
                  <div className="edit-modal" style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}>
                    <div className="modal-content">
                      {/* Close Button */}
                      <div className="close-detail">
                        <button
                          type="button"
                          className="position-absolute top-0 end-0 m-2 d-flex align-items-center justify-content-center border-0 bg-transparent"
                          onClick={() => closeOpenPopup()}
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
                          marginTop: "10px",
                          fontSize: "1.5rem",
                          fontWeight: "bold"
                        }}
                      >
                        Consent Artefact
                        {pdfData?.xnode_Type !== "VNODE" && (
                          <>
                            {pdfData?.current_owner_username === pdfData?.primary_owner_username ? (
                              <i className="bi bi-unlock-fill"></i>
                            ) : (
                              <i className="bi bi-lock-fill"></i>
                            )}
                          </>
                        )}
                      </div>

                      <div className="card p-3 shadow-lg border-0">
                        {selectedRowData2.enter_value ? (
                          <>
                            <div className="d-flex justify-content-between border-bottom pb-2">
                              <span className="fw-bold">File Name:</span>
                              <span> {selectedRowData2.enter_value?.split(";")[0]?.split("|")[0]}</span>
                            </div>
                            {pdfData ? (
                              <>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Created on:</span>
                                  <span>{new Date(pdfData.created_at).toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Validity until:</span>
                                  <span>{new Date(pdfData.validity_until).toLocaleString()}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Creator:</span>
                                  <span style={{ color: "blue", cursor: "pointer", textDecoration: "underline" }} onClick={() => handleclickcreator(pdfData.creator_details)}>{capitalizeFirstLetter(pdfData.creator_username) || "N/A"}</span>
                                </div>
                                {/* <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Current owner:</span>
                                  <span>{capitalizeFirstLetter(pdfData.current_owner_username) || "N/A"}</span>
                                </div> */}
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Type of Share:</span>
                                  <span className="tooltips">{selectedRowData2.typeOfShare || selectedRowData2.typeOfSharing}
                                    {renderTooltip(selectedRowData2.typeOfShare || selectedRowData2.typeOfSharing)}
                                  </span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2">
                                  <span className="fw-bold">Remarks:</span>
                                  <span>{pdfData.node_information?.remarks}</span>
                                </div>
                                <div className="d-flex justify-content-between border-bottom py-2 align-items-center">
                                  <span className="fw-bold">Post Conditions:</span>
                                  <span className=" text-end">
                                    {postConditionsKeysView.length > 0 ? postConditionsKeysView.join(", ") : "No conditions found"}
                                  </span>
                                </div>
                              </>
                            ) : (
                              <p>Loading...</p>
                            )}
                          </>
                        ) : (
                          "None"
                        )}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      {isModalOpens && (
        <Modal
          message={modalMessage.message}
          onClose={handleCloseModal}
          type={modalMessage.type}
        />
      )}

      {isModalOpenClose && (
                    <Modal
                      message={modalMessage.message}
                      onClose={handleCloseModalClose}
                      type={modalMessage.type}
                      closeConnection={closeState}
                      onCloseConnection={() => onCloseButtonClick(connectionDetails.connection_id)}
                      viewTerms={() => navigateToConnectionTerms(connectionName)}
                    />
                  )}

      {isModalOpen && (
        <Modal
          message={modalMessage.message}
          onClose={handleCloseModal}
          type={modalMessage.type}
          revoke={revokeState}
          onRevoke={() => onRevokeButtonClick()}
          viewTerms={() => navigateToConnectionTerms(connectionName)}
        />
      )}
    </div>

  );

};




