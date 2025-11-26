import React, { useState, useContext, useEffect } from "react";
import "./FreezeLockerConnection.css";
import Modal from '../Modal/Modal.jsx';
import Navbar from "../Navbar/Navbar";
import { usercontext } from '../../usercontext';
import Cookies from 'js-cookie';
import Sidebar from "../Sidebar/Sidebar.js";
import { frontend_host } from "../../config.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';


export default function FreezeLockerConnection() {
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
  const [lockerName, setLockerName] = useState("");
  const [connectionName, setConnectionName] = useState("");
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState({ locker: false, connection: false });
  const { curruser } = useContext(usercontext);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userConnections, setConnections] = useState([]);
  const [userLockers, setUserLockers] = useState([]);
  const [error, setError] = useState(null);
  const [freezeMode, setFreezeMode] = useState(true); //state for toggle
  const [connectionId, setConnectionId] = useState("");
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
          console.log("dpi ", data);
          setUsers(data.users);
        } else {
          setError(data.message || data.error);
        }
      })
      .catch(error => {
        setError("An error occurred while fetching users.");
        console.error("Error:", error);
      });

  }, []);

  const fetchLockers = async () => {
    if (!selectedUser) return;
    const token = Cookies.get('authToken');
    const params = new URLSearchParams({ username: selectedUser.username });

    try {
      const response = await fetch(`host/get-lockers-user/?${params}`.replace(/host/, frontend_host), {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch lockers');
        console.error('Error fetching lockers:', errorData);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUserLockers(data.lockers.filter(locker => locker.is_frozen === !freezeMode));
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching this user's lockers.");
      console.error("Error:", error);
    }
  };

  const fetchConnections = async () => {
    const token = Cookies.get('authToken');
    try {
      const response = await fetch('host/get-all-connections/'.replace(/host/, frontend_host), {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch connections');
        console.error('Error fetching connections:', errorData);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setConnections(data.connections.filter(connection => connection.is_frozen === !freezeMode));
      } else {
        setError(data.message || data.error);
      }
    } catch (error) {
      setError("An error occurred while fetching connections.");
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    if (selectedUser) {
      fetchLockers();
    }
  }, [selectedUser, freezeMode]);

  useEffect(() => {
    fetchConnections();
  }, [freezeMode]);


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
  };

  const handleFreezeLocker = async () => {
    if (!lockerName) {
      setModalMessage({ message: 'Please enter a locker name', type: 'info' });
      setIsModalOpen(true);
      return;
    }

    const action = freezeMode ? 'freeze' : 'unfreeze'; // Determine action based on toggle
    console.log("action in free", action);

    setIsLoading((prevState) => ({ ...prevState, locker: true }));

    const token = Cookies.get('authToken');

    try {
      const response = await fetch("host/freeze-unfreeze-locker/".replace(/host/, frontend_host), {
        method: "PUT",
        body: JSON.stringify({ locker_name: lockerName, username: selectedUser.username, action }),
        headers: {
          'Authorization': `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setModalMessage({ message: data.message || 'Locker freeze request successful', type: 'success' });
        //to clear input fields
        setLockerName("");
        setSelectedUser(null);
        //fetching updated list of lockers and connections
        await fetchLockers();
        await fetchConnections();
      } else {
        setModalMessage({ message: data.error || data.message || 'Locker freeze request failed', type: 'failure' });
      }
      setIsModalOpen(true);
    } catch (error) {
      console.log('er', error);
      setModalMessage({ message: `Error while performing ${action}`, type: 'failure' });
      setIsModalOpen(true);
    } finally {
      setIsLoading((prevState) => ({ ...prevState, locker: false }));
    }
  };

  const handleFreezeConnection = async () => {
    if (!connectionName) {
      setModalMessage({ message: 'Please enter a connection name', type: 'info' });
      setIsModalOpen(true);
      return;
    }

    const action = freezeMode ? 'freeze' : 'unfreeze'; // Determine action based on toggle
    console.log("action in conn", action);

    setIsLoading((prevState) => ({ ...prevState, connection: true }));

    const token = Cookies.get('authToken');

    try {
      const response = await fetch("host/freeze-unfreeze-connection/".replace(/host/, frontend_host), {
        method: "PUT",
        //curruser is user obj
        body: JSON.stringify({ connection_id: connectionId, connection_name: connectionName, action }),
        headers: {
          'Authorization': `Basic ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      if (response.ok) {
        setModalMessage({ message: data.message || 'Connection freeze request successful', type: 'success' });
        //to clear input fields 
        setConnectionName("");
        setConnectionId("");
        //fetching updated list of lockers and connections
        await fetchLockers();
        await fetchConnections();
      } else {
        setModalMessage({ message: data.error || 'Connection freeze request failed', type: 'failure' });
      }
      setIsModalOpen(true);
    } catch (error) {
      console.log("er", error);
      setModalMessage({ message: `Error while performing ${action}`, type: 'failure' });
      setIsModalOpen(true);
    } finally {
      setIsLoading((prevState) => ({ ...prevState, connection: false }));
    }
    console.log("id", connectionId);
  };

  const toggleFreezeMode = () => {
    // setIsFreezing(prev => !prev);
    setFreezeMode(prev => !prev);
    setLockerName("");
    setSelectedUser(null);
  };

  // const filteredLockers = userLockers.filter(locker => locker.is_frozen === isFreezing);
  // const filteredConnections = userConnections.filter(connection => connection.is_frozen === isFreezing);

  const code = (<>
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
    {/* <Navbar /> */}
    <button id="toggle" onClick={toggleFreezeMode}>
      {freezeMode ? 'Switch to Unfreeze' : 'Switch to Freeze'}
    </button>
    <div className="freeze-section">
      <>
        <div className="freeze-locker">
          <label>Select Username</label>
          <select
            onChange={(e) => {
              const selected = users.find(user => user.username === e.target.value);
              setSelectedUser(selected);
            }}
            value={selectedUser ? selectedUser.username : ""}
          >
            <option value="">Select a user</option>
            {users.map(user => (
              <option key={user.user_id} value={user.username}>
                {user.username}
              </option>
            ))}
          </select>
          <label>Select Locker Name</label>
          <select
            onChange={(e) => setLockerName(e.target.value)}
            value={lockerName}
          >
            <option value="">Select a locker</option>
            {userLockers.map(locker => (
              <option key={locker.locker_id} value={locker.name}>
                {locker.name}
              </option>
            ))}
          </select>
          <button onClick={handleFreezeLocker} disabled={isLoading.locker}>
            {isLoading.locker ? (freezeMode ? "Freezing Locker..." : "Unfreezing Locker...") : (freezeMode ? "Freeze Locker" : "Unfreeze Locker")}
          </button>
        </div>

        <div className="freeze-connection">
          <label>Enter Connection Name</label>
          <select
            onChange={(e) => {
              const selectedConnection = userConnections.find(connection => connection.connection_name === e.target.value);
              console.log(selectedConnection);
              setConnectionName(e.target.value);
              setConnectionId(selectedConnection ? selectedConnection.connection_id : "");
            }}
            value={connectionName}
          >
            <option value="">Select a connection</option>
            {userConnections.map(connection => (
              <option key={connection.connection_id} value={connection.connection_name}>
                {connection.connection_name}
              </option>
            ))}
          </select>
          <button onClick={handleFreezeConnection} disabled={isLoading.connection}>
            {isLoading.connection ? (freezeMode ? "Freezing Connection..." : "Unfreezing Connection...") : (freezeMode ? "Freeze Connection" : "Unfreeze Connection")}
          </button>
        </div>
      </>
      {isModalOpen && <Modal message={modalMessage.message} onClose={handleCloseModal} type={modalMessage.type} />}
    </div>
  </>);
  return (
    <>

      {((curruser.user_type === 'sys_admin' || curruser.user_type === 'system_admin') && (curruser.user_type !== 'moderator')) &&
        <div className="content" style={{ marginTop: "100px" }}>{code} <Sidebar /></div>}

      {curruser.user_type === 'moderator' && <>{code}</>}

    </>
  );

}

