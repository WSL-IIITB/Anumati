import React, { useEffect, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { usercontext } from "../../usercontext";
import { frontend_host } from "../../config";
import '../Displayterms/Displayterms.css'; // Make sure to create the relevant CSS file
import { Grid, Box } from '@mui/material';

const GlobalTermsView = () => {
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
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [termsData, setTermsData] = useState(null);
  const [error, setError] = useState(null);
  const [res, setRes] = useState(null);
  const [activeTab, setActiveTab] = useState("guest");
  const [perm, setPerm] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const { connectionTypeName, connectionTypeDescription, template_Id, hide } = location.state || {};
  const isSystemAdmin = curruser && (curruser.user_type === 'sys_admin' || curruser.user_type === 'system_admin');
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  useEffect(() => {
    if (!curruser) {
      navigate('/');
      return;
    }

    const fetchGlobalTerms = async () => {
      try {
        const token = Cookies.get("authToken");
        const apiUrl = `${frontend_host}/get-connection-terms-for-global-template/?template_Id=${template_Id}`;

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch terms: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Response:", data); // Debugging log

        if (data.data) {
          setRes(data.data);
          setTermsData(data.data.obligations);
          setPerm(data.data.permissions);
        } else {
          setError("No terms found for this global connection type.");
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
      }
    };


    fetchGlobalTerms();
  }, [curruser, template_Id, navigate]);
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
    console.log("Updated Terms Data:", termsData);
    console.log("Updated Response Data:", res);
  }, [termsData, res]);

  // const renderObligations = () => {
  //   if (termsData && termsData.obligations) {
  //     return (
  //       <ul>
  //         {termsData.obligations.map((term, index) => (
  //           <li key={index}>
  //             {term.typeOfSharing} - {term.labelName} (Host Privilege: {term.hostPermissions?.length > 0 ? term.hostPermissions.join(", ") : "None"})
  //           </li>
  //         ))}
  //       </ul>
  //     );
  //   }
  //   return <p>No obligations available.</p>;
  // };

  // const renderPermissions = () => {
  //   if (termsData && termsData.permissions) {
  //     const { canShareMoreData, canDownloadData } = termsData.permissions;
  //     return (
  //       <ul>
  //         {canShareMoreData ? <li>You can share more data.</li> : <li>You cannot share more data.</li>}
  //         {canDownloadData ? <li>You can download data.</li> : <li>You cannot download data.</li>}
  //       </ul>
  //     );
  //   }
  //   return <p>No permissions available.</p>;
  // };

  // const renderForbidden = () => {
  //   if (termsData && termsData.forbidden) {
  //     return (
  //       <ul>
  //         {termsData.forbidden.map((term, index) => (
  //           <li key={index}>
  //             {term.labelDescription}
  //           </li>
  //         ))}
  //       </ul>
  //     );
  //   }
  //   return <p>No forbidden terms available.</p>;
  // };
  const handleEditClick = () => {
    navigate('/ConnectionTermsGlobal', {
      state: {
        connectionTypeName: connectionTypeName,
        connectionTypeDescription: connectionTypeDescription,
        existingTerms: termsData,
      },
    });
  };

  const renderTermsSection = (terms, title, userType) => (
    <div className="termsSection">
      <h3>{title}</h3>
      {terms && terms.length > 0 ? (
        <ul>
          {terms.map((term, index) => (
            <li key={index}>
              <strong>
                {userType === "guest"
                  ? term.typeOfSharing === "collateral"
                    ? `Guest shall provide ${term.labelName} as ${term.typeOfSharing} - ${term.labelDescription}`
                    : `Guest shall ${term.typeOfSharing} ${term.labelName}-${term.labelDescription}`
                  : term.typeOfSharing === "collateral"
                    ? `Host will provide ${term.labelName} as ${term.typeOfSharing} - ${term.labelDescription}`
                    : `Host will ${term.typeOfSharing} ${term.labelName}-${term.labelDescription}`}
              </strong>
              {/* (Host Privilege: {term.hostPermissions && term.hostPermissions.length > 0
                ? term.hostPermissions.join(", ")
                : "None"}) */}
            </li>
          ))}
        </ul>
      ) : (
        <p>No terms available.</p>
      )}
    </div>
  );


  const renderObligations = (userType) => {
    if (res && res.obligations) {
      return userType === "guest"
        ? renderTermsSection(res.obligations.guest_host, "", "guest")
        : renderTermsSection(res.obligations.host_guest, "", "host");
    }
    return <p>No obligations available.</p>;
  };

  const renderPermissions = (userType) => {
    if (res && res.permissions) {
      const permissionsData = userType === "guest"
        ? res.permissions.guest_host
        : res.permissions.host_guest;
      return (
        <div className="permissions">
          <ul>
            <li>
              {userType === "guest"
                ? `Guest ${permissionsData.canShareMoreData ? "Can" : "Cannot"} share more data`
                : `Host ${permissionsData.canShareMoreData ? "Can" : "Cannot"} share more data`}
            </li>
            {/* <li>
            {userType === "guest"
              ? `Guest ${permissionsData.canDownloadData ? "Can" : "Cannot"} download data`
              : `Host ${permissionsData.canDownloadData ? "Can" : "Cannot"} download data`}
          </li> */}
          </ul>
        </div>
      );
    }
    return <p>No permissions available.</p>;
  };

  const renderForbidden = (userType) => {
    if (res && res.forbidden) {
      return (
        <div className="termsSection">
          {res.forbidden[userType === "guest" ? "guest_host" : "host_guest"] &&
            res.forbidden[userType === "guest" ? "guest_host" : "host_guest"].length > 0 ? (
            <ul>
              {res.forbidden[userType === "guest" ? "guest_host" : "host_guest"].map(
                (term, index) => (
                  <li key={index}>
                    <strong>
                      {userType === "guest"
                        ? `Guest  ${term.labelName} - ${term.labelDescription}`
                        : `Host  ${term.labelName} - ${term.labelDescription}`}
                    </strong>
                    {/* (Host Privilege:{" "}
                    {term.hostPermissions && term.hostPermissions.length > 0
                      ? term.hostPermissions.join(", ")
                      : "None"}) */}
                  </li>
                )
              )}
            </ul>
          ) : (
            <ul>
              <li>No forbidden terms available.</li>
            </ul>
          )}
        </div>
      );
    }
    return <p>No forbidden terms available.</p>;
  };
  const content = (
    <>
      {/* <div className="navbarBrands">{curruser ? capitalizeFirstLetter(curruser.username) : "None"}</div>
      <div>
        {curruser ? curruser.description : "None"}
      </div> */}
      <div className="navbarBrands">
        {res ? res.template_name : "Loading..."}
      </div>
    </>
  );
  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <a href="/dpi-directory" className="breadcrumb-item">
        User Directory
      </a>
      <span className="breadcrumb-separator">▶</span>
      <a href="/create-global-connection-type" className="breadcrumb-item">
        GlobalConnectionTypes
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">GlobalTermsView</span>
    </div>
  )

  return (
    <div className="global-terms-view-page" id="global-terms-view">
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
      {/* {isSystemAdmin && <Sidebar />} Show Sidebar only for System Admin */}
      <div style={{ marginTop: "12px" }}>
        <div className="connection-details" >
          <div className="connectionName1">Global Connection Type Name: {res ? res.template_name : "Loading..."}</div>
          <div className="dates">
            <div style={{ fontSize: "18px", width: "65%" }}>
              {res ? res.template_description : "Loading..."}
            </div>
          </div>
        </div>
        <Box className="show-connection" padding={{ xs: "20px", md: "35px" }}>
          <Grid container className="view-container1">
            <Grid item xs={12} className="b">
              <div className="tabs">
                <div
                  className={`tab-header ${activeTab === "guest" ? "active" : ""}`}
                  onClick={() => setActiveTab("guest")}
                >
                  Guest Data
                </div>
                <div
                  className={`tab-header ${activeTab === "host" ? "active" : ""}`}
                  onClick={() => setActiveTab("host")}
                >
                  Host Data
                </div>
              </div>
              <div className="tab-content">
                <div className="table-container">
                  {activeTab === "guest" && (
                    <div>
                      <div className="page13headterms">Guest Obligations</div>
                      <div style={{ fontSize: "18px" }} className="page13lowerterms">{renderObligations("guest")}</div>
                      {/* <div className="page13headterms">Guest Permissions</div>
                      <div style={{ fontSize: "18px" }} className="page13lowerterms">{renderPermissions("guest")}</div> */}
                      <div className="page13headterms">Guest Forbidden Terms</div>
                      <div style={{ fontSize: "18px" }} className="page13lowerterms">{renderForbidden("guest")}</div>
                      <div className="page13headterms">Default Host Privileges</div>
                      <li style={{ fontSize: "18px" }}>By default download, reshare, confer, collateral, transfer, subset are disabled unless otherwise mentioned in the terms</li>
                    </div>
                  )}
                  {activeTab === "host" && (
                    <div>
                      <div className="page13headterms">Host Obligations</div>
                      <div style={{ fontSize: "18px" }} className="page13lowerterms">{renderObligations("host")}</div>
                      {/* <div className="page13headterms">Host Permissions</div>
                      <div style={{ fontSize: "18px" }} className="page13lowerterms">{renderPermissions("host")}</div> */}
                      <div className="page13headterms">Host Forbidden Terms</div>
                      <div style={{ fontSize: "18px" }} className="page13lowerterms">{renderForbidden("host")}</div>
                      <div className="page13headterms">Default Host Privileges</div>
                      <li style={{ fontSize: "18px" }}>By default download, reshare, confer, collateral, transfer, subset are disabled unless otherwise mentioned in the terms</li>
                    </div>
                  )}
                </div>
              </div>
            </Grid>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default GlobalTermsView;
