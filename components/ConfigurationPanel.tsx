import React from 'react';
import { ConfigOptions, DurationMode } from '../types';
import { SettingsIcon } from './Icons';
import { t } from '../localization/vi';

interface ConfigurationPanelProps {
    config: ConfigOptions;
    setConfig: React.Dispatch<React.SetStateAction<ConfigOptions>>;
}

const Label: React.FC<{ htmlFor: string; children: React.ReactNode; value?: string | number }> = ({ htmlFor, children, value }) => (
     <div className="flex justify-between items-center mb-1">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--text-secondary)]">{children}</label>
        {value && <span className="text-sm font-mono text-[var(--accent-color)] bg-[var(--input-bg)] px-2 py-0.5 rounded">{value}</span>}
    </div>
);

const RangeInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
    <input
        type="range"
        {...props}
        className="w-full h-2 bg-[var(--input-bg)] rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-secondary)] focus:ring-[var(--accent-color)]"
        style={{accentColor: 'var(--accent-color)'}}
    />
);

const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md shadow-sm py-2 px-3 text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:border-[var(--accent-color)]"
    >
        {props.children}
    </select>
);


export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ config, setConfig }) => {
    const handleConfigChange = (field: keyof ConfigOptions, value: any) => {
        if (field === 'pitchShift' || field === 'playbackRate') {
            setConfig(prev => ({ ...prev, [field]: Number(value) }));
        } else if (field === 'soundOptimization') {
            setConfig(prev => ({ ...prev, [field]: Boolean(value) }));
        } else {
            setConfig(prev => ({ ...prev, [field]: value }));
        }
    };

    return (
        <div className="bg-[var(--bg-secondary)] rounded-lg p-6 shadow-lg border border-[var(--border-color)]">
            <h2 className="text-xl font-bold text-[var(--accent-color)] mb-4 flex items-center gap-2"><SettingsIcon className="w-6 h-6"/> {t.configuration.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-1">
                    <Label htmlFor="pitchShift" value={`${config.pitchShift > 0 ? '+' : ''}${config.pitchShift} st`}>{t.configuration.pitch}</Label>
                    <RangeInput
                        id="pitchShift"
                        min="-12"
                        max="12"
                        step="1"
                        value={config.pitchShift}
                        onChange={e => handleConfigChange('pitchShift', e.target.value)}
                    />
                </div>
                <div className="sm:col-span-1">
                    <Label htmlFor="playbackRate" value={`${config.playbackRate.toFixed(2)}x`}>{t.configuration.speed}</Label>
                    <RangeInput
                        id="playbackRate"
                        min="0.5"
                        max="2.0"
                        step="0.05"
                        value={config.playbackRate}
                        onChange={e => handleConfigChange('playbackRate', e.target.value)}
                    />
                </div>
                <div className="sm:col-span-1">
                    <Label htmlFor="durationMode">{t.configuration.durationMode}</Label>
                    <Select
                        id="durationMode"
                        value={config.durationMode}
                        onChange={e => handleConfigChange('durationMode', e.target.value as DurationMode)}
                    >
                        <option value={DurationMode.KEEP}>{t.configuration.durationKeep}</option>
                        <option value={DurationMode.TRUNCATE}>{t.configuration.durationTruncate}</option>
                    </Select>
                </div>
            </div>
             <div className="mt-6 border-t border-[var(--border-color)] pt-5">
                <div className="relative flex items-start">
                    <div className="flex h-6 items-center">
                        <input
                            id="soundOptimization"
                            aria-describedby="soundOptimization-description"
                            name="soundOptimization"
                            type="checkbox"
                            checked={config.soundOptimization}
                            onChange={e => handleConfigChange('soundOptimization', e.target.checked)}
                            className="h-4 w-4 rounded border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--accent-color)] focus:ring-[var(--accent-color)] accent-[var(--accent-color)]"
                        />
                    </div>
                    <div className="ml-3 text-sm leading-6">
                        <label htmlFor="soundOptimization" className="font-medium text-[var(--text-tertiary)] cursor-pointer">
                            {t.configuration.soundOptimization}
                        </label>
                        <p id="soundOptimization-description" className="text-[var(--text-secondary)]">
                            {t.configuration.soundOptimizationTooltip}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};