import { useEffect, useState } from "react";
const useScreenSize = () => {
    const [screen, setScreen] = useState();

    const handleResize = () => {
        setScreen(window?.innerWidth);
    };
    useEffect(() => {
        setScreen(window?.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return screen;
};

export default useScreenSize;





