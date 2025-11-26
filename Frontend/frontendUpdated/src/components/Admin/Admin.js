import React, { useState, useEffect, useContext } from "react";
import { usercontext } from "../../usercontext";
import { ConnectionContext } from "../../ConnectionContext";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import "./Admin.css";
import Navbar from "../Navbar/Navbar";
import Modal from "../Modal/Modal"; // Import the Modal component
import { frontend_host } from "../../config";
import { Grid, Button } from '@mui/material'
import Sidebar from "../Sidebar/Sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
// import { Menu } from "lucide-react";

export const Admin = () => {
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
  const location = useLocation();
  const navigate = useNavigate();
  const [lockers, setLockers] = useState([]);
  const [otherConnections, setOtherConnections] = useState([]);
  const [error, setError] = useState(null);
  const { locker_conn, setLocker_conn } = useContext(ConnectionContext);
  const { curruser } = useContext(usercontext);
  const [newLockerName, setNewLockerName] = useState("");
  const [description, setDescription] = useState("");
  const [editingLocker, setEditingLocker] = useState(null);
  const [locker, setLocker] = useState(() => {
    const storedLocker = localStorage.getItem("locker");
    return storedLocker ? JSON.parse(storedLocker) : location.state || null;
  });
  const [showInfo, setShowInfo] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMessage, setModalMessage] = useState(null); // State for modal message
  const {
    connectionName,
    hostLockerName,
    connectionTypeName,
    connectionDescription,
    createdtime,
    validitytime,
    hostUserUsername,
  } = location.state || {};
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [newConnectionTermName, setNewConnectionTermName] = useState(""); // For the new term name
  const [labelName, setLabelName] = useState("");
  const [terms, setTerms] = useState([]);
  const [connectionDetails, setConnectionDetails] = useState(null); // New state to store full connection data
  const authToken = Cookies.get("authToken");
  const [editingConnection, setEditingConnection] = useState(null); // State for the connection being edited
  const [newConnectionTypeName, setNewConnectionTypeName] = useState(""); // New connection type name
  const [newConnectionDescription, setNewConnectionDescription] = useState(""); // New connection description
  const [selectedConnectionTerm, setSelectedConnectionTerm] = useState(""); // Selected connection term
  const [showEditConnectionModal, setShowEditConnectionModal] = useState(false); // Show/hide the modal for editing connection types
  const [newDescription, setNewDescription] = useState(""); // New description
  const [newPurpose, setNewPurpose] = useState(""); // New purpose
  const [refreshToggle, setRefreshToggle] = useState(false); // New state variable
  const [notifications, setNotifications] = useState([]);

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

    if (location.state) {
      setLocker(location.state);
      setLocker_conn(location.state);
      localStorage.setItem("locker", JSON.stringify(location.state));
    } else if (locker) {
      localStorage.setItem("locker", JSON.stringify(locker));
    }

    fetchOtherConnections();
    fetchUserLockers();
  }, [curruser, locker, location.state]);

  const handleEditClick = (locker) => {
    setEditingLocker(locker.locker_id);
    setNewLockerName(locker.name);
    setDescription(locker.description);
    setShowEditModal(true);
  };

  const handleSaveClick = async () => {
    try {
      const token = Cookies.get("authToken");

      const lockerToUpdate = lockers.find(
        (locker) => locker.locker_id === editingLocker
      );
      if (!lockerToUpdate) {
        console.error("Locker not found.");
        return;
      }

      const response = await fetch(
        `host/update-delete-locker/`.replace(/host/, frontend_host),
        {
          method: "PUT",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locker_name: lockerToUpdate.name,
            new_locker_name: newLockerName,
            description: description,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (data.message === "Locker updated successfully.") {
          fetchUserLockers();
          setEditingLocker(null);
          setShowEditModal(false);
          setModalMessage({
            message: "Locker updated successfully!",
            type: "success",
          });
        } else {
          console.error(data.message);
          setModalMessage({
            message: "Failed to update locker.",
            type: "failure",
          });
        }
      } else {
        console.error(
          "Failed to update locker:",
          data.message || "Unknown error"
        );
        setModalMessage({
          message: "Failed to update locker.",
          type: "failure",
        });
      }
    } catch (error) {
      console.error("An error occurred while updating the locker:", error);
      setModalMessage({
        message: "An error occurred while updating the locker.",
        type: "failure",
      });
    }
  };

  const handleDeleteClick = (locker_id) => {
    const lockerToDelete = lockers.find(
      (locker) => locker.locker_id === locker_id
    );
    if (
      window.confirm(
        `Do you want to delete the locker "${lockerToDelete.name}"?`
      )
    ) {
      try {
        const token = Cookies.get("authToken");
        fetch(`host/update-delete-locker/`.replace(/host/, frontend_host), {
          method: "DELETE",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            locker_name: lockerToDelete.name,
          }),
        }).then(async (response) => {
          const data = await response.json();
          if (data.message.includes("successfully deleted")) {
            fetchUserLockers();
            setEditingLocker(null);
            setShowEditModal(false);
            setModalMessage({
              message: "Locker deleted successfully!",
              type: "success",
            });
          } else {
            console.error(data.message);
            setModalMessage({
              message: "Failed to delete locker.",
              type: "failure",
            });
          }
        });
      } catch (error) {
        console.error("An error occurred while deleting the locker.");
        setModalMessage({
          message: "An error occurred while deleting the locker.",
          type: "failure",
        });
      }
    }
  };

  const fetchOtherConnections = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `host/get-connection-type/`.replace(/host/, frontend_host),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      console.log(data);
      if (data.success) {
        setOtherConnections(data.connection_types);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError("An error occurred while fetching other connections");
    }
  };

  const fetchUserLockers = async () => {
    try {
      const token = Cookies.get("authToken");
      const response = await fetch(
        `host/get-lockers-user/`.replace(/host/, frontend_host),
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
        setLockers(data.lockers);
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching lockers.");
    }
  };

  const gotopage12createconnection = () => {
    navigate("/connection", { state: { locker } });
  };

  const filteredConnections = otherConnections.filter(
    (connection) => connection.owner_locker === locker.locker_id
  );

  const filteredLockers = lockers.filter(
    (l) => l.locker_id === locker.locker_id
  );

  const handleCloseModal = () => {
    setModalMessage(null); // Close the modal
  };

  const handleClick = (locker) => {
    console.log("lockers", locker)
    navigate('/view-locker', { state: { locker } });
  };

  const content = (
    <div className="navbarBrands">
      {/* ADD THIS */}
      <p>Locker Admin: {locker.name}</p>
    </div>
  );

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleClick(locker)} className="breadcrumb-item">View Locker</span>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">Locker Admin</span>
    </div>
  )

  const handleDeleteConnection = async (connection_type_id) => {
    const connectionToDelete = otherConnections.find(
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
          fetchOtherConnections(); // Refresh the list
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

  const handleEditConnectionClick = async (connection) => {
    setEditingConnection(connection.connection_type_id);
    setNewConnectionTypeName(connection.connection_type_name);
    setNewConnectionDescription(connection.connection_description);
    setSelectedConnectionTerm(""); // Clear any previous term selections
    setShowEditConnectionModal(true); // Show the modal
    await fetchTermsByConnectionType(connection.connection_type_name); // Fetch terms for this connection type
  };

  // Function to fetch connection details (terms) by connection type
  const fetchTermsByConnectionType = async (connectionTypeName) => {
    try {
      const response = await fetch(
        `http://localhost:8000/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${curruser.username}&host_locker_name=${locker.name}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setConnectionDetails(data.data); // Store the full connection data, not just obligations
        setTerms(data.data.obligations); // Still store obligations separately for dropdown
      } else {
        console.error("Failed to fetch connection details");
      }
    } catch (error) {
      console.error("Error fetching terms:", error);
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
        fetchOtherConnections();
        setShowEditConnectionModal(false);
        setModalMessage({
          message: "Connection updated successfully!",
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
  const handleToggle = (id) => {
    setShowInfo(showInfo === id ? null : id); // Toggle visibility
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
      <Button onClick={gotopage12createconnection} className="btn-color" style={{ marginTop: "50px", marginLeft: "30px", padding: "8px" }}>
        Create New Connection Type
      </Button>
      <Grid container padding={"30px"}>
        <Grid item md={5.7} xs={12} className="page8parent">
          <div className="descriptionadmin">Existing Connections Type</div>
          {filteredConnections.length > 0 ? (
            filteredConnections.map((connection) => (
              <div
                key={connection.connection_type_id}
                className="page8connections"
              >
                <h4
                  className="clickable-connection-name"
                  onClick={() => {
                    console.log("Navigating with the following data:");
                    console.log(
                      "Connection Type Name:",
                      connection.connection_type_name,
                      connection.connectionDescription,
                      connection.created_time,
                      connection.validity_time
                    );
                    console.log("Host Locker Name:", locker.name);
                    console.log("Host User Username:", curruser?.username);
                    console.log("Locker:", locker);
                    navigate("/display-terms", {
                      state: {
                        connectionTypeName: connection.connection_type_name,
                        hostLockerName: locker.name,
                        hostUserUsername: curruser?.username,
                        locker: locker,
                        connectionDescription: connection.connection_description,
                        createdtime: connection.created_time,
                        validitytime: connection.validity_time,
                      },
                    });
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "inherit",
                    fontSize: "19px"
                  }}
                >
                  {connection.connection_type_name}
                </h4>
                <>
                  <div style={{ marginTop: "-12px" }}>
                    <button onClick={() => handleToggle(connection.connection_type_id)} style={{
                      textDecoration: "underline",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      color: "blue",
                      fontSize: "14px",

                    }}>
                      {showInfo === connection.connection_type_id ? "Info" : "Info"}
                    </button>
                  </div>
                  {showInfo === connection.connection_type_id && (
                    <div>
                      <p>{connection.connection_description}</p>
                      <div>
                        <p>
                          Created On:{" "}
                          {new Date(connection.created_time).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p>
                          Valid Until:{" "}
                          {new Date(connection.validity_time).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </>
                <div className="button-group">
                  <Button onClick={() => handleEditConnectionClick(connection)}>
                    Edit
                  </Button>
                  <Button
                    onClick={() =>
                      handleDeleteConnection(connection.connection_type_id)
                    }
                  >
                    Delete
                  </Button>
                </div>

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
                        <Button
                          className="btn-color"
                          onClick={() => setShowEditConnectionModal(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          className="btn-color"
                          onClick={handleSaveConnectionChanges}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No connections found.</p>
          )}
        </Grid>
        {/* </Grid> */}

        <Grid item md={0.6} xs={12}></Grid>

        {/* <Grid container padding={"30px"}> */}
        <Grid item className="page8parent" md={5.7} xs={12} marginTop={{md:0, xs:"1rem" }}>
          <div className="descriptionadmin">Locker</div>
          {filteredLockers.length > 0 ? (
            filteredLockers.map((locker) => (
              <div key={locker.locker_id} className="page8connections">
                <h4 style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "inherit",
                  fontSize: "19px",
                }}>{locker.name}</h4>
                <p>{locker.description}</p>
                <div className="button-group">
                  <Button onClick={() => handleEditClick(locker)}>Edit</Button>
                  <Button onClick={() => handleDeleteClick(locker.locker_id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p>No lockers found.</p>
          )}
        </Grid>
        {/* Edit Locker Modal */}
        {showEditModal && (
          <div className="edit-modal">
            <div className="modal-content">
              <h3>Edit Locker</h3>
              <div className="form-group">
                <label>Locker Name:</label>
                <input
                  type="text"
                  value={newLockerName}
                  onChange={(e) => setNewLockerName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Description:</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="modal-buttons">
                <Button
                  className="btn-color"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </Button>
                <Button className="btn-color" onClick={handleSaveClick}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Message Modal */}
        {modalMessage && (
          <Modal
            message={modalMessage.message}
            type={modalMessage.type}
            onClose={handleCloseModal} // Close the message modal
          />
        )}
      </Grid>
    </div>
  );
};
