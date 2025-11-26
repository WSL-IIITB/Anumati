// import "./Displayterms.css";
// import React, { useContext, useEffect, useState } from "react";
// import Cookies from "js-cookie";
// import { useNavigate, useLocation } from "react-router-dom";
// import { usercontext } from "../../usercontext";
// import Navbar from "../Navbar/Navbar";
// import { frontend_host } from "../../config";

// export const Displayterms = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { curruser } = useContext(usercontext);
//   const [error, setError] = useState(null);
//   const [res, setRes] = useState(null);
//   const {
//     connectionName,
//     hostLockerName,
//     connectionTypeName,
//     connectionDescription,
//     createdtime,
//     validitytime,
//     hostUserUsername,
//     locker,
//   } = location.state || {};
//   console.log("Location State:", location.state);


//   console.log(
//     connectionName,
//     hostLockerName,
//     connectionTypeName,
//     hostUserUsername,
//     locker
//   );

//   useEffect(() => {
//     if (!curruser) {
//       navigate("/");
//       return;
//     }

//     const fetchTerms = async () => {
//       console.log("Inside fetch terms");
//       try {
//         const token = Cookies.get("authToken");

//         let apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}&host_user_username=${curruser.username}&host_locker_name=${locker.name}`;
//         console.log("Final API URL:", apiUrl);

//         const response = await fetch(apiUrl, {
//           method: "GET",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Basic ${token}`,
//           },
//         });

//         if (!response.ok) {
//           throw new Error("Failed to fetch terms");
//         }

//         const data = await response.json();

//         if (data.success) {
//           setRes(data.data.terms);
//           console.log(data.data.terms);
//         } else {
//           setError(data.error || "No terms found");
//         }
//       } catch (err) {
//         setError(err.message);
//       }
//     };

//     fetchTerms();
//   }, [curruser, connectionTypeName, hostUserUsername, hostLockerName, locker.name, navigate]);

//   // Render Obligations
//   const renderObligations = () => {
//     if (res) {
//       return (
//         <div>

//           <ul>
//             {res.map((term, index) => (
//               <li key={index}>
//                 {term.sharing_type} - {term.data_element_name}
//               </li>
//             ))}
//           </ul>
//         </div>
//       );
//     }
//     return <p>No obligations available.</p>;
//   };

//   // Render Permissions
//   const renderPermissions = () => {
//     if (res && res.permissions) {
//         const { canShareMoreData, canDownloadData } = res.permissions;
//         return (
//             <div className="permissions">
//                 <h3>Permissive</h3>
//                 <ul>
//                     {canShareMoreData && <li>You can share more data.</li>}
//                     {canDownloadData && <li>You can download data.</li>}
//                 </ul>
//             </div>
//         );
//     }
//     return null;
// };

//   const content = (
//     <>
//       <div className="navbarBrand">{curruser ? curruser.username : "None"}</div>
//       <div className="description">
//         {curruser ? curruser.description : "None"}
//       </div>

//     </>
//   );

//   return (
//     <div>
//       <Navbar content={content} />
//       <div className="connection-details1">
//         <h4>Connection Type Name: {connectionTypeName}</h4>
//         {connectionDescription}
//         <br></br>Created on:{new Date(createdtime).toLocaleString()}
//         <br></br>Valid until: {new Date(validitytime).toLocaleString()}
//       </div>
//       <div className="page13container">
//         <p>
//           <u>Terms of connection</u>
//         </p>

//         <div className="page13subparent">
//           <div className="page13headterms">Your Obligations</div>
//           <div className="page13lowerterms">{renderObligations()}</div>

//           <div className="page13headterms">Your Rights</div>
//           <div className="page13lowerterms">{renderPermissions()}</div>
//         </div>
//       </div>
//     </div>
//   );
// };
import "./Displayterms.css";
import React, { useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useNavigate, useLocation } from "react-router-dom";
import { usercontext } from "../../usercontext";
import Navbar from "../Navbar/Navbar";
import { frontend_host } from "../../config";
import { Grid } from "@mui/material"
import Sidebar from "../Sidebar/Sidebar.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

