import React, { useState, useEffect, useContext } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import Cookies from "js-cookie"
import { Grid } from "@mui/material"
import { FaChevronDown, FaChevronRight } from "react-icons/fa"
import Navbar from "../Navbar/Navbar"
import { usercontext } from "../../usercontext"
import { frontend_host } from "../../config"
import "./CreateGlobalConnectionType.css"
import "../DPIdirectory/DPIdirectory.css"
import Sidebar from "../Sidebar/Sidebar"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

const COMPONENT_ID = "create-global-connection-type"

export default function CreateGlobalConnectionType() {
  const location = useLocation();
  const [connectionTypes, setConnectionTypes] = useState([])
  const [error, setError] = useState(null)
  const [expandedStates, setExpandedStates] = useState({})
  const navigate = useNavigate()
  const { curruser } = useContext(usercontext)
  const isSystemAdmin = curruser && ["sys_admin", "system_admin"].includes(curruser.user_type)
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
      navigate("/")
      return
    }

    fetchConnectionTypes()
  }, [curruser, navigate])

  const fetchConnectionTypes = async () => {
    try {
      const token = Cookies.get("authToken")
      const response = await fetch(`${frontend_host}/get-template-or-templates/`, {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch connection types")
      }

      const data = await response.json()
      if (data.data) {
        setConnectionTypes(data.data)
      } else {
        setError("No connection types found.")
      }
    } catch (error) {
      setError("An error occurred while fetching connection types.")
      console.error("Error fetching connection types:", error)
    }
  }

  const handleAddNewConnectionType = () => navigate("/ConnectionTermsGlobal")

  const handleConnectionTypeClick = (type) => {
    const template_Id = type.global_connection_type_template_id
    if (!template_Id) {
      setError("Template ID is missing or invalid.")
      return
    }
    navigate("/GlobalTermsView", {
      state: {
        connectionTypeName: type.global_connection_type_name,
        connectionTypeDescription: type.global_connection_type_description,
        template_Id: template_Id,
      },
    })
  }

  const handleDomainToggle = (domain, type) => {
    setExpandedStates((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [domain]: !prev[type]?.[domain],
      },
    }))
  }

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  const renderConnectionList = (domain, globalType) => {
    const filteredTypes = connectionTypes.filter((type) => type.domain === domain && type.globaltype === globalType)

    return (
      <div key={`${domain}-${globalType}`}>
        <div className="domain-header" onClick={() => handleDomainToggle(domain, globalType)}>
          {expandedStates[globalType]?.[domain] ? <FaChevronDown /> : <FaChevronRight />}
          <span className="domain-title">{capitalizeFirstLetter(domain)}</span>
        </div>
        {expandedStates[globalType]?.[domain] && (
          <ol className="connection-list">
            {filteredTypes.map((type) => (
              <li key={type.global_connection_type_template_id} className="connection-item">
                <span className="connection-link" onClick={() => handleConnectionTypeClick(type)}>
                  {type.global_connection_type_name}
                </span>
              </li>
            ))}
            {filteredTypes.length === 0 && (
              <li className="no-connection-item">
                No {globalType === "policy" ? "policies" : `${globalType}s`} found for this domain.
              </li>
            )}
          </ol>
        )}
      </div>
    )
  }

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      {/* <span className="breadcrumb-separator">▶</span>
      <a href="/dpi-directory" className="breadcrumb-item">
        User Directory
      </a> */}
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">GlobalConnectionDirectory</span>
    </div>
  )

  const allDomains = ["health", "finance", "education", "personal data"]

  return (
    <div id={COMPONENT_ID} className="manage-connection-page">
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
        {/* <div className="locker-text">
          <div className="navbar-content">{content}</div>
        </div> */}
        <div className="navbar-breadcrumbs mt-2">{breadcrumbs}</div>
      </div>
      {/* <Navbar breadcrumbs={breadcrumbs} /> */}
      <div className="dpi-directories" style={{ marginTop: "45px" }}>
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
        {/* <div> {breadcrumbs}</div> */}
        <Grid container className="manage-connection-content">
          <Grid item xs={12}>
            <h3>Global Connection Directory</h3>
            {error && <p className="error">{error}</p>}

            <div className="section">
              <h4>Policies</h4>
              {allDomains.map((domain) => renderConnectionList(domain, "policy"))}
            </div>

            <div className="section">
              <h4>Templates</h4>
              {allDomains.map((domain) => renderConnectionList(domain, "template"))}
            </div>

            {isSystemAdmin && (
              <div className="add-connection-type-container">
                <button className="add-connection-type-button" onClick={handleAddNewConnectionType}>
                  Add New Global Connection Type
                </button>
              </div>
            )}
          </Grid>
        </Grid>
      </div>
    </div>
  )
}

