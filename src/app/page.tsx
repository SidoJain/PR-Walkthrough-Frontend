'use client';

import { useState } from 'react';
import { WalkthroughResponse } from '../types';
import DiffEditor from '../components/DiffEditor';
import WalkthroughPlayer from '../components/WalkthroughPlayer';

export default function Home() {
    const [prUrl, setPrUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [walkthroughData, setWalkthroughData] = useState<WalkthroughResponse | null>(null);
    const [error, setError] = useState('');
    const [activeLine, setActiveLine] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prUrl) return;

        setIsLoading(true);
        setError('');
        setLoadingStatus('Fetching diff and analyzing architecture...');
        setWalkthroughData(null);
        setActiveLine(null);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/generate-walkthrough';

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pr_url: prUrl }),
            });

            if (!response.ok) {
                throw new Error('Failed to generate walkthrough. Check the PR URL.');
            }

            setLoadingStatus('Synthesizing audio and mapping timestamps...');
            const data: WalkthroughResponse = await response.json();

            setWalkthroughData(data);
            if (data.script && data.script.length > 0) {
                setActiveLine(data.script[0].line_number);
            }

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setIsLoading(false);
            setLoadingStatus('');
        }
    };

    return (
        <main className="min-h-screen bg-neutral-950 text-neutral-200 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                <header className="space-y-4">
                    <h1 className="text-3xl font-bold text-white tracking-tight">PR Audio Walkthrough</h1>
                    <form onSubmit={handleSubmit} className="flex gap-4">
                        <input
                            type="url"
                            placeholder="https://github.com/owner/repo/pull/123"
                            value={prUrl}
                            onChange={(e) => setPrUrl(e.target.value)}
                            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
                        >
                            Analyze PR
                        </button>
                    </form>
                </header>

                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-neutral-400 animate-pulse">{loadingStatus}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {walkthroughData && !isLoading && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">

                        <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden flex flex-col">
                            <div className="bg-neutral-800/50 px-4 py-2 border-b border-neutral-800 text-xs font-mono text-neutral-400">
                                Diff Viewer
                            </div>
                            <div className="flex-1 p-0 flex flex-col relative">
                                {/* Replaced Placeholder with DiffEditor */}
                                <DiffEditor
                                    code={walkthroughData.raw_diff}
                                    activeLine={activeLine}
                                />
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col p-4 space-y-4">
                            <h2 className="text-lg font-semibold text-white">Walkthrough Audio</h2>
                            <div className="flex-1 flex flex-col items-start justify-start p-0">
                                {/* Replaced Placeholder with WalkthroughPlayer */}
                                <WalkthroughPlayer
                                    audioBase64={walkthroughData.audio_base64}
                                    script={walkthroughData.script}
                                    onLineChange={setActiveLine}
                                />
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </main>
    );
}