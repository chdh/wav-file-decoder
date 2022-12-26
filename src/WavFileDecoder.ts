// Returns true if the passed file data looks like a valid and supported WAV file.
export function isWavFile (fileData: ArrayBufferView | ArrayBuffer) : boolean {
   try {
      const chunks = unpackWavFileChunks(fileData);
      const fmt = decodeFormatChunk(chunks.get("fmt"));
      const data = chunks.get("data");
      void getWavFileType(fmt);
      verifyDataChunkLength(data, fmt);
      return true; }
    catch (e) {
      return false; }}

export const enum WavFileType {
   int16,                                                  // 16 bit signed integer
   float32,                                                // 32 bit float within the range -1 to +1
   int24 }                                                 // 24 bit signed integer
const wavFileTypeNames = ["int16", "float32", "int24"];

export interface DecodedWavFile {
   channelData:              Float32Array[];               // arrays containing the audio samples (PCM data), one array per channel
   sampleRate:               number;                       // sample rate (samples per second)
   numberOfChannels:         number;                       // number of channels, same as channelData.length
   wavFileType:              WavFileType;                  // type of WAV file as enum
   wavFileTypeName:          string;                       // type of WAV file as string
   bitsPerSample:            number; }                     // number of bits per sample in the WAV file

export function decodeWavFile (fileData: ArrayBufferView | ArrayBuffer) : DecodedWavFile {
   const chunks = unpackWavFileChunks(fileData);
   const fmt = decodeFormatChunk(chunks.get("fmt"));
   const data = chunks.get("data");
   const wavFileType = getWavFileType(fmt);
   const wavFileTypeName = wavFileTypeNames[wavFileType];
   verifyDataChunkLength(data, fmt);
   const channelData = decodeDataChunk(data!, fmt, wavFileType);
   return {channelData, sampleRate: fmt.sampleRate, numberOfChannels: fmt.numberOfChannels, wavFileType, wavFileTypeName, bitsPerSample: fmt.bitsPerSample}; }

function unpackWavFileChunks (fileData: ArrayBufferView | ArrayBuffer) : Map<string, DataView> {
   let dataView: DataView;
   if (fileData instanceof ArrayBuffer) {
      dataView = new DataView(fileData); }
    else {
      dataView = new DataView(fileData.buffer, fileData.byteOffset, fileData.byteLength); }
   const fileLength = dataView.byteLength;
   if (fileLength < 20) {
      throw new Error("WAV file is too short."); }
   if (getString(dataView, 0, 4) != "RIFF") {
      throw new Error("Not a valid WAV file (no RIFF header)."); }
   const mainChunkLength = dataView.getUint32(4, true);
   if (mainChunkLength != fileLength - 8) {
      throw new Error("Main chunk length of WAV file does not match file size."); }
   if (getString(dataView, 8, 4) != "WAVE") {
      throw new Error("RIFF file is not a WAV file."); }
   const chunks = new Map<string, DataView>();
   let fileOffset = 12;
   while (fileOffset < fileLength) {
      if (fileOffset + 8 > fileLength) {
         throw new Error(`Incomplete chunk prefix in WAV file at offset ${fileOffset}.`); }
      const chunkId = getString(dataView, fileOffset, 4).trim();
      const chunkLength = dataView.getUint32(fileOffset + 4, true);
      if (fileOffset + 8 + chunkLength > fileLength) {
         throw new Error(`Incomplete chunk data in WAV file at offset ${fileOffset}.`); }
      const chunkData = new DataView(dataView.buffer, dataView.byteOffset + fileOffset + 8, chunkLength);
      chunks.set(chunkId, chunkData);
      const padLength = (chunkLength % 2);
      fileOffset += 8 + chunkLength + padLength; }
   return chunks; }

function getString (dataView: DataView, offset: number, length: number) : string {
   const a = new Uint8Array(dataView.buffer, dataView.byteOffset + offset, length);
   return <string>String.fromCharCode.apply(null, a); }

