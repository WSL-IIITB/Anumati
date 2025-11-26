import React, { useState } from 'react'
import "./Scanner.css";
import { useNavigate } from "react-router-dom";
import { MdOutlineQrCodeScanner } from "react-icons/md";
import { QrReader } from 'react-qr-reader';

export function Scanner() {
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false); // State to manage QR scanner visibility
    const [isQRModalOpen, setIsQRModalOpen] = useState(false); // State for QR modal
    const [qrData, setQrData] = useState(null);



    const handleQRScanner = (event) => {
        event.stopPropagation(); // Prevent event from bubbling up
        setIsQRModalOpen(true); // Open the QR modal
      };
    
      const handleQRModalClose = () => {
        setIsQRModalOpen(false); // Close the QR modal
        setQrData(null); // Clear QR data when closing
        setScanning(false);
        const videoElement = document.querySelector("video");
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject;
          const tracks = stream.getTracks();
    
          tracks.forEach((track) => {
            track.stop(); // Stop each track (both video and audio)
          });
    
          videoElement.srcObject = null; // Clear the video element source
        }
    
        // Refresh the page when closing the scanner
        window.location.reload();
      };
      
    
      const handleScan = (data) => {
        if (data) {
          try {
            const parsedData = JSON.parse(data);
            console.log("Scanned QR Data:", parsedData);
      
            // Check for essential fields and handle optional ones
            if (
              parsedData.connection_name &&
              parsedData.connection_type_name &&
              parsedData.host_username &&
              parsedData.host_locker_name
            ) {
              // Navigate to CreateConnectionType page with the state data
              navigate("/create-connection-type", {
                state: {
                  hostuser: { username: parsedData.host_username },
                  hostlocker: { name: parsedData.host_locker_name },
                  selectedConnectionType: {
                    connection_type_name: parsedData.connection_type_name,
                    connection_description: parsedData.connection_description || '',
                  },
                },
              });
      
              // Stop scanning and reload the page
              setScanning(false);
              window.location.reload(); // This will reload the page after navigating
            } else {
              console.error("Parsed data is missing essential fields");
            }
          } catch (error) {
            console.error("Invalid QR Code:", error);
          }
        }
      };
      
    
      const handleError = (err) => {
        console.error(err); // Log any error during scanning
      };
      
  return (
    <div id="scanner">
        <div className="qr-scanner-icon" onClick={handleQRScanner}>
                  <MdOutlineQrCodeScanner size={30} style={{color:"white", fontWeight:"bolder"}}/>
                </div>
                {/* </li> */}
                {isQRModalOpen && (
                  <div className="qr-scanner-overlay" style={{marginTop:"30px"}}>
                    <div className="qr-scanner-box">
                      <QrReader
                        onResult={(result, error) => {
                          if (result) {
                            handleScan(result?.text);  // Directly call handleScan with the scanned text
                          }
                          if (error) {
                            handleError(error);  // Call handleError for any errors
                          }
                        }}
                        constraints={{ facingMode: "environment" }}  // Use the back camera
                        style={{ width: "100%", height: "100%" }}
                      />
                      <button className="qr-scanner-close" onClick={handleQRModalClose}>Close</button>
                    </div>
                  </div>
                )}
    </div>
  )
}
