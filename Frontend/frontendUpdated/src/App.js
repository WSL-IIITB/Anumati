import React, { useState, useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import { Login } from "./components/Login/Login";
import { Home2 } from "./components/Home/Home2";
import { CreateLocker } from "./components/CreateLocker/CreateLocker";
import { ViewLocker } from "./components/ViewLocker/ViewLocker";
import { UploadResource } from "./components/UploadResource/UploadResource";
import { DPIdirectory } from "./components/DPIdirectory/DPIdirectory";
import { TargetUserView } from "./components/TargetUserView/TargetUserView";
import { Connection } from "./components/Connection/Connection";
import { ConnectionTerms } from "./components/ConnectionTerms/ConnectionTerms";
import { ConnectionTermsHost } from "./components/ConnectionTerms/ConnectionTermsHost"
import { ConnectionTermsGlobal } from "./components/ConnectionTermsGlobal/ConnectionTermsGlobal";
import { ConnectionTermsGlobalHost } from "./components/ConnectionTermsGlobal/ConnectionTermsGlobalHost";
import { TargetLockerView } from "./components/TargetLockerView/TargetLockerView";
import { Admin } from "./components/Admin/Admin";
import { CreateConnectionType } from "./components/CreateConnectionType/CreateConnectionType";
import { CreateConnectionTerms } from "./components/CreateConnectionTerms/CreateConnectionTerms";
import { usercontext } from "./usercontext";
import { ViewTermsByType } from "./components/ViewTermsByTypeUser/ViewTermsByType";
import { Guestusers } from "./components/Guest-users/Guestusers";
import { Guesttermsreview } from "./components/GuestTermsReview/Guesttermsreview";
import ManageUsers from "./components/ManageUsers/ManageUsers";
import FreezeLockerConnection from "./components/FreezeLockerConnection/FreezeLockerConnection";
import CreateGlobalConnectionType from "./components/CreateGlobalConnectionType/CreateGlobalConnectionType";
import SettingsPage from "./components/Settings/SettingsPage";
import { Displayterms } from "./components/Displayterms/Displayterms";
import { ViewHostTermsByType } from "./components/GuestTermsReview/ViewHostTermsByType";
import { HostTermsReview } from "./components/ViewTermsByTypeUser/HostTermsReview";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import GlobalTermsView from './components/GlobalTermsView/GlobalTermsView'; // Import the new component
import { Scanner } from "./components/Scanner/Scanner";
import { AllLokers } from "./components/ViewLocker/Lockers";
import { FreezeLocker } from "./components/Freeze/FreezeLocker";
import { ConnectionTypes } from "./components/ConnectionTypes/ConnectionTypes";
import { FreezeConnection } from "./components/Freeze/FreezeConnection";
import { ConsentDashboard } from "./components/ConsentDashboard/ConsentDashboard";

import { ConnectionProvider } from "./ConnectionContext";
import DirectoryPage from "./components/Directory/directory";
import ViewAllNotifications from "./components/ViewAllNotifications/ViewAllNotifications";

// import  CreateGlobalConnTypesTerms  from './components/GlobalConnectionType/CreateGlobalConnTypesTerms';

function App() {
  const [curruser, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage if available
    const storedUser = localStorage.getItem("curruser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false); // Set loading to false after attempting to load user
  }, []);

  useEffect(() => {
    // Save user to localStorage whenever it changes
    if (curruser) {
      localStorage.setItem("curruser", JSON.stringify(curruser));
    } else {
      localStorage.removeItem("curruser");
    }
  }, [curruser]);

  if (loading) {
    return <div>Loading...</div>; // Render a loading indicator while checking localStorage
  }


  return (
    <div className="App">
      <Router>

        <usercontext.Provider value={{ curruser, setUser }}>
          <ConnectionProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route
                path="/home"
                element={
                  <ProtectedRoute>
                    <Home2 />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-locker"
                element={
                  <ProtectedRoute>
                    <CreateLocker />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/view-locker"
                element={
                  <ProtectedRoute>
                    <ViewLocker />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upload-resource"
                element={
                  <ProtectedRoute>
                    <UploadResource />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dpi-directory"
                element={
                  <ProtectedRoute>
                    <DPIdirectory />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/target-user-view"
                element={
                  <ProtectedRoute>
                    <TargetUserView />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connection"
                element={
                  <ProtectedRoute>
                    <Connection />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connectionTerms"
                element={
                  <ProtectedRoute>
                    <ConnectionTerms />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connectionTermsHost"
                element={
                  <ProtectedRoute>
                    <ConnectionTermsHost />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/connectionTermsGlobal"
                element={
                  <ProtectedRoute>
                    <ConnectionTermsGlobal />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ConnectionTermsGlobalHost"
                element={
                  <ProtectedRoute>
                    <ConnectionTermsGlobalHost />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/target-locker-view"
                element={
                  <ProtectedRoute>
                    <TargetLockerView />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <Admin />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-connection-type"
                element={
                  <ProtectedRoute>
                    <CreateConnectionType />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-connection-terms"
                element={
                  <ProtectedRoute>
                    <CreateConnectionTerms />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/view-terms-by-type"
                element={
                  <ProtectedRoute>
                    <ViewTermsByType />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/make-connection"
                element={
                  <ProtectedRoute>
                    <CreateConnectionType />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/show-connection-terms"
                element={
                  <ProtectedRoute>
                    <CreateConnectionTerms />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/show-guest-users"
                element={
                  <ProtectedRoute>
                    <Guestusers />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/guest-terms-review"
                element={
                  <ProtectedRoute>
                    <Guesttermsreview />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/create-global-connection-type"
                element={<><CreateGlobalConnectionType /> <Scanner /></>}
              />
              <Route
                path="/manage-moderators"
                element={
                  <ProtectedRoute>
                    <ManageUsers role="moderator" />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/manage-admins"
                element={
                  <ProtectedRoute>
                    <ManageUsers role="sys_admin" />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/freeze-locker-connection"
                element={
                  <ProtectedRoute>
                    <FreezeLockerConnection />
                    <Scanner />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/settings-page"
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/display-terms"
                element={
                  <ProtectedRoute>
                    <Displayterms />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/directory"
                element={
                  <ProtectedRoute>
                    <DirectoryPage />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route path="/GlobalTermsView" element={<><GlobalTermsView /> <Scanner /></>} /> {/* Add the new route */}

              <Route
                path="/view-host-terms-by-type"
                element={
                  <ProtectedRoute>
                    <ViewHostTermsByType />
                    <Scanner />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/host-terms-review"
                element={
                  <ProtectedRoute>
                    <HostTermsReview />
                    <Scanner />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/all-lockers"
                element={
                  <ProtectedRoute>
                    <AllLokers />
                    <Scanner />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/freeze-locker"
                element={
                  <ProtectedRoute>
                    <FreezeLocker />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/all-connection-types"
                element={
                  <ProtectedRoute>
                    <ConnectionTypes />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/freeze-connection"
                element={
                  <ProtectedRoute>
                    <FreezeConnection />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/view-all-notifications"
                element={
                  <ProtectedRoute>
                    <ViewAllNotifications />
                    <Scanner />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/consent-dashboard"
                element={
                  <ProtectedRoute>
                    <ConsentDashboard />
                    <Scanner />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<h1>Page Not Found</h1>} />
            </Routes>
          </ConnectionProvider>
        </usercontext.Provider>
      </Router>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { curruser } = useContext(usercontext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!curruser) {
      navigate("/");
    }
  }, [curruser, navigate]);

  return curruser ? children : null;
}


export default App;
