import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { usercontext } from "../../usercontext"
import Cookies from "js-cookie"
import Navbar from '../Navbar/Navbar';
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import "./directory.css";
import { frontend_host } from "../../config"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from "../Sidebar/Sidebar.js";

export const DirectoryPage = () => {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
    const { curruser, setUser } = useContext(usercontext)
  const [notifications, setNotifications] = useState([]);
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleSubmenu = (menu) =>
    setOpenSubmenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
    const navigate = useNavigate();
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
    const breadcrumbs = (
        <div className="breadcrumbs">
          <a href="/home" className="breadcrumb-item">
            Home
          </a>
          <span className="breadcrumb-separator">▶</span>
          <span className="breadcrumb-item current">Directory</span>
        </div>
      )
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
            {/* <Navbar breadcrumbs={breadcrumbs} /> */}
            <Box className="landing-page">
                <div className="landing-page-container">
                    <h1>Directory</h1>
                    <p>Choose an option to continue:</p>

                    <Grid
                        container
                        spacing={3}
                        className="landing-page-grid"
                        alignItems="center"
                        justifyContent="center"
                    >

                        <Grid item xs={12} sm={6} md={6}>
                            <Box
                                onClick={() => navigate("/dpi-directory")}
                                className="landing-page-card"
                            >
                                DPI Directory
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} md={6}>
                            <Box
                                onClick={() => navigate("/create-global-connection-type")}
                                className="landing-page-card"
                            >
                                Global Connection Directory
                            </Box>
                        </Grid>


                    </Grid>
                </div>
            </Box>
        </div>
    );
};

export default DirectoryPage;
