import * as WavFileDecoder from "wav-file-decoder";
import * as WavFileEncoder from "wav-file-encoder";
import * as Fs from "fs";

function mapFileType (audioEncoding : WavFileDecoder.AudioEncoding) : WavFileEncoder.WavFileType {
   switch (audioEncoding ) {
      case WavFileDecoder.AudioEncoding.pcmInt:   return WavFileEncoder.WavFileType.int16;
      case WavFileDecoder.AudioEncoding.pcmFloat: return WavFileEncoder.WavFileType.float32;
      default:                                    return WavFileEncoder.WavFileType.float32; }}

function recodeWavFile (inputFileName: string, outputFileName: string) {
   const inputFileData = Fs.readFileSync(inputFileName);
   if (!WavFileDecoder.isWavFile(inputFileData)) {
      console.log("Not a valid and supported WAV file."); }
   const audioData = WavFileDecoder.decodeWavFile(inputFileData);
   console.log(`type=${audioData.wavFileTypeName}, sampleRate=${audioData.sampleRate}, channels=${audioData.channelData.length}, samples=${audioData.channelData[0].length}`);
   const outputFileType = mapFileType(audioData.audioEncoding);
   const outputFileData = WavFileEncoder.encodeWavFileFromArrays(audioData.channelData, audioData.sampleRate, outputFileType);
   Fs.writeFileSync(outputFileName, Buffer.from(outputFileData)); }

function main() {
   const args = process.argv.slice(2);
   if (args.length != 2) {
      throw new Error("Invalid number of command line parameters."); }
   const inputFileName = args[0];
   const outputFileName = args[1];
   recodeWavFile(inputFileName, outputFileName); }

main();
