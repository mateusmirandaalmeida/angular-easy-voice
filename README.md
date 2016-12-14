# Angular Easy Voice

Is a voice command library.

## Installation
```
bower install angular-easy-voice --save
```

## Add dependencies to the <head> section of your main html:
```
<script src="bower_components/angular-easy-voice/dist/EasyVoice.min.js"></script>
```

## Add module
```
MODULE NAME: 'angular-easy-voice';

angular.module('myApp', ['angular-easy-voice'])
       .controller('myCtrl', function('$scope', EasyVoice){
              console.log(EasyVoice);
         });
```
## Basic usage
```
// The first parameter is the phrase that will turn on the voice command.
EasyVoice.initWatch('Ok Google', {
    lang: 'pt-BR', // language is optional, default: 'en-US'
    debug: false // Shows the user's speech
}, function(resp){
    console.log(resp);
});
```
## Stop
```
EasyVoice.stopWatch();
```
## Example Simple Command
```
EasyVoice.addCommand('hello', function(){
    console.log('hello my friend!');
});
```
##Example Start-based command
```
//Command will be executed when the user phrase starts with "Search people"
EasyVoice.addCommandStartingWith('Search people', function(text){
    console.log(text) // Whole text
});
```
## Example Speech
```
  //The first parameter is speech, The second parameter is the language
  // language is optional, default: 'en-US'
  EasyVoice.reproduce('Hello my friend.', 'en-US');
```

#Add words
```
  EasyVoice.addWord("Gumga");  // or ["Gumga", "Other"]
```
## Installation of dependencies for use or development
```
npm install
```
## Tasks
Run the task 'npm run dev' for the development.
Run the task 'npm run prod' generating the minified file.
