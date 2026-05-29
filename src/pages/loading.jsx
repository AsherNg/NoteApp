function Loading() {
    return (
        <div className="flex justify-center items-center w-full h-screen bg-gray-900">
            <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:0ms]" />
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:500ms]" />
                <div className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:1000ms]" />
            </div>
        </div>
    );
}
export default Loading;
