import createHoldButton from './hold-button.js';

function disableButton(elBtn, flag) {
  elBtn.ariaDisabled = flag;
  elBtn.disabled = flag;
  if (flag) {
    elBtn.setAttribute("disabled", "disabled");
  } else {
    elBtn.removeAttribute("disabled");
  }
}

import { Recorder, Events as recorderEvents } from './recorder.js';
export default async function init(elBtnRecord, elBtnPlay, elBtnPreview, elErrorOutput) {
  createHoldButton(document.querySelector('#btn-record'));
  const recorder = new Recorder;

  recorder.addEventListener(recorderEvents.Update, (evt) => {
    disableButton(elBtnPlay, !evt.data.hasRecording || evt.data.isRecording);
    disableButton(elBtnPreview, !evt.data.hasRecording || evt.data.isRecording);
    disableButton(elBtnRecord, evt.data.isRecording);
    elBtnPlay.classList.toggle("new-recording", evt.data.hasNewRecording);
  });
  recorder.addEventListener(recorderEvents.Error, (evt) => {
    const err = evt.error;
    console.log(err);
    elErrorOutput.innerHTML = err + "<br>" + JSON.stringify(err);
  });

  elBtnPlay.addEventListener('click', () => recorder.playAndMarkListened());
  elBtnPreview.addEventListener('click', () => recorder.play());
  elBtnRecord.addEventListener('click', () => recorder.startRecording());
}


