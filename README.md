# wav-file-decoder

A simple decoder for [WAV](https://en.wikipedia.org/wiki/WAV) audio files.

**NPM package**: [wav-file-decoder](https://www.npmjs.com/package/wav-file-decoder)<br>
**Online demo**: [www.source-code.biz/snippets/typescript/wavFileDecoder](http://www.source-code.biz/snippets/typescript/wavFileDecoder)<br>
**Examples of how to use it**: [github.com/chdh/wav-file-decoder/tree/main/test/src](https://github.com/chdh/wav-file-decoder/tree/main/test/src)<br>
**Compagnion package**: [wav-file-encoder](https://www.npmjs.com/package/wav-file-encoder)

## API

### Test if a file is a WAV file

```typescript
function isWavFile (fileData: ArrayBufferView | ArrayBuffer) : boolean
```

* `fileData`: An `ArrayBufferView`
  (e.g. [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
  or Node.js [Buffer](https://nodejs.org/api/buffer.html))
  or an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
  that contains the raw data bytes of a WAV file.
* Return value: `true` if the file looks like a valid and supported WAV file.

### Decode a WAV file

```typescript
function decodeWavFile (fileData: ArrayBufferView | ArrayBuffer) : AudioData
```

* `fileData`: An `ArrayBufferView`
  (e.g. [Uint8Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array)
  or Node.js [Buffer](https://nodejs.org/api/buffer.html))
  or an [ArrayBuffer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer)
  that contains the raw data bytes of a WAV file.
* Return value: A data structure containing the decoded WAV file data.

```typescript
interface AudioData {
  channelData:      Float32Array[]; // arrays containing the audio samples (PCM data), one array per channel
  sampleRate:       number;         // sample rate (samples per second)
  numberOfChannels: number;         // number of channels, same as channelData.length
  audioEncoding:    AudioEncoding;  // audio encoding in the WAV file (int or float)
  bitsPerSample:    number;         // number of bits per sample in the WAV file
  wavFileTypeName:  string;         // combination of audioEncoding and bitsPerSample, e.g. "int16" or "float32"
}
enum AudioEncoding {
  pcmInt,                           // 0 = PCM integer
  pcmFloat                          // 1 = PCM float
}
```

The audio sample values in the `channelData` arrays are within the range -1 to +1.<br>
An exception is thrown when the passed file is not a WAV file or when the format of the WAV file is not supported.
