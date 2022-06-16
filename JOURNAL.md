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

## 2022-06-16

Has persistence now to IndexedDB.

Working on iOS 12 on iPhone 6 now. Requires MediaRecorder to be enabled in Safari > Advanced > Experimental settings.
And needed some small tweaks for missing APIs.

`python simple-https-server.py` serves the local directory on HTTPS with a self-signed cert `server.pem`,
generated with `openssl req -new -x509 -keyout server.pem -out server.pem -days 365 -nodes`.

- https://github.com/eligrey/Blob.js