function getInt24 (dataView: DataView, offset: number) : number {
   const b0 = dataView.getInt8(offset + 2) * 0x10000;
   const b12 = dataView.getUint16(offset, true);
   return b0 + b12; }

//--- Format chunk -------------------------------------------------------------

export interface FormatChunk {
   formatCode:               number;                       // 1 = WAVE_FORMAT_PCM, 3 = WAVE_FORMAT_IEEE_FLOA
   numberOfChannels:         number;                       // number of channels
   sampleRate:               number;                       // sample rate
   bytesPerSec:              number;                       // data rate
   bytesPerFrame:            number;                       // number of bytes per frame (= numberOfChannels * bytesPerSample)
   bitsPerSample:            number; }                     // number of bits per sample

function decodeFormatChunk (dataView?: DataView) : FormatChunk {
   if (!dataView) {
      throw new Error("No format chunk found in WAV file."); }
   if (dataView.byteLength < 16) {
      throw new Error("Format chunk of WAV file is too short."); }
   const fmt = <FormatChunk>{};
   fmt.formatCode       = dataView.getUint16( 0, true);    // wFormatTag
   fmt.numberOfChannels = dataView.getUint16( 2, true);    // nChannels
   fmt.sampleRate       = dataView.getUint32( 4, true);    // nSamplesPerSec
   fmt.bytesPerSec      = dataView.getUint32( 8, true);    // nAvgBytesPerSec
   fmt.bytesPerFrame    = dataView.getUint16(12, true);    // nBlockAlign
   fmt.bitsPerSample    = dataView.getUint16(14, true);    // wBitsPerSample
   return fmt; }

//--- Data chunk ---------------------------------------------------------------

function getWavFileType (fmt: FormatChunk) : WavFileType {
   if (fmt.numberOfChannels < 1 || fmt.numberOfChannels > 999) {
      throw new Error("Invalid number of channels in WAV file."); }
   const bytesPerSample = Math.ceil(fmt.bitsPerSample / 8);
   const expectedBytesPerFrame = fmt.numberOfChannels * bytesPerSample;
   if (fmt.formatCode == 1 && fmt.bitsPerSample == 16 && fmt.bytesPerFrame == expectedBytesPerFrame) {
      return WavFileType.int16; }
   if (fmt.formatCode == 1 && fmt.bitsPerSample == 24 && fmt.bytesPerFrame == expectedBytesPerFrame) {
      return WavFileType.int24; }
   if (fmt.formatCode == 3 && fmt.bitsPerSample == 32 && fmt.bytesPerFrame == expectedBytesPerFrame) {
      return WavFileType.float32; }
   throw new Error(`Unsupported WAV file type, formatCode=${fmt.formatCode}, bitsPerSample=${fmt.bitsPerSample}, bytesPerFrame=${fmt.bytesPerFrame}, numberOfChannels=${fmt.numberOfChannels}.`); }

function decodeDataChunk (data: DataView, fmt: FormatChunk, wavFileType: WavFileType) : Float32Array[] {
   switch (wavFileType) {
      case WavFileType.int16:    return decodeDataChunk_int16(data, fmt);
      case WavFileType.int24:    return decodeDataChunk_int24(data, fmt);
      case WavFileType.float32:  return decodeDataChunk_float32(data, fmt);
      default:                   throw new Error("No decoder."); }}

function decodeDataChunk_int16 (data: DataView, fmt: FormatChunk) : Float32Array[] {
   const channelData = allocateChannelDataArrays(data.byteLength, fmt);
   const numberOfChannels = fmt.numberOfChannels;
   const numberOfFrames = channelData[0].length;
   let offs = 0;
   for (let frameNo = 0; frameNo < numberOfFrames; frameNo++) {
      for (let channelNo = 0; channelNo < numberOfChannels; channelNo++) {
         const sampleValueInt16 = data.getInt16(offs, true);
         const sampleValueFloat = convertInt16SampleToFloat(sampleValueInt16);
         channelData[channelNo][frameNo] = sampleValueFloat;
         offs += 2; }}
   return channelData; }

