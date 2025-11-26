import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { ConnectionContext } from "../../ConnectionContext";
import { usercontext } from "../../usercontext";
import Sidebar from "../Sidebar/Sidebar";
// import { Menu } from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import "./connection.css";
import Navbar from "../Navbar/Navbar";
import Panel from "../Panel/Panel";
import { frontend_host } from "../../config";
import { Container, Grid, TextField, Button, Typography, Box } from "@mui/material";

export const Connection = () => {
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
  const [error, setError] = useState(null);
  const { curruser } = useContext(usercontext);
  const location = useLocation();
  const { locker_conn, setConnectionData } = useContext(ConnectionContext);
  const [lockers, setLockers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Local state for connection fields
  const [connectionName, setConnectionName] = useState(null);
  const [connectionDescription, setConnectionDescription] = useState(null);
  const [validity, setValidity] = useState(null);
  const [selectedLocker, setSelectedLocker] = useState(null);
  const [permissions, setPermissions] = useState({
    download: true,
    subset: true,
    share: true,
    confer: true,
    collateral: true,
    transfer: true
  });

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
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  const {
    connectionBreadcrumbs,
  } = location.state || {};
  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }
  }, []);

  useEffect(() => {
    const token = Cookies.get("authToken");

    fetch("host/get-lockers-user/".replace(/host/, frontend_host), {
      method: "GET",
      headers: {
        Authorization: `Basic ${token}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setLockers(data.lockers);
          if (!selectedLocker && data.lockers.length > 0) {
            setSelectedLocker(data.lockers[0]);
          }
        } else {
          setError(data.message || data.error);
        }
      })
      .catch((error) => {
        setError("An error occurred while fetching lockers.");
        console.error("Error:", error);
      });
  }, [curruser]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const connectionData = {
      lockerName: locker_conn?.name,
      connectionName,
      connectionDescription,
      validity,
      postConditions: permissions,
    };
    setConnectionData(connectionData);
    console.log("Form submitted");
    console.log("in connection 2", connectionData, locker_conn);
    navigate("/connectionTerms");
  };

  const locker = locker_conn

  const handleClick = (locker) => {
    console.log("lockers", locker)
    navigate('/view-locker', { state: { locker } });
  };

  const handleLockerAdmin = () => {
    navigate("/admin", { state: locker_conn });
  }


  const content = (
    <>
      <div className="navbarBrands">Locker : {locker_conn?.name}</div>
      <div className="navbarBrands">Owner : {capitalizeFirstLetter(curruser.username)} </div>
    </>
  );

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleClick(locker)} className="breadcrumb-item">View Locker</span>
      {!connectionBreadcrumbs && (
        <>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleLockerAdmin(locker)} className="breadcrumb-item">Locker Admin</span>
        </>
      )}
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">CreateConnectionType</span>
    </div>
  )
  const handleChange = (event) => {
    const { name, checked } = event.target;
    setPermissions((prevPermissions) => ({
      ...prevPermissions,
      [name]: checked,
    }));
  };
  return (
    <>
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
      {/* <Navbar content={content} breadcrumbs={breadcrumbs}></Navbar> */}
      {/* <Panel /> */}
      <Container maxWidth="md">
        <div>
          {/* <div className="connection-resourceHeading">Connection</div> */}
          <div className="connection-lockerForms">
            <Box
              sx={{
                border: '1px solid blue',
                borderRadius: '8px',
                padding: '30px',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div className="connection-resourceHeading">Connection Type</div>
              <form onSubmit={handleSubmit}>
                <Grid container className=" mb-3">
                  <Grid item md={2} sm={2} xs={12}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" >Locker
                    </Typography>
                  </Grid>
                  <Grid item md={8} sm={8} xs={12}>
                    <TextField fullWidth variant="outlined" value={locker_conn ? locker_conn.name : ""} readOnly />
                  </Grid>
                </Grid>

                <Grid container className=" mb-3">
                  <Grid item md={2} sm={2} xs={12}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" >Name
                    </Typography>
                  </Grid>
                  <Grid item md={8} sm={8} xs={12}>
                    <TextField required fullWidth variant="outlined" type="text"
                      name="connectionName"
                      placeholder="Connection Type Name"
                      onChange={(e) => {
                        const value = e.target.value;
                        const filteredValue = value.replace(/[^a-zA-Z0-9 ]/g, ' '); // Allow only letters, numbers, and spaces
                        setConnectionName(filteredValue);
                      }} />
                  </Grid>
                </Grid>

                <Grid container className=" mb-3">
                  <Grid item md={2} sm={2} xs={12}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" >Description
                    </Typography>
                  </Grid>
                  <Grid item md={8} sm={8} xs={12}>
                    <TextField required fullWidth focused multiline variant="outlined"
                      rows={4}
                      type="text"
                      name="connectionDescription"
                      placeholder="Description"
                      onChange={(e) => setConnectionDescription(e.target.value)} />
                  </Grid>
                </Grid>

                <Grid container className="mb-3">
                  <Grid item md={2} sm={2} xs={12}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" >Validity
                    </Typography>
                  </Grid>
                  <Grid item md={8} sm={8} xs={12}>
                    <TextField required fullWidth variant="outlined" type="date"
                      name="validity"
                      placeholder="Calendar Picker"
                      onChange={(e) => setValidity(e.target.value)} />
                  </Grid>
                </Grid>
                <Grid container className="mb-3">
                  <Grid item md={2} sm={2} xs={12}>
                    <Typography variant="h6" gutterBottom fontWeight="bold" >Post Conditions </Typography>
                  </Grid>
                  <Grid container md={8} sm={8} xs={12} style={{ marginLeft: "3px" }}>

                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="download"
                        name="download"
                        checked={permissions.download}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.download ? "checked" : ""}`} htmlFor="download">
                        Download
                      </label>
                    </Grid>
                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="subset"
                        name="subset"
                        checked={permissions.subset}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.subset ? "checked" : ""}`} htmlFor="subset">
                        Subset
                      </label>
                    </Grid>
                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="share"
                        name="share"
                        checked={permissions.share}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.share ? "checked" : ""}`} htmlFor="share">
                        Reshare
                      </label>
                    </Grid>
                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="confer"
                        name="confer"
                        checked={permissions.confer}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.confer ? "checked" : ""}`} htmlFor="confer">
                        Confer
                      </label>
                    </Grid>
                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="collateral"
                        name="collateral"
                        checked={permissions.collateral}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.collateral ? "checked" : ""}`} htmlFor="collateral">
                        Collateral
                      </label>
                    </Grid>
                    <Grid item md={4} sm={4} xs={6} className="mb-2">
                      <input
                        className="hidden-checkbox"
                        type="checkbox"
                        id="transfer"
                        name="transfer"
                        checked={permissions.transfer}
                        onChange={handleChange}
                      />
                      <label className={`custom-checkbox ${permissions.transfer ? "checked" : ""}`} htmlFor="transfer">
                        Transfer
                      </label>
                    </Grid>
                  </Grid>
                </Grid>
                <button type="submit">Confirm & Proceed</button>
              </form>
            </Box>
          </div>
        </div>
      </Container>
    </>
  );
};
