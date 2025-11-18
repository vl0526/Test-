export const t = {
    header: {
        title: 'Trình ghép âm thanh SRT',
        description: 'Định cấu hình cao độ và tốc độ, sau đó ghép các tệp âm thanh của bạn thành một bản nhạc duy nhất dựa trên dòng thời gian của tệp SRT.'
    },
    fileUpload: {
        audioTitle: '1. Tải lên thư mục âm thanh',
        audioDescription: 'Chọn một thư mục chứa các tệp âm thanh được đặt tên theo ID (ví dụ: 1.mp3, 2.wav...).',
        srtTitle: '2. Tải lên tệp SRT',
        srtDescription: 'Chọn tệp phụ đề .srt chính khớp với ID âm thanh.',
        selectFolder: 'Chọn thư mục',
        selectFile: 'Chọn tệp',
        selectedFile: 'Đã chọn:',
        selectedFiles: (count: number) => `Đã chọn ${count} tệp âm thanh.`
    },
    configuration: {
        title: 'Cấu hình xử lý',
        pitch: 'Cao độ (bán cung)',
        speed: 'Tốc độ phát lại',
        durationMode: 'Chế độ thời lượng',
        durationKeep: 'Giữ nguyên thời lượng gốc',
        durationTruncate: 'Cắt theo thời lượng SRT',
        soundOptimization: 'Tối ưu hóa âm thanh',
        soundOptimizationTooltip: 'Tự động xóa các khoảng lặng ở đầu và cuối mỗi clip âm thanh.'
    },
    merge: {
        title: '3. Ghép và xuất',
        description: 'Các tệp âm thanh sẽ được xử lý với các cài đặt đã chọn và được ghép theo dòng thời gian SRT.',
        button: 'Ghép âm thanh',
        processing: 'Đang xử lý...'
    },
    results: {
        complete: 'Xử lý hoàn tất',
        completeWithWarnings: 'Xử lý hoàn tất với cảnh báo',
        downloadButton: 'Tải xuống âm thanh đã ghép (MP3)',
        downloadError: 'Không thể tạo tệp âm thanh cuối cùng do lỗi xử lý.'
    },
    errors: {
        title: 'Lỗi:',
        generic: 'Đã xảy ra lỗi không xác định trong quá trình xử lý.',
        srtAndAudioFiles: 'Vui lòng tải lên tệp SRT hợp lệ và một thư mục tệp âm thanh.',
        noMatchingFiles: 'Không tìm thấy tệp âm thanh nào khớp với các mục SRT được cung cấp.',
        allFilesFailed: 'Tất cả các tệp âm thanh phù hợp đều không xử lý được. Kiểm tra nhật ký lỗi để biết chi tiết.',
        zeroLength: 'Quá trình xử lý tạo ra âm thanh có độ dài bằng không. Tất cả các tệp đã xử lý có thể đã bị lỗi hoặc im lặng.',
        lamejsNotFound: 'Không tìm thấy thư viện lamejs để mã hóa MP3.',
        invalidSrt: 'Tệp SRT trống hoặc không hợp lệ.',
        readSrtFailed: 'Không đọc hoặc phân tích cú pháp tệp SRT.'
    },
    progress: {
        matching: 'Đang khớp tệp âm thanh với các mục SRT...',
        applyingEffects: (count: number) => `Đang áp dụng hiệu ứng cho ${count} tệp âm thanh...`,
        applyingEffectsProgress: (processed: number, total: number) => `Đang áp dụng hiệu ứng... (${processed}/${total})`,
        creatingTimeline: (duration: string) => `Đang tạo dòng thời gian âm thanh ${duration}s...`,
        rendering: 'Đang kết xuất âm thanh cuối cùng...',
        renderingChunk: (chunk: number, total: number) => `Đang kết xuất phần ${chunk}/${total}...`,
        encoding: 'Đang mã hóa sang MP3...',
        complete: 'Hoàn thành!'
    }
};