function decodeDataChunk_int24 (data: DataView, fmt: FormatChunk) : Float32Array[] {
   const channelData = allocateChannelDataArrays(data.byteLength, fmt);
   const numberOfChannels = fmt.numberOfChannels;
   const numberOfFrames = channelData[0].length;
   let offs = 0;
   for (let frameNo = 0; frameNo < numberOfFrames; frameNo++) {
      for (let channelNo = 0; channelNo < numberOfChannels; channelNo++) {
         const sampleValueInt24 = getInt24(data, offs);
         const sampleValueFloat = convertInt24SampleToFloat(sampleValueInt24);
         channelData[channelNo][frameNo] = sampleValueFloat;
         offs += 3; }}
   return channelData; }

function decodeDataChunk_float32 (data: DataView, fmt: FormatChunk) : Float32Array[] {
   const channelData = allocateChannelDataArrays(data.byteLength, fmt);
   const numberOfChannels = fmt.numberOfChannels;
   const numberOfFrames = channelData[0].length;
   let offs = 0;
   for (let frameNo = 0; frameNo < numberOfFrames; frameNo++) {
      for (let channelNo = 0; channelNo < numberOfChannels; channelNo++) {
         const sampleValueFloat = data.getFloat32(offs, true);
         channelData[channelNo][frameNo] = sampleValueFloat;
         offs += 4; }}
   return channelData; }

// Converts integers in the range [-32768 .. 32767] to float in the range [-1 .. 0.99997].
// See discussion for convertFloatSampleToInt16() in wav-file-encoder package.
function convertInt16SampleToFloat (i: number) : number {
   return i / 0x8000; }                                    // symetric for negative and positive values and preserving bit pattern

function convertInt24SampleToFloat (i: number) : number {
   return i / 0x800000; }                                  // symetric for negative and positive values and preserving bit pattern

function allocateChannelDataArrays (dataLength: number, fmt: FormatChunk) : Float32Array[] {
   const numberOfFrames = Math.floor(dataLength / fmt.bytesPerFrame);
   const channelData: Float32Array[] = new Array(fmt.numberOfChannels);
   for (let channelNo = 0; channelNo < fmt.numberOfChannels; channelNo++) {
      channelData[channelNo] = new Float32Array(numberOfFrames); }
   return channelData; }

function verifyDataChunkLength (data: DataView|undefined, fmt: FormatChunk) {
   if (!data) {
      throw new Error("No data chunk found in WAV file."); }
   if (data.byteLength % fmt.bytesPerFrame != 0) {
      throw new Error("WAV file data chunk length is not a multiple of frame size."); }}

//--- Diagnostics --------------------------------------------------------------

export interface WavFileInfo {
   chunkInfo:                ChunkInfoEntry[];
   fmt:                      FormatChunk; }

export interface ChunkInfoEntry {
   chunkId:                  string;                       // "fmt", "data", etc.
   dataOffset:               number;                       // offset of chunk data in file
   dataLength:               number; }                     // length of chunk data

export function getWavFileInfo (fileData: ArrayBufferView | ArrayBuffer) : WavFileInfo {
   const chunks = unpackWavFileChunks(fileData);
   const chunkInfo = getChunkInfo(chunks);
   const fmt = decodeFormatChunk(chunks.get("fmt"));
   return {chunkInfo, fmt}; }

function getChunkInfo (chunks: Map<string, DataView>) : ChunkInfoEntry[] {
   const chunkInfo: ChunkInfoEntry[] = [];
   for (const e of chunks) {
      const ci = <ChunkInfoEntry>{};
      ci.chunkId = e[0];
      ci.dataOffset = e[1].byteOffset;
      ci.dataLength = e[1].byteLength;
      chunkInfo.push(ci); }
   chunkInfo.sort((e1, e2) => e1.dataOffset - e2.dataOffset);
   return chunkInfo; }
