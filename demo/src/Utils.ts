const dummyResolvedPromise = Promise.resolve();

export function nextTick (callback: () => void) {
   void dummyResolvedPromise.then(callback); }

export function setMsg (msg: string) {
   const msgElement = document.getElementById("msg")!;
   msgElement.textContent = msg;
   msgElement.classList.toggle("hidden", !msg); }

export function catchError (f: Function, ...args: any[]) {
   void catchErrorAsync(f, ...args); }

async function catchErrorAsync (f: Function, ...args: any[]) {
   try {
      const r = f(...args);
      if (r instanceof Promise) {
         await r; }}
    catch (error) {
      console.log(error);
      setMsg(String(error)); }}

export function openFileOpenDialog (callback: (file: File) => void) {
   if ((<any>window).showOpenFilePicker) {
      openFileOpenDialog_new().then(callback, (e) => console.log(e)); }
    else {
      openFileOpenDialog_old(callback); }}

async function openFileOpenDialog_new() : Promise<File> {
   const pickerOpts = {};
   const fileHandle: FileSystemFileHandle = (await (<any>window).showOpenFilePicker(pickerOpts))[0];
   const file = await fileHandle.getFile();
   return file; }

function openFileOpenDialog_old (callback: (file: File) => void) {
   const element: HTMLInputElement = document.createElement("input");
   element.type = "file";
   element.addEventListener("change", () => {
      if (element.files && element.files.length == 1) {
         callback(element.files[0]); }});
   const clickEvent = new MouseEvent("click");
   element.dispatchEvent(clickEvent);
   (<any>document).dummyFileOpenElementHolder = element; } // to prevent garbage collection
