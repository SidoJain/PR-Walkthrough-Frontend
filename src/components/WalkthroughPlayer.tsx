import { useState, useRef, useEffect, useMemo } from 'react';
import { ExplanationStep } from '../types';

interface WalkthroughPlayerProps {
    audioBase64: string;
    script: ExplanationStep[];
    onLineChange: (line: number) => void;
}

export default function WalkthroughPlayer({ audioBase64, script, onLineChange }: WalkthroughPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

    const audioSrc = `data:audio/mp3;base64,${audioBase64}`;

    // Broadcast the first line immediately when the script loads
    useEffect(() => {
        if (script && script.length > 0) {
            setActiveStepIndex(0);
            onLineChange(script[0].line_number);
        }
    }, [script, onLineChange]);

    const stepTimings = useMemo(() => {
        if (!script.length) return [];
        const totalChars = script.reduce((sum, step) => sum + step.explanation.length, 0);
        let accumulatedFraction = 0;

        return script.map(step => {
            const startFraction = accumulatedFraction;
            accumulatedFraction += step.explanation.length / totalChars;
            return startFraction;
        });
    }, [script]);

    const handleTimeUpdate = () => {
        if (!audioRef.current || script.length === 0) return;

        const { currentTime, duration } = audioRef.current;
        if (isNaN(duration) || duration === 0) return;

        const currentPlaybackFraction = currentTime / duration;

        let newIndex = 0;
        for (let i = stepTimings.length - 1; i >= 0; i--) {
            if (currentPlaybackFraction >= stepTimings[i]) {
                newIndex = i;
                break;
            }
        }

        if (newIndex !== activeStepIndex) {
            setActiveStepIndex(newIndex);
            onLineChange(script[newIndex].line_number);
        }
    };

    useEffect(() => {
        if (stepRefs.current[activeStepIndex]) {
            stepRefs.current[activeStepIndex]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    }, [activeStepIndex]);

    return (
        <div className="flex flex-col w-full space-y-6 h-full">
            <audio
                ref={audioRef}
                src={audioSrc}
                controls
                onTimeUpdate={handleTimeUpdate}
                className="w-full"
            />

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[50vh]">
                {script.map((step, index) => (
                    <div
                        key={index}
                        ref={(el) => { stepRefs.current[index] = el; }}
                        className={`p-3 rounded-md border transition-colors ${index === activeStepIndex
                                ? 'bg-blue-900/20 border-blue-500/50 text-blue-100'
                                : 'bg-neutral-800/50 border-neutral-800 text-neutral-400'
                            }`}
                    >
                        <div className="text-xs font-mono text-blue-400 mb-1">
                            Diff Line: {step.line_number}
                        </div>
                        <p className="text-sm leading-relaxed">{step.explanation}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}