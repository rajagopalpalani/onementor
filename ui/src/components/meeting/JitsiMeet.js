"use client";

import { useEffect, useRef, useState } from "react";

/**
 * JitsiMeet Component
 * Uses Jitsi External API for programmatic control
 * 
 * @param {Object} props
 * @param {string} props.roomName - Jitsi room name
 * @param {string} props.jitsiUrl - Full Jitsi URL with parameters
 * @param {Object} props.userInfo - User information
 * @param {string} props.userInfo.displayName - User display name
 * @param {string} props.userInfo.email - User email
 * @param {string} props.userRole - User role ('mentor' or 'user')
 * @param {Function} props.onLeave - Callback when user leaves meeting
 * @param {string} props.className - Additional CSS classes
 */
export default function JitsiMeet({ 
  roomName, 
  jitsiUrl, 
  userInfo = {},
  userRole = 'user',
  onLeave,
  className = ""
}) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const initializedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current || apiRef.current) {
      return;
    }

    if (!roomName && !jitsiUrl) {
      setError("Room name or Jitsi URL is required");
      setIsLoading(false);
      return;
    }

    // Extract room name and domain from URL if needed
    let finalRoomName = roomName;
    let jitsiDomain = 'meet.jit.si'; // Default domain
    
    if (jitsiUrl) {
      try {
        const url = new URL(jitsiUrl);
        jitsiDomain = url.hostname; // Extract domain from URL
        finalRoomName = url.pathname.split('/').pop() || url.pathname.replace('/', '');
        // Remove query params and hash if present
        finalRoomName = finalRoomName.split('?')[0].split('#')[0];
      } catch (e) {
        // If jitsiUrl is not a full URL, try to extract domain
        if (jitsiUrl.includes('://')) {
          const match = jitsiUrl.match(/https?:\/\/([^\/]+)/);
          if (match) {
            jitsiDomain = match[1];
          }
        }
        // Use as room name if not a full URL
        if (!finalRoomName) {
          finalRoomName = jitsiUrl.split('?')[0].split('#')[0];
        }
      }
    }

    if (!finalRoomName) {
      setError("Room name is required");
      setIsLoading(false);
      return;
    }

    // Load Jitsi External API
    const loadJitsiAPI = () => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve(window.JitsiMeetExternalAPI);
          return;
        }
        
        // Check if script already exists
        const existingScript = document.querySelector('script[src="https://meet.jit.si/external_api.js"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => {
            if (window.JitsiMeetExternalAPI) {
              resolve(window.JitsiMeetExternalAPI);
            } else {
              reject(new Error('Jitsi API not available after script load'));
            }
          });
          return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        script.onload = () => {
          if (window.JitsiMeetExternalAPI) {
            resolve(window.JitsiMeetExternalAPI);
          } else {
            reject(new Error('Jitsi API not available after script load'));
          }
        };
        script.onerror = () => reject(new Error('Failed to load Jitsi External API'));
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      try {
        setIsLoading(true);
        
        // Load Jitsi API
        await loadJitsiAPI();
        
        // Double check container exists after API loads
        if (!containerRef.current) {
          console.warn('Container not available after API load');
          setIsLoading(false);
          initializedRef.current = false;
          return;
        }
        
        // Mark as initialized AFTER container check
        initializedRef.current = true;

        // Get current values from props (captured in closure)
        const currentUserRole = userRole;
        const currentUserInfo = userInfo;
        const currentOnLeave = onLeave;
        const isModerator = currentUserRole === 'mentor';
        
        // Build configuration - same for both users and coaches (login button hidden)
        const config = {
          roomName: finalRoomName,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableClosePage: false,
            requireDisplayName: false, // Don't require display name - allows guest access
            disableInviteFunctions: true,
            disableThirdPartyRequests: true,
            defaultLanguage: 'en',
            enableNoisyMicDetection: true,
            enableNoAudioDetection: true,
            enableLayerSuspension: true,
            channelLastN: -1,
            enableRemb: true,
            enableTcc: true,
            enableInsecureRoomNameWarning: false,
            // Disable prejoin page - allows direct joining without login
            prejoinPageEnabled: false, // Hide prejoin/login for both
            enablePrejoinPage: false, // Alternative property name
            enableLobbyChat: false,
            // Allow guest access - no authentication required
            enableLobby: false, // Disable lobby/waiting room
            // Ensure guest access is enabled
            enableUserRolesBasedOnToken: false,
            // Disable authentication requirements
            disableRemoteMute: false,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            BRAND_WATERMARK_LINK: '',
            SHOW_POWERED_BY: false,
            APP_NAME: 'OneMentor',
            NATIVE_APP_NAME: 'OneMentor',
            PROVIDER_NAME: 'OneMentor',
            SHARE_BUTTON_ENABLED: false,
            INVITE_ENABLED: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'recording',
              'livestreaming', 'etherpad', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
          },
          userInfo: {
            displayName: currentUserInfo.displayName || (isModerator ? 'Coach' : 'User'),
            email: currentUserInfo.email || '',
          },
          // Additional options to ensure proper joining
          noSSL: false,
          jwt: null, // No JWT required for public instance
        };

        // Create Jitsi API instance
        // Using External API with prejoinPageEnabled: false should auto-join
        // Use the domain extracted from jitsiUrl or default to meet.jit.si
        const api = new window.JitsiMeetExternalAPI(jitsiDomain, config);
        apiRef.current = api;
        
        // Note: With prejoinPageEnabled: false, the API should automatically join
        // The first person to join becomes moderator automatically
        // If you still see "waiting for moderator", it means the room is empty
        // Once someone joins, others can join immediately without the prompt

        // Handle events - these fire when user actually joins
        api.addEventListener('videoConferenceJoined', () => {
          setIsLoading(false);
          setError(null);
          console.log('Successfully joined conference');
        });

        api.addEventListener('conferenceJoined', () => {
          console.log('Conference joined - user is in the meeting');
          setIsLoading(false);
          setError(null);
        });

        api.addEventListener('participantJoined', (event) => {
          console.log('Participant joined:', event);
        });

        api.addEventListener('readyToClose', () => {
          if (currentOnLeave) {
            currentOnLeave();
          }
        });

        api.addEventListener('participantRoleChanged', (event) => {
          console.log('Participant role changed:', event);
          if (event.role === 'moderator') {
            console.log('User is now moderator');
            setIsLoading(false);
          }
        });

        api.addEventListener('error', (error) => {
          console.error('Jitsi error:', error);
          setError('Failed to join meeting. Please try again.');
          setIsLoading(false);
        });

        // With prejoinPageEnabled: false, the API should auto-join
        // But we set a timeout to hide loading after a reasonable time
        setTimeout(() => {
          setIsLoading(false);
        }, 3000);

      } catch (err) {
        console.error('Error initializing Jitsi:', err);
        setError('Failed to load meeting. Please check your connection.');
        setIsLoading(false);
        initializedRef.current = false; // Reset on error so it can retry
        apiRef.current = null;
      }
    };

    // Initialize Jitsi
    initializeJitsi();

    // Cleanup
    return () => {
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (e) {
          console.log('Error disposing Jitsi API:', e);
        }
        apiRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [roomName, jitsiUrl]); // Only depend on roomName and jitsiUrl to prevent re-initialization

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <p className="text-red-600 font-semibold mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading meeting room...</p>
          </div>
        </div>
      )}
      <div 
        ref={containerRef}
        className="w-full h-full"
        style={{ minHeight: '100%', height: '100%' }}
      />
    </div>
  );
}
