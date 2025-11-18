import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { SrtEntry, ProcessReport, AudioFile, ConfigOptions, DurationMode } from './types';
import { parseSrt } from './services/srtParser';
import { processAndMergeAudio } from './services/audioProcessor';
import { FileUpload } from './components/FileUpload';
import { ResultsDisplay } from './components/ResultsDisplay';
import { Header } from './components/Header';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { MergeIcon, LoaderIcon } from './components/Icons';
import { t } from './localization/vi';

const INITIAL_CONFIG: ConfigOptions = {
    pitchShift: 2,
    playbackRate: 1.2,
    durationMode: DurationMode.KEEP,
    soundOptimization: true,
};

const App: React.FC = () => {
    const [srtFile, setSrtFile] = useState<File | null>(null);
    const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [progressMessage, setProgressMessage] = useState<string>('');
    const [progressPercent, setProgressPercent] = useState<number>(0);
    const [report, setReport] = useState<ProcessReport | null>(null);
    const [outputBlob, setOutputBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [parsedSrtData, setParsedSrtData] = useState<SrtEntry[]>([]);
    const [config, setConfig] = useState<ConfigOptions>(() => {
        const savedConfig = localStorage.getItem('app-config');
        if (savedConfig) {
            try {
                const parsedConfig = JSON.parse(savedConfig);
                return { ...INITIAL_CONFIG, ...parsedConfig };
            } catch (e) {
                console.error("Failed to parse saved config", e);
                return INITIAL_CONFIG;
            }
        }
        return INITIAL_CONFIG;
    });
    const [theme, setTheme] = useState(() => localStorage.getItem('app-theme') || 'dark');

    useEffect(() => {
        document.documentElement.className = `theme-${theme}`;
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    useEffect(() => {
        localStorage.setItem('app-config', JSON.stringify(config));
    }, [config]);

    const resetState = useCallback((keepFiles = false) => {
        setIsLoading(false);
        setProgressMessage('');
        setProgressPercent(0);
        setReport(null);
        setOutputBlob(null);
        setError(null);
        if (!keepFiles) {
            setSrtFile(null);
            setAudioFiles([]);
            setParsedSrtData([]);
        }
    }, []);

    const handleSrtUpload = useCallback((files: FileList | null) => {
        if (files && files.length > 0) {
            resetState(true);
            const file = files[0];
            setSrtFile(file);
            
            file.text().then(content => {
                const data = parseSrt(content);
                if (data.length === 0) {
                    setError(t.errors.invalidSrt);
                    setParsedSrtData([]);
                } else {
                    setParsedSrtData(data);
                }
            }).catch(err => {
                setError(t.errors.readSrtFailed);
                console.error(err);
                setParsedSrtData([]);
            });
        }
    }, [resetState]);

    const handleAudioUpload = useCallback((files: FileList | null) => {
        if (files) {
            resetState(true);
            const newAudioFiles = Array.from(files)
                .filter(file => /\.(mp3|wav|m4a|ogg|flac)$/i.test(file.name))
                .map(file => {
                    const id = parseInt(file.name.split('.')[0], 10);
                    return { file, id: isNaN(id) ? -1 : id };
                })
                .filter(af => af.id !== -1);
            setAudioFiles(newAudioFiles);
        }
    }, [resetState]);

    const outputFilename = useMemo(() => {
        return srtFile ? `${srtFile.name.replace(/\.[^/.]+$/, "")}_merged.mp3` : 'merged_audio.mp3';
    }, [srtFile]);

    const handleMerge = useCallback(async () => {
        if (!srtFile || audioFiles.length === 0 || parsedSrtData.length === 0) {
            setError(t.errors.srtAndAudioFiles);
            return;
        }

        resetState(true);
        setIsLoading(true);
        setProgressPercent(0);

        try {
            const { blob, report: processReport } = await processAndMergeAudio(
                parsedSrtData,
                audioFiles,
                config,
                (msg, percent) => {
                    setProgressMessage(msg);
                    setProgressPercent(percent);
                }
            );

            setOutputBlob(blob);
            setReport(processReport);

            // Automatic download only if there are no missing files
            if (blob && processReport.missingFiles.length === 0) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = outputFilename;
                document.body.appendChild(a);
                a.click();
                URL.revokeObjectURL(url);
                a.remove();
            }
        } catch (err: any) {
            console.error("Merging failed:", err);
            setError(err.message || t.errors.generic);
        } finally {
            setIsLoading(false);
        }
    }, [audioFiles, parsedSrtData, srtFile, resetState, config, outputFilename]);

    const canMerge = useMemo(() => srtFile !== null && audioFiles.length > 0 && !isLoading, [srtFile, audioFiles, isLoading]);

    return (
        <div className="min-h-screen font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-4xl mx-auto">
                <Header theme={theme} setTheme={setTheme} />
                <main className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <FileUpload
                            id="audio-upload"
                            title={t.fileUpload.audioTitle}
                            description={t.fileUpload.audioDescription}
                            onFileUpload={handleAudioUpload}
                            directory
                            multiple
                            fileCount={audioFiles.length}
                        />
                        <FileUpload
                            id="srt-upload"
                            title={t.fileUpload.srtTitle}
                            description={t.fileUpload.srtDescription}
                            onFileUpload={handleSrtUpload}
                            accept=".srt"
                            fileName={srtFile?.name}
                        />
                    </div>
                    
                    <ConfigurationPanel config={config} setConfig={setConfig} />

                    <div className="bg-[var(--bg-secondary)] rounded-lg p-6 shadow-lg border border-[var(--border-color)]">
                        <h2 className="text-xl font-bold text-[var(--accent-color)] mb-4">{t.merge.title}</h2>
                        <p className="text-[var(--text-secondary)] mb-6">
                            {t.merge.description}
                        </p>
                        <button
                            onClick={handleMerge}
                            disabled={!canMerge}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-bold text-[var(--accent-text-color)] bg-[var(--accent-color)] rounded-md shadow-lg transition-all duration-300 ease-in-out hover:bg-[var(--accent-color-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--button-disabled-text)] disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <LoaderIcon className="animate-spin h-6 w-6" />
                                    <span>{t.merge.processing}</span>
                                </>
                            ) : (
                                <>
                                    <MergeIcon className="h-6 w-6" />
                                    <span>{t.merge.button}</span>
                                </>
                            )}
                        </button>
                        {isLoading && (
                             <div className="mt-6 space-y-2">
                                <div className="w-full bg-[var(--progress-track-bg)] rounded-full h-2.5">
                                    <div 
                                        className="bg-[var(--progress-bar-bg)] h-2.5 rounded-full transition-all duration-300 ease-linear" 
                                        style={{ width: `${progressPercent}%` }}
                                        role="progressbar"
                                        aria-valuenow={progressPercent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--accent-color)] font-medium animate-pulse">{progressMessage}</span>
                                    <span className="font-mono text-[var(--accent-color)]">{progressPercent.toFixed(0)}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="bg-[var(--error-bg)] border border-[var(--error-border)] text-[var(--error-text)] p-4 rounded-lg mt-6 animate-fade-in">
                            <p className="font-bold">{t.errors.title}</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {!isLoading && (outputBlob || report) && (
                         <ResultsDisplay outputBlob={outputBlob} report={report} outputFilename={outputFilename} />
                    )}
                </main>
            </div>
        </div>
    );
};

export default App;