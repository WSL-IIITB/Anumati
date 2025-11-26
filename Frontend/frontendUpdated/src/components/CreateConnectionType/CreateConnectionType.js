import React, { useContext, useEffect, useState } from 'react';
import "./CreateConnectionType.css";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from 'js-cookie';
import { usercontext } from "../../usercontext";
import Navbar from '../Navbar/Navbar';
import Sidebar from "../Sidebar/Sidebar.js";
import { frontend_host } from '../../config';
import { Grid, Box, Button } from '@mui/material'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

export const CreateConnectionType = () => {
    const navigate = useNavigate();
    const location = useLocation();
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
    const { curruser, setUser } = useContext(usercontext);
    const [isOpen, setIsOpen] = useState(false);
    const [lockers, setLockers] = useState([]); // Initialize as empty array
    const [error, setError] = useState(null);
    const [selectedLocker, setSelectedLocker] = useState(null);
    const [connectionTypes, setConnectionTypes] = useState([]); // Initialize as empty array
    const [notifications, setNotifications] = useState([]);
    // const [selectedConnectionType, setSelectedConnectionType] = useState(null);
    const [parentUser, setParentUser] = useState(location.state ? location.state.hostuser : null);
    const [locker, setLocker] = useState(location.state ? location.state.hostlocker : null);
    const [selectedConnectionType, setSelectedConnectionType] = useState(location.state ? location.state.selectedConnectionType : null);
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
        fetch('host/get-lockers-user/'.replace(/host/, frontend_host), {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setLockers(data.lockers || []); // Ensure array
                    if (!selectedLocker && data.lockers.length > 0) {
                        setSelectedLocker(data.lockers[0]);
                    }
                } else {
                    setError(data.message || data.error);
                }
            })
            .catch(error => {
                setError("An error occurred while fetching lockers.");
                console.error("Error:", error);
            });
    }, [curruser]);

    useEffect(() => {
        if (parentUser && locker) {
            const token = Cookies.get('authToken');
            const params = new URLSearchParams({ guest_locker_name: locker.name, guest_username: parentUser.username });
            fetch(`host/get-other-connection-types/?${params}`.replace(/host/, frontend_host), {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        setConnectionTypes(data.connection_types || []); // Ensure array
                        if (!selectedConnectionType && data.connection_types.length > 0) {
                            setSelectedConnectionType(data.connection_types[0]);
                        }
                    } else {
                        setError(data.message || data.error);
                    }
                })
                .catch(error => {
                    setError("An error occurred while fetching connection types.");
                    console.error("Error:", error);
                });
        }
    }, [parentUser, locker]);

    const handleLockerChange = (event) => {
        const selectedLockerName = event.target.value;
        const locker = lockers.find(l => l.name === selectedLockerName);
        setSelectedLocker(locker);
    };

    const handleConnectionTypeChange = (event) => {
        const selectedConnectionTypeName = event.target.value;
        const connectionType = connectionTypes.find(ct => ct.connection_type_name === selectedConnectionTypeName);
        setSelectedConnectionType(connectionType);
    };

    console.log("locker", locker.name);
    const handleNextClick = (event) => {
        event.preventDefault(); // Prevent the default form submission

        // Ensure all required data is present
        if (!selectedConnectionType || !parentUser || !curruser || !locker || !selectedLocker) {
            console.error('Missing necessary data to proceed');
            setError("Required data is missing.");
            return;
        }

        console.log('Navigating to show connection terms');

        // Navigate to the terms page with state data
        navigate('/show-connection-terms', {
            state: {
                connectionTypeName: selectedConnectionType.connection_type_name,
                connectionTypeID: selectedConnectionType.connection_type_id,
                connectionDescription: selectedConnectionType.connection_description,
                locker: selectedLocker.name,
                guestUserUsername: curruser.username,
                hostUserUsername: parentUser.username,
                hostLockerName: locker.name,
                guestLockerName: selectedLocker.name,
                connectionName: `${selectedConnectionType.connection_type_name}-${curruser.username}:${parentUser.username}`,
                showConsent: true,
                lockerComplete: selectedLocker,
                hostLocker: locker,
                agrees: true
            }
        });
    };

    const handleTargetUserView = () => {
        navigate('/target-user-view', {
            state: {
                user: { username: parentUser.username, description: parentUser.description }
            },
        });
    }

    const handleTargetLockerView = () => {
        navigate('/target-locker-view', {
            state: {
                user: { username: parentUser.username },
                locker: locker
            }
        });
    }

    console.log(connectionTypes);
    const content = (
        <>
            <select className="navbarBrands" style={{ fontSize: "1rem", marginTop: "5px", padding: "8px", borderRadius: "5px" }} name="connectionType" onChange={handleConnectionTypeChange} value={selectedConnectionType ? selectedConnectionType.connection_type_name : ''}>
                <option value="" disabled>Select Connection Type</option>
                {connectionTypes && connectionTypes.map(type => (
                    <option key={type.connection_type_id} value={type.connection_type_name}>{type.connection_type_name}</option>
                ))}
            </select>

        </>

    )

    const breadcrumbs = (
        <div className="breadcrumbs">
            <a href="/home" className="breadcrumb-item">
                Home
            </a>
            <span className="breadcrumb-separator">▶</span>
            <a className="breadcrumb-item" href="/dpi-directory">User Directory</a>
            <span className="breadcrumb-separator">▶</span>
            <span onClick={() => handleTargetUserView()} className="breadcrumb-item">TargetUserView</span>
            <span className="breadcrumb-separator">▶</span>
            <span onClick={() => handleTargetLockerView(locker)} className="breadcrumb-item">TargetLockerView</span>
            <span className="breadcrumb-separator">▶</span>
            <span className="breadcrumb-item current">MakeConnection</span>
        </div>
    )
    return (
        <div id='make-connection'>
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
                <div className="page12typeofconn">
                    <h6>
                        {selectedConnectionType && <div><b>{selectedConnectionType.connection_type_name} ({curruser.username} <i class="bi bi-arrows"></i> {parentUser.username})</b> <p className="">Description: {selectedConnectionType.connection_description}</p></div>}
                    </h6>
                </div>
                <div style={{ border: "2px solid blue", margin: "20px" }}>
                    <Grid container className="page12parentconnections">
                        <Grid item md={2.5} sm={4} xs={12}>
                            <Box className="make-Box"
                                sx={{
                                    padding: '5px 10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    boxShadow: 3,
                                    borderRadius: 2,
                                    backgroundColor: "#f9f9f9;",
                                    border: "2px solid rgb(107, 120, 231)",
                                    paddingTop: "18px"
                                }}
                            >
                                <p>Host User: {parentUser.username}</p><p style={{ marginTop: "-12px" }}>Host Locker: {locker.name}</p>
                            </Box>
                        </Grid>
                        <Grid item md={1} sm={2} xs={12}>

                        </Grid>
                        <Grid item md={3.7} sm={6} xs={12}>
                            <Box className="make-Box" marginTop={{ xs: "15px", sm: "15px", md: 0, }}
                                sx={{
                                    padding: '5px 10px',
                                    display: 'flex',
                                    // flexDirection: 'column',
                                    // justifyContent: 'center',
                                    boxShadow: 3,
                                    borderRadius: 2,
                                    backgroundColor: "#f9f9f9;",
                                    border: "2px solid rgb(107, 120, 231)",
                                    // paddingTop:"18px",
                                    paddingBottom: "18px"
                                }}
                            >
                                <Grid container>
                                    <Grid item md={4} sm={12} xs={12}>
                                        <p className='selectLocker'>Select Your Locker</p>
                                    </Grid>
                                    <Grid item md={6.5} sm={12} xs={12}>
                                        <select className="page12hostlocker" name="locker" onChange={handleLockerChange} value={selectedLocker ? selectedLocker.name : ''}>
                                            {lockers && lockers.map(locker => (
                                                <option key={locker.locker_id} value={locker.name}>{locker.name}</option>
                                            ))}
                                        </select>
                                    </Grid>
                                </Grid>
                            </Box>
                        </Grid>
                    </Grid>
                    {selectedConnectionType && (
                        <div style={{ margin: "30px" }}>
                            <Grid container className="page12paragraph" display={"flex"}>
                                {/* <u>"{selectedConnectionType.connection_type_name}"</u><span style={{marginLeft:"15px", marginRight:"15px"}}>For this connection type you will need to fulfill the following obligations. Click on the next button.</span> */}
                                <span>Click next to fulfill the obligations of this connection.</span>

                                <div>
                                    <Button style={{ marginLeft: "10px" }} onClick={handleNextClick} className="next-btn">Next</Button>
                                </div>
                            </Grid>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};