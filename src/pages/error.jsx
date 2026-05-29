import { Link } from 'react-router-dom';

function ErrorPage() {
    return (
        <div className="flex flex-col gap-2 justify-center items-center w-full h-screen bg-gray-900 overflow-hidden">
            <div className="text-2xl text-white">404 ERROR, this page cannot be found</div>
            <Link to="/login" className="text-blue-200 hover:underline text-sm">Click here to go back!</Link>
        </div>
    )
}

export default ErrorPage;
