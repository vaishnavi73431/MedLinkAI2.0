import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { ArrowLeft, Brain, Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface AdminTrainingProps {
    onBack: () => void;
}

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

export default function AdminTraining({ onBack }: AdminTrainingProps) {

    const [logs, setLogs] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    const generateEmbeddings = async (table: string, textColumn: string, extraColumn?: string) => {
        addLog(`Checking ${table}...`);

        // Fetch rows without embeddings
        const { data: rows, error } = await supabase
            .from(table)
            .select('*')
            .is('embedding', null)
            .limit(50);

        if (error) {
            addLog(`Error fetching ${table}: ${error.message}`);
            return;
        }

        if (!rows || rows.length === 0) {
            addLog(`No pending rows for ${table}.`);
            return;
        }

        addLog(`Found ${rows.length} rows to train in ${table}. Starting...`);
        setIsProcessing(true);
        setProgress({ current: 0, total: rows.length });

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            let text = row[textColumn];

            // Special logic for combined columns
            if (table === 'medical_symptoms' && extraColumn) {
                const symp = Array.isArray(row[extraColumn]) ? row[extraColumn].join(', ') : row[extraColumn];
                text = `Disease: ${text}. Symptoms: ${symp}`;
            } else if (table === 'gym_exercises' && extraColumn) {
                text = `${text}: ${row[extraColumn]}`;
            }

            if (!text) continue;

            try {
                const response = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: text,
                });
                const embedding = response.data[0].embedding;

                await supabase
                    .from(table)
                    .update({ embedding })
                    .eq('id', row.id);

                setProgress(p => ({ ...p, current: i + 1 }));
            } catch (e: any) {
                addLog(`Error on row ${row.id}: ${e.message}`);
            }
        }

        addLog(`Batch complete for ${table}.`);
        setIsProcessing(false);
    };

    const startTraining = async () => {
        setLogs([]);
        await generateEmbeddings('nutrition_facts', 'food_name');
        await generateEmbeddings('medical_symptoms', 'disease', 'symptoms');
        await generateEmbeddings('gym_exercises', 'title', 'description');
        addLog("All tasks finished!");
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Brain className="w-8 h-8 text-purple-600" />
                        AI Training Dashboard
                    </h1>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Generate Embeddings</h2>
                            <p className="text-gray-500 text-sm">Process database rows and create vector embeddings via browser.</p>
                        </div>
                        <button
                            onClick={startTraining}
                            disabled={isProcessing}
                            className={`px-6 py-3 rounded-lg flex items-center gap-2 font-medium text-white transition-all ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-lg hover:shadow-purple-500/30'
                                }`}
                        >
                            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5" />}
                            {isProcessing ? 'Training...' : 'Start Training Batch'}
                        </button>
                    </div>

                    {isProcessing && (
                        <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                                <span>Progress</span>
                                <span>{progress.current} / {progress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm text-green-400">
                        {logs.length === 0 ? (
                            <span className="text-gray-500 opacity-50">Waiting to start... logs will appear here.</span>
                        ) : (
                            logs.map((log, i) => <div key={i}>{log}</div>)
                        )}
                        {logs.length > 0 && <div className="animate-pulse">_</div>}
                    </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                        <p className="font-semibold">Why use this?</p>
                        <p>Your terminal network is blocked, so we use your browser (which works!) to connect to OpenAI and Supabase directly.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
