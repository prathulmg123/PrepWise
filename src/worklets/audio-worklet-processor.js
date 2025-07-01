class AudioWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (event) => {
      if (event.data && event.data.command === 'start') {
        this.isProcessing = true;
      }
    };
  }

  process(inputs, outputs, parameters) {
    if (!this.isProcessing) return true;

    // Get the input audio data
    const input = inputs[0];
    if (input.length === 0) return true;

    // Process each channel
    const channelData = input[0];
    if (channelData.length === 0) return true;

    // Convert Float32 to Int16 PCM
    const int16Data = new Int16Array(channelData.length);
    for (let i = 0; i < channelData.length; i++) {
      int16Data[i] = Math.max(-1, Math.min(1, channelData[i])) * 32767;
    }

    // Send the processed data to the main thread
    this.port.postMessage({
      audioBuffer: int16Data.buffer
    });

    return true;
  }
}

registerProcessor('audio-worklet-processor', AudioWorkletProcessor);
