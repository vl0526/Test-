import { SrtEntry, AudioFile, ProcessReport, ConfigOptions, DurationMode } from '../types';
import { t } from '../localization/vi';

// Make FFmpeg available in the component. The library is loaded from a CDN in `index.html`.
declare const FFmpeg: any;

/**
 * Converts a File object to a Uint8Array.
 * @param file The file to convert.
 * @returns A promise that resolves with the file's data as a Uint8Array.
 */
const fileToUint8Array = (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
                resolve(new Uint8Array(reader.result));
            } else {
                reject(new Error("Failed to read file as ArrayBuffer."));
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Processes and merges audio files based on SRT data using FFmpeg.wasm.
 * @param srtData The parsed SRT subtitle data.
 * @param audioFiles The audio files to process.
 * @param config The user-defined processing configuration.
 * @param updateProgress A callback to update the UI with progress.
 * @returns A promise that resolves with the final blob and a process report.
 */
export const processAndMergeAudio = async (
    srtData: SrtEntry[],
    audioFiles: AudioFile[],
    config: ConfigOptions,
    updateProgress: (message: string, percent: number) => void
): Promise<{ blob: Blob | null; report: ProcessReport }> => {

    const report: ProcessReport = {
        mergedTracks: [],
        missingFiles: [],
        errors: [],
        totalDuration: 0,
        outputFormat: 'mp3'
    };

    updateProgress(t.progress.matching, 5);

    const audioFileMap = new Map<number, File>(audioFiles.map(af => [af.id, af.file]));
    
    // Filter for SRT entries that have a corresponding audio file.
    const filesToProcess = srtData.filter(entry => audioFileMap.has(entry.id));
    
    // Log missing files in the report.
    srtData.forEach(entry => {
        if (!audioFileMap.has(entry.id)) {
            report.missingFiles.push(entry);
        }
    });

    if (filesToProcess.length === 0) {
        throw new Error(srtData.length > 0 ? t.errors.noMatchingFiles : "No audio files were provided.");
    }

    const ffmpeg = new FFmpeg.FFmpeg();
    let totalDuration = 0;

    // FFmpeg log callback for progress reporting.
    ffmpeg.on('log', ({ message }: { message: string }) => {
        console.log("FFmpeg:", message);
        
        // Extract time from FFmpeg's output to calculate progress.
        const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
        if (timeMatch && totalDuration > 0) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const seconds = parseInt(timeMatch[3], 10);
            const hundredths = parseInt(timeMatch[4], 10);
            const currentTime = hours * 3600 + minutes * 60 + seconds + hundredths / 100;
            const progress = (currentTime / totalDuration) * 100;
            
            // Cap progress at 99% during encoding; 100% is set upon completion.
            const encodingProgress = 50 + Math.min(progress, 99) / 2;
            updateProgress(t.progress.encoding, encodingProgress);
        }
    });

    try {
        updateProgress("Loading FFmpeg...", 10);
        await ffmpeg.load({
            coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
        });

        updateProgress("Loading audio files...", 20);

        // Write all necessary audio files to FFmpeg's virtual file system.
        for (const entry of filesToProcess) {
            const file = audioFileMap.get(entry.id)!;
            const data = await fileToUint8Array(file);
            await ffmpeg.writeFile(file.name, data);
        }
        
        updateProgress("Preparing audio filters...", 30);
        
        const filterComplex: string[] = [];
        const inputFiles: string[] = [];
        let outputStreams = '';
        let maxEndTime = 0;

        // For each file, build a corresponding filter chain.
        filesToProcess.forEach((entry, index) => {
            const file = audioFileMap.get(entry.id)!;
            inputFiles.push('-i', file.name);

            const pitchFactor = 2 ** (config.pitchShift / 12);
            const srtDuration = entry.endTime - entry.startTime;

            let filterChain = `[${index}:a]`;

            // 1. Sound Optimization (Silence Removal)
            if (config.soundOptimization) {
                // Remove silence from start and end. Parameters are aggressive.
                filterChain += 'silenceremove=start_periods=1:start_threshold=-50dB:stop_periods=1:stop_duration=0.1:stop_threshold=-50dB';
            }
            
            // 2. Pitch & Speed adjustments
            // asetrate adjusts pitch directly, atempo adjusts speed without changing pitch.
            filterChain += `,asetrate=44100*${pitchFactor},atempo=${config.playbackRate}`;

            // 3. Duration Control
            if (config.durationMode === DurationMode.TRUNCATE && srtDuration > 0) {
                filterChain += `,atrim=0:${srtDuration}`;
            }

            // 4. Delay to position the clip on the timeline and assign an output stream name.
            const delayMs = Math.round(entry.startTime * 1000);
            filterChain += `,adelay=${delayMs}|${delayMs}[aud${index}]`;
            
            filterComplex.push(filterChain);
            outputStreams += `[aud${index}]`;

            // Heuristically calculate total duration for the progress bar.
            // This is not perfectly accurate but provides a good estimate.
            const estimatedDuration = srtDuration / config.playbackRate;
            const estimatedEndTime = entry.startTime + estimatedDuration;
            if (estimatedEndTime > maxEndTime) {
                maxEndTime = estimatedEndTime;
            }

            report.mergedTracks.push({
                srtId: entry.id,
                fileName: file.name,
                startTime: entry.startTime,
                originalDuration: srtDuration,
                scheduledDuration: estimatedDuration
            });
        });

        totalDuration = maxEndTime;
        report.totalDuration = totalDuration;

        if (totalDuration === 0) {
            throw new Error(t.errors.zeroLength);
        }

        // 5. Mix all processed streams together.
        const mixFilter = `${outputStreams}amix=inputs=${filesToProcess.length}:dropout_transition=0.1[out]`;
        filterComplex.push(mixFilter);

        const command = [
            ...inputFiles,
            '-filter_complex', filterComplex.join(';'),
            '-map', '[out]',
            '-c:a', 'libmp3lame', // Use the LAME MP3 codec
            '-q:a', '2',          // High quality VBR (0-9, lower is better)
            'output.mp3'
        ];
        
        updateProgress(t.progress.rendering, 50);
        
        console.log("Executing FFmpeg command:", command.join(' '));
        await ffmpeg.exec(...command);

        updateProgress(t.progress.complete, 99);

        // Retrieve the output file from the virtual file system.
        const data = (await ffmpeg.readFile('output.mp3')) as Uint8Array;
        const finalBlob = new Blob([data.buffer], { type: 'audio/mp3' });

        return { blob: finalBlob, report };

    } catch (err: any) {
        const errorMessage = err.message || t.errors.generic;
        console.error("FFmpeg processing failed:", err);
        report.errors.push(errorMessage);
        throw new Error(errorMessage); // Propagate error to the UI
    } finally {
        // Clean up the FFmpeg instance.
        if (ffmpeg.loaded) {
            ffmpeg.terminate();
        }
        updateProgress(t.progress.complete, 100);
    }
};