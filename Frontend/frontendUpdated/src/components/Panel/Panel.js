// import React from "react";
// import { Link, useLocation } from "react-router-dom";
// import "./Panel.css";

// const Panel = () => {
//   const location = useLocation();
// //   const locker = location.state ? location.state.connectionData.lockerName : null;


//   return (
//     <div className="panel">
//       <ul>
//         <li className={location.pathname === "/connection" ? "selected" : ""}>
//           <Link to="/connection" >Connection Type creation</Link>
//         </li>
//         <li
//           className={location.pathname === "/connectionTerms" ? "selected" : ""}
//         >
//           <Link to="/connectionTerms">Connection Terms</Link>
//         </li>
//       </ul>
//     </div>
//   );
// };

// export default Panel;


// panel.js
import React from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Panel.css";

const Panel = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // console.log("panel location state",location.state);
  // const locker = location.state ? location.state.locker : null;
  
  // const connectionData = location.state ? location.state.connectionData : null;
  const [locker, setLocker] = useState(location.state?.locker || null);
  const [connectionData, setConnectionData] = useState(location.state?.connectionData || null);

  // console.log("panel locker", locker);
  //   console.log("panel connection data", connectionData);

    // const handleNavigation = (path) => {
    //   navigate(path, { state: { locker, connectionData } });
    // };
  
  return (
    <div className="panel">
      <ul>
        <li className={location.pathname === "/connection" ? "selected" : ""}>
          <Link 
            to="/connection"
            onClick={() => navigate("/connection")}
          >
            Connection Type creation
          </Link>
        </li>
        <li
          className={location.pathname === "/connectionTerms" ? "selected" : ""}
        >
          <Link 
            to="/connectionTerms"
            onClick={() => navigate("/connectionTerms")}
          >
            Guest Connection Terms
          </Link>
        </li>
        <li
          className={location.pathname === "/connectionTermsHost" ? "selected" : ""}
        >
          <Link 
            to="/connectionTermsHost"
            onClick={() => navigate("/connectionTermsHost")}
          >
            Host Connection Terms
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Panel;

