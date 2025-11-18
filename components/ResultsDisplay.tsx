import React, { useState, useEffect } from 'react';
import { ProcessReport } from '../types';
import { DownloadIcon } from './Icons';
import { t } from '../localization/vi';

interface ResultsDisplayProps {
    outputBlob: Blob | null;
    report: ProcessReport | null;
    outputFilename: string;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ outputBlob, report, outputFilename }) => {
    const [downloadUrl, setDownloadUrl] = useState<string>('');

    useEffect(() => {
        if (outputBlob) {
            const url = URL.createObjectURL(outputBlob);
            setDownloadUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [outputBlob]);

    if (!report) return null;

    const hasIssues = report.missingFiles.length > 0 || report.errors.length > 0;

    return (
        <div className="bg-[var(--bg-secondary)] rounded-lg p-6 shadow-lg border border-[var(--border-color)] mt-6 animate-fade-in">
            <h2 className={`text-2xl font-bold mb-4 ${hasIssues ? 'text-[var(--warning-color)]' : 'text-[var(--success-color)]'}`}>
                {hasIssues ? t.results.completeWithWarnings : t.results.complete}
            </h2>
            
            {outputBlob && downloadUrl ? (
                <a
                    href={downloadUrl}
                    download={outputFilename}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 text-lg font-bold text-[var(--success-text-color)] bg-[var(--success-bg)] rounded-md shadow-lg transition-all duration-300 ease-in-out hover:bg-[var(--success-bg-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--success-bg)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
                >
                    <DownloadIcon className="h-6 w-6"/>
                    {t.results.downloadButton}
                </a>
            ) : (
                <p className="text-[var(--error-text)]">{t.results.downloadError}</p>
            )}
        </div>
    );
};
