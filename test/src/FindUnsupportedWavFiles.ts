import * as WavFileDecoder from "wav-file-decoder";
import * as Fs from "fs";
import * as Path from "path";

var supportedWavFiles   = 0;
var unsupportedWavFiles = 0;

function testWavFile (fileName: string) {
   const fileData = Fs.readFileSync(fileName);
   if (WavFileDecoder.isWavFile(fileData)) {
      supportedWavFiles++; }
    else {
      unsupportedWavFiles++;
      console.log("unsupported: " + fileName); }}

function scanWavFiles (rootDirPath: string) {
   const dirPathQueue = [rootDirPath];
   while (dirPathQueue.length) {
      const dirPath = dirPathQueue.shift()!;
      const dirEntries = Fs.readdirSync(dirPath, {withFileTypes: true});
      for (const dirEntry of dirEntries) {
         if (dirEntry.name[0] == ".") {
            continue; }
         const path = Path.join(dirPath, dirEntry.name);
         const ext = Path.extname(dirEntry.name).toLowerCase();
         if (dirEntry.isDirectory() && !dirEntry.isSymbolicLink()) {
            dirPathQueue.push(path); }
          else if (dirEntry.isFile() && ext == ".wav") {
            testWavFile(path); }}}}

function main() {
   const args = process.argv.slice(2);
   if (args.length != 1) {
      throw new Error("Invalid number of command line parameters."); }
   const rootDir = args[0];
   scanWavFiles(rootDir);
   console.log(`${supportedWavFiles} supported and ${unsupportedWavFiles} unsupported WAV files found.`); }

main();
