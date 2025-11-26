import React, { useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { useParams, useLocation } from 'react-router-dom';
import { frontend_host } from '../../config';

export const GetResource = ({ username, lockerName, onSubmit }) =>{
    const [selectedResources, setSelectedResources] = useState([]);
    const [error, setError] = useState(null);
    const [resources, setResources] = useState([]);
    const [vnode_resources, setVnodeResources] = useState([]);
    console.log(lockerName);
    

    const handleCheckboxChange = (resource) => {
        setSelectedResources(prevState => {
            if (prevState.includes(resource)) {
                return prevState.filter(res => res !== resource);
            } else {
                return [...prevState, resource];
            }
        });
    };

    useEffect(() => {
        console.log(lockerName);
        console.log(username);

        if (lockerName) {
            fetchResources();
        }
    }, [lockerName]);


    const fetchResources = async () => {
        try {
          const token = Cookies.get('authToken');
        //   const params = new URLSearchParams({ username : username, locker_name: lockerName, obligation: obligation.labelName });
  
          const response = await fetch(`host/get-resources-user-locker/?locker_name=${lockerName}`.replace(/host/, frontend_host), {
            method: 'GET',
            headers: {
              'Authorization': `Basic ${token}`,
              'Content-Type': 'application/json'
            }
          });
  
          if (!response.ok) {
            throw new Error('Failed to fetch resources');
          }
  
          const data = await response.json();
          if (data.success) {
            setResources(data.resources);
          } else {
            setError(data.message || 'Failed to fetch resources');
          }
        } catch (error) {
          console.error('Error fetching resources:', error);
          setError('An error occurred while fetching resources');
        }
      };


      
    const handleSubmit = () => {
        onSubmit(selectedResources);
    };

    

    return (
        <div className="resource-list">
            <h3>Select Resources</h3>
            {error && <p className="error">{error}</p>}
            <ul>
                {resources.map(resource => (
                    <li key={resource}>
                        <label>
                            <input
                                type="checkbox"
                                value={resource}
                                onChange={() => handleCheckboxChange(resource)}
                            />
                            {resource}
                        </label>
                    </li>
                ))}
            </ul>
            <button onClick={handleSubmit}>Submit</button>
        </div>
    );
}
