// This worker handles MP3 encoding off the main thread to prevent UI blocking.
// It relies on lamejs, which must be loaded via importScripts.

declare const lamejs: any;

self.onmessage = (event) => {
    try {
        const { audioBufferData } = event.data;
        
        // Load lamejs if it's not already available in the worker's scope.
        if (typeof lamejs === 'undefined') {
            importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');
        }

        if (typeof lamejs === 'undefined') {
            throw new Error("lamejs could not be loaded in the worker.");
        }

        const { numChannels, sampleRate, pcmLeft, pcmRight } = audioBufferData;
        const kbps = 192; // MP3 bitrate

        const mp3Encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);
        const mp3Data: Int8Array[] = [];

        const sampleBlockSize = 1152; // MPEG-1, Layer III sample frame size

        for (let i = 0; i < pcmLeft.length; i += sampleBlockSize) {
            const leftChunk = pcmLeft.subarray(i, i + sampleBlockSize);
            const rightChunk = pcmRight ? pcmRight.subarray(i, i + sampleBlockSize) : undefined;
            
            const mp3buf = mp3Encoder.encodeBuffer(leftChunk, rightChunk);
            if (mp3buf.length > 0) {
                mp3Data.push(new Int8Array(mp3buf));
            }
        }

        const mp3buf = mp3Encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(new Int8Array(mp3buf));
        }

        const mp3Blob = new Blob(mp3Data, { type: 'audio/mp3' });
        
        // Send the resulting Blob back to the main thread.
        self.postMessage({ type: 'success', blob: mp3Blob });

    } catch (error: any) {
        // Report any errors back to the main thread.
        self.postMessage({ type: 'error', message: error.message });
    }
};

// Add a basic error handler for the worker itself.
self.onerror = (e) => {
    console.error("Error in mp3Encoder.worker:", e);
};
