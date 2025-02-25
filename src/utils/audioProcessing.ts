
export function floatTo16BitPCM(output: Float32Array): DataView {
  const dataView = new DataView(new ArrayBuffer(output.length * 2));
  for (let i = 0; i < output.length; i++) {
    const s = Math.max(-1, Math.min(1, output[i]));
    dataView.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
  }
  return dataView;
}

export function createWavHeader(channels: number, sampleRate: number, dataLength: number): Uint8Array {
  const blockAlign = channels * 2;
  const byteRate = sampleRate * blockAlign;
  const dataSize = dataLength * channels * 2;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF size */
  view.setUint32(4, 36 + dataSize, true);
  /* RIFF format */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk byte count */
  view.setUint32(16, 16, true);
  /* format code (PCM = 1) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, channels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, byteRate, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk byte count */
  view.setUint32(40, dataSize, true);

  return new Uint8Array(buffer);
}

export async function convertAudioToWav(audioBlob: Blob): Promise<Blob> {
  const audioContext = new AudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(arrayBuffer, (buffer) => {
      const numberOfChannels = buffer.numberOfChannels;
      const length = buffer.length;
      const sampleRate = buffer.sampleRate;
      
      const data = new Float32Array(length * numberOfChannels);
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          data[i * numberOfChannels + channel] = channelData[i];
        }
      }
      
      const wavBytes = floatTo16BitPCM(data);
      const wavHeader = createWavHeader(numberOfChannels, sampleRate, length);
      const wavBuffer = new Uint8Array(wavHeader.byteLength + wavBytes.byteLength);
      wavBuffer.set(wavHeader, 0);
      wavBuffer.set(new Uint8Array(wavBytes.buffer), wavHeader.byteLength);
      
      resolve(new Blob([wavBuffer], { type: 'audio/wav' }));
    }, reject);
  });
}
