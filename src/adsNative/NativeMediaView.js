import React, { useRef, useEffect, useContext, useCallback } from 'react';
import {
  findNodeHandle,
  Platform,
  requireNativeComponent,
  UIManager,
} from 'react-native';
import { NativeAdContext } from './context';

const NativeMediaView = (props) => {
  const { nativeAd, nativeAdView } = useContext(NativeAdContext);
  const adMediaView = useRef(null);
  const nodeHandleRef = useRef(null);
  const timersRef = useRef({});

  const clearIntervalForNode = useCallback(() => {
    if (nodeHandleRef.current && timersRef.current[nodeHandleRef.current]) {
      clearInterval(timersRef.current[nodeHandleRef.current]);
      timersRef.current[nodeHandleRef.current] = null;
    }
  }, []);

  const setIntervalForNode = useCallback(() => {
    clearIntervalForNode();
    const handle = nodeHandleRef.current;
    if (!handle) return;

    timersRef.current[handle] = setInterval(() => {
      if (!adMediaView.current) {
        clearIntervalForNode();
        return;
      }
      UIManager.dispatchViewManagerCommand(
        findNodeHandle(adMediaView.current),
        UIManager.getViewManagerConfig('RNGADMediaView').Commands.getProgress,
        []
      );
    }, 1000);
  }, [clearIntervalForNode]);

  const onLayout = useCallback(() => {
    if (!nativeAdView || !adMediaView.current) return;
    clearIntervalForNode();

    const handle = findNodeHandle(adMediaView.current);
    nodeHandleRef.current = handle;

    nativeAdView.setNativeProps({ mediaview: handle });
  }, [nativeAdView, clearIntervalForNode]);

  useEffect(() => {
    onLayout();
    return () => clearIntervalForNode();
  }, [nativeAd, nativeAdView, onLayout, clearIntervalForNode]);

  // Event handlers
  const handleVideoPlay = () => {
    setIntervalForNode();
    props.onVideoPlay?.();
  };

  const handleVideoPause = () => {
    clearIntervalForNode();
    props.onVideoPause?.();
  };

  const handleVideoEnd = () => {
    clearIntervalForNode();
    props.onVideoEnd?.();
  };

  const handleVideoProgress = (event) => {
    if (Platform.OS === 'android') {
      const { duration, currentTime } = event.nativeEvent;
      if (parseFloat(currentTime) + 4 > parseFloat(duration)) {
        clearIntervalForNode();
      }
    }
    props.onVideoProgress?.(event.nativeEvent);
  };

  const handleVideoMute = (event) => {
    props.onVideoMute?.(event.nativeEvent?.muted);
  };

  return (
    <AdMediaView
      {...props}
      pause={props.paused}
      onVideoPlay={handleVideoPlay}
      onVideoPause={handleVideoPause}
      onVideoEnd={handleVideoEnd}
      onVideoProgress={handleVideoProgress}
      onVideoMute={handleVideoMute}
      ref={adMediaView}
      onLayout={onLayout}
    />
  );
};

const AdMediaView = requireNativeComponent('RNGADMediaView', NativeMediaView);

export default NativeMediaView;
