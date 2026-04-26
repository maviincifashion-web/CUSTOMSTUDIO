import { useEffect, useMemo, useRef, useState } from 'react';
import { Image } from 'react-native';

/**
 * Maximum time (ms) to wait for remote image prefetching before committing the scene.
 * SmartLayer handles individual image transitions, so it's safe to commit early.
 */
const PREFETCH_TIMEOUT_MS = 2000;

const getRenderSourceKey = (source) => {
    if (typeof source === 'number') return `asset:${source}`;
    if (source?.uri) return `uri:${source.uri}`;
    return '';
};

const hasRemoteSource = (entry) => Boolean(entry?.src?.uri);

const prefetchEntrySource = async (entry) => {
    if (!hasRemoteSource(entry)) return true;
    try {
        await Image.prefetch(entry.src.uri);
        return true;
    } catch {
        return false;
    }
};

/**
 * Creates a promise that resolves after `ms` milliseconds.
 * Returns a cancel function to clear the timer if prefetch finishes first.
 */
const createTimeout = (ms) => {
    let timerId;
    const promise = new Promise((resolve) => {
        timerId = setTimeout(resolve, ms);
    });
    const cancel = () => clearTimeout(timerId);
    return { promise, cancel };
};

export function useBufferedRenderScene(entries) {
    const nextEntries = useMemo(
        () => (Array.isArray(entries) ? entries : []),
        [entries]
    );
    const nextSignature = useMemo(
        () => nextEntries.map((entry) => `${entry?.key || ''}:${entry?.zIndex || ''}:${getRenderSourceKey(entry?.src)}`).join('|'),
        [nextEntries]
    );

    const [displayEntries, setDisplayEntries] = useState(nextEntries);
    const [displaySignature, setDisplaySignature] = useState(nextSignature);
    const [hasCommittedScene, setHasCommittedScene] = useState(nextEntries.length === 0);
    const [isLoading, setIsLoading] = useState(false);
    const commitRef = useRef(0);

    useEffect(() => {
        const needsWarmScene = !hasCommittedScene || nextSignature !== displaySignature;
        if (!needsWarmScene) return;

        const remoteEntries = nextEntries.filter(hasRemoteSource);
        if (remoteEntries.length === 0) {
            setDisplayEntries(nextEntries);
            setDisplaySignature(nextSignature);
            setHasCommittedScene(true);
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        const currentCommit = ++commitRef.current;
        setIsLoading(true);

        const commitScene = () => {
            if (cancelled || commitRef.current !== currentCommit) return;
            setDisplayEntries(nextEntries);
            setDisplaySignature(nextSignature);
            setHasCommittedScene(true);
            setIsLoading(false);
        };

        // Race: prefetch all images VS timeout
        // Whichever finishes first commits the scene.
        // This prevents the scene from getting stuck if an image hangs.
        const timeout = createTimeout(PREFETCH_TIMEOUT_MS);
        const prefetchAll = Promise.allSettled(remoteEntries.map(prefetchEntrySource));

        Promise.race([prefetchAll, timeout.promise]).then(() => {
            timeout.cancel();
            commitScene();
        });

        return () => {
            cancelled = true;
            timeout.cancel();
        };
    }, [displaySignature, hasCommittedScene, nextEntries, nextSignature]);

    return {
        displayEntries,
        isLoading,
        hasCommittedScene,
    };
}