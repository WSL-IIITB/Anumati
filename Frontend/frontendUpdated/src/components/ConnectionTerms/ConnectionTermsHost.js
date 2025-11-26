import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import "./connectionTerms.css";

import Cookies from "js-cookie";
import { usercontext } from "../../usercontext";
import { ConnectionContext } from "../../ConnectionContext";

import Navbar from "../Navbar/Navbar";
import Panel from "../Panel/Panel";
import { frontend_host } from "../../config";
import Modal from "../Modal/Modal.jsx";
import { Grid, Box } from '@mui/material'
import { Tooltip } from 'react-tooltip';
// import Radio from '@mui/material/Radio';
// import RadioGroup from '@mui/material/RadioGroup';
// import FormControlLabel from '@mui/material/FormControlLabel';
// import FormControl from '@mui/material/FormControl';
// import Typography from "@mui/material/Typography";
import Sidebar from "../Sidebar/Sidebar.js";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

export const ConnectionTermsHost = () => {
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
  const { locker_conn, connectionData, connectionTermsData } =
    useContext(ConnectionContext);

  const location = useLocation();
  // console.log("connection terms loc", location.state);
  // const locker = location.state ? location.state.locker : null;
  // const connectionData = location.state ? location.state.connectionData : null;
  // console.log("connection terms locker", locker);
  // console.log("connection terms connection data", connectionData);
  const { hostGlobalObligationTerms } = location.state || {};
  const initialFormData = {
    labelName: "",
    typeOfAction: "text",
    typeOfSharing: "share",
    purpose: "",
    labelDescription: "",
    hostPermissions: [],
    canShareMore: false,
    canDownload: false,
    forbidden: false,
  };

  const [formData, setFormData] = useState(initialFormData);
  const [obligations, setObligations] = useState([]); // Change to an array
  const [error, setError] = useState(null);
  const { curruser } = useContext(usercontext);
  const [notifications, setNotifications] = useState([]);
  const [globalTemplates, setGlobalTemplates] = useState([]); // To store global templates
  const [selectedTemplateIds, setSelectedTemplateIds] = useState([]); // To store selected template IDs
  const [isDropdownVisible, setDropdownVisible] = useState(false); // To toggle dropdown visibility
  const [modalMessage, setModalMessage] = useState({ message: "", type: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [navigateHome, setNavigateHome] = useState(false)
  const [selectedTemplateDetails, setSelectedTemplateDetails] = useState(null);
  console.log("connectionTermsData", connectionTermsData, connectionData)
  const capitalizeFirstLetter = (string) => {
    if (!string) return '';
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
        console.log("Fetched Templates:", data); // Log the fetched data
        setGlobalTemplates(data.data); // Store fetched templates
        console.log("global data", data.data);
        setDropdownVisible(true); // Show dropdown
      })
      .catch((error) => {
        console.error("Error fetching templates:", error);
        setError("Failed to fetch templates");
      });
  };

  useEffect(() => {
    if (hostGlobalObligationTerms) {
      setObligations(() => [
        ...hostGlobalObligationTerms,
      ]);

      // // Handle permissions
      // setFormData((prevFormData) => ({
      //   ...prevFormData,
      //   canShareMore: permissions.canShareMoreData,
      //   canDownload: permissions.canDownloadData,
      // }));
    }
  }, [hostGlobalObligationTerms]);

  // const handleTemplateSelection = (templateId) => {
  //   setSelectedTemplateIds((prev) => {
  //     const updatedIds = prev.includes(templateId)
  //       ? prev.filter((id) => id !== templateId)
  //       : [...prev, templateId];

  //     // console.log("Updated Selected Template IDs:", updatedIds); // Log the updated IDs
  //     return updatedIds;
  //   });
  // };

  const handleTemplateSelection = (template) => {
    const { global_connection_type_template_id, global_connection_type_name, global_connection_type_description } = template;

    console.log("ID:", global_connection_type_template_id);
    console.log("Type Name:", global_connection_type_name);
    console.log("Type Description:", global_connection_type_description);

    // Store the details in state
    setSelectedTemplateDetails({
      id: global_connection_type_template_id,
      name: global_connection_type_name,
      description: global_connection_type_description,
    });

    // Update the selected templates as needed
    setSelectedTemplateIds((prevSelected) =>
      prevSelected.includes(global_connection_type_template_id)
        ? prevSelected.filter((id) => id !== global_connection_type_template_id)
        : [...prevSelected, global_connection_type_template_id]
    );
  };

  // const handleInfo = () => {


  //   if (setSelectedTemplateDetails) {
  //     navigate('/GlobalTermsView', {
  //       state: {
  //         connectionTypeName: selectedTemplateDetails.name,
  //         connectionTypeDescription: selectedTemplateDetails.description,
  //         template_Id: selectedTemplateDetails.id,
  //       },
  //     });
  //   }

  // };

  const templateNameMapping = globalTemplates.reduce((acc, template) => {
    acc[template.global_connection_type_template_id] = template.global_connection_type_name;
    return acc;
  }, {});


  const handleFetchObligations = () => {
    const token = Cookies.get("authToken");
    selectedTemplateIds.forEach((templateId) => {
      fetch(
        `host/get-connection-terms-for-global-template/?template_Id=${templateId}`.replace(
          /host/,
          frontend_host
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${token}`,
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const { obligations, permissions, forbidden } = data.data;
            const templateName = templateNameMapping[templateId] || "Host Obligation";
            const obligationsWithGlobalId = obligations.host_guest.map((obligation) => ({
              ...obligation,
              templateName,
              global_conn_type_id: templateId,  // Add global_conn_type_id
              // showInfo: true,
            }));


            // Combine obligations, permissions, and forbidden into a single array or separate arrays
            // setObligations((prev) => [
            //   ...prev, 
            //   ...obligations, // Add the fetched obligations
            // ]);

            setObligations((prev) => [
              ...prev,
              ...obligationsWithGlobalId, // Add fetched obligations with global_conn_type_id
            ]);

            // Handle permissions
            setFormData((prevFormData) => ({
              ...prevFormData,
              canShareMore: permissions.canShareMoreData,
              canDownload: permissions.canDownloadData,
            }));

            // Handle forbidden terms (you can also update another state for forbidden terms)
            // if you want to show them somewhere else.
          } else {
            setError("Failed to fetch obligations for the selected template.");
          }
        })
        .catch((error) => {
          setError(`Failed to fetch obligations for template ID ${templateId}`);
        });
    });

    setDropdownVisible(false); // Hide dropdown after fetching
  };


  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const handleRadioChange = (permissionType, value) => {
    setFormData((prevData) => {
      // Remove existing entry for the same permission type
      const updatedPermissions = prevData.hostPermissions.filter(
        (permission) => !permission.endsWith(permissionType)
      );

      // Add the new value for the permission type
      return {
        ...prevData,
        hostPermissions: [...updatedPermissions, value],
      };
    });
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalMessage({ message: "", type: "" });
    if (navigateHome) {
      navigate("/home");
      setNavigateHome(false); // Reset the state to avoid navigation in other cases
    }
  };

  const handleGlobalModal = () => {
    setIsTemplateModalOpen(false);
    setSelectedTemplateIds([])
  };

  const handleCheckboxChange = (event) => {
    const { name, checked } = event.target;
    setFormData({
      ...formData,
      [name]: checked,
    });
  };

  const handleAddObligation = () => {
    if (formData.labelName.trim() !== "") {
      // Add the formData along with showInfo: false
      const newObligation = {
        ...formData, // Spread the formData to add its properties
        // showInfo: false, 
      };

      // Update the obligations state with the new obligation
      setObligations((prev) => [...prev, newObligation]);

      // Optionally reset formData after adding the obligation
      setFormData(initialFormData);
    }
  };

  const handleLoadObligation = (index) => {
    setFormData(obligations[index]);
  };

  const handleRemoveObligation = (index) => {
    const removedObligation = obligations[index];

    // Remove the obligation
    const updatedObligations = obligations.filter((_, i) => i !== index);

    // Update the obligations state
    setObligations(updatedObligations);

    // Clear the form if the removed obligation is the one currently loaded in the form
    if (
      formData.labelName === removedObligation.labelName &&
      formData.labelDescription === removedObligation.labelDescription &&
      formData.typeOfAction === removedObligation.typeOfAction &&
      formData.typeOfSharing === removedObligation.typeOfSharing &&
      formData.purpose === removedObligation.purpose &&
      formData.hostPermissions.join(",") === removedObligation.hostPermissions.join(",") &&
      formData.canShareMore === removedObligation.canShareMore &&
      formData.canDownload === removedObligation.canDownload
    ) {
      setFormData(initialFormData);
    }
  };


  // const handleSubmit = (event) => {
  //   event.preventDefault();
  //   console.log("Form data before submit:", formData); // Add this line

  //   if (obligations.length === 0) {
  //     setError("At least one obligation must be added.");
  //     setModalMessage({
  //       message: "At least one obligation must be added.",
  //       type: "info",
  //     });
  //     setIsModalOpen(true); // Open modal with info message.
  //     return;
  //   }

  //   const token = Cookies.get("authToken");
  //   const forbiddenArray = formData.forbidden ? ["Cannot close unilaterally"] : ["can unilaterally close connection"];


  //   const connectionTermsData = {
  //     ...connectionData,
  //     // obligations: obligations,
  //     obligations: obligations.map(obligation => ({
  //       ...obligation,
  //       global_conn_type_id: obligation.global_conn_type_id || null,
  //     })),
  //     permissions: {
  //       canShareMoreData: formData.canShareMore,
  //       canDownloadData: formData.canDownload,
  //     },
  //     forbidden: forbiddenArray,  // Add forbidden array here

  //   };

  //   console.log("data",connectionTermsData);
  //   setConnectionTermsData(connectionTermsData);

  //   fetch("host/create-connection-type-and-terms/".replace(/host/, frontend_host), {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Basic ${token}`,
  //     },
  //     body: JSON.stringify(connectionTermsData),
  //   })
  //     .then((response) => response.json().then((data) => ({ status: response.status, data })))
  //     .then(({ status, data }) => {
  //       if (status === 201) {
  //         // Success case: show success modal and reset form if needed.
  //         setModalMessage({
  //           message: "Connection Type successfully created!",
  //           type: "success",
  //         });
  //         setIsModalOpen(true);
  //         navigate("/admin"); 
  //         // Optionally, reset the form after successful creation.
  //       } else if (status === 400 && data.error.includes("already exists")) {
  //         // Handle the case where the connection type already exists.
  //         setError("Connection type with this name already exists in the same locker.");
  //         setModalMessage({
  //           message: "Connection type with this name already exists in the same locker.",
  //           type: "error",
  //         });
  //         setIsModalOpen(true);

  //       } else {
  //         // General error handling.
  //         console.error("Error:", data.error);
  //         setError(data.error);
  //         setModalMessage({
  //           message: data.error,
  //           type: "error",
  //         });
  //         setIsModalOpen(true); // Open modal with error message.
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Error:", error);
  //       setError("An error occurred while submitting the data.");
  //       setModalMessage({
  //         message: "An error occurred while submitting the data.",
  //         type: "error",
  //       });
  //       setIsModalOpen(true); // Open modal with error message.
  //     });
  // };


  const handleSubmit = (event) => {
    event.preventDefault();
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

    const GuestData = {
      from: "GUEST",
      to: "HOST",
      ...connectionTermsData
    }

    const HostData = {
      from: "HOST",
      to: "GUEST",
      obligations: obligations.map(obligation => ({
        ...obligation,
        hostPermissions: formData.hostPermissions,
        global_conn_type_id: obligation.global_conn_type_id || null,  // Optional field if needed by the API
      })),
      permissions: {
        canShareMoreData: formData.canShareMore,
        canDownloadData: formData.canDownload,
      },
      // hostPermissions: formData.hostPermissions,
      forbidden: formData.forbidden ? ["Cannot close unilaterally"] : ["can unilaterally close connection"]

    };

    const finalData = {
      ...connectionData,
      directions: [
        GuestData,
        HostData
      ]
    }

    fetch("host/create-connection-type-and-terms/".replace(/host/, frontend_host), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${token}`,
      },
      body: JSON.stringify(finalData),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          // setError("Connection Type successfully created!");
          setModalMessage({
            message: "Connection Type successfully created!",
            type: "success",
          });
          setIsModalOpen(true);
          setNavigateHome(true);
        } else {
          // General error handling.
          console.error("Error:", data.error);
          setError(data.error);
          setModalMessage({
            message: data.error,
            type: "error",
          });
          setIsModalOpen(true); // Open modal with error message.
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        setError("An error occurred while submitting the data.");
        setModalMessage({
          message: "An error occurred while submitting the data.",
          type: "error",
        });
        setIsModalOpen(true); // Open modal with error message.
      });
  };


  const handleHostPermissionsChange = (event) => {
    const { value, checked } = event.target;

    setFormData((prevFormData) => {
      let updatedPermissions = prevFormData.hostPermissions;

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
        ...prevFormData,
        hostPermissions: updatedPermissions,
      };
    });
  };

  useEffect(() => {
    if (!curruser) {
      navigate("/");
      return;
    }
  }, [curruser]);

  const token = Cookies.get("authToken");

  const content = (
    <>
      <div className="navbarBrands">Locker : {locker_conn?.name}</div>
      <div className="navbarBrands">Owner : {capitalizeFirstLetter(curruser.username)}</div>
    </>
  );


  return (
    <div id="connectionTermHost">

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
      </div>
      {/* <Navbar content={content}></Navbar> */}
      <div>
        {/* <Panel /> */}
        <div className="Panelcontent">
          <div className="connectionTerms-heroContainer-nonglobal">
            {/* <div className="main-heading">Guest Terms Of Service</div> */}
            <Grid container className="parent-container ">
              <Grid item xs={12} md={8} className="parent-left-heading">
                <div>
                  <Grid container>
                    <Grid item md={7} xs={12}>
                      <div className="connectionTerms-resourceHeading">
                        Host Obligations for {connectionData?.connectionName}
                      </div>
                    </Grid>
                    <Grid item md={3.5} xs={12}>
                      {/* <button
                      className=""
                      type="button"
                      onClick={handleAddObligation}
                    >
                      Add Obligations
                    </button> */}
                    </Grid>
                    {/* <Grid item md={5} xs={12}>
                      <button
                        className=""
                        onClick={() => {
                          fetchGlobalTemplates();
                          setIsTemplateModalOpen(true);
                        }}
                      >
                        Import Global Connection Template
                      </button>
                    </Grid> */}

                  </Grid>

                </div>

                <div className="connectionTerms-lockerForm">
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
                            value={formData.labelName}
                            onChange={handleInputChange} className="form-control"
                          />
                        </div>
                      </div>

                      <div className="mb-3 row">
                        <label className="col-sm-2 col-md-2 col-form-label">Type of Action</label>
                        <div className="col-md-10 col-sm-10 col-xs-10 d-flex">
                          <select className="form-select form-select-md" aria-label="Small select example"
                            name="typeOfAction"
                            value={formData.typeOfAction}
                            onChange={handleInputChange} >
                            <option value="text">Add Value</option>
                            <option value="file">Share data from locker</option>
                            <option value="date">Add Date</option>
                          </select>
                          {!isTemplateModalOpen && !isModalOpen && <span className="tooltips">
                            ?
                            <span className="tooltiptext">
                              Choose the action type: Share, Transfer, Confer, or
                              Collateral.
                            </span>
                          </span>}
                        </div>
                      </div>

                      <div className="mb-3 row">
                        <label className="col-sm-2 col-md-2 col-form-label">Type of Sharing</label>
                        <div className="col-md-10 col-sm-10 col-xs-10 d-flex">
                          <select className="form-select form-select-md" aria-label="Small select example"
                            name="typeOfSharing"
                            value={formData.typeOfSharing}
                            onChange={handleInputChange} >
                            <option value="share">Share</option>
                            <option value="transfer">Transfer</option>
                            <option value="confer">Confer</option>
                            <option value="collateral">Collateral</option>
                          </select>
                          {!isTemplateModalOpen && !isModalOpen && <span className="tooltips">
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
                                resource, but the recipient cannot modify the
                                contents of what you have conferred. You still have
                                rights over this resource.
                              </span>
                              <br />
                              <span>
                                Share: You are not transferring ownership of this
                                resource, but the recipient can view your resource.
                                The recipient cannot do anything else.
                              </span>
                              <br />
                              <span>
                                Collateral: You are temporarily transferring
                                ownership to the recipient. After this operation,
                                you cannot change anything in the resource and can
                                use this as agreed with the recipient.
                              </span>
                              <br />
                            </span>
                          </span>}

                        </div>
                      </div>

                      <div className="mb-3 row">
                        <label className="col-sm-2 col-md-2 col-form-label">Purpose</label>
                        <div className="col-md-10 col-sm-10 col-xs-10">
                          <input
                            type="text"
                            name="purpose"
                            placeholder="purpose of collecting data"
                            value={formData.purpose}
                            onChange={handleInputChange} className="form-control"
                          />
                        </div>
                      </div>

                      <div className="mb-3 row">
                        <label className="col-sm-2 col-md-2 col-form-label">Description</label>
                        <div className="col-md-10 col-sm-10 col-xs-10">
                          <input
                            type="text"
                            name="labelDescription"
                            placeholder="Description of the obligation"
                            value={formData.labelDescription}
                            onChange={handleInputChange} className="form-control"
                          />
                        </div>
                      </div>
                      {/* <div className="mb-3 row">
                        <label className="col-sm-12 col-md-2 col-form-label mt-2">Guest Entitlement&nbsp;</label>
                        <div className="col-md-10 col-sm-12">
                          <div>
                            <FormControl style={{ border: "2px solid rgb(107, 120, 231)", paddingRight: "16px", paddingLeft: "5px", borderRadius: "0.25rem", backgroundColor: "white" }}>
                              <RadioGroup
                                row
                                aria-labelledby="demo-row-radio-buttons-group-label"
                                name="row-radio-buttons-group"
                                value={formData.hostPermissions.find((perm) => perm.endsWith("reshare")) || ""} // Find the value for reshare
                                onChange={(e) => handleRadioChange("reshare", e.target.value)}
                              >
                                <FormControlLabel value="can reshare" control={<Radio size="small" />} label={<Typography noWrap>Can Reshare&nbsp;&nbsp;</Typography>} />
                                <FormControlLabel value="may reshare" control={<Radio size="small" />} label={<Typography noWrap>May Reshare &nbsp;&nbsp;</Typography>} />
                                <FormControlLabel value="cannot reshare" control={<Radio size="small" />} label={<Typography noWrap>Cannot Reshare</Typography>} />
                              </RadioGroup>
                            </FormControl>
                          </div>

                          <div className="mt-2">
                            <FormControl style={{ border: "2px solid rgb(107, 120, 231)", paddingRight: "6px", paddingLeft: "5px", borderRadius: "0.25rem", backgroundColor: "white" }}>
                              <RadioGroup
                                row
                                aria-labelledby="demo-row-radio-buttons-group-label"
                                name="row-radio-buttons-group"
                                value={formData.hostPermissions.find((perm) => perm.endsWith("download")) || ""} // Find the value for download
                                onChange={(e) => handleRadioChange("download", e.target.value)}
                              >
                                <FormControlLabel value="can download" control={<Radio size="small" />} label={<Typography noWrap>Can Download</Typography>} />
                                <FormControlLabel value="may download" control={<Radio size="small" />} label={<Typography noWrap>May Download</Typography>} />
                                <FormControlLabel value="cannot download" control={<Radio size="small" />} label={<Typography noWrap>Cannot Download</Typography>} />
                              </RadioGroup>
                            </FormControl>
                          </div>

                          <div className="mt-2">
                            <FormControl style={{ border: "2px solid rgb(107, 120, 231)", paddingLeft: "5px", borderRadius: "0.25rem", backgroundColor: "white" }}>
                              <RadioGroup
                                row
                                aria-labelledby="demo-row-radio-buttons-group-label"
                                name="row-radio-buttons-group"
                                value={formData.hostPermissions.find((perm) => perm.endsWith("aggregate")) || ""} // Find the value for aggregate
                                onChange={(e) => handleRadioChange("aggregate", e.target.value)}
                              >
                                <FormControlLabel value="can aggregate" control={<Radio size="small" />} label={<Typography noWrap>Can Aggregate</Typography>} />
                                <FormControlLabel value="may aggregate" control={<Radio size="small" />} label={<Typography noWrap>May Aggregate</Typography>} />
                                <FormControlLabel value="cannot aggregate" control={<Radio size="small" />} label={<Typography noWrap>Cannot Aggregate</Typography>} />
                              </RadioGroup>
                            </FormControl>
                          </div>
                        </div>
                      </div> */}
                      {/* <div className="mb-3 row">
                    <label className="col-sm-12 col-md-2 col-form-label">Host Permissions</label>
                    <div className="col-md-9 col-sm-12">
                    <div className="row">
                      <div className="col-2">
                        <input
                          type="checkbox"
                          value="reshare"
                            checked={formData.hostPermissions.includes(
                              "reshare"
                            )}
                            onChange={handleHostPermissionsChange}
                        />
                      </div>
                      <div className="col-md-6">
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
                          checked={formData.hostPermissions.includes(
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
                        checked={formData.hostPermissions.includes(
                          "aggregate"
                        )}
                        onChange={handleHostPermissionsChange}/>
                      </div>
                      <div className="col-md-6">
                        <label key="aggregate"> 
                          Aggregate
                        </label>
                      </div>
                    </div>
                    </div>
                    <div className="col-md-1">
                      {!isTemplateModalOpen && !isModalOpen && <span className="tooltips">
                      ?
                      <span className="tooltiptext">
                        Select host permissions: Reshare, Download, or Aggregate.
                      </span>
                    </span>}
                  </div>
                  </div>  */}

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
                      <h4><b>Permissions</b></h4>
                    </div> */}

                    {/* <div className="mb-3 row">
                      <div className="col-md-5 col-xs-12">
                        <label className="agreeLabel">
                          Can the host share more data
                        </label>
                      </div>
                      <div className="col-md-1 col-xs-2">
                        <input
                          type="checkbox"
                          name="canShareMore"
                          checked={formData.canShareMore}
                          onChange={handleCheckboxChange}
                        />
                      </div>
                    </div> */}
                    {/* <div className="mb-3 row">
                    <div className="col-md-6 col-xs-12">
                      <label className="col-md-6 col-xs-12  agreeLabel">
                        Can they download the data
                      </label>
                    </div>
                    <div className="col-6">
                      <input
                        type="checkbox"
                        name="canDownload"
                        checked={formData.canDownload}
                        onChange={handleCheckboxChange}
                      />
                    </div>
                  </div> */}

                    <div className="mb-1 row">
                      <h4><b>Forbidden</b></h4>
                    </div>

                    <div className="mb-3 row">
                      <div className="col-md-5 col-xs-12">
                        <label className="agreeLabel">
                          {formData.forbidden
                            ? "Host cannot unilaterally close the connection."
                            : "Host can unilaterally close the connection."}
                        </label>
                      </div>
                      <div className="col-md-1 col-xs-2">
                        <input
                          type="checkbox"
                          name="forbidden"
                          checked={formData.forbidden}
                          onChange={handleCheckboxChange}
                        />
                      </div>
                    </div>
                    <div className="connectionTerms-btn">
                      <button type="submit">Confirm & Submit</button>
                    </div>
                  </form>
                </div>
              </Grid>

              <Grid item xs={12} sm={12} md={3} className="parent-right-headings" marginTop={{ md: "0px", xs: "30px" }}>
                {obligations.map((obligation, index) => (
                  <Grid container mt={1} key={index} spacing={2} alignItems="center" display={"flex"}>
                    <Grid item md={6} sm={6} xs={6}>
                      <button
                        data-tooltip-id={`tooltip-${index}`}
                        data-tooltip-content={
                          obligation.templateName
                            ? `Imported from: ${obligation.templateName}`
                            : connectionData.connectionName
                        }
                        type="button"
                        className="btn btn-outline-secondary obligation-buttons"
                        onClick={() => handleLoadObligation(index)}
                      >
                        {obligation.labelName}
                      </button>
                      <Tooltip id={`tooltip-${index}`} style={{ maxWidth: '200px', whiteSpace: 'normal' }} />
                    </Grid>
                    <Grid item md={4} sm={4} xs={5}>
                      <button
                        className="remove-obligation-button"
                        style={{ width: "auto" }}
                        variant="contained"
                        onClick={() => handleRemoveObligation(index)}
                      >
                        Remove
                      </button>
                    </Grid>
                    {/* {obligation.showInfo && (<Grid item md={1} sm={1} xs={1}>
                      <i className="bi bi-info-circle"
                        style={{ cursor: "pointer" }}></i>
                    </Grid>)} */}
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </div>
        </div>
      </div>
      <div className="modalWidth">
        {isTemplateModalOpen && (
          <Modal
            message="Select Global Templates"
            onClose={handleGlobalModal}
            type="info"
          >
            <div className="template-selection-container">
              {globalTemplates.length > 0 ? (
                <>
                  <label>Select Templates:</label>
                  {globalTemplates.map((template) => (
                    <div
                      key={
                        template.global_connection_type_template_id
                      }
                    >
                      <label>
                        <input
                          className="templete"
                          type="checkbox"
                          value={
                            template.global_connection_type_template_id
                          }
                          checked={selectedTemplateIds.includes(
                            template.global_connection_type_template_id
                          )}
                          onChange={() =>
                            handleTemplateSelection(template)
                          }
                        />
                        {template.global_connection_type_name}
                        {/* <br />
              {template.global_connection_type_description} */}
                      </label>
                    </div>
                  ))}
                  <button onClick={handleFetchObligations}>
                    Add Selected Templates
                  </button>
                </>
              ) : (
                <div>Loading templates...</div>
              )}
            </div>
          </Modal>
        )}
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