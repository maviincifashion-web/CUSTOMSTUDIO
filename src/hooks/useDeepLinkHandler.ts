import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRemoteControl } from '../context/RemoteControlContext';

export function useDeepLinkHandler() {
  const { joinTVSession } = useRemoteControl();

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      const { queryParams } = Linking.parse(url);
      
      if (queryParams?.sessionId && typeof queryParams.sessionId === 'string') {
        try {
          await joinTVSession(queryParams.sessionId);
          // Navigate to kurta screen or show message
          console.log('Joined TV session:', queryParams.sessionId);
        } catch (error) {
          console.error('Failed to join session:', error);
        }
      }
    };

    // Handle initial URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    // Listen for new links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [joinTVSession]);
}