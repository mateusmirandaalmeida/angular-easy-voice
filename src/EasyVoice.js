export default function EasyVoice($window, $timeout){
    $window.AudioContext = $window.AudioContext || $window.webkitAudioContext;
    const EasyVoice = {
        oninit: undefined,
        onstart: undefined,
        onuserphrase: undefined,
        onresult: undefined
    };

    let audioContext;

    if('AudioContext' in $window){
      audioContext = new AudioContext();
    }

    let recognition = undefined,
        inputPoint,
        realAudioInput,
        audioInput,
        analyserNode,
        speechRecognitionList,
        AudioStream,
        rafID,
        voice,
        voiceContainer,
        translate = {
            speakNow: 'Speak Now',
            notUnderstand : 'Not understand.',
            tryAgain : 'Try again.',
            checkMicrophone: 'Please, check your microphone.',
            listening: 'listening...'
        },
        buttonMicrophone,
        listening = false,
        autoClose = true,
        userKeyword,
        labelText,
        userConfiguration,
        userCallback,
        intervalListening = undefined,
        tryAgainInterval = undefined,
        interval = undefined,
        words = [],
        commands = [],
        parser = new DOMParser(),
        body = document.getElementsByTagName('body')[0],
        head = document.head || document.getElementsByTagName('head')[0],
        templateDOC;

    let template = `
        <div id="angular-easy-voice-container">
          <div style="margin-top: 10%;">
          <button class="" id="angular-easy-voice-microphone">
              <svg width="64" version="1.1" xmlns="http://www.w3.org/2000/svg" height="64" viewBox="0 0 64 64" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 64 64">
                <g>
                  <g fill="red">
                    <path d="m43.18,37.155v-25.458c0-6.236-5.074-11.311-11.311-11.311-6.237,0-11.312,5.074-11.312,11.311v25.458c0,6.237 5.074,11.312 11.312,11.312 6.236,0 11.311-5.074 11.311-11.312zm-18.598,0v-25.458c0-4.018 3.27-7.287 7.287-7.287 4.016,0 7.285,3.27 7.285,7.287v25.458c0,4.018-3.27,7.286-7.285,7.286-4.017,0-7.287-3.268-7.287-7.286z"/>
                    <path d="m31.869,64c1.111,0 2.011-0.9 2.011-2.012v-6.468c11.677-1.024 20.87-10.842 20.87-22.779 0-1.112-0.9-2.014-2.013-2.014s-2.013,0.901-2.013,2.014c0,10.397-8.457,18.855-18.855,18.855-10.399,0-18.857-8.458-18.857-18.855 0-1.112-0.9-2.014-2.012-2.014-1.113,0-2.014,0.901-2.014,2.014 0,11.938 9.192,21.755 20.87,22.779v6.469c-3.55271e-15,1.111 0.901,2.011 2.013,2.011z"/>
                  </g>
                </g>
              </svg>
          </div>
          <div style="margin-top: 2%;">
            <label id="angular-easy-voice-text"></label>
          </div>
        </div>
    `;

    let templateStyle = `

          #angular-easy-voice-container{
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              background: #fff;
              text-align: center;
              z-index: 99999;
          }

          #angular-easy-voice-microphone{
              background: transparent;
              border: 1px solid #ccc;
              border-radius: 62%;
              padding: 30px;
          }

          #angular-easy-voice-text{
              color: #777;
              font-weight: normal;
              font-family: arial,sans-serif;
              line-height: 1.2;
              transition: opacity .1s ease-in,margin-left .5s ease-in,top 0s linear 0.218s;
              font-size: 32px;
          }

    `;

    if (!navigator.getUserMedia)
        navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    if (!navigator.cancelAnimationFrame)
        navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    if (!navigator.requestAnimationFrame)
        navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;

    if(('SpeechSynthesisUtterance' in $window)){
      voice = new SpeechSynthesisUtterance();
      var voices = window.speechSynthesis.getVoices();
      // voice.voiceURI = 'Google português do Brasil'; //discovered after dumping getVoices()
      voice.lang = "en-US";
      voice.localService = true;
      voice.voice = voices[5];
    }

    if (('webkitSpeechRecognition' in $window)) {
        recognition = new webkitSpeechRecognition();
        templateDOC = parser.parseFromString(template, "text/html");
        voiceContainer = templateDOC.getElementById('angular-easy-voice-container');
        buttonMicrophone = voiceContainer.querySelector('#angular-easy-voice-microphone');
        const style = document.createElement('style');
        labelText = voiceContainer.querySelector('#angular-easy-voice-text');
        style.type = 'text/css';
        if (style.styleSheet) {
            style.styleSheet.cssText = templateStyle;
        } else {
            style.appendChild(document.createTextNode(templateStyle));
        }

        head.appendChild(style);
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        voiceContainer.style.display="none";
        body.appendChild(voiceContainer);

        recognition.onresult = event => {

            if(interval != undefined){
                $timeout.cancel(interval);
                interval = undefined;
            }

            if(intervalListening != undefined){
                $timeout.cancel(intervalListening);
                intervalListening = undefined;
            }

            if(tryAgainInterval != undefined){
                $timeout.cancel(tryAgainInterval);
                tryAgainInterval = undefined;
            }

            interval = $timeout(() => {
                labelText.innerHTML = translate.notUnderstand+'  '
                var tryAgain = document.createElement('a');
                tryAgain.style.fontWeight = '500';
                tryAgain.style.cursor = 'pointer';
                tryAgain.style.fontSize = '18px';
                tryAgain.style.color = '#1155cc';
                tryAgain.innerHTML = translate.tryAgain;
                tryAgain.onclick = (evt) => {
                    EasyVoice.startListening();
                    evt.stopPropagation();
                }
                tryAgainInterval = $timeout(()=>{
                  EasyVoice.stopListening();
                }, 3000);
                if(labelText.querySelector('#try-again') != null){
                    labelText.removeChild(tryAgain);
                }
                labelText.appendChild(tryAgain);
            }, 5000);

            for (var i = event.resultIndex; i < event.results.length; ++i) {
                var transcript = event.results[i][0].transcript;
                if(event.results[i][0].confidence < 0.9 && event.results[i].isFinal){
                    transcript.split(" ").forEach(function(text){
                      var distances = [];
                      words.forEach(word=>{
                          distances.push({word: word, distance: EasyVoice.similarText(word, text)});
                      })
                      distances = distances.sort(function(a, b){return b.distance - a.distance;})
                      if(distances.length > 0 && distances[0].distance >= 3){
                          transcript = transcript.replace(new RegExp(text, 'g'), distances[0].word);
                      }
                    })
                }

                labelText.innerHTML = transcript;

                if((userCallback && typeof userCallback == 'function')
                    && event.results[i].isFinal
                    && listening){
                    userCallback(transcript);
                }
                if(userConfiguration.debug && event.results[i].isFinal){
                    console.info('Debug: ' + transcript);
                }
                if(userKeyword && userKeyword.trim().toLowerCase() == transcript.trim().toLowerCase() && !listening && event.results[i].isFinal){
                    $timeout(()=>{
                        EasyVoice.startListening();
                    });
                }
                if(listening && event.results[i].isFinal){
                    commands.forEach(command => {
                        if(((command.key && command.callback) && command.watchStart && transcript.toLowerCase().startsWith(command.key.toLowerCase()))
                        || ((command.key && command.callback) && transcript.toLowerCase() == command.key.toLowerCase())){
                              if(command.close){
                                  EasyVoice.stopListening();
                              }
                              command.callback(transcript);
                        }
                    });
                }

                if(EasyVoice.onresult && typeof EasyVoice.onresult == 'function' && listening && event.results[i].isFinal && transcript != userKeyword){
                    if(interval != undefined){
                        $timeout.cancel(interval);
                        interval = undefined;
                    }
                    tryAgainInterval = $timeout(()=>{
                      EasyVoice.stopListening();
                    }, 3000);
                    EasyVoice.onresult(transcript);
                }

                if(EasyVoice.onuserphrase && typeof EasyVoice.onuserphrase == 'function' && event.results[i].isFinal && transcript != userKeyword){
                    if(interval != undefined){
                        $timeout.cancel(interval);
                        interval = undefined;
                    }
                    tryAgainInterval = $timeout(()=>{
                      EasyVoice.stopListening();
                    }, 3000);
                    EasyVoice.onuserphrase(transcript);
                }

            }
        }

        recognition.onerror = (error) => {
            if(error.error == 'aborted'){
              autoClose = false;
              EasyVoice.stopWatch();
              voiceContainer.onclick = () => {
                  voiceContainer.style.display="none";
                  return;
              }
              labelText.innerHTML = translate.checkMicrophone;
              voiceContainer.style.display="block";
            }
        }

        recognition.onend = () => {
            if(autoClose){
                this.initRecognition();
            }
        }

    }

    EasyVoice.setTranslate = userTranslate => {
        if(typeof userTranslate != 'object'){
            throw "Translation needs to be an object.";
        }
        Object.keys(userTranslate).forEach(function(key){
            if(translate[key]){
                translate[key] = userTranslate[key];
            }
        });
    }

    EasyVoice.startListening = () => {
        $timeout(()=>{
            if(tryAgainInterval != undefined){
                $timeout.cancel(tryAgainInterval);
                tryAgainInterval = undefined;
            }
            labelText.innerHTML = translate.speakNow;
            listening = true;
            if(body.querySelector('#angular-easy-voice-container') != null){
                voiceContainer.style.display="none";
            }
            voiceContainer.onclick = () => {
                EasyVoice.stopListening();
                return;
            }
            intervalListening = $timeout(()=>{
                labelText.innerHTML = translate.listening;
            }, 3000);
            if(EasyVoice.onstart && typeof EasyVoice.onstart == 'function'){
                EasyVoice.onstart();
            }
            voiceContainer.style.display="block";
        });
    }

    EasyVoice.stopListening = () => {
        listening = false;
        if(body.querySelector('#angular-easy-voice-container') != null){
            voiceContainer.style.display="none";
        }
    }

    EasyVoice.getCommands = () => {
        return commands;
    }

    EasyVoice.isRunning = () => {
        return AudioStream == undefined ? false: true;
    }

    EasyVoice.initWatch = (keyword, configurations, initListening) => {
        if (!('webkitSpeechRecognition' in $window)) {
           throw "Sorry, this feature is only for Google Chrome.";
        }
        if(!keyword){
           throw "Please enter the key phrase.";
        }
        if(userKeyword){
          throw "Sorry, start only once.";
        }
        if(!('AudioContext' in $window)){
          throw "Sorry, not AudioContext.";
        }
        userConfiguration = configurations;
        userKeyword = keyword;
        // userCallback = callback;
        this.initRecognition(initListening);
    }

    EasyVoice.reproduce = (str, lang) => {
        voice.lang = lang || (userConfiguration&& userConfiguration.lang
          ? userConfiguration.lang : 'en-US');
        voice.text = str;
        speechSynthesis.speak(voice);
    }

    EasyVoice.stopWatch = () => {
        if (!('webkitSpeechRecognition' in $window)) {
           throw "Sorry, this feature is only for Google Chrome.";
        }
        if(recognition != undefined){
            userConfiguration = undefined;
            userKeyword = undefined;
            autoClose = false;
            listening = false;
            recognition.stop();
        }
        if (AudioStream != undefined) {
            AudioStream.getAudioTracks().forEach(function (stream) {
                stream.stop();
            });
            AudioStream.getTracks().forEach(function (stream) {
                stream.stop();
            });
            if(AudioStream.stop){
                AudioStream.stop();
            }
        }
        if (rafID != null) {
            $window.cancelAnimationFrame(rafID);
        }

        AudioStream = undefined;
    }

    EasyVoice.addWord = word => {
        if(!word || (typeof word != 'string' && typeof word != 'object')){
            throw "Please, check your word.";
        }
        if(typeof word == 'string'){
            words.push(word);
        }
        if(typeof word == 'object'){
            words = words.concat(word);
        }
    }

    EasyVoice.addCommand = (key, callback, close, watchStart) => {
        if(commands.filter(command => {
            return command.key == key;
        }).length > 0){
              throw "A command with this key already exists";
        }
        if(!key || typeof key != 'string' || !callback || typeof callback != 'function'){
            throw "Please enter a phrase and one function.";
        }
        if(close == undefined || typeof close != 'boolean'){
            close = true;
        }
        if(watchStart == undefined || typeof watchStart != 'boolean'){
            watchStart = false;
        }
        commands.push({key: key, callback: callback, close: close, watchStart: watchStart});
    };

    EasyVoice.addCommandStartingWith = (key, callback, close) => {
        EasyVoice.addCommand(key, callback, close, true);
    }

    this.updateAnalysers = () => {
      if(listening){
        var freqByteData = new Uint8Array(analyserNode.frequencyBinCount);
        analyserNode.getByteFrequencyData(freqByteData);

        var multiplier = analyserNode.frequencyBinCount / 10;
        for (var i = 0; i < 10; ++i) {
            var magnitude = 0;
            var offset = Math.floor(i * multiplier);
            for (var j = 0; j < multiplier; j++){
              magnitude += freqByteData[offset + j];
            }
            magnitude = magnitude / multiplier;
            if(i == 4){
                if(listening){
                    buttonMicrophone.style.boxShadow = '0px 0px 13px '+Math.round(magnitude-5)+'px #ddd';
                }else{
                    buttonMicrophone.style.boxShadow = '0px 0px 13px 0px #ddd';
                }
            }
        }

      }
      rafID = $window.requestAnimationFrame(this.updateAnalysers);
    }

    this.stream = stream => {
        AudioStream = stream;
        inputPoint = audioContext.createGain();
        realAudioInput = audioContext.createMediaStreamSource(stream);
        audioInput = realAudioInput;
        audioInput.connect(inputPoint);
        analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 2048;
        inputPoint.connect(analyserNode);
        this.updateAnalysers();
    }

    this.initRecognition = (initListening) => {
        if(userConfiguration){
            angular.extend(recognition, userConfiguration);
        }
        autoClose = true;
        if(AudioStream == undefined){
            navigator.getUserMedia(
                {
                    "audio": {
                        "mandatory": {
                            "googEchoCancellation": "false",
                            "googAutoGainControl": "false",
                            "googNoiseSuppression": "false",
                            "googHighpassFilter": "false"
                        },
                        "optional": []
                    },
                }, this.stream, function (e) {
                  throw "Please, check your microphone.";
            });
        }

      recognition.start();

      if(EasyVoice.oninit && typeof EasyVoice.oninit == 'function'){
          EasyVoice.oninit();
      }

      if(initListening){
          EasyVoice.startListening();
      }

    }

    EasyVoice.similarText = (first, second, percent) => { // eslint-disable-line camelcase
          // original by: Rafał Kukawski (http://blog.kukawski.pl)
          // bugfixed by: Chris McMacken
          // bugfixed by: Jarkko Rantavuori original by findings in stackoverflow (http://stackoverflow.com/questions/14136349/how-does-similar-text-work)
          // improved by: Markus Padourek (taken from http://www.kevinhq.com/2012/06/php-similartext-function-in-javascript_16.html)
          if (first === null ||
            second === null ||
            typeof first === 'undefined' ||
            typeof second === 'undefined') {
            return 0
          }

          first += ''
          second += ''

          var pos1 = 0
          var pos2 = 0
          var max = 0
          var firstLength = first.length
          var secondLength = second.length
          var p
          var q
          var l
          var sum

          for (p = 0; p < firstLength; p++) {
            for (q = 0; q < secondLength; q++) {
              for (l = 0; (p + l < firstLength) && (q + l < secondLength) && (first.charAt(p + l) === second.charAt(q + l)); l++) {
                // eslint-disable-line max-len
                // @todo: ^-- break up this crazy for loop and put the logic in its body
              }
              if (l > max) {
                max = l
                pos1 = p
                pos2 = q
              }
            }
          }

          sum = max

          if (sum) {
            if (pos1 && pos2) {
              sum += EasyVoice.similarText(first.substr(0, pos1), second.substr(0, pos2))
            }

            if ((pos1 + max < firstLength) && (pos2 + max < secondLength)) {
              sum += EasyVoice.similarText(
                first.substr(pos1 + max, firstLength - pos1 - max),
                second.substr(pos2 + max,
                secondLength - pos2 - max))
            }
          }

          if (!percent) {
            return sum
          }

          return (sum * 200) / (firstLength + secondLength)
    }

    return EasyVoice;
}


EasyVoice.$inject = ['$window', '$timeout'];
