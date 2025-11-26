import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import Navbar from '../Navbar/Navbar';
import { frontend_host } from '../../config';
import Sidebar from '../Sidebar/Sidebar';
import './DPIdirectory.css';
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

export const DPIdirectory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const { curruser } = useContext(usercontext);
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
      navigate('/');
      return;
    }

    const token = Cookies.get('authToken');

    fetch('host/dpi-directory/'.replace(/host/, frontend_host), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          const sortedUsers = data.users.slice().sort((a, b) => a.username.localeCompare(b.username));
          setUsers(sortedUsers);
          setFilteredUsers(sortedUsers);
        } else {
          setError(data.message || data.error);
        }
      })
      .catch(error => {
        setError("An error occurred while fetching users.");
      });
  }, [curruser, navigate]);

  const handleSearch = (event) => {
    event.preventDefault();
    const results = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  };

  const handleuserclick = (user) => {
    if (curruser && curruser.username && user.username === curruser.username) {
      navigate('/home');
    } else {
      navigate(`/target-user-view`, { state: { user } });
    }
  };
  const content = (
    <>
      <div className="navbarBrands">DPI Directory</div>
    </>
  );
  const breadcrumbs = (
    <div className="breadcrumbs mt-2" >
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">User Directory</span>
    </div>

  )

  return (
    <div id="dpi-directory">
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
      <div className="page5heroContainer dpi-directories" style={{ marginTop: "12px" }}>
        {/* <h1 className="page-title " style={{ fontSize: `${48}px` }}>
         DPI Directory  
        </h1>  */}
        {/* <div> {breadcrumbs}</div> */}

        {/* <div className="sidebars">
          <button className="btn-open" type="button" data-bs-toggle="offcanvas" data-bs-target="#offcanvasScrolling" aria-controls="offcanvasScrolling"><i class="bi bi-chevron-right"></i></button>

          <div className="offcanvas offcanvas-start" data-bs-scroll="true" data-bs-backdrop="false" tabindex="-1" id="offcanvasScrolling" aria-labelledby="offcanvasScrollingLabel">
            <div className="offcanvas-header">
              <button type="button" className="btn-closes" data-bs-dismiss="offcanvas" aria-label="Close"><i class="bi bi-chevron-left"></i></button>
            </div>
            <div className="offcanvas-body">
              <ul>

                <li
                  className={location.pathname === "/dpi-directory" ? "selected" : ""}
                >
                  <Link to="/dpi-directory">User Directory</Link>
                </li>
                <li
                  className={
                    location.pathname === "/create-global-connection-type"
                      ? "selected"
                      : ""
                  }
                >
                  <Link className='links' to="/create-global-connection-type">
                    Global Connection Directory
                  </Link>
                </li>


              </ul>
            </div>
          </div>
        </div> */}
        <div className="search" style={{ marginTop: "45px" }}>
          <form onSubmit={handleSearch}>
            <div className="searchContainer" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
              <TextField
                placeholder="Search"
                variant="outlined"
                value={searchTerm}
                size='small'
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  width: "250px",
                  marginRight: '0.5rem',
                  border: "2px solid black",
                  borderRadius: "10px"
                }}

              />

              <Button
                variant="contained"
                type="submit"
                size='small'
                className='btn-color'
                sx={{ minWidth: '80px', padding: '0.5rem 1rem', fontWeight: 'bold' }}
              >
                Search
              </Button>
            </div>

          </form>
        </div>
        <Grid container spacing={3} className="page5container" padding={{ md: 10, sm: 2, xs: 2 }}>
          {error && <Typography color="error">{error}</Typography>}
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <Grid item xs={12} sm={6} md={4} key={user.user_id}>
                <Card sx={{ backgroundColor: 'white', border: '2px solid #007bff', textAlign: 'center', padding: '1rem' }}>
                  <CardContent>
                    <Typography variant="h5" sx={{ fontSize: '1.45rem', marginBottom: '1rem' }}>{user.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'center' }}>
                    <Button
                      size="small"
                      variant="contained"
                      className="btn-color subbutton"
                      onClick={() => handleuserclick(user)}
                    >
                      Enter
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))
          ) : (
            <Typography variant="body1" padding={"30px"}>No users found.</Typography>
          )}
        </Grid>
      </div>

    </div>
  );
};
