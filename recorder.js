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
    // Can't inherit from EventTarget in iOS 12.
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

  async _dispatchUpdate() {
    await getManyFromStorage([StorageRecordingKey, StorageListenedKey])
      .then(([blob, listened]) => {
        this.onupdate(new MessageEvent(Events.Update, {
          data: {
            hasRecording: blob != null,
            hasNewRecording: blob != null && !listened,
            isRecording: this._recorder != null || this._startingRecording,
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
    this._startingRecording = false;
    this._dispatchUpdate();
    // 'start' event doesn't work in iOS 12 afaict, but 'stop' and 'dataavailable' do
    this._recorder.addEventListener('dataavailable', (event) => this._saveRecordingData(event.data).catch(this._dispatchError.bind(this)));
    this._recorder.start();
  }

  startRecording() {
    // Flag to make sure the UI says 'recording' while initializing the recorder
    this._startingRecording = true;
    this._dispatchUpdate();
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
    const blob = await getFromStorage(StorageRecordingKey);
    // This would be simpler in a more modern browser:
    //
    // const buffer = await blob.arrayBuffer();
    // const decoded = await this._audioCtx.decodeAudioData(buffer);
    // ... use decoded ...
    //
    // But the old iOS 12 I'm targetting doesn't have either of those.
    const fr = new FileReader();
    fr.readAsArrayBuffer(blob);
    const buffer = await promisify(fr);

    // Support old iOS prefixed name
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    // NB: there is a limit on the number of AudioContexts on a page, so reuse the same one.
    this._audioCtx = this._audioCtx || new AudioContext();

    this._audioCtx.decodeAudioData(buffer, (function decodeAudioDataHandler(decoded) {
      try {
        // Play back the recording immediately.
        const source = this._audioCtx.createBufferSource();
        source.buffer = decoded;
        source.connect(this._audioCtx.destination);
        source.start();
      } catch (e) {
        this._dispatchError(e);
      }
    }).bind(this));
  }
}
