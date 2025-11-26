import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ConnectionTermsGlobal.css";
import Navbar from "../Navbar/Navbar";
import { ConnectionContext } from "../../ConnectionContext";
import Modal from "../Modal/Modal.jsx";
import Cookies from "js-cookie";
import { usercontext } from "../../usercontext";
import { frontend_host } from "../../config";
import { Grid, Button, Box } from '@mui/material'
import Sidebar from "../Sidebar/Sidebar.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

export const ConnectionTermsGlobal = () => {
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
  const location = useLocation(); // Get the state passed from the previous page
  const { connectionTypeName, connectionTypeDescription, existingTerms } =
    location.state || {};
  const [purpose, setPurpose] = useState(""); // Ensure it's initialized
  const { setConnectionData, setConnectionTermsData } = useContext(ConnectionContext);


  // Separate states for global and obligation form data
  const initialObligationForm = {
    labelName: "",
    typeOfAction: "text",
    typeOfSharing: "share",
    purpose: "",
    labelDescription: "",
    hostPermissions: [],
    canShareMore: false,
    canDownload: false,
    forbidden: false, // Add forbidden state
  };

  const initialGlobalForm = {
    globalName: "",
    globalDescription: "",
    globaltype: "",
    domain: "",
  };

  const [globalFormData, setGlobalFormData] = useState(initialGlobalForm);
  const [obligationFormData, setObligationFormData] = useState(
    initialObligationForm
  );
  const [obligations, setObligations] = useState([]); // Obligations array
  const [error, setError] = useState(null);
  const { curruser, setUser } = useContext(usercontext);
  const [isOpen, setIsOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    if (location.state) {
      setGlobalFormData({
        globalName: connectionTypeName || "",
        globalDescription: connectionTypeDescription || "",
      });

      const { forbidden, obligations } = existingTerms || {};
      console.log("existing terms ", forbidden, obligations); // Debugging logs

      if (obligations && obligations.length > 0) {
        setObligations(
          obligations.map((term) => ({
            labelName: term.labelName || "",
            typeOfAction: term.typeOfAction || "text",
            typeOfSharing: term.typeOfSharing || "share",
            purpose: term.purpose || "",
            labelDescription: term.labelDescription || "",
            hostPermissions: term.hostPermissions || [],
            canShareMore: false,
            canDownload: false,
            forbidden: false,
          }))
        );
      }
    }
  }, [
    location.state,
    connectionTypeName,
    connectionTypeDescription,
    existingTerms,
  ]);

  const { globalName, globalDescription, globaltype } = globalFormData;

  // Handle changes for global fields
  const handleGlobalChange = (event) => {
    const { name, value } = event.target;
    setGlobalFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle changes for obligation fields
  const handleObligationChange = (event) => {
    const { name, value } = event.target;
    setObligationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setObligationFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleAddObligation = () => {
    if (obligationFormData.labelName.trim() !== "") {
      setObligations([...obligations, { ...obligationFormData }]);
      setObligationFormData(initialObligationForm); // Reset only obligation fields
    } else {
      alert("Label Name is required to add an obligation.");
    }
  };

  const handleLoadObligation = (index) => {
    const obligationToLoad = obligations[index];

    // Assuming you have access to the existing permissions and forbidden states
    const { permissions, forbidden } = existingTerms || {};

    setObligationFormData((prev) => ({
      ...prev,
      labelName: obligationToLoad.labelName || "",
      typeOfAction: obligationToLoad.typeOfAction || "text",
      typeOfSharing: obligationToLoad.typeOfSharing || "share",
      purpose: obligationToLoad.purpose || "",
      labelDescription: obligationToLoad.labelDescription || "",
      hostPermissions: obligationToLoad.hostPermissions || [],
      canShareMore: permissions?.canShareMoreData || false, // Check from the global permissions
      canDownload: permissions?.canDownloadData || false, // Check from the global permissions
      forbidden: forbidden, // If there are forbidden terms, set it to true
    }));
  };

  const handleRemoveObligation = (index) => {
    setObligations(obligations.filter((_, i) => i !== index));
  };

  const handleSubmits = (event) => {
    const connectionTermsData = {
      obligations,
      permissions: {
        canShareMoreData: obligationFormData.canShareMore,
        canDownloadData: obligationFormData.canDownload,
        // resharePermission: formData.resharePermission,
      },
      forbidden: obligationFormData.forbidden ? ["Cannot close unilaterally"] : ["can unilaterally close connection"],
    };
    console.log("setConnectionTermsData", connectionTermsData);
    setConnectionTermsData(connectionTermsData); // Update context
    navigate("/ConnectionTermsGlobalHost"); // Navigate to the next page
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (globalName.trim() === "" || globalDescription.trim() === "") {
      // alert("Please fill out both the Name and Description fields.");
      setError("Please fill out both the Name and Description fields.");
      setModalMessage({
        message: "Please fill out both the Name and Description fields.",
        type: "info",
      });
      setIsModalOpen(true);
      return; // Prevent form submission if fields are empty
    }

    if (obligations.length === 0) {
      setError("At least one obligation must be added.");
      setModalMessage({
        message: "At least one obligation must be added.",
        type: "info",
      });
      setIsModalOpen(true); // Open modal with info message.
      return;
    }

    const token = Cookies.get("authToken");
    const globalTemplateData = {
      connectionName: globalFormData.globalName,
      connectionDescription: globalFormData.globalDescription,
      globaltype: globalFormData.globaltype,
      domain: globalFormData.domain, // Include domain here
    };
    console.log("globalTemplateData", globalTemplateData)
    setConnectionData(globalTemplateData);
    const connectionTermsData = {
      ...globalTemplateData,
      obligations: obligations.map(obligation => ({
        ...obligation,
        hostPermissions: obligationFormData.hostPermissions,
      }))
      // permissions: {
      //   canShareMoreData: obligationFormData.canShareMore,
      //   canDownloadData: obligationFormData.canDownload,
      // },
      // forbidden: obligationFormData.forbidden ? ["Cannot close unilaterally"] : ["can unilaterally close connection"],
    };

    console.log(connectionTermsData);
    console.log(globalName);
    console.log(globalDescription);
    handleSubmits();
  };
  // fetch(`${frontend_host}/create-global-terms/`, {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Basic ${token}`, // Corrected template literal
  //   },
  //   body: JSON.stringify(connectionTermsData),
  // })
  // .then((response) =>
  //   response.json().then((data) => ({ status: response.status, data }))
  // )
  // .then((response) => {
  //   console.log("response", response)
  //   if (response.status === 200 || response.status === 201) {
  //     return response.json().then((data) => {
  //       navigate("/ConnectionTermsGlobalHost"); // Navigate after parsing response
  //       return data;
  //     });
  //   } else if (response.status === 400 && response.error.includes("already exists")) {
  //     setError(
  //       "Global Connection type with this name already exists."
  //     );
  //     setModalMessage({
  //       message:
  //         "Global Connection type with this name already exists.",
  //       type: "error",
  //     });
  //     setIsModalOpen(true)
  //   } else {
  //     // General error handling.
  //     console.error("Error:", response.error);
  //     setError(response.error);
  //     setModalMessage({
  //       message: response.error,
  //       type: "error",
  //     });
  //     setIsModalOpen(true); // Open modal with error message.
  //   }
  // })

  // --------------------------
  // .then(({ status, data }) => {
  //   if (status === 200 || status ===201) {
  //     handleSubmits()
  //   } else if (status === 400 && data.error.includes("already exists")) {
  //     // Handle the case where the connection type already exists.
  //     setError(
  //       `${data.error}`
  //     );
  //     setModalMessage({
  //       message:
  //         `${data.error}`,
  //       type: "error",
  //     });
  //     setIsModalOpen(true);
  //   } else {
  //     // General error handling.
  //     console.error("Error:", data.error);
  //     setError(data.error);
  //     setModalMessage({
  //       message: data.error,
  //       type: "error",
  //     });
  //     setIsModalOpen(true); // Open modal with error message.
  //   }
  // })
  // .then((data) => {
  //   console.log("Global terms created successfully.");
  //   navigate("/create-global-connection-type");
  //   const termsIDs = data.terms.map((term) => term.terms_id);

  //   const globalTemplateData = {
  //     global_connection_type_name: globalFormData.globalName,
  //     global_connection_type_description: globalFormData.globalDescription,
  //     global_terms_IDs: termsIDs,
  //     globaltype: globalFormData.globaltype,
  //     domain: globalFormData.domain, // Include domain here
  //   };
  //   console.log(globalTemplateData);
  //   // return fetch(`${frontend_host}/add-global-template/`, {
  //   //   method: "POST",
  //   //   headers: {
  //   //     "Content-Type": "application/json",
  //   //     Authorization: `Basic ${token}`,
  //   //   },
  //   //   body: JSON.stringify(globalTemplateData),
  //   // });
  // })
  // .then((response) => {
  //   if (response.status === 200 || response.status === 201) {
  //     return response.json();
  //   } else {
  //     throw new Error("Failed to add global template");
  //   }
  // })
  // .then(() => {
  //   alert("Global template added successfully.");
  // })
  // .catch((error) => {
  //   console.error("Error:", error);
  //   setError("An error occurred while submitting the data.");
  // });


  console.log("errors", error)
  const handleHostPermissionsChange = (event) => {
    const { value, checked } = event.target;

    setObligationFormData((prev) => {
      let updatedPermissions = prev.hostPermissions;

      if (checked) {
        if (!updatedPermissions.includes(value)) {
          updatedPermissions = [...updatedPermissions, value];
        }
      } else {
        updatedPermissions = updatedPermissions.filter(
          (permission) => permission !== value
        );
      }

      const validPermissions = ["reshare", "download", "aggregate"];
      updatedPermissions = updatedPermissions.filter((permission) =>
        validPermissions.includes(permission)
      );

      return {
        ...prev,
        hostPermissions: updatedPermissions,
      };
    });
  };

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }
  }, [curruser, navigate]);

  const token = Cookies.get("authToken");

  const handleGlobalConnection = () => {
    navigate('/create-global-connection-type');
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
  };

  const breadcrumbs = (
    <div className="breadcrumbs">
      <a href="/home" className="breadcrumb-item">
        Home
      </a>
      <span className="breadcrumb-separator">▶</span>
      <span onClick={() => handleGlobalConnection()} className="breadcrumb-item">GlobalConnectionDirectory</span>
      <span className="breadcrumb-separator">▶</span>
      <span className="breadcrumb-item current">AddNewGlobalConnectionType</span>
    </div>
  )

  return (
    <div id="connectionTerms">
      {/* {isModalOpen && (
        <Modal
          message={modalMessage.message}
          onClose={handleCloseModal}
          type={modalMessage.type}
        />
      )} */}
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
        <div className="navbar-breadcrumbs">{breadcrumbs}</div>
      </div>
      {/* <Navbar breadcrumbs={breadcrumbs} /> */}

      <div className="connectionTermsContainer">

        <div className="connectionTerms-heroContainer">
          {/* Global Name and Description */}
          <div style={{ paddingLeft: "20px" }}>
            <div className="mb-3 mt-3 row">
              <label className="col-sm-2 col-md-2 col-form-label">Name</label>
              <div className="col-md-3 col-sm-10 col-xs-10">
                <input
                  type="text"
                  name="globalName"
                  placeholder="Global Connection Type Name"
                  value={globalFormData.globalName}
                  onChange={handleGlobalChange} className="form-control" />
              </div>
            </div>

            <div className="mb-3 row">
              <label className="col-sm-2 col-md-2 col-form-label">Description</label>
              <div className="col-md-3 col-sm-10 col-xs-10">
                <input
                  type="text"
                  name="globalDescription"
                  placeholder="Description"
                  value={globalFormData.globalDescription}
                  onChange={handleGlobalChange} className="form-control" />
              </div>
            </div>

            <div className="mb-3 row">
              <label className="col-sm-2 col-md-2 col-form-label">Template/Policy</label>
              <div className="col-md-3 col-sm-10 col-xs-10">
                <select className="form-select form-select-md" aria-label="Small select example" name="globaltype"
                  value={globalFormData.globaltype}
                  onChange={handleGlobalChange}>
                  <option value="">Select Template/Policy</option>{" "}
                  <option value="template">template</option>{" "}
                  <option value="policy">policy</option>{" "}
                </select>
              </div>
            </div>

            <div className="mb-3 row">
              <label className="col-sm-2 col-md-2 col-form-label">Domain</label>
              <div className="col-md-3 col-sm-10 col-xs-10">
                <select className="form-select form-select-md" aria-label="Small select example"
                  name="domain"
                  value={globalFormData.domain}
                  onChange={handleGlobalChange} >
                  <option value="">Select Domain</option>{" "}
                  <option value="health">Healthcare</option>{" "}
                  <option value="finance">Finance</option>{" "}
                  <option value="education">Education</option>{" "}
                  <option value="personal data">Personal data</option>
                </select>
              </div>
            </div>
          </div>
          {/* <div className="main-heading" style={{textAlign:"center"}}>Guest Terms Of Service</div> */}

        </div>

        <div className="main-heading">Guest Terms Of Service</div>


        <Grid container className="parent-container secondContainer">
          <Grid item xs={12} md={8} className="parent-left-heading">
            <Grid container padding={"5px"}>
              <Grid item xs={12} md={6} className="connectionTerms-resourceHeading">
                Guest Obligations
              </Grid>
              <Grid item xs={12} md={3}></Grid>
              {/* <Grid item xs={12} md={3}>
                <button
                  className=""
                  type="button"
                  onClick={handleAddObligation}
                >
                  Add Obligations
                </button>
              </Grid> */}
            </Grid>

            <div >
              <form
                onSubmit={handleSubmit}
              >
                <Box sx={{
                  border: '1px solid rgb(107, 120, 231)',
                  borderRadius: '8px',
                  marginBottom: "10px",
                  padding: '10px',

                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                }}>
                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Label</label>
                    <div className="col-md-10 col-sm-10 col-xs-10">
                      <input
                        type="text"
                        name="labelName"
                        placeholder="Label of data shared"
                        value={obligationFormData.labelName}
                        onChange={handleObligationChange} className="form-control"
                      />
                    </div>
                  </div>

                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Type of Action</label>
                    <div className="col-md-10 col-sm-10 col-xs-10 d-flex">
                      <select className="form-select form-select-md" aria-label="Small select example"
                        name="typeOfAction"
                        value={obligationFormData.typeOfAction}
                        onChange={handleObligationChange} >
                        <option value="text">Add Value</option>
                        <option value="file">Upload File</option>
                        <option value="date">Add Date</option>
                      </select>
                      <span className="tooltips">
                        ?
                        <span className="tooltiptext">
                          Choose the action type: Share, Transfer, Confer, or
                          Collateral.
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Type of Sharing</label>
                    <div className="col-md-10 col-sm-10 col-xs-10 d-flex">
                      <select className="form-select form-select-md" aria-label="Small select example"
                        name="typeOfSharing"
                        value={obligationFormData.typeOfSharing}
                        onChange={handleObligationChange} >
                        <option value="share">Share</option>
                        <option value="transfer">Transfer</option>
                        <option value="confer">Confer</option>
                        <option value="collateral">Collateral</option>
                      </select>
                      <span className="tooltips">
                        ?
                        <span className="tooltiptext">
                          <span>
                            Transfer: You are transferring ownership of this
                            resource. You will no longer have access to this
                            resource after this operation.
                          </span>
                          <br />
                          <span>
                            Confer: You are going to transfer ownership of the
                            resource, but the recipient cannot modify the contents
                            of what you have conferred. You still have rights over
                            this resource.
                          </span>
                          <br />
                          <span>
                            Share: You are not transferring ownership of this
                            resource, but the recipient can view your resource. The
                            recipient cannot do anything else.
                          </span>
                          <br />
                          <span>
                            Collateral: You are temporarily transferring ownership
                            to the recipient. After this operation, you cannot
                            change anything in the resource and can use this as
                            agreed with the recipient.
                          </span>
                          <br />
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Purpose</label>
                    <div className="col-md-10 col-sm-10 col-xs-10">
                      <input
                        type="text"
                        name="purpose"
                        placeholder="Purpose of collecting data"
                        value={obligationFormData.purpose}
                        onChange={(e) =>
                          setObligationFormData({
                            ...obligationFormData,
                            purpose: e.target.value,
                          })
                        }
                        className="form-control"
                      />
                    </div>
                  </div>

                  <div className="mb-3 row">
                    <label className="col-sm-2 col-md-2 col-form-label">Description</label>
                    <div className="col-md-10 col-sm-10 col-xs-10 d-flex" >
                      <input
                        type="text"
                        name="labelDescription"
                        placeholder="Description of the obligation"
                        value={obligationFormData.labelDescription}
                        onChange={handleObligationChange}
                        className="form-control"
                      />
                    </div>
                  </div>

                  {/* <div className="mb-3 row">
                    <label className="col-sm-12 col-md-2 col-form-label">Host Permissions</label>
                    <div className="col-md-9 col-sm-12">
                      <div className="row">
                        <div className="col-md-2 col-xs-2">
                          <input
                            type="checkbox"
                            value="reshare"
                            checked={obligationFormData.hostPermissions.includes(
                              "reshare"
                            )}
                            onChange={handleHostPermissionsChange}
                          />
                        </div>
                        <div className="col-md-6 col-xs-6">
                          <label key="reshare">
                            Reshare
                          </label>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-2">
                          <input
                            type="checkbox"
                            value="download"
                            checked={obligationFormData.hostPermissions.includes(
                              "download"
                            )}
                            onChange={handleHostPermissionsChange}
                          />
                        </div>
                        <div className="col-md-6">
                          <label key="download">
                            Download
                          </label>
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-2">
                          <input
                            type="checkbox"
                            value="aggregate"
                            checked={obligationFormData.hostPermissions.includes(
                              "aggregate"
                            )}
                            onChange={handleHostPermissionsChange} />
                        </div>
                        <div className="col-md-6">
                          <label key="aggregate">
                            Aggregate
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-1">
                      <span className="tooltips">
                        ?
                        <span className="tooltiptext">
                          Select host permissions: Reshare, Download, or Aggregate.
                        </span>
                      </span>
                    </div>

                  </div> */}
                  <Grid container marginBottom={2}>
                    <Grid item md={4} xs={12}>
                      <button
                        className=""
                        type="button"
                        onClick={handleAddObligation}
                      >
                        Add Obligations
                      </button>
                    </Grid>
                  </Grid>
                </Box>
                {/* <div className="mb-1 row">
                  <h5><b>Permissions</b></h5>
                </div> */}

                {/* <div className="mb-3 row">
                  <div className="col-md-7 col-xs-12">
                    <label className="col-md-7 col-xs-12" style={{ fontWeight: "normal" }}>
                      Can the guest share more data
                    </label>
                  </div>
                  <div className="col-md-1 col-xs-2">
                    <input
                      type="checkbox"
                      name="canShareMore"
                      checked={obligationFormData.canShareMore}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                </div> */}
                {/* <div className="mb-3 row">
                <div className="col-md-6 col-xs-12">
                    <label className="col-md-6 col-xs-12" style={{fontWeight:"normal"}}>
                      Can they download the data
                    </label>
                  </div>
                  <div className="col-6">
                    <input
                      type="checkbox"
                      name="canDownload"
                      checked={obligationFormData.canDownload}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                </div> */}

                <div className="mb-1 row">
                  <h4><b>Forbidden</b></h4>
                </div>

                <div className="mb-3 row">
                  <div className="col-md-7 col-xs-12 ">
                    <label className="agreeLabel" style={{ fontWeight: "normal" }}>
                      Guest cannot unilaterally close the connection
                    </label>
                  </div>
                  <div className="col-md-1 col-xs-2">
                    <input
                      type="checkbox"
                      name="forbidden"
                      checked={obligationFormData.forbidden}
                      onChange={handleCheckboxChange}
                    />
                  </div>
                </div>
                <div className="connectionTerms-btn">
                  <button type="submit">Next</button>
                  <button onClick={() => handleGlobalConnection()}>Cancel</button>
                </div>
              </form>
            </div>
          </Grid>
          <Grid item xs={12} md={3} className="parent-right-headings" marginTop={{ md: "0px", xs: "30px" }}>
            {obligations.map((obligation, index) => (
              <Grid container mt={1} key={index} spacing={2} alignItems="center" display={"flex"} justifyContent={"center"}>
                <Grid item xs={6}>
                  <button
                    type="button"
                    color="secondary"
                    className="btn btn-outline-secondary obligation-buttons"
                    onClick={() => handleLoadObligation(index)}
                  >
                    {obligation.labelName}
                  </button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    className="remove-obligation-button"
                    variant="contained"
                    onClick={() => handleRemoveObligation(index)}
                  >
                    Remove
                  </Button>
                </Grid>
              </Grid>
            ))}
          </Grid>
        </Grid>

      </div>

      {isModalOpen && (
        <Modal
          message={modalMessage.message}
          onClose={handleCloseModal}
          type={modalMessage.type}
        />
      )}

    </div>
  );
};

