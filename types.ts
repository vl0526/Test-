
export interface SrtEntry {
    id: number;
    startTime: number;
    endTime: number;
    text: string;
}

export interface AudioFile {
    file: File;
    id: number;
}

export enum DurationMode {
    KEEP = 'keep',
    TRUNCATE = 'truncate',
}

export interface ConfigOptions {
    pitchShift: number;
    playbackRate: number;
    durationMode: DurationMode;
    soundOptimization: boolean;
}

export interface MergedTrackInfo {
    srtId: number;
    fileName: string;
    startTime: number;
    originalDuration: number;
    scheduledDuration: number;
}

export interface ProcessReport {
    mergedTracks: MergedTrackInfo[];
    missingFiles: SrtEntry[];
    errors: string[];
    totalDuration: number;
    outputFormat: string;
}