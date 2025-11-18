
import { SrtEntry } from '../types';

const srtTimeToSeconds = (time: string): number => {
    const parts = time.split(/[:,]/);
    if (parts.length !== 4) return 0;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    const milliseconds = parseInt(parts[3], 10);
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

export const parseSrt = (srtContent: string): SrtEntry[] => {
    const entries: SrtEntry[] = [];
    const blocks = srtContent.trim().replace(/\r/g, '').split('\n\n');

    for (const block of blocks) {
        const lines = block.split('\n');
        if (lines.length < 2) continue;

        try {
            const id = parseInt(lines[0], 10);
            if (isNaN(id)) continue;

            const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
            if (!timeMatch) continue;

            const startTime = srtTimeToSeconds(timeMatch[1]);
            const endTime = srtTimeToSeconds(timeMatch[2]);
            const text = lines.slice(2).join(' ').trim();

            if (text) {
                entries.push({ id, startTime, endTime, text });
            }
        } catch (e) {
            console.warn("Skipping invalid SRT block:", block);
        }
    }
    return entries;
};
