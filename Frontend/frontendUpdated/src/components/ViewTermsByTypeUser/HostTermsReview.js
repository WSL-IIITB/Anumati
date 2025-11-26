import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Cookies from "js-cookie";
import "./HostTermsReview.css";
import Navbar from "../Navbar/Navbar";
import Modal from "../Modal/Modal.jsx";
import { frontend_host } from "../../config";
import { FaArrowCircleRight, FaUserCircle, FaRegUserCircle } from 'react-icons/fa';
import { Grid } from '@mui/material'
import ReactModal from "react-modal";
import { Viewer, Worker } from "@react-pdf-viewer/core"; // PDF Viewer
import { TextField } from "@mui/material";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from "../Sidebar/Sidebar.js";

export const HostTermsReview = () => {
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
  const { curruser } = useContext(usercontext);
  const [showResources, setShowResources] = useState(false);
  const [error, setError] = useState(null);
  const [res, setRes] = useState(null);
  const [termsValue, setTermsValue] = useState({});
  const [statuses, setStatuses] = useState({});
  const [resources, setResources] = useState([]);
  const [showTermsPopup, setShowTermsPopup] = useState(false);
  const { connection, connectionType } = location.state || {};
  const [conndetails, setconndetails] = useState([]);
  const [resourcesData, setResourcesData] = useState({
    share: [],
    transfer: [],
    confer: [],
    collateral: [],
  });
  const [permissionsData, setPermissionsData] = useState([]);
  const [terms, setTerms] = useState([]);
  const [globalTemplates, setGlobalTemplates] = useState([]);
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revokeState, setRevokeState] = useState(true);
  const [resourceModal, setResourceModal] = useState(false);
  const [trackerData, setTrackerData] = useState({});
  const [trackerDataReverse, setTrackerDataReverse] = useState({});
  const [xnodeToDownload, setXnodeToDownload] = useState(null);

  const [statuses2, setStatuses2] = useState({});
  const [activeTab, setActiveTab] = useState("host");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [showOpenPopup, setShowOpenPopup] = useState(false);
  const [pdfData, setPdfData] = useState(null)
  const [selectedRowData, setSelectedRowData] = useState(null);
  const [selectedRowData1, setSelectedRowData1] = useState(null);
  const [rejectedStatuses, setRejectedStatuses] = useState({});
  const [showRejectionPopup, setShowRejectionPopup] = useState(false);
  const [rejectionComment, setRejectionComment] = useState("");
  const [isReactModalOpen, setIsReactModalOpen] = useState(false);
  const [isModalOpens, setIsModalOpens] = useState(false);
  const [isModalOpenClose, setIsModalOpenClose] = useState(false);
  const [closeState, setCloseState] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  console.log("pdfData", pdfData)
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
    if (connectionDetails) {
      // const { revoke_guest, revoke_host } = connectionDetails;
      // //   console.log(revoke_host, revoke_guest);
      // if (revoke_guest === true || revoke_host === true) {
      //   setModalMessage({
      //     message:
      //       "The guest has closed the connection, click Revoke to revoke the connection",
      //     type: "info",
      //   });
      //   setIsModalOpen(true);
      // }
      fetchTrackerData(connectionDetails)
      fetchTrackerDataReverse(connectionDetails);
    }
  }, [connectionDetails]);
  //   const [revokeMessage, setRevokeMessage] = useState(""); // To store the response message
  // const [isRevokeModalOpen, setRevokeModalOpen] = useState(false);

  // const RevokeMessageModal = ({ message, onClose }) => (
  //     <div className="modal">
  //         <div className="modal-content">
  //             <h2>Revoke Status</h2>
  //             <p>{message}</p>
  //             <button onClick={onClose}>Close</button>
  //         </div>
  //     </div>
  // );
  console.log("resourcesDatass", rejectedStatuses)
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
          connection_name: connection?.connection_name,
          host_locker_name: connection?.host_locker?.name,
          guest_locker_name: connection?.guest_locker?.name,
          host_user_username: connection?.host_user?.username,
          guest_user_username: connection?.guest_user?.username
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
 useEffect(() => {
    if (connectionDetails) {
      const { close_guest, close_host } = connectionDetails;
      //   console.log(revoke_host, revoke_guest);
      if (close_host === true && close_guest === false) {
        setModalMessage({
          message:
            "The host has closed the connection, click Close connection to close the connection",
          type: "info",
        });
        setIsModalOpenClose(true);
      }
      // fetchTrackerData(connectionDetails)
      // fetchTrackerDataReverse(connectionDetails);
    }
  }, [connectionDetails]);
   useEffect(() => {
    if (connectionDetails) {
      const { close_guest, close_host } = connectionDetails;
      // console.log(revoke_host, revoke_guest);
      if (close_guest === true && close_host === false) {
        setModalMessage({
          message: 'You closed the connection waiting for host to close the connection.',
          type: 'info',
        });
        setIsModalOpens(true);
      }
    }
  }, [connectionDetails]);
  const onRevokeButtonClick = async (connection_id) => {
    setRevokeState(false);
    handleRevoke();
    setIsModalOpen(false);
    // setModalMessage({ message: message, type: "info" });
    // setIsModalOpen(true);
  };

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }

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
      // console.log("Inside fetch terms");
      try {
        const token = Cookies.get("authToken");
        const connectionTypeName = connection?.connection_type_name
        let apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${connection.host_user.username}&host_locker_name=${connection.host_locker.name}`;
        //   console.log("Final API URL:", apiUrl);

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
          setTerms(data.data.obligations); // Update to set data.data instead of data
          // console.log("Terms Response Data:", data.data.obligations);
        } else {
          setError(data.error || "No terms found");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchTerms = async () => {
      try {
        const token = Cookies.get("authToken");
        const response = await fetch(
          `host/show_terms_reverse/?username=${connection.guest_user.username}&locker_name=${connection.guest_locker.name}&connection_name=${connection.connection_name}`.replace(
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
          throw new Error("Failed to fetch terms");
        }
        const data = await response.json();
        if (data.success) {
          setRes(data.terms);
          console.log("show_terms", data);
          console.log("res", data.terms);
          setResources(data.terms.resources || []);

          // Fetch permissions data if canShareMoreData is true
          if (data.terms) {
            await fetchPermissionsData();
          }
        } else {
          setError(data.error || "No terms found");
        }
      } catch (err) {
        setError(err.message);
      }
    };
    const fetchPermissionsData = async () => {
      try {
        const token = Cookies.get("authToken");
        const connectionId = connection.connection_id; // Assume you have a connection ID
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
          throw new Error("Failed to fetch permissions data");
        }
        const data = await response.json();
        if (data.success) {
          // Create an array from the shared_more_data_terms object
          const sharedData = Object.entries(data.shared_more_data_terms_reverse).map(
            ([key, value], index) => ({
              sno: index + 1,
              labelName: key,
              dataElement: value.enter_value,
              purpose: value.purpose,
              share: value.typeOfShare,
              status: value.status,
            })
          );
          setPermissionsData(sharedData);
          console.log(sharedData, "sharedData");
          const initialStatuses2 = {}
          console.log(data.shared_more_data_terms);
          for (const [key, value] of Object.entries(
            data.shared_more_data_terms_reverse
          )) {
            initialStatuses2[key] = value.enter_value.endsWith("T")
              ? "approved"
              : value.enter_value.endsWith("R")
                ? "rejected"
                : "";
          }
          setStatuses2(initialStatuses2);
          console.log("statuses initial", initialStatuses2);
        } else {
          setError(data.error || "No permissions data found");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    const fetchConnectionDetails = async () => {
      console.log("error chck", connection);
      const connectionTypeName = connection?.connection_type_name;

      try {
        const token = Cookies.get("authToken");
        const response = await fetch(
          `host/get-connection-details?connection_type_name=${connectionTypeName}&host_locker_name=${connection.host_locker.name}&host_user_username=${connection.host_user.username}&guest_locker_name=${connection.guest_locker.name}&guest_user_username=${connection.guest_user.username}`.replace(
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
          throw new Error("Failed to fetch connection details");
        }
        const data = await response.json();
        if (data.connections) {
          console.log("data", data);
          setTermsValue(data.connections.terms_value_reverse || {});
          setconndetails(data.connections);
          setConnectionDetails(data.connections);

          console.log("terms_value_reverse:", data.connections.terms_value_reverse); // Check if `terms_value` exists
          if (data.connections.terms_value_reverse) {
            const initialStatuses = {};

            for (const [key, value] of Object.entries(
              data.connections.terms_value_reverse
            )) {
              if (key !== "canShareMoreData") {
                initialStatuses[key] = value.endsWith("T")
                  ? "approved"
                  : value.endsWith("R")
                    ? "rejected"
                    : "";
              }
            }
            console.log("inside here");
            console.log("initial statuses", initialStatuses);

            setStatuses(initialStatuses);
          } else {
            console.log("No terms_value found");
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
    fetchConnectionDetails();
    fetchGlobalTemplates();
    fetchObligations();
  }, [curruser, connection, connectionType, navigate]);

  

   useEffect(() => {
      if (connectionDetails) {
        const { revoke_guest, revoke_host } = connectionDetails;
        console.log(revoke_host, revoke_guest);
        if (revoke_guest === true && revoke_host === false) {
          setModalMessage({
            message: 'You revoked the connection waiting for host to revoke the connection.',
            type: 'info',
          });
          setIsModalOpens(true);
        }
      }
    }, [connectionDetails]);
  
    useEffect(() => {
        if (connectionDetails) {
          const { revoke_guest, revoke_host } = connectionDetails;
          //   console.log(revoke_host, revoke_guest);
          if (revoke_guest === false && revoke_host === true ) {
            setModalMessage({
              message:
                "The host has revoked the connection, click Revoke to revoke the connection",
              type: "info",
            });
            setIsModalOpen(true);
          }
        }
      }, [connectionDetails]);

  // const handleStatusChange = (index, status, value, type, isFile) => {
  //     if (value !== "") {
  //         setStatuses(prevStatuses => {
  //             const newStatuses = {
  //                 ...prevStatuses,
  //                 [index]: status
  //             };

  //             setResourcesData(prevData => {
  //                 // Create a new copy for both arrays to avoid unintended mutations
  //                 const updatedResources = {
  //                     transfer: [...prevData.transfer],
  //                     share: [...prevData.share]
  //                 };

  //                 // Check the type and isFile conditions separately
  //                 if (isFile) {
  //                     if (type === 'transfer') {
  //                         if (status === 'approved' && !updatedResources.transfer.includes(value)) {
  //                             updatedResources.transfer.push(value);
  //                         } else if (status === 'rejected') {
  //                             updatedResources.transfer = updatedResources.transfer.filter(item => item !== value);
  //                         }
  //                     } else if (type === 'share') {
  //                         if (status === 'approved' && !updatedResources.share.includes(value)) {
  //                             updatedResources.share.push(value);
  //                         } else if (status === 'rejected') {
  //                             updatedResources.share = updatedResources.share.filter(item => item !== value);
  //                         }
  //                     }
  //                 }

  //                 return updatedResources; // Ensure returning the correct state
  //             });

  //             return newStatuses;
  //         });
  //     } else {
  //         alert("Value required in Enter Value field to either Approve or Reject");
  //     }
  // };

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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsModalOpens(false);
    setModalMessage({ message: "", type: "" });
    navigate(`/view-locker?param=${Date.now()}`, {
      state: { locker: conndetails.guest_locker },
    });
  };

   const onCloseButtonClick = (connection_id) => {
    setCloseState(false);
    setIsModalOpenClose(false);
    handleCloseConnection(connection_id);
    // setModalMessage({ message: message, type: "info" });
    // setIsModalOpenClose(true);
  };
const handleCloseModalClose = () => {
    setIsModalOpenClose(false);
    setModalMessage({ message: "", type: "" });
    navigate(`/view-locker?param=${Date.now()}`, {
      state: { locker: connection.guest_locker },
    });
  };

   const handleCloseConnection = async (connection_id) => {
    setIsModalOpenClose(false)
    const formData = new FormData();
    formData.append("connection_id", connection_id);
    // formData.append("close_host_bool", "True");

    // console.log(connection_id ,"id");
    const token = Cookies.get("authToken");
    try {
      const response = await fetch(
        "host/close_connection_guest/".replace(/host/, frontend_host),
        {
          method: "POST",
          headers: {
            // 'Content-Type': 'application/json',
            Authorization: `Basic ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      setIsModalOpen(false)
      setIsModalOpens(false)
      setIsModalOpenClose(false);
      // console.log("revoke consent", data);
      if (response.status === 200) {
        setIsModalOpenClose(false);
        setModalMessage({
          message: 'Successfully Connection closed',
          type: 'success',
        });
        setIsModalOpens(true)
      } else {
        setModalMessage({
          message: data.message || "Failed to close the connection.",
          type: "failure",
        });
        setIsModalOpens(true)
      }
    } catch (error) {
      console.error("Error:", error);

      return "An error occurred while Closing connection.";
    }
    // setIsModalOpen(true)
  };
  const handleCloseResourceModal = () => {
    setResourceModal(false);
    setSelectedRowData(null)
    setModalMessage({ message: "", type: "" });
  };

  const handleClick = async (xnode_id_with_pages) => {
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
      const { link_To_File, xnode } = data;
      if (xnode) {
        setXnodeToDownload(xnode);
      } else {
        setXnodeToDownload(null);
      }
      if (link_To_File) {
        const secureFileUrl = link_To_File.replace('http://', 'https://');
        setPdfUrl(secureFileUrl);

        // const secureFileUrl =
        //   process.env.NODE_ENV === 'production'
        //     ? link_To_File.replace('http://', 'https://')
        //     : link_To_File;
        // setPdfUrl(link_To_File);
        setIsReactModalOpen(true);// Open the modal
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

  const handleClose = () => {
    setIsModalOpen(false);
    setIsReactModalOpen(false);
    setPdfUrl(null);
    setXnodeToDownload(null);
  };
  const downloadFile = async () => {
      try {
        const token = Cookies.get("authToken");
        const downloadFileID = xnodeToDownload.id;
  
        // ✅ Append xnode_id in query string
        const response = await fetch(`${frontend_host}/download_resource_v2/?xnode_id=${downloadFileID}`, {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`, // base64 encoded username:password
          },
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          console.error("Download error:", errorData);
          alert(`Error: ${errorData.error}`);
          return;
        }
  
        const blob = await response.blob();
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = "downloaded_file";
  
        if (contentDisposition && contentDisposition.includes("filename=")) {
          filename = contentDisposition.split("filename=")[1].replace(/"/g, "").trim();
        }
  
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error("Unexpected error:", err);
        alert("Failed to download file.");
      }
    };
  console.log("setXnodeToDownload", xnodeToDownload)
  const handleClicks = async (xnode_id_with_pages) => {
    const xnode_id = xnode_id_with_pages?.split(',')[0];
    const pages = xnode_id_with_pages?.split(',')[1];
    const from_page = parseInt(pages?.split(':')[0].split("(")[1], 10);
    const to_page = parseInt(pages?.split(':')[1].replace(")")[0], 10);
    // console.log(xnode_id, "pages", pages, "from", from_page, "to_page", to_page);
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
    return Object.entries(obj)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);
  };
  const postConditionsKeys = getTrueKeys(pdfData?.post_conditions || {});
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
                setIsModalOpens(true);
              } else {
                setModalMessage({
                  message: data?.error,
                  type: "info",
                });
                setIsModalOpens(true);
              }
            } catch (error) {
              console.error("Error:", error);
              setModalMessage({
                messgae: error,
                type: "error",
              });
              setIsModalOpens(true);
            }
            // setIsModalOpens(true);
            // navigate(`/target-locker-view`);
        
          };

  const handleStatusChange = (index, status, value, type, isFile) => {
    if (value !== "") {
      setStatuses((prevStatuses) => {
        // Update the statuses for the specific index
        const newStatuses = {
          ...prevStatuses,
          [index]: status,
        };

        setRejectedStatuses((prevRejectedStatuses) => {
          const updatedRejectedStatuses = { ...prevRejectedStatuses };
          if (status === "rejected") {
            updatedRejectedStatuses[index] = value;
          } else if (updatedRejectedStatuses[index]) {
            // If previously rejected and now changed, remove it
            delete updatedRejectedStatuses[index];
          }
          return updatedRejectedStatuses;
        });

        // Recalculate the resourcesData based on all statuses
        setResourcesData((prevResourcesData) => {
          // Initialize new arrays for transfer and share
          const newTransfer = [...new Set(prevResourcesData.transfer)];
          const newShare = [...new Set(prevResourcesData.share)];
          const newConfer = [...new Set(prevResourcesData.confer)];
          const newCollateral = [...new Set(prevResourcesData.collateral)];

          // const newShare = [];
          // const newTransfer = [];

          // Iterate through all statuses to populate new arrays
          Object.keys(newStatuses).forEach((key) => {
            const currentValue = termsValue[key]?.split(";")[0]; // Extract current value for the term
            const currentType = res.obligations.find(
              (obligation) => obligation.labelName === key
            )?.typeOfSharing;
            const currentIsFile =
              res.obligations.find((obligation) => obligation.labelName === key)
                ?.typeOfAction === "file";

            if (
              newStatuses[key] === "approved" &&
              currentValue &&
              currentIsFile &&
              (!prevStatuses[key] || prevStatuses[key] !== "approved")
            ) {
              if (currentType === "transfer" && !newTransfer.includes(currentValue)) {
                newTransfer.push(currentValue);
              } else if (currentType === "share" && !newShare.includes(currentValue)) {
                newShare.push(currentValue);
              } else if (currentType === "confer" && !newConfer.includes(currentValue)) {
                newConfer.push(currentValue);
              } else if (currentType === "collateral" && !newCollateral.includes(currentValue)) {
                newCollateral.push(currentValue);
              }
            }
          });

          // Return the updated resourcesData
          return {
            transfer: [...new Set(newTransfer)],
            share: [...new Set(newShare)],
            confer: [...new Set(newConfer)],
            collateral: [...new Set(newCollateral)],
          };
        });

        return newStatuses;
      });
    } else {
      alert("Value required in Enter Value field to either Approve or Reject");
    }
  };
  console.log("handleStatusChange2", rejectedStatuses)
  //permissions
  const handleStatusChange2 = (index, status, value, type, isFile) => {

    setStatuses2((prevStatuses) => {
      // Update the statuses for the specific index
      const newStatuses = {
        ...prevStatuses,
        [index]: status,
      };

      setRejectedStatuses((prevRejectedStatuses) => {
        const updatedRejectedStatuses = { ...prevRejectedStatuses };
        if (status === "rejected") {
          updatedRejectedStatuses[index] = value;
        } else if (updatedRejectedStatuses[index]) {
          // If previously rejected and now changed, remove it
          delete updatedRejectedStatuses[index];
        }
        return updatedRejectedStatuses;
      });

      // Recalculate the resourcesData based on all statuses
      setResourcesData((prevResourcesData) => {
        // Initialize new arrays for transfer and share
        const newTransfer = [...new Set(prevResourcesData.transfer)];
        const newShare = [...new Set(prevResourcesData.share)];
        const newConfer = [...new Set(prevResourcesData.confer)];
        const newCollateral = [...new Set(prevResourcesData.collateral)];
        // const newTransfer = [];
        // const newShare = [];


        // Iterate through all statuses to populate new arrays
        Object.keys(newStatuses).forEach((key) => {
          const currentValue = permissionsData.find(
            (permission) => permission.labelName === key
          )?.dataElement.split(";")[0];
          console.log(permissionsData, currentValue, "hello") // Extract current value for the term
          const currentType = permissionsData.find(
            (permission) => permission.labelName === key
          )?.share;
          // const currentIsFile =
          //   res.obligations.find((obligation) => obligation.labelName === key)
          //     ?.typeOfAction === "file";

          if (
            newStatuses[key] === "approved" &&
            currentValue &&
            (!prevStatuses[key] || prevStatuses[key] !== "approved")
          ) {
            if (currentType === "transfer" && !newTransfer.includes(currentValue)) {
              newTransfer.push(currentValue);
            } else if (currentType === "share" && !newShare.includes(currentValue)) {
              newShare.push(currentValue);
            } else if (currentType === "confer" && !newConfer.includes(currentValue)) {
              newConfer.push(currentValue);
            } else if (currentType === "collateral" && !newCollateral.includes(currentValue)) {
              newCollateral.push(currentValue);
            }
          }
        });

        // Return the updated resourcesData
        return {
          transfer: [...new Set(newTransfer)],
          share: [...new Set(newShare)],
          confer: [...new Set(newConfer)],
          collateral: [...new Set(newCollateral)],
        };
      });

      return newStatuses;
    });

  };
  console.log("res data", res);

  const
    handleSaveRejection = () => {
      if (Object.keys(rejectedStatuses).length > 0) {
        setShowRejectionPopup(true); // Show the popup first
      } else {
        handleSave()
      }
    }

  const handleSave = async () => {
    try {
      const token = Cookies.get("authToken");


      // Create the terms_value object from the obligations
      const terms_value_reverse = res?.obligations.reduce((acc, obligation) => {
        console.log(res?.obligations, "data not extra")
        // Determine the status for the current obligation
        const status =
          statuses[obligation.labelName] === "approved"
            ? "T"
            : statuses[obligation.labelName] === "rejected"
              ? "R"
              : "F";
        const resourceName =
          termsValue[obligation.labelName]?.split(";")[0] || "";
        // Add to terms_value with the status
        acc[obligation.labelName] = `${resourceName};${status}`;
        return acc;
      }, {});



      // Preserve the existing canShareMoreData structure without overriding other terms
      if (termsValue?.canShareMoreData) {
        console.log(termsValue.canShareMoreData, "data extra");

        for (const [key, value] of Object.entries(
          termsValue.canShareMoreData
        )) {
          const status =
            statuses2[key] === "approved"
              ? "T"
              : statuses2[key] === "rejected"
                ? "R"
                : "F";
          const val = value.enter_value?.split(";")[0] || "";
          value.enter_value = `${val};${status}`;

        }

        // const extra_terms_value = termsValue?.canShareMoreData.map((acc, obligation) => {
        //   // Determine the status for the current obligation
        //   const status =
        //     statuses[obligation.labelName] === "approved"
        //       ? "T"
        //       : statuses[obligation.labelName] === "rejected"
        //       ? "R"
        //       : "F";
        //   const resourceName =
        //     termsValue[obligation.labelName]?.split(";")[0] || "";
        //   // Add to terms_value with the status
        //   acc[obligation.labelName] = `${resourceName};${status}`;
        //   return acc;
        // }, {});
        terms_value_reverse.canShareMoreData = {
          ...termsValue.canShareMoreData,
        };
      }

      // console.log("terms_value", terms_value);

      const resourcesToTransfer = resourcesData.transfer;
      const resourcesToShare = resourcesData.share;
      const resourcesToConfer = resourcesData.confer;
      const resourcesToCollateral = resourcesData.collateral;

      const requestBody = {
        connection_name: conndetails.connection_name,
        host_locker_name: conndetails.host_locker.name,
        guest_locker_name: conndetails.guest_locker.name,
        host_user_username: conndetails.host_user.username,
        guest_user_username: conndetails.guest_user.username,
        terms_value_reverse: terms_value_reverse,
        resources: {
          Transfer: resourcesToTransfer,
          Share: resourcesToShare,
          Confer: resourcesToConfer,
          Collateral: resourcesToCollateral,
        },
      };

      console.log("Request Body:", requestBody);

      const updateResponse = await fetch(
        `host/update_connection_terms_v2/`.replace(/host/, frontend_host),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("Error Response:", errorText);
        throw new Error("Failed to save statuses");
      }

      const updateData = await updateResponse.json();
      if (updateData.success) {
        alert("Statuses saved successfully");
      } else {
        setError(updateData.error || "Failed to save statuses");
      }

      for (const resource of resourcesToShare) {
        await updateXnode(resource);
      }
      for (const resource of resourcesToShare) {
        await updateXnode(resource);
      }
      // Transfer resources
      if (resourcesToTransfer.length > 0) {
        await handleAcceptResource();
      }

      // Share resources
      if (resourcesToShare.length > 0) {
        await handleShareResource();
      }

      if (resourcesToConfer.length > 0) {
        await handleConferResource();
      }

      if (resourcesToCollateral.length > 0) {
        await handleCollateralResource();
      }

      window.location.reload();
    } catch (err) {
      console.error("Error:", err.message);
      setError(err.message);
    }
  };

  const handleRejectionSubmit = async () => {
    const token = Cookies.get("authToken");
    const rejectionEntries = Object.entries(rejectedStatuses);

    try {
      for (const [key, value] of rejectionEntries) {
        const [label, id] = value.split("|");
        const comment = rejectionComment[key]?.trim();

        if (!comment) {
          alert(`Please enter a comment for ${key} - ${label}`);
          return;
        }

        const rejectionBody = {
          connection_name: conndetails.connection_name,
          host_locker_name: conndetails.host_locker.name,
          guest_locker_name: conndetails.guest_locker.name,
          host_user_username: conndetails.host_user.username,
          guest_user_username: conndetails.guest_user.username,
          rejection_reason: comment,
          resource_name: label
        };

        const rejectionResponse = await fetch(
          `${frontend_host}/reject_shared_resource_v2/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${token}`,
            },
            body: JSON.stringify(rejectionBody),
          }
        );

        const rejectionData = await rejectionResponse.json();
        if (!rejectionResponse.ok || !rejectionData.success) {
          console.warn(`Rejection for ${key} failed:`, rejectionData.message || rejectionData.error);
        } else {
          console.log(`Rejection for ${key} sent:`, rejectionData.message);
        }
      }

      // All rejections done
      setShowRejectionPopup(false);
      // setProceedWithSave(true);
      await handleSave(); // Now call the save API

    } catch (err) {
      console.error("Rejection error:", err);
    }
  };

  // console.log("conndetials", conndetails);
  const updateXnode = async (resource) => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `host/update_inode_v2/`.replace(/host/, frontend_host),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify({
            connection_id: conndetails.connection_id,
            xnode_id: resource.id,
            validity_until: conndetails.validity_until,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to update resource");
      }

      const data = await response.json();
      // console.log("transfer", data);
      if (data.success) {
        console.log("update successful");
      } else {
        setError(data.error || "Failed to transfer resource");
        console.log(data.error);
      }
    } catch (err) {
      setError(err.message);
      console.log(err);
    }
  };

  const handleAcceptResource = async () => {
    try {
      console.log(JSON.stringify({
        connection_name: conndetails.connection_name,
        host_locker_name: conndetails.host_locker.name,
        guest_locker_name: conndetails.guest_locker.name,
        host_user_username: conndetails.host_user.username,
        guest_user_username: conndetails.guest_user.username,
        validity_until: conndetails.validity_time,
      }));

      const token = Cookies.get("authToken");
      const response = await fetch(
        `${frontend_host}/transfer_resource_reverse_v2/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify({
            connection_name: conndetails.connection_name,
            host_locker_name: conndetails.host_locker.name,
            guest_locker_name: conndetails.guest_locker.name,
            host_user_username: conndetails.host_user.username,
            guest_user_username: conndetails.guest_user.username,
            validity_until: conndetails.validity_time,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(response.error);
        throw new Error("Failed to transfer resource");
      }

      const data = await response.json();
      // console.log("transfer", data);
      if (data.success) {
        alert("Resource transfer successful");
      } else {
        setError(data.error || "Failed to transfer resource");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleShareResource = async () => {
    try {
      // console.log(JSON.stringify({
      //   connection_name: conndetails.connection_name,
      //   host_locker_name: conndetails.host_locker.name,
      //   guest_locker_name: conndetails.guest_locker.name,
      //   host_user_username: conndetails.host_user.username,
      //   guest_user_username: conndetails.guest_user.username,
      //   validity_until: conndetails.validity_time,
      // }));

      const token = Cookies.get("authToken");
      const response = await fetch(
        `host/share_resource_approve_reverse_v2/`.replace(/host/, frontend_host),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify({
            connection_name: conndetails.connection_name,
            host_locker_name: conndetails.host_locker.name,
            guest_locker_name: conndetails.guest_locker.name,
            host_user_username: conndetails.host_user.username,
            guest_user_username: conndetails.guest_user.username,
            validity_until: conndetails.validity_time,
          }),
        }
      );



      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error Response:", errorText);
        throw new Error("Failed to share resource");
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to share resource");
      }
      else {
        console.log(data.message);
        alert(data.message);
      }
    } catch (err) {
      console.error("Error:", err.message);
      throw err; // Rethrow error to be handled by the main try-catch
    }
  };
  const handleConferResource = async () => {
    try {
      console.log(JSON.stringify({
        connection_name: conndetails.connection_name,
        host_locker_name: conndetails.host_locker.name,
        guest_locker_name: conndetails.guest_locker.name,
        host_user_username: conndetails.host_user.username,
        guest_user_username: conndetails.guest_user.username,
        validity_until: conndetails.validity_time,
      }));

      const token = Cookies.get("authToken");
      const response = await fetch(
        `${frontend_host}/confer_resource_approve_reverse_v2/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify({
            connection_name: conndetails.connection_name,
            host_locker_name: conndetails.host_locker.name,
            guest_locker_name: conndetails.guest_locker.name,
            host_user_username: conndetails.host_user.username,
            guest_user_username: conndetails.guest_user.username,
            validity_until: conndetails.validity_time,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(response.error);
        throw new Error("Failed to confer resource");
      }

      const data = await response.json();
      // console.log("transfer", data);
      if (data.success) {
        alert("Resource confer successful");
      } else {
        setError(data.error || "Failed to confer resource");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCollateralResource = async () => {
    try {
      console.log(JSON.stringify({
        connection_name: conndetails.connection_name,
        host_locker_name: conndetails.host_locker.name,
        guest_locker_name: conndetails.guest_locker.name,
        host_user_username: conndetails.host_user.username,
        guest_user_username: conndetails.guest_user.username,
        validity_until: conndetails.validity_time,
      }));

      const token = Cookies.get("authToken");
      const response = await fetch(
        `${frontend_host}/collateral_resource_reverse_v2/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
          body: JSON.stringify({
            connection_name: conndetails.connection_name,
            host_locker_name: conndetails.host_locker.name,
            guest_locker_name: conndetails.guest_locker.name,
            host_user_username: conndetails.host_user.username,
            guest_user_username: conndetails.guest_user.username,
            validity_until: conndetails.validity_time,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log(response.error);
        throw new Error("Failed to collateral resource");
      }

      const data = await response.json();
      console.log("transfer", data);
      if (data.success) {
        alert("Resource collateral successful");
      } else {
        setError(data.error || "Failed to collateral resource");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // const handleResourceClick = (filePath) => {
  //     const url = `host/media/documents/${filePath}`.replace(/host/, frontend_host);
  //     window.open(url, "_blank");
  // };

  const handleResourceClick = (filePath) => {
    const url = `host/media/${filePath}`.replace(/host/, frontend_host);
    window.open(url, "_blank");
  };

  const openTermsPopup = () => {
    setShowTermsPopup(true);
  };

  const closeTermsPopup = () => {
    setShowTermsPopup(false);
  };

  const renderObligations = () => {
    if (res && res.obligations) {
      return (
        <div>
          <h3>Obligations</h3>
          <ul>
            {res.obligations.map((obligation, index) => (
              <li key={index}>
                {obligation.typeOfSharing} - {obligation.labelName} (Host
                Privilege:{" "}
                {obligation.hostPermissions &&
                  obligation.hostPermissions.length > 0
                  ? obligation.hostPermissions.join(", ")
                  : "None"}
                )
              </li>
            ))}
          </ul>
        </div>
      );
    }
    return <p>No obligations available.</p>;
  };

  const renderPermissions = () => {
    if (res && res.permissions) {
      const { canShareMoreData, canDownloadData } = res.permissions;
      return (
        <div className="permissions">
          <h3>Permissions</h3>
          <ul>
            {canShareMoreData ? (
              <li>You can share more data.</li>
            ) : (
              <li>You cannot share more data.</li>
            )}
            {canDownloadData ? (
              <li>You can download data.</li>
            ) : (
              <li>You cannot download data.</li>
            )}
          </ul>
        </div>
      );
    }
    return null;
  };
  const renderForbidden = () => {
    if (res && res.forbidden) {
      return (
        <div className="permissions">
          <h3>Forbidden</h3>
          <ul>
            {res.forbidden.map((term, index) => (
              <li key={index}>{term.labelDescription}</li>
            ))}
          </ul>
        </div>
      );
    }
    return <p>No forbidden terms available.</p>;
  };

  const renderPermissionsTable = () => {
    if (permissionsData.length > 0) {
      return (
        <div className="permissions-table mt-4">
          <h3>User Permissions</h3>
          <table>
            <thead>
              <tr>
                <th>Sno</th>
                <th>Label Name</th>
                <th>Data Element</th>
                <th>Purpose</th>
                <th>Type of Share</th>
                <th>Consent Artefact</th>
                <th>Status</th> {/* New column for status dropdown */}
              </tr>
            </thead>
            <tbody>
              {permissionsData.map((permission, index) => (
                <tr key={index}>
                  <td>{permission.sno}</td>
                  <td>{permission.labelName}</td>
                  <td> <a className="mb-1"
                    style={{ display: "block", color: "blue", textDecoration: "underline", cursor: "pointer" }}
                    onClick={() =>
                      handleClick(
                        permission.dataElement?.split(";")[0]?.split("|")[1]
                      )
                    }>
                    {permission.dataElement?.split(";")[0]?.split("|")[0]}
                  </a></td>{" "}
                  <td>{permission.purpose || "None"}</td>{" "}
                  <td>{permission.share || "None"}</td>{" "}
                  <td><button onClick={() => openPopup1(permission)}>View</button></td>
                  <td>
                    <select
                      value={statuses2[permission.labelName] || ""}
                      disabled={
                          permission.dataElement?.endsWith("T") ||
                          permission.dataElement?.endsWith("R")
                        }
                      onChange={(e) =>
                        handleStatusChange2(permission.labelName, e.target.value, permission.dataElement?.split(";")[0])
                      }
                    >
                      <option value="">Select Status</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      return;
    }
  };


  const navigateToConnectionDetails = (connection) => {
    // Log the connection object to verify its structure
    console.log("Connection Object:", connection);

    // Safely access properties with optional chaining
    const connectionTypeName = connection?.connection_type_name;
    const connectionDescription = connection?.connection_description;
    const hostLockerName = connection?.host_locker?.name;
    const hostLockerDescription = connection?.host_locker?.description;  // Add specific properties
    const hostUserUsername = connection?.host_user?.username;
    const guestUserUsername = connection?.guest_user?.username;
    const connectionName = connection?.connection_name;
    const createdTime = connection?.created_time;
    const validityTime = connection?.validity_time;
    const guestLockerName = connection?.guest_locker?.name
    const guestLockerId = connection?.guest_locker?.locker_id
    const guestLocker = connection?.guest_locker
    const hostLocker = connection?.host_locker
    // Check if created_time is undefined and log a message if so
    if (!createdTime) {
      console.warn("created_time is undefined for this connection.");
    } else {
      console.log("Date:", createdTime);
    }

    console.log("guest", guestUserUsername)

    // Navigate with safe properties
    navigate("/show-connection-terms", {
      state: {
        connectionTypeName: connectionTypeName,
        hostLockerName: hostLockerName,
        hostLockerDescription: hostLockerDescription,  // Pass specific properties instead of the whole object
        connectionName: connectionName,
        guestUserUsername: guestUserUsername,
        connectionDescription: connectionDescription,
        createdtime: createdTime,
        validitytime: validityTime,
        hostUserUsername: hostUserUsername,
        locker: guestLockerName,
        guestLockerName: guestLockerName,
        guestLocker: guestLocker,
        hostLocker: hostLocker,

      },
    });
  };

  const navigateToConnectionTerms = (connection) => {
    const connectionTypeName = connection?.connection_type_name;
    const connectionDescription = connection?.connection_description;
    const hostLockerName = connection?.host_locker?.name;
    const hostLockerDescription = connection?.host_locker?.description;  // Add specific properties
    const hostUserUsername = connection?.host_user?.username;
    const guestUserUsername = connection?.guest_user?.username;
    const connectionName = connection?.connection_name;
    const createdTime = connection?.created_time;
    const validityTime = connection?.validity_time;
    const guestLockerName = connection?.guest_locker?.name
    const guestLockerId = connection?.guest_locker?.locker_id
    const guestLocker = connection?.guest_locker
    const hostLocker = connection?.host_locker
    // Check if created_time is undefined and log a message if so
    if (!createdTime) {
      console.warn("created_time is undefined for this connection.");
    } else {
      console.log("Date:", createdTime);
    }

    console.log("guest", guestUserUsername)

    // Navigate with safe properties
    navigate("/display-terms", {
      state: {
        connectionTypeName: connectionTypeName,
        hostLockerName: hostLockerName,
        hostLockerDescription: hostLockerDescription,  // Pass specific properties instead of the whole object
        connectionName: connectionName,
        guestUserUsername: guestUserUsername,
        connectionDescription: connectionDescription,
        createdtime: createdTime,
        validitytime: validityTime,
        hostUserUsername: hostUserUsername,
        locker: guestLockerName,
        guestLockerName: guestLockerName,
        guestLocker: guestLocker,
        hostLocker: hostLocker,
        hostTermsReviewDisplay: true,
        connectionDetails
      },
    });
  }

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

  const handleGuestClick = () => {

    navigate('/view-locker', {
      state: {
        user: { username: conndetails.guest_user.username },
        locker: conndetails.guest_locker,
      }
    });
  };

  const handleHostClick = () => {

    navigate('/target-locker-view', {
      state: {
        user: { username: conndetails.host_user.username },
        locker: conndetails.host_locker,
      },
    });
  };

  const handleGuestNameClick = () => {
    navigate('/home', {
    });
  };
  console.log("conndetails", conndetails)

  const handleHostNameClick = () => {
    navigate('/target-user-view', {
      state: {
        user: conndetails.host_user
      },
    });
  };
  const openPopup = (rowData) => {
    const labelName = rowData.labelName
    const extractedValue = termsValue[labelName].split(";")[0].split("|")[1]; // Extract the required value
    handleClicks(extractedValue); // Pass the extracted value to handleClicks
    setSelectedRowData(rowData);
    setShowOpenPopup(true);
  };
  const openPopup1 = (rowData) => {
    console.log("selectedRowDatas1", rowData?.dataElement?.split(";")[0].split("|")[1])
    const extractedValue = rowData?.dataElement?.split(";")[0].split("|")[1]; // Extract the required value
    handleClicks(extractedValue); // Pass the extracted value to handleClicks
    setSelectedRowData1(rowData);
    setShowOpenPopup(true);
  }
  const closeOpenPopup = () => {
    setShowOpenPopup(false);
    setSelectedRowData(null);
    setSelectedRowData1(null);
    setPdfData(null);
  };
  const content = (
    <>
      <div className="navbarBrands">
        <h5><b>{connection?.connection_name}</b> &nbsp;
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
      </div>
      {/* <span className="badge text-bg-primary">{connectionDetails?.connection_status}</span> */}
      {/* <div className="navbarBrands"> {curruser ? capitalizeFirstLetter(curruser.username) : "None"}</div>
      <div>
        {curruser ? curruser.description : "None"}
      </div> */}
      {/* <div className="description">
        {curruser ? curruser.description : "None"}
      </div>
      <br></br>
      <div className="connection-details">
        Connection Name: {conndetails?.connection_name || "Loading..."}
        <button
          className="info-button"
          onClick={() => navigateToConnectionDetails(connectionType)}
          title="Show Connection Terms"
          style={{
            marginLeft: "10px",
            cursor: "pointer",
            background: "transparent",
            border: "none",
            marginBottom:"6px"
          }}
        >
          <i className="fa fa-info-circle userIcon"></i>
        </button>
        <br></br>
        <span>{conndetails?.connection_description}</span>
        <br></br>
        <div className="tooltip-container user-container">
          <div className="tooltip user-container">
            <FaUserCircle className="userIcon"/> &nbsp;
            <span className="userName">{renderUserTooltip('guest',conndetails.guest_user?.username)} : {conndetails.guest_user?.username||"Loading..."} &nbsp;</span>
          </div>
          <i class="fa-solid fa-right-long"></i> &nbsp;
          <div className="tooltip user-container">
            <FaRegUserCircle className="userIcon"/>&nbsp;
            <span className="userName">{renderUserTooltip('host',conndetails.host_user?.username)} : {conndetails?.host_user?.username||"Loading..."}</span>
          </div>
        </div>
        <div className="tooltip-container user-container">
          <div className="tooltip user-container" onClick={() => navigate("/home")} style={{ cursor: 'pointer' }}>
            <i class="bi bi-person-fill-lock"></i> &nbsp;
            <span className="userName">{renderUserTooltip('guest',conndetails.guest_locker?.name)} : {conndetails.guest_locker?.name||"Loading..."} &nbsp;</span>
          </div>
          <i class="fa-solid fa-right-long"></i> &nbsp;
          <div className="tooltip user-container" >
            <i class="bi bi-person-lock"></i>&nbsp;
            <span className="userName">{renderUserTooltip('host',conndetails.host_locker?.name)} : {conndetails.host_locker?.name||"Loading..."}</span>
          </div>
        </div>
      </div> */}
    </>
  );

  // const uniqueGlobalConnTypeIds = [
  //   ...new Set(
  //     terms
  //       .filter((term) => term.global_conn_type_id !== null)
  //       .map((term) => term.global_conn_type_id)
  //   ),
  // ];


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


  const globalTemplateNames = uniqueGlobalConnTypeIds.map((id) => {
    const template = globalTemplates.find(
      (template) => template.global_connection_type_template_id === id
    );
    return template ? template.global_connection_type_name : null;
  });
  const [isReceiptChecked, setIsReceiptChecked] = useState(false); // State for the checkbox

  const handleCheckboxChange = () => {
    setIsReceiptChecked(!isReceiptChecked); // Toggle checkbox state
  };
  const handleNavigation = (template) => {
    if (template) {
      console.log("temp", template);
      console.log("id", template.global_connection_type_template_id);
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
  const handleDownload = async (obligation) => {
    try {
      const token = Cookies.get("authToken");

      // Extract connection details from `conndetails`
      const connectionName = conndetails.connection_name;
      const hostLockerName = conndetails.host_locker.name;
      const guestLockerName = conndetails.guest_locker.name;
      const hostUserUsername = conndetails.host_user.username;
      const guestUserUsername = conndetails.guest_user.username;

      // Extract termsValue for document ID and namePart
      const termsValue = conndetails.terms_value;
      console.log("termsValue:", termsValue);

      let documentId = null;
      let documentName = obligation.labelName;  // Default to labelName in case of no match

      // Check if termsValue contains the document name in a recognizable format
      if (termsValue[documentName]) {
        const termEntry = termsValue[documentName];

        // Check if the entry contains "|" indicating a format like "DocumentName|ID;AdditionalInfo"
        if (termEntry.includes("|")) {
          const [namePart, idPart] = termEntry.split("|");

          // Use namePart from termsValue as document name
          documentName = namePart.trim();
          documentId = idPart ? idPart.split(",")[0].split(";")[0].trim() : null;
        }
      } else {
        console.log("Document entry not found in termsValue for:", documentName);
      }

      // Log the sharing type, extracted document name, and document ID
      console.log("Extracted Document name:", documentName);
      console.log("Sharing type:", obligation.typeOfSharing);
      console.log("Extracted Document ID:", documentId);

      // Prepare payload for the API request with document ID and namePart as document name
      const payload = {
        connection_name: connectionName,
        host_locker_name: hostLockerName,
        guest_locker_name: guestLockerName,
        host_user_username: hostUserUsername,
        guest_user_username: guestUserUsername,
        document_name: documentName,  // Now from `namePart` in termsValue
        sharing_type: obligation.typeOfSharing,
        xnode_id: documentId,  // Document ID from parsed termsValue
      };

      // Log the payload to verify the data before making the request
      console.log("Payload:", payload);

      // Make API call to download resource
      const response = await fetch(`${frontend_host}/download-resource/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        alert("Download successful!");

        // Optionally, change the color of the downloaded resource to green
        const downloadedResource = document.getElementById(`resource-${obligation.labelName}`);
        if (downloadedResource) {
          downloadedResource.style.color = "green";
        }

        console.log("Download successful:", data.message);
      } else {
        setError(data.error || "Failed to download resource");
      }
    } catch (err) {
      console.error("Error downloading resource:", err);
      setError(err.message);
    }
  };
  const handleLockerClick = (locker) => {
    navigate('/view-locker', {
      state: {
        user: { username: conndetails.guest_user.username },
        locker: conndetails.guest_locker,
      }
    });
  }

  const handleHostTermsClick = () => {
    navigate("/view-terms-by-type", {
      state: {
        connection_id: conndetails.connection_id,
        connectionName: conndetails.connection_name,
        connectionDescription: conndetails.connection_description,
        hostLockerName: conndetails?.host_locker?.name,
        guestLockerName: conndetails?.guest_locker?.name,
        hostUserUsername: conndetails?.host_user?.username,
        guestUserUsername: conndetails?.guest_user?.username,
        locker: conndetails?.guest_locker,
        guest_locker_id: conndetails.guest_locker?.locker_id,
        host_locker_id: conndetails.host_locker?.locker_id,
        connection: connection,
        // connectionType: connectionType,
        guestLocker: conndetails.guest_locker,
        hostLocker: conndetails.host_locker
      },
    })
  }

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleLockerClick()} className="breadcrumb-item">View Locker</span>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleHostTermsClick()} className="breadcrumb-item">ViewGuestTermsByType</span>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">HostTermsReview</span>
    </div>
  )


  const handleclickcreator = (user) => {
    if (curruser && curruser.username && user.username === curruser.username) {
      navigate('/home');
    } else {
      navigate(`/target-user-view`, { state: { user } });
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

      <div style={{ marginTop: "12px" }}>
        <div className="connection-details">
          <span style={{ fontSize: "19px" }}> <b>Connection Name:</b> {conndetails?.connection_name || "Loading..."}
            <button
              className="info-button info"
              onClick={() => navigateToConnectionTerms(connection)}
              title="Show Connection Terms"
              style={{
                marginLeft: "10px",
                cursor: "pointer",
                background: "transparent",
                border: "none",
                marginBottom: "6px"
              }}
            >
              <i className="fa fa-info-circle userIcon"></i>
            </button>
          </span>
          <div className="longconnectionDescription">{conndetails?.connection_description}</div>
          {/* <br></br> */}
          <Grid container>
            <Grid item xs={12} md={10}>
              <div className="tooltip-container user-container">
                <div className="tooltips user-container" onClick={() => handleGuestNameClick()}>
                  {/* <FaUserCircle className="userIcon" /> &nbsp; */}
                  <i className="guestuser-icon" /> &nbsp;
                  <span className="userName">: {capitalizeFirstLetter(conndetails.guest_user?.username) || "Loading..."} &nbsp;</span>
                </div>
                <i className="fa-solid fa-right-long mt-1"></i> &nbsp;
                <div className="tooltips user-container" onClick={() => handleHostNameClick()}>
                  {/* <FaRegUserCircle className="userIcon" />&nbsp; */}
                  <i className="hostuser-icon" /> &nbsp;
                  <span className="userName">: {capitalizeFirstLetter(conndetails?.host_user?.username) || "Loading..."}</span>
                </div>
              </div>
              <div className="tooltip-container user-container">
                <div className="tooltips user-container" onClick={() => handleGuestClick()} style={{ cursor: 'pointer' }}>
                  <i className="guestLocker-icon" />
                  <span className="userName">: {conndetails.guest_locker?.name || "Loading..."} &nbsp;</span>
                </div>
                <i class="fa-solid fa-right-long mt-1"></i> &nbsp;
                <div className="tooltips user-container" onClick={() => handleHostClick()}>
                  <i className="hostLocker-icon" />
                  <span className="userName">: {conndetails.host_locker?.name || "Loading..."}</span>
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

        <div className="view-container" style={{ marginLeft: "120px" }}>
          <div className="b">
            <div className="tabs">
              <div
                className={`tab-header ${activeTab === "guest" ? "active" : ""
                  }`}
                onClick={() => navigate("/view-terms-by-type", {
                  state: {
                    connection_id: conndetails.connection_id,
                    connectionName: conndetails.connection_name,
                    connectionDescription: conndetails.connection_description,
                    hostLockerName: conndetails?.host_locker?.name,
                    guestLockerName: conndetails?.guest_locker?.name,
                    hostUserUsername: conndetails?.host_user?.username,
                    guestUserUsername: conndetails?.guest_user?.username,
                    locker: conndetails?.guest_locker,
                    guest_locker_id: conndetails.guest_locker?.locker_id,
                    host_locker_id: conndetails.host_locker?.locker_id,
                    connection: connection,
                    // connectionType: connectionType,
                    guestLocker: conndetails.guest_locker,
                    hostLocker: conndetails.host_locker
                  },
                })}
              >
                Shared by me
              </div>
              <div
                className={`tab-header ${activeTab === "host" ? "active" : ""
                  }`}
                onClick={() => setActiveTab("host")}
              >
                Host Data
              </div>
            </div>
            {/* Added Tabs */}
            {/* Added Tabs */}
            <div className="tab-content">
              {activeTab == "host" && (
                <>
                  <div className={showResources ? "split-view" : ""}>
                    <div className="table-container">
                      <div className="center2">
                        {globalTemplateNames.length > 0 && "Regulations used: "}
                        <span style={{ fontWeight: "bold" }}>
                          {uniqueGlobalConnTypeIds.map((id, index) => {
                            const template = globalTemplates.find(template => template.global_connection_type_template_id === id);
                            return template ? (
                              <span
                                key={index}
                                onClick={() => handleNavigation(template)}  // Pass the entire template object
                                style={{ cursor: "pointer", textDecoration: "underline" }}  // Indicate it's clickable
                              >
                                {template.global_connection_type_name}
                                {index < uniqueGlobalConnTypeIds.length - 1 && ", "}
                              </span>
                            ) : null;
                          })}
                        </span>
                      </div>

                      <Grid container>
                        <Grid item md={10} xs={12}>
                          <h3>Host Obligations</h3>
                        </Grid>
                        {/* <Grid item md={2} xs={12}>
                          <button onClick={openTermsPopup}>
                            View Terms
                          </button>
                        </Grid> */}
                      </Grid>

                      {/* <button onClick={openTermsPopup} className="view-terms-link">
                        View Terms
                      </button>
                      <h3>Host Obligations</h3> */}
                      {showTermsPopup && (
                        <div className="terms-popup">
                          <div className="terms-popup-content">
                            <span className="close" onClick={closeTermsPopup}>
                              &times;
                            </span>
                            <h2>Connection Terms</h2>
                            {renderObligations()}
                            {renderPermissions()}
                            {renderForbidden()}
                            <div className="permissions">
                              <h3>Default Host Privileges</h3>
                              By default Reshare,Download,Aggreagte are disabled unless
                              otherwise mentioned in the terms
                            </div>
                            <div className="permissions">
                              <h3>Host Obligations</h3>
                              You will receive a receipt when all the obligations are met.


                            </div>
                          </div>
                        </div>
                      )}
                      <table>
                        <thead>
                          <tr>
                            <th>Sno</th>
                            <th>Name</th>
                            <th>Data Element</th>
                            <th>Purpose</th>
                            <th>Type of Share</th>
                            {/* <th>Host Privileges</th> */}
                            <th>Consent Artefact</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {res?.obligations.map((obligation, index) => (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td>{obligation.labelName}</td>
                              <td>
                                {termsValue[obligation.labelName]?.split(";")[0] ? (
                                  <a
                                    style={{ color: "blue", textDecoration: "underline", cursor: "pointer" }}
                                    onClick={() =>
                                      handleClick(
                                        termsValue[obligation.labelName]?.split(";")[0]?.split("|")[1]
                                      )
                                    }
                                  >
                                    {termsValue[obligation.labelName]?.split(";")[0]?.split("|")[0]}
                                  </a>

                                ) : (
                                  "None"
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
                                  <div
                                    style={{
                                      position: "fixed", // or "absolute" if inside a relative modal
                                      top: "20px",
                                      right: "20px",
                                      display: "flex",
                                      gap: "10px",
                                      zIndex: 9999,
                                    }}
                                  >
                                    {xnodeToDownload?.xnode_Type !== "VNODE" &&
                                      xnodeToDownload?.node_information?.primary_owner === xnodeToDownload?.node_information?.current_owner &&
                                      xnodeToDownload?.node_information?.primary_owner === curruser?.user_id &&
                                      xnodeToDownload?.is_locked?.download === false && (
                                        <button className="btn btn-primary btn-sm" onClick={downloadFile} title="Download">
                                          <i className="bi bi-download" style={{ fontWeight: "bolder", fontSize: "1.1rem" }}></i>
                                        </button>
                                      )}

                                    <button
                                      onClick={handleClose}
                                      className="btn btn-danger btn-sm"
                                      title="Close"
                                    >
                                      Close
                                    </button>
                                  </div>
                                  {pdfUrl ? (
                                    <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                                      <Viewer fileUrl={pdfUrl} />
                                    </Worker>
                                  ) : (
                                    <p>Loading PDF...</p>
                                  )}
                                </ReactModal>
                              </td>
                              <td>{obligation.purpose}</td>
                              <td>
                                <div className="tooltips">
                                  {obligation.typeOfSharing}
                                  {renderTooltip(obligation.typeOfSharing)}
                                </div>
                              </td>
                              {/* <td>
                                {obligation.hostPermissions
                                  ? obligation.hostPermissions.join(", ")
                                  : "None"}
                              </td> */}
                              <td><button onClick={() => openPopup(obligation)}>View</button></td>

                              <td>
                                <select
                                  value={statuses[obligation.labelName] || ""}
                                  disabled={
                                    termsValue[obligation.labelName]?.endsWith("T") ||
                                    termsValue[obligation.labelName]?.endsWith("R")
                                  }
                                  onChange={(e) =>
                                    handleStatusChange(
                                      obligation.labelName,
                                      e.target.value,
                                      termsValue[obligation.labelName]?.split(";")[0],
                                      obligation.typeOfSharing,
                                      obligation.typeOfAction === "file"
                                    )
                                  }
                                >
                                  <option value="">Select Status</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </td>
                              <td>
                                {obligation.hostPermissions && obligation.hostPermissions.includes("download") ? (
                                  <button onClick={() => handleDownload(obligation)} className="download-button">
                                    <i className="fa fa-download" aria-hidden="true"></i>
                                  </button>
                                ) : (
                                  " "
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Permissions Table Rendered Here */}
                      {renderPermissionsTable()}
                    </div>
                    {showResources && (
                      <div className="resource-container">
                        <h3>Resource List</h3>
                        <ul>
                          {resources.map((resource, index) => (
                            <li key={index} onClick={() => handleResourceClick(resource)}>
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <br></br>
                  <div className="save-button-container">
                    <button onClick={handleSaveRejection}>Save</button>
                  </div>

                  {/* <div style={{ marginTop: '20px', marginLeft: '10px' }}>
                  <h3 style={{ fontSize: '20px', marginLeft: '10px' }}>Host Obligations</h3>
                  <label style={{ fontSize: '20px', marginLeft: '10px' }}>
                    The guest will receive a receipt once all the documents are received.
                    <input
                        type="checkbox"
                        checked={isReceiptChecked}
                        onChange={handleCheckboxChange}
                        style={{ transform: 'scale(1.5)', marginLeft: '10px' }}
                    />
                  </label>
                  </div> */}



                  {isModalOpen && (
                    <Modal
                      message={modalMessage.message}
                      onClose={handleCloseModal}
                      type={modalMessage.type}
                      revoke={revokeState}
                      onRevoke={() => onRevokeButtonClick(conndetails.connection_id)}
                      viewTerms={() => navigateToConnectionTerms(conndetails)}
                    />
                  )}

                  {/* {isRevokeModalOpen && (
                  <RevokeMessageModal 
                  message={revokeMessage} 
                  onClose={handleCloseModal}
                  />
                  )} */}

                </>
              )}
              {/* {activeTab=="host" &&(
                <>
                  <div className="table-container">
                    <h3>Host Obligations</h3>
                      <table>
                        <thead>
                          <tr>
                            <th>Sno</th>
                            <th>Name</th>
                            <th>purpose</th>
                            <th>Type of share</th>
                            <th>Enter value</th>
                            <th>Host Privileges</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                      </table>
                  </div>
                  <div style={{ margin: "10px 0" }}>
                  <div>
                    {
                      <button style={{ marginLeft: "10px" }}>
                        Submit
                      </button>
                    }
                  </div>
                </div>
                </>
              )} */}
            </div>
          </div>
        </div>
        {resourceModal && (
          <Modal
            message={modalMessage.message}
            onClose={handleCloseResourceModal}
            type={modalMessage.type}
          />
        )}
        {showOpenPopup && selectedRowData && pdfData && (
          <>
            <div className="edit-modal " style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
            >
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
                  {termsValue[selectedRowData.labelName]?.split(";")[0] ? (
                    <>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">File Name:</span>
                        <span> {termsValue[selectedRowData.labelName]?.split(";")[0]?.split("|")[0]}</span>
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
                            <span className="tooltips">
                              {selectedRowData.typeOfSharing}
                              {renderTooltip(selectedRowData.typeOfSharing)}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between border-bottom py-2">
                            <span className="fw-bold">Remarks:</span>
                            <span>{pdfData.node_information?.remarks}</span>
                          </div>
                          <div className="d-flex justify-content-between border-bottom py-2 align-items-center">
                            <span className="fw-bold">Post Conditions:</span>
                            <span className=" text-end">
                              {postConditionsKeys.length > 0 ? postConditionsKeys.join(", ") : "No conditions found"}
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
          </>
        )}


        {showOpenPopup && selectedRowData1 && pdfData && (
          <>
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
                  {selectedRowData1.dataElement?.split(";")[0] ? (
                    <>
                      <div className="d-flex justify-content-between border-bottom pb-2">
                        <span className="fw-bold">File Name:</span>
                        <span>{selectedRowData1.dataElement.split("|")[0]}</span>
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
                            <span className="tooltips">{selectedRowData1.share}{renderTooltip(selectedRowData1.share)} </span>
                          </div>
                          <div className="d-flex justify-content-between border-bottom py-2">
                            <span className="fw-bold">Remarks:</span>
                            <span>{pdfData.node_information?.remarks}</span>
                          </div>
                          <div className="d-flex justify-content-between border-bottom py-2 align-items-center">
                            <span className="fw-bold">Post Conditions:</span>
                            <span className=" text-end">
                              {postConditionsKeys.length > 0 ? postConditionsKeys.join(", ") : "No conditions found"}
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
          </>
        )}

        {showRejectionPopup && (
          <div className="edit-modal ">
            <div className="modal-content">
              <h3>Enter Rejection Comments</h3>

              {Object.entries(rejectedStatuses).map(([key, value]) => (
                <div key={key} style={{ marginBottom: "1rem" }}>
                  <label>
                    <strong>{key}</strong> - {value.split("|")[0]}
                  </label>
                  <TextField
                    fullWidth
                    multiline
                    type="text"
                    rows={3}
                    value={setRejectionComment[key]}
                    onChange={(e) =>
                      setRejectionComment((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    placeholder="Enter reason for rejection"

                    style={{ width: "100%", marginTop: "0.5rem", borderRadius: "5px" }}
                  />
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "1rem" }}>
                <button className="btn btn-primary p-2" onClick={handleRejectionSubmit}>Submit</button>
                <button className="btn btn-primary p-2" onClick={() => setShowRejectionPopup(false)}>Cancel</button>
              </div>


              {/* Optional Cancel Button */}
              {/* <button onClick={handleRejectionCancel} style={{ marginLeft: "1rem" }}>Cancel</button> */}
            </div>
          </div>
        )}

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
          onCloseConnection={() => onCloseButtonClick(connection.connection_id)}
          viewTerms={() => navigateToConnectionTerms(conndetails)}
        />
      )}


      </div>


    </div>
  );
};

export default HostTermsReview;
