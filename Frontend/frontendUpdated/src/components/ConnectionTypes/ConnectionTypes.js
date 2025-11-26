import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { frontend_host } from "../../config";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import Modal from "../Modal/Modal";
import "./ConnectionTypes.css";
import Sidebar from "../Sidebar/Sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import {
    Card,
    CardContent,
    CardActions,
    Button,
    Typography,
    Grid,
    TextField,
} from '@mui/material';

export const ConnectionTypes = () => {
    const [connectionTypes, setConnectionTypes] = useState([]);
    const [error, setError] = useState(null);
    const { curruser } = useContext(usercontext);
    const [notifications, setNotifications] = useState([]);
    const [terms, setTerms] = useState([]);
    const [connectionDetails, setConnectionDetails] = useState(null);
    const [newConnectionTypeName, setNewConnectionTypeName] = useState(""); // New connection type name
    const [newConnectionDescription, setNewConnectionDescription] = useState("");
    const [editingConnection, setEditingConnection] = useState(null);
    const [selectedConnectionTerm, setSelectedConnectionTerm] = useState("");
    const [showEditConnectionModal, setShowEditConnectionModal] = useState(false); // Show/hide the modal for editing connection types
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [labelName, setLabelName] = useState("");
    const [newDescription, setNewDescription] = useState(""); // New description
    const [newPurpose, setNewPurpose] = useState("");
    const [modalMessage, setModalMessage] = useState(null); // State for modal message
    const [newConnectionTermName, setNewConnectionTermName] = useState(""); // For the new term name
    const [expandedIndices, setExpandedIndices] = useState({});
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
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    useEffect(() => {


        if (curruser) {
            fetchConnectionType();
            fetchNotifications();
        }
    }, [curruser]);

    const fetchConnectionType = async () => {
        try {
            const token = Cookies.get('authToken');
            const response = await fetch('host/get-connection-type/'.replace(/host/, frontend_host), {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to fetch connection types');
                return;
            }

            const data = await response.json();
            if (data.success) {
                setConnectionTypes(data.connection_types || []);
            } else {
                setError(data.message || data.error);
            }
        } catch (error) {
            setError("An error occurred while fetching lockers.");
        }
    };

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

    const handleEditConnectionClick = async (connection) => {
        setEditingConnection(connection.connection_type_id);
        setNewConnectionTypeName(connection.connection_type_name);
        setNewConnectionDescription(connection.connection_description);
        setSelectedConnectionTerm(""); // Clear any previous term selections
        setShowEditConnectionModal(true); // Show the modal
        await fetchConnectionType(connection.connection_type_name); // Fetch terms for this connection type
    };

    const handleSaveConnectionChanges = async () => {
        if (!editingConnection) return;

        try {
            const token = Cookies.get("authToken");

            // Prepare the connection update data
            const connectionUpdateData = {
                connection_type_id: editingConnection,
                connection_type_name: newConnectionTypeName, // Updated name
                connection_type_description: newConnectionDescription, // Updated description
            };

            // If a term is selected, include the term update
            if (selectedTerm && labelName) {
                connectionUpdateData.terms = [
                    {
                        terms_id: selectedTerm.terms_id,
                        data_element_name: labelName, // Updated label name
                        description: newDescription || "", // Ensure it's an empty string if undefined
                        purpose: newPurpose, // Updated purpose
                    },
                ];
            }

            const response = await fetch(
                `host/edit-delete-connectiontype/`.replace(/host/, frontend_host),
                {
                    method: "PUT",
                    headers: {
                        Authorization: `Basic ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(connectionUpdateData),
                }
            );

            const data = await response.json();

            if (data.success) {
                // Re-fetch connections after saving
                fetchConnectionType();
                setShowEditConnectionModal(false);
                setModalMessage({
                    message: "Connection type updated successfully!",
                    type: "success",
                });
            } else {
                console.error(data.message);
                setModalMessage({
                    message: "Failed to update connection.",
                    type: "failure",
                });
            }
        } catch (error) {
            console.error("An error occurred while updating the connection:", error);
            setModalMessage({
                message: "An error occurred while updating the connection.",
                type: "failure",
            });
        }
    };

    const handleTermSelect = (termId) => {
        const selected = terms.find((term) => term.terms_id === termId);

        // Set the state variables based on the selected term
        if (selected) {
            setSelectedTerm(selected);
            setLabelName(selected.labelName);
            setNewConnectionTermName(selected.labelName);
            setNewDescription(selected.description || ""); // Ensure defaulting to an empty string if undefined
            setNewPurpose(selected.purpose || ""); // Ensure defaulting to an empty string if undefined
        } else {
            // Clear fields if no term is selected
            setSelectedTerm(null);
            setLabelName("");
            setNewConnectionTermName("");
            setNewDescription("");
            setNewPurpose("");
        }
    };

    const handleDeleteConnection = async (connection_type_id) => {
        const connectionToDelete = connectionTypes.find(
            (connection) => connection.connection_type_id === connection_type_id
        );

        if (
            window.confirm(
                `Do you want to delete the connection type "${connectionToDelete.connection_type_name}"?`
            )
        ) {
            try {
                const token = Cookies.get("authToken");
                const response = await fetch(
                    `host/edit-delete-connectiontype/`.replace(/host/, frontend_host),
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Basic ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            connection_type_id: connection_type_id,
                        }),
                    }
                );
                const data = await response.json();

                if (data.success) {
                    fetchConnectionType(); // Refresh the list
                    setModalMessage({
                        message: "Connection type deleted successfully!",
                        type: "success",
                    });
                } else {
                    console.error(data.error);
                    setModalMessage({
                        message: "Failed to delete connection type.",
                        type: "failure",
                    });
                }
            } catch (error) {
                console.error(
                    "An error occurred while deleting the connection type:",
                    error
                );
                setModalMessage({
                    message: "An error occurred while deleting the connection type.",
                    type: "failure",
                });
            }
        }
    };
    const handleCloseModal = () => {
        setModalMessage(null); // Close the modal
    };
    console.log("connectionTypes", connectionTypes);

    const handleToggle = (id) => {
        setExpandedIndices((prevState) => ({
            ...prevState,
            [id]: !prevState[id], // Toggle the expanded state for the specific card
        }));
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
    const breadcrumbs = (
        <div className="breadcrumbs">
            <a href="/home" className="breadcrumb-item">
                Home
            </a>
            <span className="breadcrumb-separator">▶</span>
            <span className="breadcrumb-item current"> All connection types</span>
        </div>
    );
    return (
        <div id="all-connection-terms">
            {/* <Navbar content={content} breadcrumbs={breadcrumbs}/> */}
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
            <div style={{ marginTop: "50px" }}>
                <Grid container paddingLeft={{ md: 6, sm: 2, xs: 2 }}>
                    <Grid item md={2} xs={12} sx={{ textAlign: "center" }}>
                        <h3>Connection Types</h3>
                    </Grid>
                </Grid>
                {error && <p>{error}</p>}
                <Grid container spacing={3} className="page5container" padding={{ md: 10, sm: 2, xs: 2 }}>
                    {connectionTypes.length > 0 ? (
                        connectionTypes.map((connectiontype) => {
                            const isExpanded = expandedIndices[connectiontype.connection_type_id];
                            const truncatedDescription = connectiontype.connection_description
                                ?.split(' ')
                                .slice(0, 6)
                                .join(' ');
                            return (
                                <Grid item xs={12} sm={12} md={4} key={connectiontype.connection_type_id}>
                                    <Card
                                        sx={{
                                            backgroundColor: 'white',
                                            border: '2px solid #007bff',
                                            textAlign: 'center',
                                            padding: '1rem',
                                        }}
                                    >
                                        <CardContent>
                                            <Typography
                                                variant="h5"
                                                sx={{ fontSize: '1.45rem', marginBottom: '1rem' }}
                                            >
                                                {connectiontype.connection_type_name}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {isExpanded ? (
                                                    <Typography>{connectiontype.connection_description}</Typography>
                                                ) : (
                                                    <Typography>
                                                        {truncatedDescription}...
                                                        <button
                                                            onClick={() => handleToggle(connectiontype.connection_type_id)}
                                                            style={{
                                                                background: 'transparent',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                color: 'blue',
                                                                textDecoration: 'underline',
                                                                marginLeft: '5px',
                                                            }}
                                                        >
                                                            Read more
                                                        </button>
                                                    </Typography>
                                                )}
                                            </Typography>
                                            {isExpanded && (
                                                <button
                                                    onClick={() => handleToggle(connectiontype.connection_type_id)}
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
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'center' }}>
                                            <div className="button-group">
                                                <button
                                                    onClick={() => handleEditConnectionClick(connectiontype)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDeleteConnection(connectiontype.connection_type_id)
                                                    }
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </CardActions>
                                    </Card>
                                    {showEditConnectionModal && (
                                        <div className="edit-modal">
                                            <div className="modal-content">
                                                <h3>Edit Connection Type</h3>

                                                {/* Connection Type Name Input */}
                                                <div className="form-group">
                                                    <label>Connection Type Name:</label>
                                                    <input
                                                        type="text"
                                                        value={newConnectionTypeName}
                                                        onChange={(e) =>
                                                            setNewConnectionTypeName(e.target.value)
                                                        }
                                                    />
                                                </div>

                                                {/* Description Input */}
                                                <div className="form-group">
                                                    <label>Description:</label>
                                                    <input
                                                        type="text"
                                                        value={newConnectionDescription}
                                                        onChange={(e) =>
                                                            setNewConnectionDescription(e.target.value)
                                                        }
                                                    />
                                                </div>

                                                {terms.length > 0 && (
                                                    <div>
                                                        <label htmlFor="termsDropdown">Select Term:</label>
                                                        <select
                                                            id="termsDropdown"
                                                            onChange={(e) =>
                                                                handleTermSelect(Number(e.target.value))
                                                            }
                                                        >
                                                            <option value="">None</option>
                                                            {terms.map((term) => (
                                                                <option key={term.terms_id} value={term.terms_id}>
                                                                    {term.labelName} (ID: {term.terms_id})
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {selectedTerm && selectedTerm.terms_id && (
                                                            <>
                                                                {/* Label Name */}
                                                                <div className="form-group">
                                                                    <label>Label Name:</label>
                                                                    <input
                                                                        type="text"
                                                                        value={labelName}
                                                                        onChange={(e) => setLabelName(e.target.value)}
                                                                    />
                                                                </div>

                                                                {/* Description */}
                                                                <div className="form-group">
                                                                    <label>Description:</label>
                                                                    <input
                                                                        type="text"
                                                                        value={newDescription || ""} // Ensure the value is never undefined
                                                                        onChange={(e) =>
                                                                            setNewDescription(e.target.value)
                                                                        }
                                                                    />
                                                                </div>

                                                                {/* Purpose */}
                                                                <div className="form-group">
                                                                    <label>Purpose:</label>
                                                                    <input
                                                                        type="text"
                                                                        value={newPurpose}
                                                                        onChange={(e) => setNewPurpose(e.target.value)}
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Modal Buttons */}
                                                <div className="modal-buttons">
                                                    <button
                                                        className="cancel-btn"
                                                        onClick={() => setShowEditConnectionModal(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        className="save-btn"
                                                        onClick={handleSaveConnectionChanges}
                                                    >
                                                        Save Changes
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {modalMessage && (
                                        <Modal
                                            message={modalMessage.message}
                                            type={modalMessage.type}
                                            onClose={handleCloseModal} // Close the message modal
                                        />
                                    )}
                                </Grid>
                            )

                        })
                    ) : (
                        <Typography variant="body1" padding={"30px"}>
                            No lockers found.
                        </Typography>
                    )}
                </Grid>
            </div>

        </div>
    )
}
