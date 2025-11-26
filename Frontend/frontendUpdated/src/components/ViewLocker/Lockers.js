import React, { useContext, useEffect, useState } from "react";
import Cookies from 'js-cookie';
import { frontend_host } from "../../config";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import "./Lockers.css";
import Sidebar from "../Sidebar/Sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Modal from "../Modal/Modal"; // Import the Modal component
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Grid,
  TextField,
} from '@mui/material';


export const AllLokers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState(null);
  const [lockers, setLockers] = useState([]);
  const { curruser } = useContext(usercontext);
  const [notifications, setNotifications] = useState([]);
  const [newLockerName, setNewLockerName] = useState("");
  const [description, setDescription] = useState("");
  const [editingLocker, setEditingLocker] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
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

  useEffect(() => {
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

    if (curruser) {
      fetchLockers();
      fetchNotifications();
    }
  }, [curruser]);

  console.log("lockers", lockers);

  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
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

  const handleCloseModal = () => {
    setModalMessage(null); // Close the modal
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
      <span className="breadcrumb-item current">Lockers</span>
    </div>
  )

  return (
    <div id="alllockers">
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
      <div style={{ marginTop: "50px" }}>
        <Grid container>
          <Grid item md={2} xs={12} sx={{ textAlign: "center" }}>
            <h3>All Lockers</h3>
          </Grid>
        </Grid>
        {error && <p>{error}</p>}
        <Grid container spacing={3} className="page5container" padding={{ md: 10, sm: 2, xs: 2 }}>
          {lockers.length > 0 ? (
            lockers.map((locker) => (
              <Grid item xs={12} sm={6} md={4} key={locker.locker_id}>
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
                      {locker.name}
                    </Typography>
                    <Typography variant="p" color="text.secondary">
                      {locker.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center' }}>
                    <div className="button-group">
                      <button
                        onClick={() => handleEditClick(locker)}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(locker.locker_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </CardActions>
                </Card>
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
                        <button
                          className="cancel-btn"
                          onClick={() => setShowEditModal(false)}
                        >
                          Cancel
                        </button>
                        <button className="save-btn" onClick={handleSaveClick}>
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
            ))
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
