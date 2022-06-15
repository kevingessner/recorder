# Recorder

## 2022-06-15

Recorder is an app for leaving voice messages IRL.
Running on a mounted mobile device, you can record a message that will be stored locally.
Play it at the push of a button, with a clear sign when a new message is available.

Implemented as a single-page web app.
Can record a message from the local mic and replay it over speakers.
No persistence yet; Play button is a noop.


- https://github.com/mdn/webaudio-examples/blob/master/offline-audio-context/index.html
    - how to use decodeAudioData and play audio
- https://github.com/mdn/voice-change-o-matic/blob/gh-pages/scripts/app.js
- https://github.com/samdutton/simpl/blob/gh-pages/mediarecorder/audio-only/js/main.js
    - has play and download features, data URLs
