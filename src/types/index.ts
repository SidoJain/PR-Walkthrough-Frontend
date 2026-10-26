export interface ExplanationStep {
    line_number: number;
    explanation: string;
}

export interface WalkthroughResponse {
    raw_diff: string
    audio_base64: string;
    vtt_timestamps: string;
    script: ExplanationStep[];
}