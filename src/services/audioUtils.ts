
export const decodeBase64 = (base64Str: string): ArrayBuffer => {
    const binaryStr = window.atob(base64Str);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
};

export const decodeRawPcmToAudioBuffer = async (
    pcmData: ArrayBuffer,
    context: AudioContext,
    sampleRate: number = 24000
): Promise<AudioBuffer> => {
    // Assuming 16-bit little-endian PCM
    const int16Array = new Int16Array(pcmData);
    const float32Array = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
        float32Array[i] = int16Array[i] / 32768;
    }

    const audioBuffer = context.createBuffer(1, float32Array.length, sampleRate);
    audioBuffer.getChannelData(0).set(float32Array);
    return audioBuffer;
};
