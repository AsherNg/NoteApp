import { useEffect } from "react";

const Modal = ({ children, isOpen }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';      
        }
        return () => {document.body.style.overflow = '';};
    }, [isOpen]);

    if (!isOpen) return null;
    
    return (
        <div className="flex justify-center items-center fixed w-screen h-screen bg-black/70">
            {children}
        </div>
    )
}

export default Modal;