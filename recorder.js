import { get as getFromStorage, set as setToStorage } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';

export default function init(elBtnRecord, elBtnPlay, elErrorOutput) {
  const StorageKey = 'recorder.recording';

  const state = {
    hasRecording: false,
    isRecording: false,
  };
  Object.seal(state);
  function _disableButton(elBtn, flag) {
    elBtn.ariaDisabled = flag;
    elBtn.disabled = flag;
    if (flag) {
      elBtn.setAttribute("disabled", "disabled");
    } else {
      elBtn.removeAttribute("disabled");
    }
  }
  function updateUIFromState() {
    _disableButton(elBtnPlay, !state.hasRecording || state.isRecording);
    _disableButton(elBtnRecord, state.isRecording);
  }

  function logError(err) {
    console.log(err);
    elErrorOutput.innerHTML = err + "<br>" + JSON.stringify(err);
  }

  function handleErrors(fn) {
    return function withErrorHandling() {
      try {
        const res = fn(...arguments);
        if (res && res.catch) {
          res.catch(logError);
        }
        return res;
      } catch (e) {
        logError(e);
      }
    };
  }

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

  async function playFromStorage() {
    // Support old iOS
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioContext();
    const blob = await getFromStorage(StorageKey);
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

  async function saveRecordingData(blob) {
    setToStorage(StorageKey, blob);
    state.hasRecording = true;
    updateUIFromState();
    await playFromStorage();
  }

  function recordStream(stream) {
    const recorder = new MediaRecorder(stream);
    recorder.addEventListener('dataavailable', handleErrors((event) => saveRecordingData(event.data)));
    recorder.addEventListener('start', handleErrors(() => {
      state.isRecording = true;
      updateUIFromState();
    }));
    recorder.addEventListener('stop', handleErrors(() => {
      state.isRecording = false;
      updateUIFromState();
    }));
    setTimeout(() => recorder.stop(), 2000);
    recorder.start();
  }

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => recordStream(stream))
      .catch(logError);
  }

  elBtnRecord.addEventListener('click', handleErrors((event) => startRecording()));
  elBtnPlay.addEventListener('click', handleErrors((event) => playFromStorage()));

  getFromStorage(StorageKey)
    .then((blob) => {
      state.hasRecording = blob != null;
      updateUIFromState();
    })
    .catch(logError)
}