export const Displayterms = () => {
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
  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { curruser } = useContext(usercontext);
  const [error, setError] = useState(null);
  const [res, setRes] = useState(null);
  const [globalTemplates, setGlobalTemplates] = useState([]);
  const [terms, setTerms] = useState([]);
  const [activeTab, setActiveTab] = useState("guest");
  const [notifications, setNotifications] = useState([]);
  const {
    connectionName,
    hostLockerName,
    connectionTypeName,
    connectionDescription,
    createdtime,
    validitytime,
    hostUserUsername,
    locker,
    guestUserUsername,
    viewlockerDisplay,
    hostLocker,
    guestLocker,
    viewGuestuser,
    connectionType,
    GuestTermDisplay,
    connectionDetails,
    viewHostDisplay,
    ViewTermsDisplay,
    hostTermsReviewDisplay,
    viewConsentDashboard,
    homeDisplay,
  } = location.state || {};
  console.log("Location State:", locker.name);
  console.log("Location State:", hostLockerName);
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
      navigate("/");
      return;
    }

    const fetchGlobalTemplates = () => {
      const token = Cookies.get("authToken");
      fetch("host/get-template-or-templates/".replace(/host/, frontend_host), {
        method: "GET",
        headers: {
          Authorization: `Basic ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          // console.log("Fetched Templates:", data); // Log the fetched data
          setGlobalTemplates(data.data); // Store fetched templates
          // console.log("global data", data.data);
        })
        .catch((error) => {
          console.error("Error fetching templates:", error);
          setError("Failed to fetch templates");
        });
    };


    const fetchTerms = async () => {
      console.log("Inside fetch terms");
      try {
        const token = Cookies.get("authToken");

        let apiUrl = `${frontend_host}/get-terms-by-conntype/?connection_type_name=${connectionTypeName}`;
        // console.log("Final API URL:", apiUrl);
        console.log(curruser.username, "curr", hostUserUsername)
        // Determine which username to use
        if (curruser && curruser.username === hostUserUsername) {
          apiUrl += `&host_user_username=${curruser.username}`;
        } else {
          apiUrl += `&host_user_username=${hostUserUsername}`;
        }

        // Determine which locker name to use
        if (locker.name === hostLockerName) {
          apiUrl += `&host_locker_name=${locker.name}`;
        } else {
          apiUrl += `&host_locker_name=${hostLockerName}`;
        }

        console.log("Final API URL:", apiUrl);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch terms");
        }

        const data = await response.json();

        if (data.success) {
          setRes(data.data);
          setTerms(data.data.obligations);
          console.log(data.data);
        } else {
          setError(data.error || "No terms found");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchTerms();
    fetchGlobalTemplates();
  }, [curruser, connectionTypeName, hostUserUsername, hostLockerName, locker.name, navigate]);
  const getTrueKeysView = (obj) => {
    return Object.entries(obj)
      .filter(([key, value]) => value === true)
      .map(([key]) => key);
  };
  const postConditionsKeysView = getTrueKeysView(res?.post_conditions || {});

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
        ? renderTermsSection(res.obligations.guest_to_host, "", "guest")
        : renderTermsSection(res.obligations.host_to_guest, "", "host");
    }
    return <p>No obligations available.</p>;
  };

  const renderPermissions = (userType) => {
    if (res && res.permissions) {
      const permissionsData = userType === "guest"
        ? res.permissions.guest_to_host
        : res.permissions.host_to_guest;
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
          {res.forbidden[userType === "guest" ? "guest_to_host" : "host_to_guest"] &&
            res.forbidden[userType === "guest" ? "guest_to_host" : "host_to_guest"].length > 0 ? (
            <ul>
              {res.forbidden[userType === "guest" ? "guest_to_host" : "host_to_guest"].map(
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


  console.log(res);




  const uniqueGlobalConnTypeIds = Array.isArray(terms)
    ? [...new Set(terms
      .filter(term => term.global_conn_type_id !== null)
      .map(term => term.global_conn_type_id)
    )]
    : [];


  const globalTemplateNames = uniqueGlobalConnTypeIds.map(id => {
    const template = globalTemplates.find(template => template.global_connection_type_template_id === id);
    return template ? template : null;
  });

  const handleNavigation = (template) => {
    if (template) {
      console.log(template);
      navigate('/GlobalTermsView', {
        state: {
          connectionTypeName: template.global_connection_type_name,
          connectionTypeDescription: template.global_connection_type_description,
          template_Id: template.global_connection_type_template_id,
          hide: true,
        },
      });
    }
  };

  const handleViewLockerBreadCrumb = () => {
    navigate('/view-locker', {
      state: {
        user: { username: hostUserUsername },
        locker: hostLocker,
      },
    });
  };

  const handleViewLockerGuest = () => {
    navigate('/view-locker', {
      state: {
        user: { username: guestUserUsername },
        locker: guestLocker,
      },
    });

  }

  const handleConnectionClick = () => {
    const lockers = hostLocker
    const connectionTypes = connectionType
    console.log("navigate show-guest-users", {
      connectionTypes,
      lockers,
      hostUserUsername,
      hostLockerName
    });
    navigate("/show-guest-users", { state: { connection: connectionTypes, locker: hostLocker, hostUserUsername, hostLockerName, hostLocker, connectionDetails } });
  };

  const handleGuestTermsClick = () => {
    navigate("/guest-terms-review", {
      state: {
        connection: connectionDetails,
        connectionType: connectionType,
      },
    })
  }

  const handleHostTermsClick = () => {
    navigate("/view-host-terms-by-type", {
      state: {
        connection_id: connectionDetails.connection_id,
        connectionName: connectionDetails.connection_name,
        connectionDescription: connectionDetails.connection_description,
        hostLockerName: connectionDetails?.host_locker?.name,
        guestLockerName: connectionDetails?.guest_locker?.name,
        hostUserUsername: connectionDetails?.host_user?.username,
        guestUserUsername: connectionDetails?.guest_user?.username,
        locker: connectionDetails?.host_locker,
        guest_locker_id: connectionDetails.guest_locker?.locker_id,
        host_locker_id: connectionDetails.host_locker?.locker_id,
        connection: connectionDetails,
        connectionType: connectionType,
        guestLocker: connectionDetails.guest_locker,
        hostLocker: connectionDetails.host_locker
      },
    })
  }
  console.log("something", { connection_id: connectionDetails },)

  const handleViewTermsClick = () => {
    navigate("/view-terms-by-type", {
      state: {
        connection_id: connectionDetails.connection_id,
        connectionName: connectionDetails.connection_name,
        connectionDescription: connectionDetails.connection_description,
        hostLockerName: connectionDetails?.host_locker?.name,
        guestLockerName: connectionDetails?.guest_locker?.name,
        hostUserUsername: connectionDetails?.host_user?.username,
        guestUserUsername: connectionDetails?.guest_user?.username,
        locker: connectionDetails?.guest_locker,
        guest_locker_id: connectionDetails.guest_locker?.locker_id,
        host_locker_id: connectionDetails.host_locker?.locker_id,
        connection: connectionDetails,
        //    Type: connectionType, 
        guestLocker: connectionDetails.guest_locker,
        hostLocker: connectionDetails.host_locker
      },
    })
  }


  const handleViewHostTermsClick = () => {
    navigate("/host-terms-review", {
      state: {
        connection: connectionDetails,
        connection_id: connectionDetails.connection_id,
        connectionName: connectionDetails.connection_name,
        connectionDescription: connectionDetails.connection_description,
        hostLockerName: connectionDetails.host_locker?.name,
        guestLockerName: connectionDetails.guest_locker?.name,
        hostUserUsername: connectionDetails.host_user?.username,
        guestUserUsername: connectionDetails.guest_user?.username,
        locker: locker,
        guest_locker_id: connectionDetails.guest_locker?.locker_id,
        host_locker_id: connectionDetails.host_locker?.locker_id,
        hostLocker: connectionDetails.host_locker,
        guestLocker: connectionDetails.guest_locker
      },
    });
  }

  const content = (
    <>
      {/* <div className="navbarBrands">{curruser ? capitalizeFirstLetter(curruser.username) : "None"}</div>
      <div>
        {curruser ? curruser.description : "None"}
      </div> */}
      <div className="navbarBrands">
        {connectionName ? connectionName : connectionTypeName}
      </div>
    </>
  );

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      {viewlockerDisplay && (
        <>
          <span onClick={() => handleViewLockerBreadCrumb()} className="breadcrumb-item">
            View Locker
          </span>
          <span className="breadcrumb-separator">▶</span>
          <span className="breadcrumb-item current">DisplayTerms</span>
        </>
      )}
      {viewGuestuser && (
        <>
          <span onClick={() => handleViewLockerBreadCrumb()} className="breadcrumb-item">
            View Locker
          </span>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleConnectionClick()} className="breadcrumb-item">ShowGuestUsers</span>
          <span className="breadcrumb-separator">▶</span>
          <span className="breadcrumb-item current">DisplayTerms</span>
        </>
      )}
      {GuestTermDisplay && (
        <>
          <span onClick={() => handleViewLockerBreadCrumb()} className="breadcrumb-item">View Locker</span>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleConnectionClick()} className="breadcrumb-item">ShowGuestUsers</span>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleGuestTermsClick()} className="breadcrumb-item">GuestTermsReview</span>
          <span className="breadcrumb-separator">▶</span>
          <span className="breadcrumb-item current">DisplayTerms</span>
        </>
      )}
      {viewHostDisplay && (
        <>
          <span onClick={() => handleViewLockerBreadCrumb()} className="breadcrumb-item">View Locker</span>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleConnectionClick()} className="breadcrumb-item">ShowGuestUsers</span>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleGuestTermsClick()} className="breadcrumb-item">GuestTermsReview</span>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleHostTermsClick()} className="breadcrumb-item">ViewHostTermsByType</span>
          <span className="breadcrumb-separator">▶</span>
          <span className="breadcrumb-item current">DisplayTerms</span>

        </>
      )}
      {ViewTermsDisplay && (
        <>
          <span onClick={() => handleViewLockerGuest()} className="breadcrumb-item">View Locker</span>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleViewTermsClick()} className="breadcrumb-item">ViewGuestTermsByType</span>
          <span className="breadcrumb-separator">▶</span>
          <span className="breadcrumb-item current">DisplayTerms</span>
        </>
      )}
      {hostTermsReviewDisplay && (
        <>
          <span onClick={() => handleViewLockerGuest()} className="breadcrumb-item">View Locker</span>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleViewTermsClick()} className="breadcrumb-item">ViewGuestTermsByType</span>
          <span className="breadcrumb-separator">▶</span>
          <span onClick={() => handleViewHostTermsClick()} className="breadcrumb-item">HostTermsReview</span>
          <span className="breadcrumb-separator">▶</span>
          <span className="breadcrumb-item current">DisplayTerms</span>
        </>
      )}

      {homeDisplay && (
        <>
          <span className="breadcrumb-item current">DisplayTerms</span>
        </>
      )}

      {viewConsentDashboard && (
        <>
          <a href="/consent-dashboard" className="breadcrumb-item">
            Consent Dashboard
          </a>
          <span className="breadcrumb-separator">▶</span>
          <span className="breadcrumb-item current">DisplayTerms</span>
        </>
      )}

    </div>
  )

  console.log(res, "res");
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
      <div className="connection-details" style={{ marginTop: "12px" }}>
        <div className="connectionName1">Connection Type Name: {connectionTypeName}</div>
        <div className="connectionName2">
          {globalTemplateNames.length > 0 && "Connection has been imported from "}
          <span style={{ fontWeight: "bold" }}>
            {globalTemplateNames.filter(Boolean).map((template, index) => (
              <span key={index}>
                <span
                  style={{ cursor: 'pointer', textDecoration: 'underline' }}
                  onClick={() => handleNavigation(template)}
                >
                  {template.global_connection_type_name}
                </span>
                {index < globalTemplateNames.filter(Boolean).length - 1 && ", "}
              </span>
            ))}
          </span>
        </div>
        <div className="dates">
          <div style={{ fontSize: "18px", width: "65%" }}>
            {connectionDescription}
          </div>
          <div style={{ fontSize: "12px" }}>
            <br></br>Created on: {new Date(createdtime).toLocaleString()}
            <br></br>Valid until: {new Date(validitytime).toLocaleString()}
          </div>
        </div>
      </div>


      <div className="show-connection">
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
                    <li style={{ fontSize: "18px", marginLeft: "14px" }}>By default <span className=" text-end">
                      {postConditionsKeysView.length > 0 ? postConditionsKeysView.join(", ") : "No conditions found"}
                    </span> are disabled unless otherwise mentioned in the terms</li>
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
                    <div className="page13headterms">Default Guest Privileges</div>
                    <li style={{ fontSize: "18px", marginLeft: "14px" }}>By default <span className=" text-end">
                      {postConditionsKeysView.length > 0 ? postConditionsKeysView.join(", ") : "No conditions found"}
                    </span> are disabled unless otherwise mentioned in the terms</li>
                  </div>
                )}
              </div>
            </div>
          </Grid>
        </Grid>
      </div>


    </div>
  );
};
