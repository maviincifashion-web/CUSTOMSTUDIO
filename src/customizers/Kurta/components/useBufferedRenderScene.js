import { useEffect, useMemo, useState } from 'react';
import { Image } from 'react-native';

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
        setIsLoading(true);

        Promise.allSettled(remoteEntries.map(prefetchEntrySource)).then(() => {
            if (cancelled) return;
            setDisplayEntries(nextEntries);
            setDisplaySignature(nextSignature);
            setHasCommittedScene(true);
            setIsLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [displaySignature, hasCommittedScene, nextEntries, nextSignature]);

    return {
        displayEntries,
        isLoading,
        hasCommittedScene,
    };
}