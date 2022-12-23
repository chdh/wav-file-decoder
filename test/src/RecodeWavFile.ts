import * as WavFileDecoder from "wav-file-decoder";
import * as WavFileEncoder from "wav-file-encoder";
import * as Fs from "fs";

function recodeWavFile (inputFileName: string, outputFileName: string) {
   const inputFileData = Fs.readFileSync(inputFileName);
   if (!WavFileDecoder.isWavFile(inputFileData)) {
      console.log("Not a valid WAV file."); }
   const d = WavFileDecoder.decodeWavFile(inputFileData);
   console.log(`type=${d.wavFileTypeName}, sampleRate=${d.sampleRate}, channels=${d.channelData.length}, samples=${d.channelData[0].length}`);
   const outputFileData = WavFileEncoder.encodeWavFileFromArrays(d.channelData, d.sampleRate, <any>d.wavFileType);
   Fs.writeFileSync(outputFileName, Buffer.from(outputFileData)); }

function main() {
   const args = process.argv.slice(2);
   if (args.length != 2) {
      throw new Error("Invalid number of command line parameters."); }
   const inputFileName = args[0];
   const outputFileName = args[1];
   recodeWavFile(inputFileName, outputFileName); }

main();
