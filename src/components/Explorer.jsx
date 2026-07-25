import Folder from './Folder'
import { useState, useEffect } from "react";
import supabase from '../supabaseClient.jsx';
import { IoCloudDownloadOutline } from "react-icons/io5";

const Explorer = ({ open, treeVersion, activeTab, setActiveTab, openTabs, setOpenTabs, setTreeVersion }) => {
    const [data, setData] = useState(null);
    const [dragItem, setDragItem] = useState('');
    const [cloudFiles, setCloudFiles] = useState([]);
    const [cloudVersion, setCloudVersion] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            const result = await window.fileApi.readFolder(localStorage.getItem('rootFolder'));
            setData(result);
        }
        fetchData();
    }, [treeVersion]);

    useEffect(() => {
        let channel;

        const fetchCloudFiles = async (userId) => {
            const { data, error } = await supabase
                .from('cloud_notes')
                .select('file_name, updated_at')
                .eq('user_id', userId)
                .order('file_name', { ascending: true });
            if (!error) setCloudFiles(data);
        }

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await fetchCloudFiles(user.id);

            channel = supabase
                .channel('cloud_notes_changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'cloud_notes', filter: `user_id=eq.${user.id}` },
                    () => fetchCloudFiles(user.id)
                )
                .subscribe();
        }
        init();

        return () => { if (channel) supabase.removeChannel(channel); }
    }, []);

    useEffect(() => {
        let channel;

        const fetchCloudFiles = async (userId) => {
            const { data, error } = await supabase
                .from('cloud_notes')
                .select('file_name, updated_at')
                .eq('user_id', userId)
                .order('file_name', { ascending: true });
            if (!error) setCloudFiles(data);
        }

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await fetchCloudFiles(user.id);

            channel = supabase
                .channel('cloud_notes_changes')
                .on('postgres_changes',
                    { event: '*', schema: 'public', table: 'cloud_notes', filter: `user_id=eq.${user.id}` },
                    () => fetchCloudFiles(user.id)
                )
                .subscribe();
        }
        init();

        return () => { if (channel) supabase.removeChannel(channel); }
    }, [cloudVersion]);

    const handleDownload = async (fileName) => {
        const { data, error } = await supabase
            .from('cloud_notes')
            .select('content')
            .eq('file_name', fileName)
            .single();
        if (error) return console.error('Download failed:', error);

        const path = `${localStorage.getItem('rootFolder')}/${fileName}`;
        if (!(await window.fileApi.checkExists(path))) {
            await window.fileApi.createFile(path);
        }
        await window.fileApi.writeFile(path, data.content ?? '');
        setTreeVersion(v => v + 1);
    }

    return (
        <div className={`h-screen w-[15%] border-r-1 border-(--color-border) bg-(--color-primary) text-(--color-text) overflow-hidden whitespace-nowrap ${ open ? "block" : "hidden"}`}>
            <nav className="flex flex-col">
                <div className="p-2">
                    <span> Local Files </span>
                    {data ? <Folder className="ml-2" TreeNode={data} activeTab={activeTab} setActiveTab={setActiveTab} openTabs={openTabs} setOpenTabs={setOpenTabs} indents={0} setTreeVersion={setTreeVersion} dragItem={dragItem} setDragItem={setDragItem} setCloudVersion={setCloudVersion} /> : <></>}
                </div>

                <hr className='mx-2'/>

                <div className='p-2'>
                    <span>Cloud Files</span>
                    <div className="ml-2 flex flex-col mt-1">
                        {cloudFiles.length === 0 && (
                            <span className="text-xs text-(--color-text) opacity-60">No files uploaded yet</span>
                        )}
                        {cloudFiles.map(f => (
                            <div
                                key={f.file_name}
                                className="flex items-center justify-between pr-2 cursor-pointer hover:bg-(--color-secondary)"
                                onClick={() => handleDownload(f.file_name)}
                            >
                                <span className="text-ellipsis overflow-hidden whitespace-nowrap">{f.file_name}</span>
                                <IoCloudDownloadOutline size={14} className="text-(--color-icon) shrink-0 ml-1" />
                            </div>
                        ))}
                    </div>
                </div>
            </nav>
        </div>
    );
}

export default Explorer;