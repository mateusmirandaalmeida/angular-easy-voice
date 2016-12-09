export default function EasyVoice($window, $timeout){
    const EasyVoice = {};
    let recognition = undefined,
        listening = false,
        autoClose = true,
        userKeyword,
        userConfiguration,
        userCallback,
        interval = undefined,
        commands = [],
        parser = new DOMParser(),
        body = document.getElementsByTagName('body')[0],
        head = document.head || document.getElementsByTagName('head')[0],
        templateDOC;

    let template = `
        <div style="position: absolute;left: 0;top: 0;width: 100%;height: 100%;background: #fff;text-align: center;"
          id="angular-easy-voice-container">
          <div style="margin-top: 10%;">
            <button class="blink" style="background: transparent;border: 1px solid #ccc;border-radius: 62%;padding: 30px;" id="angular-easy-voice-microphone">
              <svg width="64" version="1.1" xmlns="http://www.w3.org/2000/svg" height="64" viewBox="0 0 64 64" xmlns:xlink="http://www.w3.org/1999/xlink" enable-background="new 0 0 64 64">
                <g>
                  <g fill="red">
                    <path d="m43.18,37.155v-25.458c0-6.236-5.074-11.311-11.311-11.311-6.237,0-11.312,5.074-11.312,11.311v25.458c0,6.237 5.074,11.312 11.312,11.312 6.236,0 11.311-5.074 11.311-11.312zm-18.598,0v-25.458c0-4.018 3.27-7.287 7.287-7.287 4.016,0 7.285,3.27 7.285,7.287v25.458c0,4.018-3.27,7.286-7.285,7.286-4.017,0-7.287-3.268-7.287-7.286z"/>
                    <path d="m31.869,64c1.111,0 2.011-0.9 2.011-2.012v-6.468c11.677-1.024 20.87-10.842 20.87-22.779 0-1.112-0.9-2.014-2.013-2.014s-2.013,0.901-2.013,2.014c0,10.397-8.457,18.855-18.855,18.855-10.399,0-18.857-8.458-18.857-18.855 0-1.112-0.9-2.014-2.012-2.014-1.113,0-2.014,0.901-2.014,2.014 0,11.938 9.192,21.755 20.87,22.779v6.469c-3.55271e-15,1.111 0.901,2.011 2.013,2.011z"/>
                  </g>
                </g>
              </svg>
            </button>
          </div>
        </div>
    `;

    let templateStyle = `
          @keyframes blink {
            0% { box-shadow: 0px 0px 10px 1px #ccc; }
            50% { box-shadow: 0px 0px 13px 10px #ccc; }
            100% { box-shadow: 0px 0px 10px 1px #ccc; }
          }

          @-webkit-keyframes blink {
            0% { box-shadow: 0px 0px 10px 1px #ccc; }
            50% { box-shadow: 0px 0px 13px 10px #ccc; }
            100% { box-shadow: 0px 0px 10px 1px #ccc; }
          }

          .blink {
            -webkit-animation: blink 1.0s linear infinite;
            -moz-animation: blink 1.0s linear infinite;
            -ms-animation: blink 1.0s linear infinite;
            -o-animation: blink 1.0s linear infinite;
            animation: blink 1.0s linear infinite;
          }
    `;

    if (('webkitSpeechRecognition' in $window)) {
        recognition = new webkitSpeechRecognition();
        templateDOC = parser.parseFromString(template, "text/html");
        const element = templateDOC.getElementById('angular-easy-voice-container');
        const style = document.createElement('style');
        style.type = 'text/css';
        if (style.styleSheet){
            style.styleSheet.cssText = templateStyle;
        } else {
            style.appendChild(document.createTextNode(templateStyle));
        }
        head.appendChild(style);
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = event => {

            if(interval != undefined){
                $timeout.cancel(interval);
                interval = undefined;
            }

            interval = $timeout(() => {
                listening = false;
                if(body.querySelector('#angular-easy-voice-container') != null){
                    body.removeChild(element);
                }
            }, 5000);

            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if((userCallback && typeof userCallback == 'function') && event.results[i].isFinal){
                    userCallback(event.results[i][0].transcript);
                }
                if(userConfiguration.debug && event.results[i].isFinal){
                    console.info('Debug: ' + event.results[i][0].transcript);
                }
                if(listening && event.results[i].isFinal){
                    commands.forEach(command => {
                        if((command.key && command.callback) && event.results[i][0].transcript == command.key){
                            if(command.close){
                                listening = false;
                                if(body.querySelector('#angular-easy-voice-container') != null){
                                    body.removeChild(element);
                                }
                            }
                            command.callback();
                            return;
                        }
                    });
                }
                if(userKeyword.trim() == event.results[i][0].transcript.trim() && !listening && event.results[i].isFinal){
                    listening = true;
                    if(body.querySelector('#angular-easy-voice-container') != null){
                        body.removeChild(element);
                    }
                    element.onclick = () => {
                        listening = false;
                        body.removeChild(element);
                        return;
                    }
                    body.appendChild(element);
                }
            }
        }

        recognition.onend = () => {
            if(autoClose){
                this.initRecognition();
            }
        }

    }

    EasyVoice.initWatch = (keyword, configurations, callback) => {
        if (!('webkitSpeechRecognition' in $window)) {
           throw "Sorry, this feature is only for Google Chrome.";
        }
        if(!keyword){
           throw "Please enter the key phrase.";
        }
        if(userKeyword){
          throw "Sorry, start only once.";
        }
        userConfiguration = configurations;
        userKeyword = keyword;
        userCallback = callback;
        this.initRecognition();
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
    }

    EasyVoice.addCommand = (key, callback, close) => {
        if(commands.filter(command => {
            return command.key == key;
        }).length > 0){
              throw "A command with this key already exists";
        }
        if(!key || typeof key != 'string' || !callback || typeof callback != 'function'){
            throw "Please enter a phrase and one function.";
        }
        if(close == undefined || close != 'boolean'){
            close = true;
        }
        commands.push({key: key, callback: callback, close: close});
    };

    this.initRecognition = () => {
        if(userConfiguration){
            angular.extend(recognition, userConfiguration);
        }
        autoClose = true;
        recognition.start();
    }

    return EasyVoice;
}

EasyVoice.$inject = ['$window', '$timeout'];
