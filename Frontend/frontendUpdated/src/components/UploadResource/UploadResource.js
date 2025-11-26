import React, { useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useNavigate, useLocation } from 'react-router-dom';
import { usercontext } from "../../usercontext";
import "./page4.css";
import Navbar from '../Navbar/Navbar';
import Modal from '../Modal/Modal';
import { frontend_host } from '../../config';
import { Grid, TextField, Button, Select, MenuItem, InputLabel, Typography, Box, Container } from '@mui/material';
import { Padding } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import Sidebar from '../Sidebar/Sidebar';

export const UploadResource = () => {
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
  const locker = location.state ? location.state.locker : null;
  const { curruser, setUser } = useContext(usercontext);
  const [resourceName, setResourceName] = useState("");
  const [document, setDocument] = useState(null);
  const [visibility, setVisibility] = useState("public");
  const [validityTime, setValidityTime] = useState(null);
  const navigate = useNavigate();
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [permissions, setPermissions] = useState({
    share: true,
    download: true,
    subset: true,
    confer: true,
    collateral: true,
    transfer: true,
  });
  const [notifications, setNotifications] = useState([]);
  console.log("permissions", permissions)

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
  }, [curruser, navigate]);

  console.log("JSON Data", JSON.stringify(permissions))

  const handleSubmit = (event) => {
    event.preventDefault();
    if (document && document.type !== 'application/pdf') {
      setErrorModalMessage('Only PDF files are allowed.');
      setIsErrorModalOpen(true);
      return;
    }

    const data = new FormData();
    data.append('locker_name', locker.name);
    data.append('resource_name', resourceName);
    data.append('type', visibility);
    data.append('document', document);
    data.append('validity_time', validityTime); // Add validity time
    // data.append("reshare", permissions.reshare);
    // data.append("download", permissions.download);
    // data.append("aggregate", permissions.aggregate);
    data.append('post_conditions', JSON.stringify(permissions))
    const token = Cookies.get('authToken');

    fetch('host/upload-resource_v2/'.replace(/host/, frontend_host), {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${token}`
      },
      body: data,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log("Resource uploaded:", data);
          navigate("/view-locker", { state: { locker } });
        } else {
          console.error("Error:", data.error);
          alert(data.error);
        }
      })
      .catch(error => {
        console.error("Error:", error);
        alert("An error occurred while uploading the resource");
      });
  };

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setPermissions((prevPermissions) => ({
      ...prevPermissions,
      [name]: checked,
    }));
  };

  const handleClick = (locker) => {
    navigate('/view-locker', { state: { locker } });
  };


  const content = (
    <>
      <div className="navbarBrands">Locker: {locker.name}</div>
      <div className="navbarBrands">Owner: {capitalizeFirstLetter(curruser.username)}</div>
      {/* <span className='uploadDescription'><p>{locker.description}</p></span> */}
    </>
  );

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleClick(locker)} class="breadcrumb-item">View Locker</span>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">Upload Resource</span>
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
      <div className="locker-header">
        <div className="locker-text">
          <div className="navbar-content">{content}</div>
        </div>
        <div className="navbar-breadcrumbs">{breadcrumbs}</div>
      </div>
      {/* <Navbar content={content} breadcrumbs={breadcrumbs} /> */}
      {isErrorModalOpen && (
        <Modal
          message={errorModalMessage}
          onClose={() => setIsErrorModalOpen(false)}
        />
      )}

      <div style={{ marginTop: "50px" }}>
        {/* <div className='uploadDescriptions'>
          <p>{locker.description}</p>
        </div> */}
        <div className="container">
          <Box className="row justify-content-center" margin={{ md: "0", xs: "1px" }}>
            <div className="col-md-8 col-sm-12 p-4 border border-primary rounded shadow">
              <h2 className="text-center mb-4 page4resourceHeading">Resources</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="resourceName" className="form-label fw-bold">Resource Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="resourceName"
                    placeholder="Enter resource name"
                    value={resourceName}
                    onChange={(e) => setResourceName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="document" className="form-label fw-bold">Select File</label>
                  <input
                    type="file"
                    className="form-control"
                    id="document"
                    onChange={(e) => setDocument(e.target.files[0])}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="visibility" className="form-label fw-bold">Visibility</label>
                  <select
                    className="form-select"
                    id="visibility"
                    value={visibility}
                    onChange={(e) => setVisibility(e.target.value)}
                    required
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="validityTime" className="form-label fw-bold">Validity Time</label>
                  <input
                    type="date"
                    className="form-control"
                    id="validityTime"
                    value={validityTime}
                    onChange={(e) => setValidityTime(e.target.value)}
                    required
                  />
                </div>
                <div className="mt-3">
                  <label className="form-label fw-bold mb-2">Permissions</label>
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
                </div>



                <div className="text-center">
                  <button type="submit" className="btn btn-primary">Submit</button>
                </div>
              </form>
            </div>
          </Box>
        </div>
      </div>
    </div>
  );
};
