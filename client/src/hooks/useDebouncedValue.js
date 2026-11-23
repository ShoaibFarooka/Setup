import { useEffect, useState } from 'react';

// The value, but only after it stopped changing for `delay` ms. For search boxes: typing "lovelace" sends one
// request instead of eight.
const useDebouncedValue = (value, delay = 300) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debounced;
};

export default useDebouncedValue;
