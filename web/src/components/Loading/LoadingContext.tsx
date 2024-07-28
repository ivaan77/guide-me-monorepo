'use client';
import { createContext, PropsWithChildren, ReactElement, useState } from 'react';

const INITIAL_LOADER_COUNT = 0;

interface LoadingContext {
    isLoading: boolean;
    withLoading: <T>(promise: Promise<T>) => Promise<T>;
}

export const LoadingContext = createContext<LoadingContext>({
    isLoading: false,
    withLoading: (promise: Promise<any>) => promise,
});

export const LoadingProvider = ({ children }: PropsWithChildren<unknown>): ReactElement => {
    const [loaderCount, setLoaderCount] = useState<number>(INITIAL_LOADER_COUNT);

    const isLoading = loaderCount != INITIAL_LOADER_COUNT;
    const startLoading = () => setLoaderCount((prevState: number) => prevState + 1);
    const stopLoading = () => setLoaderCount((prevState: number) => prevState - 1);

    const withLoading = <T, >(promise: Promise<T>): Promise<T> => {
        startLoading();
        promise.finally(stopLoading);
        return promise;
    };

    return <LoadingContext.Provider value={{ isLoading, withLoading }}>{children}</LoadingContext.Provider>;
};
