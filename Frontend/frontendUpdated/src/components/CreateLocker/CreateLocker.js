import { useState, useEffect, useContext } from "react"
import { useNavigate } from "react-router-dom"
import { usercontext } from "../../usercontext"
import Cookies from "js-cookie"
import Navbar from "../Navbar/Navbar"
import { frontend_host } from "../../config"
import { Container, Grid, TextField, Button, Typography, Box } from "@mui/material"
import Sidebar from "../Sidebar/Sidebar"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import "./page2.css"

export const CreateLocker = () => {

  const navigate = useNavigate()
  const [lockerName, setLockerName] = useState("")
  const [description, setDescription] = useState("")
  const { curruser, setUser } = useContext(usercontext)
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Home");
  const [openSubmenus, setOpenSubmenus] = useState({
    directory: false,
    settings: false,
  });
  const [notifications, setNotifications] = useState([]);
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
  const handleSubmit = (event) => {
    event.preventDefault()

    const token = Cookies.get("authToken")

    // Prepare data to send
    const data = new FormData()
    data.append("name", lockerName.trim())
    data.append("description", description)

    // Send data to the backend
    fetch("host/create-locker/".replace(/host/, frontend_host), {
      method: "POST",
      headers: {
        Authorization: `Basic ${token}`, // Add token to the headers
      },
      body: data,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("Locker created:", data)
          // Redirect to another page or show success message
          navigate("/home")
        } else if (data.error === "Locker with this name already exists") {
          // Handle case where locker with same name exists
          alert("A locker with this name already exists. Please choose a different name.")
        } else {
          console.error("Error:", data.error)
          // Show error message for other cases
          alert(data.error)
        }
      })
      .catch((error) => {
        console.error("Error:", error)
        // Show error message
        alert("An error occurred while creating the locker")
      })
  }

  useEffect(() => {
    if (!curruser) {
      navigate("/")
      return
    }
  }, [curruser, navigate]) // Added curruser and navigate to dependencies

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">Create Locker</span>
    </div>
  )

  const content = (
    <>
      <div className="navbarBrands">Create Locker</div>
    </>
  );


  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
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
      {/* <Navbar breadcrumbs={breadcrumbs} /> */}

      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Container maxWidth="sm">
          <Box
            sx={{
              border: "1px solid #4285f4",
              borderRadius: "8px",
              padding: "2rem",
              backgroundColor: "white",
              width: "100%",
              maxWidth: "500px",
              margin: "0 auto",
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: "bold", color: "#333" }}>
              Create New Locker
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "medium" }}>
                    Locker Name
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={lockerName}
                    onChange={(e) => setLockerName(e.target.value)}
                    placeholder="Enter Locker Name"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: "#4285f4",
                        },
                        "&:hover fieldset": {
                          borderColor: "#4285f4",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: "medium" }}>
                    Description
                  </Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter description"
                    multiline
                    rows={4}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": {
                          borderColor: "#4285f4",
                        },
                        "&:hover fieldset": {
                          borderColor: "#4285f4",
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                      backgroundColor: "#4285f4",
                      color: "white",
                      padding: "0.75rem",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: "#3367d6",
                      },
                    }}
                  >
                    Create Locker
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box>
        </Container>
      </div>
    </div>
  )
}

