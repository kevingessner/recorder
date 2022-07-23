import { get as getFromStorage, set as setToStorage, getMany as getManyFromStorage } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

const StorageRecordingKey = 'recorder.recording';
const StorageListenedKey = 'recorder.listened';

export const Events = {
  Error: 'error',
  Update: 'update',
};
Object.freeze(Events);

function promisify(obj) {
  return new Promise(function(resolve, reject) {
    obj.onload =
      obj.onerror = function(evt) {
        obj.onload =
          obj.onerror = null

        evt.type === 'load'
          ? resolve(obj.result || obj)
          : reject(new Error('Failed to read the blob/file'))
      }
  });
}

export class Recorder {

  constructor() {
    Object.assign(this, EventTarget.prototype);
    this._recorder = null;
    this.onerror = (evt) => {};
    this.onupdate = (evt) => {};
    this._dispatchUpdate();
    navigator.mediaDevices.getUserMedia({ audio: true });
  }

  _dispatchError(e) {
    this.onerror(new ErrorEvent(Events.Error, {message: e, error: e}));
  }

  _dispatchUpdate() {
    getManyFromStorage([StorageRecordingKey, StorageListenedKey])
      .then(([blob, listened]) => {
        this.onupdate(new MessageEvent(Events.Update, {
          data: {
            hasRecording: blob != null,
            hasNewRecording: blob != null && !listened,
            isRecording: this._recorder != null,
          },
        }));
      })
      .catch(this._dispatchError.bind(this));
  }

  _markListened() {
    setToStorage(StorageListenedKey, true);
    this._dispatchUpdate();
  }

  async _saveRecordingData(blob) {
    setToStorage(StorageRecordingKey, blob);
    setToStorage(StorageListenedKey, false);
    await this.play();
    this._dispatchUpdate();
  }

  _recordStream(stream) {
    this._recorder = new MediaRecorder(stream);
    // 'start' event doesn't work in iOS 12 afaict, but 'stop' and 'dataavailable' do
    this._recorder.addEventListener('dataavailable', (event) => this._saveRecordingData(event.data).catch(this._dispatchError.bind(this)));
    this._dispatchUpdate();
    this._recorder.start();
  }

  startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => this._recordStream(stream))
      .catch(this._dispatchError.bind(this));
  }

  stopRecording() {
    if (this._recorder) {
      this._recorder.stop();
      this._recorder = null;
    }
    this._dispatchUpdate();
  }

  async playAndMarkListened() {
    await this.play();
    this._markListened();
  }

  async play() {
    // Can't play on a new page load on iOS 12 without requesting audio access first
    // (even though this should just be for the mic).
    await navigator.mediaDevices.getUserMedia({ audio: true });
    // Support old iOS
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const blob = await getFromStorage(StorageRecordingKey);
    // This would be simpler in a more modern browser:
    //
    // const buffer = await blob.arrayBuffer();
    // const decoded = await audioCtx.decodeAudioData(buffer);
    // ... use decoded ...
    //
    // But the old iOS 12 I'm targetting doesn't have either of those.
    const fr = new FileReader();
    fr.readAsArrayBuffer(blob);
    const buffer = await promisify(fr);
    audioCtx.decodeAudioData(buffer, function decodeAudioDataHandler(decoded) {
      // Play back the recording immediately.
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.connect(audioCtx.destination);
      source.start();
    });
  }
}
