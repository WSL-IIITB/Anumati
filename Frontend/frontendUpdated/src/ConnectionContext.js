import React, { createContext, useState } from 'react';

export const ConnectionContext = createContext();

export const ConnectionProvider = ({ children }) => {
  const [locker_conn, setLocker_conn] = useState(null);
  const [connectionData, setConnectionData] = useState({
    // Initialize with your default values
  });
  const [connectionTermsData, setConnectionTermsData] = useState({
    // Initialize with your default values
  });

  return (
    <ConnectionContext.Provider
      value={{
        locker_conn,
        setLocker_conn,
        connectionData,
        setConnectionData,
        connectionTermsData,
        setConnectionTermsData,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};
