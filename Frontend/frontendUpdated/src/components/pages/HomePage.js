

import React, { useState } from "react";
import { Home2 } from "../Home/Home2"; // adjust the path if needed
import Sidebar from "../Sidebar/Sidebar"; // adjust the path if needed
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

const HomePage = () => {
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

  return (
    <div className="app-container">
      <button
        className={`hamburger-menu ${isSidebarOpen ? "hidden" : ""}`}
        onClick={toggleSidebar}
      >
        <FontAwesomeIcon icon={faBars} style={{fontSize:"20px"}}/>
      </button>

      <Sidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        openSubmenus={openSubmenus}
        toggleSubmenu={toggleSubmenu}
      />

      <Home2 />
    </div>
  );
};

export default HomePage;
