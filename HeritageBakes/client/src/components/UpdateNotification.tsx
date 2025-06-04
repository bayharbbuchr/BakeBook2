import { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const UpdateNotification = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        
        // Listen for the 'controllerchange' event
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (refreshing) return;
          setRefreshing(true);
          window.location.reload();
        });
      });

      // Listen for the 'updatefound' event
      navigator.serviceWorker.addEventListener('updatefound', () => {
        const newWorker = registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
              showUpdateNotification();
            }
          });
        }
      });
    }
  }, [registration, refreshing]);

  const showUpdateNotification = () => {
    toast.info(
      <div>
        <p>New version available!</p>
        <button 
          onClick={updateApp}
          style={{
            background: '#fff',
            color: '#000',
            border: 'none',
            padding: '5px 10px',
            marginTop: '10px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Update Now
        </button>
      </div>,
      {
        position: "bottom-center",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      }
    );
  };

  const updateApp = () => {
    if (registration && registration.waiting) {
      // Send message to service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  return (
    <ToastContainer
      position="bottom-center"
      autoClose={false}
      newestOnTop={false}
      closeOnClick={false}
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  );
};

export default UpdateNotification;
